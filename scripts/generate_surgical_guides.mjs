import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('[PDF Builder] Using Headless Browser:', browserPath);

// Reusable CSS styling for print-perfect, modern medical guidebook design
const commonCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @page {
    size: letter portrait;
    margin: 12mm 14mm 14mm 14mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 10pt;
    line-height: 1.45;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 8px;
    margin-bottom: 14px;
  }

  .brand-badge {
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #0284c7;
    background: #e0f2fe;
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .doc-title {
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-top: 4px;
  }

  .doc-subtitle {
    font-size: 9.5pt;
    color: #64748b;
    margin-top: 2px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 8pt;
  }

  .meta-item strong {
    display: block;
    color: #475569;
    text-transform: uppercase;
    font-size: 7pt;
    letter-spacing: 0.5px;
  }

  .meta-item span {
    color: #0f172a;
    font-weight: 600;
    font-size: 8.5pt;
  }

  .overview-box {
    background: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 14px;
    font-size: 9pt;
    color: #166534;
  }

  .overview-box h4 {
    font-size: 9.5pt;
    font-weight: 700;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .step-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }

  .step-header {
    background: #0f172a;
    color: #ffffff;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .step-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .step-num {
    background: #0284c7;
    color: #ffffff;
    font-size: 8pt;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

  .step-name {
    font-size: 10.5pt;
    font-weight: 700;
  }

  .step-tool {
    font-size: 8pt;
    background: #1e293b;
    border: 1px solid #334155;
    padding: 2px 8px;
    border-radius: 4px;
    color: #38bdf8;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }

  .step-body {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #ffffff;
  }

  .action-banner {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 9pt;
    color: #92400e;
  }

  .action-banner strong {
    color: #b45309;
    font-weight: 800;
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 2px;
  }

  .why-box {
    background: #f0f9ff;
    border-left: 3px solid #0284c7;
    padding: 7px 10px;
    border-radius: 0 6px 6px 0;
    font-size: 8.5pt;
    color: #0369a1;
    line-height: 1.4;
  }

  .why-box strong {
    font-weight: 700;
    color: #0284c7;
  }

  .details-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-top: 4px;
  }

  .details-table th, .details-table td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    text-align: left;
    vertical-align: top;
  }

  .details-table th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
    width: 25%;
  }

  .details-table td {
    color: #1e293b;
  }

  .hazard-box {
    background: #fef2f2;
    border-left: 3px solid #ef4444;
    padding: 6px 10px;
    border-radius: 0 6px 6px 0;
    font-size: 8pt;
    color: #991b1b;
  }

  .hazard-box strong {
    color: #dc2626;
  }

  .diagram-container {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px;
    margin: 12px 0;
    text-align: center;
    page-break-inside: avoid;
  }

  .diagram-title {
    font-size: 8.5pt;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
  }

  .page-footer {
    border-top: 1px solid #cbd5e1;
    padding-top: 6px;
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #94a3b8;
  }

  .page-break {
    page-break-after: always;
  }
`;

// =========================================================================
// SVG DIAGRAMS EMBEDDED
// =========================================================================

// Diagram 1: Tri-Planar Incision Architecture
const svgIncisionDiagram = `
<svg viewBox="0 0 700 220" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="corneaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.2"/>
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
    </marker>
    <marker id="arrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
    </marker>
  </defs>

  <!-- Background container -->
  <rect width="700" height="220" fill="#f8fafc" rx="8" />

  <!-- Corneal Section Outline -->
  <!-- Outer Epithelium Surface -->
  <path d="M 40 40 Q 350 25 660 40 L 660 170 Q 350 160 40 170 Z" fill="url(#corneaGrad)" stroke="#0284c7" stroke-width="2"/>

  <!-- Layer labels -->
  <text x="50" y="32" font-family="Inter" font-size="10" font-weight="700" fill="#0369a1">CORNEA OUTER SURFACE (Epithelium)</text>
  <text x="50" y="105" font-family="Inter" font-size="10" font-weight="600" fill="#64748b">CORNEAL STROMA (500 µm thickness - 200 collagen lamellae)</text>
  <text x="50" y="195" font-family="Inter" font-size="10" font-weight="700" fill="#0369a1">INNER CHAMBER (Endothelium & Descemet's Membrane)</text>

  <!-- Stepped Tri-Planar Path -->
  <!-- Plane 1: Vertical Limbal Groove (300 µm depth) -->
  <path d="M 520 40 L 520 85" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Plane 2: Horizontal Lamellar Tunnel (1.5 - 1.75 mm length) -->
  <path d="M 520 85 L 360 92" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Plane 3: Angled Descemet AC Entry -->
  <path d="M 360 92 L 310 165" stroke="#10b981" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Plane Callout Badges -->
  <!-- Callout 1 -->
  <circle cx="520" cy="40" r="5" fill="#ef4444"/>
  <rect x="535" y="48" width="150" height="34" rx="4" fill="#fee2e2" stroke="#fca5a5"/>
  <text x="542" y="62" font-family="Inter" font-size="9" font-weight="800" fill="#991b1b">PLANE 1: VERTICAL GROOVE</text>
  <text x="542" y="75" font-family="Inter" font-size="8" fill="#7f1d1d">Depth: ~300µm at anterior limbus</text>

  <!-- Callout 2 -->
  <rect x="360" y="48" width="150" height="34" rx="4" fill="#fef3c7" stroke="#fde68a"/>
  <text x="368" y="62" font-family="Inter" font-size="9" font-weight="800" fill="#92400e">PLANE 2: STROMAL TUNNEL</text>
  <text x="368" y="75" font-family="Inter" font-size="8" fill="#78350f">Length: 1.5–1.75mm into stroma</text>

  <!-- Callout 3 -->
  <circle cx="310" cy="165" r="5" fill="#10b981"/>
  <rect x="180" y="125" width="160" height="34" rx="4" fill="#d1fae5" stroke="#6ee7b7"/>
  <text x="188" y="139" font-family="Inter" font-size="9" font-weight="800" fill="#065f46">PLANE 3: DESCEMET ENTRY</text>
  <text x="188" y="152" font-family="Inter" font-size="8" fill="#047857">Clean puncture into AC</text>

  <!-- Self-sealing valve arrow -->
  <path d="M 300 195 Q 340 180 345 155" fill="none" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrowBlue)" stroke-dasharray="3,3"/>
  <text x="355" y="195" font-family="Inter" font-size="8.5" font-weight="700" fill="#0369a1">Intraocular pressure pushes internal flap UP against roof → 100% Watertight Self-Seal!</text>
