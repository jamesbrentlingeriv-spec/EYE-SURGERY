import { PhacoStep, IolStep, YagStep, SurgicalModule, InstrumentType } from '../types/ophthalmic';

export interface SurgicalStepInstruction {
  id: string;
  stepNumber: number;
  module: SurgicalModule;
  title: string;
  recommendedInstrument: InstrumentType;
  spokenScript: string;
  clinicalObjective: string;
  techniquePearls: string[];
  hazards: string[];
}

export const SURGICAL_INSTRUCTIONS: Record<string, SurgicalStepInstruction> = {
  // --- Module A: Phacoemulsification ---
  paracentesis: {
    id: 'paracentesis',
    stepNumber: 1,
    module: 'phaco',
    title: 'Paracentesis Incision (~1.0mm MVR)',
    recommendedInstrument: 'mvr_blade',
    spokenScript:
      'Step 1: Paracentesis. Select the 1.0 millimeter MVR blade from your surgical tray. Enter the clear cornea at the 10 o\'clock limbus, angled parallel to the iris plane to create a self-sealing wound for your second instrument.',
    clinicalObjective: 'Create a tight, self-sealing 1.0 mm port for the second instrument (chopper/paddle).',
    techniquePearls: [
      'Enter just anterior to the limbal vascular arcade at roughly 10 o\'clock (or 2 o\'clock).',
      'Maintain blade angle parallel to iris plane to avoid iris trauma or premature corneal penetration.',
      'A tri-planar or planar corneal entry ensures rapid stromal hydration seal at closure.'
    ],
    hazards: [
      'Avoid entering too anteriorly (risk of corneal astigmatism and striae).',
      'Avoid sudden downward plunge that could lacerate the anterior lens capsule or iris.'
    ]
  },

  clear_corneal_incision: {
    id: 'clear_corneal_incision',
    stepNumber: 2,
    module: 'phaco',
    title: 'Tri-Planar Clear Corneal Incision (2.4mm)',
    recommendedInstrument: 'keratome_2_4',
    spokenScript:
      'Step 2: Clear Corneal Incision. Switch to the 2.4 millimeter keratome. Create a tri-planar stepped incision: groove the anterior limbus, tunnel 1.5 millimeters into the corneal stroma, and dimple down to enter the anterior chamber without damaging the iris.',
    clinicalObjective: 'Construct a stable, self-sealing 2.4 mm tri-planar clear corneal tunnel for the phaco handpiece.',
    techniquePearls: [
      'Plane 1: Initial vertical groove (depth ~300 µm) at the anterior limbus.',
      'Plane 2: Lamellar stromal tunnel advancing 1.5–1.75 mm towards corneal center.',
      'Plane 3: Dimple down and penetrate the Descemet membrane with a crisp internal corneal entry.'
    ],
    hazards: [
      'Short tunnel length (<1.2 mm) creates wound leak, iris prolapse, and post-op endophthalmitis risk.',
      'Overly long tunnel (>2.2 mm) induces corneal striae and limits instrument excursion.'
    ]
  },

  ovd_injection: {
    id: 'ovd_injection',
    stepNumber: 3,
    module: 'phaco',
    title: 'OVD Injection (Dispersive & Cohesive)',
    recommendedInstrument: 'ovd_viscoat',
    spokenScript:
      'Step 3: Ophthalmic Viscosurgical Device injection. First, inject dispersive Viscoat to coat and protect the delicate corneal endothelium. Next, inject cohesive Provisc to deepen the anterior chamber and flatten anterior capsular convexity.',
    clinicalObjective: 'Coat endothelium with dispersive OVD and maintain deep anterior chamber depth with cohesive OVD.',
    techniquePearls: [
      'Arshinoff soft-shell technique: dispersive OVD coats endothelium first; cohesive OVD pushes lens-iris diaphragm posteriorly.',
      'Flattening anterior capsule curvature reduces centrifugal vector run-out tension during capsulorhexis.'
    ],
    hazards: [
      'Over-pressurization of the anterior chamber can induce zonular stress or anterior capsule blow-out.',
      'Inadequate dispersive coverage leaves endothelium vulnerable to ultrasonic cavitation turbulence.'
    ]
  },

  capsulorhexis: {
    id: 'capsulorhexis',
    stepNumber: 4,
    module: 'phaco',
    title: 'Continuous Curvilinear Capsulorhexis (CCC)',
    recommendedInstrument: 'utrata_forceps',
    spokenScript:
      'Step 4: Continuous Curvilinear Capsulorhexis. Use the cystotome to puncture the central anterior capsule and raise a triangular flap. Grasp the flap with Utrata micro-forceps. Direct the shear vector tangentially in a circle to fashion an ideal 5.2 millimeter opening overlapping the IOL optic edge. If the tear runs out radially toward the zonules, execute Little\'s rescue technique by pulling 180 degrees back toward the center.',
    clinicalObjective: 'Achieve a continuous 5.0–5.5 mm circular capsular opening centered on the visual axis.',
    techniquePearls: [
      'Puncture capsule at center and elevate triangular flap; fold flap flat over adjacent capsule.',
      'Grasp flap within 1–2 mm of the tearing apex for maximal vector control.',
      'Direct force tangentially to maintain circular shearing rather than radial stretching.',
      'Little\'s Rescue Maneuver: If tear runs radially, unfold flap flat and pull 180° directly back toward the center of the pupil.'
    ],
    hazards: [
      'Radial run-out tear into equatorial zonules can cause posterior extension and vitreous loss.',
      'Too small rhexis (<4.5 mm) increases anterior capsular contraction and optic phimosis.'
    ]
  },

  hydrodissection: {
    id: 'hydrodissection',
    stepNumber: 5,
    module: 'phaco',
    title: 'Hydrodissection & Free Rotation Test',
    recommendedInstrument: 'hydro_cannula',
    spokenScript:
      'Step 5: Hydrodissection. Place the 27-gauge flattened cannula directly beneath the anterior capsular rim. Inject a gentle pulse of balanced salt solution to propagate a fluid wave across the posterior capsule. Verify free 360-degree rotation of the lens nucleus.',
    clinicalObjective: 'Cleave cortical-capsular adhesions with a fluid wave and establish free 360° nuclear mobility.',
    techniquePearls: [
      'Tent up anterior capsule rim slightly before injecting BSS to prevent capsular block syndrome.',
      'Observe the golden fluid wave passing across the red reflex retroillumination.',
      'Depress the central nucleus to decompress anterior chamber fluid before nuclear rotation test.'
    ],
    hazards: [
      'Vigorous injection in an intact capsule without decompression can rupture the posterior capsule (capsular block).',
      'Forcing rotation without cortical cleaving creates massive zonular traction.'
    ]
  },

  phaco_chop: {
    id: 'phaco_chop',
    stepNumber: 6,
    module: 'phaco',
    title: 'Phaco-Chop Nucleofractis & Aspiration',
    recommendedInstrument: 'phaco_tip',
    spokenScript:
      'Step 6: Phaco-Chop Nucleofractis. Depress foot pedal to position 1 for continuous irrigation, position 2 for aspiration, and position 3 for ultrasound power. Impale the nucleus with the phaco tip, place the Nagahara chopper at the nuclear equator, and pull horizontally to cleave the cataract into quadrants. Emulsify each quadrant while monitoring chamber depth to avoid post-occlusion surge. Never apply ultrasound within one millimeter of the posterior capsule.',
    clinicalObjective: 'Divide lens nucleus into manageable quadrants and emulsify with minimal Cumulative Dissipated Energy (CDE).',
    techniquePearls: [
      'Position 1: Continuous infusion keeps anterior chamber stable.',
      'Position 2: Aspiration builds vacuum to hold nuclear fragment against tip.',
      'Position 3: Burst or pulse phaco ultrasound delivers short bursts with low thermal dissipation.',
      'Perform emulsification within the safe central "phaco zone" (iris plane, pupil center).'
    ],
    hazards: [
      'Post-occlusion surge when fragment clears can collapse anterior chamber and tear posterior capsule.',
      'Applying phaco power within 1.0 mm of posterior capsule or endothelium causes irreversible tissue rupture.'
    ]
  },

  cortex_removal: {
    id: 'cortex_removal',
    stepNumber: 7,
    module: 'phaco',
    title: 'Cortical Remnant Clearance (I/A)',
    recommendedInstrument: 'ia_handpiece',
    spokenScript:
      'Step 7: Cortex clearance. Engage the coaxial irrigation/aspiration handpiece. Strip 360 degrees of equatorial cortical fibers toward the center using position 2 aspiration. Polish the posterior capsule gently at low vacuum.',
    clinicalObjective: 'Evacuate all equatorial cortex and epinucleus leaving a pristine, polished capsular bag.',
    techniquePearls: [
      'Occlude cortical sheet with aspiration port facing anteriorly or sideways.',
      'Strip cortex radially centripetally from equator into the deep pupillary center before aspirating.',
      'Switch to capsule vacuum polishing mode (vacuum ~20 mmHg) for central posterior capsule sheen.'
    ],
    hazards: [
      'Aspirating posterior capsule directly: radial folds ("spider-web" sign) indicate capsular entrapment; immediately release pedal to position 0!'
    ]
  },

  // --- Module B: Foldable IOL Implantation ---
  ovd_bag_refill: {
    id: 'ovd_bag_refill',
    stepNumber: 1,
    module: 'iol',
    title: 'Capsular Bag Refill with Cohesive OVD',
    recommendedInstrument: 'ovd_provisc',
    spokenScript:
      'Step 1: Capsular Bag Refill. Inject cohesive viscoelastic directly into the capsular bag equator to inflate the bag and deepen the anterior chamber prior to lens delivery.',
    clinicalObjective: 'Expand the collapsed capsular bag to provide safe clearance for injector nozzle and IOL unfolding.',
    techniquePearls: [
      'Place cannula tip at distal equator and inject cohesive ProVisc smoothly.',
      'Ensure capsular bag is completely unwrinkled and anterior chamber depth is normalized.'
    ],
    hazards: [
      'Injecting without OVD cushion risks bag puncture by the rigid cartridge nozzle.'
    ]
  },

  cartridge_insertion: {
    id: 'cartridge_insertion',
    stepNumber: 2,
    module: 'iol',
    title: 'Cartridge Delivery into Bag',
    recommendedInstrument: 'iol_injector',
    spokenScript:
      'Step 2: Cartridge Delivery. Introduce the Monarch injector nozzle through the clear corneal incision. Advance the screw plunger smoothly to deliver the foldable hydrophobic acrylic intraocular lens into the capsular bag.',
    clinicalObjective: 'Deliver foldable hydrophobic acrylic optic through corneal wound without wound stretching or cartridge twist.',
    techniquePearls: [
      'Bevel of injector nozzle oriented downward facing posterior capsule.',
      'Advance plunger smoothly; monitor leading haptic emergence.'
    ],
    hazards: [
      'Rapid uncontrolled injection can cause traumatic haptic strike through the posterior capsule.'
    ]
  },

  haptic_unfolding: {
    id: 'haptic_unfolding',
    stepNumber: 3,
    module: 'iol',
    title: 'Leading Haptic Placement',
    recommendedInstrument: 'iol_injector',
    spokenScript:
      'Step 3: Leading Haptic Placement. Ensure the leading C-loop haptic unfolds directly into the distal capsular bag equator, while the optic unfolds smoothly in the pupillary plane.',
    clinicalObjective: 'Seat leading haptic directly into the distal capsular bag equator.',
    techniquePearls: [
      'Keep nozzle tip within anterior capsular rim so haptic cannot escape over the iris.',
      'Allow slow controlled unfolding of hydrophobic acrylic material at ocular temperature.'
    ],
    hazards: [
      'Trailing haptic trapped in incision wound requires gentle disengagement.'
    ]
  },

  sinskey_dialing: {
    id: 'sinskey_dialing',
    stepNumber: 4,
    module: 'iol',
    title: 'Sinskey Hook 360° Rotational Centering',
    recommendedInstrument: 'sinskey_hook',
    spokenScript:
      'Step 4: Sinskey Hook Dialing. Use the 0.2 millimeter Sinskey hook to dial the trailing haptic clockwise into the proximal capsular equator. Confirm 360-degree anterior capsular overlap and center the optic on the Purkinje visual axis.',
    clinicalObjective: 'Dial trailing haptic into bag, achieve 360° rhexis overlap, and center optic along visual axis.',
    techniquePearls: [
      'Place Sinskey hook at optic-haptic junction.',
      'Rotate clockwise while exerting slight downward posterior pressure into the bag.',
      'Verify 0.5 mm continuous anterior capsular overlap around all 360 degrees of the 6.0 mm optic.'
    ],
    hazards: [
      'Asymmetric haptic placement (one in bag, one in ciliary sulcus) causes chronic uveitis-glaucoma-hyphema (UGH) syndrome and optic tilt.'
    ]
  },

  viscoelastic_washout: {
    id: 'viscoelastic_washout',
    stepNumber: 5,
    module: 'iol',
    title: 'Retro-Lens & AC Viscoelastic Washout',
    recommendedInstrument: 'ia_handpiece',
    spokenScript:
      'Step 5: Viscoelastic Washout. Place the I/A handpiece behind the optic in the retro-lens space to evacuate trapped cohesive viscoelastic. Thorough washout prevents postoperative intraocular pressure spikes above 40 millimeters of mercury.',
    clinicalObjective: 'Thoroughly evacuate cohesive OVD from retro-lens space and anterior chamber to prevent acute IOP spike.',
    techniquePearls: [
      'Rock\'n\'roll maneuver: tilt optic gently with I/A tip to access capsular bag retro-lens space.',
      'Aspirate all visco behind optic; re-check anterior chamber angles before wound hydration.'
    ],
    hazards: [
      'Retained OVD occludes the trabecular meshwork, causing severe early postoperative IOP spikes (>45 mmHg).'
    ]
  },

  // --- Module C: Nd:YAG Laser Posterior Capsulotomy ---
  contact_lens_placement: {
    id: 'contact_lens_placement',
    stepNumber: 1,
    module: 'yag',
    title: 'Abraham Capsulotomy Lens Placement',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 1: Contact Lens Placement. Apply coupling gel and place the Abraham capsulotomy contact lens onto the cornea. The anti-reflective coated central button increases optical magnification and converges laser energy into a tighter focal waist.',
    clinicalObjective: 'Fit Abraham contact lens to stabilize the globe, maximize optical clarity, and reduce breakdown threshold.',
    techniquePearls: [
      'Anti-reflective coated +66D planoconvex button provides 1.5x magnification.',
      'Improves cone angle from 16° to 24°, reducing energy density on corneal endothelium and retina.'
    ],
    hazards: [
      'Air bubbles in coupling methylcellulose create optical distortion and beam defocus.'
    ]
  },

  aiming_focus: {
    id: 'aiming_focus',
    stepNumber: 2,
    module: 'yag',
    title: 'Dual HeNe Aiming Beam Convergence',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 2: Dual HeNe Aiming Focus. Adjust the slit-lamp joystick so that the two red Helium-Neon aiming laser spots converge precisely into a single sharp spot on the opacified posterior capsule.',
    clinicalObjective: 'Achieve pinpoint confocal alignment of the twin red HeNe aiming beams on the retro-illuminated capsule.',
    techniquePearls: [
      'When out of focus, two distinct red dots appear on screen.',
      'Fine-tune joystick forward/backward until both dots merge into a single tight high-intensity red reticle.'
    ],
    hazards: [
      'Firing while aiming beams are doubled leads to shockwaves occurring away from target plane.'
    ]
  },

  offset_adjustment: {
    id: 'offset_adjustment',
    stepNumber: 3,
    module: 'yag',
    title: 'Posterior Focal Offset (+150µm)',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 3: Posterior Defocus Offset. Set the laser focal offset to plus 150 to plus 200 micrometers posterior to the capsule. Never fire at zero offset, as optical breakdown will pit and scratch the posterior surface of the intraocular lens.',
    clinicalObjective: 'Ensure acoustic photodisruption focus is positioned behind the capsule to preserve the IOL optic.',
    techniquePearls: [
      'Aqueous dielectric breakdown creates plasma that expands backward toward the laser source.',
      'Posterior offset of +150 to +250 µm ensures the shockwave advances forward to open the capsule without touching the acrylic lens.'
    ],
    hazards: [
      'Zero or anterior offset causes catastrophic pitting, cracking, and glare on the IOL optic.',
      'Defocus > 320 µm risks breaking the anterior vitreous face.'
    ]
  },

  cruciate_capsulotomy: {
    id: 'cruciate_capsulotomy',
    stepNumber: 4,
    module: 'yag',
    title: 'Cruciate Pattern Laser Breakdown',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 4: Cruciate Capsulotomy. Fire laser pulses in a cross-shaped cruciate pattern, starting outside the visual axis at the 12, 6, 3, and 9 o\'clock meridians to relax capsular tension. Optical breakdown creates plasma and a supersonic acoustic cavitation shockwave that cleaves the Elschnig pearls.',
    clinicalObjective: 'Deliver cruciate pattern cuts to release capsular tension and clear central opacified Elschnig pearls.',
    techniquePearls: [
      'Begin peripherally at 12 o\'clock, then 6, 3, and 9 o\'clock along the cruciate arms.',
      'Releasing equatorial tension allows the central capsular flaps to curl out of the visual axis naturally.',
      'Use lowest effective energy (1.0 to 1.5 mJ per burst).'
    ],
    hazards: [
      'Firing directly in the central visual axis first risks severe central pits if alignment shifts.',
      'Excessive total energy (>60 mJ) induces transient IOP spike and cystoid macular edema (CME).'
    ]
  },

  post_yag_assessment: {
    id: 'post_yag_assessment',
    stepNumber: 5,
    module: 'yag',
    title: 'Visual Axis Clearance & IOP Check',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 5: Visual Axis Assessment. Verify that a clean 3.5 to 4.0 millimeter central optical aperture is created, free of floating capsular tags. Ensure the anterior hyaloid face is intact and check for potential postoperative IOP elevation.',
    clinicalObjective: 'Assess visual axis clarity, verify IOL integrity, and evaluate vitreous hyaloid status.',
    techniquePearls: [
      'Ideal aperture matches or slightly exceeds photopic pupil diameter (3.5–4.0 mm).',
      'Confirm zero optic pits under high-magnification retroillumination.',
      'Administer topical apraclonidine or brimonidine to prevent post-laser IOP spikes.'
    ],
    hazards: [
      'Capsular tags hanging directly across the visual axis cause monocular diplopia and glare.'
    ]
  }
};
