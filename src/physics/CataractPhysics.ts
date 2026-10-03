// Cataract Surgical Physics & Biomechanical State Machine
import {
  CapsulorhexisState,
  HydrodissectionState,
  PhacoNucleusState,
  LocsNuclearGrade,
  IncisionPoint
} from '../types/ophthalmic';

export class CataractPhysicsEngine {
  public incisions: IncisionPoint[] = [
    { x: 0.85, y: -0.4, angleRad: -0.45, widthMm: 1.0, depthFraction: 0, type: 'paracentesis', completed: false },
    { x: 0.95, y: 0.25, angleRad: 0.26, widthMm: 2.4, depthFraction: 0, type: 'clear_corneal', completed: false }
  ];

  public ovdDispersiveCoverage: number = 0; // Endothelial coat: 0 to 100%
  public ovdCohesiveDepth: number = 0;      // AC inflation: 0 to 100%
  public endothelialCellLossPercent: number = 1.2;

  public ccc: CapsulorhexisState = {
    initiated: false,
    completed: false,
    punctured: false,
    flapGrasped: false,
    path: [],
    currentTip: { x: 0, y: 0 },
    tearVectorAngle: 0,
    targetRadiusMm: 2.6, // 5.2 mm diameter
    circularityScore: 0,
    averageDiameterMm: 0,
    isRunoutTowardZonules: false,
    littleRescueExecuted: false,
    zonularDehiscenceOccurred: false
  };

  public hydro: HydrodissectionState = {
    cannulaEngaged: false,
    fluidWaveProgress: 0,
    corticalCleavingWaveFormed: false,
    nucleusRotationDeg: 0,
    freeRotationVerified: false
  };

  public nucleus: PhacoNucleusState = {
    grooveDepthFraction: 0,
    quadrants: [
      { id: 1, angleCenterRad: Math.PI * 0.25, intactFraction: 1.0, isMobilized: false, isChapped: false },
      { id: 2, angleCenterRad: Math.PI * 0.75, intactFraction: 1.0, isMobilized: false, isChapped: false },
      { id: 3, angleCenterRad: Math.PI * 1.25, intactFraction: 1.0, isMobilized: false, isChapped: false },
      { id: 4, angleCenterRad: Math.PI * 1.75, intactFraction: 1.0, isMobilized: false, isChapped: false }
    ],
    isDivided: false,
    remainingMassFraction: 1.0,
    epunucleusAspirated: false,
    cortexRemnantsAspiratedFraction: 0,
    posteriorCapsulePunctured: false
  };

  public cataractGrade: LocsNuclearGrade = 'NO3';
  public totalCde: number = 0;
  public totalUsSeconds: number = 0;

  constructor(cataractGrade: LocsNuclearGrade = 'NO3') {
    this.cataractGrade = cataractGrade;
  }

  // --- 1. Incision Interactions ---
  public advanceIncision(type: 'paracentesis' | 'clear_corneal', amount: number = 0.3) {
    const inc = this.incisions.find(i => i.type === type);
    if (!inc) return;
    inc.depthFraction = Math.min(1.0, inc.depthFraction + amount);
    if (inc.depthFraction >= 1.0) {
      inc.completed = true;
    }
  }

  // --- 2. OVD Injection ---
  public injectOvd(type: 'viscoat' | 'provisc', deltaSec: number) {
    if (type === 'viscoat') {
      // Dispersive coats endothelium
      this.ovdDispersiveCoverage = Math.min(100, this.ovdDispersiveCoverage + deltaSec * 35);
    } else {
      // Cohesive deepens chamber and flattens capsule
      this.ovdCohesiveDepth = Math.min(100, this.ovdCohesiveDepth + deltaSec * 45);
    }
  }

  // --- 3. Capsulorhexis (CCC) Mechanics ---
  public initiateCystotomePuncture(x: number, y: number) {
    if (this.ccc.punctured) return;
    this.ccc.initiated = true;
    this.ccc.punctured = true;
    this.ccc.currentTip = { x, y };
    this.ccc.path = [{ x, y, isRunaway: false }];
  }

  public graspFlap() {
    if (this.ccc.punctured) {
      this.ccc.flapGrasped = true;
    }
  }