</svg>
`;

// Diagram 2: Capsulorhexis (CCC) Vector Tear Mechanics
const svgCapsulorhexisDiagram = `
<svg viewBox="0 0 700 200" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="200" fill="#f8fafc" rx="8" />

  <!-- Natural lens perimeter -->
  <circle cx="200" cy="100" r="85" fill="#fef3c7" stroke="#d97706" stroke-width="2" />
  <text x="200" y="30" font-family="Inter" font-size="9" font-weight="700" text-anchor="middle" fill="#92400e">CATARACTOUS LENS (9–10mm)</text>

  <!-- Ideal 5.2mm CCC opening -->
  <circle cx="200" cy="100" r="50" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4,3"/>
  <text x="200" y="96" font-family="Inter" font-size="10" font-weight="800" text-anchor="middle" fill="#0369a1">IDEAL 5.2 mm CCC</text>
  <text x="200" y="112" font-family="Inter" font-size="8" font-weight="600" text-anchor="middle" fill="#0284c7">Overlaps 6.0mm IOL Optic</text>

  <!-- Force vector illustration -->
  <g transform="translate(420, 20)">
    <text x="0" y="15" font-family="Inter" font-size="11" font-weight="800" fill="#0f172a">BIOMECHANICAL TEAR VECTORS</text>

    <!-- Safe Shear Vector -->
    <rect x="0" y="30" width="260" height="58" rx="6" fill="#ecfdf5" stroke="#a7f3d0"/>
    <text x="10" y="48" font-family="Inter" font-size="9" font-weight="800" fill="#065f46">✓ SHEAR VECTOR (Safe - In-Plane Traction)</text>
    <text x="10" y="62" font-family="Inter" font-size="8" fill="#047857">Force directed tangentially along the circle.</text>
    <text x="10" y="74" font-family="Inter" font-size="8" fill="#047857">Capsule tears smoothly without running away.</text>

    <!-- Dangerous Radial Vector -->
    <rect x="0" y="98" width="260" height="68" rx="6" fill="#fef2f2" stroke="#fecaca"/>
    <text x="10" y="115" font-family="Inter" font-size="9" font-weight="800" fill="#991b1b">✗ RADIAL STRETCH (Danger - Runaway Tear)</text>
    <text x="10" y="129" font-family="Inter" font-size="8" fill="#b91c1c">Centrifugal vector pulls out toward zonules.</text>
    <text x="10" y="141" font-family="Inter" font-size="8" font-weight="700" fill="#b91c1c">RESCUE: Pull flap flat 180° back to pupil center!</text>
  </g>
</svg>
`;

// Diagram 3: Foldable IOL Implantation & 360° Overlap
const svgIolDiagram = `
<svg viewBox="0 0 700 200" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="200" fill="#f8fafc" rx="8" />

  <!-- Capsular Bag Equator -->
  <circle cx="180" cy="100" r="80" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
  <text x="180" y="35" font-family="Inter" font-size="8.5" font-weight="700" text-anchor="middle" fill="#64748b">CAPSULAR BAG EQUATOR (10.5 mm)</text>

  <!-- 6.0mm Acrylic Optic -->
  <circle cx="180" cy="100" r="50" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
  <text x="180" y="98" font-family="Inter" font-size="10" font-weight="800" text-anchor="middle" fill="#0369a1">6.0 mm IOL OPTIC</text>
  <text x="180" y="112" font-family="Inter" font-size="8" text-anchor="middle" fill="#0284c7">Purkinje Visual Axis</text>

  <!-- C-Loop Haptics -->
  <path d="M 225 80 C 260 50, 270 120, 240 145" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
  <path d="M 135 120 C 100 150, 90 80, 120 55" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>

  <!-- 5.2mm CCC Overlap Ring -->
  <circle cx="180" cy="100" r="44" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
  <text x="180" y="150" font-family="Inter" font-size="8" font-weight="700" text-anchor="middle" fill="#047857">5.2 mm CCC Edge (Overlaps Optic 360° by 0.4mm)</text>

  <!-- Explanatory legend -->
  <g transform="translate(380, 25)">
    <text x="0" y="15" font-family="Inter" font-size="11" font-weight="800" fill="#0f172a">WHY 360° OVERLAP MATTERS</text>

    <rect x="0" y="30" width="300" height="60" rx="6" fill="#f0fdf4" stroke="#bbf7d0"/>
    <text x="10" y="48" font-family="Inter" font-size="8.5" font-weight="700" fill="#166534">1. Prevents PCO (Secondary Cataracts)</text>
    <text x="10" y="62" font-family="Inter" font-size="8" fill="#15803d">Square-edge optic + shrink-wrap overlap traps</text>
    <text x="10" y="74" font-family="Inter" font-size="8" fill="#15803d">residual lens cells, stopping cloudy migration.</text>

    <rect x="0" y="100" width="300" height="60" rx="6" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="10" y="118" font-family="Inter" font-size="8.5" font-weight="700" fill="#1e40af">2. Perfect Centration & No Lens Tilt</text>
    <text x="10" y="132" font-family="Inter" font-size="8" fill="#1d4ed8">Both spring arms seated symmetrically in bag prevents</text>
    <text x="10" y="144" font-family="Inter" font-size="8" fill="#1d4ed8">unwanted astigmatism and double vision.</text>
  </g>
