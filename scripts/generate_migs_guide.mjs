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

console.log('[MIGS PDF Builder] Using Headless Browser:', browserPath);

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
    border-bottom: 2px solid #059669;
    padding-bottom: 8px;
    margin-bottom: 14px;
  }

  .brand-badge {
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #059669;
    background: #d1fae5;
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .guide-series {
    font-size: 8pt;
    color: #64748b;
    font-family: 'JetBrains Mono', monospace;
  }

  .hero-title {
    font-size: 20pt;
    font-weight: 900;
    color: #064e3b;
    line-height: 1.15;
    margin-bottom: 4px;
  }

  .hero-subtitle {
    font-size: 10pt;
    color: #047857;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .overview-box {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 14px;
    font-size: 9.5pt;
    color: #064e3b;
    line-height: 1.5;
  }

  .overview-box h4 {
    font-size: 10pt;
    font-weight: 800;
    color: #065f46;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .diagram-container {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    text-align: center;
  }

  .diagram-title {
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #475569;
    margin-bottom: 8px;
  }

  .step-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 12px;
    background: #ffffff;
    overflow: hidden;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .step-header {
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    padding: 6px 12px;
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
    background: #059669;
    color: white;
    font-weight: 800;
    font-size: 8pt;
    padding: 2px 7px;
    border-radius: 4px;
  }

  .step-name {
    font-weight: 800;
    font-size: 10pt;
    color: #0f172a;
  }

  .step-tool {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    color: #047857;
    font-weight: 600;
    background: #d1fae5;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #a7f3d0;
  }

  .step-body {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 9pt;
  }

  .action-banner {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 7px 10px;
    color: #14532d;
  }

  .why-box {
    background: #f8fafc;
    border-left: 3px solid #0284c7;
    padding: 6px 10px;
    color: #334155;
    font-size: 8.8pt;
  }

  .hazard-box {
    background: #fef2f2;
    border-left: 3px solid #ef4444;
    padding: 5px 10px;
    color: #991b1b;
    font-size: 8.5pt;
  }

  .goldmann-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 6px;
    color: #1e3a8a;
    font-size: 8.8pt;
  }

  .goldmann-box strong {
    color: #1d4ed8;
  }

  .page-footer {
    margin-top: 14px;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }

  .page-break {
    page-break-before: always;
  }
