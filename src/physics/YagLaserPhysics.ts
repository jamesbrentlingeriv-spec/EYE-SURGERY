// Nd:YAG Laser Optical Physics & Posterior Capsulotomy Engine
import { YagLaserSettings, YagCapsulotomyState, YagTargetPoint } from '../types/ophthalmic';

export class YagLaserPhysicsEngine {
  public settings: YagLaserSettings = {
    energyMj: 1.2,
    pulseMode: 1,
    focalOffsetMicrons: 150, // 150 µm posterior defocus (safe zone: 100 - 250 µm)
    burstCount: 0,
    totalEnergyDeliveredMj: 0,
    contactLensFitted: true,
    contactLensType: 'Abraham',
    aimingBeamIntensity: 85,
    slitBeamWidthMm: 3.5,
    slitBeamAngleDeg: 15,
    retroilluminationActive: true
  };

  public capsulotomy: YagCapsulotomyState = {
    shots: [],
    cruciateOpeningAreaMm2: 0,
    visualAxisCleared: false,
    iolPitsCount: 0,
    vitreousFaceIntact: true,
    postOpIopSpikeRiskMmHg: 16
  };

  // Optical breakdown threshold in aqueous: ~0.8 mJ with contact lens
  public plasmaThresholdMj: number = 0.8;

  // Aiming beam separation vector depending on focal offset from lens/capsule plane
  // When focus is exactly on target, separation is 0 (converged single spot)
  public getAimingBeamsSeparation(currentZOffsetMicrons: number): { dx: number; dy: number; converged: boolean } {
    // Offset in µm converted to screen delta
    const separationFactor = (currentZOffsetMicrons - this.settings.focalOffsetMicrons) * 0.0008;
    const isConverged = Math.abs(currentZOffsetMicrons - this.settings.focalOffsetMicrons) < 15;
    return {
      dx: separationFactor * 22,
      dy: 0,
      converged: isConverged
    };
  }

  // Fire laser burst
  public fireLaser(
    targetX: number,
    targetY: number,
    targetZMicrons: number // 0 is posterior capsule, +50 is IOL posterior surface
  ): {
    success: boolean;
    plasmaFormed: boolean;
    pittedIol: boolean;
    vitreousRupture: boolean;
    energyDelivered: number;
  } {
    const energyPerPulse = this.settings.energyMj;
    const totalEnergy = energyPerPulse * this.settings.pulseMode;

    this.settings.burstCount++;
    this.settings.totalEnergyDeliveredMj += totalEnergy;

    const plasmaFormed = totalEnergy >= this.plasmaThresholdMj;

    // Actual acoustic shockwave focal position:
    // Focus location = targetZMicrons - settings.focalOffsetMicrons
    // If focalOffset is too small (e.g. < 80 µm) and target is close to IOL:
    const effectiveDefocus = this.settings.focalOffsetMicrons;
    let pittedIol = false;
    let vitreousRupture = false;

    // If offset is zero or anterior (< 90 µm), shockwave reaches IOL posterior optic
    if (effectiveDefocus < 90) {
      pittedIol = true;
      this.capsulotomy.iolPitsCount++;
    }

    // If offset is too deep posterior (> 320 µm) with high energy (> 1.8 mJ), hyaloid face breaks
    if (effectiveDefocus > 320 && this.settings.energyMj > 1.8) {
      vitreousRupture = true;
      this.capsulotomy.vitreousFaceIntact = false;
    }

    const newShot: YagTargetPoint = {
      x: targetX,
      y: targetY,
      powerUsedMj: totalEnergy,
      pittedIol,
      vitreousRupture,
      timestamp: Date.now()
    };

    this.capsulotomy.shots.push(newShot);

    // Calculate cruciate opening geometry:
    // Cruciate arms: horizontal & vertical opening relaxing tension
    this.updateOpeningGeometry();

    // Potential postoperative IOP spike proportional to total energy & debris
    this.capsulotomy.postOpIopSpikeRiskMmHg = Math.min(
      42,
      16 + (this.settings.totalEnergyDeliveredMj / 50) * 12 + this.capsulotomy.shots.length * 0.2
    );

    return {
      success: true,
      plasmaFormed,
      pittedIol,
      vitreousRupture,
      energyDelivered: totalEnergy
    };
  }

  private updateOpeningGeometry() {
    // Check if shots span at least 4 quadrants around central 3.5 mm zone
    const centralShots = this.capsulotomy.shots.filter(s => {
      const dist = Math.hypot(s.x, s.y);
      return dist <= 0.45; // ~3.5 mm optical zone
    });

    // Estimate opened area based on number and distribution of shots
    const area = Math.min(12.5, centralShots.length * 0.45);
    this.capsulotomy.cruciateOpeningAreaMm2 = +area.toFixed(1);

    // Visual axis cleared if >= 8 shots distributed centrally
    if (area >= 7.0 && centralShots.length >= 8) {
      this.capsulotomy.visualAxisCleared = true;
    }
  }
}