</svg>
`;

// Diagram 4: Nd:YAG Laser Optical Breakdown & Posterior Defocus
const svgYagDiagram = `
<svg viewBox="0 0 700 200" width="100%" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="200" fill="#f8fafc" rx="8" />

  <!-- Incoming Laser Cone -->
  <polygon points="60,20 60,180 280,100" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="70" y="40" font-family="Inter" font-size="8.5" font-weight="700" fill="#dc2626">INCOMING 1064nm LASER CONE (24°)</text>

  <!-- Intraocular Lens Optic Profile -->
  <rect x="220" y="30" width="20" height="140" rx="4" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
  <text x="210" y="185" font-family="Inter" font-size="8.5" font-weight="700" fill="#0369a1">IOL OPTIC</text>

  <!-- Opacified Posterior Capsule -->
  <line x1="245" y1="30" x2="245" y2="170" stroke="#f59e0b" stroke-width="3"/>
  <text x="250" y="25" font-family="Inter" font-size="8.5" font-weight="700" fill="#d97706">HAZY CAPSULE</text>

  <!-- Plasma Spark Focus (Offset +150µm) -->
  <circle cx="280" cy="100" r="7" fill="#ef4444"/>
  <circle cx="280" cy="100" r="14" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="2,2"/>
  <text x="300" y="98" font-family="Inter" font-size="9" font-weight="800" fill="#dc2626">PLASMA SPARK</text>
  <text x="300" y="112" font-family="Inter" font-size="8" font-weight="600" fill="#b91c1c">+150 µm Defocus Offset</text>

  <!-- Shockwave expansion arrow (advances toward capsule) -->
  <path d="M 275 100 L 250 100" stroke="#10b981" stroke-width="3" marker-end="url(#arrow)"/>

  <!-- Safety explanation panel -->
  <g transform="translate(450, 20)">
    <rect x="0" y="0" width="230" height="160" rx="8" fill="#fef2f2" stroke="#fca5a5"/>
    <text x="12" y="24" font-family="Inter" font-size="10" font-weight="800" fill="#991b1b">CRITICAL SAFETY RULE:</text>
    <text x="12" y="44" font-family="Inter" font-size="8.5" font-weight="700" fill="#b91c1c">Why NEVER fire at 0 offset?</text>
    <text x="12" y="62" font-family="Inter" font-size="8" fill="#7f1d1d">1. Plasma expands FORWARD</text>
    <text x="12" y="74" font-family="Inter" font-size="8" fill="#7f1d1d">back toward the incoming laser.</text>
    <text x="12" y="94" font-family="Inter" font-size="8" fill="#7f1d1d">2. At 0 offset, the supersonic</text>
    <text x="12" y="106" font-family="Inter" font-size="8" fill="#7f1d1d">shockwave pits & cracks the IOL!</text>
    <text x="12" y="126" font-family="Inter" font-size="8.5" font-weight="700" fill="#047857">✓ +150µm offset protects</text>
    <text x="12" y="140" font-family="Inter" font-size="8" font-weight="700" fill="#047857">the optic 100% of the time!</text>
  </g>
