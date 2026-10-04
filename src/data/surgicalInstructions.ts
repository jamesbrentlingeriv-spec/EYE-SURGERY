import { PhacoStep, IolStep, YagStep, SurgicalModule, InstrumentType } from '../types/ophthalmic';

export interface SurgicalStepInstruction {
  id: string;
  stepNumber: number;
  module: SurgicalModule;
  title: string;
  beginnerTitle: string;
  recommendedInstrument: InstrumentType;
  spokenScript: string;
  beginnerSummary: string;
  actionCallout: string;
  targetLocationDescription: string;
  whyItsNecessary: string;
  clinicalObjective: string;
  techniquePearls: string[];
  hazards: string[];
  detailedAnatomy?: {
    tissueTarget: string;
    instrumentDepthOrSize: string;
    biomechanicsExplanation: string;
  };
}

export const SURGICAL_INSTRUCTIONS: Record<string, SurgicalStepInstruction> = {
  // =========================================================================
  // --- MODULE A: PHACOEMULSIFICATION CATARACT SURGERY ---
  // =========================================================================

  paracentesis: {
    id: 'paracentesis',
    stepNumber: 1,
    module: 'phaco',
    title: 'Paracentesis Incision (~1.0mm MVR)',
    beginnerTitle: 'Step 1: Small Side Door (Paracentesis)',
    recommendedInstrument: 'mvr_blade',
    spokenScript:
      'Step 1: Make a small side door. Take the 1.0 millimeter blade from the left tray. Look for the flashing orange target at the top-left edge of the eye, at the 10 o\'clock position. Click there to make a tiny slit. This gives your assistant tool a way into the eye.',
    beginnerSummary:
      'Cut a tiny 1-millimeter side slit near the edge of the clear window of the eye (the cornea). This acts as a secondary door so you can use two hands during surgery.',
    actionCallout:
      '👉 Select the 1.0mm MVR Blade on the left tray, then CLICK the pulsing orange target at the 10 o\'clock corneal edge.',
    targetLocationDescription:
      'Upper-left edge of the cornea at 10:00 o\'clock (limbus border between clear cornea and white sclera).',
    whyItsNecessary:
      'Why it is necessary: Eye surgery requires two hands. Your right hand holds the main ultrasound tool through the big incision, but you need a second tool (like a spatula or chopper) in your left hand to hold the cataract still, push pieces, and protect the back of the eye. Without this side door, you cannot control the cataract pieces and risk tearing the eye.',
    clinicalObjective: 'Create a tight, self-sealing 1.0 mm port for the second instrument (chopper/paddle).',
    techniquePearls: [
      'Enter just anterior to the limbal vascular arcade at roughly 10 o\'clock (or 2 o\'clock for left-handed surgeons).',
      'Maintain blade angle parallel to the iris plane to prevent iris laceration or premature corneal penetration.',
      'A tri-planar or planar corneal entry ensures rapid stromal hydration seal at closure without sutures.'
    ],
    hazards: [
      'Entering too anteriorly causes severe corneal astigmatism and visual distortion.',
      'Sudden downward plunge can puncture the iris or prematurely tear the delicate front lens capsule.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Peripheral clear cornea stroma at the 10:00 limbus.',
      instrumentDepthOrSize: '1.0 mm micro-vitreoretinal (MVR) diamond or steel lancet blade.',
      biomechanicsExplanation:
        'The corneal stroma consists of 200 parallel collagen lamellae. An angled entry creates a flap valve: normal intraocular fluid pressure pushes the inner flap against the outer ceiling, sealing it shut watertight without needing stitches.'
    }
  },

  clear_corneal_incision: {
    id: 'clear_corneal_incision',
    stepNumber: 2,
    module: 'phaco',
    title: 'Tri-Planar Clear Corneal Incision (2.4mm)',
    beginnerTitle: 'Step 2: Main Tunnel Entry (2.4mm Tri-Planar)',
    recommendedInstrument: 'keratome_2_4',
    spokenScript:
      'Step 2: Create your main doorway. Switch to the 2.4 millimeter keratome blade. Look for the flashing blue target at the upper-right, at the 1:30 o\'clock position. Click 3 times to step through the three planes: groove the surface, tunnel through the wall, and enter the eye chamber. This creates a self-sealing tunnel that won\'t leak.',
    beginnerSummary:
      'Make a wider 2.4-millimeter stepped tunnel into the front of the eye. It is cut in three distinct stages so it acts like a one-way security flap that seals itself shut without stitches.',
    actionCallout:
      '👉 Pick the 2.4mm Keratome blade. CLICK the pulsing blue target at the 1:30 o\'clock position 3 times to complete Plane 1 (Groove), Plane 2 (Tunnel), and Plane 3 (AC Entry).',
    targetLocationDescription:
      'Upper-right corneal edge at 1:30 o\'clock, where clear cornea transitions into the white of the eye.',
    whyItsNecessary:
      'Why it is necessary: Your primary ultrasound pen (phaco handpiece) is 2.4mm thick. You must create an entry tunnel wide enough for the pen to slide through easily, yet tight enough that fluid doesn\'t rush out and collapse the eye. Cutting it in 3 staggered planes creates an automatic valve: inside eye pressure presses the inner flap shut, keeping the eye pressurized and preventing bacteria from entering post-surgery.',
    clinicalObjective: 'Construct a stable, self-sealing 2.4 mm tri-planar clear corneal tunnel for the phaco handpiece.',
    techniquePearls: [
      'Plane 1: Initial vertical groove (depth ~300 µm) at the anterior limbus perpendicular to the surface.',
      'Plane 2: Lamellar stromal tunnel advancing 1.5–1.75 mm forwards toward the corneal center.',
      'Plane 3: Dimple down and penetrate Descemet\'s membrane with a crisp, square internal entry.'
    ],
    hazards: [
      'A short tunnel (<1.2 mm) creates a gaping wound, iris prolapse, and severe risk of postoperative infection (endophthalmitis).',
      'An overly long tunnel (>2.2 mm) causes corneal stretching, visual wrinkles (striae), and restricts tool movement.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Corneal epithelium, collagenous stroma, and Descemet\'s membrane.',
      instrumentDepthOrSize: '2.4 mm angled slit keratome with calibrated 1.5 mm tunnel depth.',
      biomechanicsExplanation:
        'A square architecture (tunnel length roughly equal to wound width) produces maximum mechanical stability against deformation and eye pressure changes.'
    }
  },

  ovd_injection: {
    id: 'ovd_injection',
    stepNumber: 3,
    module: 'phaco',
    title: 'OVD Injection (Dispersive & Cohesive)',
    beginnerTitle: 'Step 3: Protective Jelly Shield (Viscoelastic)',
    recommendedInstrument: 'ovd_viscoat',
    spokenScript:
      'Step 3: Protect the eye with jelly. Choose the Viscoat syringe on the left. Click inside the pupil to inject a clear protective gel. This coats the fragile inner lining of the cornea so ultrasonic soundwaves and turbulence won\'t damage it.',
    beginnerSummary:
      'Fill the front chamber of the eye with thick, crystal-clear surgical jelly (viscoelastic). This inflates the eye and spreads a safety cushion over delicate cells.',
    actionCallout:
      '👉 Select Viscoat (dispersive jelly) or Provisc on the left tray, then CLICK inside the front chamber of the eye to inject the protective cushion.',
    targetLocationDescription:
      'Center of the pupil and the dome directly behind the cornea (the anterior chamber).',
    whyItsNecessary:
      'Why it is necessary: The back surface of your cornea is lined with fragile "endothelial cells" that act like microscopic bilge pumps keeping the cornea clear. Unlike skin or hair, these cells NEVER grow back once lost! If ultrasound vibrates near them or turbulent water washes over them, they die, turning the cornea permanently milky white. The viscous jelly acts like a protective suit of armor and keeps the eyeball round and firm.',
    clinicalObjective: 'Coat endothelium with dispersive OVD and maintain deep anterior chamber depth with cohesive OVD.',
    techniquePearls: [
      'Arshinoff soft-shell technique: Dispersive Viscoat coats and sticks to the endothelium; cohesive Provisc pushes the lens down to give you operating room.',
      'Flattening anterior capsular curvature prevents runaway radial tears during capsulorhexis.'
    ],
    hazards: [
      'Over-pressurizing the chamber stresses the delicate zonular suspension cords holding the lens.',
      'Inadequate jelly coverage leaves endothelial cells vulnerable to heat shock and acoustic shockwaves.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Corneal endothelial monolayer and anterior chamber space.',
      instrumentDepthOrSize: '27-gauge smooth cannula delivering chondroitin sulfate & sodium hyaluronate.',
      biomechanicsExplanation:
        'Viscoelastic behaves as a non-Newtonian fluid: under zero shear it forms a rigid shock-absorbing matrix, but under instrument movement it shears smoothly without resistance.'
    }
  },

  capsulorhexis: {
    id: 'capsulorhexis',
    stepNumber: 4,
    module: 'phaco',
    title: 'Continuous Curvilinear Capsulorhexis (CCC)',
    beginnerTitle: 'Step 4: Circular Window in the Lens Bag (Capsulorhexis)',
    recommendedInstrument: 'utrata_forceps',
    spokenScript:
      'Step 4: Cut a circular window in the lens skin. Take the needle cystotome to poke a small tear in the center, then use the Utrata micro-forceps to steer the flap around the dashed blue circle. Make a smooth 5.2 millimeter circle. If it starts running wild toward the edge, pull back toward the center.',
    beginnerSummary:
      'The cataract lives inside a cellophane-thin transparent bag. You must tear a smooth, perfectly round 5-millimeter circular opening in the front of this bag so you can remove the cataract and slide a new artificial lens inside.',
    actionCallout:
      '👉 1. Pick Cystotome and CLICK the center crosshair to puncture the skin. 2. Grab Utrata Forceps and DRAG in a smooth circle along the dashed blue guide ring.',
    targetLocationDescription:
      'Center of the dark pupil, following the 5.2mm glowing blue circle guide.',
    whyItsNecessary:
      'Why it is necessary: If you just randomly poke or shred the bag, sharp tears will zip down the sides to the back of the eye like a run in a nylon stocking! If that happens, the entire cataract falls into the back of the eyeball (vitreous) and you cannot put a replacement lens in place. A smooth, continuous circle distributes tension evenly and has immense structural strength.',
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
    ],
    detailedAnatomy: {
      tissueTarget: 'Anterior lens capsule basement membrane (14 µm thickness, pure Type IV collagen).',
      instrumentDepthOrSize: 'Bent cystotome 27G needle and Utrata micro-capsulorhexis forceps.',
      biomechanicsExplanation:
        'Shear force (tearing in the plane of the capsule) is 5x safer than stretch force (pulling perpendicular to the surface). Tangential traction prevents runaway vector forces.'
    }
  },

  hydrodissection: {
    id: 'hydrodissection',
    stepNumber: 5,
    module: 'phaco',
    title: 'Hydrodissection & Free Rotation Test',
    beginnerTitle: 'Step 5: Loosen the Lens with Water (Hydrodissection)',
    recommendedInstrument: 'hydro_cannula',
    spokenScript:
      'Step 5: Loosen the cataract with a fluid wave. Select the hydrodissection cannula. Slide the flat tip gently under the edge of your circular opening and click to spray a gentle pulse of balanced salt water. Look for the golden wave rolling across the back. Then verify the cataract spins freely like a dinner plate.',
    beginnerSummary:
      'Squirt a gentle pulse of saline water between the sticky outer shell of the cataract and its clear skin bag. This separates the cataract so it can spin freely 360 degrees.',
    actionCallout:
      '👉 Pick the Hydro Cannula on the left tray, then CLICK just under the edge of the circular opening to inject the fluid wave.',
    targetLocationDescription:
      'Underneath the anterior capsular rim at the top or side of your circular window.',
    whyItsNecessary:
      'Why it is necessary: The cataract is naturally glued to its protective bag by thousands of sticky cellular fibers. If you try to chop or turn the cataract while it is glued down, you will rip the fragile micro-threads (zonules) holding the bag to the eye wall, dropping the whole lens into the back of the eye! Water cleaves these bonds safely with zero mechanical stress.',
    clinicalObjective: 'Cleave cortical-capsular adhesions with a fluid wave and establish free 360° nuclear mobility.',
    techniquePearls: [
      'Tent up anterior capsule rim slightly before injecting BSS to prevent capsular block syndrome.',
      'Observe the golden fluid wave passing across the red reflex retroillumination.',
      'Depress the central nucleus to decompress anterior chamber fluid before nuclear rotation test.'
    ],
    hazards: [
      'Vigorous injection in an intact capsule without decompression can blow out the posterior capsule (capsular block blowout).',
      'Forcing rotation before cortical cleaving tears the zonular ligaments.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Cleavage plane between the lens cortex and the posterior capsular membrane.',
      instrumentDepthOrSize: '27-gauge flattened Chang or Sauter hydrodissection cannula.',
      biomechanicsExplanation:
        'Hydrodynamic fluid pressure seeks the path of least resistance between the rigid cortical fibers and the elastic capsular basement membrane, stripping adhesions hydraulically.'
    }
  },

  phaco_chop: {
    id: 'phaco_chop',
    stepNumber: 6,
    module: 'phaco',
    title: 'Phaco-Chop Nucleofractis & Aspiration',
    beginnerTitle: 'Step 6: Pulverize & Vacuum the Hard Lens Core (Phaco Chop)',
    recommendedInstrument: 'phaco_tip',
    spokenScript:
      'Step 6: Pulverize and vacuum the hard cataract. Select the phaco tip. Step on your foot pedal to Position 3 to engage ultrasonic vibration. Touch the tip to the center of the brown lens core to impale it, chop it into smaller bite-sized quarters, and vacuum them up. Keep your tip in the middle and stay far away from the thin back capsule.',
    beginnerSummary:
      'Use a hollow titanium needle vibrating 40,000 times a second to jackhammer the hard cataract into tiny crumbs while a vacuum sucks them out through the hollow center.',
    actionCallout:
      '👉 Pick the Phaco Tip. Click Foot Pedal to Position 3 (Ultrasound). CLICK and HOLD the central cataract core to chop and suck up all 4 quadrants.',
    targetLocationDescription:
      'Center of the pupil in the safe "phaco zone" (iris plane, pupil center, >1.5mm away from the delicate back capsule).',
    whyItsNecessary:
      'Why it is necessary: A cataract is a rock-hard, cloudy natural lens up to 10 millimeters wide. You cannot pull a 10mm hard stone through a tiny 2.4mm keyhole incision without tearing the eye open! The phaco ultrasound needle turns the rock into soup (emulsification) so it fits right through the microscopic straw.',
    clinicalObjective: 'Divide lens nucleus into manageable quadrants and emulsify with minimal Cumulative Dissipated Energy (CDE).',
    techniquePearls: [
      'Foot Pedal Position 1: Water flow on (keeps chamber deep and cool).',
      'Foot Pedal Position 2: Vacuum suction on (holds cataract chunks against tip).',
      'Foot Pedal Position 3: Ultrasound jackhammer on (pulverizes hard nucleus).',
      'Always emulsify within the safe central "phaco zone" at the pupil center.'
    ],
    hazards: [
      'Touching the ultrathin posterior capsule with active ultrasound instantly ruptures it, causing vitreous prolapse.',
      'Post-occlusion surge: When a chunk clears suddenly, high vacuum can suck the back capsule into the tip if fluidics are poorly balanced.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Hardened lens nucleus core (graded LOCS III NO1 to NO6).',
      instrumentDepthOrSize: 'Piezoelectric phacoemulsification needle oscillating at 28–45 kHz.',
      biomechanicsExplanation:
        'Phaco works via two mechanisms: mechanical jackhammer impact (physical stroke) and acoustic cavitation (microscopic micro-bubbles collapsing at supersonic speed, liquefying dense cataract protein).'
    }
  },

  cortex_removal: {
    id: 'cortex_removal',
    stepNumber: 7,
    module: 'phaco',
    title: 'Cortical Remnant Clearance (I/A)',
    beginnerTitle: 'Step 7: Vacuum the Soft Leftovers (Cortex Removal)',
    recommendedInstrument: 'ia_handpiece',
    spokenScript:
      'Step 7: Vacuum the soft sticky leftovers. Switch to the Irrigation and Aspiration handpiece. Step on pedal Position 2 to turn on suction. Click around the outer edges to vacuum away the fluffy cortical fibers. Polish the back surface until it looks like a clean window.',
    beginnerSummary:
      'Use a gentle suction wand to vacuum away the remaining soft, cottony fibers stuck to the inside walls of the bag, leaving a squeaky-clean transparent pouch.',
    actionCallout:
      '👉 Pick the I/A Handpiece on the tray. Put Foot Pedal in Position 2 (Aspiration). CLICK around the periphery to vacuum all remaining cortical fluff.',
    targetLocationDescription:
      'Equatorial periphery of the capsular bag (all 360 degrees around the outer rim).',
    whyItsNecessary:
      'Why it is necessary: Even after the hard core is gone, sticky cotton-candy-like material (cortex) clings to the bag walls. If you leave these cellular remnants inside, they cause severe eye inflammation, sky-high eye pressure (glaucoma), and trigger cloudy scar tissue that blinds the new implant.',
    clinicalObjective: 'Evacuate all equatorial cortex and epinucleus leaving a pristine, polished capsular bag.',
    techniquePearls: [
      'Engage cortical sheets with suction port facing sideways or anteriorly.',
      'Strip cortex radially centripetally from equator toward the center before aspirating.',
      'Polish posterior capsule in low-vacuum mode (20 mmHg) to clear fine haziness.'
    ],
    hazards: [
      'Aspirating the transparent posterior capsule: radial "spider-web" folds mean you grabbed the bag! Release the foot pedal immediately to Position 0 to prevent a catastrophic blowout.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Subcapsular cortical fiber remnants and epinuclear shell.',
      instrumentDepthOrSize: 'Coaxial 0.3 mm aspiration port with continuous fluid replenishment.',
      biomechanicsExplanation:
        'Hydro-dynamic aspiration relies on establishing occlusion of the soft cortical sheet, building vacuum from 100 to 500 mmHg to pull the fibers free from the capsule.'
    }
  },

  // =========================================================================
  // --- MODULE B: FOLDABLE INTRAOCULAR LENS (IOL) IMPLANTATION ---
  // =========================================================================

  ovd_bag_refill: {
    id: 'ovd_bag_refill',
    stepNumber: 8,
    module: 'iol',
    title: 'Capsular Bag Refill with Cohesive OVD',
    beginnerTitle: 'Step 8: Re-Inflate the Lens Bag with Jelly',
    recommendedInstrument: 'ovd_provisc',
    spokenScript:
      'Step 8: Re-inflate the empty bag. Select the Provisc cohesive jelly. Click inside the capsular bag to pump it full of thick jelly. This opens the bag wide so the new lens can slide in safely without poking a hole in the back.',
    beginnerSummary:
      'Pump thick surgical jelly into the empty, deflated lens bag to inflate it like a tent before sliding the new artificial lens inside.',
    actionCallout:
      '👉 Select Provisc (cohesive OVD) on the left tray, then CLICK inside the pupil to inflate the capsular bag.',
    targetLocationDescription:
      'Inside the circular capsulorhexis opening, aiming toward the back and corners of the bag.',
    whyItsNecessary:
      'Why it is necessary: Now that the cataract is gone, the clear bag collapses flat like an empty balloon. If you shove a hard plastic injector nozzle into a collapsed bag, it will spear right through the paper-thin back membrane! Injecting thick jelly acts like a balloon inflator, opening up a safe 3D pocket for the lens to unpack.',
    clinicalObjective: 'Expand the collapsed capsular bag to provide safe clearance for injector nozzle and IOL unfolding.',
    techniquePearls: [
      'Place cannula tip deep at the distal equator before depressing the plunger smoothly.',
      'Fill both the capsular bag and the anterior chamber to maintain proper operating space.'
    ],
    hazards: [
      'Advancing an IOL injector into a collapsed bag risks mechanical puncture of the posterior capsule.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Empty capsular bag equator and retro-pupillary space.',
      instrumentDepthOrSize: 'High molecular weight cohesive sodium hyaluronate (ProVisc/Healon).',
      biomechanicsExplanation:
        'Cohesive OVD holds space exceptionally well due to high zero-shear viscosity, maintaining bag volume against external vitreous pressure.'
    }
  },

  cartridge_insertion: {
    id: 'cartridge_insertion',
    stepNumber: 9,
    module: 'iol',
    title: 'Cartridge Delivery into Bag',
    beginnerTitle: 'Step 9: Slide the Injector Nozzle into the Eye',
    recommendedInstrument: 'iol_injector',
    spokenScript:
      'Step 9: Deliver the folded lens. Select the IOL injector. Slide the tapered nozzle through your main incision with the bevel pointing down. Click to smoothly advance the screw plunger and push the folded artificial lens inside.',
    beginnerSummary:
      'Slide the tip of the lens injector through the main 2.4mm incision, aiming the nozzle right into the inflated bag doorway.',
    actionCallout:
      '👉 Select the IOL Injector on the left tray. CLICK on the main incision target to insert the nozzle and begin advancing the lens.',
    targetLocationDescription:
      'The 2.4mm main corneal incision at 1:30 o\'clock, aiming towards the center of the pupil.',
    whyItsNecessary:
      'Why it is necessary: An artificial lens is 6 millimeters wide, but our incision is only 2.4 millimeters! The lens is folded up tightly like a microscopic burrito inside a sterile lubricated cartridge. The injector squeezes it through the tiny incision without stretching or tearing the corneal wound.',
    clinicalObjective: 'Deliver foldable hydrophobic acrylic optic through corneal wound without wound stretching or cartridge twist.',
    techniquePearls: [
      'Keep the beveled tip of the injector facing downward toward the lens bag floor.',
      'Advance the screw plunger smoothly; never force if you meet sudden resistance.'
    ],
    hazards: [
      'Injecting too fast can shoot the spring-loaded lens violently through the back of the eye.',
      'Incision stretching or wound burn occurs if the cartridge size is mismatched to the wound.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Main 2.4 mm clear corneal tunnel and anterior capsular opening.',
      instrumentDepthOrSize: 'Monarch or screw-assist IOL delivery injector with D-cartridge.',
      biomechanicsExplanation:
        'Hydrophobic acrylic is a memory polymer: it undergoes elastic deformation when compressed through a 1.8–2.4 mm bore and slowly recovers its planar optic geometry at body temperature (37°C).'
    }
  },

  haptic_unfolding: {
    id: 'haptic_unfolding',
    stepNumber: 10,
    module: 'iol',
    title: 'Leading Haptic Placement',
    beginnerTitle: 'Step 10: Unfold the Front Leg into the Corner',
    recommendedInstrument: 'iol_injector',
    spokenScript:
      'Step 10: Place the front leg. Watch the leading springy arm unfold out of the nozzle directly into the far corner of the bag. Keep the nozzle steady in the center so the lens optic unrolls smoothly flat.',
    beginnerSummary:
      'The artificial lens has two springy C-shaped arms called "haptics" that hold it centered. Guide the first spring arm so it unfurls directly into the far corner pocket of the bag.',
    actionCallout:
      '👉 CLICK again with the IOL Injector to push the front arm and central optic fully out into the pupil plane.',
    targetLocationDescription:
      'Far (distal) corner equator of the capsular bag, opposite your incision.',
    whyItsNecessary:
      'Why it is necessary: If the spring arms unfold on top of the iris (the colored part of the eye) instead of inside the bag, they will rub against blood vessels, causing bleeding (hyphema), intense inflammation, and vision distortion. Both arms must seat neatly inside the bag pockets.',
    clinicalObjective: 'Seat leading haptic directly into the distal capsular bag equator.',
    techniquePearls: [
      'Keep nozzle tip within anterior capsular rim so haptic cannot escape over the iris.',
      'Allow slow controlled unfolding of hydrophobic acrylic material at ocular temperature.'
    ],
    hazards: [
      'Letting the trailing arm get caught in the corneal incision can rip the haptic off the optic.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Distal capsular bag equator.',
      instrumentDepthOrSize: 'Single-piece foldable hydrophobic acrylic lens with 6.0 mm optic & 13.0 mm total length.',
      biomechanicsExplanation:
        'C-loop haptics exert outward radial spring force against the capsular equator, keeping the lens perfectly centered on the visual axis.'
    }
  },

  sinskey_dialing: {
    id: 'sinskey_dialing',
    stepNumber: 11,
    module: 'iol',
    title: 'Sinskey Hook 360° Rotational Centering',
    beginnerTitle: 'Step 11: Spin & Tuck the Back Leg (Sinskey Hook)',
    recommendedInstrument: 'sinskey_hook',
    spokenScript:
      'Step 11: Tuck the back leg in. Select the tiny Sinskey hook tool. Hook into the corner notch of the lens and rotate it clockwise. Tuck the trailing arm under the edge of the circular opening. Check that the round opening overlaps the lens edge all 360 degrees.',
    beginnerSummary:
      'Use a tiny 0.2mm peg tool (Sinskey hook) to rotate the lens clockwise like turning a steering wheel, tucking the second arm inside the bag and centering the lens right on the pupil.',
    actionCallout:
      '👉 Select the Sinskey Hook on the tray. CLICK the edge of the lens to rotate it clockwise and tuck the trailing haptic inside the bag.',
    targetLocationDescription:
      'Near the junction of the central optic and the trailing spring arm (proximal haptic).',
    whyItsNecessary:
      'Why it is necessary: If one arm is inside the bag and the other is outside in the ciliary sulcus (asymmetric placement), the lens will tilt, causing severe blurred vision, double vision, and chronic eye pressure spikes. Furthermore, having the capsulorhexis overlap the lens 360 degrees locks it in place forever.',
    clinicalObjective: 'Dial trailing haptic into bag, achieve 360° rhexis overlap, and center optic along visual axis.',
    techniquePearls: [
      'Place Sinskey hook at the optic-haptic junction notch.',
      'Rotate clockwise while applying slight downward posterior pressure to tuck the arm under the capsular rim.',
      'Verify 0.5 mm continuous anterior capsular overlap around all 360 degrees of the 6.0 mm optic.'
    ],
    hazards: [
      'Excessive downward force on an unyielding lens can rip through the posterior capsule.',
      'Asymmetric haptic placement causes UGH syndrome (Uveitis-Glaucoma-Hyphema).'
    ],
    detailedAnatomy: {
      tissueTarget: 'Proximal capsular equator and optic-haptic junction.',
      instrumentDepthOrSize: '0.2 mm angled Sinskey micro-manipulator hook.',
      biomechanicsExplanation:
        'Continuous 360° anterior capsule overlap creates a biological barrier: anterior lens epithelial cells fibrose against the optic edge, shrink-wrapping the lens securely into the capsular plane.'
    }
  },

  viscoelastic_washout: {
    id: 'viscoelastic_washout',
    stepNumber: 12,
    module: 'iol',
    title: 'Retro-Lens & AC Viscoelastic Washout',
    beginnerTitle: 'Step 12: Vacuum Out All the Jelly (Washout)',
    recommendedInstrument: 'ia_handpiece',
    spokenScript:
      'Step 12: Vacuum out all the remaining jelly. Take the I/A suction handpiece. Gently tilt the lens and reach behind it to suck out all the thick jelly trapped in the back. If you leave even a little jelly behind, the patient will wake up with dangerously high eye pressure.',
    beginnerSummary:
      'Reach behind the new lens with the suction tool to thoroughly wash out and vacuum away every drop of surgical jelly from inside the eye.',
    actionCallout:
      '👉 Select the I/A Handpiece. Put Foot Pedal in Position 2. CLICK behind the lens optic to vacuum out all residual viscoelastic jelly.',
    targetLocationDescription:
      'Behind the new acrylic lens optic (the retro-lens space) and inside the front chamber angles.',
    whyItsNecessary:
      'Why it is necessary: The surgical jelly that saved the cornea earlier will now destroy the eye if left behind! The microscopic drains of the eye (trabecular meshwork) get completely clogged by thick jelly. Fluid cannot drain out, causing intraocular pressure to skyrocket past 40 or 50 mmHg within hours of surgery, leading to agonizing pain, nausea, and irreversible optic nerve damage (glaucoma).',
    clinicalObjective: 'Thoroughly evacuate cohesive OVD from retro-lens space and anterior chamber to prevent acute IOP spike.',
    techniquePearls: [
      'Rock\'n\'roll maneuver: tilt optic gently with I/A tip to access capsular bag retro-lens space.',
      'Aspirate all visco behind optic; re-check anterior chamber angles before wound hydration.'
    ],
    hazards: [
      'Retained OVD occludes the trabecular meshwork, causing severe early postoperative IOP spikes (>45 mmHg).'
    ],
    detailedAnatomy: {
      tissueTarget: 'Retro-optic space and trabecular meshwork outflow drainage angle.',
      instrumentDepthOrSize: '0.3 mm aspiration port with dynamic chamber infusion.',
      biomechanicsExplanation:
        'High molecular weight hyaluronic acid polymers have high hydraulic resistance; washing them out restores physiologic aqueous humor drainage through Schlemm\'s canal.'
    }
  },

  // =========================================================================
  // --- MODULE C: ND:YAG LASER POSTERIOR CAPSULOTOMY ---
  // =========================================================================

  contact_lens_placement: {
    id: 'contact_lens_placement',
    stepNumber: 1,
    module: 'yag',
    title: 'Abraham Capsulotomy Lens Placement',
    beginnerTitle: 'Step 1: Fit the Abraham Magnifying Contact Lens',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 1 of YAG Laser: Place the special contact lens on the eye. Put a drop of clear gel on the Abraham contact lens and place it onto the patient\'s cornea. The magnifying button sharpens the laser beam into a tight focus point and keeps the patient from blinking.',
    beginnerSummary:
      'Rest a specialized glass contact lens on the patient\'s numbed eye. This magnifies the view, stops blinking, and focuses laser energy into a pinpoint.',
    actionCallout:
      '👉 With the YAG Laser module active, CLICK on the eye to apply the Abraham contact lens.',
    targetLocationDescription:
      'Cornea surface, centered over the pupil.',
    whyItsNecessary:
      'Why it is necessary: Months or years after cataract surgery, microscopic cells grow across the back bag like frosting on glass (a secondary cataract). We use an invisible infrared laser to blast a clear window through the haze. The Abraham contact lens widens the laser cone angle from 16° to 24°, concentrating energy strictly at the cloudy membrane while making it harmless to the cornea in front and the retina in the back.',
    clinicalObjective: 'Fit Abraham contact lens to stabilize the globe, maximize optical clarity, and reduce breakdown threshold.',
    techniquePearls: [
      'Anti-reflective coated +66D planoconvex button provides 1.5x magnification.',
      'Improves cone angle from 16° to 24°, reducing energy density on corneal endothelium and retina.'
    ],
    hazards: [
      'Air bubbles in coupling methylcellulose create optical distortion and beam defocus.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Corneal tear film and anterior corneal epithelium.',
      instrumentDepthOrSize: 'Abraham +66D planoconvex YAG capsulotomy contact lens.',
      biomechanicsExplanation:
        'Increasing the convergence angle reduces the focal waist diameter to ~8 µm, drastically lowering the energy needed to spark optical breakdown.'
    }
  },

  aiming_focus: {
    id: 'aiming_focus',
    stepNumber: 2,
    module: 'yag',
    title: 'Dual HeNe Aiming Beam Convergence',
    beginnerTitle: 'Step 2: Line Up the Twin Red Laser Aiming Dots',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 2: Align the twin red aiming lasers. Move your slit-lamp joystick forward or backward until the two separate red dots merge into a single crisp red point right on the cloudy membrane. When the two dots become one, you know the laser is perfectly in focus.',
    beginnerSummary:
      'Move the microscope focus until two red laser aiming dots overlap into a single sharp dot on the cloudy membrane.',
    actionCallout:
      '👉 Move your cursor over the hazy membrane until the twin red aiming dots converge into a single tight red reticle.',
    targetLocationDescription:
      'On the opacified posterior capsule behind the artificial lens.',
    whyItsNecessary:
      'Why it is necessary: The therapeutic laser beam is 1064nm infrared—completely invisible to the human eye! To show you where it will strike, the machine projects two red aiming beams from different angles. When the two red spots merge into one, the invisible laser is focused with pinpoint accuracy. If they are separated, the laser will fire in the wrong depth plane!',
    clinicalObjective: 'Achieve pinpoint confocal alignment of the twin red HeNe aiming beams on the retro-illuminated capsule.',
    techniquePearls: [
      'When out of focus, two distinct red dots appear on screen.',
      'Fine-tune joystick forward/backward until both dots merge into a single tight high-intensity red reticle.'
    ],
    hazards: [
      'Firing while aiming beams are doubled leads to shockwaves occurring away from target plane, potentially striking the lens optic.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Posterior capsular membrane with Elschnig pearl opacification.',
      instrumentDepthOrSize: 'Twin 632.8 nm Helium-Neon (HeNe) or diode aiming beams (0.5 mW).',
      biomechanicsExplanation:
        'Dual-beam parallax triangulation guarantees that the optical focal waist coincides exactly with the intersection point of the aiming beams.'
    }
  },

  offset_adjustment: {
    id: 'offset_adjustment',
    stepNumber: 3,
    module: 'yag',
    title: 'Posterior Focal Offset (+150µm)',
    beginnerTitle: 'Step 3: Set Laser Safety Distance (+150µm Behind Lens)',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 3: Crucial safety setting! Set the posterior offset to plus 150 micrometers. Never fire at zero offset! When the laser sparks, the mini shockwave expands forward. If you don\'t set a safety gap, the shockwave will pit, scratch, and crack the patient\'s expensive artificial lens!',
    beginnerSummary:
      'Dial in a safety gap (+150 microns) so the laser sparks slightly behind the cloudy membrane, preventing scratches on the artificial lens.',
    actionCallout:
      '👉 Verify the Laser Defocus Offset is set between +150µm and +200µm in the right console panel.',
    targetLocationDescription:
      'The right machine console: "Defocus Offset" dial set to +150 µm.',
    whyItsNecessary:
      'Why it is necessary: This is the number one rookie mistake in ophthalmology! When a laser spark creates plasma, the plasma sparks and expands FORWARD back toward the incoming laser beam. If your focus is set directly on the capsule (zero offset), the shockwave strikes the posterior surface of the plastic lens, blasting permanent micro-craters (pits) into the optic, creating glare, halos, and permanent vision distortion for the patient.',
    clinicalObjective: 'Ensure acoustic photodisruption focus is positioned behind the capsule to preserve the IOL optic.',
    techniquePearls: [
      'Aqueous dielectric breakdown creates plasma that expands backward toward the laser source.',
      'Posterior offset of +150 to +250 µm ensures the shockwave advances forward to open the capsule without touching the acrylic lens.'
    ],
    hazards: [
      'Zero or anterior offset causes catastrophic pitting, cracking, and glare on the IOL optic.',
      'Defocus > 320 µm risks breaking the anterior vitreous face.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Retro-capsular fluid interface, 150 µm behind the posterior IOL surface.',
      instrumentDepthOrSize: 'Coaxial motorized optical defocus element (+100 to +300 µm).',
      biomechanicsExplanation:
        'Optical breakdown generates dielectric plasma at temperatures >10,000°K, emitting a supersonic acoustic cavitation shockwave that cleaves tissue mechanically.'
    }
  },

  cruciate_capsulotomy: {
    id: 'cruciate_capsulotomy',
    stepNumber: 4,
    module: 'yag',
    title: 'Cruciate Pattern Laser Breakdown',
    beginnerTitle: 'Step 4: Zap in a Cross Pattern (Cruciate Cuts)',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 4: Zap the membrane in a cross pattern. Fire your laser pulses starting at the outer edges: 12 o\'clock at the top, 6 o\'clock at the bottom, then 9 and 3 o\'clock. Cutting in a cross releases the tension, making the cloudy flaps curl up and roll out of the visual axis naturally.',
    beginnerSummary:
      'Fire short laser pulses in a cross shape (+) starting from the outer edges to release tension so the cloudy curtain curls open and falls away.',
    actionCallout:
      '👉 CLICK on the numbered cross targets on the cloudy membrane: 1 (Top 12h) -> 2 (Bottom 6h) -> 3 (Left 9h) -> 4 (Right 3h).',
    targetLocationDescription:
      'The 4 arms of the cross (+) in the hazy pupil area outside the central line of sight.',
    whyItsNecessary:
      'Why it is necessary: If you blast directly in the dead center first, any accidental lens pit will land right in the patient\'s central vision line! Furthermore, the cloudy capsule is under tight drum-skin tension. By cutting the edges first like cutting the ropes of a tent, the tension pulls the central flaps wide open automatically, clearing vision using minimum laser energy.',
    clinicalObjective: 'Deliver cruciate pattern cuts to release capsular tension and clear central opacified Elschnig pearls.',
    techniquePearls: [
      'Begin peripherally at 12 o\'clock, then 6, 3, and 9 o\'clock along the cruciate arms.',
      'Releasing equatorial tension allows the central capsular flaps to curl out of the visual axis naturally.',
      'Use lowest effective energy (1.0 to 1.5 mJ per burst).'
    ],
    hazards: [
      'Firing directly in the central visual axis first risks severe central pits if alignment shifts.',
      'Excessive total energy (>60 mJ) induces transient IOP spike and cystoid macular edema (CME).'
    ],
    detailedAnatomy: {
      tissueTarget: 'Posterior capsular collagen sheet and Elschnig pearl clusters.',
      instrumentDepthOrSize: 'Q-switched Nd:YAG 1064 nm pulses of 4 nanosecond duration, 1.2–1.8 mJ energy.',
      biomechanicsExplanation:
        'Supersonic shockwave expansion cleaves the inelastic collagenous capsule; intrinsic capsular tension draws the four triangular quadrants away from the pupil center like opening a stage curtain.'
    }
  },

  post_yag_assessment: {
    id: 'post_yag_assessment',
    stepNumber: 5,
    module: 'yag',
    title: 'Visual Axis Clearance & IOP Check',
    beginnerTitle: 'Step 5: Check Clear Vision Window & Eye Pressure',
    recommendedInstrument: 'yag_laser',
    spokenScript:
      'Step 5: Inspect your work and check pressure. Verify you have created a clean 4 millimeter circular window with no loose tags hanging in the center. Check that the gel bag behind the eye is intact, and apply eye drops to prevent post-laser pressure spikes.',
    beginnerSummary:
      'Inspect the eye to ensure a crystal-clear 4mm central window is open, no tags are dangling, the lens has zero pits, and give drops to keep eye pressure normal.',
    actionCallout:
      '👉 Verify the visual axis is clear, confirm 0 IOL pits, and finalize the procedure.',
    targetLocationDescription:
      'Central 4mm optical zone of the pupil and the anterior vitreous face.',
    whyItsNecessary:
      'Why it is necessary: Loose tags hanging in the pupil will swing back and forth like a pendulum, creating ghostly double vision and annoying glare for the patient. Also, laser shockwaves release microscopic debris that can clog eye drains for 1 to 4 hours post-op, requiring prophylactic pressure-lowering drops (apraclonidine or brimonidine).',
    clinicalObjective: 'Assess visual axis clarity, verify IOL integrity, and evaluate vitreous hyaloid status.',
    techniquePearls: [
      'Ideal aperture matches or slightly exceeds photopic pupil diameter (3.5–4.0 mm).',
      'Confirm zero optic pits under high-magnification retroillumination.',
      'Administer topical apraclonidine or brimonidine to prevent post-laser IOP spikes.'
    ],
    hazards: [
      'Capsular tags hanging directly across the visual axis cause monocular diplopia and glare.',
      'Undetected vitreous prolapse through a ruptured anterior hyaloid face increases retinal detachment risk.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Anterior hyaloid face of the vitreous body and trabecular meshwork.',
      instrumentDepthOrSize: 'Slit-lamp retroillumination biomicroscopy and Goldmann tonometry.',
      biomechanicsExplanation:
        'Maintaining an intact anterior vitreous face keeps the vitreous gel compartmentalized, preventing inflammatory cytokines and macular traction.'
    }
  },

  // =========================================================================
  // --- MODULE D: MIGS TRABECULAR MICRO-BYPASS STENT SURGERY ---
  // =========================================================================

  microscope_and_head_tilt: {
    id: 'microscope_and_head_tilt',
    stepNumber: 1,
    module: 'migs',
    title: 'Operating Microscope & Patient Head Tilt',
    beginnerTitle: 'Step 1: Tilt the Microscope & Patient Head',
    recommendedInstrument: 'none',
    spokenScript:
      'Step 1 of MIGS Glaucoma Stent Surgery: Angle the microscope and patient head. Because the drainage angle of the eye is hidden around the side curve behind the cornea, light from straight above cannot see it. Tilt the microscope 35 to 40 degrees towards yourself, and tilt the patient\'s head 30 to 35 degrees away. Click the alignment beacon to set optimal direct gonioscopic optical trajectory.',
    beginnerSummary:
      'Tilt the surgical microscope toward you (35°-40°) and rotate the patient\'s head slightly away (30°-35°) to aim your line of sight directly into the hidden drainage corner of the eye.',
    actionCallout:
      '👉 CLICK the Tilt Alignment control on the angle HUD to align the microscope and patient head to 38°/35°.',
    targetLocationDescription:
      'Microscope ocular axis and patient cervical rotation angle.',
    whyItsNecessary:
      'Why it is necessary: Normal light from a surgical microscope shines straight down into the pupil. But the eye\'s microscopic drainage canal (Schlemm\'s canal) is tucked sideways around the 360-degree perimeter of the corneal rim! If you look straight down, total internal reflection inside the curved cornea completely hides the drain! Tilting the microscope and head lets you peek sideways into the drainage angle.',
    clinicalObjective: 'Overcome corneal total internal reflection to permit direct gonioscopic visualization of the nasal iridocorneal angle.',
    techniquePearls: [
      'Microscope tilted roughly 35°–45° toward the surgeon.',
      'Patient head rotated 30°–35° away from the operative eye.',
      'Maintain coaxial illumination to illuminate the trabecular meshwork without corneal glare.'
    ],
    hazards: [
      'Insufficient tilt produces corneal reflex glare and renders Schlemm canal ostia invisible.',
      'Excessive tilt can cause patient neck strain or dislodge the sterile surgical drape.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Iridocorneal filtration angle in the nasal quadrant.',
      instrumentDepthOrSize: 'Zeiss/Leica surgical microscope gonio-tilt mechanism.',
      biomechanicsExplanation:
        'The critical angle for the human air-cornea interface is approximately 46°. Rays reflected from the angle recess strike the corneal epithelium at >46° and undergo total internal reflection; tilting eliminates this optical barrier.'
    }
  },

  gonioprism_placement: {
    id: 'gonioprism_placement',
    stepNumber: 2,
    module: 'migs',
    title: 'Surgical Gonioprism Lens Placement',
    beginnerTitle: 'Step 2: Place the Prism Lens onto the Cornea',
    recommendedInstrument: 'gonio_lens',
    spokenScript:
      'Step 2: Apply the Swan-Jacob surgical gonioprism. Select the gonio lens from your tray. Place a drop of cohesive viscoelastic on the front surface of the cornea, then gently couple the flat lens onto the eye. Look for the golden-brown pigmented band: that is the diseased trabecular meshwork.',
    beginnerSummary:
      'Couple a specialized magnifying glass prism (Swan-Jacob lens) directly onto the clear cornea using a jelly cushion to reveal the internal drains of the eye in crisp detail.',
    actionCallout:
      '👉 Select the Swan-Jacob Gonioprism on the tray, then CLICK the center of the cornea to lock the high-definition angle view.',
    targetLocationDescription:
      'Anterior corneal surface and nasal iridocorneal angle.',
    whyItsNecessary:
      'Why it is necessary: Even with tilt, the curved cornea bends light like a dome mirror. A surgical gonioprism is an optical glass wedge that cancels the optical curvature of the cornea. It turns the curved surface into an optically flat window, revealing the four key landmarks: Schwalbe\'s line, the pigmented trabecular meshwork, the scleral spur, and the ciliary body band.',
    clinicalObjective: 'Cancel corneal optical power to achieve sub-millimeter visualization of trabecular meshwork pigmentation and collector channel hotspots.',
    techniquePearls: [
      'Use cohesive OVD as a fluid-coupling interface between gonioprism and cornea to prevent air bubbles.',
      'Avoid pressing hard on the cornea, which creates corneal striae (wrinkles) that blur the angle.',
      'Identify the amber pigmented trabecular meshwork band positioned just posterior to bright white Schwalbe\'s line.'
    ],
    hazards: [
      'Air bubbles trapped under the gonioprism cause optical distortion and blind spots.',
      'Excessive corneal indentation collapses the anterior chamber angle and empties Schlemm canal.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Anterior chamber angle: Schwalbe line, non-pigmented TM, pigmented TM, scleral spur.',
      instrumentDepthOrSize: 'Direct Swan-Jacob or Volk surgical gonioprism with cohesive OVD interface.',
      biomechanicsExplanation:
        'Index of refraction matching: corneal tissue (n = 1.376) couples directly with glass prism (n = 1.52), allowing light to exit perpendicular to the prism face without refraction.'
    }
  },

  viscoelastic_angle_deepening: {
    id: 'viscoelastic_angle_deepening',
    stepNumber: 3,
    module: 'migs',
    title: 'Viscoelastic Angle Deepening',
    beginnerTitle: 'Step 3: Deepen the Drainage Corner with Jelly',
    recommendedInstrument: 'ovd_provisc',
    spokenScript:
      'Step 3: Deepen the drainage corner with thick cohesive jelly. Select Provisc on the tray. Inject a gentle bolus into the nasal angle. Watch the iris push backward away from the cornea, opening up a spacious cavern for the stent injector.',
    beginnerSummary:
      'Inject thick cohesive surgical jelly into the drainage angle to push the colored iris backward, creating plenty of open room to safely work without touching delicate tissues.',
    actionCallout:
      '👉 Select Provisc on the tray, then CLICK the nasal angle target to expand the iridocorneal recess.',
    targetLocationDescription:
      'Nasal anterior chamber angle recess between the peripheral cornea and iris root.',
    whyItsNecessary:
      'Why it is necessary: In many glaucoma patients, the iris sits very close to the drainage meshwork (a crowded or narrow angle). If you attempt to slide an injector into a crowded angle, the sharp metal tip will gouge into the iris, causing bleeding (hyphema) and severe inflammation. Injecting cohesive jelly acts like an architectural pillar, pushing the iris back and giving you a wide, safe runway.',
    clinicalObjective: 'Deepen the anterior chamber angle recess and stabilize the pigmented trabecular meshwork target plane.',
    techniquePearls: [
      'Inject cohesive OVD specifically into the nasal quadrant to widen the angle recess.',
      'Ensure the angle is open to at least Shaffer Grade IV (>35° iridocorneal separation).',
      'Do not over-pressurize the anterior chamber, which compresses Schlemm canal flat.'
    ],
    hazards: [
      'Extreme over-pressurization collapses Schlemm canal, preventing micro-stent lumen penetration.',
      'Touching the iris root causes bleeding that obscures the pigmented trabecular band.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Nasal angle recess and trabecular meshwork face.',
      instrumentDepthOrSize: 'Cohesive sodium hyaluronate (ProVisc/Healon GV) 27G cannula.',
      biomechanicsExplanation:
        'Cohesive OVD exerts hydrostatic space-maintenance pressure, displacing the compliant iris diaphragm posteriorly without stripping the endothelial monolayer.'
    }
  },

  stent_1_deployment: {
    id: 'stent_1_deployment',
    stepNumber: 4,
    module: 'migs',
    title: 'Micro-Stent 1 Insertion into Schlemm Canal',
    beginnerTitle: 'Step 4: Click to Inject Stent 1 into the Bloodstream Drain',
    recommendedInstrument: 'migs_injector',
    spokenScript:
      'Step 4: Deploy Micro-Stent number 1. Select the iStent inject pen. Guide the microscopic tip across the eye to the nasal golden-brown meshwork band at 2:30 o\'clock. Approach at a 15 to 20 degree angle. Pierce through the meshwork right into Schlemm\'s canal and click the deployment button! The stent now channels fluid straight into the bloodstream.',
    beginnerSummary:
      'Advance the microscopic injector pen across the eye, pierce the clogged brown filter band at a 15°-20° angle into the hidden venous canal, and click to deploy the first titanium micro-stent.',
    actionCallout:
      '👉 Select the iStent Injector Pen. CLICK the flashing green beacon at 2:30 o\'clock on the pigmented meshwork to seat Micro-Stent 1.',
    targetLocationDescription:
      'Pigmented trabecular meshwork at 2:30 o\'clock in the nasal quadrant, directly over a primary collector channel ostium.',
    whyItsNecessary:
      'Why it is necessary: Here is the core secret: In glaucoma, 70% to 90% of the clog is in the trabecular meshwork filter itself! But the veins right behind it (Schlemm\'s canal and episcleral veins) are wide open and healthy! By punching this microscopic titanium snorkel directly through the clog, eye fluid bypasses the blockage completely and dumps directly into the bloodstream! And because the venous bloodstream has an automatic backpressure of 8 to 10 mmHg, the eye can never over-drain or collapse!',
    clinicalObjective: 'Penetrate trabecular meshwork and seat Stent 1 lumen securely into Schlemm canal lumen with direct collector channel communication.',
    techniquePearls: [
      'Enter the anterior chamber through the temporal clear corneal incision.',
      'Approach the pigmented trabecular meshwork at an angle of 15°–20° tangential to the scleral curvature.',
      'Depress the delivery sleeve button to seat the micro-stent thorax into the TM and release the 360µm flange into Schlemm canal.'
    ],
    hazards: [
      'Superficial placement leaves the stent floating free in the anterior chamber with zero pressure reduction.',
      'Overshooting too deep punctures the outer scleral wall, causing severe choroidal hemorrhage.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Pigmented trabecular meshwork into Schlemm canal lumen (nasal quadrant).',
      instrumentDepthOrSize: 'Heparin-coated medical-grade titanium micro-stent (height 360 µm, diameter 230 µm, central lumen 80 µm).',
      biomechanicsExplanation:
        'The stent establishes an uninterrupted low-resistance lumen from the pressurized anterior chamber directly into the low-pressure venous collector channels, completely eliminating trabecular outflow resistance.'
    }
  },

  stent_2_deployment: {
    id: 'stent_2_deployment',
    stepNumber: 5,
    module: 'migs',
    title: 'Micro-Stent 2 Insertion (Bilateral Bypass)',
    beginnerTitle: 'Step 5: Click to Inject Stent 2 (2 Clock Hours Away)',
    recommendedInstrument: 'migs_injector',
    spokenScript:
      'Step 5: Deploy the second micro-stent. Retract the injector tip slightly, slide 2 clock hours down to 4:00 o\'clock, and target the adjacent collector channel. Press gently into the pigmented meshwork and click to deploy Stent 2. Having two stents doubles your outflow capacity and guarantees dramatic eye pressure reduction.',
    beginnerSummary:
      'Move the injector 2 clock hours down the drainage ring to 4:00 o\'clock and deploy the second micro-stent into a neighboring collector channel.',
    actionCallout:
      '👉 With the iStent Injector Pen still selected, CLICK the flashing cyan beacon at 4:00 o\'clock to deploy Micro-Stent 2.',
    targetLocationDescription:
      'Pigmented trabecular meshwork at 4:00 o\'clock in the nasal-inferior quadrant (~2.0mm distance from Stent 1).',
    whyItsNecessary:
      'Why it is necessary: Schlemm\'s canal has discrete outflow collector channels spaced around the eye like highway exit ramps. Placing two micro-stents spaced 2 clock hours (~2 mm) apart taps into multiple collector channel networks across the nasal quadrant. This drops eye pressure twice as effectively and provides backup insurance in case one channel ever scars down.',
    clinicalObjective: 'Deploy second micro-stent spaced 2–3 clock hours from Stent 1 to recruit additional downstream collector channel networks.',
    techniquePearls: [
      'Retract injector sleeve, rotate 2 clock hours (~60°) inferiorly along the trabecular band.',
      'Target adjacent episcleral venous collector channel ostia for maximum outflow facility.',
      'Verify both stents exhibit visible inlet heads upright in the anterior chamber angle.'
    ],
    hazards: [
      'Placing stents too close together (<1 clock hour) taps the same collector channel with zero additional benefit.',
      'Inadvertent cyclodialysis occurs if the injector plunges beneath the scleral spur into the ciliary body.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Inferior-nasal trabecular meshwork and Schlemm canal at 4:00 o\'clock.',
      instrumentDepthOrSize: 'Multi-stent delivery trocar preloaded with second heparin-coated titanium micro-stent.',
      biomechanicsExplanation:
        'Recruiting multiple collector channels increases total outflow facility (C) from 0.08 to >0.26 µL/min/mmHg, allowing rapid equilibration toward the episcleral venous floor.'
    }
  },

  blood_reflux_and_washout: {
    id: 'blood_reflux_and_washout',
    stepNumber: 6,
    module: 'migs',
    title: 'Episcleral Blood Reflux & Viscoelastic Washout',
    beginnerTitle: 'Step 6: Confirm Blood Reflux (8-10 mmHg Floor) & Washout',
    recommendedInstrument: 'ia_handpiece',
    spokenScript:
      'Step 6: Verify blood reflux and clean the eye. Take the I/A suction handpiece. Gently tap the corneal wound to let a tiny drop of fluid out. Watch the miraculous blood reflux wave! Bright red blood seeps backwards through both stents from the bloodstream into the eye. This proves your stents are connected directly to the bloodstream! Wash out all remaining jelly, and your glaucoma surgery is complete.',
    beginnerSummary:
      'Gently lower eye pressure to watch bright red blood seep backwards through the stents from the bloodstream (proving direct connection and the 8-10 mmHg safety floor), then vacuum out all remaining jelly.',
    actionCallout:
      '👉 Select the I/A Handpiece, put Foot Pedal in Position 2. CLICK to confirm the blood reflux wave and vacuum out all viscoelastic jelly.',
    targetLocationDescription:
      'Nasal trabecular meshwork stent lumens and anterior chamber angle.',
    whyItsNecessary:
      'Why it is necessary: The Blood Reflux Wave is the definitive holy grail test in glaucoma surgery! When you temporarily lower the eye pressure slightly below 8 to 10 mmHg, venous blood from the body\'s bloodstream flows backward out of Schlemm\'s canal into the stent inlet! Seeing that bright red blood plume proves 100% that your stents are in the bloodstream! And because the blood pressure will always push back at 8 to 10 mmHg, the patient\'s eye pressure can never drop too low (protecting against hypotony)!',
    clinicalObjective: 'Demonstrate patent communication with episcleral venous bloodstream via transient blood reflux wave, and thoroughly aspirate cohesive OVD.',
    techniquePearls: [
      'Gently decompress the anterior chamber by pressing the posterior lip of the paracentesis.',
      'Observe immediate retrograde plume of blood through the stent lumen (the "blood wave").',
      'Re-pressurize the anterior chamber to ~14–16 mmHg to stop the reflux and check angle architecture.'
    ],
    hazards: [
      'Failure to observe blood reflux indicates misplaced stent (buried in sclera or floating in AC).',
      'Leaving residual cohesive OVD produces severe post-op IOP spikes (>40 mmHg) overriding stent efficacy.'
    ],
    detailedAnatomy: {
      tissueTarget: 'Episcleral venous plexus, Schlemm canal, and trabecular micro-stents.',
      instrumentDepthOrSize: 'Coaxial I/A handpiece with irrigation/aspiration port.',
      biomechanicsExplanation:
        'When IOP < EVP (Episcleral Venous Pressure: 8.0–10.0 mmHg), hydrostatic gradient reverses, drawing venous erythrocytes backwards through collector channels and stent bore. When IOP > EVP, aqueous humor flows into venous circulation.'
    }
  }
};

