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
  IncisionPoint,
  MigsState
} from '../types/ophthalmic';
import { audioEngine } from '../audio/SoundSynthesizer';
import { ZoomIn, ZoomOut, Camera, X, Crosshair } from 'lucide-react';

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
  currentStepId?: string;
  showGuides?: boolean;
  onToggleGuides?: () => void;
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
  migsState?: MigsState;
  onMigsTilt?: (microscope: number, head: number) => void;
  onMigsGonioPlace?: () => void;
  onMigsOvdAngle?: () => void;
  onMigsDeployStent?: (stentIdx: number, clockHour: number, angleDeg: number, depthMicrons: number) => void;
  onMigsBloodReflux?: () => void;
  onMigsWashout?: () => void;
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
  currentStepId = '',
  showGuides = true,
  onToggleGuides,
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
  migsState,
  onMigsTilt,
  onMigsGonioPlace,
  onMigsOvdAngle,
  onMigsDeployStent,
  onMigsBloodReflux,
  onMigsWashout,
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

  // Load actual eye photography assets with relative subpath resolution for GitHub Pages
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        setImagesLoaded(true);
      }
    };

    const getAssetPath = (relativePath: string) => {
      const base = window.location.pathname.endsWith('/')
        ? window.location.pathname
        : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
      return `${base}${relativePath.replace(/^\.?\//, '')}`;
    };

    const cImg = new window.Image();
    cImg.src = getAssetPath('images/cataract_eye.jpg');
    cImg.onload = checkLoaded;
    cImg.onerror = () => {
      console.warn('[Simulator] Notice: Could not load cataract_eye.jpg at', cImg.src);
      checkLoaded();
    };
    cataractImgRef.current = cImg;

    const iImg = new window.Image();
    iImg.src = getAssetPath('images/iol_eye.jpg');
    iImg.onload = checkLoaded;
    iImg.onerror = () => {
      console.warn('[Simulator] Notice: Could not load iol_eye.jpg at', iImg.src);
      checkLoaded();
    };
    iolImgRef.current = iImg;

    const yImg = new window.Image();
    yImg.src = getAssetPath('images/yag_pco_eye.jpg');
    yImg.onload = checkLoaded;
    yImg.onerror = () => {
      console.warn('[Simulator] Notice: Could not load yag_pco_eye.jpg at', yImg.src);
      checkLoaded();
    };
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
        } else if (module === 'migs') {
          activeImg = cataractImgRef.current;
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
      // LAYER 1.5: MIGS DIRECT SURGICAL GONIOSCOPY
      // ==========================================
      if (module === 'migs') {
        const isGonioActive = migsState?.gonioprismPlaced || currentStepId !== 'microscope_and_head_tilt';

        if (isGonioActive) {
          ctx.save();

          // 1. Direct Swan-Jacob Gonioprism Lens Frame
          const gonioRadius = eyeRadiusPx * 1.08;
          ctx.beginPath();
          ctx.arc(centerX, centerY, gonioRadius, 0, Math.PI * 2);
          ctx.clip();

          // Gonioprism fluid coupling glass gradient
          const gonioGlass = ctx.createRadialGradient(centerX, centerY, gonioRadius * 0.2, centerX, centerY, gonioRadius);
          gonioGlass.addColorStop(0, 'rgba(10, 25, 45, 0.85)');
          gonioGlass.addColorStop(0.7, 'rgba(15, 35, 60, 0.92)');
          gonioGlass.addColorStop(1, 'rgba(6, 16, 32, 0.98)');
          ctx.fillStyle = gonioGlass;
          ctx.fill();

          // 2. Anatomical Angle Bands (Curved concentric sectors in nasal quadrant)
          // Band A: Cornea & Schwalbe's Line (Pearly glistening white)
          ctx.beginPath();
          ctx.arc(centerX - eyeRadiusPx * 0.25, centerY, eyeRadiusPx * 1.15, -Math.PI * 0.32, Math.PI * 0.32);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.lineWidth = 8;
          ctx.stroke();

          // Band B: Non-Pigmented Trabecular Meshwork (Light beige band)
          ctx.beginPath();
          ctx.arc(centerX - eyeRadiusPx * 0.25, centerY, eyeRadiusPx * 1.05, -Math.PI * 0.32, Math.PI * 0.32);
          ctx.strokeStyle = 'rgba(215, 205, 185, 0.75)';
          ctx.lineWidth = 14;
          ctx.stroke();

          // Band C: Pigmented Trabecular Meshwork (Rich golden-brown filtration band - where the clog is!)
          ctx.beginPath();
          ctx.arc(centerX - eyeRadiusPx * 0.25, centerY, eyeRadiusPx * 0.93, -Math.PI * 0.32, Math.PI * 0.32);
          ctx.strokeStyle = 'rgba(125, 78, 38, 0.95)';
          ctx.lineWidth = 18;
          ctx.stroke();

          // Band D: Schlemm's Canal & Venous Collector Bed (Translucent violet/indigo behind TM)
          ctx.beginPath();
          ctx.arc(centerX - eyeRadiusPx * 0.25, centerY, eyeRadiusPx * 0.93, -Math.PI * 0.3, Math.PI * 0.3);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
          ctx.lineWidth = 6;
          ctx.stroke();

          // Band E: Scleral Spur (Crisp ivory white line)
          ctx.beginPath();
          ctx.arc(centerX - eyeRadiusPx * 0.25, centerY, eyeRadiusPx * 0.81, -Math.PI * 0.32, Math.PI * 0.32);
          ctx.strokeStyle = 'rgba(240, 238, 230, 0.85)';
          ctx.lineWidth = 6;
          ctx.stroke();

          // Band F: Ciliary Body Band & Peripheral Iris Root (Deep brown with radial fibers)
          ctx.beginPath();
          ctx.arc(centerX - eyeRadiusPx * 0.25, centerY, eyeRadiusPx * 0.68, -Math.PI * 0.32, Math.PI * 0.32);
          ctx.strokeStyle = 'rgba(65, 38, 18, 0.92)';
          ctx.lineWidth = 26;
          ctx.stroke();

          // 3. Anatomical Gonio Labels on Viewport
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fillText("SCHWALBE'S LINE", centerX + eyeRadiusPx * 0.78, centerY - eyeRadiusPx * 0.35);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.9)';
          ctx.fillText("PIGMENTED TM (FILTER CLOG)", centerX + eyeRadiusPx * 0.62, centerY - eyeRadiusPx * 0.18);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.9)';
          ctx.fillText("SCHLEMM'S CANAL (VENOUS DRAIN)", centerX + eyeRadiusPx * 0.58, centerY + eyeRadiusPx * 0.05);
          ctx.fillStyle = 'rgba(240, 238, 230, 0.75)';
          ctx.fillText("SCLERAL SPUR", centerX + eyeRadiusPx * 0.48, centerY + eyeRadiusPx * 0.22);

          // 4. Stent Deployment Visualization
          const stentLocations = [
            { idx: 0, clock: '2:30', angleRad: -Math.PI * 0.11, label: 'STENT 1' },
            { idx: 1, clock: '4:00', angleRad: Math.PI * 0.21, label: 'STENT 2' }
          ];

          stentLocations.forEach(loc => {
            const stentData = migsState?.stents[loc.idx];
            const sx = centerX - eyeRadiusPx * 0.25 + Math.cos(loc.angleRad) * (eyeRadiusPx * 0.93);
            const sy = centerY + Math.sin(loc.angleRad) * (eyeRadiusPx * 0.93);

            if (stentData && stentData.deployed) {
              // Deployed Titanium Micro-Stent
              ctx.save();
              ctx.translate(sx, sy);
              ctx.rotate(loc.angleRad + Math.PI / 2);

              // Stent Titanium Body
              ctx.fillStyle = '#e2e8f0';
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(-4, -8, 8, 16, 2);
              ctx.fill();
              ctx.stroke();

              // Stent Central Outflow Lumen
              ctx.fillStyle = '#0f172a';
              ctx.beginPath();
              ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
              ctx.fill();

              // Four Side Outflow Orifices
              ctx.fillStyle = '#06b6d4';
              ctx.fillRect(-3, 2, 2, 2);
              ctx.fillRect(1, 2, 2, 2);
              ctx.restore();

              // Label
              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 9px monospace';
              ctx.fillText(`${loc.label} (PATENT)`, sx + 8, sy - 4);

              // 5. Blood Reflux Wave Plume (Crimson plume from bloodstream)
              if (migsState?.bloodRefluxWaveConfirmed) {
                const plumeGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 24);
                plumeGrad.addColorStop(0, 'rgba(220, 38, 38, 0.85)');
                plumeGrad.addColorStop(0.5, 'rgba(185, 28, 28, 0.45)');
                plumeGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
                ctx.fillStyle = plumeGrad;
                ctx.beginPath();
                ctx.arc(sx, sy, 24, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              // Pre-deployment Target Beacon on TM
              ctx.save();
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.arc(sx, sy, 11, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
              ctx.fill();

              ctx.fillStyle = '#fbbf24';
              ctx.font = 'bold 9px monospace';
              ctx.fillText(`${loc.label} TARGET (${loc.clock})`, sx + 14, sy + 3);
              ctx.restore();
            }
          });

          // 6. Reflux Confirmation Banner at Bottom of Angle
          if (migsState?.bloodRefluxWaveConfirmed) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(centerX - 170, centerY + eyeRadiusPx * 0.72, 340, 26, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🩸 VENOUS BLOOD REFLUX ACTIVE: 8.5 mmHg FLOOR CONFIRMED', centerX, centerY + eyeRadiusPx * 0.72 + 16);
            ctx.textAlign = 'start';
          }

          // Gonioprism Outer Bezel & Glass Reflection
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, gonioRadius - 2, 0, Math.PI * 2);
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

      // C. Limbal Clock Hours & Anatomical Landmarks
      ctx.save();
      const clockHours = [
        { label: '12:00', rad: -Math.PI / 2 },
        { label: '1:30', rad: 0.26 },
        { label: '3:00', rad: 0 },
        { label: '6:00', rad: Math.PI / 2 },
        { label: '9:00', rad: Math.PI },
        { label: '10:00', rad: -0.45 }
      ];
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      clockHours.forEach(ch => {
        const lx = centerX + Math.cos(ch.rad) * (eyeRadiusPx * 1.05);
        const ly = centerY + Math.sin(ch.rad) * (eyeRadiusPx * 1.05);
        ctx.fillStyle = ch.label === '10:00' || ch.label === '1:30' ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(ch.label, lx, ly);

        // Limbal radial tick
        const tx1 = centerX + Math.cos(ch.rad) * (eyeRadiusPx * 0.96);
        const ty1 = centerY + Math.sin(ch.rad) * (eyeRadiusPx * 0.96);
        const tx2 = centerX + Math.cos(ch.rad) * (eyeRadiusPx * 1.0);
        const ty2 = centerY + Math.sin(ch.rad) * (eyeRadiusPx * 1.0);
        ctx.strokeStyle = ch.label === '10:00' || ch.label === '1:30' ? '#0284c7' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
      });

      // Limbal Vascular Arcade (Subtle micro-capillary arches)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 1.0;
      for (let a = 0; a < Math.PI * 2; a += 0.15) {
        const ax = centerX + Math.cos(a) * (eyeRadiusPx * 0.98);
        const ay = centerY + Math.sin(a) * (eyeRadiusPx * 0.98);
        const cpx = centerX + Math.cos(a + 0.07) * (eyeRadiusPx * 1.01);
        const cpy = centerY + Math.sin(a + 0.07) * (eyeRadiusPx * 1.01);
        const ax2 = centerX + Math.cos(a + 0.15) * (eyeRadiusPx * 0.98);
        const ay2 = centerY + Math.sin(a + 0.15) * (eyeRadiusPx * 0.98);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cpx, cpy, ax2, ay2);
        ctx.stroke();
      }
      ctx.restore();

      // C2. Detailed Anatomical Incision Wounds (Paracentesis & Tri-Planar Keratome)
      incisions.forEach(inc => {
        const woundAngle = inc.angleRad;
        const wx = centerX + Math.cos(woundAngle) * (eyeRadiusPx * 0.98);
        const wy = centerY + Math.sin(woundAngle) * (eyeRadiusPx * 0.98);
        const wLen = (inc.widthMm / 6.0) * (eyeRadiusPx * 0.35);

        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(woundAngle + Math.PI / 2);

        if (inc.type === 'clear_corneal') {
          // --- 2.4mm Tri-Planar Keratome Architecture ---
          if (inc.completed) {
            // Watertight Stromal Hydration Glow
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.fillRect(-wLen * 1.1, -12, wLen * 2.2, 16);

            // Plane 1: Vertical Limbal Groove
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(-wLen, 0);
            ctx.lineTo(wLen, 0);
            ctx.stroke();

            // Plane 2: Lamellar Stromal Tunnel
            ctx.fillStyle = 'rgba(0, 210, 255, 0.35)';
            ctx.fillRect(-wLen, -10, wLen * 2, 10);
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-wLen, -10, wLen * 2, 10);

            // Plane 3: Internal Descemet Entry Lip
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-wLen * 0.95, -10);
            ctx.lineTo(wLen * 0.95, -10);
            ctx.stroke();

            // Wound Label
            ctx.rotate(-woundAngle - Math.PI / 2);
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.fillStyle = '#34d399';
            ctx.fillText('✓ 2.4mm Tri-Planar Port (1:30) - Self-Sealing Valve', 0, 18);
          } else if (inc.depthFraction > 0) {
            // In Progress: Step through Plane 1 -> Plane 2 -> Plane 3
            const p = inc.plane || 1;
            // Plane 1 Notch
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            ctx.moveTo(-wLen, 0);
            ctx.lineTo(wLen, 0);
            ctx.stroke();

            // Plane 2 Tunnel
            if (p >= 2) {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
              ctx.fillRect(-wLen, -6, wLen * 2, 6);
            }

            // Plane 3 Lip
            if (p >= 3) {
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(-wLen * 0.9, -10);
              ctx.lineTo(wLen * 0.9, -10);
              ctx.stroke();
            }

            ctx.rotate(-woundAngle - Math.PI / 2);
            ctx.font = 'bold 8.5px "Inter", sans-serif';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`✂ ${inc.planeName || 'Plane ' + p + ' / 3'}`, 0, 18);
          } else {
            // Untouched Guide Target
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.7)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-wLen, 0);
            ctx.lineTo(wLen, 0);
            ctx.stroke();

            ctx.rotate(-woundAngle - Math.PI / 2);
            ctx.font = 'bold 8.5px "Inter", sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('🎯 2.4mm Main Port Target (1:30)', 0, 18);
          }
        } else {
          // --- 1.0mm MVR Paracentesis Architecture ---
          if (inc.completed) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(-wLen, 0);
            ctx.lineTo(wLen, 0);
            ctx.stroke();

            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.fillRect(-wLen, -6, wLen * 2, 6);

            ctx.rotate(-woundAngle - Math.PI / 2);
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.fillStyle = '#34d399';
            ctx.fillText('✓ 1.0mm Side-Port (10:00)', 0, -14);
          } else if (inc.depthFraction > 0) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-wLen * inc.depthFraction, 0);
            ctx.lineTo(wLen * inc.depthFraction, 0);
            ctx.stroke();

            ctx.rotate(-woundAngle - Math.PI / 2);
            ctx.font = 'bold 8.5px "Inter", sans-serif';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('✂ Paracentesis Cutting...', 0, -14);
          } else {
            ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-wLen, 0);
            ctx.lineTo(wLen, 0);
            ctx.stroke();

            ctx.rotate(-woundAngle - Math.PI / 2);
            ctx.font = 'bold 8.5px "Inter", sans-serif';
            ctx.fillStyle = '#fb923c';
            ctx.fillText('🎯 1.0mm Side-Port Target (10:00)', 0, -14);
          }
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

      // ==========================================
      // LAYER 5: INTERACTIVE TARGET POINTERS & GUIDANCE
      // ==========================================
      if (showGuides) {
        const animTime = performance.now();
        const pulse = (Math.sin(animTime / 220) + 1) / 2; // 0 to 1
        const bounce = Math.sin(animTime / 180) * 6; // -6 to 6 px bounce

        // Helper to draw a modern glowing target beacon and pointer arrow
        const drawTargetBeacon = (
          tx: number,
          ty: number,
          titleText: string,
          subText: string,
          colorTheme: 'cyan' | 'amber' | 'emerald' | 'rose' = 'cyan'
        ) => {
          ctx.save();
          const primaryColor =
            colorTheme === 'amber' ? '#f59e0b' :
            colorTheme === 'emerald' ? '#10b981' :
            colorTheme === 'rose' ? '#f43f5e' : '#00d2ff';
          const bgGlow =
            colorTheme === 'amber' ? 'rgba(245, 158, 11, 0.25)' :
            colorTheme === 'emerald' ? 'rgba(16, 185, 129, 0.25)' :
            colorTheme === 'rose' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(0, 210, 255, 0.25)';

          // 1. Concentric pulsing radar rings
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(tx, ty, 14 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = bgGlow;
          ctx.beginPath();
          ctx.arc(tx, ty, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // 2. Animated Bouncing Arrow
          ctx.save();
          const arrowTipX = tx;
          const arrowTipY = ty - 18 - bounce;
          const badgeX = tx;
          const badgeY = arrowTipY - 32;

          // Draw downward pointing chevron arrow
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.moveTo(arrowTipX, arrowTipY);
          ctx.lineTo(arrowTipX - 8, arrowTipY - 14);
          ctx.lineTo(arrowTipX - 3, arrowTipY - 14);
          ctx.lineTo(arrowTipX - 3, arrowTipY - 24);
          ctx.lineTo(arrowTipX + 3, arrowTipY - 24);
          ctx.lineTo(arrowTipX + 3, arrowTipY - 14);
          ctx.lineTo(arrowTipX + 8, arrowTipY - 14);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 3. Floating Instruction Badge
          ctx.font = 'bold 10px "Inter", sans-serif';
          const titleWidth = ctx.measureText(titleText).width;
          ctx.font = '9px "Inter", sans-serif';
          const subWidth = ctx.measureText(subText).width;
          const badgeWidth = Math.max(titleWidth, subWidth) + 20;
          const badgeHeight = 32;

          // Clamp badge position within viewport boundaries
          const clampedBadgeX = Math.max(badgeWidth / 2 + 10, Math.min(width - badgeWidth / 2 - 10, badgeX));
          const clampedBadgeY = Math.max(40, Math.min(height - 60, badgeY));

          // Badge Background
          ctx.fillStyle = 'rgba(10, 18, 32, 0.94)';
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 1.4;
          const rx = clampedBadgeX - badgeWidth / 2;
          const ry = clampedBadgeY - badgeHeight / 2;

          // Rounded rectangle
          ctx.beginPath();
          ctx.roundRect(rx, ry, badgeWidth, badgeHeight, 6);
          ctx.fill();
          ctx.stroke();

          // Title Text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 10px "Inter", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(titleText, clampedBadgeX, clampedBadgeY - 6);

          // Subtitle Text
          ctx.font = '9px "Inter", sans-serif';
          ctx.fillStyle = primaryColor;
          ctx.fillText(subText, clampedBadgeX, clampedBadgeY + 7);

          ctx.restore();
          ctx.restore();
        };

        // Determine target by module and currentStepId
        if (module === 'phaco') {
          if (currentStepId === 'paracentesis' || (!currentStepId && !incisions[0]?.completed)) {
            const tx = centerX + Math.cos(-0.45) * (eyeRadiusPx * 0.98);
            const ty = centerY + Math.sin(-0.45) * (eyeRadiusPx * 0.98);
            drawTargetBeacon(tx, ty, 'CLICK HERE (10:00) FOR SIDE-PORT', '1.0mm MVR Blade: Make side door parallel to iris', 'amber');
          } else if (currentStepId === 'clear_corneal_incision' || (!currentStepId && !incisions[1]?.completed)) {
            const tx = centerX + Math.cos(0.26) * (eyeRadiusPx * 0.98);
            const ty = centerY + Math.sin(0.26) * (eyeRadiusPx * 0.98);
            const inc = incisions.find(i => i.type === 'clear_corneal');
            const planeTxt = !inc || inc.depthFraction === 0 ? 'Click to cut Plane 1: 300µm Groove' :
              inc.depthFraction < 0.7 ? 'Click to cut Plane 2: 1.5mm Tunnel' : 'Click to cut Plane 3: Penetrate AC';
            drawTargetBeacon(tx, ty, 'CLICK HERE (1:30) FOR MAIN 2.4mm TUNNEL', `Keratome Blade: ${planeTxt}`, 'cyan');
          } else if (currentStepId === 'ovd_injection' || (!currentStepId && ovdCoverage.dispersive < 40)) {
            drawTargetBeacon(centerX, centerY - eyeRadiusPx * 0.15, 'CLICK INSIDE PUPIL TO INJECT JELLY', 'Viscoat Syringe: Coat & protect corneal cells', 'emerald');
          } else if (currentStepId === 'capsulorhexis' || (!currentStepId && !cccState.completed)) {
            if (!cccState.punctured) {
              drawTargetBeacon(centerX, centerY, 'CLICK CENTER TO PUNCTURE CAPSULE', 'Cystotome: Pierce center of lens skin to start flap', 'amber');
            } else {
              drawTargetBeacon(centerX + (2.6 / 6.0) * (eyeRadiusPx * 0.85), centerY, 'DRAG ALONG DASHED BLUE CIRCLE', 'Utrata Forceps: Peel smooth 5.2mm round window', 'cyan');
            }
          } else if (currentStepId === 'hydrodissection' || (!currentStepId && !hydroState.corticalCleavingWaveFormed)) {
            const ty = centerY - (2.6 / 6.0) * (eyeRadiusPx * 0.85);
            drawTargetBeacon(centerX, ty, 'CLICK UNDER CAPSULE RIM TO SPRAY WATER', 'Hydro Cannula: Cleave lens so it spins freely', 'cyan');
          } else if (currentStepId === 'phaco_chop' || (!currentStepId && nucleusState.remainingMassFraction > 0.05)) {
            drawTargetBeacon(centerX, centerY, 'STEP ON PEDAL (POS 3) & TOUCH LENS', 'Phaco Tip: Pulverize hard core (stay >1.5mm from back capsule)', 'amber');
          } else if (currentStepId === 'cortex_removal') {
            drawTargetBeacon(centerX + eyeRadiusPx * 0.35, centerY, 'STEP ON PEDAL (POS 2) & VACUUM CORTEX', 'I/A Handpiece: Vacuum fluffy cortex clean', 'cyan');
          }
        } else if (module === 'iol') {
          if (currentStepId === 'ovd_bag_refill' || (!currentStepId && !iolState.opticInChamber && iolState.insertionProgressFraction < 0.1)) {
            drawTargetBeacon(centerX, centerY, 'CLICK INSIDE BAG TO RE-INFLATE', 'Provisc Jelly: Expand bag so injector nozzle enters safely', 'emerald');
          } else if (currentStepId === 'cartridge_insertion' || currentStepId === 'haptic_unfolding' || (!currentStepId && !iolState.opticInChamber)) {
            const tx = centerX + Math.cos(0.26) * (eyeRadiusPx * 0.98);
            const ty = centerY + Math.sin(0.26) * (eyeRadiusPx * 0.98);
            drawTargetBeacon(tx, ty, 'CLICK TO ADVANCE FOLDED LENS', 'IOL Injector: Advance screw plunger with bevel DOWN', 'cyan');
          } else if (currentStepId === 'sinskey_dialing' || (!currentStepId && !iolState.trailingHapticInBag)) {
            drawTargetBeacon(centerX - eyeRadiusPx * 0.25, centerY + eyeRadiusPx * 0.2, 'CLICK TO DIAL LENS CLOCKWISE', 'Sinskey Hook: Tuck trailing arm into bag & center', 'amber');
          } else if (currentStepId === 'viscoelastic_washout') {
            drawTargetBeacon(centerX, centerY, 'PEDAL POS 2: VACUUM JELLY BEHIND LENS', 'I/A Handpiece: Vacuum retro-lens space to prevent IOP spikes', 'cyan');
          }
        } else if (module === 'yag') {
          if (currentStepId === 'contact_lens_placement' || (!currentStepId && !yagSettings.contactLensFitted)) {
            drawTargetBeacon(centerX, centerY, 'CLICK EYE TO PLACE ABRAHAM LENS', 'Magnifying contact lens stabilizes eye & widens laser cone', 'cyan');
          } else if (currentStepId === 'aiming_focus') {
            drawTargetBeacon(mousePos.x || centerX, mousePos.y || centerY, 'MOVE CURSOR: MERGE TWIN RED DOTS INTO 1', 'Confocal Focus: Single sharp red dot = perfect target plane', 'rose');
          } else if (currentStepId === 'offset_adjustment') {
            drawTargetBeacon(centerX, centerY, 'CHECK OFFSET SETTING: MUST BE +150µm', 'Laser Console: Posterior offset protects lens from pits', 'amber');
          } else if (currentStepId === 'cruciate_capsulotomy' || (!currentStepId && yagState.shots.length < 4)) {
            // Draw 4 numbered targets on the capsule
            const offsets = [
              { num: '1', ox: 0, oy: -eyeRadiusPx * 0.25 },
              { num: '2', ox: 0, oy: eyeRadiusPx * 0.25 },
              { num: '3', ox: -eyeRadiusPx * 0.25, oy: 0 },
              { num: '4', ox: eyeRadiusPx * 0.25, oy: 0 }
            ];
            offsets.forEach(off => {
              const sx = centerX + off.ox;
              const sy = centerY + off.oy;
              ctx.save();
              ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(sx, sy, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(off.num, sx, sy);
              ctx.restore();
            });
            drawTargetBeacon(centerX, centerY - eyeRadiusPx * 0.35, 'CLICK NUMBERED CROSS TARGETS (+)', 'Cruciate Pattern: 1 (Top) → 2 (Bottom) → 3 (Left) → 4 (Right)', 'rose');
          } else if (currentStepId === 'post_yag_assessment') {
            drawTargetBeacon(centerX, centerY, 'VERIFY 4.0mm CENTRAL CLEAR WINDOW', 'Slit Lamp: Check 0 lens pits & apply pressure drops', 'emerald');
          }
        } else if (module === 'migs') {
          if (currentStepId === 'microscope_and_head_tilt') {
            drawTargetBeacon(centerX, centerY - eyeRadiusPx * 0.35, 'CLICK TO TILT MICROSCOPE (40°) & HEAD (35°)', 'Goniometry: Overcome corneal total internal reflection to view angle', 'cyan');
          } else if (currentStepId === 'gonioprism_placement') {
            drawTargetBeacon(centerX, centerY, 'CLICK CORNEA TO PLACE SWAN-JACOB GONIOPRISM', 'Prism Lens: Converts curved cornea into flat optical window', 'emerald');
          } else if (currentStepId === 'viscoelastic_angle_deepening') {
            drawTargetBeacon(centerX + eyeRadiusPx * 0.45, centerY, 'CLICK TO INJECT COHESIVE OVD INTO NASAL ANGLE', 'Deepen Angle: Pushes iris back to create safe stent runway', 'cyan');
          } else if (currentStepId === 'stent_1_deployment') {
            const s1x = centerX - eyeRadiusPx * 0.25 + Math.cos(-Math.PI * 0.11) * (eyeRadiusPx * 0.93);
            const s1y = centerY + Math.sin(-Math.PI * 0.11) * (eyeRadiusPx * 0.93);
            drawTargetBeacon(s1x, s1y, 'CLICK TARGET: DEPLOY MICRO-STENT 1 (2:30)', 'Target: Pigmented Trabecular Meshwork over Collector Channel', 'amber');
          } else if (currentStepId === 'stent_2_deployment') {
            const s2x = centerX - eyeRadiusPx * 0.25 + Math.cos(Math.PI * 0.21) * (eyeRadiusPx * 0.93);
            const s2y = centerY + Math.sin(Math.PI * 0.21) * (eyeRadiusPx * 0.93);
            drawTargetBeacon(s2x, s2y, 'CLICK TARGET: DEPLOY MICRO-STENT 2 (4:00)', 'Bilateral Bypass: 2 clock hours away for 2x outflow capacity', 'cyan');
          } else if (currentStepId === 'blood_reflux_and_washout') {
            drawTargetBeacon(centerX + eyeRadiusPx * 0.4, centerY, 'CLICK TO OBSERVE VENOUS BLOOD WAVE & WASHOUT', 'Proof: 8-10 mmHg Venous Blood Floor Prevents Hypotony', 'rose');
          }
        }
      }

      // ==========================================
      // LAYER 6: CORNEAL INCISION ARCHITECTURE MINI-HUD
      // ==========================================
      if (
        module === 'phaco' &&
        (activeInstrument === 'mvr_blade' || activeInstrument === 'keratome_2_4' || currentStepId === 'paracentesis' || currentStepId === 'clear_corneal_incision')
      ) {
        ctx.save();
        const hudW = 260;
        const hudH = 110;
        const hudX = 14;
        const hudY = height - hudH - 65; // Position in lower-left above foot pedal

        // HUD panel background
        ctx.fillStyle = 'rgba(10, 16, 28, 0.94)';
        ctx.strokeStyle = '#1e304a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(hudX, hudY, hudW, hudH, 10);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.font = 'bold 10px "Inter", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('TRI-PLANAR INCISION ARCHITECTURE', hudX + 10, hudY + 8);

        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Self-Sealing Pressure Valve Mechanics', hudX + 10, hudY + 22);

        // Stylized cornea profile diagram
        const diagX = hudX + 12;
        const diagY = hudY + 38;
        const diagW = 236;
        const diagH = 45;

        // Outer surface (Epithelium)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(diagX, diagY + 4);
        ctx.quadraticCurveTo(diagX + diagW / 2, diagY, diagX + diagW, diagY + 4);
        ctx.stroke();

        // Inner surface (Descemet / Endothelium)
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(diagX, diagY + diagH);
        ctx.quadraticCurveTo(diagX + diagW / 2, diagY + diagH - 4, diagX + diagW, diagY + diagH);
        ctx.stroke();

        // Stroma shading
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.beginPath();
        ctx.moveTo(diagX, diagY + 4);
        ctx.quadraticCurveTo(diagX + diagW / 2, diagY, diagX + diagW, diagY + 4);
        ctx.lineTo(diagX + diagW, diagY + diagH);
        ctx.quadraticCurveTo(diagX + diagW / 2, diagY + diagH - 4, diagX, diagY + diagH);
        ctx.closePath();
        ctx.fill();

        // Stepped cut path: Plane 1 (Groove) -> Plane 2 (Tunnel) -> Plane 3 (AC Entry)
        const mainInc = incisions.find(i => i.type === 'clear_corneal');
        const plane = mainInc?.plane || (activeInstrument === 'keratome_2_4' ? 1 : 0);

        ctx.strokeStyle = plane >= 1 ? '#f59e0b' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(diagX + 180, diagY + 2);
        ctx.lineTo(diagX + 180, diagY + 18); // Plane 1
        ctx.stroke();

        ctx.strokeStyle = plane >= 2 ? '#f59e0b' : 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(diagX + 180, diagY + 18);
        ctx.lineTo(diagX + 90, diagY + 22); // Plane 2
        ctx.stroke();

        ctx.strokeStyle = plane >= 3 ? '#10b981' : 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(diagX + 90, diagY + 22);
        ctx.lineTo(diagX + 65, diagY + diagH); // Plane 3
        ctx.stroke();

        // Labels
        ctx.font = '7.5px "Inter", sans-serif';
        ctx.fillStyle = plane >= 1 ? '#f59e0b' : '#64748b';
        ctx.fillText('1. Groove (300µm)', diagX + 155, diagY + diagH + 8);
        ctx.fillStyle = plane >= 2 ? '#f59e0b' : '#64748b';
        ctx.fillText('2. Tunnel (1.5mm)', diagX + 80, diagY + diagH + 8);
        ctx.fillStyle = plane >= 3 ? '#10b981' : '#64748b';
        ctx.fillText('3. AC Entry', diagX + 15, diagY + diagH + 8);

        ctx.restore();
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
    currentStepId,
    showGuides,
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

    if (module === 'migs') {
      if (currentStepId === 'microscope_and_head_tilt') {
        onMigsTilt?.(38, 35);
        audioEngine.playPedalClick(1);
      } else if (currentStepId === 'gonioprism_placement' || activeInstrument === 'gonio_lens') {
        onMigsGonioPlace?.();
        audioEngine.playPedalClick(2);
      } else if (currentStepId === 'viscoelastic_angle_deepening' || activeInstrument === 'ovd_provisc') {
        onMigsOvdAngle?.();
        audioEngine.playPedalClick(1);
      } else if (currentStepId === 'stent_1_deployment' || (activeInstrument === 'migs_injector' && migsState?.stents[0] && !migsState.stents[0].deployed)) {
        onMigsDeployStent?.(0, 2.5, 22, 360);
        audioEngine.playPedalClick(3);
      } else if (currentStepId === 'stent_2_deployment' || (activeInstrument === 'migs_injector' && migsState?.stents[1] && !migsState.stents[1].deployed)) {
        onMigsDeployStent?.(1, 4.0, 25, 360);
        audioEngine.playPedalClick(3);
      } else if (currentStepId === 'blood_reflux_and_washout' || activeInstrument === 'ia_handpiece') {
        onMigsBloodReflux?.();
        onMigsWashout?.();
        audioEngine.playPedalClick(2);
      }
    }
  }, [
    activeInstrument,
    magnification,
    module,
    currentStepId,
    cccState.punctured,
    laserDefocusZ,
    yagSettings,
    migsState,
    onIncisionAdvance,
    onOvdInject,
    onCccPuncture,
    onHydroPulse,
    onIolAdvance,
    onIolDial,
    onIolWashout,
    onYagFire,
    onMigsTilt,
    onMigsGonioPlace,
    onMigsOvdAngle,
    onMigsDeployStent,
    onMigsBloodReflux,
    onMigsWashout
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

      {/* Top Right Optical Controls & Guidance Toggle */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
          {onToggleGuides && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleGuides();
              }}
              title={showGuides ? 'Hide Interactive Guidance Pointers' : 'Show Interactive Guidance Pointers'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-xl text-xs font-semibold transition active:scale-95 ${
                showGuides
                  ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 shadow-cyan-900/40'
                  : 'bg-[#0d1522]/90 hover:bg-[#132035] border-[#1e2e48] text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono hidden xs:inline">{showGuides ? 'Guides: ON' : 'Guides: OFF'}</span>
              <span className="text-[10px] uppercase font-mono xs:hidden">{showGuides ? 'ON' : 'OFF'}</span>
            </button>
          )}

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
        </div>

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
              : module === 'migs'
              ? 'Surgical Direct Gonioscopy | Swan-Jacob Prism (38° Tilt)'
              : 'Haag-Streit BQ 900 / Ellex Nd:YAG Slit-Lamp Photography'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Source: Clinical Ophthalmic Photography | Barraquer Speculum | Coaxial Retroillumination
        </div>
      </div>


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