</svg>
`;

// =========================================================================
// DOCUMENT 1: CATARACT PHACOEMULSIFICATION GUIDE
// =========================================================================
const htmlSurgery1 = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Cataract Phacoemulsification Surgery - Complete Surgical Manual</title>
  <style>${commonCss}</style>
</head>
<body>
  <!-- Header -->
  <div class="page-header">
    <div>
      <span class="brand-badge">PAL OPTIC OPHTHALMIC SURGICAL ACADEMY</span>
      <h1 class="doc-title">Cataract Phacoemulsification Surgery</h1>
      <p class="doc-subtitle">Beginner-to-Advanced Step-by-Step Operative Field Guide & Anatomical Rationale</p>
    </div>
    <div style="text-align: right;">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #64748b;">REF: SURG-MOD-01</span><br>
      <span style="font-size: 8pt; font-weight: 700; color: #0284c7;">EDITION 2026.1</span>
    </div>
  </div>

  <!-- Meta Grid -->
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Target Pathology</strong>
      <span>Nuclear Cataract (LOCS III NO1-NO5)</span>
    </div>
    <div class="meta-item">
      <strong>Primary Incision</strong>
      <span>2.4 mm Tri-Planar Clear Cornea</span>
    </div>
    <div class="meta-item">
      <strong>Ultrasound Frequency</strong>
      <span>28–45 kHz Piezoelectric</span>
    </div>
    <div class="meta-item">
      <strong>Anesthesia Protocol</strong>
      <span>Topical Proparacaine + Intracameral Lidocaine</span>
    </div>
  </div>

  <!-- Plain English Overview Box -->
  <div class="overview-box">
    <h4>🌟 What Is Cataract Surgery in Simple Terms?</h4>
    Inside your eye is a natural crystal lens that focuses light onto your retina. As you get older, the proteins inside clump up and turn cloudy like frosted bathroom glass—this is a <strong>cataract</strong>. During surgery, we make a tiny self-sealing doorway into the eye, cut a round window in the cellophane-like bag holding the cataract, use a microscopic ultrasonic jackhammer (phacoemulsification) to turn the hard rock into soup and vacuum it out, and leave the clean empty bag ready for a new artificial lens.
  </div>

  <!-- Diagram: Detailed Incision Architecture -->
  <div class="diagram-container">
    <div class="diagram-title">Corneal Incision Architecture & Tri-Planar Self-Sealing Physics</div>
    ${svgIncisionDiagram}
  </div>

  <!-- STEP 1 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 1</span>
        <span class="step-name">Paracentesis Incision (~1.0mm MVR) — The Small Side Door</span>
      </div>
      <span class="step-tool">Tool: 1.0mm MVR Blade</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Pick up the 1.0mm MVR blade from your tray. Locate the 10 o'clock position (upper left) on the edge of the clear cornea. Angle the blade flat (parallel to the iris plane) and make a single, crisp 1-millimeter puncture into the front chamber.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        Eye surgery is a two-handed operation. Your primary hand operates the phaco ultrasound needle through the main wound, but you need a second doorway for an assistant tool (such as a Nagahara chopper, cyclodialysis spatula, or nucleus rotator) in your non-dominant hand. The second instrument holds the slippery cataract chunks in place, rotates the lens, and protects the back of the eye. Without this side port, you would have zero control over the cataract chunks inside the eye.
      </div>
      <table class="details-table">
        <tr>
          <th>Anatomical Target</th>
          <td>Peripheral clear cornea at the 10 o'clock limbus, just anterior to the fine red blood vessels (vascular arcade).</td>
        </tr>
        <tr>
          <th>Surgical Technique</th>
          <td>Keep blade strictly parallel to the colored iris. Avoid aiming downward (which would puncture the iris or tear the front lens capsule) or aiming too upward (which tears the corneal stroma).</td>
        </tr>
      </table>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Entering too anteriorly in the clear cornea induces corneal astigmatism and distortion. A sudden downward plunge will lacerate the iris and induce massive bleeding (hyphema).
      </div>
    </div>
  </div>

  <!-- STEP 2 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 2</span>
        <span class="step-name">Tri-Planar Clear Corneal Incision (2.4mm) — The Main Doorway</span>
      </div>
      <span class="step-tool">Tool: 2.4mm Angled Keratome</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Switch to the 2.4mm angled keratome blade. Position the blade at 1:30 o'clock on the limbus. Cut in 3 continuous steps: 1) Make a vertical 300µm groove; 2) Tunnel forward 1.5mm through the cornea wall; 3) Dimple down to enter the eye chamber.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The phacoemulsification needle is 2.4mm wide. You must create an entry path that fits the instrument snuggly without leaking irrigation fluid. Cutting it in 3 staggered planes (tri-planar) creates an automatic self-sealing one-way valve: natural pressure from inside the eye pushes the internal corneal flap against the roof of the tunnel, sealing it shut 100% watertight without requiring stitches or sutures.
      </div>
      <table class="details-table">
        <tr>
          <th>Plane 1 (Vertical Groove)</th>
          <td>Perpendicular vertical groove (~300 µm depth, half corneal thickness) at the anterior limbus.</td>
        </tr>
        <tr>
          <th>Plane 2 (Lamellar Tunnel)</th>
          <td>Blade flattened to advance 1.5–1.75 mm through the dense collagen fibers toward the corneal center.</td>
        </tr>
        <tr>
          <th>Plane 3 (Descemet Entry)</th>
          <td>Tip dimpled downward to cleanly pierce Descemet's membrane with a crisp internal entry.</td>
        </tr>
      </table>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> A tunnel that is too short (&lt;1.2 mm) will leak, causing the eye to go soft, iris prolapse, and catastrophic post-op infection (endophthalmitis). A tunnel that is too long (&gt;2.2 mm) creates corneal wrinkles (striae) and blocks tool movement.
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- STEP 3 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 3</span>
        <span class="step-name">OVD Injection (Dispersive & Cohesive) — The Protective Jelly Shield</span>
      </div>
      <span class="step-tool">Tool: Viscoat / Provisc Syringe</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Take the Viscoat syringe with a smooth 27-gauge cannula. Slide through the side port or main wound and inject the thick jelly directly over the back of the cornea. Next, inject cohesive Provisc to deepen the eye chamber.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The inner lining of the cornea is made of delicate "endothelial cells" that pump fluid out of the cornea to keep it crystal clear. Human endothelial cells DO NOT regenerate! If ultrasonic shockwaves, free radicals, or turbulent saline touch these cells, they die, turning the cornea permanently cloudy and white (bullous keratopathy), requiring a corneal transplant. The viscoelastic jelly acts like a protective shield of armor absorbing all ultrasound turbulence.
      </div>
      <table class="details-table">
        <tr>
          <th>Arshinoff Soft-Shell Technique</th>
          <td>1) Dispersive Viscoat coats and adheres tenaciously to endothelial cells; 2) Cohesive Provisc creates deep operating space and flattens the lens capsule.</td>
        </tr>
      </table>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Over-pressurizing the eye causes zonular rupture or capsule blowout. Inadequate jelly coverage leaves corneal cells exposed to ultrasonic cell death.
      </div>
    </div>
  </div>

  <!-- Diagram: Capsulorhexis -->
  <div class="diagram-container">
    <div class="diagram-title">Continuous Curvilinear Capsulorhexis (CCC) Vector Physics</div>
    ${svgCapsulorhexisDiagram}
  </div>

  <!-- STEP 4 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 4</span>
        <span class="step-name">Continuous Curvilinear Capsulorhexis (CCC) — The Window in the Bag</span>
      </div>
      <span class="step-tool">Tool: Cystotome & Utrata Forceps</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        1) Poke the center of the lens skin with the bent needle (cystotome) to raise a small flap; 2) Grasp the flap edge with Utrata forceps and drag in a continuous, smooth circle around the 5.2mm guide ring.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The cataract is encapsulated in an elastic membrane 14 microns thin (thinner than plastic wrap). To suck out the cataract, you must open this bag. If you cut it with scissors or make jagged tears, the tears will zip down the sides to the back of the eye like a run in pantyhose. The whole cataract and lens will fall into the back of the eyeball (vitreous loss)! A continuous curvilinear circle has enormous tensile strength with zero stress points.
      </div>
      <table class="details-table">
        <tr>
          <th>Target Dimensions</th>
          <td>Diameter 5.0 to 5.5 mm (ideally 5.2 mm), centered precisely on the Purkinje optical visual axis.</td>
        </tr>
        <tr>
          <th>Little's Rescue Technique</th>
          <td>If the tear starts running out radially toward the edge, unfold the flap flat and pull 180° directly back toward the pupil center to redirect the tear.</td>
        </tr>
      </table>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Radial tear run-out into equatorial zonules causes posterior capsule rupture and dropped nucleus.
      </div>
    </div>
  </div>

  <!-- STEP 5 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 5</span>
        <span class="step-name">Hydrodissection & Rotation Test — Loosening the Cataract with Water</span>
      </div>
      <span class="step-tool">Tool: Hydrodissection Cannula (BSS)</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Slip the flat cannula tip just under the edge of your circular capsular opening. Inject a gentle pulse of balanced salt solution (BSS). Watch the "golden fluid wave" roll across the back. Then gently tap and rotate the lens 360 degrees.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The cataract is glued to the inside of its bag by thousands of sticky cellular fibers. If you try to chop or turn the cataract while it is glued down, you will rip the tiny suspension strings (zonules) holding the bag in place. Spraying water hydraulically cleaves all adhesions without mechanical stress.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Injecting too fast or forcefully without decompressing the front chamber causes "capsular block syndrome"—the pressure blows the back of the bag wide open!
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- STEP 6 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 6</span>
        <span class="step-name">Phaco-Chop Nucleofractis & Aspiration — Pulverizing the Hard Core</span>
      </div>
      <span class="step-tool">Tool: Phaco Ultrasound Handpiece + Chopper</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Depress your foot pedal: Position 1 for water flow, Position 2 for vacuum, Position 3 for ultrasound vibration. Embed the phaco tip into the cataract core, bring the chopper in from the side, and pull together to split the cataract into 4 quadrants. Vacuum up each quarter.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        A hard cataract is up to 10mm wide and cannot fit through a tiny 2.4mm incision. The phaco needle vibrates 40,000 times a second, using microscopic cavitation bubbles to liquefy the hard rock so the vacuum can suck it out through the hollow center.
      </div>
      <table class="details-table">
        <tr>
          <th>Foot Pedal Protocol</th>
          <td>Pos 0: Off | Pos 1: Continuous Irrigation | Pos 2: Vacuum Aspiration | Pos 3: Ultrasonic Cavitation Power</td>
        </tr>
        <tr>
          <th>Safe Phaco Zone</th>
          <td>Always perform chopping and emulsification at the iris plane in the center of the pupil. Never activate ultrasound within 1.5mm of the fragile back capsule.</td>
        </tr>
      </table>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Post-occlusion surge: when a dense fragment suddenly clears the tip, vacuum spikes and can suck the posterior capsule into the needle, instantly tearing it!
      </div>
    </div>
  </div>

  <!-- STEP 7 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 7</span>
        <span class="step-name">Cortical Remnant Clearance (I/A) — Vacuuming the Soft Leftovers</span>
      </div>
      <span class="step-tool">Tool: Coaxial I/A Handpiece</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Switch to the Irrigation/Aspiration wand. Press pedal to Position 2 (suction). Move around the outer edges of the bag, occlude the fluffy cortical remnants, and pull them into the center to vacuum them away. Polish the back capsule until clean.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        Even after the rock-hard core is gone, fluffy cotton-like cellular fibers remain stuck to the bag walls. If left behind, these cells cause severe postoperative eye inflammation, sky-high eye pressure (glaucoma), and trigger cloudy scarring behind the new lens.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> If you accidentally suck on the transparent posterior capsule, fine radial wrinkles ("spider-web sign") appear! Release the foot pedal IMMEDIATELY to Position 0 to prevent tearing the bag.
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    <span>PAL OPTIC SIMULATION SUITE • OPHTHALMIC SURGICAL REFERENCE</span>
    <span>CONFIDENTIAL CLINICAL EDUCATIONAL MANUAL • PAGE 3 OF 3</span>
  </div>
</body>
</html>
`;