`;

const svgMigsAngleDiagram = `
<svg viewBox="0 0 760 250" width="100%" height="210" style="max-height: 220px; display: block; margin: 0 auto;">
  <defs>
    <linearGradient id="corneaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="irisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <linearGradient id="tmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="schlemmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
    <linearGradient id="stentMetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="40%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect x="0" y="0" width="760" height="250" fill="#0b1329" rx="8"/>

  <!-- Gonioprism Optical Frame -->
  <circle cx="380" cy="125" r="115" fill="#0f172a" stroke="#059669" stroke-width="2"/>
  <circle cx="380" cy="125" r="105" fill="none" stroke="#334155" stroke-dasharray="4,4"/>

  <!-- Angle Anatomy Landmarks in Gonioscopy -->
  <!-- 1. Schwalbe's Line (White prominent ring) -->
  <path d="M 285 55 Q 380 40 475 55" fill="none" stroke="#ffffff" stroke-width="5"/>
  <text x="490" y="55" fill="#ffffff" font-size="10" font-weight="700" font-family="Inter">1. Schwalbe's Line (Descemet termination)</text>

  <!-- 2. Non-Pigmented TM (Light yellow-white zone) -->
  <path d="M 285 70 Q 380 55 475 70" fill="none" stroke="#fef08a" stroke-width="7" opacity="0.8"/>
  <text x="490" y="72" fill="#fef08a" font-size="10" font-weight="600" font-family="Inter">2. Non-Pigmented TM (Pre-filtration band)</text>

  <!-- 3. Pigmented Trabecular Meshwork (Golden-brown filtration mesh) -->
  <path d="M 283 90 Q 380 75 477 90" fill="none" stroke="#b45309" stroke-width="12"/>
  <text x="490" y="93" fill="#f59e0b" font-size="10" font-weight="800" font-family="Inter">3. Pigmented TM (Filtration Target)</text>

  <!-- Schlemm's Canal underneath TM -->
  <path d="M 295 87 Q 380 77 465 87" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="3,3" opacity="0.9"/>
  <text x="490" y="108" fill="#f87171" font-size="9" font-family="JetBrains Mono">↳ Schlemm's Canal (Direct to Bloodstream)</text>

  <!-- 4. Scleral Spur (Bright white reflective band) -->
  <path d="M 282 110 Q 380 95 478 110" fill="none" stroke="#e2e8f0" stroke-width="6"/>
  <text x="490" y="125" fill="#cbd5e1" font-size="10" font-weight="600" font-family="Inter">4. Scleral Spur (White landmark)</text>

  <!-- 5. Ciliary Body Band & Iris Root -->
  <path d="M 280 135 Q 380 120 480 135" fill="none" stroke="#334155" stroke-width="14"/>
  <text x="490" y="142" fill="#94a3b8" font-size="10" font-family="Inter">5. Ciliary Body Band (Dark grey/brown)</text>

  <!-- Iris Root & Stroma -->
  <path d="M 270 170 Q 380 155 490 170 L 490 220 Q 380 205 270 220 Z" fill="url(#irisGrad)"/>
  <text x="490" y="185" fill="#d97706" font-size="10" font-weight="700" font-family="Inter">Iris Stroma & Pupillary Margin</text>

  <!-- Implanted Micro-Stent 1 at 2:30 o'clock -->
  <g transform="translate(345, 83) rotate(-18)">
    <rect x="-4" y="-8" width="8" height="16" rx="2" fill="url(#stentMetal)" stroke="#38bdf8" stroke-width="1.5"/>
    <circle cx="0" cy="-6" r="2" fill="#0284c7"/>
    <circle cx="0" cy="0" r="1.5" fill="#f87171"/>
    <!-- Aqueous outflow jet -->
    <path d="M 0 -8 L 0 -16" stroke="#38bdf8" stroke-width="2" stroke-dasharray="2,2"/>
  </g>
  <text x="210" y="75" fill="#38bdf8" font-size="10" font-weight="800" font-family="JetBrains Mono">Stent 1 (2:30)</text>

  <!-- Implanted Micro-Stent 2 at 4:00 o'clock -->
  <g transform="translate(425, 87) rotate(22)">
    <rect x="-4" y="-8" width="8" height="16" rx="2" fill="url(#stentMetal)" stroke="#38bdf8" stroke-width="1.5"/>
    <circle cx="0" cy="-6" r="2" fill="#0284c7"/>
    <circle cx="0" cy="0" r="1.5" fill="#f87171"/>
    <path d="M 0 -8 L 0 -16" stroke="#38bdf8" stroke-width="2" stroke-dasharray="2,2"/>
  </g>
  <text x="440" y="75" fill="#38bdf8" font-size="10" font-weight="800" font-family="JetBrains Mono">Stent 2 (4:00)</text>

  <!-- Episcleral Venous Blood Reflux Wave -->
  <circle cx="345" cy="80" r="7" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.8"/>
  <circle cx="425" cy="84" r="7" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.8"/>
  <text x="380" y="235" text-anchor="middle" fill="#10b981" font-size="11" font-weight="800" font-family="Inter">
    🛡️ EPISCLERAL VENOUS BACK-PRESSURE FLOOR: 8.0 - 10.0 mmHg (Zero Risk of Hypotony)
  </text>