  public dragCccVector(
    pullX: number,
    pullY: number,
    shallowAc: boolean,
    dt: number
  ) {
    if (!this.ccc.flapGrasped || this.ccc.completed) return;

    const current = this.ccc.currentTip;
    const dx = pullX - current.x;
    const dy = pullY - current.y;
    const pullDist = Math.hypot(dx, dy);
    if (pullDist < 0.005) return;

    // Angle of pull vector
    const pullAngle = Math.atan2(dy, dx);
    const radiusFromCenter = Math.hypot(current.x, current.y);
    const radialAngle = Math.atan2(current.y, current.x);

    // Tangential direction for clockwise or counterclockwise rhexis
    let angleDiff = pullAngle - (radialAngle + Math.PI / 2);
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Outward pull factor: if pulling radially outwards or if AC is shallow, runout risk
    const outwardPull = Math.cos(pullAngle - radialAngle);
    const runoutThreshold = shallowAc ? 0.25 : 0.65;

    let isRunaway = false;
    if (outwardPull > runoutThreshold && radiusFromCenter > 0.45) {
      // Running away toward zonules!
      this.ccc.isRunoutTowardZonules = true;
      isRunaway = true;
      if (radiusFromCenter > 0.88) {
        this.ccc.zonularDehiscenceOccurred = true;
      }
    }

    // Little's Rescue Technique check: pulling 180° back toward center
    const inwardPull = Math.cos(pullAngle - (radialAngle + Math.PI));
    if (this.ccc.isRunoutTowardZonules && inwardPull > 0.6) {
      // Little maneuver executed! Re-directs tear towards center
      this.ccc.littleRescueExecuted = true;
      this.ccc.isRunoutTowardZonules = false;
      isRunaway = false;
    }

    // Advance tear position smoothly
    const advanceSpeed = 0.28;
    let stepDist = Math.min(pullDist, advanceSpeed * dt);
    if (isRunaway) {
      stepDist *= 1.4; // runaway tears propagate faster
    }

    // New tip coordinate
    let nextX = current.x + Math.cos(pullAngle) * stepDist;
    let nextY = current.y + Math.sin(pullAngle) * stepDist;

    // Constrain to reasonable eye boundary
    const distNext = Math.hypot(nextX, nextY);
    if (distNext > 0.92) {
      nextX = (nextX / distNext) * 0.92;
      nextY = (nextY / distNext) * 0.92;
      this.ccc.zonularDehiscenceOccurred = true;
    }

    this.ccc.currentTip = { x: nextX, y: nextY };
    this.ccc.path.push({ x: nextX, y: nextY, isRunaway });

    // Check if loop closure completed (near starting point after at least 15 points)
    if (this.ccc.path.length > 20) {
      const start = this.ccc.path[0];
      const distToStart = Math.hypot(nextX - start.x, nextY - start.y);
      if (distToStart < 0.08) {
        this.ccc.completed = true;
        this.calculateCccMetrics();
      }
    }
  }

  private calculateCccMetrics() {
    if (this.ccc.path.length < 10) return;
    let totalR = 0;
    let perimeter = 0;
    let area = 0;

    for (let i = 0; i < this.ccc.path.length; i++) {
      const p1 = this.ccc.path[i];
      const p2 = this.ccc.path[(i + 1) % this.ccc.path.length];
      totalR += Math.hypot(p1.x, p1.y);
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      perimeter += segLen;
      // Shoelace formula for area
      area += (p1.x * p2.y - p2.x * p1.y);
    }
    area = Math.abs(area) * 0.5;

    // Circularity: 4 * PI * Area / Perimeter^2
    const circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
    this.ccc.circularityScore = Math.min(100, Math.max(0, Math.round(circularity * 100)));

    // Scale to mm (normalized eye radius ~ 6.0 mm)
    const avgNormR = totalR / this.ccc.path.length;
    this.ccc.averageDiameterMm = +(avgNormR * 12.0).toFixed(1);
  }