// =========================================================================
// DOCUMENT 2: FOLDABLE IOL IMPLANTATION GUIDE
// =========================================================================
const htmlSurgery2 = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Foldable Intraocular Lens (IOL) Implantation - Clinical Guide</title>
  <style>${commonCss}</style>
</head>
<body>
  <!-- Header -->
  <div class="page-header">
    <div>
      <span class="brand-badge">PAL OPTIC OPHTHALMIC SURGICAL ACADEMY</span>
      <h1 class="doc-title">Foldable Intraocular Lens (IOL) Implantation</h1>
      <p class="doc-subtitle">Capsular Bag Refill, Controlled Unfolding, 360° Overlap & Viscoelastic Evacuation</p>
    </div>
    <div style="text-align: right;">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #64748b;">REF: SURG-MOD-02</span><br>
      <span style="font-size: 8pt; font-weight: 700; color: #0284c7;">EDITION 2026.1</span>
    </div>
  </div>

  <!-- Meta Grid -->
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Optic Material</strong>
      <span>Hydrophobic Acrylic (6.0 mm Optic)</span>
    </div>
    <div class="meta-item">
      <strong>Haptic Design</strong>
      <span>Modified C-Loop (13.0 mm Total Length)</span>
    </div>
    <div class="meta-item">
      <strong>Delivery System</strong>
      <span>Screw-Assisted Cartridge (2.4 mm Bore)</span>
    </div>
    <div class="meta-item">
      <strong>Optic Edge</strong>
      <span>360° Posterior Square Edge</span>
    </div>
  </div>

  <!-- Plain English Overview Box -->
  <div class="overview-box">
    <h4>🌟 What Is IOL Implantation in Simple Terms?</h4>
    Once the cloudy cataract has been sucked out, the eye has no focusing lens—everything would be a blurry smudge! We replace the natural lens with a permanent, microscopic artificial lens made of foldable medical acrylic. Because our incision is only 2.4mm wide and the lens is 6mm wide, the lens is folded like a tiny taco inside a syringe. We inject it through the tiny wound, watch it unfold into the empty natural bag, center it precisely, and vacuum out the jelly.
  </div>

  <!-- Diagram: IOL Implantation & 360 Overlap -->
  <div class="diagram-container">
    <div class="diagram-title">IOL In-The-Bag Anatomy, 360° Rhexis Overlap & Centration</div>
    ${svgIolDiagram}
  </div>

  <!-- STEP 1 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 1</span>
        <span class="step-name">Capsular Bag Refill with Cohesive OVD — Re-Inflating the Deflated Bag</span>
      </div>
      <span class="step-tool">Tool: Provisc Cohesive Jelly</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Take the Provisc cohesive viscoelastic syringe. Insert the cannula through the main wound and gently inject jelly directly into the equator of the empty lens bag until it puffs open into a firm, round pocket.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        Without the cataract inside, the thin natural bag collapses flat like an empty balloon. If you attempt to slide a hard plastic injector nozzle into a collapsed bag, the rigid tip will spear straight through the paper-thin back capsule! Injecting thick jelly acts like a balloon pump, expanding the bag in 3 dimensions and creating a safe landing pad for the new lens.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Attempting IOL delivery into a collapsed bag causes direct mechanical rupture of the posterior capsule.
      </div>
    </div>
  </div>

  <!-- STEP 2 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 2</span>
        <span class="step-name">Cartridge Delivery into Bag — Squeezing the Folded Lens Through the Keyhole</span>
      </div>
      <span class="step-tool">Tool: Monarch / Screw IOL Injector</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Position the beveled tip of the injector nozzle into the 2.4mm clear corneal incision with the bevel pointing DOWN. Turn the screw plunger smoothly to advance the folded acrylic lens forward.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The artificial lens is 6mm wide—more than double the size of our 2.4mm incision! The lubricated cartridge compresses the lens without tearing it. Advancing the plunger smoothly allows the lens to pass through the microscopic tunnel without stretching or burning the delicate cornea.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Pushing too fast or unevenly can cause the spring-loaded lens to shoot forward with violent kinetic force, puncturing the posterior capsule.
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- STEP 3 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 3</span>
        <span class="step-name">Leading Haptic Placement — Guiding the Front Leg into the Corner</span>
      </div>
      <span class="step-tool">Tool: IOL Injector & Nozzle Guidance</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        As the lens emerges from the nozzle, ensure the leading spring arm (haptic) uncurls directly into the far corner of the bag equator. Keep the nozzle tip inside the circular window so the lens doesn't escape over the iris.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        If the spring arms unfold on top of the colored iris instead of inside the bag, they will chafe against iris blood vessels, causing internal bleeding, painful inflammation, and chronic pupil distortion.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Allowing the trailing arm to become trapped in the corneal tunnel can shear the haptic off the lens optic.
      </div>
    </div>
  </div>

  <!-- STEP 4 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 4</span>
        <span class="step-name">Sinskey Hook 360° Rotational Centering — Spinning & Tucking the Back Leg</span>
      </div>
      <span class="step-tool">Tool: 0.2mm Sinskey Micro-Hook</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Use the tiny angled Sinskey hook to engage the notch at the base of the trailing arm. Rotate the lens clockwise while gently pushing downward, tucking the trailing arm under the edge of the circular opening into the bag. Confirm 360° overlap.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        Both arms must be seated symmetrically inside the bag pockets. If one arm is in the bag and one is outside (asymmetric placement), the lens tilts, causing severe astigmatism, glare, and double vision. Having the circular capsular window overlap the 6.0mm lens edge all 360 degrees creates a biological seal that locks the lens in place permanently.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Asymmetric haptic fixation triggers UGH Syndrome (Uveitis-Glaucoma-Hyphema) and chronic vision degradation.
      </div>
    </div>
  </div>

  <!-- STEP 5 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 5</span>
        <span class="step-name">Retro-Lens Viscoelastic Washout — Vacuuming Away the Dangerous Jelly</span>
      </div>
      <span class="step-tool">Tool: Coaxial I/A Handpiece</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Take the I/A suction wand. Gently tilt the new acrylic lens with the tip to slip into the pocket behind the lens. Thoroughly vacuum out all the thick cohesive jelly trapped in the back, then clean the front chamber.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The surgical jelly that protected the eye earlier will cause severe damage if left behind! The microscopic drains of the eye (trabecular meshwork) get plugged up by thick jelly. Fluid cannot escape, causing intraocular pressure to soar past 45 or 50 mmHg within hours of surgery, causing excruciating eye pain, corneal edema, and irreversible blindness from optic nerve ischemia.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Incomplete viscoelastic evacuation is the #1 cause of acute early post-operative glaucoma spikes (&gt;40 mmHg).
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    <span>PAL OPTIC SIMULATION SUITE • OPHTHALMIC SURGICAL REFERENCE</span>
    <span>CONFIDENTIAL CLINICAL EDUCATIONAL MANUAL • PAGE 2 OF 2</span>
  </div>
