// Fluidics & Intraocular Pressure Biomechanical Engine
import { FluidicsState, FootPedalPosition } from '../types/ophthalmic';

export class FluidicsEngine {
  private state: FluidicsState;
  private ocularComplianceCcPerMmHg = 0.0035; // Scleral-corneal rigidity compliance
  private restingAcVolumeCc = 0.25; // Normal adult human AC volume ~ 200 - 250 µL
  private currentVolumeCc = 0.25;
  private tubingComplianceCcPerMmHg = 0.00018; // Modern low-compliance surgical cassette tubing
  private lastTimeMs = performance.now();

  constructor() {
    this.state = {
      bottleHeightCm: 75,
      forcedInfusionTargetIop: 32,
      vacuumActual: 0,
      vacuumTarget: 420,
      aspirationFlowActual: 0,
      aspirationFlowTarget: 35,
      iopActual: 21,
      chamberVolumeFraction: 1.0,
      isSurgeOccurring: false,
      isOccluded: false,
      endothelialContactAlert: false,
      posteriorCapsuleContactAlert: false,
      cornealFoldsPresent: false,
      leakRateCcMin: 1.8,
    };
  }

  public getState(): FluidicsState {
    return { ...this.state };
  }

  public setBottleHeight(heightCm: number) {
    this.state.bottleHeightCm = Math.max(30, Math.min(120, heightCm));
  }

  public setForcedInfusionTarget(targetIop: number) {
    this.state.forcedInfusionTargetIop = Math.max(15, Math.min(60, targetIop));
  }

  public setVacuumTarget(targetMmHg: number) {
    this.state.vacuumTarget = Math.max(0, Math.min(650, targetMmHg));
  }

  public setAspirationFlowTarget(flowCcMin: number) {
    this.state.aspirationFlowTarget = Math.max(0, Math.min(55, flowCcMin));
  }

  public setOcclusion(occluded: boolean) {
    if (this.state.isOccluded && !occluded && this.state.vacuumActual > 250) {
      // Occlusion break triggered! Surge event initiated
      this.state.isSurgeOccurring = true;
    }
    this.state.isOccluded = occluded;
  }

  public update(
    pedalPosition: FootPedalPosition,
    instrumentInEye: boolean,
    instrumentCoords: { x: number; y: number; z: number }, // normalized: z in [-1, 1], 1 is endothelium, -1 is posterior capsule
    isPhacoActive: boolean,
    deltaSec: number
  ): FluidicsState {
    const dt = Math.min(deltaSec, 0.1);

    // 1. Inflow Calculation
    let inflowRateCcMin = 0;
    if (instrumentInEye && pedalPosition >= 1) {
      // Inflow driven by hydrostatic bottle pressure: 1 cm H2O ≈ 0.7355 mmHg
      const bottlePressureMmHg = this.state.bottleHeightCm * 0.7355;
      const pressureGradient = Math.max(0, bottlePressureMmHg - this.state.iopActual);
      // Inflow sleeve resistance constant
      const sleeveConductance = 1.35; // cc/min per mmHg
      inflowRateCcMin = pressureGradient * sleeveConductance;
    }

    // 2. Outflow Calculation
    let aspirationFlowCcMin = 0;
    let incisionLeakCcMin = instrumentInEye ? 2.2 : 0.4; // Wound leak

    if (instrumentInEye && pedalPosition >= 2) {
      if (this.state.isOccluded) {
        // Occluded tip: flow drops towards zero, vacuum builds up towards target
        aspirationFlowCcMin = 1.0; // minimal micro-leak
        const vacuumRampRate = 480; // mmHg per second
        this.state.vacuumActual = Math.min(
          this.state.vacuumTarget,
          this.state.vacuumActual + vacuumRampRate * dt
        );
      } else {
        // Non-occluded: flow ramps to target
        aspirationFlowCcMin = this.state.aspirationFlowTarget;
        // Venturi/peristaltic baseline resistance vacuum
        const baselineVacuum = (aspirationFlowCcMin / 40) * 80;
        this.state.vacuumActual = Math.max(
          baselineVacuum,
          this.state.vacuumActual - 550 * dt
        );
      }
    } else {
      // Pedal 0 or 1: vacuum decays rapidly to zero
      this.state.vacuumActual = Math.max(0, this.state.vacuumActual - 800 * dt);
      aspirationFlowCcMin = 0;
    }

    // 3. Post-Occlusion Surge Dynamics
    let surgeOutflowCcMin = 0;
    if (this.state.isSurgeOccurring) {
      // Vacuum stored in compliant tubing rushes in
      surgeOutflowCcMin = (this.state.vacuumActual / 300) * 65; // surge peak up to 65 cc/min
      this.state.vacuumActual = Math.max(40, this.state.vacuumActual - 1200 * dt);
      if (this.state.vacuumActual <= 60) {
        this.state.isSurgeOccurring = false;
      }
    }

    this.state.aspirationFlowActual = aspirationFlowCcMin + surgeOutflowCcMin;
    this.state.leakRateCcMin = incisionLeakCcMin;

    const totalOutflowCcMin = this.state.aspirationFlowActual + incisionLeakCcMin;

    // 4. Anterior Chamber Fluid Balance Differential Equation
    // dV/dt (in cc/s) = (Inflow - Outflow) / 60
    const netFlowCcSec = (inflowRateCcMin - totalOutflowCcMin) / 60.0;
    this.currentVolumeCc = Math.max(
      0.05,
      Math.min(0.38, this.currentVolumeCc + netFlowCcSec * dt)
    );

    // Chamber volume fraction (1.0 = normal, 0.5 = moderate shallowing, <0.3 = severe flat AC)
    this.state.chamberVolumeFraction = this.currentVolumeCc / this.restingAcVolumeCc;

    // Intraocular pressure (IOP) calculation
    // dIOP = dV / compliance
    const dV = this.currentVolumeCc - this.restingAcVolumeCc;
    let computedIop = 16.0 + dV / this.ocularComplianceCcPerMmHg;
    if (pedalPosition === 0 && !instrumentInEye) {
      computedIop = 16.0; // physiological resting IOP
    }
    this.state.iopActual = Math.max(2.0, Math.min(65.0, computedIop));

    // Chamber collapse / corneal wrinkling threshold: IOP < 6 mmHg or Volume Fraction < 0.65
    this.state.cornealFoldsPresent = this.state.iopActual < 6.5 || this.state.chamberVolumeFraction < 0.68;

    // 5. Collision & Safety Proximity Alerts
    // Z coordinate: +1.0 = corneal endothelium, -1.0 = posterior capsule, 0 = iris plane
    if (instrumentInEye) {
      this.state.endothelialContactAlert = instrumentCoords.z > 0.85;
      this.state.posteriorCapsuleContactAlert = instrumentCoords.z < -0.80;
    } else {
      this.state.endothelialContactAlert = false;
      this.state.posteriorCapsuleContactAlert = false;
    }

    return this.getState();
  }
}
