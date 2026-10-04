import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  SurgicalModule,
  InstrumentType,
  FootPedalPosition,
  PhacoNucleusState,
  CapsulorhexisState,
  IolPositionState,
  YagCapsulotomyState,
  MigsState
} from '../types/ophthalmic';

export type CameraPresetType = 'microscope' | 'glaucoma_angle' | 'cataract_core' | 'yag_capsule' | 'cross_section';

export interface ThreeEyeSceneConfig {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  onPointerAction?: (x: number, y: number, isDown: boolean) => void;
}

export class ThreeEyeScene {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  // Lighting
  private coaxialLight: THREE.PointLight;
  private obliqueLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Eye Anatomy Meshes
  private eyeGroup: THREE.Group;
  private scleraMesh: THREE.Mesh;
  private corneaMesh: THREE.Mesh;
  private irisMesh: THREE.Mesh;
  private pupilMesh: THREE.Mesh;

  // Glaucoma / Trabecular Meshwork Angle Meshes
  private angleGroup: THREE.Group;
  private schwalbeLineMesh: THREE.Mesh;
  private trabecularMeshworkMesh: THREE.Mesh;
  private schlemmCanalMesh: THREE.Mesh;
  private scleralSpurMesh: THREE.Mesh;
  private ciliaryBodyMesh: THREE.Mesh;
  private stent1Group: THREE.Group;
  private stent2Group: THREE.Group;
  private bloodRefluxParticles: THREE.Points;
  private gonioprismMesh: THREE.Mesh;

  // Cataract / Phaco Meshes
  private lensGroup: THREE.Group;
  private anteriorCapsuleMesh: THREE.Mesh;
  private capsulorhexisRimMesh: THREE.LineLoop;
  private nucleusMesh: THREE.Mesh;
  private nucleusQuadrants: THREE.Mesh[] = [];
  private cortexMesh: THREE.Mesh;
  private phacoCavitationParticles: THREE.Points;

  // IOL Meshes
  private iolGroup: THREE.Group;
  private iolOpticMesh: THREE.Mesh;
  private iolHapticLeading: THREE.Mesh;
  private iolHapticTrailing: THREE.Mesh;

  // Nd:YAG Posterior Capsule & Laser Meshes
  private yagGroup: THREE.Group;
  private posteriorCapsuleMesh: THREE.Mesh;
  private yagAimingCone1: THREE.Line;
  private yagAimingCone2: THREE.Line;
  private yagFocalDot: THREE.Mesh;
  private yagPlasmaSpark: THREE.Mesh;
  private yagTearLines: THREE.LineSegments;

  // 3D Instruments
  private instrumentGroup: THREE.Group;
  private currentInstrumentType: InstrumentType | null = null;
  private instrumentMeshes: Map<InstrumentType, THREE.Object3D> = new Map();

  // Animation & Camera Transition
  private animFrameId: number = 0;
  private isDestroyed: boolean = false;
  private targetCamPos: THREE.Vector3 = new THREE.Vector3(0, 0, 8.5);
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isTransitioningCamera: boolean = false;
  private transitionAlpha: number = 1.0;

  // State caches
  private currentModule: SurgicalModule = 'phaco';
  private mouseNorm: { x: number; y: number; isDown: boolean } = { x: 0, y: 0, isDown: false };
  private currentMagnification: number = 12;