</svg>
`;

const htmlMigsGuide = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MIGS: Trabecular Micro-Bypass Stent Surgery Manual</title>
  <style>${commonCss}</style>
</head>
<body>

  <!-- PAGE 1: CLINICAL RATIONALE, ANATOMY, AND STEPS 1 - 3 -->
  <div class="page-header">
    <div class="brand-badge">OPHTHALMIC SURGICAL MANUAL • SURGERY 3</div>
    <div class="guide-series">PAL-OPTIC MIGS-GLAUCOMA-GUIDE-V2</div>
  </div>

  <h1 class="hero-title">MIGS: Trabecular Micro-Bypass Stent Surgery</h1>
  <div class="hero-subtitle">Direct-to-Bloodstream Canalicular Drainage & Physiological 8–10 mmHg Back-Pressure Floor</div>

  <!-- Plain English Overview Box -->
  <div class="overview-box">
    <h4>🌟 What Is a Trabecular Micro-Bypass Stent in Simple Terms?</h4>
    In open-angle glaucoma, the eye's natural drainage filter—called the <strong>trabecular meshwork</strong>—becomes clogged with microscopic debris, raising intraocular pressure (IOP) to 30+ mmHg and crushing the optic nerve fibers.
    Instead of cutting open the outside of the eye (like risky older surgeries), we insert microscopic titanium snouts (stents) through the clogged filter directly into <strong>Schlemm's canal</strong> and collector veins.
    Because Schlemm's canal empties directly into the venous bloodstream, the venous blood establishes a rigid <strong>8 to 10 mmHg backpressure floor</strong>. The eye's pressure can never drop below 8 mmHg, preventing flat anterior chambers and dangerous low pressure (hypotony)!
  </div>

  <!-- Diagram: Gonioscopic Angle & Stents -->
  <div class="diagram-container">
    <div class="diagram-title">Direct Gonioscopic Anatomy, Trabecular Landmarks & Dual Titanium Stent Placements</div>
    ${svgMigsAngleDiagram}
  </div>

  <!-- STEP 1 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 1</span>
        <span class="step-name">Microscope (38°) & Patient Head Tilt (35°) — Overcoming Total Internal Reflection</span>
      </div>
      <span class="step-tool">Tool: Zeiss OPMI Lumera Goniometric Arm</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Tilt the operating microscope 35° to 40° toward yourself, and rotate the patient's head 30° to 35° away from you. This creates a combined ~70° optical angle of incidence.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        Light rays coming from the drainage angle hit the curved cornea at an angle greater than 46° (the critical angle), causing <em>total internal reflection</em>. Without tilting both the microscope and the patient's head, the drainage angle is 100% invisible—the cornea reflects light like a mirror!
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Attempting to insert instruments blindly without goniometric tilt leads to iris shredding or lens capsule rupture.
      </div>
    </div>
  </div>

  <!-- STEP 2 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 2</span>
        <span class="step-name">Direct Surgical Gonioprism Placement — Creating the Optical Viewport</span>
      </div>
      <span class="step-tool">Tool: Swan-Jacob Direct Gonioprism</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Apply a generous drop of viscoelastic onto the concave contact surface of the Swan-Jacob prism. Place it gently onto the temporal cornea without pressing down hard.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The gonioprism neutralizes corneal curvature. Viscoelastic serves as an optical coupling agent, eliminating air bubbles and allowing light to pass directly into the surgeon's eyepieces.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Pushing too hard on the cornea creates corneal folds (Descemet wrinkles) that distort angle visualization.
      </div>
    </div>
  </div>

  <!-- STEP 3 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 3</span>
        <span class="step-name">Cohesive OVD Angle Deepening — Opening the Drainage Runway</span>
      </div>
      <span class="step-tool">Tool: Provisc 10mg/mL Cohesive Cannula</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Introduce the blunt cannula across the anterior chamber to the nasal angle. Inject 0.3 mL of cohesive jelly directly over the iris root to gently push the iris backward.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        In eyes with high pressure, the peripheral iris bows forward, crowding the trabecular meshwork. Viscoelastic creates a 1.5mm wide open canyon, exposing the golden-brown filtration band so the stent injector has clear passage without snagging iris tissue.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Failing to deepen the angle risks snagging iris blood vessels, causing a massive hyphema (bleeding).
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>PAL-OPTIC OPHTHALMOLOGY TRAINING SYSTEMS</span>
    <span>MIGS TRAIN-PAGE 1 OF 2</span>
    <span>CONFIDENTIAL & CLINICAL REFERENCE</span>
  </div>

  <!-- PAGE BREAK -->
  <div class="page-break"></div>

  <!-- PAGE 2: STEPS 4 - 6 & GOLDMANN HEMODYNAMICS -->
  <div class="page-header">
    <div class="brand-badge">OPHTHALMIC SURGICAL MANUAL • SURGERY 3</div>
    <div class="guide-series">PAL-OPTIC MIGS-GLAUCOMA-GUIDE-V2</div>
  </div>

  <!-- STEP 4 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 4</span>
        <span class="step-name">Micro-Stent 1 Insertion (2:30 o'clock) — Direct Bypass into Schlemm's Canal</span>
      </div>
      <span class="step-tool">Tool: Multi-Dose Stent Injector (iStent inject W)</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Under high gonioscopic magnification, advance the injector tip across the pupil to the nasal angle at the 2:30 o'clock position. Approach the pigmented trabecular meshwork at a 15° to 20° angle. Gently press the trocar until the sleeve touches the TM, then depress the delivery button to deploy the first titanium stent.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The stent's 360-micron pointed head penetrates the resistance-heavy trabecular meshwork, seating its intake lumen directly inside Schlemm's canal while its wide flange rests safely in the anterior chamber. Fluid can now bypass the blocked filter completely.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Entering too posterior penetrates the scleral spur or ciliary body, causing severe pain and suprachoroidal hemorrhage.
      </div>
    </div>
  </div>

  <!-- STEP 5 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 5</span>
        <span class="step-name">Micro-Stent 2 Insertion (4:00 o'clock) — Dual Stent Circumferential Outflow</span>
      </div>
      <span class="step-tool">Tool: Multi-Dose Stent Injector (Second Stent)</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Retract the inserter tip slightly, pivot the trocar 2 to 3 clock hours inferiorly to the 4:00 o'clock position, and deploy the second micro-stent into the pigmented TM.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        A single stent accesses only ~60° of Schlemm's canal. Deploying two stents separated by 2 to 3 clock hours recruits collector channels across the entire inferior-nasal quadrant, doubling outflow facility from 0.08 to >0.26 µL/min/mmHg and ensuring durable pressure reduction.
      </div>
      <div class="hazard-box">
        <strong>⚠️ Critical Hazard:</strong> Placing stents too close together (<1 clock hour) taps the same collector channel and provides zero additional pressure drop.
      </div>
    </div>
  </div>

  <!-- STEP 6 -->
  <div class="step-card">
    <div class="step-header">
      <div class="step-title-wrap">
        <span class="step-num">STEP 6</span>
        <span class="step-name">Episcleral Blood Reflux Wave & OVD Washout — Confirming Venous Communication</span>
      </div>
      <span class="step-tool">Tool: Bimanual I/A Handpiece</span>
    </div>
    <div class="step-body">
      <div class="action-banner">
        <strong>👉 What To Do Right Now:</strong>
        Briefly decompress the anterior chamber by depressing the posterior lip of the wound or activating foot pedal position 2 (aspiration). Watch closely through the gonioprism: a crimson plume of venous blood will flow backward out of the stent lumen into the eye. Then, perform gentle irrigation/aspiration to wash out all viscoelastic.
      </div>
      <div class="why-box">
        <strong>💡 Why This Step Is Strictly Necessary:</strong>
        The blood reflux wave is the gold standard clinical proof that the stent is patent and connected directly to the episcleral venous bloodstream! When AC pressure is lowered below 8.5 mmHg, blood naturally rushes backward. Thorough viscoelastic washout prevents acute postoperative IOP spikes (>40 mmHg).
      </div>
      <div class="goldmann-box">
        <strong>📊 The Goldmann Equation & The 8–10 mmHg Back-Pressure Floor:</strong><br>
        <code>IOP = (F - U) / C + EVP</code><br>
        • <strong>F</strong> (Aqueous production) = 2.4 µL/min | <strong>U</strong> (Uveoscleral outflow) = 0.35 µL/min<br>
        • <strong>C</strong> (Outflow facility) increases from <strong>0.075</strong> (diseased) to <strong>0.28 µL/min/mmHg</strong> (post-stent)<br>
        • <strong>EVP (Episcleral Venous Pressure) = 8.5 mmHg</strong> (Physiological bloodstream floor)<br>
        <em>Because the stents drain directly into veins, IOP can NEVER drop below EVP (8.5 mmHg), entirely eliminating the risk of hypotony!</em>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>PAL-OPTIC OPHTHALMOLOGY TRAINING SYSTEMS</span>
    <span>MIGS TRAIN-PAGE 2 OF 2</span>
    <span>CONFIDENTIAL & CLINICAL REFERENCE</span>
  </div>

</body>
</html>
`;

