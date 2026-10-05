import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SurgicalModule,
  PhacoStep,
  IolStep,
  YagStep,
  MigsStep,
  InstrumentType,
  FootPedalPosition,
  FluidicsState,
  PhacoMachineSettings,
  LocsNuclearGrade,
  PatientVitals,
  SurgicalReportCard
} from './types/ophthalmic';
import { FluidicsEngine } from './physics/FluidicsEngine';
import { CataractPhysicsEngine } from './physics/CataractPhysics';
import { IolPhysicsEngine } from './physics/IolPhysics';
import { YagLaserPhysicsEngine } from './physics/YagLaserPhysics';
import { MigsStentPhysicsEngine } from './physics/MigsStentPhysics';
import { audioEngine } from './audio/SoundSynthesizer';
import { TopVitalsBar } from './components/TopVitalsBar';
import { InstrumentTray } from './components/InstrumentTray';
import { FootPedalControl } from './components/FootPedalControl';
import { SurgicalViewport } from './components/SurgicalViewport';
import { PhacoMachinePanel } from './components/PhacoMachinePanel';
import { YagConsolePanel } from './components/YagConsolePanel';
import { MigsConsolePanel } from './components/MigsConsolePanel';
import { PostOpReportModal } from './components/PostOpReportModal';
import { ClinicalReferenceModal } from './components/ClinicalReferenceModal';
import { SurgicalGuidesModal } from './components/SurgicalGuidesModal';
import { SurgicalInstructionBanner } from './components/SurgicalInstructionBanner';
import { SplashScreen } from './components/SplashScreen';
import { SurgeryMainMenu } from './components/SurgeryMainMenu';
import { SurgicalVideoOverlayModal } from './components/SurgicalVideoOverlayModal';
import { SURGICAL_INSTRUCTIONS, SurgicalStepInstruction } from './data/surgicalInstructions';
import {
  Sparkles,
  Layers,
  Disc,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Compass
} from 'lucide-react';