  constructor(config: ThreeEyeSceneConfig) {
    this.container = config.container;
    this.canvas = config.canvas;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // 1. Initialize Scene, Camera & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 100);
    this.camera.position.set(0, 0, 8.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. OrbitControls
    this.controls = new OrbitControls(this.camera, this.container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.0; // Allow extreme close-up deep zoom into trabecular meshwork & stents
    this.controls.maxDistance = 16.0;
    this.controls.maxPolarAngle = Math.PI * 0.88; // Allow tilting to view angle and cross section
    this.controls.target.set(0, 0, 0);

    // 3. Lighting System
    this.ambientLight = new THREE.AmbientLight(0x223040, 0.9);
    this.scene.add(this.ambientLight);

    this.coaxialLight = new THREE.PointLight(0xffeedd, 3.2, 30);
    this.coaxialLight.position.set(0, 0, 7.5);
    this.scene.add(this.coaxialLight);

    this.obliqueLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.obliqueLight.position.set(3, 4, 6);
    this.scene.add(this.obliqueLight);

    // 4. Build Eye Anatomy
    this.eyeGroup = new THREE.Group();
    this.scene.add(this.eyeGroup);

    this.scleraMesh = this.buildScleraGlobe();
    this.eyeGroup.add(this.scleraMesh);

    this.corneaMesh = this.buildCorneaDome();
    this.eyeGroup.add(this.corneaMesh);

    this.irisMesh = this.buildIris();
    this.eyeGroup.add(this.irisMesh);

    this.pupilMesh = this.buildPupil();
    this.eyeGroup.add(this.pupilMesh);

    // Glaucoma & Trabecular Meshwork Angle
    this.angleGroup = new THREE.Group();
    this.eyeGroup.add(this.angleGroup);
    this.buildTrabecularMeshworkAngle();

    // Cataract & Lens Nucleus
    this.lensGroup = new THREE.Group();
    this.eyeGroup.add(this.lensGroup);
    this.buildCataractLens();

    // Foldable IOL
    this.iolGroup = new THREE.Group();
    this.eyeGroup.add(this.iolGroup);
    this.buildFoldableIol();

    // Nd:YAG Posterior Capsule & Laser
    this.yagGroup = new THREE.Group();
    this.eyeGroup.add(this.yagGroup);
    this.buildYagPosteriorCapsule();

    // 3D Instruments
    this.instrumentGroup = new THREE.Group();
    this.scene.add(this.instrumentGroup);
    this.build3DInstruments();

    // 5. Setup Resize Listener & Animation Loop
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  // =========================================================================
  // ANATOMICAL BUILDERS
  // =========================================================================

  private buildScleraGlobe(): THREE.Mesh {
    // 3D Scleral Shell with Limbal Transition
    const geo = new THREE.SphereGeometry(4.6, 64, 48, 0, Math.PI * 2, Math.PI * 0.28, Math.PI * 0.72);
    
    // Procedural scleral vascular texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f0f3f6';
    ctx.fillRect(0, 0, 512, 512);

    // Micro episcleral vessels
    ctx.strokeStyle = 'rgba(215, 60, 50, 0.4)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 4; j++) {
        cx += (Math.random() - 0.5) * 60;
        cy += (Math.random() - 0.5) * 60;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI;
    mesh.position.z = -1.2;
    return mesh;
  }

  private buildCorneaDome(): THREE.Mesh {
    // 3D Refractive Cornea Dome (Meniscus thickness scaled to pachymetry)
    const geo = new THREE.SphereGeometry(3.6, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.35);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.04,
      metalness: 0.05,
      transmission: 0.94,
      ior: 1.376,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = 0.55;
    return mesh;
  }

  private buildIris(): THREE.Mesh {
    // 3D Iris Diaphragm sloping gently back into the anterior chamber
    const geo = new THREE.ConeGeometry(3.45, 0.45, 64, 8, true);
    
    // Rich procedural blue-amber ophthalmic iris pattern
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(512, 512, 180, 512, 512, 512);
    grad.addColorStop(0, '#0d2235'); // Pupillary margin sphincter
    grad.addColorStop(0.2, '#184b73');
    grad.addColorStop(0.5, '#22699e'); // Collarette
    grad.addColorStop(0.85, '#154163');
    grad.addColorStop(1, '#091c2b'); // Iris root at ciliary body
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Radial trabecular fibers & Fuchs crypts
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.8;
    for (let a = 0; a < 360; a += 1.0) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(512 + Math.cos(rad) * 190, 512 + Math.sin(rad) * 190);
      ctx.lineTo(512 + Math.cos(rad) * 490, 512 + Math.sin(rad) * 490);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.65,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI;
    mesh.position.z = -0.15;
    return mesh;
  }

  private buildPupil(): THREE.Mesh {
    const geo = new THREE.CircleGeometry(2.35, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc8260c, // Coaxial red reflex glow
      transparent: true,
      opacity: 0.92
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -0.32;
    return mesh;
  }

  // =========================================================================
  // GLAUCOMA / MIGS TRABECULAR MESHWORK & ANGLE (3D ZOOMABLE)
  // =========================================================================

  private buildTrabecularMeshworkAngle(): void {
    // 1. Schwalbe's Line (Prominent anatomical white ridge at outer corneal boundary)
    const slGeo = new THREE.TorusGeometry(3.38, 0.045, 16, 64);
    const slMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      emissive: 0x444444
    });
    this.schwalbeLineMesh = new THREE.Mesh(slGeo, slMat);
    this.schwalbeLineMesh.position.z = 0.18;
    this.angleGroup.add(this.schwalbeLineMesh);

    // 2. Pigmented Trabecular Meshwork (TM) - Main filtration site
    const tmGeo = new THREE.CylinderGeometry(3.42, 3.48, 0.18, 64, 1, true);
    
    // Porous hyperpigmented texture for the TM filter bed
    const tmCanvas = document.createElement('canvas');
    tmCanvas.width = 512;
    tmCanvas.height = 64;
    const tmCtx = tmCanvas.getContext('2d')!;
    tmCtx.fillStyle = '#6b4822'; // Dark honey/brown pigment
    tmCtx.fillRect(0, 0, 512, 64);
    tmCtx.fillStyle = 'rgba(20, 10, 5, 0.7)';
    for (let i = 0; i < 600; i++) {
      tmCtx.fillRect(Math.random() * 512, Math.random() * 64, 2, 2);
    }
    const tmTex = new THREE.CanvasTexture(tmCanvas);
    tmTex.wrapS = THREE.RepeatWrapping;
    tmTex.repeat.set(8, 1);

    const tmMat = new THREE.MeshStandardMaterial({
      map: tmTex,
      roughness: 0.8,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    this.trabecularMeshworkMesh = new THREE.Mesh(tmGeo, tmMat);
    this.trabecularMeshworkMesh.rotation.x = Math.PI / 2;
    this.trabecularMeshworkMesh.position.z = 0.08;
    this.angleGroup.add(this.trabecularMeshworkMesh);

    // 3. Schlemm's Canal (Circumferential collector conduit located directly behind TM)
    const scGeo = new THREE.TorusGeometry(3.52, 0.07, 16, 64);
    const scMat = new THREE.MeshStandardMaterial({
      color: 0x882218, // Endothelial vascular channel
      roughness: 0.4,
      transparent: true,
      opacity: 0.82
    });
    this.schlemmCanalMesh = new THREE.Mesh(scGeo, scMat);
    this.schlemmCanalMesh.position.z = 0.06;
    this.angleGroup.add(this.schlemmCanalMesh);

    // 4. Scleral Spur (White fibrous band behind TM)
    const ssGeo = new THREE.TorusGeometry(3.46, 0.035, 16, 64);
    const ssMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.3
    });
    this.scleralSpurMesh = new THREE.Mesh(ssGeo, ssMat);
    this.scleralSpurMesh.position.z = -0.04;
    this.angleGroup.add(this.scleralSpurMesh);

    // 5. Ciliary Body Band (Slate grey/brown uveal band at iris root)
    const cbGeo = new THREE.CylinderGeometry(3.46, 3.44, 0.22, 64, 1, true);
    const cbMat = new THREE.MeshStandardMaterial({
      color: 0x3d3228,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    this.ciliaryBodyMesh = new THREE.Mesh(cbGeo, cbMat);
    this.ciliaryBodyMesh.rotation.x = Math.PI / 2;
    this.ciliaryBodyMesh.position.z = -0.16;
    this.angleGroup.add(this.ciliaryBodyMesh);

    // 6. Micro-Bypass Stents (iStent inject models in 3D)
    this.stent1Group = this.buildMicroStentModel('Stent 1 (2:30 Target)');
    this.stent2Group = this.buildMicroStentModel('Stent 2 (4:00 Target)');

    // Position Stent 1 at 2:30 (approx 75 degrees)
    const rad1 = (75 * Math.PI) / 180;
    this.stent1Group.position.set(Math.cos(rad1) * 3.44, Math.sin(rad1) * 3.44, 0.08);
    this.stent1Group.rotation.z = rad1 + Math.PI;
    this.stent1Group.rotation.y = -0.4;
    this.angleGroup.add(this.stent1Group);

    // Position Stent 2 at 4:00 (approx 120 degrees)
    const rad2 = (120 * Math.PI) / 180;
    this.stent2Group.position.set(Math.cos(rad2) * 3.44, Math.sin(rad2) * 3.44, 0.08);
    this.stent2Group.rotation.z = rad2 + Math.PI;
    this.stent2Group.rotation.y = -0.4;
    this.angleGroup.add(this.stent2Group);

    // 7. Venous Blood Reflux Particles (Welling up from Schlemm's canal & stent lumens)
    const pCount = 180;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const angle = (Math.random() * 0.8 + 1.1); // Nasal quadrant angle range
      const r = 3.42 + Math.random() * 0.12;
      pPos[i * 3] = Math.cos(angle) * r;
      pPos[i * 3 + 1] = Math.sin(angle) * r;
      pPos[i * 3 + 2] = 0.06 + Math.random() * 0.12;

      pVel[i * 3] = -Math.cos(angle) * 0.015;
      pVel[i * 3 + 1] = -Math.sin(angle) * 0.015;
      pVel[i * 3 + 2] = 0.008;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('velocity', new THREE.BufferAttribute(pVel, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xcc1111,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending
    });
    this.bloodRefluxParticles = new THREE.Points(pGeo, pMat);
    this.bloodRefluxParticles.visible = false;
    this.angleGroup.add(this.bloodRefluxParticles);

    // 8. Swan-Jacob Gonioprism Lens (38° clinical mirror)
    const gonioGeo = new THREE.CylinderGeometry(2.8, 3.2, 1.4, 32);
    const gonioMat = new THREE.MeshPhysicalMaterial({
      color: 0x99ddff,
      transparent: true,
      opacity: 0.38,
      roughness: 0.05,
      transmission: 0.9,
      ior: 1.52,
      clearcoat: 1.0
    });
    this.gonioprismMesh = new THREE.Mesh(gonioGeo, gonioMat);
    this.gonioprismMesh.position.set(0, 0, 1.35);
    this.gonioprismMesh.rotation.x = 0.65; // 38 degree surgical tilt
    this.gonioprismMesh.visible = false;
    this.eyeGroup.add(this.gonioprismMesh);
  }

  private buildMicroStentModel(name: string): THREE.Group {
    const grp = new THREE.Group();
    grp.name = name;

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xddddf0,
      metalness: 0.92,
      roughness: 0.22
    });

    // Stent Flanged Head (rests in anterior chamber)
    const headGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.08, 16);
    const headMesh = new THREE.Mesh(headGeo, metalMat);
    headMesh.rotation.z = Math.PI / 2;
    grp.add(headMesh);

    // Thorax / Shaft (spans trabecular meshwork)
    const bodyGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.24, 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, metalMat);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.position.x = 0.14;
    grp.add(bodyMesh);

    // Duckbill Outlet Tip (seats directly into Schlemm's canal)
    const tipGeo = new THREE.ConeGeometry(0.065, 0.12, 16);
    const tipMesh = new THREE.Mesh(tipGeo, metalMat);
    tipMesh.rotation.z = -Math.PI / 2;
    tipMesh.position.x = 0.31;
    grp.add(tipMesh);

    // Central Lumen hole indicator
    const lumenGeo = new THREE.CircleGeometry(0.04, 12);
    const lumenMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const lumenMesh = new THREE.Mesh(lumenGeo, lumenMat);
    lumenMesh.rotation.y = -Math.PI / 2;
    lumenMesh.position.x = -0.042;
    grp.add(lumenMesh);

    grp.scale.set(0.8, 0.8, 0.8);
    grp.visible = false;
    return grp;
  }

