// Ophthalmic Surgical Simulator - Medical & Simulation Type Definitions

export type SurgicalModule = 'phaco' | 'iol' | 'yag' | 'migs';

export type PhacoStep = 
  | 'paracentesis'
  | 'clear_corneal_incision'
  | 'ovd_injection'
  | 'capsulorhexis'
  | 'hydrodissection'
  | 'phaco_chop'
  | 'cortex_removal';

export type IolStep =
  | 'ovd_bag_refill'
  | 'cartridge_insertion'
  | 'haptic_unfolding'
  | 'sinskey_dialing'
  | 'viscoelastic_washout';

export type YagStep =
  | 'contact_lens_placement'
  | 'aiming_focus'
  | 'offset_adjustment'
  | 'cruciate_capsulotomy'
  | 'post_yag_assessment';

export type MigsStep =
  | 'microscope_and_head_tilt'
  | 'gonioprism_placement'
  | 'viscoelastic_angle_deepening'
  | 'stent_1_deployment'
  | 'stent_2_deployment'
  | 'blood_reflux_and_washout';

export type InstrumentType =
  | 'none'
  | 'mvr_blade'
  | 'keratome_2_4'
  | 'ovd_viscoat'
  | 'ovd_provisc'
  | 'cystotome'
  | 'utrata_forceps'
  | 'hydro_cannula'
  | 'phaco_tip'
  | 'ia_handpiece'
  | 'iol_injector'
  | 'sinskey_hook'
  | 'yag_laser'
  | 'gonio_lens'
  | 'migs_injector';

export type FootPedalPosition = 0 | 1 | 2 | 3; // 0: Idle, 1: Irrigation, 2: Aspiration, 3: Phaco Power

export type PhacoMode = 'continuous' | 'pulse' | 'burst';

export type LocsNuclearGrade = 'NO1' | 'NO2' | 'NO3' | 'NO4' | 'NO5' | 'NO6';

export interface FluidicsState {
  bottleHeightCm: number;       // 40 - 110 cm H2O (gravity or active forced infusion)
  forcedInfusionTargetIop: number; // 20 - 60 mmHg
  vacuumActual: number;         // 0 - 650 mmHg
  vacuumTarget: number;         // max setting
  aspirationFlowActual: number; // 0 - 50 cc/min
  aspirationFlowTarget: number; // setting
  iopActual: number;            // normal 15-21, critical <5 or >50 mmHg
  chamberVolumeFraction: number; // 1.0 = deep, < 0.6 = shallowing, < 0.3 = collapse
  isSurgeOccurring: boolean;
  isOccluded: boolean;
  endothelialContactAlert: boolean;
  posteriorCapsuleContactAlert: boolean;
  cornealFoldsPresent: boolean;
  leakRateCcMin: number;
}

export interface PhacoMachineSettings {
  mode: PhacoMode;
  powerPercent: number;         // 0 - 100%
  pulseRatePps: number;         // 10 - 100 pps
  dutyCyclePercent: number;     // 20 - 80%
  burstIntervalMs: number;      // 20 - 200 ms
  cde: number;                  // Cumulative Dissipated Energy
  ultrasoundActiveSeconds: number;
}

export interface YagLaserSettings {
  energyMj: number;             // 0.8 - 2.5 mJ
  pulseMode: 1 | 2 | 3;         // 1: single, 2: double, 3: triple pulse
  focalOffsetMicrons: number;   // -100 to +350 µm (posterior defocus: +100 to +250 µm is safe)
  burstCount: number;
  totalEnergyDeliveredMj: number;
  contactLensFitted: boolean;
  contactLensType: 'Abraham' | 'Oshert';
  aimingBeamIntensity: number;  // 0 - 100%
  slitBeamWidthMm: number;      // 0 - 14 mm
  slitBeamAngleDeg: number;     // -90 to +90 deg
  retroilluminationActive: boolean;
}

export interface PatientVitals {
  heartRate: number;            // bpm
  bloodPressureSys: number;     // mmHg
  bloodPressureDia: number;     // mmHg
  spO2: number;                 // %
  eye: 'OD' | 'OS';
  axialLengthMm: number;        // e.g. 23.8 mm
  anteriorChamberDepthMm: number;// e.g. 3.2 mm
  cornealPachymetryMicrons: number;// e.g. 540 µm
  cataractGrade: LocsNuclearGrade;
  pupilDiameterMm: number;      // 7.5 - 8.5 mm (pharmacologically dilated)
}

export interface IncisionPoint {
  x: number;
  y: number;
  angleRad: number;
  widthMm: number;
  depthFraction: number; // 0 to 1 (full penetration into AC)
  type: 'paracentesis' | 'clear_corneal';
  completed: boolean;
  plane?: number; // 0: untouched, 1: groove (300µm), 2: tunnel (1.5mm), 3: Descemet entry
  planeName?: string;
  clockPosition?: string; // e.g. "10:00" or "1:30"
}

export interface CapsulorhexisPathPoint {
  x: number;
  y: number;
  isRunaway: boolean;
}

export interface CapsulorhexisState {
  initiated: boolean;
  completed: boolean;
  punctured: boolean;
  flapGrasped: boolean;
  path: CapsulorhexisPathPoint[];
  currentTip: { x: number; y: number };
  tearVectorAngle: number;
  targetRadiusMm: number; // 2.5 - 2.75 mm (diameter 5.0 - 5.5 mm)
  circularityScore: number; // 0 - 100%
  averageDiameterMm: number;
  isRunoutTowardZonules: boolean;
  littleRescueExecuted: boolean;
  zonularDehiscenceOccurred: boolean;
}

