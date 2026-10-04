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

export type CameraPresetType = 'microscope' | 'glaucoma_angle' | 'cataract_core' | 'yag_capsule' | 'cross_section' | 'step_focus';

export interface ThreeEyeSceneConfig {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
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

  // Eye Anatomy Groups
  public eyeGroup: THREE.Group;
  public scleraMesh: THREE.Mesh;
  public corneaMesh: THREE.Mesh;
  public irisMesh: THREE.Mesh;
  public pupilMesh: THREE.Mesh;

  // 3D Incision Wounds on Cornea
  private paracentesisWoundMesh: THREE.Mesh;
  private clearCornealWoundMesh: THREE.Mesh;

  // Glaucoma / Trabecular Meshwork Angle Meshes
  public angleGroup: THREE.Group;
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
  public lensGroup: THREE.Group;
  private anteriorCapsuleMesh: THREE.Mesh;
  private capsulorhexisRimMesh: THREE.LineLoop;
  private cccFlapMesh: THREE.Mesh;
  private nucleusMesh: THREE.Mesh;
  private nucleusTrenchMesh: THREE.Mesh;
  private nucleusQuadrants: THREE.Mesh[] = [];
  private cortexMesh: THREE.Mesh;
  private phacoCavitationParticles: THREE.Points;

  // IOL Meshes
  public iolGroup: THREE.Group;
  private iolOpticMesh: THREE.Mesh;
  private iolHapticLeading: THREE.Mesh;
  private iolHapticTrailing: THREE.Mesh;

  // Nd:YAG Posterior Capsule & Laser Meshes
  public yagGroup: THREE.Group;
  private posteriorCapsuleMesh: THREE.Mesh;
  private yagTearLeaflets: THREE.Mesh[] = [];
  private yagAimingCone1: THREE.Line;
  private yagAimingCone2: THREE.Line;
  private yagFocalDot: THREE.Mesh;
  private yagPlasmaSpark: THREE.Mesh;
  private yagShockwaveMesh: THREE.Mesh;
  private isRippingCapsule: boolean = false;
  private ripProgress: number = 0;

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
  private transitionSpeed: number = 0.07;

