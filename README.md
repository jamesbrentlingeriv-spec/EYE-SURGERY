# Ophthalmic Anterior Segment Surgical Simulator

An interactive, medically accurate, browser-based Anterior Segment Ophthalmic Surgical Simulator built with **React 19**, **TypeScript**, **Three.js / WebGL**, **Tailwind CSS**, and the **Web Audio API**.

---

## 🌟 Clinical Workflows Simulated

### 1. Phacoemulsification Cataract Surgery
- **Paracentesis & Tri-Planar Incision:** 1.0 mm MVR blade paracentesis and 2.4 mm clear corneal stepped incision.
- **OVD Protection:** Viscoat (dispersive) for endothelial coating and ProVisc (cohesive) for chamber deepening.
- **Continuous Curvilinear Capsulorhexis (CCC):** Puncture initiation with bent 27G cystotome; vector tear physics (tangential shear vs radial outward zonular tension); **Little's Technique** (180° centripetal rescue maneuver) to prevent runaway tears; circularity score ($4\pi A / P^2$) against ideal 5.0–5.5 mm target.
- **Hydrodissection & Nuclear Mobility:** Fluid wave propagation under capsule with free nuclear rotation test.
- **Phaco-Chop Nucleofractis:** Dual-pedal foot control (Positions 0–3), vacuum (0–600 mmHg), flow rate (0–50 cc/min), Continuous/Pulse/Burst modes, real-time Cumulative Dissipated Energy (**CDE**), post-occlusion surge dynamics, and posterior capsule rupture hazard within 1 mm.
- **Cortical Clearance:** 360° Irrigation/Aspiration (I/A) stripping from the capsular equator.

### 2. Foldable Intraocular Lens (IOL) Implantation
- **Capsular Inflation:** Cohesive viscoelastic refilling of the capsular bag.
- **Cartridge Delivery:** Plunger injection mechanism guiding a foldable hydrophobic acrylic 1-piece lens through the clear corneal wound into the bag.
- **Sinskey Hook Dialing:** 360° clockwise rotational dialing to seat trailing haptic in the capsular equator; Purkinje visual axis centration and 360° rhexis overlap verification.
- **Viscoelastic Washout:** Retro-lens and AC viscoelastic evacuation to prevent postoperative IOP spikes (>40 mmHg).

### 3. Nd:YAG Laser Posterior Capsulotomy (1064 nm)
- **Optical Setup:** Slit-lamp beam optics with variable slit width and angle; retroillumination fundus backlighting; **Abraham capsulotomy contact lens** (+66D button with anti-reflective coating).
- **Dual Red HeNe Aiming Beams:** Optical convergence physics where two separated red dots converge into a single pin-point focus only when at target plane.
- **Laser Photodisruption:** 0.8–2.5 mJ energy, Single/Double/Triple pulses, plasma shockwave acoustic breakdown "snap" and cavitation bubble.
- **Posterior Defocus Offset:** +100 to +250 µm posterior offset control to prevent catastrophic IOL pitting.
- **Cruciate Pattern Technique:** Cross-shaped tension release starting peripherally outside the visual axis to clear central PCO.

---

## ⚡ Biomechanical & Fluidics Engine
- **Fluidics Balance:** Differential equation:
  $$\frac{dV}{dt} = \text{Inflow}(\text{Bottle Head}) - \text{Outflow}(\text{Aspiration} + \text{Incision Leak})$$
- **Anterior Chamber Shallowing & Corneal Folds:** Instantaneous detection when $\text{IOP} < 6.5\text{ mmHg}$.
- **Collision Detection:** Endothelial contact alert and posterior capsule proximity warning.

---

## 🎧 Real-Time Web Audio API Synthesis
- **Piezoelectric Phaco Hum:** Ultrasonic transducer harmonic frequencies modulated by pedal position.
- **Vacuum Pump Whine:** Dynamic pitch rising smoothly with vacuum level from 180 Hz to 720 Hz.
- **Nd:YAG Cavitation Snap:** Acoustic shockwave discharge and cavitation bubble collapse.
- **ECG Telemetry:** Synchronized heart monitor pulse tones.

---

## 🚀 Running the Simulator

The simulator is currently running locally at:
```bash
http://localhost:5173/
```

To run manually or rebuild:
```bash
# Build production bundle
npm run build

# Start server
npm run dev
```

### Controls & Keyboard Shortcuts:
- `0`: Foot pedal Standby (Pos 0)
- `1`: Continuous Irrigation (Pos 1)
- `2`: Aspiration (Pos 2)
- `3`: Phaco Ultrasound Power (Pos 3)
- `Space`: Cycle Foot Pedal Position
- `Left Click / Drag`: Manipulate instruments, tear capsule, or fire Nd:YAG laser
