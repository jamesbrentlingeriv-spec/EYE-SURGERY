import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  SurgicalModule,
  InstrumentType,
  FootPedalPosition,
  FluidicsState,
  CapsulorhexisState,
  HydrodissectionState,
  PhacoNucleusState,
  IolPositionState,
  YagCapsulotomyState,
  YagLaserSettings,
  IncisionPoint
} from '../types/ophthalmic';
import { audioEngine } from '../audio/SoundSynthesizer';
import { ZoomIn, ZoomOut, Eye, Camera, Image, Layers, Sparkles, X } from 'lucide-react';

interface SurgicalViewportProps {
  module: SurgicalModule;
  activeInstrument: InstrumentType;
  pedalPosition: FootPedalPosition;
  fluidics: FluidicsState;
  cccState: CapsulorhexisState;
  hydroState: HydrodissectionState;
  nucleusState: PhacoNucleusState;
  iolState: IolPositionState;
  yagState: YagCapsulotomyState;
  yagSettings: YagLaserSettings;
  incisions: IncisionPoint[];
  ovdCoverage: { dispersive: number; cohesive: number };
  onIncisionAdvance: (type: 'paracentesis' | 'clear_corneal') => void;
  onOvdInject: (type: 'viscoat' | 'provisc') => void;
  onCccPuncture: (x: number, y: number) => void;
  onCccDrag: (x: number, y: number) => void;
  onHydroPulse: () => void;
  onHydroRotate: (deg: number) => void;
  onPhacoApply: (coords: { x: number; y: number; z: number }) => void;
  onIaAspirate: (coords: { x: number; y: number }) => void;
  onIolAdvance: () => void;
  onIolDial: (deg: number, dx: number, dy: number) => void;
  onIolWashout: () => void;
  onYagFire: (x: number, y: number, zMicrons: number) => void;
}

export type ViewportRenderMode = 'photo' | 'hybrid' | 'shader';