  // State caches
  private currentModule: SurgicalModule = 'phaco';
  private currentStep: string = '';
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

    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 100);
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
    this.renderer.toneMappingExposure = 1.25;

    // 2. OrbitControls (Smooth inspection & deep zoom)
    this.controls = new OrbitControls(this.camera, this.container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.8; // Allows extreme macro zoom into trabecular meshwork & stents
    this.controls.maxDistance = 14.0;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.target.set(0, 0, 0);

    // 3. Lighting System (Coaxial microscope beam + oblique specular reflection)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(this.ambientLight);

    this.coaxialLight = new THREE.PointLight(0xfffaed, 4.5, 30);
    this.coaxialLight.position.set(0, 0, 8.0);
    this.scene.add(this.coaxialLight);

    this.obliqueLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.obliqueLight.position.set(3, 4, 6);
    this.scene.add(this.obliqueLight);

    // Fill light for posterior structures
    const backFillLight = new THREE.DirectionalLight(0x90caf9, 0.8);
    backFillLight.position.set(-3, -2, 4);
    this.scene.add(backFillLight);

    // 4. Build Complete 3D Eye Anatomy
    this.eyeGroup = new THREE.Group();
    this.scene.add(this.eyeGroup);

    this.scleraMesh = this.buildScleraGlobe();
    this.eyeGroup.add(this.scleraMesh);

    this.corneaMesh = this.buildCorneaDome();
    this.eyeGroup.add(this.corneaMesh);

    this.build3DCornealIncisions();

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

    // Nd:YAG Posterior Capsule & Laser Photodisruption
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
  // ANATOMICAL BUILDERS: REALISTIC EYE GLOBE, CORNEA & IRIS
  // =========================================================================

  private buildScleraGlobe(): THREE.Mesh {
    // 3D Scleral Shell facing viewer with anterior aperture for cornea
    const geo = new THREE.SphereGeometry(4.35, 64, 48, 0, Math.PI * 2, Math.PI * 0.28, Math.PI * 0.72);
    
    // Rich procedural scleral vascular arcade texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base scleral ivory gradient
    const bgGrad = ctx.createRadialGradient(512, 512, 200, 512, 512, 512);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.7, '#f1f5f9');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Limbal transition zone (grey-blue annular arcade at corneal perimeter)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.stroke();

    // Branching episcleral micro-capillaries
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
    for (let i = 0; i < 65; i++) {
      const startAngle = Math.random() * Math.PI * 2;
      let r = 400 + Math.random() * 90;
      let cx = 512 + Math.cos(startAngle) * r;
      let cy = 512 + Math.sin(startAngle) * r;
      ctx.lineWidth = Math.random() * 2.0 + 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 5; j++) {
        cx += (Math.random() - 0.5) * 45;
        cy += (Math.random() - 0.5) * 45;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.28,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.z = -2.75;
    return mesh;
  }

  private buildCorneaDome(): THREE.Mesh {
    // 3D Refractive Cornea Dome (Anterior curvature radius 7.8mm scaled)
    const geo = new THREE.SphereGeometry(3.55, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.33);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xe0f7fa,
      transparent: true,
      opacity: 0.32,
      roughness: 0.06,
      metalness: 0.12,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.z = -1.81;
    return mesh;
  }

  private build3DCornealIncisions(): void {
    const slitMat = new THREE.MeshBasicMaterial({ color: 0x051329 });

    // 1. Paracentesis Incision at 10:00 (150° / 2.618 rad)
    const pGroup = new THREE.Group();
    const pSlit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.22), slitMat);
    pGroup.add(pSlit);

    const pLipMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.65,
      roughness: 0.15
    });
    const pLip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.28), pLipMat);
    pGroup.add(pLip);

    const pAngle = (150 * Math.PI) / 180;
    pGroup.position.set(Math.cos(pAngle) * 3.25, Math.sin(pAngle) * 3.25, 0.25);
    pGroup.rotation.z = pAngle + Math.PI / 2;
    this.paracentesisWoundMesh = pGroup as any;
    this.eyeGroup.add(pGroup);

    // 2. Clear Corneal Tri-Planar Incision at 1:30 (45° / 0.785 rad)
    const kGroup = new THREE.Group();
    const kSlit = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.32), slitMat);
    kGroup.add(kSlit);

    const kLipMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.65,
      roughness: 0.15
    });
    const kLip = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.38), kLipMat);
    kGroup.add(kLip);

    const kAngle = (45 * Math.PI) / 180;
    kGroup.position.set(Math.cos(kAngle) * 3.25, Math.sin(kAngle) * 3.25, 0.25);
    kGroup.rotation.z = kAngle + Math.PI / 2;
    this.clearCornealWoundMesh = kGroup as any;
    this.eyeGroup.add(kGroup);
  }

  private buildIris(): THREE.Mesh {
    // 3D Iris Annular Diaphragm sloping gracefully toward pupillary margin
    const geo = new THREE.RingGeometry(1.65, 3.48, 64);
    
    // Rich procedural human iris texture: collarette, radial fibers, and Fuchs crypts
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(512, 512, 170, 512, 512, 512);
    grad.addColorStop(0, '#0c2338'); // Pupillary sphincter
    grad.addColorStop(0.25, '#1e527d');
    grad.addColorStop(0.52, '#2b78b5'); // Collarette prominence
    grad.addColorStop(0.85, '#194c73');
    grad.addColorStop(1, '#0b1d2e'); // Ciliary body root
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Distinct radial collagenous trabecular ridges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.8;
    for (let a = 0; a < 360; a += 1.0) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(512 + Math.cos(rad) * 180, 512 + Math.sin(rad) * 180);
      ctx.lineTo(512 + Math.cos(rad) * 490, 512 + Math.sin(rad) * 490);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -0.12;
    return mesh;
  }

  private buildPupil(): THREE.Mesh {
    const geo = new THREE.CircleGeometry(1.68, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc8260c, // Coaxial red reflex glow from retina
      transparent: true,
      opacity: 0.94
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -0.16;
    return mesh;
  }

  // =========================================================================
  // GLAUCOMA / MIGS TRABECULAR MESHWORK & STENTS (HYPER-DETAILED 3D)
  // =========================================================================

  private buildTrabecularMeshworkAngle(): void {
    // 1. Schwalbe's Line (Pearly glistening white anatomical termination of Descemet's)
    const slGeo = new THREE.TorusGeometry(3.38, 0.055, 16, 64);
    const slMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      emissive: 0x555555
    });
    this.schwalbeLineMesh = new THREE.Mesh(slGeo, slMat);
    this.schwalbeLineMesh.position.z = 0.22;
    this.angleGroup.add(this.schwalbeLineMesh);

    // 2. Pigmented Trabecular Meshwork (TM) - Main filtration tissue
    const tmGeo = new THREE.CylinderGeometry(3.42, 3.48, 0.22, 64, 1, true);
    
    // Microscopic porous trabecular beam lattice texture
    const tmCanvas = document.createElement('canvas');
    tmCanvas.width = 512;
    tmCanvas.height = 64;
    const tmCtx = tmCanvas.getContext('2d')!;
    tmCtx.fillStyle = '#784e24'; // Rich golden-brown pigment
    tmCtx.fillRect(0, 0, 512, 64);
    tmCtx.fillStyle = '#221105';
    for (let i = 0; i < 800; i++) {
      tmCtx.fillRect(Math.random() * 512, Math.random() * 64, 2, 2);
    }
    const tmTex = new THREE.CanvasTexture(tmCanvas);
    tmTex.wrapS = THREE.RepeatWrapping;
    tmTex.repeat.set(8, 1);

    const tmMat = new THREE.MeshStandardMaterial({
      map: tmTex,
      roughness: 0.85,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    this.trabecularMeshworkMesh = new THREE.Mesh(tmGeo, tmMat);
    this.trabecularMeshworkMesh.rotation.x = Math.PI / 2;
    this.trabecularMeshworkMesh.position.z = 0.12;
    this.angleGroup.add(this.trabecularMeshworkMesh);

    // 3. Schlemm's Canal (Circumferential collector channel directly behind TM)
    const scGeo = new THREE.TorusGeometry(3.52, 0.08, 16, 64);
    const scMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Endothelial vascular collector bed
      roughness: 0.35,
      transparent: true,
      opacity: 0.85
    });
    this.schlemmCanalMesh = new THREE.Mesh(scGeo, scMat);
    this.schlemmCanalMesh.position.z = 0.08;
    this.angleGroup.add(this.schlemmCanalMesh);

    // 4. Scleral Spur (White fibrous ring)
    const ssGeo = new THREE.TorusGeometry(3.46, 0.04, 16, 64);
    const ssMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.3
    });
    this.scleralSpurMesh = new THREE.Mesh(ssGeo, ssMat);
    this.scleralSpurMesh.position.z = -0.02;
    this.angleGroup.add(this.scleralSpurMesh);

    // 5. Ciliary Body Band
    const cbGeo = new THREE.CylinderGeometry(3.46, 3.44, 0.24, 64, 1, true);
    const cbMat = new THREE.MeshStandardMaterial({
      color: 0x3d3228,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    this.ciliaryBodyMesh = new THREE.Mesh(cbGeo, cbMat);
    this.ciliaryBodyMesh.rotation.x = Math.PI / 2;
    this.ciliaryBodyMesh.position.z = -0.16;
    this.angleGroup.add(this.ciliaryBodyMesh);

    // 6. 3D Titanium Micro-Bypass Stents
    this.stent1Group = this.buildMicroStentModel('Stent 1 (2:30 Target)');
    this.stent2Group = this.buildMicroStentModel('Stent 2 (4:00 Target)');

    const rad1 = (75 * Math.PI) / 180;
    this.stent1Group.position.set(Math.cos(rad1) * 3.44, Math.sin(rad1) * 3.44, 0.12);
    this.stent1Group.rotation.z = rad1 + Math.PI;
    this.stent1Group.rotation.y = -0.4;
    this.angleGroup.add(this.stent1Group);

    const rad2 = (120 * Math.PI) / 180;
    this.stent2Group.position.set(Math.cos(rad2) * 3.44, Math.sin(rad2) * 3.44, 0.12);
    this.stent2Group.rotation.z = rad2 + Math.PI;
    this.stent2Group.rotation.y = -0.4;
    this.angleGroup.add(this.stent2Group);

    // 7. Venous Blood Reflux Fluid Particles
    const pCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * 0.9 + 1.05;
      const r = 3.42 + Math.random() * 0.12;
      pPos[i * 3] = Math.cos(angle) * r;
      pPos[i * 3 + 1] = Math.sin(angle) * r;
      pPos[i * 3 + 2] = 0.08 + Math.random() * 0.12;

      pVel[i * 3] = -Math.cos(angle) * 0.016;
      pVel[i * 3 + 1] = -Math.sin(angle) * 0.016;
      pVel[i * 3 + 2] = 0.009;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('velocity', new THREE.BufferAttribute(pVel, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 0.09,
      transparent: true,
      opacity: 0.9
    });
    this.bloodRefluxParticles = new THREE.Points(pGeo, pMat);
    this.bloodRefluxParticles.visible = false;
    this.angleGroup.add(this.bloodRefluxParticles);

    // 8. Swan-Jacob Gonioprism Lens (38° clinical mirror)
    const gonioGeo = new THREE.CylinderGeometry(2.7, 3.1, 1.3, 32);
    const gonioMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1
    });
    this.gonioprismMesh = new THREE.Mesh(gonioGeo, gonioMat);
    this.gonioprismMesh.position.set(0, 0, 1.25);
    this.gonioprismMesh.rotation.x = 0.65;
    this.gonioprismMesh.visible = false;
    this.eyeGroup.add(this.gonioprismMesh);

    this.angleGroup.visible = false;
  }

  private buildMicroStentModel(name: string): THREE.Group {
    const grp = new THREE.Group();
    grp.name = name;

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      metalness: 0.95,
      roughness: 0.18,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.25
    });

    // Flanged retention collar (sits in AC)
    const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.09, 16), metalMat);
    headMesh.rotation.z = Math.PI / 2;
    grp.add(headMesh);

    // Thorax / Shaft (spans trabecular meshwork)
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 16), metalMat);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.position.x = 0.15;
    grp.add(bodyMesh);

    // Duckbill Outlet Tip (seats directly into Schlemm's canal)
    const tipMesh = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.14, 16), metalMat);
    tipMesh.rotation.z = -Math.PI / 2;
    tipMesh.position.x = 0.33;
    grp.add(tipMesh);

    // Central Lumen Hole
    const lumenMesh = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), new THREE.MeshBasicMaterial({ color: 0x020617 }));
    lumenMesh.rotation.y = -Math.PI / 2;
    lumenMesh.position.x = -0.048;
    grp.add(lumenMesh);

    grp.scale.set(0.9, 0.9, 0.9);
    grp.visible = false;
    return grp;
  }

  // =========================================================================
  // CATARACT LENS & PHACOEMULSIFICATION (3D CORE, TRENCH & QUADRANTS)
  // =========================================================================

  private buildCataractLens(): void {
    // 1. Anterior Capsule
    const acGeo = new THREE.SphereGeometry(2.32, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const acMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.32,
      roughness: 0.12,
      side: THREE.DoubleSide
    });
    this.anteriorCapsuleMesh = new THREE.Mesh(acGeo, acMat);
    this.anteriorCapsuleMesh.rotation.x = Math.PI / 2;
    this.anteriorCapsuleMesh.position.z = -0.85;
    this.lensGroup.add(this.anteriorCapsuleMesh);

    // 5.5mm Capsulorhexis Circular Rim Line
    const rimPoints: THREE.Vector3[] = [];
    const rRadius = 1.25;
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      rimPoints.push(new THREE.Vector3(Math.cos(th) * rRadius, Math.sin(th) * rRadius, -0.22));
    }
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
    const rimMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    this.capsulorhexisRimMesh = new THREE.LineLoop(rimGeo, rimMat);
    this.capsulorhexisRimMesh.visible = false;
    this.lensGroup.add(this.capsulorhexisRimMesh);

    // Peeling Capsulorhexis Flap in 3D
    const flapGeo = new THREE.CircleGeometry(0.65, 16);
    const flapMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    this.cccFlapMesh = new THREE.Mesh(flapGeo, flapMat);
    this.cccFlapMesh.position.set(0.4, 0.4, -0.18);
    this.cccFlapMesh.rotation.x = 0.5;
    this.cccFlapMesh.visible = false;
    this.lensGroup.add(this.cccFlapMesh);

    // 2. Cataract Core (LOCS III NO3 Nuclear Cataract)
    const nGeo = new THREE.SphereGeometry(2.28, 48, 32);
    nGeo.scale(1, 1, 0.45);
    const nMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber golden nuclear grade
      roughness: 0.55,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94
    });
    this.nucleusMesh = new THREE.Mesh(nGeo, nMat);
    this.nucleusMesh.position.z = -0.52;
    this.lensGroup.add(this.nucleusMesh);

    // Deep Phaco Trench Groove (Sculpted central canal)
    const trGeo = new THREE.BoxGeometry(0.45, 2.6, 0.38);
    const trMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.7
    });
    this.nucleusTrenchMesh = new THREE.Mesh(trGeo, trMat);
    this.nucleusTrenchMesh.position.set(0, 0, -0.45);
    this.nucleusTrenchMesh.visible = false;
    this.lensGroup.add(this.nucleusTrenchMesh);

    // 4 Chopped Nuclear Quadrants for Phacoemulsification
    const quadOffsets = [
      { x: 0.5, y: 0.5, rotZ: 0 },
      { x: -0.5, y: 0.5, rotZ: Math.PI / 2 },
      { x: -0.5, y: -0.5, rotZ: Math.PI },
      { x: 0.5, y: -0.5, rotZ: -Math.PI / 2 }
    ];

    quadOffsets.forEach((q) => {
      const qGeo = new THREE.CylinderGeometry(1.15, 0.18, 0.45, 16, 1, false, 0, Math.PI * 0.46);
      const qMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.6,
        transparent: true,
        opacity: 0.92
      });
      const qMesh = new THREE.Mesh(qGeo, qMat);
      qMesh.rotation.x = Math.PI / 2;
      qMesh.rotation.z = q.rotZ;
      qMesh.position.set(q.x, q.y, -0.52);
      qMesh.visible = false;
      this.nucleusQuadrants.push(qMesh);
      this.lensGroup.add(qMesh);
    });

    // 3. Cortex Fibers
    const cGeo = new THREE.RingGeometry(1.6, 2.32, 32);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.52,
      roughness: 0.75
    });
    this.cortexMesh = new THREE.Mesh(cGeo, cMat);
    this.cortexMesh.position.z = -0.35;
    this.lensGroup.add(this.cortexMesh);

    // 4. Ultrasonic Cavitation Shockwave Particles
    const cavCount = 140;
    const cavGeo = new THREE.BufferGeometry();
    const cavPos = new Float32Array(cavCount * 3);
    for (let i = 0; i < cavCount; i++) {
      cavPos[i * 3] = (Math.random() - 0.5) * 0.9;
      cavPos[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      cavPos[i * 3 + 2] = -0.4 + (Math.random() - 0.5) * 0.3;
    }
    cavGeo.setAttribute('position', new THREE.BufferAttribute(cavPos, 3));
    const cavMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.08,
      transparent: true,
      opacity: 0.9
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
    const opticMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      roughness: 0.06,
      metalness: 0.1
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
      color: 0x60a5fa,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
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
  // Nd:YAG POSTERIOR CAPSULE & LASER PHOTODISRUPTION (TISSUE RIPPING)
  // =========================================================================

  private buildYagPosteriorCapsule(): void {
    // 3D Posterior Capsule with PCO pearl texture
    const geo = new THREE.SphereGeometry(2.3, 48, 24, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42);
    
    const pcoCanvas = document.createElement('canvas');
    pcoCanvas.width = 512;
    pcoCanvas.height = 512;
    const pcoCtx = pcoCanvas.getContext('2d')!;
    pcoCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    pcoCtx.fillRect(0, 0, 512, 512);

    // Elschnig pearls & fibrotic wrinkling
    pcoCtx.fillStyle = 'rgba(240, 235, 220, 0.85)';
    for (let i = 0; i < 400; i++) {
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
      opacity: 0.6,
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    this.posteriorCapsuleMesh = new THREE.Mesh(geo, mat);
    this.posteriorCapsuleMesh.rotation.x = Math.PI / 2;
    this.posteriorCapsuleMesh.position.z = -0.85;
    this.yagGroup.add(this.posteriorCapsuleMesh);

    // 4 Ripped Capsular Tissue Leaflets (Curling open into vitreous body)
    const leafletConfigs = [
      { x: 0, y: 0.6, rotX: -0.6, rotZ: 0 },       // Top leaflet
      { x: 0, y: -0.6, rotX: 0.6, rotZ: Math.PI }, // Bottom leaflet
      { x: -0.6, y: 0, rotY: -0.6, rotZ: Math.PI / 2 }, // Left leaflet
      { x: 0.6, y: 0, rotY: 0.6, rotZ: -Math.PI / 2 }   // Right leaflet
    ];

    leafletConfigs.forEach((lc) => {
      const lGeo = new THREE.ConeGeometry(0.55, 0.8, 4);
      const lMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        transparent: true,
        opacity: 0.65,
        roughness: 0.4,
        side: THREE.DoubleSide
      });
      const lMesh = new THREE.Mesh(lGeo, lMat);
      lMesh.position.set(lc.x, lc.y, -0.92);
      lMesh.rotation.set(lc.rotX || 0, lc.rotY || 0, lc.rotZ);
      lMesh.visible = false;
      this.yagTearLeaflets.push(lMesh);
      this.yagGroup.add(lMesh);
    });

    // Dual Helium-Neon (He-Ne) Aiming Beams (converging twin cones)
    const b1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 1.2, 5.0),
      new THREE.Vector3(0, 0, -0.88)
    ]);
    const bMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    this.yagAimingCone1 = new THREE.Line(b1Geo, bMat);
    this.yagGroup.add(this.yagAimingCone1);

    const b2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.2, -1.2, 5.0),
      new THREE.Vector3(0, 0, -0.88)
    ]);
    this.yagAimingCone2 = new THREE.Line(b2Geo, bMat);
    this.yagGroup.add(this.yagAimingCone2);

    // Focal Reticle Pinpoint
    const dotGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.yagFocalDot = new THREE.Mesh(dotGeo, dotMat);
    this.yagFocalDot.position.set(0, 0, -0.88);
    this.yagGroup.add(this.yagFocalDot);

    // Optical Breakdown Plasma Spark
    const sparkGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xe0ffff,
      transparent: true,
      opacity: 0
    });
    this.yagPlasmaSpark = new THREE.Mesh(sparkGeo, sparkMat);
    this.yagPlasmaSpark.position.set(0, 0, -0.88);
    this.yagGroup.add(this.yagPlasmaSpark);

    // Acoustic Cavitation Shockwave Ring
    const swGeo = new THREE.RingGeometry(0.1, 0.16, 32);
    const swMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.yagShockwaveMesh = new THREE.Mesh(swGeo, swMat);
    this.yagShockwaveMesh.position.set(0, 0, -0.87);
    this.yagGroup.add(this.yagShockwaveMesh);

    this.yagGroup.visible = false;
  }

  // =========================================================================
  // 3D SURGICAL INSTRUMENTS
  // =========================================================================

  private build3DInstruments(): void {
    // 1. Phaco Handpiece & Titanium Tip
    const phacoObj = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.8, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 }));
    handle.position.y = 1.4;
    phacoObj.add(handle);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 }));
    sleeve.position.y = 0.4;
    phacoObj.add(sleeve);

    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 }));
    needle.position.y = -0.15;
    phacoObj.add(needle);
    phacoObj.rotation.x = Math.PI / 4;
    this.instrumentMeshes.set('phaco_tip', phacoObj);

    // 2. MVR Blade (1.0mm)
    const mvrObj = new THREE.Group();
    const mvrHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    mvrHandle.position.y = 1.2;
    mvrObj.add(mvrHandle);
    const mvrBlade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 4), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 }));
    mvrBlade.position.y = -0.1;
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

    // 4. MIGS Stent Injector Trocar
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
  // STEP-SPECIFIC AUTOMATIC ZOOM & FRAMING
  // =========================================================================

  public focusOnStep(stepId: string): void {
    this.currentStep = stepId;
    this.isTransitioningCamera = true;

    switch (stepId) {
      // --- CATARACT PHACO STEPS ---
      case 'paracentesis':
        // Zoom right onto the 10:00 limbus incision
        this.targetCamPos.set(-2.0, 1.2, 2.5);
        this.targetLookAt.set(-2.8, 1.6, 0.25);
        break;

      case 'clear_corneal_incision':
        // Zoom onto the 1:30 main tunnel
        this.targetCamPos.set(1.7, 1.6, 2.5);
        this.targetLookAt.set(2.3, 2.3, 0.25);
        break;

      case 'ovd_injection':
        // Frame anterior chamber depth
        this.targetCamPos.set(0, -0.6, 3.6);
        this.targetLookAt.set(0, 0, 0.1);
        break;

      case 'capsulorhexis':
        // Macro-zoom on anterior capsule window
        this.targetCamPos.set(0, 0, 2.6);
        this.targetLookAt.set(0, 0, -0.25);
        break;

      case 'hydrodissection':
        // Zoom under capsular rim at 12:00
        this.targetCamPos.set(0, 0.7, 2.8);
        this.targetLookAt.set(0, 1.1, -0.3);
        break;

      case 'phaco_chop':
        // Deep zoom into lens nucleus & phaco trench
        this.targetCamPos.set(0.6, -0.5, 3.0);
        this.targetLookAt.set(0, 0, -0.5);
        break;

      case 'cortex_removal':
        // Zoom into capsular fornices
        this.targetCamPos.set(0.6, -0.4, 3.0);
        this.targetLookAt.set(0.8, -0.6, -0.4);
        break;

      // --- IOL STEPS ---
      case 'ovd_bag_refill':
      case 'cartridge_insertion':
        this.targetCamPos.set(1.4, 0.8, 3.0);
        this.targetLookAt.set(1.8, 1.0, 0.2);
        break;

      case 'haptic_unfolding':
      case 'sinskey_dialing':
      case 'viscoelastic_washout':
        this.targetCamPos.set(0, 0, 3.2);
        this.targetLookAt.set(0, 0, -0.65);
        break;

      // --- Nd:YAG STEPS ---
      case 'contact_lens_placement':
        this.targetCamPos.set(0, 0, 5.0);
        this.targetLookAt.set(0, 0, 0);
        break;

      case 'aiming_focus':
      case 'offset_adjustment':
        this.targetCamPos.set(0, 0, 2.8);
        this.targetLookAt.set(0, 0, -0.85);
        break;

      case 'cruciate_capsulotomy':
      case 'post_yag_assessment':
        // Macro-zoom into posterior capsule photodisruption zone
        this.targetCamPos.set(0, 0, 2.4);
        this.targetLookAt.set(0, 0, -0.85);
        break;

      // --- GLAUCOMA MIGS STEPS ---
      case 'microscope_and_head_tilt':
      case 'gonioprism_placement':
      case 'viscoelastic_angle_deepening':
        // 38° Gonioscopic angle view
        this.targetCamPos.set(0.4, 2.4, 2.8);
        this.targetLookAt.set(0.6, 3.2, 0.12);
        break;

      case 'stent_1_deployment':
        // Hyper-detailed macro zoom into 2:30 Trabecular Meshwork & Schlemm's canal!
        this.targetCamPos.set(0.6, 2.5, 2.0);
        this.targetLookAt.set(0.89, 3.32, 0.12);
        break;

      case 'stent_2_deployment':
        // Hyper-detailed macro zoom into 4:00 Trabecular Meshwork & Schlemm's canal!
        this.targetCamPos.set(-1.2, 2.2, 2.0);
        this.targetLookAt.set(-1.72, 2.98, 0.12);
        break;

      case 'blood_reflux_and_washout':
        // Macro-zoom on both stents and venous blood reflux wave!
        this.targetCamPos.set(-0.4, 2.2, 2.5);
        this.targetLookAt.set(-0.4, 3.15, 0.12);
        break;

      default:
        this.setCameraPreset('microscope');
        break;
    }
  }

  public setCameraPreset(preset: CameraPresetType): void {
    this.isTransitioningCamera = true;

    switch (preset) {
      case 'microscope':
        this.targetCamPos.set(0, 0, 8.5);
        this.targetLookAt.set(0, 0, 0);
        break;

      case 'glaucoma_angle':
        // Dives into 38° nasal angle directly at Trabecular Meshwork
        this.targetCamPos.set(2.5, 1.7, 1.8);
        this.targetLookAt.set(2.8, 2.0, 0.1);
        break;

      case 'cataract_core':
        this.targetCamPos.set(0.4, 0.3, 3.2);
        this.targetLookAt.set(0, 0, -0.5);
        break;

      case 'yag_capsule':
        this.targetCamPos.set(0, 0, 2.8);
        this.targetLookAt.set(0, 0, -0.85);
        break;

      case 'cross_section':
        this.targetCamPos.set(5.8, 0, 1.2);
        this.targetLookAt.set(0, 0, 0);
        break;
    }
  }

  public setZoom(zoomFactor: number): void {
    this.currentMagnification = zoomFactor;
    const targetDist = 11.0 - (zoomFactor / 45.0) * 8.8;
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.copy(this.controls.target.clone().add(dir.multiplyScalar(Math.max(0.85, targetDist))));
  }

  // =========================================================================
  // MAIN SCENE UPDATE & SYNCHRONIZATION
  // =========================================================================

  public updateState(params: {
    module: SurgicalModule;
    currentStepId?: string;
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

    // Auto-focus on step change if specified
    if (params.currentStepId && params.currentStepId !== this.currentStep) {
      this.focusOnStep(params.currentStepId);
    }

    // 1. Lighting Intensity & Red Reflex
    this.coaxialLight.intensity = (params.coaxialLight / 100.0) * 4.5;
    const reflex = (params.redReflexGain / 100.0) * (params.coaxialLight / 100.0);
    (this.pupilMesh.material as THREE.MeshBasicMaterial).color.setRGB(
      0.88 * reflex,
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

      // Capsulorhexis Window Opening & Peeling Flap
      if (params.cccState.completed) {
        this.anteriorCapsuleMesh.visible = false;
        this.capsulorhexisRimMesh.visible = true;
        this.cccFlapMesh.visible = false;
      } else if (params.cccState.punctured) {
        (this.anteriorCapsuleMesh.material as THREE.MeshStandardMaterial).opacity = 0.15;
        this.capsulorhexisRimMesh.visible = true;
        this.cccFlapMesh.visible = true;
      }

      // Phacoemulsification Nucleus Mass, Trenching & Chopped Quadrants
      const rem = params.nucleusState.remainingMassFraction;
      if (rem > 0.82) {
        this.nucleusMesh.visible = true;
        this.nucleusTrenchMesh.visible = rem < 0.95;
        this.nucleusQuadrants.forEach(q => q.visible = false);
        this.nucleusMesh.scale.set(rem, rem, rem);
      } else {
        // Nucleus cracked into 4 quadrants
        this.nucleusMesh.visible = false;
        this.nucleusTrenchMesh.visible = false;
        this.nucleusQuadrants.forEach((q, idx) => {
          q.visible = rem > idx * 0.18;
          const qScale = Math.max(0.2, rem / 0.82);
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

      // Focus laser reticle
      const targetZ = -0.85 + (params.laserDefocusZ / 1000.0) * 0.5;
      this.yagFocalDot.position.set(this.mouseNorm.x * 1.8, this.mouseNorm.y * 1.8, targetZ);

      // Reconnect aiming beam lines to focal point
      const b1Pos = this.yagAimingCone1.geometry.attributes.position as THREE.BufferAttribute;
      b1Pos.setXYZ(1, this.mouseNorm.x * 1.8, this.mouseNorm.y * 1.8, targetZ);
      b1Pos.needsUpdate = true;

      const b2Pos = this.yagAimingCone2.geometry.attributes.position as THREE.BufferAttribute;
      b2Pos.setXYZ(1, this.mouseNorm.x * 1.8, this.mouseNorm.y * 1.8, targetZ);
      b2Pos.needsUpdate = true;

      // Show ripped tissue leaflets curling open once fired
      if (params.yagState.shots.length > 0) {
        (this.posteriorCapsuleMesh.material as THREE.MeshStandardMaterial).opacity = 0.22;
        this.yagTearLeaflets.forEach(l => l.visible = true);
      }

    } else if (params.module === 'migs') {
      this.lensGroup.visible = false;
      this.iolGroup.visible = true;
      this.yagGroup.visible = false;
      this.angleGroup.visible = true;
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

    // Follow cursor with corneal pivot
    const tx = this.mouseNorm.x * 2.2;
    const ty = this.mouseNorm.y * 2.2;
    currentMesh.position.set(tx, ty, 0.4);

    // Ultrasonic vibration blur when phaco pedal in position 3
    if (activeInstrument === 'phaco_tip' && pedalPosition === 3) {
      currentMesh.position.x += (Math.random() - 0.5) * 0.035;
      currentMesh.position.y += (Math.random() - 0.5) * 0.035;
    }
  }

  public triggerYagPlasmaSpark(x: number, y: number): void {
    // 1. Plasma Spark at focal breakdown
    this.yagPlasmaSpark.position.set(x * 1.8, y * 1.8, -0.85);
    (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity = 1.0;

    // 2. Ultrasonic Cavitation Shockwave Bubble Ring
    this.yagShockwaveMesh.position.set(x * 1.8, y * 1.8, -0.86);
    this.yagShockwaveMesh.scale.set(0.15, 0.15, 0.15);
    (this.yagShockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;

    // 3. Physically rip open the capsular leaflets with ultrasonic tear
    (this.posteriorCapsuleMesh.material as THREE.MeshStandardMaterial).opacity = 0.18;
    this.yagTearLeaflets.forEach(l => {
      l.visible = true;
      l.scale.set(0.1, 0.1, 0.1);
    });
    this.isRippingCapsule = true;
    this.ripProgress = 0;
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

    // Smooth camera transition if interpolating toward target
    if (this.isTransitioningCamera) {
      this.camera.position.lerp(this.targetCamPos, this.transitionSpeed);
      this.controls.target.lerp(this.targetLookAt, this.transitionSpeed);

      if (this.camera.position.distanceTo(this.targetCamPos) < 0.04) {
        this.camera.position.copy(this.targetCamPos);
        this.controls.target.copy(this.targetLookAt);
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

        if (Math.hypot(x, y) < 2.9) {
          const angle = Math.random() * 0.9 + 1.05;
          const r = 3.42 + Math.random() * 0.12;
          x = Math.cos(angle) * r;
          y = Math.sin(angle) * r;
          z = 0.08;
        }
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // Decay YAG plasma spark & expand cavitation shockwave
    if (this.yagPlasmaSpark && (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity > 0) {
      (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity -= 0.06;
    }

    if (this.yagShockwaveMesh && (this.yagShockwaveMesh.material as THREE.MeshBasicMaterial).opacity > 0) {
      this.yagShockwaveMesh.scale.multiplyScalar(1.12);
      (this.yagShockwaveMesh.material as THREE.MeshBasicMaterial).opacity -= 0.04;
    }

    // Dynamic tearing and curling of posterior capsule leaflets
    if (this.isRippingCapsule) {
      this.ripProgress = Math.min(1.0, this.ripProgress + 0.08);
      const s = THREE.MathUtils.lerp(0.1, 1.0, this.ripProgress);
      this.yagTearLeaflets.forEach(l => {
        l.scale.set(s, s, s);
      });
      if (this.ripProgress >= 1.0) {
        this.isRippingCapsule = false;
      }
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