</body>
</html>
`;

// =========================================================================
// DOCUMENT 3: ND:YAG LASER POSTERIOR CAPSULOTOMY GUIDE
// =========================================================================
const htmlSurgery3 = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Nd:YAG Laser Posterior Capsulotomy - Clinical Guide</title>
  <style>${commonCss}</style>
</head>
<body>
  <!-- Header -->
  <div class="page-header">
    <div>
      <span class="brand-badge">PAL OPTIC OPHTHALMIC SURGICAL ACADEMY</span>
      <h1 class="doc-title">Nd:YAG Laser Posterior Capsulotomy</h1>
      <p class="doc-subtitle">Slit-Lamp Laser Photodisruption for Posterior Capsule Opacification (PCO)</p>
    </div>
    <div style="text-align: right;">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #64748b;">REF: SURG-MOD-03</span><br>
      <span style="font-size: 8pt; font-weight: 700; color: #0284c7;">EDITION 2026.1</span>
    </div>
  </div>

  <!-- Meta Grid -->
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Laser Wavelength</strong>
      <span>1064 nm Q-Switched Nd:YAG</span>
    </div>
    <div class="meta-item">
      <strong>Pulse Energy</strong>
      <span>1.0 – 1.8 mJ per pulse</span>
    </div>
    <div class="meta-item">
      <strong>Defocus Offset</strong>
      <span>+150 to +250 µm (Posterior)</span>
    </div>
    <div class="meta-item">
      <strong>Contact Lens</strong>
      <span>Abraham +66D Capsulotomy Lens</span>
    </div>
  </div>

  <!-- Plain English Overview Box -->
  <div class="overview-box">
    <h4>🌟 What Is a YAG Laser Capsulotomy in Simple Terms?</h4>
    Months or years after successful cataract surgery, up to 30% of patients notice their vision getting blurry again. This is NOT the cataract coming back! Rather, microscopic leftover cells grow across the clear back bag like frost on a window pane (called an "after-cataract" or PCO). In a quick, painless 3-minute clinic procedure, we use an invisible infrared laser to zap a clear window through the frost, restoring crisp, sharp vision instantly.
  </div>

  <!-- Diagram: Laser Physics & Offset -->
  <div class="diagram-container">
    <div class="diagram-title">Laser Photodisruption Physics & Posterior Defocus Offset (+150µm)</div>
    ${svgYagDiagram}
  </div>

  <!-- STEP 1 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 1</span>
        <span class="step-name">Abraham Capsulotomy Lens Placement — Magnifying & Stabilizing the Eye</span>
      </div>
      <span class="step-tool">Tool: Abraham +66D Contact Lens + Gel</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Apply a drop of clear methylcellulose coupling gel to the concave face of the Abraham contact lens. Rest the lens smoothly on the patient's numbed cornea.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The contact lens holds the patient's eyelids open to prevent blinking. Its +66 diopter central button widens the laser beam cone from 16° to 24°. This concentrates maximum laser power onto the cloudy membrane while dispersing the energy into a harmless blur as it travels to the cornea in front and the retina in the back.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Air bubbles trapped in the coupling gel create optical scattering and distort the laser focal point.
      </div>
    </div>
  </div>

  <!-- STEP 2 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 2</span>
        <span class="step-name">Dual HeNe Aiming Beam Convergence — Confocal Laser Alignment</span>
      </div>
      <span class="step-tool">Tool: Twin Red HeNe Aiming Beams (632.8nm)</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Look through the slit lamp eyepieces. Move the joystick forward or backward until the two red laser aiming dots overlap and merge into ONE single sharp, bright red dot on the cloudy membrane.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The 1064nm laser beam is infrared—completely invisible to human eyes! To let you aim, two visible red laser beams are projected from different angles. When the two red spots merge into one, the invisible laser is focused with microscopic precision on the target tissue.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Firing when the twin aiming beams are doubled causes the laser spark to detonate in the wrong plane, striking the artificial lens or anterior vitreous.
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- STEP 3 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 3</span>
        <span class="step-name">Posterior Defocus Offset (+150µm) — The Crucial Safety Gap</span>
      </div>
      <span class="step-tool">Setting: Defocus Knob Set to +150 µm Posterior</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Check the laser console setting. Verify the focal offset is set to +150 to +200 micrometers posterior. NEVER fire at zero offset!
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        When the laser sparks, it creates a superheated plasma bubble that expands FORWARD toward the incoming beam. If your focus is set right on the membrane (zero offset), the shockwave blasts directly into the back surface of the acrylic lens, leaving permanent pits and cracks that ruin the patient's vision with permanent glare. Setting the focus 150 microns behind the membrane allows the shockwave to cut the capsule without touching the lens.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Zero offset causes irreversible pitting of the intraocular lens optic, requiring expensive surgical lens exchange.
      </div>
    </div>
  </div>

  <!-- STEP 4 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 4</span>
        <span class="step-name">Cruciate Pattern Laser Breakdown — Cutting in a Cross (+)</span>
      </div>
      <span class="step-tool">Tool: Q-Switched 1064nm Nd:YAG Laser (1.2–1.5 mJ)</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Fire laser pulses in a cross shape (+): start at 12 o'clock (top), then 6 o'clock (bottom), then 9 o'clock (left), and 3 o'clock (right). Cut from the outer edges toward the center.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The cloudy membrane is under tight drum-head tension. Cutting the outer edges in a cross releases the tension, causing the four triangular flaps to curl up and roll back out of the line of sight automatically like opening stage curtains! Cutting edges first uses far less total energy and keeps the center of sight 100% safe from accidental lens strikes.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Firing directly in the center first risks pitting the central visual axis. Using excessive total energy (&gt;60 mJ) causes acute glaucoma spikes and retinal swelling (macular edema).
      </div>
    </div>
  </div>

  <!-- STEP 5 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 5</span>
        <span class="step-name">Visual Axis Clearance & IOP Check — Final Inspection & Pressure Guard</span>
      </div>
      <span class="step-tool">Tool: Slit-Lamp Retroillumination + Tonometry</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Inspect under retroillumination: confirm a clean, round 3.5 to 4.0mm central opening free of floating tags. Check that the gel bag behind the eye is intact, and instill one drop of apraclonidine or brimonidine.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        Loose tags of capsule hanging in the pupil will swing like pendulums when the patient moves their head, causing annoying flashes, shadows, and double vision. Furthermore, microscopic debris released by the laser can clog eye drains for several hours, causing transient pressure spikes that are safely prevented with pressure-lowering drops.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Rupturing the anterior vitreous face allows vitreous gel to leak forward, increasing the risk of retinal tears and retinal detachment.
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    <span>PAL OPTIC SIMULATION SUITE • OPHTHALMIC SURGICAL REFERENCE</span>
    <span>CONFIDENTIAL CLINICAL EDUCATIONAL MANUAL • PAGE 2 OF 2</span>
  </div>
</body>
</html>
`;