  // --- 4. Hydrodissection Mechanics ---
  public triggerHydrodissection(cannulaAtRim: boolean, pulseAmount: number = 0.25) {
    if (!cannulaAtRim) return;
    this.hydro.cannulaEngaged = true;
    this.hydro.fluidWaveProgress = Math.min(1.0, this.hydro.fluidWaveProgress + pulseAmount);
    if (this.hydro.fluidWaveProgress >= 0.95) {
      this.hydro.corticalCleavingWaveFormed = true;
    }
  }

  public testNucleusRotation(deg: number) {
    if (!this.hydro.corticalCleavingWaveFormed) {
      // Without hydrodissection, rotation causes zonular stress
      return;
    }
    this.hydro.nucleusRotationDeg += deg;
    if (Math.abs(this.hydro.nucleusRotationDeg) >= 180) {
      this.hydro.freeRotationVerified = true;
    }
  }

  // --- 5. Phacoemulsification & CDE ---
  public applyPhacoUltrasound(
    powerPercent: number,
    dutyCycle: number,
    tipCoords: { x: number; y: number; z: number },
    deltaSec: number
  ) {
    if (powerPercent <= 0) return;

    const actualEffectivePower = (powerPercent * dutyCycle) / 100.0;
    // CDE = Phaco Time (sec) * Avg Power % / 100
    const dCde = (deltaSec * actualEffectivePower) / 100.0;
    this.totalCde += dCde;
    this.totalUsSeconds += deltaSec;

    // Check nuclear density resistance: LOCS III NO1 to NO6
    const gradeMultipliers: Record<LocsNuclearGrade, number> = {
      NO1: 2.4,
      NO2: 1.8,
      NO3: 1.2,
      NO4: 0.75,
      NO5: 0.45,
      NO6: 0.28
    };
    const emulsificationEfficiency = gradeMultipliers[this.cataractGrade] * (powerPercent / 80.0) * deltaSec;

    // Groove carving or quadrant emulsification
    if (!this.nucleus.isDivided) {
      this.nucleus.grooveDepthFraction = Math.min(0.92, this.nucleus.grooveDepthFraction + emulsificationEfficiency * 0.35);
      if (this.nucleus.grooveDepthFraction >= 0.82) {
        this.nucleus.isDivided = true;
        this.nucleus.quadrants.forEach(q => { q.isChapped = true; q.isMobilized = true; });
      }
    } else {
      // Find nearest quadrant to tipCoords
      const tipAngle = Math.atan2(tipCoords.y, tipCoords.x);
      let bestQuad = this.nucleus.quadrants[0];
      let minAngleDist = 999;
      this.nucleus.quadrants.forEach(q => {
        let diff = Math.abs(q.angleCenterRad - tipAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff < minAngleDist && q.intactFraction > 0.01) {
          minAngleDist = diff;
          bestQuad = q;
        }
      });

      if (bestQuad && bestQuad.intactFraction > 0) {
        bestQuad.intactFraction = Math.max(0, bestQuad.intactFraction - emulsificationEfficiency * 0.4);
      }

      // Remaining mass
      const sum = this.nucleus.quadrants.reduce((acc, q) => acc + q.intactFraction, 0);
      this.nucleus.remainingMassFraction = sum / 4.0;
    }

    // Endothelial loss risk: higher when phaco is done anteriorly or without OVD
    const ovdProtection = Math.max(0.15, this.ovdDispersiveCoverage / 100.0);
    const endothelialProximity = Math.max(0, tipCoords.z); // positive z is close to cornea
    const lossInc = ((powerPercent / 100.0) * (0.04 + endothelialProximity * 0.15) * deltaSec) / ovdProtection;
    this.endothelialCellLossPercent = Math.min(45, this.endothelialCellLossPercent + lossInc);

    // Posterior capsule proximity hazard check:
    // If ultrasound is active when z < -0.85 (less than 1 mm from posterior capsule)
    if (tipCoords.z < -0.85) {
      this.nucleus.posteriorCapsulePunctured = true;
    }
  }

  // --- 6. Cortex Clearance (I/A) ---
  public aspirateCortex(amount: number) {
    this.nucleus.cortexRemnantsAspiratedFraction = Math.min(
      1.0,
      this.nucleus.cortexRemnantsAspiratedFraction + amount
    );
  }
}