export interface HydrodissectionState {
  cannulaEngaged: boolean;
  fluidWaveProgress: number; // 0 to 1
  corticalCleavingWaveFormed: boolean;
  nucleusRotationDeg: number; // degree of free rotation
  freeRotationVerified: boolean;
}

export interface LensQuadrant {
  id: number;
  angleCenterRad: number;
  intactFraction: number; // 1.0 down to 0 when emulsified
  isMobilized: boolean;
  isChapped: boolean;
}

export interface PhacoNucleusState {
  grooveDepthFraction: number; // 0 to 1 (0.8 ideal before cracking)
  quadrants: LensQuadrant[];
  isDivided: boolean;
  remainingMassFraction: number;
  epunucleusAspirated: boolean;
  cortexRemnantsAspiratedFraction: number; // 0 to 1
  posteriorCapsulePunctured: boolean;
}

export interface IolPositionState {
  isLoaded: boolean;
  insertionProgressFraction: number; // 0 to 1
  leadingHapticInBag: boolean;
  opticInChamber: boolean;
  opticInBag: boolean;
  trailingHapticInBag: boolean;
  rotationDeg: number;
  centrationOffsetMm: { x: number; y: number };
  opticRhexisOverlapPercent: number; // ideal 100%
  viscoelasticRetainedPercent: number; // should be < 5% after washout
}

export interface YagTargetPoint {
  x: number;
  y: number;
  powerUsedMj: number;
  pittedIol: boolean;
  vitreousRupture: boolean;
  timestamp: number;
}

export interface YagCapsulotomyState {
  shots: YagTargetPoint[];
  cruciateOpeningAreaMm2: number;
  visualAxisCleared: boolean;
  iolPitsCount: number;
  vitreousFaceIntact: boolean;
  postOpIopSpikeRiskMmHg: number;
}

export interface MigsStent {
  id: string;
  clockPosition: number; // e.g., 2.5 or 3.5 o'clock (nasal quadrant)
  deployed: boolean;
  angleAngleDeg: number; // ideal 15 - 30 degrees to TM
  seatingDepthMicrons: number; // ideal 360µm (lumen in Schlemm's canal, inlet in AC)
  isPatentToVenousStream: boolean;
  collectorChannelAlignmentScore: number; // 0 - 100%
}

export interface MigsState {
  microscopeTiltDeg: number; // Target 35 - 40°
  patientHeadTiltDeg: number; // Target 30 - 35°
  gonioprismPlaced: boolean;
  gonioViewClarityPercent: number; // 0 - 100%
  angleDeepenedWithOvd: boolean;
  stents: MigsStent[];
  stentsRemainingInInjector: number; // Starts at 2 (e.g. iStent inject W system)
  baselineIopMmHg: number; // Typically 28 - 34 mmHg in severe glaucoma
  episcleralVenousPressureMmHg: number; // Physiologic venous floor: 8.0 - 10.0 mmHg
  currentIopMmHg: number;
  outflowFacilityMicrolitersPerMinPerMmHg: number; // 0.08 baseline -> 0.28 post-stents
  bloodRefluxWaveConfirmed: boolean;
  hypotonyProtectedByVenousBackpressure: boolean;
}

export interface SurgicalReportCard {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  module: SurgicalModule;
  operativeTimeSeconds: number;
  // Phaco specific
  cdeScore: { value: number; expectedGrade: string; rating: 'Optimal' | 'Acceptable' | 'Excessive' };
  cccCircularity: { value: number; rating: 'Ideal 5.0-5.5mm' | 'Slightly Eccentric' | 'Radial Runaway' };
  endotheliumPreservation: { estimatedLossPercent: number; rating: 'Excellent' | 'Moderate Loss' | 'Severe Edema' };
  posteriorCapsuleState: 'Intact' | 'Polished' | 'Micro-defect' | 'Posterior Rupture + Vitreous Prolapse';
  // IOL specific
  iolCentration: { offsetMm: number; rating: 'Perfect' | 'Subtle Tilt' | 'Decentered' };
  rhexisOverlapScore: { value: number; rating: 'Complete 360° Overlap' | 'Partial Overlap' | 'Anterior Optic Capture' };
  viscoelasticRetention: { value: number; rating: 'Clean Washout' | 'Residual Viscoelastic (IOP Risk)' };
  // YAG specific
  yagEfficiency: { totalShots: number; totalEnergyMj: number; rating: 'Minimal Energy' | 'Moderate' | 'Excessive' };
  iolPittingScore: { count: number; rating: 'Zero Pits' | 'Minor Pitting' | 'Severe Visual Axis Damage' };
  vitreousStatus: 'Preserved Hyaloid Face' | 'Breakthrough with Float' | 'Anterior Vitreous Prolapse';
  // MIGS Stent specific
  migsStentPlacement?: {
    stentsDeployed: number;
    targetCollectorOstiaHit: boolean;
    rating: 'Optimal Bilateral Placement' | 'Single Stent Patent' | 'Miscalibrated Seating';
  };
  iopReduction?: {
    baselineIop: number;
    finalIop: number;
    venousFloorMmHg: number; // 8 - 10 mmHg
    rating: 'Superb Physiological Titration' | 'Moderate Pressure Drop' | 'Elevated Residual IOP';
  };
  bloodstreamRefluxVerification?: {
    observed: boolean;
    rating: 'Patent Venous Communication (Fluid Wave OK)' | 'No Blood Wave (Check Stent Lumen)';
  };
  clinicalSummary: string[];
}