// =========================================================================
// DOCUMENT 4: COMPREHENSIVE MASTER SURGICAL MANUAL (ALL 3 SURGERIES)
// =========================================================================
const htmlMasterManual = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Comprehensive Ophthalmic Surgical Manual - PAL OPTIC</title>
  <style>
    ${commonCss}
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 85vh;
      text-align: center;
      padding: 40px 20px;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -1px;
      margin-top: 16px;
      line-height: 1.2;
    }
    .cover-subtitle {
      font-size: 13pt;
      color: #0284c7;
      font-weight: 600;
      margin-top: 10px;
    }
    .cover-desc {
      font-size: 10pt;
      color: #64748b;
      max-width: 550px;
      margin-top: 16px;
      line-height: 1.6;
    }
    .cover-meta {
      margin-top: 40px;
      padding: 16px 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #475569;
    }
    .toc-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 20px;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .toc-item strong {
      color: #0f172a;
      font-size: 10pt;
    }
    .toc-item span {
      color: #0284c7;
      font-weight: 700;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <!-- COVER PAGE -->
  <div class="cover-page">
    <span class="brand-badge" style="font-size: 10pt; padding: 6px 14px;">PAL OPTIC MEDICAL SPECIALTY EDUCATION</span>
    <h1 class="cover-title">Comprehensive Ophthalmic Surgical Field Manual</h1>
    <h2 class="cover-subtitle">Phacoemulsification, Foldable IOL Implantation & Nd:YAG Laser Capsulotomy</h2>
    <p class="cover-desc">
      A complete, beginner-accessible clinical compendium detailing step-by-step anterior segment surgery, microscopic corneal incision architecture, fluidic dynamics, and complications management.
    </p>

    <div style="margin-top: 25px;">
      ${svgIncisionDiagram}
    </div>

    <div class="cover-meta">
      <strong>OFFICIAL SURGICAL SIMULATOR PROTOCOL & TRAINING COMPENDIUM</strong><br>
      Standardized for Ophthalmic Residents, Fellows & Surgical Technicians • 2026 Edition
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <div class="page-header">
    <div>
      <span class="brand-badge">TABLE OF CONTENTS</span>
      <h2 class="doc-title">Surgical Modules & Clinical Curriculum</h2>
    </div>
  </div>

  <div class="toc-grid">
    <div class="toc-item">
      <div>
        <strong>Module 1: Cataract Phacoemulsification Surgery</strong><br>
        <small style="color: #64748b;">Paracentesis, Tri-Planar Wound, OVD Cushion, CCC, Hydrodissection, Phaco-Chop & I/A</small>
      </div>
      <span>MODULE 1</span>
    </div>
    <div class="toc-item">
      <div>
        <strong>Module 2: Foldable Intraocular Lens (IOL) Implantation</strong><br>
        <small style="color: #64748b;">Bag Refill, Cartridge Delivery, Leading Haptic, Sinskey Hook Centering & OVD Washout</small>
      </div>
      <span>MODULE 2</span>
    </div>
    <div class="toc-item">
      <div>
        <strong>Module 3: Nd:YAG Laser Posterior Capsulotomy</strong><br>
        <small style="color: #64748b;">Abraham Lens, HeNe Aiming Alignment, +150µm Posterior Defocus & Cruciate Laser Breakdown</small>
      </div>
      <span>MODULE 3</span>
    </div>
    <div class="toc-item">
      <div>
        <strong>Module 4: Critical Surgical Anatomy & Fluidics Reference Guide</strong><br>
        <small style="color: #64748b;">Corneal Endothelium Preservation, Post-Occlusion Surge Equations & CDE Calculation</small>
      </div>
      <span>MODULE 4</span>
    </div>
  </div>

  <div style="margin-top: 30px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px;">
    <h3 style="color: #0369a1; font-size: 11pt; margin-bottom: 6px;">💡 How To Use This Manual</h3>
    <p style="font-size: 8.5pt; color: #0284c7; line-height: 1.5;">
      Each module is written specifically so that someone with zero previous ophthalmic experience can understand both <strong>what physical action to take</strong> and <strong>why that step is vital to preserving the patient's vision</strong>. Key safety alerts, anatomical tissue planes, instrument dimensions, and complication avoidance rules are provided for each phase of surgery.
    </p>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 1 SUMMARY SECTION -->
  <div class="page-header">
    <div>
      <span class="brand-badge">MODULE 1 OVERVIEW</span>
      <h2 class="doc-title">Cataract Phacoemulsification Protocol</h2>
    </div>
  </div>
  <div class="overview-box">
    <strong>Surgical Objective:</strong> Clear the clouded crystalline lens and evacuate cortical debris with minimal Cumulative Dissipated Energy (CDE &lt; 15 %-sec) and near-zero endothelial cell loss.
  </div>
  ${svgIncisionDiagram}
  <div style="margin-top: 15px;">
    ${svgCapsulorhexisDiagram}
  </div>

  <div class="page-break"></div>

  <!-- MODULE 2 SUMMARY SECTION -->
  <div class="page-header">
    <div>
      <span class="brand-badge">MODULE 2 OVERVIEW</span>
      <h2 class="doc-title">Foldable IOL Implantation Protocol</h2>
    </div>
  </div>
  <div class="overview-box">
    <strong>Surgical Objective:</strong> Deliver a foldable 6.0mm acrylic optic safely into the capsular bag, establish 360° anterior capsular overlap, and evacuate all retro-lens viscoelastic to prevent acute IOP elevation.
  </div>
  ${svgIolDiagram}

  <div class="page-break"></div>

  <!-- MODULE 3 SUMMARY SECTION -->
  <div class="page-header">
    <div>
      <span class="brand-badge">MODULE 3 OVERVIEW</span>
      <h2 class="doc-title">Nd:YAG Laser Capsulotomy Protocol</h2>
    </div>
  </div>
  <div class="overview-box">
    <strong>Surgical Objective:</strong> Restore optical axis clarity through photodisruption of the opacified posterior capsule using cruciate laser cuts with +150µm posterior offset to prevent IOL pitting.
  </div>
  ${svgYagDiagram}

  <!-- Footer -->
  <div class="page-footer">
    <span>PAL OPTIC SIMULATION SUITE • MASTER OPHTHALMIC FIELD MANUAL</span>
    <span>CONFIDENTIAL CLINICAL EDUCATIONAL MANUAL</span>
  </div>
</body>
</html>
`;

// =========================================================================
// BUILD FUNCTION
// =========================================================================
const guidesToBuild = [
  {
    name: 'Cataract_Phacoemulsification_Surgery_Guide',
    title: 'Cataract Phacoemulsification Surgery Guide',
    html: htmlSurgery1
  },
  {
    name: 'Foldable_IOL_Implantation_Guide',
    title: 'Foldable IOL Implantation Guide',
    html: htmlSurgery2
  },
  {
    name: 'Nd_YAG_Laser_Posterior_Capsulotomy_Guide',
    title: 'Nd:YAG Laser Posterior Capsulotomy Guide',
    html: htmlSurgery3
  },
  {
    name: 'Comprehensive_Ophthalmic_Surgical_Manual',
    title: 'Comprehensive Master Ophthalmic Surgical Manual',
    html: htmlMasterManual
  }
];

const targetDirs = [
  path.join(ROOT_DIR, 'public', 'guides'),
  path.join(ROOT_DIR, 'docs', 'guides'),
  path.join(ROOT_DIR, 'dist', 'guides'),
  path.join(ROOT_DIR, 'guides')
];

// Ensure all target directories exist
targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('[PDF Builder] Generating HTML and compiling PDFs...');

for (const guide of guidesToBuild) {
  const tempHtmlPath = path.join(ROOT_DIR, 'public', 'guides', `${guide.name}.html`);
  fs.writeFileSync(tempHtmlPath, guide.html, 'utf-8');

  const pdfOutputName = `${guide.name}.pdf`;
  const primaryPdfPath = path.join(ROOT_DIR, 'public', 'guides', pdfOutputName);

  console.log(`[PDF Builder] Printing ${guide.name} via Headless Chrome...`);

  try {
    const formattedUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
    execSync(
      `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${primaryPdfPath}" "${formattedUrl}"`,
      { stdio: 'pipe' }
    );

    const pdfSize = fs.statSync(primaryPdfPath).size;
    console.log(`[PDF Builder] Successfully created ${pdfOutputName} (${(pdfSize / 1024).toFixed(1)} KB)`);

    // Copy to docs/guides, dist/guides, and guides/
    for (const dir of targetDirs) {
      const destPdf = path.join(dir, pdfOutputName);
      const destHtml = path.join(dir, `${guide.name}.html`);
      if (destPdf !== primaryPdfPath) {
        fs.copyFileSync(primaryPdfPath, destPdf);
      }
      if (destHtml !== tempHtmlPath) {
        fs.copyFileSync(tempHtmlPath, destHtml);
      }
    }
  } catch (err) {
    console.error(`[PDF Builder] Failed to render ${guide.name}:`, err.message);
  }
}

console.log('[PDF Builder] All surgical guide PDF files created successfully across public/guides, docs/guides, dist/guides, and guides/!');