  // =========================================================================
  // CATARACT LENS & PHACOEMULSIFICATION (3D CORE & QUADRANTS)
  // =========================================================================

  private buildCataractLens(): void {
    // 1. Anterior Capsule
    const acGeo = new THREE.SphereGeometry(2.36, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const acMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.12,
      transmission: 0.88,
      side: THREE.DoubleSide
    });
    this.anteriorCapsuleMesh = new THREE.Mesh(acGeo, acMat);
    this.anteriorCapsuleMesh.position.z = -0.28;
    this.lensGroup.add(this.anteriorCapsuleMesh);

    // Capsulorhexis 5.5mm Tear Rim indicator
    const rimPoints: THREE.Vector3[] = [];
    const rRadius = 1.25;
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      rimPoints.push(new THREE.Vector3(Math.cos(th) * rRadius, Math.sin(th) * rRadius, -0.24));
    }
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
    const rimMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    this.capsulorhexisRimMesh = new THREE.LineLoop(rimGeo, rimMat);
    this.lensGroup.add(this.capsulorhexisRimMesh);

    // 2. Cataract Core (LOCS III NO3 Nuclear Cataract)
    const nGeo = new THREE.SphereGeometry(2.32, 48, 32);
    nGeo.scale(1, 1, 0.45);
    const nMat = new THREE.MeshStandardMaterial({
      color: 0xd99834, // Golden nuclear amber
      roughness: 0.55,
      metalness: 0.08,
      transparent: true,
      opacity: 0.92
    });
    this.nucleusMesh = new THREE.Mesh(nGeo, nMat);
    this.nucleusMesh.position.z = -0.55;
    this.lensGroup.add(this.nucleusMesh);

    // 4 Chopped Nuclear Quadrants for Phacoemulsification
    const quadOffsets = [
      { x: 0.45, y: 0.45, rotZ: 0 },
      { x: -0.45, y: 0.45, rotZ: Math.PI / 2 },
      { x: -0.45, y: -0.45, rotZ: Math.PI },
      { x: 0.45, y: -0.45, rotZ: -Math.PI / 2 }
    ];

    quadOffsets.forEach((q, idx) => {
      const qGeo = new THREE.CylinderGeometry(1.15, 0.2, 0.45, 16, 1, false, 0, Math.PI * 0.48);
      const qMat = new THREE.MeshStandardMaterial({
        color: 0xcc8d28,
        roughness: 0.6,
        transparent: true,
        opacity: 0.92
      });
      const qMesh = new THREE.Mesh(qGeo, qMat);
      qMesh.rotation.x = Math.PI / 2;
      qMesh.rotation.z = q.rotZ;
      qMesh.position.set(q.x, q.y, -0.55);
      qMesh.visible = false;
      this.nucleusQuadrants.push(qMesh);
      this.lensGroup.add(qMesh);
    });

    // 3. Cortex Fibers
    const cGeo = new THREE.RingGeometry(1.6, 2.34, 32);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedc,
      transparent: true,
      opacity: 0.45,
      roughness: 0.7
    });
    this.cortexMesh = new THREE.Mesh(cGeo, cMat);
    this.cortexMesh.position.z = -0.38;
    this.lensGroup.add(this.cortexMesh);

    // 4. Ultrasonic Cavitation Shockwave Particles
    const cavCount = 120;
    const cavGeo = new THREE.BufferGeometry();
    const cavPos = new Float32Array(cavCount * 3);
    for (let i = 0; i < cavCount; i++) {
      cavPos[i * 3] = (Math.random() - 0.5) * 0.8;
      cavPos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      cavPos[i * 3 + 2] = -0.4 + (Math.random() - 0.5) * 0.3;
    }
    cavGeo.setAttribute('position', new THREE.BufferAttribute(cavPos, 3));
    const cavMat = new THREE.PointsMaterial({
      color: 0xaae8ff,
      size: 0.065,
      transparent: true,
      opacity: 0.85
    });
    this.phacoCavitationParticles = new THREE.Points(cavGeo, cavMat);
    this.phacoCavitationParticles.visible = false;
    this.lensGroup.add(this.phacoCavitationParticles);
  }

  // =========================================================================
  // FOLDABLE INTRAOCULAR LENS (IOL)
  // =========================================================================

  private buildFoldableIol(): void {
    // 6.0mm Acrylic Biconvex Optic Disc
    const opticGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.18, 32);
    const opticMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      transmission: 0.95,
      ior: 1.55,
      roughness: 0.05,
      clearcoat: 1.0
    });
    this.iolOpticMesh = new THREE.Mesh(opticGeo, opticMat);
    this.iolOpticMesh.rotation.x = Math.PI / 2;
    this.iolOpticMesh.position.z = -0.65;
    this.iolGroup.add(this.iolOpticMesh);

    // Flexible C-Loop Haptics
    const curve1 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(1.35, 0.2, -0.65),
      new THREE.Vector3(2.3, 1.2, -0.65),
      new THREE.Vector3(1.1, 2.1, -0.65)
    );
    const hapticGeo1 = new THREE.TubeGeometry(curve1, 20, 0.05, 8, false);
    const hapticMat = new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    this.iolHapticLeading = new THREE.Mesh(hapticGeo1, hapticMat);
    this.iolGroup.add(this.iolHapticLeading);

    const curve2 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.35, -0.2, -0.65),
      new THREE.Vector3(-2.3, -1.2, -0.65),
      new THREE.Vector3(-1.1, -2.1, -0.65)
    );
    const hapticGeo2 = new THREE.TubeGeometry(curve2, 20, 0.05, 8, false);
    this.iolHapticTrailing = new THREE.Mesh(hapticGeo2, hapticMat);
    this.iolGroup.add(this.iolHapticTrailing);

    this.iolGroup.visible = false;
  }

  // =========================================================================
  // Nd:YAG POSTERIOR CAPSULE & LASER OPTICS
  // =========================================================================

  private buildYagPosteriorCapsule(): void {
    // 3D Posterior Capsule with PCO pearl texture
    const geo = new THREE.SphereGeometry(2.32, 48, 24, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42);
    
    const pcoCanvas = document.createElement('canvas');
    pcoCanvas.width = 512;
    pcoCanvas.height = 512;
    const pcoCtx = pcoCanvas.getContext('2d')!;
    pcoCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    pcoCtx.fillRect(0, 0, 512, 512);

    // Elschnig pearls & fibrotic wrinkling
    pcoCtx.fillStyle = 'rgba(240, 235, 220, 0.8)';
    for (let i = 0; i < 350; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const pr = Math.random() * 5 + 2;
      pcoCtx.beginPath();
      pcoCtx.arc(px, py, pr, 0, Math.PI * 2);
      pcoCtx.fill();
    }
    const pcoTex = new THREE.CanvasTexture(pcoCanvas);

    const mat = new THREE.MeshStandardMaterial({
      map: pcoTex,
      transparent: true,
      opacity: 0.52,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.posteriorCapsuleMesh = new THREE.Mesh(geo, mat);
    this.posteriorCapsuleMesh.position.z = -0.85;
    this.yagGroup.add(this.posteriorCapsuleMesh);

    // Dual Helium-Neon (He-Ne) Aiming Beams (converging twin cones)
    const b1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 1.2, 5.0),
      new THREE.Vector3(0, 0, -0.88)
    ]);
    const bMat = new THREE.LineBasicMaterial({ color: 0xff1111, transparent: true, opacity: 0.85 });
    this.yagAimingCone1 = new THREE.Line(b1Geo, bMat);
    this.yagGroup.add(this.yagAimingCone1);

    const b2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.2, -1.2, 5.0),
      new THREE.Vector3(0, 0, -0.88)
    ]);
    this.yagAimingCone2 = new THREE.Line(b2Geo, bMat);
    this.yagGroup.add(this.yagAimingCone2);

    // Focal Reticle Dot
    const dotGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.yagFocalDot = new THREE.Mesh(dotGeo, dotMat);
    this.yagFocalDot.position.set(0, 0, -0.88);
    this.yagGroup.add(this.yagFocalDot);

    // Plasma Optical Breakdown Spark (white-blue ignition)
    const sparkGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0x99ffff,
      transparent: true,
      opacity: 0
    });
    this.yagPlasmaSpark = new THREE.Mesh(sparkGeo, sparkMat);
    this.yagPlasmaSpark.position.set(0, 0, -0.88);
    this.yagGroup.add(this.yagPlasmaSpark);

    // Cruciate (+) Capsulotomy Tear Lines
    const tearPoints = [
      // Vertical cut
      new THREE.Vector3(0, -0.8, -0.85), new THREE.Vector3(0, 0.8, -0.85),
      // Horizontal cut
      new THREE.Vector3(-0.8, 0, -0.85), new THREE.Vector3(0.8, 0, -0.85)
    ];
    const tearGeo = new THREE.BufferGeometry().setFromPoints(tearPoints);
    const tearMat = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 });
    this.yagTearLines = new THREE.LineSegments(tearGeo, tearMat);
    this.yagTearLines.visible = false;
    this.yagGroup.add(this.yagTearLines);

    this.yagGroup.visible = false;
  }

  // =========================================================================
  // 3D SURGICAL INSTRUMENTS
  // =========================================================================

  private build3DInstruments(): void {
    // 1. Phaco Handpiece & Titanium Tip
    const phacoObj = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.8, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.6, roughness: 0.4 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 1.4;
    phacoObj.add(handle);

    // Silicone Sleeve (blue)
    const sleeveGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.9, 16);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.position.y = 0.4;
    phacoObj.add(sleeve);

    // Titanium Needle
    const needleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.6, 16);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.15 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.y = -0.15;
    phacoObj.add(needle);

    phacoObj.rotation.x = Math.PI / 4;
    this.instrumentMeshes.set('phaco_tip', phacoObj);

    // 2. MVR Blade (1.0mm)
    const mvrObj = new THREE.Group();
    const mvrHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    mvrHandle.position.y = 1.2;
    mvrObj.add(mvrHandle);
    const mvrBlade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 4), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9 }));
    mvrBlade.position.y = -0.1;
    mvrBlade.rotation.y = Math.PI / 4;
    mvrObj.add(mvrBlade);
    this.instrumentMeshes.set('mvr_blade', mvrObj);

    // 3. Clear Corneal Keratome (2.4mm)
    const keratomeObj = new THREE.Group();
    const kHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 16), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    kHandle.position.y = 1.2;
    keratomeObj.add(kHandle);
    const kBlade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95 }));
    kBlade.position.y = -0.12;
    keratomeObj.add(kBlade);
    this.instrumentMeshes.set('keratome_2_4', keratomeObj);

    // 4. MIGS Stent Injector
    const migsObj = new THREE.Group();
    const migsHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.8, 16), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    migsHandle.position.y = 1.4;
    migsObj.add(migsHandle);
    const trocar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 }));
    trocar.position.y = -0.2;
    migsObj.add(trocar);
    this.instrumentMeshes.set('migs_injector', migsObj);

    // Add all instruments to group but hidden initially
    this.instrumentMeshes.forEach((mesh) => {
      mesh.visible = false;
      this.instrumentGroup.add(mesh);
    });
  }

  // =========================================================================
  // CAMERA PRESETS & ZOOMING
  // =========================================================================

  public setCameraPreset(preset: CameraPresetType): void {
    this.isTransitioningCamera = true;
    this.transitionAlpha = 0.0;

    switch (preset) {
      case 'microscope':
        // Standard coaxial surgeon view
        this.targetCamPos.set(0, 0, 8.5);
        this.targetLookAt.set(0, 0, 0);
        break;

      case 'glaucoma_angle':
        // Dives into the 38° nasal iridocorneal angle right at the trabecular meshwork!
        this.targetCamPos.set(2.4, 1.8, 1.6);
        this.targetLookAt.set(2.8, 2.1, 0.05);
        break;

      case 'cataract_core':
        // Dives deep into the anterior chamber & lens nucleus
        this.targetCamPos.set(0.4, 0.3, 3.2);
        this.targetLookAt.set(0, 0, -0.45);
        break;

      case 'yag_capsule':
        // Macro view centered on posterior capsule & IOL optic
        this.targetCamPos.set(0, 0, 3.5);
        this.targetLookAt.set(0, 0, -0.85);
        break;

      case 'cross_section':
        // Side profile showing cornea dome, AC depth, and lens
        this.targetCamPos.set(6.2, 0, 1.2);
        this.targetLookAt.set(0, 0, 0);
        break;
    }
  }

  public setZoom(zoomFactor: number): void {
    // Smoothly scale camera distance based on magnification (6x - 25x or higher)
    this.currentMagnification = zoomFactor;
    const targetDist = 11.5 - (zoomFactor / 25.0) * 8.2;
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.copy(this.controls.target.clone().add(dir.multiplyScalar(Math.max(1.1, targetDist))));
  }

  // =========================================================================
  // MAIN SCENE UPDATE & SYNCHRONIZATION
  // =========================================================================

  public updateState(params: {
    module: SurgicalModule;
    activeInstrument: InstrumentType;
    pedalPosition: FootPedalPosition;
    nucleusState: PhacoNucleusState;
    cccState: CapsulorhexisState;
    iolState: IolPositionState;
    yagState: YagCapsulotomyState;
    migsState?: MigsState;
    laserDefocusZ: number;
    coaxialLight: number;
    redReflexGain: number;
    mouseNormPos?: { x: number; y: number; isDown: boolean };
    magnification: number;
  }): void {
    this.currentModule = params.module;
    if (params.mouseNormPos) this.mouseNorm = params.mouseNormPos;

    // 1. Lighting
    this.coaxialLight.intensity = (params.coaxialLight / 100.0) * 3.8;
    const reflex = (params.redReflexGain / 100.0) * (params.coaxialLight / 100.0);
    (this.pupilMesh.material as THREE.MeshBasicMaterial).color.setRGB(
      0.85 * reflex,
      0.18 * reflex,
      0.08 * reflex
    );

    // 2. Module Visibility Configuration
    if (params.module === 'phaco') {
      this.lensGroup.visible = true;
      this.iolGroup.visible = false;
      this.yagGroup.visible = false;
      this.angleGroup.visible = false;
      this.gonioprismMesh.visible = false;

      // Capsulorhexis Window Opening
      if (params.cccState.completed) {
        this.anteriorCapsuleMesh.visible = false;
        this.capsulorhexisRimMesh.visible = true;
      } else if (params.cccState.punctured) {
        (this.anteriorCapsuleMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.12;
        this.capsulorhexisRimMesh.visible = true;
      }

      // Phacoemulsification Nucleus Mass & Quadrants
      const rem = params.nucleusState.remainingMassFraction;
      if (rem > 0.75) {
        this.nucleusMesh.visible = true;
        this.nucleusQuadrants.forEach(q => q.visible = false);
        this.nucleusMesh.scale.set(rem, rem, rem);
      } else {
        // Chopped into quadrants
        this.nucleusMesh.visible = false;
        this.nucleusQuadrants.forEach((q, idx) => {
          q.visible = rem > idx * 0.18;
          const qScale = Math.max(0.2, rem / 0.75);
          q.scale.set(qScale, qScale, qScale);
        });
      }

      // Ultrasonic Cavitation Particles
      this.phacoCavitationParticles.visible = params.pedalPosition === 3 && params.activeInstrument === 'phaco_tip';

    } else if (params.module === 'iol') {
      this.lensGroup.visible = false;
      this.iolGroup.visible = true;
      this.yagGroup.visible = false;
      this.angleGroup.visible = false;
      this.gonioprismMesh.visible = false;

      // Foldable IOL unfolding & centering
      if (params.iolState.opticInChamber) {
        this.iolOpticMesh.visible = true;
        this.iolHapticLeading.visible = true;
        this.iolHapticTrailing.visible = params.iolState.trailingHapticInBag;
      }

    } else if (params.module === 'yag') {
      this.lensGroup.visible = false;
      this.iolGroup.visible = true; // Pseudophakic eye
      this.yagGroup.visible = true;
      this.angleGroup.visible = false;
      this.gonioprismMesh.visible = false;

      // Focus laser reticle to mouse/target
      const targetZ = -0.85 + (params.laserDefocusZ / 1000.0) * 0.5;
      this.yagFocalDot.position.set(this.mouseNorm.x * 1.8, this.mouseNorm.y * 1.8, targetZ);

      // Reconnect aiming beam lines to focal point
      const b1Pos = this.yagAimingCone1.geometry.attributes.position as THREE.BufferAttribute;
      b1Pos.setXYZ(1, this.mouseNorm.x * 1.8, this.mouseNorm.y * 1.8, targetZ);
      b1Pos.needsUpdate = true;

      const b2Pos = this.yagAimingCone2.geometry.attributes.position as THREE.BufferAttribute;
      b2Pos.setXYZ(1, this.mouseNorm.x * 1.8, this.mouseNorm.y * 1.8, targetZ);
      b2Pos.needsUpdate = true;

      // Show cruciate tears once fired
      if (params.yagState.shots.length > 0) {
        this.yagTearLines.visible = true;
      }

    } else if (params.module === 'migs') {
      this.lensGroup.visible = false;
      this.iolGroup.visible = true;
      this.yagGroup.visible = false;
      this.angleGroup.visible = true;

      // Gonioprism on cornea
      this.gonioprismMesh.visible = true;

      // Stents deployment state
      if (params.migsState) {
        this.stent1Group.visible = params.migsState.stents[0]?.deployed ?? false;
        this.stent2Group.visible = params.migsState.stents[1]?.deployed ?? false;
        this.bloodRefluxParticles.visible = params.migsState.bloodRefluxWaveConfirmed ?? false;
      }
    }

    // 3. Active 3D Instrument positioning
    this.updateInstrumentPosition(params.activeInstrument, params.pedalPosition);
  }

  private updateInstrumentPosition(activeInstrument: InstrumentType, pedalPosition: FootPedalPosition): void {
    if (this.currentInstrumentType !== activeInstrument) {
      if (this.currentInstrumentType && this.instrumentMeshes.has(this.currentInstrumentType)) {
        this.instrumentMeshes.get(this.currentInstrumentType)!.visible = false;
      }
      this.currentInstrumentType = activeInstrument;
      if (this.instrumentMeshes.has(activeInstrument)) {
        this.instrumentMeshes.get(activeInstrument)!.visible = true;
      }
    }

    const currentMesh = this.instrumentMeshes.get(activeInstrument);
    if (!currentMesh) return;

    // Follow cursor with realistic corneal incision pivot
    const tx = this.mouseNorm.x * 2.2;
    const ty = this.mouseNorm.y * 2.2;
    currentMesh.position.set(tx, ty, 0.4);

    // Phaco tip micro-vibration when ultrasound pedal active
    if (activeInstrument === 'phaco_tip' && pedalPosition === 3) {
      currentMesh.position.x += (Math.random() - 0.5) * 0.025;
      currentMesh.position.y += (Math.random() - 0.5) * 0.025;
    }
  }

  public triggerYagPlasmaSpark(x: number, y: number): void {
    this.yagPlasmaSpark.position.set(x * 1.8, y * 1.8, -0.85);
    (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity = 1.0;
  }

  // =========================================================================
  // ANIMATION LOOP & CLEANUP
  // =========================================================================

  private onResize = (): void => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = (): void => {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    // Smooth camera transition if interpolating
    if (this.isTransitioningCamera) {
      this.transitionAlpha += 0.04;
      this.camera.position.lerp(this.targetCamPos, 0.08);
      this.controls.target.lerp(this.targetLookAt, 0.08);

      if (this.transitionAlpha >= 1.0) {
        this.isTransitioningCamera = false;
      }
    }

    // Dynamic blood reflux animation in Schlemm's canal
    if (this.bloodRefluxParticles.visible) {
      const posAttr = this.bloodRefluxParticles.geometry.attributes.position as THREE.BufferAttribute;
      const velAttr = this.bloodRefluxParticles.geometry.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let x = posAttr.getX(i) + velAttr.getX(i);
        let y = posAttr.getY(i) + velAttr.getY(i);
        let z = posAttr.getZ(i) + velAttr.getZ(i);

        // Reset particle if drifted too far into AC
        if (Math.hypot(x, y) < 2.9) {
          const angle = Math.random() * 0.8 + 1.1;
          const r = 3.42 + Math.random() * 0.12;
          x = Math.cos(angle) * r;
          y = Math.sin(angle) * r;
          z = 0.06;
        }
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // Decay YAG plasma spark
    if (this.yagPlasmaSpark && (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity > 0) {
      (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity -= 0.08;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public destroy(): void {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.animFrameId);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
