// Intraocular Lens (IOL) Foldable Implantation & Centration Physics
import { IolPositionState } from '../types/ophthalmic';

export class IolPhysicsEngine {
  public state: IolPositionState = {
    isLoaded: true,
    insertionProgressFraction: 0,
    leadingHapticInBag: false,
    opticInChamber: false,
    opticInBag: false,
    trailingHapticInBag: false,
    rotationDeg: 0,
    centrationOffsetMm: { x: 0.8, y: 0.6 }, // initially off-center
    opticRhexisOverlapPercent: 0,
    viscoelasticRetainedPercent: 95
  };

  public bagInflatedWithOvd: boolean = false;
  public ovdFillFraction: number = 0;

  // Refill capsular bag with cohesive OVD
  public refillBagWithOvd(amount: number) {
    this.ovdFillFraction = Math.min(1.0, this.ovdFillFraction + amount);
    if (this.ovdFillFraction >= 0.75) {
      this.bagInflatedWithOvd = true;
    }
  }

  // Advance injector plunger
  public advanceInjector(delta: number) {
    if (!this.bagInflatedWithOvd && this.state.insertionProgressFraction > 0.2) {
      // Risk of bag damage if injected without OVD cushion
    }

    this.state.insertionProgressFraction = Math.min(
      1.0,
      this.state.insertionProgressFraction + delta
    );

    if (this.state.insertionProgressFraction > 0.35) {
      this.state.leadingHapticInBag = true;
    }
    if (this.state.insertionProgressFraction > 0.65) {
      this.state.opticInChamber = true;
    }
    if (this.state.insertionProgressFraction >= 0.95) {
      this.state.opticInBag = true;
    }
  }

  // Sinskey hook manipulation to dial trailing haptic into bag
  public dialWithSinskeyHook(deltaDeg: number, nudgeX: number, nudgeY: number) {
    if (!this.state.opticInChamber && !this.state.opticInBag) return;

    this.state.rotationDeg = (this.state.rotationDeg + deltaDeg) % 360;

    // Moving centration toward target center (0, 0)
    this.state.centrationOffsetMm.x = Math.max(-1.5, Math.min(1.5, this.state.centrationOffsetMm.x + nudgeX));
    this.state.centrationOffsetMm.y = Math.max(-1.5, Math.min(1.5, this.state.centrationOffsetMm.y + nudgeY));

    // Trailing haptic pops into bag as it rotates past 90 degrees
    if (Math.abs(this.state.rotationDeg) >= 75 && !this.state.trailingHapticInBag) {
      this.state.trailingHapticInBag = true;
      this.state.opticInBag = true;
    }

    this.calculateOverlapAndCentration();
  }

  // Viscoelastic washout
  public aspirateViscoelastic(rate: number) {
    this.state.viscoelasticRetainedPercent = Math.max(
      0,
      this.state.viscoelasticRetainedPercent - rate
    );
  }

  private calculateOverlapAndCentration() {
    const distFromVisualAxis = Math.hypot(
      this.state.centrationOffsetMm.x,
      this.state.centrationOffsetMm.y
    );

    // If both haptics in bag and well-centered:
    if (this.state.leadingHapticInBag && this.state.trailingHapticInBag) {
      const centrationFactor = Math.max(0, 1.0 - distFromVisualAxis / 1.0);
      this.state.opticRhexisOverlapPercent = Math.min(100, Math.round(centrationFactor * 100));
    } else {
      this.state.opticRhexisOverlapPercent = 35;
    }
  }
}