export const SurgicalViewport: React.FC<SurgicalViewportProps> = ({
  module,
  activeInstrument,
  pedalPosition,
  fluidics,
  cccState,
  hydroState,
  nucleusState,
  iolState,
  yagState,
  yagSettings,
  incisions,
  ovdCoverage,
  onIncisionAdvance,
  onOvdInject,
  onCccPuncture,
  onCccDrag,
  onHydroPulse,
  onPhacoApply,
  onIaAspirate,
  onIolAdvance,
  onIolDial,
  onIolWashout,
  onYagFire,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Optical Controls State
  const [renderMode, setRenderMode] = useState<ViewportRenderMode>('photo'); // 'photo' = actual eye photography
  const [magnification, setMagnification] = useState<number>(12); // 6x to 25x
  const [coaxialLight, setCoaxialLight] = useState<number>(92); // 0 to 100%
  const [redReflexGain, setRedReflexGain] = useState<number>(88); // 0 to 100%
  const [laserDefocusZ, setLaserDefocusZ] = useState<number>(150); // µm offset for YAG focus
  const [showOptics, setShowOptics] = useState<boolean>(false); // Collapsed on mobile by default to preserve eye view

  // Pre-loaded Real Eye Image Elements
  const cataractImgRef = useRef<HTMLImageElement | null>(null);
  const iolImgRef = useRef<HTMLImageElement | null>(null);
  const yagImgRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

  // Mouse & Interaction Tracking
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [plasmaSparks, setPlasmaSparks] = useState<Array<{ x: number; y: number; age: number }>>([]);

  // Load actual eye photography assets
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        setImagesLoaded(true);
      }
    };

    const cImg = new window.Image();
    cImg.src = '/images/cataract_eye.jpg';
    cImg.onload = checkLoaded;
    cataractImgRef.current = cImg;

    const iImg = new window.Image();
    iImg.src = '/images/iol_eye.jpg';
    iImg.onload = checkLoaded;
    iolImgRef.current = iImg;

    const yImg = new window.Image();
    yImg.src = '/images/yag_pco_eye.jpg';
    yImg.onload = checkLoaded;
    yagImgRef.current = yImg;
  }, []);

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    eyeGlobe: THREE.Mesh;
    irisMesh: THREE.Mesh;
    pupilMesh: THREE.Mesh;
    lensMesh: THREE.Mesh;
    capsuleMesh: THREE.Mesh;
    corneaMesh: THREE.Mesh;
    coaxialLightObj: THREE.PointLight;
    specularLightObj: THREE.DirectionalLight;
    animFrameId: number;
  } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = null; // Transparent background to allow layering

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Coaxial Light Source
    const coaxialLightObj = new THREE.PointLight(0xffeedd, 2.5, 20);
    coaxialLightObj.position.set(0, 0, 7.5);
    scene.add(coaxialLightObj);

    // Oblique specular light for corneal reflections
    const specularLightObj = new THREE.DirectionalLight(0xffffff, 1.2);
    specularLightObj.position.set(2, 4, 6);
    scene.add(specularLightObj);

    const ambientLight = new THREE.AmbientLight(0x223344, 0.6);
    scene.add(ambientLight);

    // 1. Sclera / Eye Globe
    const scleraGeo = new THREE.RingGeometry(3.6, 5.2, 64);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.35,
      metalness: 0.05
    });
    const scleraMesh = new THREE.Mesh(scleraGeo, scleraMat);
    scene.add(scleraMesh);

    // 2. Limbal Arcade
    const limbusGeo = new THREE.RingGeometry(3.4, 3.65, 64);
    const limbusMat = new THREE.MeshBasicMaterial({
      color: 0x3d4f58,
      transparent: true,
      opacity: 0.75
    });
    const limbusMesh = new THREE.Mesh(limbusGeo, limbusMat);
    scene.add(limbusMesh);

    // 3. Iris Structure
    const irisGeo = new THREE.RingGeometry(2.35, 3.45, 64);
    const irisCanvas = document.createElement('canvas');
    irisCanvas.width = 512;
    irisCanvas.height = 512;
    const ictx = irisCanvas.getContext('2d')!;
    const grad = ictx.createRadialGradient(256, 256, 120, 256, 256, 256);
    grad.addColorStop(0, '#1c4a75');
    grad.addColorStop(0.5, '#296ca8');
    grad.addColorStop(1, '#0e2b46');
    ictx.fillStyle = grad;
    ictx.fillRect(0, 0, 512, 512);

    ictx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ictx.lineWidth = 1.5;
    for (let a = 0; a < 360; a += 1.8) {
      const rad = (a * Math.PI) / 180;
      ictx.beginPath();
      ictx.moveTo(256 + Math.cos(rad) * 130, 256 + Math.sin(rad) * 130);
      ictx.lineTo(256 + Math.cos(rad) * 250, 256 + Math.sin(rad) * 250);
      ictx.stroke();
    }
    const irisTex = new THREE.CanvasTexture(irisCanvas);
    const irisMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.7,
      metalness: 0.1
    });
    const irisMesh = new THREE.Mesh(irisGeo, irisMat);
    scene.add(irisMesh);

    // 4. Red Reflex / Pupillary Aperture
    const pupilGeo = new THREE.CircleGeometry(2.36, 64);
    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0xcc2a10,
      transparent: true,
      opacity: 0.92
    });
    const pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
    pupilMesh.position.z = -0.05;
    scene.add(pupilMesh);

    // 5. Crystalline Lens / Cataract Core
    const lensGeo = new THREE.CircleGeometry(2.35, 64);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xd49b35,
      transparent: true,
      opacity: 0.88,
      roughness: 0.5,
      metalness: 0.1
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.z = 0.02;
    scene.add(lensMesh);

    // 6. Anterior Lens Capsule with reflective sheen
    const capsuleGeo = new THREE.CircleGeometry(2.38, 64);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.15,
      metalness: 0.3
    });
    const capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
    capsuleMesh.position.z = 0.06;
    scene.add(capsuleMesh);

    // 7. Transparent Cornea Dome
    const corneaGeo = new THREE.SphereGeometry(3.7, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.38);
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.376
    });
    const corneaMesh = new THREE.Mesh(corneaGeo, corneaMat);
    corneaMesh.position.z = 0.45;
    scene.add(corneaMesh);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    threeRef.current = {
      scene,
      camera,
      renderer,
      eyeGlobe: scleraMesh,
      irisMesh,
      pupilMesh,
      lensMesh,
      capsuleMesh,
      corneaMesh,
      coaxialLightObj,
      specularLightObj,
      animFrameId: animId
    };

    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      threeRef.current.camera.aspect = nw / nh;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Update Three.js parameters
  useEffect(() => {
    if (!threeRef.current) return;
    const { camera, coaxialLightObj, pupilMesh, lensMesh, irisMesh, eyeGlobe, corneaMesh } = threeRef.current;

    // Visibility toggle based on renderMode
    const show3d = renderMode === 'shader' || renderMode === 'hybrid';
    if (eyeGlobe) eyeGlobe.visible = show3d;
    if (irisMesh) irisMesh.visible = show3d;
    if (pupilMesh) pupilMesh.visible = show3d;
    if (lensMesh) lensMesh.visible = show3d;
    if (corneaMesh) corneaMesh.visible = true; // Always keep cornea specular reflections

    const targetZ = 12.0 - (magnification / 25.0) * 7.5;
    camera.position.z = targetZ;

    coaxialLightObj.intensity = (coaxialLight / 100.0) * 3.5;

    const reflexIntensity = (redReflexGain / 100.0) * (coaxialLight / 100.0);
    (pupilMesh.material as THREE.MeshBasicMaterial).color.setRGB(
      0.85 * reflexIntensity,
      0.22 * reflexIntensity,
      0.08 * reflexIntensity
    );

    if (module === 'phaco') {
      const remaining = nucleusState.remainingMassFraction;
      (lensMesh.material as THREE.MeshStandardMaterial).opacity = 0.88 * remaining;
    } else if (module === 'iol') {
      (lensMesh.material as THREE.MeshStandardMaterial).opacity = 0.05;
    } else if (module === 'yag') {
      (lensMesh.material as THREE.MeshStandardMaterial).opacity = 0.45;
      (lensMesh.material as THREE.MeshStandardMaterial).color.setRGB(0.95, 0.9, 0.8);
    }
  }, [magnification, coaxialLight, redReflexGain, module, nucleusState.remainingMassFraction, renderMode]);

  // Master 2D High-Resolution Composite Rendering (Real Eye Photo + Dynamic Surgical Overlays)
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const renderOverlay = () => {
      animId = requestAnimationFrame(renderOverlay);

      const width = canvas.width = containerRef.current?.clientWidth || 800;
      const height = canvas.height = containerRef.current?.clientHeight || 600;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const zoomFactor = magnification / 12;
      const eyeRadiusPx = 175 * zoomFactor;

      // ==========================================
      // LAYER 1: ACTUAL CLINICAL PHOTOGRAPH
      // ==========================================
      if (renderMode === 'photo' || renderMode === 'hybrid') {
        let activeImg: HTMLImageElement | null = null;
        if (module === 'phaco') {
          activeImg = cataractImgRef.current;
        } else if (module === 'iol') {
          activeImg = iolImgRef.current;
        } else if (module === 'yag') {
          activeImg = yagImgRef.current;
        }

        if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
          ctx.save();
          // Draw circular eye photo frame
          const imgSize = eyeRadiusPx * 2.35;
          ctx.beginPath();
          ctx.arc(centerX, centerY, eyeRadiusPx * 1.15, 0, Math.PI * 2);
          ctx.clip();

          // Draw the high-resolution clinical photograph
          ctx.drawImage(
            activeImg,
            centerX - imgSize / 2,
            centerY - imgSize / 2,
            imgSize,
            imgSize
          );

          // Coaxial lighting illumination gain over photo
          if (coaxialLight < 100 || redReflexGain < 100) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 1.0 - (coaxialLight / 100) * 0.9)})`;
            ctx.fillRect(centerX - imgSize / 2, centerY - imgSize / 2, imgSize, imgSize);
          }

          ctx.restore();

          // Subtle surgical retractor shadow and sterile rim
          ctx.save();
          ctx.strokeStyle = '#253549';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, eyeRadiusPx * 1.15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ==========================================
      // LAYER 2: BIOMECHANICAL TISSUE DYNAMICS
      // ==========================================

      // A. Corneal Striae / Folds if IOP < 6.5 mmHg
      if (fluidics.cornealFoldsPresent) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX - eyeRadiusPx * 0.8, centerY + i * 24);
          ctx.bezierCurveTo(
            centerX - eyeRadiusPx * 0.2, centerY + i * 28 + 14,
            centerX + eyeRadiusPx * 0.2, centerY + i * 28 - 14,
            centerX + eyeRadiusPx * 0.8, centerY + i * 24
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // B. Dispersive / Cohesive Viscoelastic Sheen
      if (ovdCoverage.dispersive > 5) {
        ctx.save();
        const ovdGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, eyeRadiusPx * 0.95);
        ovdGrad.addColorStop(0, `rgba(180, 230, 255, ${0.15 * (ovdCoverage.dispersive / 100)})`);
        ovdGrad.addColorStop(1, `rgba(100, 200, 255, ${0.3 * (ovdCoverage.dispersive / 100)})`);
        ctx.fillStyle = ovdGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, eyeRadiusPx * 0.92, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // C. Incision Wounds (Paracentesis & Tri-Planar Keratome)
      incisions.forEach(inc => {
        const woundAngle = inc.angleRad;
        const wx = centerX + Math.cos(woundAngle) * (eyeRadiusPx * 0.98);
        const wy = centerY + Math.sin(woundAngle) * (eyeRadiusPx * 0.98);
        const wLen = (inc.widthMm / 6.0) * (eyeRadiusPx * 0.35);

        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(woundAngle + Math.PI / 2);

        if (inc.completed) {
          ctx.strokeStyle = '#00d2ff';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(-wLen, 0);
          ctx.lineTo(wLen, 0);
          ctx.stroke();

          // Internal corneal entry tunnel into AC
          ctx.fillStyle = 'rgba(0, 210, 255, 0.25)';
          ctx.fillRect(-wLen, -8, wLen * 2, 8);
        } else if (inc.depthFraction > 0) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-wLen * inc.depthFraction, 0);
          ctx.lineTo(wLen * inc.depthFraction, 0);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-wLen, 0);
          ctx.lineTo(wLen, 0);
          ctx.stroke();
        }
        ctx.restore();
      });

      // D. Continuous Curvilinear Capsulorhexis (CCC) Vector Path
      if (module === 'phaco' && cccState.initiated) {
        ctx.save();
        const path = cccState.path;
        if (path.length > 1) {
          ctx.beginPath();
          const startX = centerX + path[0].x * (eyeRadiusPx * 0.65);
          const startY = centerY + path[0].y * (eyeRadiusPx * 0.65);
          ctx.moveTo(startX, startY);

          for (let i = 1; i < path.length; i++) {
            const px = centerX + path[i].x * (eyeRadiusPx * 0.65);
            const py = centerY + path[i].y * (eyeRadiusPx * 0.65);
            ctx.lineTo(px, py);
          }

          if (cccState.completed) {
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.8;
            ctx.stroke();
          } else {
            ctx.strokeStyle = cccState.isRunoutTowardZonules ? '#ff2a55' : '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Flap curl apex
            const tipX = centerX + cccState.currentTip.x * (eyeRadiusPx * 0.65);
            const tipY = centerY + cccState.currentTip.y * (eyeRadiusPx * 0.65);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Folded capsular flap sheen
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX - 14, tipY - 10);
            ctx.stroke();
          }
        }

        // Ideal 5.2 mm Target Ring overlay guide
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const idealRadius = (2.6 / 6.0) * (eyeRadiusPx * 0.85);
        ctx.arc(centerX, centerY, idealRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }

      // E. Hydrodissection Fluid Wave
      if (module === 'phaco' && hydroState.fluidWaveProgress > 0) {
        ctx.save();
        const waveR = eyeRadiusPx * 0.65 * hydroState.fluidWaveProgress;
        const gradWave = ctx.createRadialGradient(centerX - 25, centerY, 5, centerX, centerY, waveR);
        gradWave.addColorStop(0, 'rgba(255, 220, 100, 0.45)');
        gradWave.addColorStop(0.85, 'rgba(255, 200, 60, 0.3)');
        gradWave.addColorStop(1, 'rgba(255, 255, 255, 0.7)');

        ctx.fillStyle = gradWave;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // F. Phaco Sculpting Grooves & Quadrant Emulsification
      if (module === 'phaco' && cccState.completed) {
        ctx.save();
        if (nucleusState.grooveDepthFraction > 0.05) {
          ctx.strokeStyle = '#2b1606';
          ctx.lineWidth = 7 * nucleusState.grooveDepthFraction;
          ctx.beginPath();
          ctx.moveTo(centerX - eyeRadiusPx * 0.4, centerY);
          ctx.lineTo(centerX + eyeRadiusPx * 0.4, centerY);
          ctx.moveTo(centerX, centerY - eyeRadiusPx * 0.4);
          ctx.lineTo(centerX, centerY + eyeRadiusPx * 0.4);
          ctx.stroke();
        }

        nucleusState.quadrants.forEach((q) => {
          if (q.intactFraction < 0.99) {
            const quadAngle = q.angleCenterRad;
            const qx = centerX + Math.cos(quadAngle) * (eyeRadiusPx * 0.22);
            const qy = centerY + Math.sin(quadAngle) * (eyeRadiusPx * 0.22);
            ctx.fillStyle = `rgba(217, 119, 6, ${q.intactFraction * 0.75})`;
            ctx.beginPath();
            ctx.arc(qx, qy, 18 * q.intactFraction, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // G. Foldable IOL Implantation & Positioning
      if (module === 'iol') {
        ctx.save();
        const iolX = centerX + (iolState.centrationOffsetMm.x / 6.0) * eyeRadiusPx;
        const iolY = centerY + (iolState.centrationOffsetMm.y / 6.0) * eyeRadiusPx;
        const opticRadiusPx = (3.0 / 6.0) * eyeRadiusPx;

        if (iolState.insertionProgressFraction > 0.1) {
          const unfoldProgress = iolState.insertionProgressFraction;
          ctx.translate(iolX, iolY);
          ctx.rotate((iolState.rotationDeg * Math.PI) / 180);

          // Hydrophobic acrylic optic with square edge
          ctx.fillStyle = 'rgba(230, 245, 255, 0.4)';
          ctx.strokeStyle = '#00d2ff';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, opticRadiusPx * Math.min(1.0, unfoldProgress * 1.2), opticRadiusPx, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Purkinje cross reticle
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
          ctx.moveTo(0, -6); ctx.lineTo(0, 6);
          ctx.stroke();

          // Leading Haptic
          if (iolState.leadingHapticInBag || unfoldProgress > 0.35) {
            ctx.strokeStyle = '#00d2ff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(opticRadiusPx * 0.9, -opticRadiusPx * 0.2);
            ctx.bezierCurveTo(
              opticRadiusPx * 1.5, -opticRadiusPx * 0.8,
              opticRadiusPx * 1.8, opticRadiusPx * 0.4,
              opticRadiusPx * 1.4, opticRadiusPx * 1.2
            );
            ctx.stroke();
          }

          // Trailing Haptic
          if (unfoldProgress > 0.6) {
            ctx.strokeStyle = iolState.trailingHapticInBag ? '#00d2ff' : '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-opticRadiusPx * 0.9, opticRadiusPx * 0.2);
            ctx.bezierCurveTo(
              -opticRadiusPx * 1.5, opticRadiusPx * 0.8,
              -opticRadiusPx * 1.8, -opticRadiusPx * 0.4,
              -opticRadiusPx * 1.4, -opticRadiusPx * 1.2
            );
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // H. Nd:YAG Laser Photodisruption & Cruciate Patterns
      if (module === 'yag') {
        // Abraham Contact Lens Overlay
        if (yagSettings.contactLensFitted) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.45)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, eyeRadiusPx * 0.96, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(0, 240, 200, 0.04)';
          ctx.fill();

          // Central +66D planoconvex button
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, eyeRadiusPx * 0.48, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Slit-Lamp Focal Beam Projection
        ctx.save();
        const slitAngleRad = (yagSettings.slitBeamAngleDeg * Math.PI) / 180;
        const slitWidthPx = (yagSettings.slitBeamWidthMm / 14) * 85;
        ctx.translate(centerX, centerY);
        ctx.rotate(slitAngleRad);

        const slitGrad = ctx.createLinearGradient(-slitWidthPx / 2, 0, slitWidthPx / 2, 0);
        slitGrad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
        slitGrad.addColorStop(0.5, 'rgba(255, 255, 240, 0.35)');
        slitGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');

        ctx.fillStyle = slitGrad;
        ctx.fillRect(-slitWidthPx / 2, -height, slitWidthPx, height * 2);
        ctx.restore();

        // Laser Shots & Cruciate Openings in Opacified Capsule
        yagState.shots.forEach((shot) => {
          const sx = centerX + shot.x * (eyeRadiusPx * 0.55);
          const sy = centerY + shot.y * (eyeRadiusPx * 0.55);

          ctx.save();
          // Cleared pupillary aperture
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.beginPath();
          ctx.arc(sx, sy, 8, 0, Math.PI * 2);
          ctx.fill();

          // Torn curled edge
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          if (shot.pittedIol) {
            ctx.fillStyle = '#ff2a55';
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        // Dual Red HeNe Diode Aiming Beams
        const zError = laserDefocusZ - yagSettings.focalOffsetMicrons;
        const separationPx = (zError / 100.0) * 16.0;

        ctx.save();
        const aimX = mousePos.x;
        const aimY = mousePos.y;

        // Beam 1
        ctx.fillStyle = '#ff2a55';
        ctx.shadowColor = '#ff2a55';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(aimX - separationPx, aimY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Beam 2
        ctx.beginPath();
        ctx.arc(aimX + separationPx, aimY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Reticle Focus
        ctx.strokeStyle = Math.abs(zError) < 15 ? '#10b981' : 'rgba(255, 42, 85, 0.4)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(aimX, aimY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // LAYER 3: SURGICAL INSTRUMENTS (Follows Cursor)
      // ==========================================
      if (activeInstrument !== 'none' && activeInstrument !== 'yag_laser') {
        ctx.save();
        ctx.translate(mousePos.x, mousePos.y);

        if (activeInstrument === 'mvr_blade' || activeInstrument === 'keratome_2_4') {
          const bladeWidth = activeInstrument === 'keratome_2_4' ? 14 : 7;
          ctx.fillStyle = '#c0c8d0';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-bladeWidth / 2, -35);
          ctx.lineTo(bladeWidth / 2, -35);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -35);
          ctx.lineTo(bladeWidth / 2, -35);
          ctx.closePath();
          ctx.fill();
        } else if (activeInstrument === 'cystotome') {
          ctx.strokeStyle = '#b0bec5';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-4, -8);
          ctx.lineTo(-4, -45);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1, -1, 3, 3);
        } else if (activeInstrument === 'utrata_forceps') {
          ctx.strokeStyle = '#90a4ae';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-5, -30);
          ctx.moveTo(1, 0);
          ctx.lineTo(5, -30);
          ctx.stroke();
        } else if (activeInstrument === 'phaco_tip') {
          ctx.fillStyle = 'rgba(0, 180, 255, 0.75)';
          ctx.fillRect(-6, -55, 12, 40);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-3, -25, 2, 0, Math.PI * 2);
          ctx.arc(3, -25, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#cfd8dc';
          ctx.strokeStyle = '#37474f';
          ctx.lineWidth = 1;
          ctx.fillRect(-2.5, -15, 5, 15);

          ctx.fillStyle = '#263238';
          ctx.beginPath();
          ctx.moveTo(-2.5, 0);
          ctx.lineTo(2.5, -4);
          ctx.lineTo(2.5, 0);
          ctx.closePath();
          ctx.fill();

          if (pedalPosition === 3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let b = 0; b < 6; b++) {
              const bx = (Math.random() - 0.5) * 16;
              const by = (Math.random() - 0.5) * 16;
              ctx.beginPath();
              ctx.arc(bx, by, Math.random() * 3 + 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (activeInstrument === 'ia_handpiece') {
          ctx.fillStyle = '#78909c';
          ctx.fillRect(-3, -40, 6, 40);
          ctx.fillStyle = '#0a192f';
          ctx.beginPath();
          ctx.arc(0, -3, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (activeInstrument === 'sinskey_hook') {
          ctx.strokeStyle = '#b0bec5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(6, 0);
          ctx.lineTo(6, -35);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ==========================================
      // LAYER 4: LASER PLASMA SPARKS
      // ==========================================
      if (plasmaSparks.length > 0) {
        setPlasmaSparks(prev =>
          prev
            .map(spark => ({ ...spark, age: spark.age + 1 }))
            .filter(spark => spark.age < 12)
        );
        plasmaSparks.forEach(spark => {
          ctx.save();
          const r = spark.age * 2.8;
          ctx.strokeStyle = `rgba(255, 255, 255, ${1.0 - spark.age / 12})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 220, 180, ${1.0 - spark.age / 8})`;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, Math.max(1, 6 - spark.age * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
    };

    renderOverlay();
    return () => cancelAnimationFrame(animId);
  }, [
    module,
    activeInstrument,
    pedalPosition,
    fluidics,
    cccState,
    hydroState,
    nucleusState,
    iolState,
    yagState,
    yagSettings,
    incisions,
    ovdCoverage,
    magnification,
    mousePos,
    laserDefocusZ,
    plasmaSparks,
    renderMode,
    imagesLoaded,
    coaxialLight,
    redReflexGain
  ]);

  // Unified Pointer (Mouse & Touch) Interactions
  const handlePointerDownAction = useCallback((clientX: number, clientY: number) => {
    setIsMouseDown(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setMousePos({ x, y });
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const eyeRadiusPx = (175 * magnification) / 12;

    const normX = (x - centerX) / (eyeRadiusPx * 0.65);
    const normY = (y - centerY) / (eyeRadiusPx * 0.65);

    audioEngine.resume();

    if (activeInstrument === 'mvr_blade') {
      onIncisionAdvance('paracentesis');
      audioEngine.playPedalClick(1);
    } else if (activeInstrument === 'keratome_2_4') {
      onIncisionAdvance('clear_corneal');
      audioEngine.playPedalClick(1);
    }

    if (activeInstrument === 'ovd_viscoat') {
      onOvdInject('viscoat');
    } else if (activeInstrument === 'ovd_provisc') {
      onOvdInject('provisc');
    }

    if (activeInstrument === 'cystotome' && !cccState.punctured) {
      onCccPuncture(normX, normY);
      audioEngine.playPedalClick(2);
    }

    if (activeInstrument === 'hydro_cannula') {
      onHydroPulse();
    }

    if (activeInstrument === 'iol_injector') {
      onIolAdvance();
    }

    if (activeInstrument === 'sinskey_hook') {
      onIolDial(25, -0.2, -0.15);
      audioEngine.playPedalClick(1);
    }

    if (activeInstrument === 'ia_handpiece' && module === 'iol') {
      onIolWashout();
    }

    if (module === 'yag') {
      setPlasmaSparks(prev => [...prev, { x, y, age: 0 }]);
      onYagFire(normX, normY, laserDefocusZ);
      audioEngine.playYagDischarge(yagSettings.energyMj, yagSettings.pulseMode);
    }
  }, [
    activeInstrument,
    magnification,
    module,
    cccState.punctured,
    laserDefocusZ,
    yagSettings,
    onIncisionAdvance,
    onOvdInject,
    onCccPuncture,
    onHydroPulse,
    onIolAdvance,
    onIolDial,
    onIolWashout,
    onYagFire
  ]);

  const handlePointerMoveAction = useCallback((clientX: number, clientY: number, isDown: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const eyeRadiusPx = (175 * magnification) / 12;
    const normX = (x - centerX) / (eyeRadiusPx * 0.65);
    const normY = (y - centerY) / (eyeRadiusPx * 0.65);

    if (isDown) {
      if (activeInstrument === 'utrata_forceps' || activeInstrument === 'cystotome') {
        onCccDrag(normX, normY);
      }

      if (activeInstrument === 'phaco_tip' && pedalPosition === 3) {
        onPhacoApply({ x: normX, y: normY, z: -0.3 });
      }

      if (activeInstrument === 'ia_handpiece' && pedalPosition >= 2) {
        onIaAspirate({ x: normX, y: normY });
      }
    }
  }, [
    activeInstrument,
    magnification,
    pedalPosition,
    onCccDrag,
    onPhacoApply,
    onIaAspirate
  ]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handlePointerDownAction(e.clientX, e.clientY);
  }, [handlePointerDownAction]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handlePointerMoveAction(e.clientX, e.clientY, isMouseDown);
  }, [handlePointerMoveAction, isMouseDown]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerDownAction(touch.clientX, touch.clientY);
    }
  }, [handlePointerDownAction]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerMoveAction(touch.clientX, touch.clientY, true);
    }
  }, [handlePointerMoveAction]);

  const handleTouchEnd = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#050811] overflow-hidden select-none cursor-crosshair touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js WebGL 3D Canvas (Cornea dome, lighting, specular highlights) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 2D High-Resolution Composite Canvas (Real Eye Photo + Dynamic Overlays) */}
      <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Right Optical Controls Toggle Button & Dropdown */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 flex flex-col items-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptics(!showOptics);
          }}
          title="Microscope Optics & Illumination Settings"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-xl text-xs font-semibold transition active:scale-95 ${
            showOptics
              ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-900/50'
              : 'bg-[#0d1522]/90 hover:bg-[#132035] border-[#1e2e48] text-slate-300 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono">{magnification}x</span>
          <span className="text-[10px] hidden xs:inline uppercase text-slate-400">Optics</span>
        </button>

        {showOptics && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col gap-2 bg-[#0d1522]/95 backdrop-blur-md p-3 rounded-2xl border border-[#1e2e48] shadow-2xl text-xs text-slate-300 w-64 max-w-[85vw] animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1e2e48]/70">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                MICROSCOPE CONTROLS
              </span>
              <button
                onClick={() => setShowOptics(false)}
                className="p-1 rounded-lg hover:bg-[#15233c] text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Render Mode Switcher: Real Photo vs Hybrid vs 3D Shader */}
            <div className="pb-2 border-b border-[#1e2e48]/70 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="text-slate-400">View Mode</span>
                {renderMode === 'photo' && (
                  <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                    REAL PHOTO
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setRenderMode('photo')}
                  className={`py-1 rounded-lg text-center font-semibold transition ${
                    renderMode === 'photo'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#101b2d] text-slate-400 hover:text-white'
                  }`}
                >
                  Photo
                </button>
                <button
                  onClick={() => setRenderMode('hybrid')}
                  className={`py-1 rounded-lg text-center font-semibold transition ${
                    renderMode === 'hybrid'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#101b2d] text-slate-400 hover:text-white'
                  }`}
                >
                  Hybrid
                </button>
                <button
                  onClick={() => setRenderMode('shader')}
                  className={`py-1 rounded-lg text-center font-semibold transition ${
                    renderMode === 'shader'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#101b2d] text-slate-400 hover:text-white'
                  }`}
                >
                  3D Mesh
                </button>
              </div>
            </div>

            {/* Magnification Slider (6x - 25x) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Microscope Zoom</span>
                <span className="font-mono text-cyan-300 font-bold">{magnification}x</span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3 h-3 text-slate-400" />
                <input
                  type="range"
                  min="6"
                  max="25"
                  step="1"
                  value={magnification}
                  onChange={(e) => setMagnification(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <ZoomIn className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Coaxial Illumination */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Coaxial Light</span>
                <span className="font-mono text-amber-300">{coaxialLight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={coaxialLight}
                onChange={(e) => setCoaxialLight(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Red Reflex Retroillumination */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Red Reflex</span>
                <span className="font-mono text-rose-400">{redReflexGain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={redReflexGain}
                onChange={(e) => setRedReflexGain(Number(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Nd:YAG Defocus Control */}
            {module === 'yag' && (
              <div className="space-y-1 pt-1.5 border-t border-[#1e2e48]/70">
                <div className="flex justify-between text-[11px] text-rose-300">
                  <span>Focal Offset (Posterior)</span>
                  <span className="font-mono font-bold text-rose-400">+{laserDefocusZ} µm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="350"
                  step="10"
                  value={laserDefocusZ}
                  onChange={(e) => setLaserDefocusZ(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>0 µm (Risk)</span>
                  <span className="text-emerald-400">150-250 Safe</span>
                  <span>350 µm</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center Reticle and Medical Photography Badge (Hidden on mobile) */}
      <div className="hidden md:flex absolute bottom-3 left-3 z-10 pointer-events-none text-slate-400 font-mono text-xs flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-200 font-semibold uppercase tracking-wider">
            {module === 'phaco'
              ? 'Zeiss OPMI Lumera 700 Coaxial Medical Macro'
              : module === 'iol'
              ? 'High-Resolution Pseudophakic Capsular View'
              : 'Haag-Streit BQ 900 / Ellex Nd:YAG Slit-Lamp Photography'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Source: Clinical Ophthalmic Photography | Barraquer Speculum | Coaxial Retroillumination
        </div>
      </div>

      {/* Corneal Fold Warning Banner */}
      {fluidics.cornealFoldsPresent && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-rose-950/90 border border-rose-500 text-rose-200 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          CRITICAL: ANTERIOR CHAMBER SHALLOWING / CORNEAL FOLDS (IOP: {fluidics.iopActual.toFixed(1)} mmHg)
        </div>
      )}

      {/* Complication Alert */}
      {(cccState.zonularDehiscenceOccurred || nucleusState.posteriorCapsulePunctured) && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 bg-red-900/95 border-2 border-red-500 text-white px-5 py-2 rounded-lg shadow-2xl backdrop-blur-md text-sm font-bold flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-red-300 uppercase tracking-wide text-xs">Surgical Complication Alert</div>
            <div>
              {nucleusState.posteriorCapsulePunctured
                ? 'POSTERIOR CAPSULE RUPTURE OCCURRED'
                : 'ZONULAR DEHISCENCE / RADIAL RUNAWAY'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