export const App: React.FC = () => {
  // Screen mode: 'splash' -> 'menu' -> 'sim'
  const [screenMode, setScreenMode] = useState<'splash' | 'menu' | 'sim'>('splash');

  // Video Overlay State (Defaulting to real surgical video files in public folder)
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);
  const [videoUrls, setVideoUrls] = useState<Record<SurgicalModule, string>>({
    phaco: 'cataract.mp4',
    iol: 'cataract.mp4',
    yag: 'yag.mp4',
    migs: 'istent.mp4'
  });

  // Active Module & Step State
  const [module, setModule] = useState<SurgicalModule>('phaco');
  const [phacoStep, setPhacoStep] = useState<PhacoStep>('paracentesis');
  const [iolStep, setIolStep] = useState<IolStep>('ovd_bag_refill');
  const [yagStep, setYagStep] = useState<YagStep>('contact_lens_placement');
  const [migsStep, setMigsStep] = useState<MigsStep>('microscope_and_head_tilt');

  // Step Arrays for Navigation
  const phacoStepsList: PhacoStep[] = [
    'paracentesis',
    'clear_corneal_incision',
    'ovd_injection',
    'capsulorhexis',
    'hydrodissection',
    'phaco_chop',
    'cortex_removal'
  ];

  const iolStepsList: IolStep[] = [
    'ovd_bag_refill',
    'cartridge_insertion',
    'haptic_unfolding',
    'sinskey_dialing',
    'viscoelastic_washout'
  ];

  const yagStepsList: YagStep[] = [
    'contact_lens_placement',
    'aiming_focus',
    'offset_adjustment',
    'cruciate_capsulotomy',
    'post_yag_assessment'
  ];

  const migsStepsList: MigsStep[] = [
    'microscope_and_head_tilt',
    'gonioprism_placement',
    'viscoelastic_angle_deepening',
    'stent_1_deployment',
    'stent_2_deployment',
    'blood_reflux_and_washout'
  ];

  // Active Tool & Pedal
  const [activeInstrument, setActiveInstrument] = useState<InstrumentType>('mvr_blade');
  const [pedalPosition, setPedalPosition] = useState<FootPedalPosition>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Mobile Drawer State
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState<boolean>(false);
  const [isGuidesOpen, setIsGuidesOpen] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(true);

  // Elapsed operative time
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Theme State: 'dark' (pure black + emerald green) vs 'light' (pure white + emerald green)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('eye_sim_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('eye_sim_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Engines Refs
  const fluidicsEngineRef = useRef<FluidicsEngine>(new FluidicsEngine());
  const cataractEngineRef = useRef<CataractPhysicsEngine>(new CataractPhysicsEngine('NO3'));
  const iolEngineRef = useRef<IolPhysicsEngine>(new IolPhysicsEngine());
  const yagEngineRef = useRef<YagLaserPhysicsEngine>(new YagLaserPhysicsEngine());
  const migsEngineRef = useRef<MigsStentPhysicsEngine>(new MigsStentPhysicsEngine());

  // UI Mirror States
  const [fluidics, setFluidics] = useState<FluidicsState>(fluidicsEngineRef.current.getState());
  const [cataractGrade, setCataractGrade] = useState<LocsNuclearGrade>('NO3');
  const [phacoSettings, setPhacoSettings] = useState<PhacoMachineSettings>({
    mode: 'pulse',
    powerPercent: 45,
    pulseRatePps: 40,
    dutyCyclePercent: 60,
    burstIntervalMs: 80,
    cde: 0,
    ultrasoundActiveSeconds: 0
  });

  // Patient Vitals State
  const [vitals] = useState<PatientVitals>({
    heartRate: 72,
    bloodPressureSys: 122,
    bloodPressureDia: 78,
    spO2: 99,
    eye: 'OD',
    axialLengthMm: 23.45,
    anteriorChamberDepthMm: 3.15,
    cornealPachymetryMicrons: 540,
    cataractGrade: 'NO3',
    pupilDiameterMm: 8.2
  });

  // Re-render trigger tick
  const [, setTick] = useState(0);

  // Synchronize active tool when switching module
  useEffect(() => {
    if (module === 'phaco') {
      const rec = SURGICAL_INSTRUCTIONS[phacoStep]?.recommendedInstrument || 'mvr_blade';
      setActiveInstrument(rec);
    } else if (module === 'iol') {
      const rec = SURGICAL_INSTRUCTIONS[iolStep]?.recommendedInstrument || 'ovd_provisc';
      setActiveInstrument(rec);
    } else if (module === 'yag') {
      const rec = SURGICAL_INSTRUCTIONS[yagStep]?.recommendedInstrument || 'yag_laser';
      setActiveInstrument(rec);
    } else if (module === 'migs') {
      const rec = SURGICAL_INSTRUCTIONS[migsStep]?.recommendedInstrument || 'gonio_lens';
      setActiveInstrument(rec);
    }
  }, [module]);

  // Master Simulation & Audio Loop
  useEffect(() => {
    if (screenMode !== 'sim') return;
    let animId = 0;
    let lastTime = performance.now();

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // 1. Update Fluidics Differential Equation
      const instrumentInEye = activeInstrument !== 'none' && activeInstrument !== 'yag_laser';
      const updatedFluidics = fluidicsEngineRef.current.update(
        pedalPosition,
        instrumentInEye,
        { x: 0, y: 0, z: -0.2 },
        pedalPosition === 3,
        dt
      );
      setFluidics(updatedFluidics);

      // 2. Audio Engine Update
      audioEngine.updatePhacoSound(
        pedalPosition,
        updatedFluidics.vacuumActual,
        pedalPosition === 3 ? phacoSettings.powerPercent : 0,
        updatedFluidics.isOccluded,
        updatedFluidics.isSurgeOccurring
      );

      // 3. Collision alerts
      if (updatedFluidics.endothelialContactAlert || updatedFluidics.posteriorCapsuleContactAlert) {
        audioEngine.playCollisionAlert();
      }

      setTick(t => (t + 1) % 1000000);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [screenMode, activeInstrument, pedalPosition, phacoSettings.powerPercent]);

  // Operative timer ticker
  useEffect(() => {
    if (screenMode !== 'sim') return;
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [screenMode]);

  // Step Navigation Handlers
  const handlePrevStep = () => {
    if (module === 'phaco') {
      const idx = phacoStepsList.indexOf(phacoStep);
      if (idx > 0) {
        const nextStep = phacoStepsList[idx - 1];
        setPhacoStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      }
    } else if (module === 'iol') {
      const idx = iolStepsList.indexOf(iolStep);
      if (idx > 0) {
        const nextStep = iolStepsList[idx - 1];
        setIolStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      } else {
        // Step 8 -> Step 7: Transition back to Cortex Removal (I/A)
        setModule('phaco');
        setPhacoStep('cortex_removal');
        setActiveInstrument('ia_handpiece');
      }
    } else if (module === 'yag') {
      const idx = yagStepsList.indexOf(yagStep);
      if (idx > 0) {
        const nextStep = yagStepsList[idx - 1];
        setYagStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      }
    } else if (module === 'migs') {
      const idx = migsStepsList.indexOf(migsStep);
      if (idx > 0) {
        const nextStep = migsStepsList[idx - 1];
        setMigsStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      }
    }
  };

  const handleNextStep = () => {
    if (module === 'phaco') {
      const idx = phacoStepsList.indexOf(phacoStep);
      if (idx < phacoStepsList.length - 1) {
        const nextStep = phacoStepsList[idx + 1];
        setPhacoStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      } else {
        // Step 7 -> Step 8: Transition into Capsular Bag Refill & IOL Delivery
        setModule('iol');
        setIolStep('ovd_bag_refill');
        setActiveInstrument('ovd_provisc');
      }
    } else if (module === 'iol') {
      const idx = iolStepsList.indexOf(iolStep);
      if (idx < iolStepsList.length - 1) {
        const nextStep = iolStepsList[idx + 1];
        setIolStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      } else {
        // Step 12 -> completed! Open surgical report card
        setIsReportOpen(true);
      }
    } else if (module === 'yag') {
      const idx = yagStepsList.indexOf(yagStep);
      if (idx < yagStepsList.length - 1) {
        const nextStep = yagStepsList[idx + 1];
        setYagStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      }
    } else if (module === 'migs') {
      const idx = migsStepsList.indexOf(migsStep);
      if (idx < migsStepsList.length - 1) {
        const nextStep = migsStepsList[idx + 1];
        setMigsStep(nextStep);
        setActiveInstrument(SURGICAL_INSTRUCTIONS[nextStep].recommendedInstrument);
      }
    }
  };

  // Surgery Module Cycling (Prev / Next Surgery)
  const handlePrevSurgery = () => {
    if (module === 'phaco' || module === 'iol') {
      setModule('migs');
      setMigsStep('microscope_and_head_tilt');
      setActiveInstrument('gonio_lens');
    } else if (module === 'yag') {
      setModule('phaco');
      setPhacoStep('paracentesis');
      setActiveInstrument('mvr_blade');
    } else {
      setModule('yag');
      setYagStep('contact_lens_placement');
      setActiveInstrument('yag_laser');
    }
  };

  const handleNextSurgery = () => {
    if (module === 'phaco' || module === 'iol') {
      setModule('yag');
      setYagStep('contact_lens_placement');
      setActiveInstrument('yag_laser');
    } else if (module === 'yag') {
      setModule('migs');
      setMigsStep('microscope_and_head_tilt');
      setActiveInstrument('gonio_lens');
    } else {
      setModule('phaco');
      setPhacoStep('paracentesis');
      setActiveInstrument('mvr_blade');
    }
  };

  // Incision handling
  const handleIncisionAdvance = useCallback((type: 'paracentesis' | 'clear_corneal') => {
    cataractEngineRef.current.advanceIncision(type, type === 'paracentesis' ? 0.55 : 0.35);
    const inc = cataractEngineRef.current.incisions.find(i => i.type === type);
    if (inc?.completed) {
      if (type === 'paracentesis') {
        setPhacoStep('clear_corneal_incision');
        setActiveInstrument('keratome_2_4');
      } else {
        setPhacoStep('ovd_injection');
        setActiveInstrument('ovd_viscoat');
      }
    }
  }, []);

  // OVD injection
  const handleOvdInject = useCallback((type: 'viscoat' | 'provisc') => {
    cataractEngineRef.current.injectOvd(type, 0.6);
    if (module === 'phaco') {
      if (cataractEngineRef.current.ovdDispersiveCoverage > 50) {
        setPhacoStep('capsulorhexis');
        setActiveInstrument('cystotome');
      }
    } else if (module === 'iol') {
      iolEngineRef.current.refillBagWithOvd(0.5);
      setTick(t => t + 1);
      if (iolEngineRef.current.bagInflatedWithOvd) {
        setIolStep('cartridge_insertion');
        setActiveInstrument('iol_injector');
      }
    }
  }, [module]);

  // CCC Puncture & Drag
  const handleCccPuncture = useCallback((x: number, y: number) => {
    cataractEngineRef.current.initiateCystotomePuncture(x, y);
    cataractEngineRef.current.graspFlap();
    setActiveInstrument('utrata_forceps');
  }, []);

  const handleCccDrag = useCallback((x: number, y: number) => {
    const isShallow = fluidics.cornealFoldsPresent;
    cataractEngineRef.current.dragCccVector(x, y, isShallow, 0.08);
    if (cataractEngineRef.current.ccc.completed) {
      setPhacoStep('hydrodissection');
      setActiveInstrument('hydro_cannula');
    }
  }, [fluidics.cornealFoldsPresent]);

  // Hydrodissection
  const handleHydroPulse = useCallback(() => {
    cataractEngineRef.current.triggerHydrodissection(true, 0.35);
    cataractEngineRef.current.testNucleusRotation(90);
    audioEngine.playPedalClick(1);
    if (cataractEngineRef.current.hydro.corticalCleavingWaveFormed) {
      setPhacoStep('phaco_chop');
      setActiveInstrument('phaco_tip');
      setPedalPosition(1);
    }
  }, []);

  // Phaco ultrasound application
  const handlePhacoApply = useCallback((coords: { x: number; y: number; z: number }) => {
    const dt = 0.05;
    cataractEngineRef.current.applyPhacoUltrasound(
      phacoSettings.powerPercent,
      phacoSettings.dutyCyclePercent / 100,
      coords,
      dt
    );

    if (Math.random() < 0.15) {
      fluidicsEngineRef.current.setOcclusion(true);
      setTimeout(() => fluidicsEngineRef.current.setOcclusion(false), 900);
    }

    setPhacoSettings(prev => ({
      ...prev,
      cde: cataractEngineRef.current.totalCde,
      ultrasoundActiveSeconds: cataractEngineRef.current.totalUsSeconds
    }));

    if (cataractEngineRef.current.nucleus.remainingMassFraction <= 0.05) {
      setPhacoStep('cortex_removal');
      setActiveInstrument('ia_handpiece');
    }
  }, [phacoSettings.powerPercent, phacoSettings.dutyCyclePercent]);

  // I/A Cortex removal (Phaco Step 7) - guarded to never trigger in IOL module
  const handleIaAspirate = useCallback(() => {
    if (module === 'phaco' && phacoStep === 'cortex_removal') {
      cataractEngineRef.current.aspirateCortex(0.06);
      if (cataractEngineRef.current.nucleus.cortexRemnantsAspiratedFraction >= 0.95) {
        setModule('iol');
        setIolStep('ovd_bag_refill');
        setActiveInstrument('ovd_provisc');
      }
    } else if (module === 'iol' && iolStep === 'viscoelastic_washout') {
      // Direct call to IOL washout if user uses I/A wand during IOL washout
      iolEngineRef.current.aspirateViscoelastic(20);
      audioEngine.playPedalClick(2);
      setTick(t => t + 1);
      if (iolEngineRef.current.state.viscoelasticRetainedPercent <= 15) {
        setIsReportOpen(true);
      }
    }
  }, [module, phacoStep, iolStep]);

  // IOL Advance & Dialing
  const handleIolAdvance = useCallback(() => {
    iolEngineRef.current.advanceInjector(0.35);
    audioEngine.playPedalClick(1);
    setTick(t => t + 1);
    const progress = iolEngineRef.current.state.insertionProgressFraction;
    if (progress >= 0.6) {
      setIolStep('sinskey_dialing');
      setActiveInstrument('sinskey_hook');
    } else if (progress >= 0.3) {
      setIolStep('haptic_unfolding');
      setActiveInstrument('iol_injector');
    }
  }, []);

  const handleIolDial = useCallback((deg: number, dx: number, dy: number) => {
    iolEngineRef.current.dialWithSinskeyHook(deg, dx, dy);
    setTick(t => t + 1);
    if (iolEngineRef.current.state.trailingHapticInBag) {
      setIolStep('viscoelastic_washout');
      setActiveInstrument('ia_handpiece');
    }
  }, []);

  const handleIolWashout = useCallback(() => {
    iolEngineRef.current.aspirateViscoelastic(20);
    audioEngine.playPedalClick(2);
    setTick(t => t + 1);
    if (iolEngineRef.current.state.viscoelasticRetainedPercent <= 15) {
      setIsReportOpen(true);
    }
  }, []);

  // Nd:YAG Laser Fire & Step Progression
  const handleYagFire = useCallback((x: number, y: number, zMicrons: number) => {
    if (yagStep === 'contact_lens_placement') {
      yagEngineRef.current.settings.contactLensFitted = true;
      setYagStep('aiming_focus');
      setTick(t => t + 1);
      return;
    }

    yagEngineRef.current.fireLaser(x, y, zMicrons);
    setTick(t => t + 1);

    if (yagStep === 'aiming_focus') {
      setYagStep('offset_adjustment');
    } else if (yagStep === 'offset_adjustment') {
      setYagStep('cruciate_capsulotomy');
    } else if (yagStep === 'cruciate_capsulotomy') {
      if (yagEngineRef.current.capsulotomy.shots.length >= 4) {
        setYagStep('post_yag_assessment');
      }
    }
  }, [yagStep]);

  // MIGS Stent Actions
  const handleMigsTilt = useCallback((headDeg: number, scopeDeg: number) => {
    migsEngineRef.current.setPatientHeadTilt(headDeg);
    migsEngineRef.current.setMicroscopeTilt(scopeDeg);
    setTick(t => t + 1);
    if (migsEngineRef.current.state.gonioViewClarityPercent >= 70 && migsStep === 'microscope_and_head_tilt') {
      setMigsStep('gonioprism_placement');
      setActiveInstrument('gonio_lens');
    }
  }, [migsStep]);

  const handleMigsGonioPlace = useCallback(() => {
    migsEngineRef.current.placeGonioprism(true);
    setTick(t => t + 1);
    if (migsStep === 'gonioprism_placement') {
      setMigsStep('viscoelastic_angle_deepening');
      setActiveInstrument('ovd_provisc');
    }
  }, [migsStep]);

  const handleMigsOvdAngle = useCallback(() => {
    migsEngineRef.current.deepenAngleWithOvd();
    setTick(t => t + 1);
    if (migsStep === 'viscoelastic_angle_deepening') {
      setMigsStep('stent_1_deployment');
      setActiveInstrument('migs_injector');
    }
  }, [migsStep]);

  const handleMigsDeployStent = useCallback((stentIdx: number, clockHour: number, angleDeg: number, depthMicrons: number) => {
    migsEngineRef.current.deployStent(stentIdx, clockHour, angleDeg, depthMicrons);
    audioEngine.playPedalClick(1);
    setTick(t => t + 1);
    const deployedCount = migsEngineRef.current.state.stents.filter(s => s.deployed).length;
    if (deployedCount === 1 && migsStep === 'stent_1_deployment') {
      setMigsStep('stent_2_deployment');
    } else if (deployedCount >= 2 && migsStep === 'stent_2_deployment') {
      setMigsStep('blood_reflux_and_washout');
      setActiveInstrument('ia_handpiece');
    }
  }, [migsStep]);

  const handleMigsBloodReflux = useCallback(() => {
    migsEngineRef.current.triggerBloodRefluxTest();
    audioEngine.playPedalClick(2);
    setTick(t => t + 1);
  }, []);

  const handleMigsWashout = useCallback(() => {
    migsEngineRef.current.washOutViscoelastic(0.35);
    audioEngine.playPedalClick(1);
    setTick(t => t + 1);
  }, []);

  // Reset Module
  const handleRestartModule = () => {
    fluidicsEngineRef.current = new FluidicsEngine();
    cataractEngineRef.current = new CataractPhysicsEngine(cataractGrade);
    iolEngineRef.current = new IolPhysicsEngine();
    yagEngineRef.current = new YagLaserPhysicsEngine();
    migsEngineRef.current = new MigsStentPhysicsEngine();
    setPedalPosition(0);
    if (module === 'iol') {
      setModule('phaco');
      setActiveInstrument('mvr_blade');
    } else if (module === 'phaco') {
      setActiveInstrument('mvr_blade');
    } else if (module === 'yag') {
      setActiveInstrument('yag_laser');
    } else {
      setActiveInstrument('gonio_lens');
    }
    setPhacoStep('paracentesis');
    setIolStep('ovd_bag_refill');
    setYagStep('contact_lens_placement');
    setMigsStep('microscope_and_head_tilt');
    setElapsedSeconds(0);
    setIsReportOpen(false);
  };

  // Current Instruction Object
  const getCurrentInstruction = (): SurgicalStepInstruction => {
    if (module === 'phaco') {
      return SURGICAL_INSTRUCTIONS[phacoStep] || SURGICAL_INSTRUCTIONS['paracentesis'];
    } else if (module === 'iol') {
      return SURGICAL_INSTRUCTIONS[iolStep] || SURGICAL_INSTRUCTIONS['ovd_bag_refill'];
    } else if (module === 'yag') {
      return SURGICAL_INSTRUCTIONS[yagStep] || SURGICAL_INSTRUCTIONS['contact_lens_placement'];
    } else {
      return SURGICAL_INSTRUCTIONS[migsStep] || SURGICAL_INSTRUCTIONS['microscope_and_head_tilt'];
    }
  };

  // Compile Comprehensive Report Card
  const generateReportCard = (): SurgicalReportCard => {
    const ccc = cataractEngineRef.current.ccc;
    const cde = cataractEngineRef.current.totalCde;
    const endoLoss = cataractEngineRef.current.endothelialCellLossPercent;
    const pcPunctured = cataractEngineRef.current.nucleus.posteriorCapsulePunctured;
    const iolState = iolEngineRef.current.state;
    const yagCaps = yagEngineRef.current.capsulotomy;
    const yagSet = yagEngineRef.current.settings;

    let score = 95;
    const critiques: string[] = [];

    if (module === 'phaco') {
      if (cde > 18) { score -= 15; critiques.push(`CDE was high (${cde.toFixed(2)} %-sec). Minimize ultrasound near endothelium.`); }
      else { critiques.push('Efficient ultrasound energy titration with minimal thermal dissipation.'); }

      if (ccc.circularityScore >= 80) { critiques.push(`Superb CCC circularity (${ccc.circularityScore}%) with target ~5.2mm diameter.`); }
      else { score -= 12; critiques.push(`Capsulorhexis was irregular (circularity: ${ccc.circularityScore}%). Practice tangential vector traction.`); }

      if (ccc.isRunoutTowardZonules) {
        if (ccc.littleRescueExecuted) { critiques.push('Excellent execution of Little technique to rescue radial runaway tear.'); }
        else { score -= 25; critiques.push('Radial runaway tear reached zonules. High risk of zonular dehiscence.'); }
      }

      if (pcPunctured) {
        score -= 40;
        critiques.push('Posterior capsule rupture with ultrasound active within 1mm of capsule face. Anterior vitrectomy required.');
      } else {
        critiques.push('Posterior capsule remained intact and cleanly polished.');
      }
    } else if (module === 'iol') {
      if (iolState.opticRhexisOverlapPercent >= 90) { critiques.push('360° optic overlap achieved to prevent post-op PCO migration.'); }
      else { score -= 15; critiques.push('Incomplete anterior capsular overlap. Risk of optic tilt.'); }

      if (iolState.viscoelasticRetainedPercent <= 15) { critiques.push('Thorough retro-lens viscoelastic washout completed.'); }
      else { score -= 20; critiques.push(`Residual OVD detected (${iolState.viscoelasticRetainedPercent}%). Risk of postoperative IOP spike >40 mmHg.`); }
    } else if (module === 'yag') {
      if (yagCaps.iolPitsCount === 0) { critiques.push('Pristine optic preservation: Zero IOL pits or shockwave cracks.'); }
      else { score -= yagCaps.iolPitsCount * 15; critiques.push(`${yagCaps.iolPitsCount} IOL pits occurred due to inadequate posterior defocus offset.`); }

      if (yagCaps.vitreousFaceIntact) { critiques.push('Anterior hyaloid face fully preserved.'); }
      else { score -= 20; critiques.push('Posterior shockwave exceeded boundary; anterior hyaloid face broken.'); }

      if (yagCaps.cruciateOpeningAreaMm2 >= 7.0) { critiques.push('Full central visual axis cleared (cruciate aperture > 7.0 mm²).'); }
      else { score -= 10; critiques.push('Incomplete capsulotomy aperture. Enlarge cruciate cuts outside visual axis.'); }
    } else {
      // module === 'migs'
      const migs = migsEngineRef.current.state;
      const deployed = migs.stents.filter(s => s.deployed);
      const patent = migs.stents.filter(s => s.deployed && s.isPatentToVenousStream);

      if (deployed.length >= 2) {
        critiques.push(`Successfully deployed dual trabecular micro-stents into Schlemm's canal with collector channel alignment.`);
      } else if (deployed.length === 1) {
        score -= 15;
        critiques.push('Single micro-stent deployed. Target physiological outflow requires dual-stent placement.');
      } else {
        score -= 40;
        critiques.push('No micro-stents placed into trabecular meshwork.');
      }

      if (migs.bloodRefluxWaveConfirmed) {
        critiques.push(`Venous blood reflux wave verified direct communication with episcleral venous system (${migs.episcleralVenousPressureMmHg} mmHg physiological floor confirmed).`);
      } else {
        score -= 10;
        critiques.push('Episcleral venous blood reflux test was not elicited to confirm patent distal drainage.');
      }

      if (migs.currentIopMmHg <= 18) {
        critiques.push(`IOP reduced from ${migs.baselineIopMmHg} mmHg to target ${migs.currentIopMmHg.toFixed(1)} mmHg. Back-pressure floor prevents hypotony.`);
      } else {
        critiques.push(`Residual IOP remains elevated at ${migs.currentIopMmHg.toFixed(1)} mmHg. Verify viscoelastic washout.`);
      }
    }

    score = Math.max(25, Math.min(100, score));
    const grade = score >= 92 ? 'A+' : score >= 85 ? 'A' : score >= 75 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';

    return {
      overallScore: score,
      grade,
      module,
      operativeTimeSeconds: elapsedSeconds,
      cdeScore: {
        value: cde,
        expectedGrade: cataractGrade,
        rating: cde <= 12 ? 'Optimal' : cde <= 20 ? 'Acceptable' : 'Excessive'
      },
      cccCircularity: {
        value: ccc.circularityScore,
        rating: ccc.circularityScore >= 80 ? 'Ideal 5.0-5.5mm' : ccc.isRunoutTowardZonules ? 'Radial Runaway' : 'Slightly Eccentric'
      },
      endotheliumPreservation: {
        estimatedLossPercent: endoLoss,
        rating: endoLoss < 5 ? 'Excellent' : endoLoss < 15 ? 'Moderate Loss' : 'Severe Edema'
      },
      posteriorCapsuleState: pcPunctured ? 'Posterior Rupture + Vitreous Prolapse' : 'Intact',
      iolCentration: {
        offsetMm: Math.hypot(iolState.centrationOffsetMm.x, iolState.centrationOffsetMm.y),
        rating: Math.hypot(iolState.centrationOffsetMm.x, iolState.centrationOffsetMm.y) < 0.3 ? 'Perfect' : 'Subtle Tilt'
      },
      rhexisOverlapScore: {
        value: iolState.opticRhexisOverlapPercent,
        rating: iolState.opticRhexisOverlapPercent >= 80 ? 'Complete 360° Overlap' : 'Partial Overlap'
      },
      viscoelasticRetention: {
        value: iolState.viscoelasticRetainedPercent,
        rating: iolState.viscoelasticRetainedPercent <= 15 ? 'Clean Washout' : 'Residual Viscoelastic (IOP Risk)'
      },
      yagEfficiency: {
        totalShots: yagSet.burstCount,
        totalEnergyMj: yagSet.totalEnergyDeliveredMj,
        rating: yagSet.totalEnergyDeliveredMj <= 25 ? 'Minimal Energy' : 'Moderate'
      },
      iolPittingScore: {
        count: yagCaps.iolPitsCount,
        rating: yagCaps.iolPitsCount === 0 ? 'Zero Pits' : yagCaps.iolPitsCount < 3 ? 'Minor Pitting' : 'Severe Visual Axis Damage'
      },
      vitreousStatus: yagCaps.vitreousFaceIntact ? 'Preserved Hyaloid Face' : 'Breakthrough with Float',
      migsStentPlacement: {
        stentsDeployed: migsEngineRef.current.state.stents.filter(s => s.deployed).length,
        targetCollectorOstiaHit: migsEngineRef.current.state.stents.some(s => s.isPatentToVenousStream),
        rating: migsEngineRef.current.state.stents.filter(s => s.deployed && s.isPatentToVenousStream).length >= 2
          ? 'Optimal Bilateral Placement'
          : migsEngineRef.current.state.stents.some(s => s.isPatentToVenousStream)
          ? 'Single Stent Patent'
          : 'Miscalibrated Seating'
      },
      iopReduction: {
        baselineIop: migsEngineRef.current.state.baselineIopMmHg,
        finalIop: migsEngineRef.current.state.currentIopMmHg,
        venousFloorMmHg: migsEngineRef.current.state.episcleralVenousPressureMmHg,
        rating: migsEngineRef.current.state.currentIopMmHg <= 18
          ? 'Superb Physiological Titration'
          : migsEngineRef.current.state.currentIopMmHg <= 24
          ? 'Moderate Pressure Drop'
          : 'Elevated Residual IOP'
      },
      bloodstreamRefluxVerification: {
        observed: migsEngineRef.current.state.bloodRefluxWaveConfirmed,
        rating: migsEngineRef.current.state.bloodRefluxWaveConfirmed
          ? 'Patent Venous Communication (Fluid Wave OK)'
          : 'No Blood Wave (Check Stent Lumen)'
      },
      clinicalSummary: critiques
    };
  };

  // 1. Cinematic 20-Second Splash Screen
  if (screenMode === 'splash') {
    return <SplashScreen onComplete={() => setScreenMode('menu')} />;
  }

  // 2. Main 3-Surgery Hub Menu
  if (screenMode === 'menu') {
    return (
      <>
        <SurgeryMainMenu
          onSelectSurgery={(mod) => {
            setModule(mod);
            if (mod === 'yag') {
              setYagStep('contact_lens_placement');
              yagEngineRef.current.settings.contactLensFitted = false;
              setActiveInstrument('yag_laser');
            } else if (mod === 'phaco') {
              setPhacoStep('paracentesis');
              setActiveInstrument('mvr_blade');
            } else if (mod === 'migs') {
              setMigsStep('microscope_and_head_tilt');
              setActiveInstrument('gonio_lens');
            }
            setScreenMode('sim');
          }}
          onOpenVideoOverlay={(mod) => {
            setModule(mod);
            setIsVideoOpen(true);
          }}
          onOpenPdfGuides={(mod) => {
            setModule(mod === 'master' ? 'phaco' : mod);
            setIsGuidesOpen(true);
          }}
          onOpenReference={() => setIsReferenceOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <SurgicalVideoOverlayModal
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          currentSurgery={module}
          videoUrls={videoUrls}
          onUpdateVideoUrl={(mod, url) => setVideoUrls(prev => ({ ...prev, [mod]: url }))}
        />

        <ClinicalReferenceModal
          isOpen={isReferenceOpen}
          onClose={() => setIsReferenceOpen(false)}
        />

        <SurgicalGuidesModal
          isOpen={isGuidesOpen}
          onClose={() => setIsGuidesOpen(false)}
          initialModule={module}
        />
      </>
    );
  }

  // 3. High-Fidelity Active Surgery Simulation
  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. Top Surgical Vitals & Telemetry Bar */}
      <TopVitalsBar
        module={module}
        phacoStep={phacoStep}
        iolStep={iolStep}
        yagStep={yagStep}
        migsStep={migsStep}
        fluidics={fluidics}
        cde={cataractEngineRef.current.totalCde}
        vitals={vitals}
        elapsedSeconds={elapsedSeconds}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenReference={() => setIsReferenceOpen(true)}
        onOpenGuides={() => setIsGuidesOpen(true)}
        onOpenMenu={() => setScreenMode('menu')}
        onOpenVideo={() => setIsVideoOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted(!isMuted);
          audioEngine.setMuted(!isMuted);
        }}
        onToggleTools={() => setIsToolsOpen(!isToolsOpen)}
        isToolsOpen={isToolsOpen}
        onToggleConsole={() => setIsConsoleOpen(!isConsoleOpen)}
        isConsoleOpen={isConsoleOpen}
        activeInstrument={activeInstrument}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Module Selector Bar with Step Navigation & Active Tool Pill */}
      <div
        onWheel={(e) => {
          if (e.deltaY) e.currentTarget.scrollLeft += e.deltaY;
        }}
        className="bg-[#000000] border-b border-[#1b2b44] px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between text-xs gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-400 font-medium hidden md:inline">Surgeries:</span>
            <button
              onClick={handlePrevSurgery}
              className="p-1 rounded-lg bg-[#000000] hover:bg-[#0f1f18] border border-emerald-900/60 text-slate-400 hover:text-white transition active:scale-95"
              title="Switch to Previous Surgery"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextSurgery}
              className="p-1 rounded-lg bg-[#000000] hover:bg-[#0f1f18] border border-emerald-900/60 text-slate-400 hover:text-white transition active:scale-95"
              title="Switch to Next Surgery"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-[#000000] p-1 rounded-xl border border-emerald-900/40">
            {/* Procedure 1: Combined Cataract & Foldable IOL */}
            <button
              onClick={() => {
                if (module !== 'phaco' && module !== 'iol') {
                  setModule('phaco');
                  setPhacoStep('paracentesis');
                  setActiveInstrument('mvr_blade');
                }
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                module === 'phaco' || module === 'iol'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400/60'
                  : 'text-emerald-400/70 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">1. Cataract & Foldable IOL (12 Steps)</span>
              <span className="sm:hidden">1. Cataract & IOL</span>
            </button>

            {/* Procedure 2: Nd:YAG Laser Capsulotomy */}
            <button
              onClick={() => {
                setModule('yag');
                setYagStep('contact_lens_placement');
                setActiveInstrument('yag_laser');
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                module === 'yag'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400/60'
                  : 'text-emerald-400/70 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">2. Nd:YAG Laser (5 Steps)</span>
              <span className="sm:hidden">2. Nd:YAG</span>
            </button>

            {/* Procedure 3: MIGS Glaucoma Trabecular Micro-Bypass Stent */}
            <button
              onClick={() => {
                setModule('migs');
                setMigsStep('microscope_and_head_tilt');
                setActiveInstrument('gonio_lens');
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                module === 'migs'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400/60'
                  : 'text-emerald-400/70 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">3. MIGS Glaucoma Stent (6 Steps)</span>
              <span className="sm:hidden">3. MIGS Stent</span>
            </button>
          </div>

          {/* Quick Step Navigation Arrows */}
          <div className="flex items-center gap-1 bg-[#000000] px-1.5 sm:px-2 py-1 rounded-xl border border-emerald-900/40">
            <button
              onClick={handlePrevStep}
              className="p-1 rounded hover:bg-[#121f33] text-slate-400 hover:text-white transition"
              title="Previous Surgical Step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 px-1 font-semibold whitespace-nowrap">
              Step {getCurrentInstruction().stepNumber} / {module === 'yag' ? 5 : module === 'migs' ? 6 : 12}
            </span>
            <button
              onClick={handleNextStep}
              className="p-1 rounded hover:bg-[#121f33] text-slate-400 hover:text-white transition"
              title="Next Surgical Step"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spoken Attending Voice & Surgical Instructions HUD docked in empty toolbar space */}
        <div className="flex-1 flex items-center justify-end min-w-0 max-w-xl xl:max-w-2xl px-1">
          <SurgicalInstructionBanner
            currentInstruction={getCurrentInstruction()}
            onSelectInstrument={(tool) => setActiveInstrument(tool as InstrumentType)}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides(g => !g)}
          />
        </div>

        {/* Right side: Quick Tool Chip + Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Tool Chip (Tapping opens the Hamburger Tools Drawer) */}
          <button
            onClick={() => setIsToolsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#000000] hover:bg-[#070e0a] border border-emerald-600/50 text-emerald-400 transition text-[11px] font-mono shadow-sm active:scale-95"
            title="Click to Open Tools Menu (Hamburger Drawer)"
          >
            <span className="text-emerald-500/70 hidden sm:inline">Tool:</span>
            <span className="font-bold uppercase text-white truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
              {activeInstrument.replace('_', ' ')}
            </span>
          </button>

          {/* Quick Reset Button */}
          <button
            onClick={handleRestartModule}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-[#0e1726] hover:bg-[#16253c] border border-emerald-900/40 text-emerald-300 hover:text-white text-xs transition active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden xs:inline">Reset Eye</span>
            <span className="xs:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Tray + Center Viewport + Right Machine Console */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sterile Instrument Tray (Desktop Sidebar + Mobile Drawer) */}
        <InstrumentTray
          module={module}
          activeInstrument={activeInstrument}
          onSelectInstrument={(inst) => setActiveInstrument(inst)}
          isOpenMobile={isToolsOpen}
          onCloseMobile={() => setIsToolsOpen(false)}
        />

        {/* Center High-Fidelity 3D/2D Viewport */}
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
          <SurgicalViewport
            module={module}
            activeInstrument={activeInstrument}
            pedalPosition={pedalPosition}
            fluidics={fluidics}
            cccState={cataractEngineRef.current.ccc}
            hydroState={cataractEngineRef.current.hydro}
            nucleusState={cataractEngineRef.current.nucleus}
            iolState={iolEngineRef.current.state}
            yagState={yagEngineRef.current.capsulotomy}
            yagSettings={yagEngineRef.current.settings}
            incisions={cataractEngineRef.current.incisions}
            ovdCoverage={{
              dispersive: cataractEngineRef.current.ovdDispersiveCoverage,
              cohesive: cataractEngineRef.current.ovdCohesiveDepth
            }}
            currentStepId={module === 'phaco' ? phacoStep : module === 'iol' ? iolStep : module === 'yag' ? yagStep : migsStep}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides(g => !g)}
            onIncisionAdvance={handleIncisionAdvance}
            onOvdInject={handleOvdInject}
            onCccPuncture={handleCccPuncture}
            onCccDrag={handleCccDrag}
            onHydroPulse={handleHydroPulse}
            onHydroRotate={(deg) => cataractEngineRef.current.testNucleusRotation(deg)}
            onPhacoApply={handlePhacoApply}
            onIaAspirate={handleIaAspirate}
            onIolAdvance={handleIolAdvance}
            onIolDial={handleIolDial}
            onIolWashout={handleIolWashout}
            onYagFire={handleYagFire}
            migsState={migsEngineRef.current.state}
            onMigsTilt={handleMigsTilt}
            onMigsGonioPlace={handleMigsGonioPlace}
            onMigsOvdAngle={handleMigsOvdAngle}
            onMigsDeployStent={handleMigsDeployStent}
            onMigsBloodReflux={handleMigsBloodReflux}
            onMigsWashout={handleMigsWashout}
          />

          {/* Bottom Surgeon Foot Pedal Bar */}
          <FootPedalControl
            pedalPosition={pedalPosition}
            onPedalChange={(pos) => setPedalPosition(pos)}
            disabled={module === 'yag'}
          />
        </div>

        {/* Desktop Docked Machine Console (Hidden on < lg screens) */}
        <div className="hidden lg:flex h-full">
          {module === 'yag' ? (
            <YagConsolePanel
              settings={yagEngineRef.current.settings}
              capsulotomy={yagEngineRef.current.capsulotomy}
              onUpdateSettings={(newSet) => {
                Object.assign(yagEngineRef.current.settings, newSet);
                if (newSet.contactLensFitted && yagStep === 'contact_lens_placement') {
                  setYagStep('aiming_focus');
                }
                setTick(t => t + 1);
              }}
              onResetLaser={() => {
                yagEngineRef.current.reset();
                setYagStep('contact_lens_placement');
                setTick(t => t + 1);
              }}
            />
          ) : module === 'migs' ? (
            <MigsConsolePanel
              state={migsEngineRef.current.state}
              onUpdateTilt={(scope, head) => {
                migsEngineRef.current.setMicroscopeTilt(scope);
                migsEngineRef.current.setPatientHeadTilt(head);
                setTick(t => t + 1);
              }}
              onTriggerBloodReflux={handleMigsBloodReflux}
            />
          ) : (
            <PhacoMachinePanel
              fluidics={fluidics}
              settings={phacoSettings}
              cataractGrade={cataractGrade}
              onUpdateSettings={(newSet) => {
                setPhacoSettings(prev => ({ ...prev, ...newSet }));
              }}
              onUpdateFluidics={(bottle, vac, flow) => {
                fluidicsEngineRef.current.setBottleHeight(bottle);
                fluidicsEngineRef.current.setVacuumTarget(vac);
                fluidicsEngineRef.current.setAspirationFlowTarget(flow);
                setFluidics(fluidicsEngineRef.current.getState());
              }}
              onGradeChange={(g) => {
                setCataractGrade(g);
                cataractEngineRef.current.cataractGrade = g;
              }}
            />
          )}
        </div>

        {/* Mobile Machine Console Drawer (Slide-over drawer on < lg screens) */}
        {isConsoleOpen && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsConsoleOpen(false)}
            aria-label="Close machine console backdrop"
          />
        )}
        <div
          className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] h-full bg-[#0a101d] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
            isConsoleOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {module === 'yag' ? (
            <YagConsolePanel
              settings={yagEngineRef.current.settings}
              capsulotomy={yagEngineRef.current.capsulotomy}
              onUpdateSettings={(newSet) => {
                Object.assign(yagEngineRef.current.settings, newSet);
                setTick(t => t + 1);
              }}
              onResetLaser={() => {
                yagEngineRef.current.capsulotomy.shots = [];
                yagEngineRef.current.capsulotomy.cruciateOpeningAreaMm2 = 0;
                yagEngineRef.current.capsulotomy.iolPitsCount = 0;
                yagEngineRef.current.settings.burstCount = 0;
                yagEngineRef.current.settings.totalEnergyDeliveredMj = 0;
                setTick(t => t + 1);
              }}
              onClose={() => setIsConsoleOpen(false)}
            />
          ) : module === 'migs' ? (
            <MigsConsolePanel
              state={migsEngineRef.current.state}
              onUpdateTilt={(scope, head) => {
                migsEngineRef.current.setMicroscopeTilt(scope);
                migsEngineRef.current.setPatientHeadTilt(head);
                setTick(t => t + 1);
              }}
              onTriggerBloodReflux={handleMigsBloodReflux}
              onClose={() => setIsConsoleOpen(false)}
            />
          ) : (
            <PhacoMachinePanel
              fluidics={fluidics}
              settings={phacoSettings}
              cataractGrade={cataractGrade}
              onUpdateSettings={(newSet) => {
                setPhacoSettings(prev => ({ ...prev, ...newSet }));
              }}
              onUpdateFluidics={(bottle, vac, flow) => {
                fluidicsEngineRef.current.setBottleHeight(bottle);
                fluidicsEngineRef.current.setVacuumTarget(vac);
                fluidicsEngineRef.current.setAspirationFlowTarget(flow);
                setFluidics(fluidicsEngineRef.current.getState());
              }}
              onGradeChange={(g) => {
                setCataractGrade(g);
                cataractEngineRef.current.cataractGrade = g;
              }}
              onClose={() => setIsConsoleOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <SurgicalVideoOverlayModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        currentSurgery={module}
        videoUrls={videoUrls}
        onUpdateVideoUrl={(mod, url) => setVideoUrls(prev => ({ ...prev, [mod]: url }))}
      />

      <PostOpReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={generateReportCard()}
        onRestartModule={handleRestartModule}
      />

      <ClinicalReferenceModal
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
      />

      <SurgicalGuidesModal
        isOpen={isGuidesOpen}
        onClose={() => setIsGuidesOpen(false)}
        initialModule={module}
      />
    </div>
  );
};

export default App;
