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
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private pointerNdc: THREE.Vector2 = new THREE.Vector2(0, 0);
  private surgicalPlane: THREE.Plane = new THREE.Plane();
  private planeHitPoint: THREE.Vector3 = new THREE.Vector3();
  private activeInstrumentType: InstrumentType = 'none';
  private currentPedalPos: FootPedalPosition = 0;

  // 3D Interactive Target Guidance (Scales dynamically with zoom & tracks 3D tissue)
  private targetGuideGroup: THREE.Group;
  private targetRingMesh: THREE.Mesh;
  private targetPulseMesh: THREE.Mesh;
  private targetBeaconArrow: THREE.Mesh;
  private currentTargetWorldPos: THREE.Vector3 = new THREE.Vector3();
  private currentTargetWorldRadius: number = 0.45;
  private currentTargetLabel: string = '';
  private currentTargetSubLabel: string = '';
  private targetGuideActive: boolean = true;

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
  private laserDefocusMicrons: number = 150;

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

    // 3D Interactive Target Guidance (Scales dynamically with zoom on tissue)
    this.build3DTargetGuide();

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
    // 3D Refractive Cornea Dome (Anterior curvature radius matching anatomical limbus)
    const geo = new THREE.SphereGeometry(3.6, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xf0fdfa,
      transmission: 0.96,
      transparent: true,
      opacity: 0.18,
      roughness: 0.04,
      metalness: 0.05,
      ior: 1.376,
      depthWrite: false, // CRITICAL: NEVER occlude iris or pupil behind it!
      side: THREE.FrontSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.z = -1.95;
    mesh.renderOrder = 20; // Render after opaque anatomy
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
    // 3D Iris Annular Diaphragm with anatomical 3D conical slope
    const geo = new THREE.RingGeometry(1.48, 3.36, 128, 16);
    
    // Explicit planar UV mapping to avoid any texture stretching
    const pos = geo.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      uvs[i * 2] = (x / 3.36 + 1) / 2;
      uvs[i * 2 + 1] = (y / 3.36 + 1) / 2;
      
      // Gentle anatomical 3D conical vault: ciliary margin at -0.10, collarette at -0.05, pupil rim at -0.08
      const r = Math.hypot(x, y);
      const vault = -0.10 + Math.sin(((r - 1.48) / (3.36 - 1.48)) * Math.PI) * 0.05;
      pos.setZ(i, vault);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();

    // High-fidelity procedural human iris: layered radiating collagen fibers, crypts, collarette, sphincter
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Base stroma: warm, rich hazel-emerald surgical iris gradient
    const grad = ctx.createRadialGradient(512, 512, 180, 512, 512, 510);
    grad.addColorStop(0.0, '#1c130b'); // Pupillary pigmented margin
    grad.addColorStop(0.12, '#38220f'); // Pupillary sphincter zone
    grad.addColorStop(0.38, '#6b4e1e'); // Inner collarette zone (amber/hazel)
    grad.addColorStop(0.55, '#3b5c36'); // Ciliary body transition (emerald/hazel)
    grad.addColorStop(0.82, '#214227'); // Outer stroma
    grad.addColorStop(0.96, '#13281a'); // Pre-limbal rim
    grad.addColorStop(1.0, '#0a140f'); // Limbal junction
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. 720 fine radiating collagenous stromal fibers with realistic stochastic variation
    for (let a = 0; a < 720; a++) {
      const angle = (a / 720) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const startR = 195 + (Math.random() - 0.5) * 15;
      const endR = 495 + (Math.random() - 0.5) * 10;

      ctx.beginPath();
      ctx.moveTo(512 + cosA * startR, 512 + sinA * startR);

      // Slightly wavy trabecular paths
      const midR = (startR + endR) * 0.5;
      const wave = (Math.random() - 0.5) * 6;
      ctx.quadraticCurveTo(
        512 + Math.cos(angle + 0.01) * midR + wave,
        512 + Math.sin(angle + 0.01) * midR + wave,
        512 + cosA * endR,
        512 + sinA * endR
      );

      const alpha = 0.14 + Math.random() * 0.28;
      const isGold = Math.random() > 0.45;
      ctx.strokeStyle = isGold
        ? `rgba(245, 205, 120, ${alpha})`
        : `rgba(180, 230, 190, ${alpha * 0.85})`;
      ctx.lineWidth = Math.random() * 1.6 + 0.6;
      ctx.stroke();
    }

    // 3. Fuchs' crypts & lacunae (microscopic depressions in the stroma)
    ctx.fillStyle = 'rgba(20, 15, 8, 0.45)';
    for (let i = 0; i < 90; i++) {
      const ca = Math.random() * Math.PI * 2;
      const cr = 260 + Math.random() * 180;
      ctx.beginPath();
      ctx.ellipse(512 + Math.cos(ca) * cr, 512 + Math.sin(ca) * cr, Math.random() * 8 + 3, Math.random() * 4 + 2, ca, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Undulating Collarette Ridge
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.4)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let a = 0; a <= 128; a++) {
      const angle = (a / 128) * Math.PI * 2;
      const r = 295 + Math.sin(angle * 14) * 8 + Math.cos(angle * 7) * 5;
      const x = 512 + Math.cos(angle) * r;
      const y = 512 + Math.sin(angle) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // 5. Contraction furrows in outer ciliary zone
    ctx.strokeStyle = 'rgba(10, 25, 15, 0.35)';
    ctx.lineWidth = 2.0;
    [380, 425, 465].forEach(furrowR => {
      ctx.beginPath();
      ctx.arc(512, 512, furrowR, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 6. Distinct dark pupillary sphincter ring
    ctx.strokeStyle = 'rgba(15, 10, 5, 0.85)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(512, 512, 210, 0, Math.PI * 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.52,
      metalness: 0.05,
      side: THREE.FrontSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = 0.0;
    mesh.renderOrder = 5;
    return mesh;
  }

  private buildPupil(): THREE.Mesh {
    // Coaxial Red Reflex Retro-illumination Backdrop (Fundus reflection behind crystalline lens)
    const geo = new THREE.CircleGeometry(1.52, 64);
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Warm retinal choroidal red reflex glow
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
    grad.addColorStop(0.0, '#e11d48'); // Bright central coaxial red reflex
    grad.addColorStop(0.35, '#b91c1c'); // Retinal retro-illumination
    grad.addColorStop(0.75, '#450a0a'); // Peripheral falloff
    grad.addColorStop(1.0, '#050202'); // Deep fundus black
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.92
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -0.75; // Safely behind cataract core & anterior capsule
    mesh.renderOrder = 2;
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
    const acGeo = new THREE.SphereGeometry(2.1, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const acMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.12,
      side: THREE.DoubleSide
    });
    this.anteriorCapsuleMesh = new THREE.Mesh(acGeo, acMat);
    this.anteriorCapsuleMesh.rotation.x = Math.PI / 2;
    this.anteriorCapsuleMesh.position.z = -0.48;
    this.lensGroup.add(this.anteriorCapsuleMesh);

    // 5.5mm Capsulorhexis Circular Rim Line
    const rimPoints: THREE.Vector3[] = [];
    const rRadius = 1.25;
    for (let a = 0; a <= 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      rimPoints.push(new THREE.Vector3(Math.cos(th) * rRadius, Math.sin(th) * rRadius, -0.15));
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
    this.cccFlapMesh.position.set(0.35, 0.35, -0.13);
    this.cccFlapMesh.rotation.x = 0.5;
    this.cccFlapMesh.visible = false;
    this.lensGroup.add(this.cccFlapMesh);

    // 2. Cataract Core (LOCS III NO3 Nuclear Cataract - safely behind iris aperture)
    const nGeo = new THREE.SphereGeometry(2.05, 48, 32);
    nGeo.scale(1, 1, 0.22);
    const nMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber golden nuclear grade
      roughness: 0.55,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94
    });
    this.nucleusMesh = new THREE.Mesh(nGeo, nMat);
    this.nucleusMesh.position.z = -0.42;
    this.lensGroup.add(this.nucleusMesh);

    // Deep Phaco Trench Groove (Sculpted central canal)
    const trGeo = new THREE.BoxGeometry(0.45, 2.6, 0.38);
    const trMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.7
    });
    this.nucleusTrenchMesh = new THREE.Mesh(trGeo, trMat);
    this.nucleusTrenchMesh.position.set(0, 0, -0.38);
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
      const qGeo = new THREE.CylinderGeometry(1.05, 0.16, 0.38, 16, 1, false, 0, Math.PI * 0.46);
      const qMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.6,
        transparent: true,
        opacity: 0.92
      });
      const qMesh = new THREE.Mesh(qGeo, qMat);
      qMesh.rotation.x = Math.PI / 2;
      qMesh.rotation.z = q.rotZ;
      qMesh.position.set(q.x, q.y, -0.42);
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
    // 1. Phaco Handpiece & Titanium Ultrasound Tip (Tip precisely at origin 0,0,0)
    const phacoObj = new THREE.Group();
    const needleGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.55, 16);
    needleGeo.translate(0, 0.275, 0);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    phacoObj.add(new THREE.Mesh(needleGeo, needleMat));

    const sleeveGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.8, 16);
    sleeveGeo.translate(0, 0.9, 0);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.1 });
    phacoObj.add(new THREE.Mesh(sleeveGeo, sleeveMat));

    const handleGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.5, 16);
    handleGeo.translate(0, 2.55, 0);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 });
    phacoObj.add(new THREE.Mesh(handleGeo, handleMat));
    this.instrumentMeshes.set('phaco_tip', phacoObj);

    // 2. MVR Blade (1.0mm) - Micro-lancet with tip at (0,0,0)
    const mvrObj = new THREE.Group();
    const mvrBladeGeo = new THREE.ConeGeometry(0.05, 0.42, 4);
    mvrBladeGeo.rotateZ(Math.PI);
    mvrBladeGeo.rotateY(Math.PI / 4);
    mvrBladeGeo.translate(0, 0.21, 0);
    const mvrBladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
    mvrObj.add(new THREE.Mesh(mvrBladeGeo, mvrBladeMat));

    const mvrCollarGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 16);
    mvrCollarGeo.translate(0, 0.55, 0);
    mvrObj.add(new THREE.Mesh(mvrCollarGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })));

    const mvrHandleGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.4, 16);
    mvrHandleGeo.translate(0, 1.9, 0);
    mvrObj.add(new THREE.Mesh(mvrHandleGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })));
    this.instrumentMeshes.set('mvr_blade', mvrObj);

    // 3. Clear Corneal Keratome (2.4mm) - Beveled trapezoidal diamond blade
    const keratomeObj = new THREE.Group();
    const kBladeGeo = new THREE.BoxGeometry(0.24, 0.48, 0.02);
    kBladeGeo.translate(0, 0.24, 0);
    keratomeObj.add(new THREE.Mesh(kBladeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 })));

    const kCollarGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16);
    kCollarGeo.translate(0, 0.63, 0);
    keratomeObj.add(new THREE.Mesh(kCollarGeo, new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })));

    const kHandleGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.4, 16);
    kHandleGeo.translate(0, 1.95, 0);
    keratomeObj.add(new THREE.Mesh(kHandleGeo, new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4 })));
    this.instrumentMeshes.set('keratome_2_4', keratomeObj);

    // 4. Cystotome (27G bent needle for capsulorhexis puncture)
    const cystoObj = new THREE.Group();
    const tipCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.08, -0.06));
    const cystoTipGeo = new THREE.TubeGeometry(tipCurve, 8, 0.016, 8, false);
    const cystoMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    cystoObj.add(new THREE.Mesh(cystoTipGeo, cystoMat));

    const cystoShaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.22, 16);
    cystoShaftGeo.translate(0, 0.69, -0.06);
    cystoObj.add(new THREE.Mesh(cystoShaftGeo, cystoMat));

    const hubGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.5, 16);
    hubGeo.translate(0, 1.55, -0.06);
    cystoObj.add(new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })));

    const syringeGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 16);
    syringeGeo.translate(0, 2.7, -0.06);
    cystoObj.add(new THREE.Mesh(syringeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));
    this.instrumentMeshes.set('cystotome', cystoObj);

    // 5. Utrata Forceps (Continuous Curvilinear Capsulorhexis Micro-forceps)
    const utrataObj = new THREE.Group();
    const jaw1Curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.05, 0.35, 0),
      new THREE.Vector3(-0.03, 0.8, 0)
    );
    const jaw2Curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.05, 0.35, 0),
      new THREE.Vector3(0.03, 0.8, 0)
    );
    const jawMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.2 });
    utrataObj.add(new THREE.Mesh(new THREE.TubeGeometry(jaw1Curve, 12, 0.018, 8, false), jawMat));
    utrataObj.add(new THREE.Mesh(new THREE.TubeGeometry(jaw2Curve, 12, 0.018, 8, false), jawMat));

    const utrataHandleGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.2, 16);
    utrataHandleGeo.translate(0, 1.9, 0);
    utrataObj.add(new THREE.Mesh(utrataHandleGeo, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })));
    this.instrumentMeshes.set('utrata_forceps', utrataObj);

    // 6. Chang Hydrodissection Cannula (Flat-tipped hydro-cannula)
    const hydroObj = new THREE.Group();
    const hydroTipGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12);
    hydroTipGeo.translate(0, 0.075, 0);
    const hydroMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    hydroObj.add(new THREE.Mesh(hydroTipGeo, hydroMat));

    const hydroShaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 12);
    hydroShaftGeo.translate(0, 0.75, 0);
    hydroObj.add(new THREE.Mesh(hydroShaftGeo, hydroMat));

    const hydroSyringeGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 16);
    hydroSyringeGeo.translate(0, 2.25, 0);
    hydroObj.add(new THREE.Mesh(hydroSyringeGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })));
    this.instrumentMeshes.set('hydro_cannula', hydroObj);

    // 7. OVD Injection Cannulas (Viscoat dispersive & Provisc cohesive)
    const buildOvdObj = (isViscoat: boolean) => {
      const ovdObj = new THREE.Group();
      const cannulaTip = new THREE.CylinderGeometry(0.022, 0.022, 0.85, 12);
      cannulaTip.translate(0, 0.425, 0);
      ovdObj.add(new THREE.Mesh(cannulaTip, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })));

      const syringe = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 16);
      syringe.translate(0, 1.75, 0);
      ovdObj.add(new THREE.Mesh(syringe, new THREE.MeshStandardMaterial({
        color: isViscoat ? 0xf59e0b : 0x0284c7,
        transparent: true,
        opacity: 0.65
      })));
      return ovdObj;
    };
    this.instrumentMeshes.set('ovd_viscoat', buildOvdObj(true));
    this.instrumentMeshes.set('ovd_provisc', buildOvdObj(false));

    // 8. I/A Handpiece (Irrigation & Aspiration coaxial handpiece)
    const iaObj = new THREE.Group();
    const iaTipGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.65, 16);
    iaTipGeo.translate(0, 0.325, 0);
    const iaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    iaObj.add(new THREE.Mesh(iaTipGeo, iaMat));

    const iaHandleGeo = new THREE.CylinderGeometry(0.16, 0.2, 2.4, 16);
    iaHandleGeo.translate(0, 1.85, 0);
    iaObj.add(new THREE.Mesh(iaHandleGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 })));
    this.instrumentMeshes.set('ia_handpiece', iaObj);

    // 9. Foldable IOL Injector Nozzle
    const iolInjObj = new THREE.Group();
    const nozzleGeo = new THREE.ConeGeometry(0.08, 0.65, 12);
    nozzleGeo.rotateZ(Math.PI);
    nozzleGeo.translate(0, 0.325, 0);
    iolInjObj.add(new THREE.Mesh(nozzleGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })));

    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.24, 2.6, 16);
    bodyGeo.translate(0, 1.95, 0);
    iolInjObj.add(new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.3 })));
    this.instrumentMeshes.set('iol_injector', iolInjObj);

    // 10. Sinskey Micro-Hook
    const sinskeyObj = new THREE.Group();
    const hookCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0, 0));
    sinskeyObj.add(new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 4, 0.015, 8, false), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 })));

    const sinskeyShaftGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.2, 12);
    sinskeyShaftGeo.translate(0.05, 0.6, 0);
    sinskeyObj.add(new THREE.Mesh(sinskeyShaftGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 })));

    const sinskeyHandleGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 16);
    sinskeyHandleGeo.translate(0.05, 2.3, 0);
    sinskeyObj.add(new THREE.Mesh(sinskeyHandleGeo, new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 })));
    this.instrumentMeshes.set('sinskey_hook', sinskeyObj);

    // 11. MIGS Stent Injector Trocar
    const migsObj = new THREE.Group();
    const trocarGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.7, 16);
    trocarGeo.translate(0, 0.35, 0);
    migsObj.add(new THREE.Mesh(trocarGeo, new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1 })));

    const migsHandleGeo = new THREE.CylinderGeometry(0.15, 0.16, 2.6, 16);
    migsHandleGeo.translate(0, 2.0, 0);
    migsObj.add(new THREE.Mesh(migsHandleGeo, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })));

    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    wheelGeo.translate(0, 1.8, 0.1);
    migsObj.add(new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 })));
    this.instrumentMeshes.set('migs_injector', migsObj);

    // Add all instruments to group but hidden initially
    this.instrumentMeshes.forEach((mesh) => {
      mesh.visible = false;
      this.instrumentGroup.add(mesh);
    });
  }

  // =========================================================================
  // 3D SURGICAL TARGET GUIDANCE (SCALES DYNAMICALLY WITH ZOOM & ORBIT)
  // =========================================================================

  private build3DTargetGuide(): void {
    this.targetGuideGroup = new THREE.Group();
    this.eyeGroup.add(this.targetGuideGroup);

    // 1. Primary Glowing 3D Target Torus Ring
    const torusGeo = new THREE.TorusGeometry(0.42, 0.035, 16, 48);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8
    });
    this.targetRingMesh = new THREE.Mesh(torusGeo, torusMat);
    this.targetGuideGroup.add(this.targetRingMesh);

    // 2. Secondary Pulsing Concentric Radar Ring
    const pulseGeo = new THREE.RingGeometry(0.38, 0.46, 48);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    this.targetPulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    this.targetGuideGroup.add(this.targetPulseMesh);

    // 3. 3D Floating Pointer Arrow Beacon (pointing directly to incision point)
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
    arrowGeo.rotateX(Math.PI); // Tip points towards tissue!
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    this.targetBeaconArrow = new THREE.Mesh(arrowGeo, arrowMat);
    this.targetBeaconArrow.position.z = 0.55;
    this.targetGuideGroup.add(this.targetBeaconArrow);

    this.targetGuideGroup.visible = false;
  }

  public updateTargetGuide(stepId: string): void {
    if (!this.targetGuideGroup) return;

    const targetPos = new THREE.Vector3();
    let targetRadius = 0.42;
    let color = 0x38bdf8;
    let label = '';
    let subLabel = '';

    switch (stepId) {
      case 'paracentesis':
        targetPos.set(-2.82, 1.63, 0.22);
        targetRadius = 0.38;
        color = 0xf59e0b; // Amber
        label = 'PARACENTESIS INCISION (10:00)';
        subLabel = '1.0mm MVR Blade: Cut side-port parallel to iris';
        break;

      case 'clear_corneal_incision':
        targetPos.set(2.35, 2.35, 0.22);
        targetRadius = 0.52;
        color = 0x00d2ff; // Cyan
        label = 'CLEAR CORNEAL TUNNEL (1:30)';
        subLabel = '2.4mm Keratome: Tri-planar self-sealing incision';
        break;

      case 'ovd_injection':
        targetPos.set(0, 0, 0.05);
        targetRadius = 0.75;
        color = 0x10b981; // Emerald
        label = 'OVD VISCOELASTIC INJECTION';
        subLabel = 'Viscoat: Coat corneal endothelium';
        break;

      case 'capsulorhexis':
        targetPos.set(0, 0, -0.16);
        targetRadius = 1.25; // 5.5mm CCC ring!
        color = 0x38bdf8;
        label = '5.5mm CAPSULORHEXIS (CCC)';
        subLabel = 'Utrata Forceps: Continuous circular tear';
        break;

      case 'hydrodissection':
        targetPos.set(0, 1.25, -0.18);
        targetRadius = 0.45;
        color = 0x00d2ff;
        label = 'HYDRODISSECTION (12:00)';
        subLabel = 'Hydro Cannula: Cleave cortex from capsule';
        break;

      case 'phaco_chop':
        targetPos.set(0, 0, -0.35);
        targetRadius = 0.85;
        color = 0xf59e0b;
        label = 'PHACO NUCLEOFRACTIS';
        subLabel = 'Phaco Tip: Sculpt trench & emulsify quadrants';
        break;

      case 'cortex_removal':
        targetPos.set(0.85, -0.65, -0.30);
        targetRadius = 0.65;
        color = 0x00d2ff;
        label = 'CORTEX REMOVAL';
        subLabel = 'I/A Handpiece: Vacuum cortical remnants';
        break;

      case 'stent_1_deployment':
        targetPos.set(0.89, 3.32, 0.12);
        targetRadius = 0.28;
        color = 0xf59e0b;
        label = 'TRABECULAR MESHWORK STENT 1 (2:30)';
        subLabel = 'MIGS Injector: Deploy stent into Schlemm canal';
        break;

      case 'stent_2_deployment':
        targetPos.set(-1.72, 2.98, 0.12);
        targetRadius = 0.28;
        color = 0x00d2ff;
        label = 'TRABECULAR MESHWORK STENT 2 (4:00)';
        subLabel = 'MIGS Injector: Deploy 2nd stent 2 clock hours away';
        break;

      case 'cruciate_capsulotomy':
        targetPos.set(0, 0, -0.85);
        targetRadius = 0.95;
        color = 0xef4444; // Rose
        label = 'CRUCIATE CAPSULOTOMY';
        subLabel = 'Nd:YAG Laser: Photodisrupt posterior capsule';
        break;

      default:
        this.targetGuideGroup.visible = false;
        return;
    }

    this.currentTargetWorldPos.copy(targetPos);
    this.currentTargetWorldRadius = targetRadius;
    this.currentTargetLabel = label;
    this.currentTargetSubLabel = subLabel;

    this.targetGuideGroup.position.copy(targetPos);
    this.targetGuideGroup.visible = this.targetGuideActive;

    const scale = targetRadius / 0.42;
    this.targetRingMesh.scale.set(scale, scale, scale);
    this.targetPulseMesh.scale.set(scale, scale, scale);

    (this.targetRingMesh.material as THREE.MeshStandardMaterial).color.setHex(color);
    (this.targetRingMesh.material as THREE.MeshStandardMaterial).emissive.setHex(color);
    (this.targetPulseMesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    (this.targetBeaconArrow.material as THREE.MeshStandardMaterial).color.setHex(color);
    (this.targetBeaconArrow.material as THREE.MeshStandardMaterial).emissive.setHex(color);
  }

  public getStepTargetScreenPos(): {
    x: number;
    y: number;
    visible: boolean;
    label: string;
    subLabel: string;
    screenRadius: number;
  } | null {
    if (!this.targetGuideGroup || !this.targetGuideGroup.visible) return null;

    const targetWorldPos = this.currentTargetWorldPos.clone();
    const projected = targetWorldPos.project(this.camera);

    if (projected.z > 1.0) return null;

    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    const screenX = (projected.x * 0.5 + 0.5) * w;
    const screenY = (-projected.y * 0.5 + 0.5) * h;

    const dist = this.camera.position.distanceTo(targetWorldPos);
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const screenRadius = Math.max(
      14,
      (this.currentTargetWorldRadius / (2 * Math.tan(fovRad / 2) * Math.max(0.5, dist))) * h
    );

    return {
      x: screenX,
      y: screenY,
      visible: true,
      label: this.currentTargetLabel,
      subLabel: this.currentTargetSubLabel,
      screenRadius
    };
  }

  // =========================================================================
  // STEP-SPECIFIC AUTOMATIC ZOOM & FRAMING
  // =========================================================================

  public focusOnStep(stepId: string): void {
    this.currentStep = stepId;
    this.isTransitioningCamera = true;
    this.updateTargetGuide(stepId);

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

      // Foldable IOL unfolding, rotation & centration in 3D
      const prog = params.iolState.insertionProgressFraction || 0;
      if (prog > 0.1 || params.iolState.opticInChamber) {
        this.iolGroup.visible = true;
        this.iolOpticMesh.visible = true;
        this.iolHapticLeading.visible = true;
        this.iolHapticTrailing.visible = true;

        // Animate unfolding scale as injector advances
        const scaleFactor = Math.min(1.0, 0.45 + prog * 0.55);
        this.iolGroup.scale.set(scaleFactor, scaleFactor, 1.0);

        // Rotate lens dynamically when dialed with Sinskey hook
        const rotRad = ((params.iolState.rotationDeg || 0) * Math.PI) / 180;
        this.iolGroup.rotation.z = rotRad;

        // Centration offset
        const cx = (params.iolState.centrationOffsetMm?.x || 0) * 0.35;
        const cy = (params.iolState.centrationOffsetMm?.y || 0) * 0.35;
        this.iolGroup.position.set(cx, cy, -0.65);
      } else {
        this.iolGroup.visible = false;
      }

    } else if (params.module === 'yag') {
      this.lensGroup.visible = false;
      this.iolGroup.visible = true; // Pseudophakic eye
      this.yagGroup.visible = true;
      this.angleGroup.visible = false;
      this.gonioprismMesh.visible = false;

      this.laserDefocusMicrons = params.laserDefocusZ;
      this.updateYagReticle();

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

  public setPointerPosition(ndcX: number, ndcY: number, isDown: boolean): void {
    this.pointerNdc.set(ndcX, ndcY);
    this.mouseNorm.x = ndcX;
    this.mouseNorm.y = ndcY;
    this.mouseNorm.isDown = isDown;
    this.updateInstrumentPosition(this.activeInstrumentType, this.currentPedalPos);
    if (this.currentModule === 'yag') {
      this.updateYagReticle();
    }
  }

  private updateYagReticle(): void {
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const targetZ = -0.85 + (this.laserDefocusMicrons / 1000.0) * 0.5;
    const capsulePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -targetZ);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(capsulePlane, hit)) {
      this.yagFocalDot.position.copy(hit);

      const b1Pos = this.yagAimingCone1.geometry.attributes.position as THREE.BufferAttribute;
      b1Pos.setXYZ(1, hit.x, hit.y, hit.z);
      b1Pos.needsUpdate = true;

      const b2Pos = this.yagAimingCone2.geometry.attributes.position as THREE.BufferAttribute;
      b2Pos.setXYZ(1, hit.x, hit.y, hit.z);
      b2Pos.needsUpdate = true;
    }
  }

  private updateInstrumentPosition(activeInstrument: InstrumentType, pedalPosition: FootPedalPosition): void {
    this.activeInstrumentType = activeInstrument;
    this.currentPedalPos = pedalPosition;

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

    // Raycast from camera using Normalized Device Coordinates (NDC [-1, 1])
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);

    // Working plane parallel to camera view passing through controls.target
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const planeNormal = camDir.clone().negate();
    this.surgicalPlane.setFromNormalAndCoplanarPoint(planeNormal, this.controls.target);

    if (this.raycaster.ray.intersectPlane(this.surgicalPlane, this.planeHitPoint)) {
      currentMesh.position.copy(this.planeHitPoint);

      // Align instrument handle back towards surgeon's hands entering field
      const holdVectorInCam = new THREE.Vector3(0.35, 0.52, 0.78).normalize();
      const alignWithHandle = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        holdVectorInCam
      );
      currentMesh.quaternion.copy(this.camera.quaternion).multiply(alignWithHandle);

      // Ultrasonic vibration blur when phaco pedal in position 3
      if (activeInstrument === 'phaco_tip' && pedalPosition === 3) {
        currentMesh.position.x += (Math.random() - 0.5) * 0.035;
        currentMesh.position.y += (Math.random() - 0.5) * 0.035;
      }
    }
  }

  public triggerYagPlasmaSpark(x: number, y: number): void {
    // 1. Plasma Spark at focal breakdown location
    const focalPos = this.yagFocalDot.position.clone();
    this.yagPlasmaSpark.position.copy(focalPos);
    (this.yagPlasmaSpark.material as THREE.MeshBasicMaterial).opacity = 1.0;

    // 2. Ultrasonic Cavitation Shockwave Bubble Ring
    this.yagShockwaveMesh.position.copy(focalPos);
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

    // Dynamic 3D target beacon pulsation (scales smoothly with 3D zoom & perspective)
    if (this.targetGuideGroup && this.targetGuideGroup.visible) {
      const t = performance.now() * 0.005;
      const pulse = Math.sin(t) * 0.5 + 0.5;
      const scale = (this.currentTargetWorldRadius / 0.42) * (1.0 + pulse * 0.25);
      this.targetPulseMesh.scale.set(scale, scale, scale);
      (this.targetPulseMesh.material as THREE.MeshBasicMaterial).opacity = 0.65 - pulse * 0.45;
      this.targetBeaconArrow.position.z = 0.55 + Math.sin(t * 1.5) * 0.08;
    }

    // Continuously keep instrument locked to mouse cursor relative to current camera perspective
    if (this.activeInstrumentType && this.activeInstrumentType !== 'none') {
      this.updateInstrumentPosition(this.activeInstrumentType, this.currentPedalPos);
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
