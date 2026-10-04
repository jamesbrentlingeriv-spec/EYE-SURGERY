// Minimally Invasive Glaucoma Surgery (MIGS) - Trabecular Micro-Bypass Physics Engine
// Models Schlemm's Canal Direct-to-Bloodstream Drainage & Episcleral Venous Back-Pressure (8-10 mmHg)

import { MigsState, MigsStent } from '../types/ophthalmic';

export class MigsStentPhysicsEngine {
  public state: MigsState;

  // Goldmann Outflow Parameters
  private aqueousProductionF: number = 2.4; // µL/min from ciliary processes
  private uveoscleralOutflowU: number = 0.35; // µL/min
  private diseasedTrabecularFacility: number = 0.075; // µL/min/mmHg in glaucoma (normally ~0.28)
  private stentAddedFacility: number = 0.095; // µL/min/mmHg per patent micro-stent
  private viscoRetainedFraction: number = 1.0;

  constructor() {
    this.state = {
      microscopeTiltDeg: 0,
      patientHeadTiltDeg: 0,
      gonioprismPlaced: false,
      gonioViewClarityPercent: 0,
      angleDeepenedWithOvd: false,
      stents: [
        {
          id: 'migs_stent_1',
          clockPosition: 2.5, // Nasal upper-mid quadrant
          deployed: false,
          angleAngleDeg: 0,
          seatingDepthMicrons: 0,
          isPatentToVenousStream: false,
          collectorChannelAlignmentScore: 0
        },
        {
          id: 'migs_stent_2',
          clockPosition: 4.0, // Nasal lower-mid quadrant (~2 clock hours away)
          deployed: false,
          angleAngleDeg: 0,
          seatingDepthMicrons: 0,
          isPatentToVenousStream: false,
          collectorChannelAlignmentScore: 0
        }
      ],
      stentsRemainingInInjector: 2,
      baselineIopMmHg: 32.5,
      episcleralVenousPressureMmHg: 8.5, // Physiologic venous floor: 8 - 10 mmHg
      currentIopMmHg: 32.5,
      outflowFacilityMicrolitersPerMinPerMmHg: 0.075,
      bloodRefluxWaveConfirmed: false,
      hypotonyProtectedByVenousBackpressure: true
    };
  }

  // Microscope Tilt: Target 35° - 45° toward surgeon
  public setMicroscopeTilt(deg: number) {
    this.state.microscopeTiltDeg = Math.max(0, Math.min(50, deg));
    this.updateGonioClarity();
  }

  // Patient Head Tilt: Target 30° - 40° away from surgeon
  public setPatientHeadTilt(deg: number) {
    this.state.patientHeadTiltDeg = Math.max(0, Math.min(45, deg));
    this.updateGonioClarity();
  }

  // Direct Surgical Gonioprism Placement
  public placeGonioprism(placed: boolean) {
    this.state.gonioprismPlaced = placed;
    this.updateGonioClarity();
  }

  // Calculate optical gonioscopic clarity of iridocorneal angle landmarks
  private updateGonioClarity() {
    if (!this.state.gonioprismPlaced) {
      this.state.gonioViewClarityPercent = 0;
      return;
    }
    // Optimal alignment occurs when combined tilt is roughly 70° - 85°
    const combinedTilt = this.state.microscopeTiltDeg + this.state.patientHeadTiltDeg;
    let clarity = 0;
    if (combinedTilt >= 50) {
      clarity = Math.min(100, ((combinedTilt - 50) / 25) * 100);
    }
    if (this.state.angleDeepenedWithOvd) {
      clarity = Math.min(100, clarity * 1.15);
    }
    this.state.gonioViewClarityPercent = Math.round(clarity);
  }

  // Deepen anterior chamber angle with cohesive OVD
  public deepenAngleWithOvd() {
    this.state.angleDeepenedWithOvd = true;
    this.updateGonioClarity();
  }

  // Deploy Micro-Stent into Schlemm's Canal (e.g. iStent inject W system)
  public deployStent(stentIndex: number, clockHour: number, angleDeg: number, depthMicrons: number) {
    if (stentIndex < 0 || stentIndex >= this.state.stents.length) return;
    const stent = this.state.stents[stentIndex];
    if (stent.deployed) return;

    stent.deployed = true;
    stent.clockPosition = clockHour;
    stent.angleAngleDeg = angleDeg;
    stent.seatingDepthMicrons = depthMicrons;

    // Evaluate placement accuracy:
    // Ideal trajectory is 15° to 30° tangential to the pigmented trabecular meshwork band
    // Ideal depth is 340µm - 380µm (lumen fully in Schlemm's canal, thorax in TM, inlet in AC)
    const angleQuality = Math.max(0, 1 - Math.abs(angleDeg - 22) / 20);
    const depthQuality = Math.max(0, 1 - Math.abs(depthMicrons - 360) / 70);
    stent.collectorChannelAlignmentScore = Math.round((angleQuality * 0.5 + depthQuality * 0.5) * 100);

    // Stent is patent to venous bloodstream if alignment score is > 60%
    if (stent.collectorChannelAlignmentScore >= 60) {
      stent.isPatentToVenousStream = true;
    }

    this.state.stentsRemainingInInjector = Math.max(0, this.state.stentsRemainingInInjector - 1);
    this.recalculateHemodynamics();
  }

  // Goldmann Equation Hemodynamic Recalculation:
  // IOP = (F - U) / C + EVP
  public recalculateHemodynamics() {
    let totalFacility = this.diseasedTrabecularFacility;

    this.state.stents.forEach((stent) => {
      if (stent.deployed && stent.isPatentToVenousStream) {
        // Each patent micro-stent provides a direct low-resistance conduit into Schlemm's canal
        const stentContribution = this.stentAddedFacility * (stent.collectorChannelAlignmentScore / 100);
        totalFacility += stentContribution;
      }
    });

    this.state.outflowFacilityMicrolitersPerMinPerMmHg = totalFacility;

    // Goldmann Equation:
    const evp = this.state.episcleralVenousPressureMmHg; // 8.5 mmHg floor
    const netFlow = this.aqueousProductionF - this.uveoscleralOutflowU; // ~2.05 µL/min
    const theoreticalIop = (netFlow / totalFacility) + evp;

    // Viscoelastic in angle temporarily elevates AC resistance until washed out
    const viscoResistance = this.viscoRetainedFraction * 6.0;
    this.state.currentIopMmHg = Math.max(evp, Math.min(55, theoreticalIop + viscoResistance));
  }

  // Blood Reflux Test: Lower AC pressure briefly (pedal in aspiration or decompress wound)
  // When AC pressure drops below Episcleral Venous Pressure (8.5 mmHg),
  // venous blood naturally refluxes backward out of Schlemm's canal through the stent lumen!
  // This is the definitive clinical proof of direct venous communication.
  public triggerBloodRefluxTest(): boolean {
    const patentCount = this.state.stents.filter(s => s.deployed && s.isPatentToVenousStream).length;
    if (patentCount > 0) {
      this.state.bloodRefluxWaveConfirmed = true;
      return true;
    }
    return false;
  }

  // Viscoelastic Washout
  public washOutViscoelastic(fraction: number) {
    this.viscoRetainedFraction = Math.max(0, this.viscoRetainedFraction - fraction);
    this.recalculateHemodynamics();
  }

  // Loop update
  public update(dt: number) {
    // Gentle physiologic drift
    this.recalculateHemodynamics();
  }
}