const targetDirs = [
  path.join(ROOT_DIR, 'public', 'guides'),
  path.join(ROOT_DIR, 'docs', 'guides'),
  path.join(ROOT_DIR, 'dist', 'guides'),
  path.join(ROOT_DIR, 'guides')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('[MIGS PDF Builder] Writing HTML file...');
const tempHtmlPath = path.join(ROOT_DIR, 'public', 'guides', 'MIGS_Trabecular_Micro_Stent_Glaucoma_Guide.html');
fs.writeFileSync(tempHtmlPath, htmlMigsGuide, 'utf-8');

const pdfOutputName = 'MIGS_Trabecular_Micro_Stent_Glaucoma_Guide.pdf';
const primaryPdfPath = path.join(ROOT_DIR, 'public', 'guides', pdfOutputName);

console.log(`[MIGS PDF Builder] Printing ${pdfOutputName} via Headless Chrome...`);

try {
  const formattedUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
  execSync(
    `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${primaryPdfPath}" "${formattedUrl}"`,
    { stdio: 'pipe' }
  );

  const pdfSize = fs.statSync(primaryPdfPath).size;
  console.log(`[MIGS PDF Builder] Successfully created ${pdfOutputName} (${(pdfSize / 1024).toFixed(1)} KB)`);

  for (const dir of targetDirs) {
    const destPdf = path.join(dir, pdfOutputName);
    const destHtml = path.join(dir, 'MIGS_Trabecular_Micro_Stent_Glaucoma_Guide.html');
    if (destPdf !== primaryPdfPath) {
      fs.copyFileSync(primaryPdfPath, destPdf);
    }
    if (destHtml !== tempHtmlPath) {
      fs.copyFileSync(tempHtmlPath, destHtml);
    }
  }
  console.log('[MIGS PDF Builder] Successfully deployed MIGS guide across public, docs, dist, and guides!');
} catch (err) {
  console.error('[MIGS PDF Builder] Failed to render PDF:', err.message);
}
