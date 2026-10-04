const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { SURGICAL_INSTRUCTIONS } = require('../.build-ts/data/surgicalInstructions.js');
const { STEP_VOICEOVER_MAP } = require('../.build-ts/audio/TtsNarrator.js');

const rootDir = path.resolve(__dirname, '..');
const outputHtmlPath = path.join(rootDir, 'SURGICAL_SIMULATION_VOICE_SCRIPTS.html');
const outputPdfPath = path.join(rootDir, 'SURGICAL_SIMULATION_VOICE_SCRIPTS.pdf');
const outputTxtPath = path.join(rootDir, 'SURGICAL_SIMULATION_VOICE_SCRIPTS.txt');
const outputJsonPath = path.join(rootDir, 'SURGICAL_SIMULATION_VOICE_SCRIPTS.json');

// Group steps by procedure
const procedures = [
  {
    code: 'phaco_iol',
    title: 'Procedure 1: Cataract Phacoemulsification & Foldable IOL',
    moduleBadge: 'CATARACT & IOL',
    steps: Object.values(SURGICAL_INSTRUCTIONS).filter(s => s.module === 'phaco' || s.module === 'iol'),
    filenamePrefix: 'cataract_'
  },
  {
    code: 'yag',
    title: 'Procedure 2: Nd:YAG Laser Photodisruption Capsulotomy',
    moduleBadge: 'Nd:YAG LASER',
    steps: Object.values(SURGICAL_INSTRUCTIONS).filter(s => s.module === 'yag'),
    filenamePrefix: 'yag_'
  },
  {
    code: 'migs',
    title: 'Procedure 3: MIGS Glaucoma Trabecular Micro-Bypass Stents',
    moduleBadge: 'MIGS GLAUCOMA',
    steps: Object.values(SURGICAL_INSTRUCTIONS).filter(s => s.module === 'migs'),
    filenamePrefix: 'migs_'
  }
];

// Generate JSON export
const jsonExport = [];
let fullText = 'PAL OPTIC - EYE SURGERY SIMULATION\nMASTER SPOKEN VOICEOVER SCRIPTS\n' + '='.repeat(60) + '\n\n';

procedures.forEach(proc => {
  fullText += `\n${'#'.repeat(60)}\n${proc.title.toUpperCase()}\n${'#'.repeat(60)}\n\n`;
  proc.steps.forEach(step => {
    const paddedNum = String(step.stepNumber).padStart(2, '0');
    const mp3Name = STEP_VOICEOVER_MAP[step.id] || `${proc.filenamePrefix}${paddedNum}.mp3`;
    const words = step.spokenScript.trim().split(/\s+/).length;
    const estDurationSec = Math.round((words / 135) * 60);

    jsonExport.push({
      procedure: proc.title,
      module: step.module,
      stepNumber: step.stepNumber,
      stepId: step.id,
      suggestedFilename: mp3Name,
      title: step.title,
      beginnerTitle: step.beginnerTitle,
      wordCount: words,
      estDurationSec,
      spokenScript: step.spokenScript,
      actionCallout: step.actionCallout,
      whyItsNecessary: step.whyItsNecessary,
      recommendedInstrument: step.recommendedInstrument
    });

    fullText += `[FILE: ${mp3Name}] (Step ${step.stepNumber} - ${step.title})\n`;
    fullText += `SCRIPT: "${step.spokenScript}"\n\n`;
  });
});

fs.writeFileSync(outputJsonPath, JSON.stringify(jsonExport, null, 2), 'utf8');
fs.writeFileSync(outputTxtPath, fullText, 'utf8');

// Generate Beautiful HTML for PDF Rendering
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Surgical Simulation Spoken Voice Scripts - Pal Optic</title>
  <style>
    @page {
      size: letter;
      margin: 16mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 11pt;
    }

    .cover-header {
      border-bottom: 3px solid #059669;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }

    .badge-top {
      display: inline-block;
      background: #064e3b;
      color: #34d399;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 22pt;
      margin: 0 0 6px 0;
      color: #064e3b;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 12pt;
      color: #475569;
      margin: 0;
      font-weight: 500;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 22px;
      font-size: 9.5pt;
      color: #334155;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .meta-item strong {
      display: block;
      color: #0f172a;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .section-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      background: #ecfdf5;
      border-left: 5px solid #059669;
      padding: 8px 12px;
      margin-top: 26px;
      margin-bottom: 16px;
      page-break-after: avoid;
    }

    .step-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 16px;
      background: #ffffff;
      overflow: hidden;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .step-header {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .step-title-area {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-badge {
      background: #0f172a;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      font-size: 8pt;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .step-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
    }

    .file-chip {
      background: #0284c7;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .step-body {
      padding: 12px 14px;
    }

    .spoken-script-label {
      font-size: 8pt;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #059669;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .spoken-script-box {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 11.5pt;
      line-height: 1.55;
      color: #064e3b;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 9pt;
      color: #475569;
      border-top: 1px dashed #e2e8f0;
      padding-top: 8px;
    }

    .info-item strong {
      color: #1e293b;
    }

    .pronunciation-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 9pt;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .pronunciation-box strong {
      color: #b45309;
      display: block;
      margin-bottom: 4px;
      font-size: 9.5pt;
    }

    .table-summary {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    .table-summary th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 8.5pt;
    }

    .table-summary td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    .table-summary tr:nth-child(even) {
      background: #f8fafc;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="cover-header">
    <div class="badge-top">PAL OPTIC • OPHTHALMIC SIMULATION SUITE</div>
    <h1>Master Spoken Voiceover Narration Script</h1>
    <div class="subtitle">Complete Voice Lines for Text-to-Speech (TTS) & Studio Voiceover Production</div>
  </div>

  <!-- Meta details -->
  <div class="meta-box">
    <div class="meta-grid">
      <div class="meta-item">
        <strong>Total Audio Clips</strong>
        23 Surgical Step Voiceover Tracks
      </div>
      <div class="meta-item">
        <strong>Target Audio Format</strong>
        MP3 (44.1 kHz / 48 kHz, Stereo or Mono, 192–320 kbps)
      </div>
      <div class="meta-item">
        <strong>Voice Persona / Tone</strong>
        Preceptor Surgeon (Calm, authoritative, clear, 130–145 wpm)
      </div>
    </div>
  </div>

  <!-- Medical Pronunciation Guide -->
  <div class="pronunciation-box">
    <strong>🎙️ Medical Pronunciation & TTS Direction Guide:</strong>
    <div>• <strong>Phacoemulsification</strong>: <em>FAY-co-ee-mul-sih-fih-KAY-shun</em> (shortened to <em>FAY-co</em>)</div>
    <div>• <strong>Paracentesis</strong>: <em>pair-uh-sen-TEE-sis</em> (small side-port corneal entry)</div>
    <div>• <strong>Capsulorhexis (CCC)</strong>: <em>cap-syoo-lo-REK-sis</em> (continuous circular tear of lens capsule)</div>
    <div>• <strong>Viscoelastic (OVD)</strong>: <em>vis-co-ee-LAS-tik</em> (clear protective jelly: <em>VIS-coat</em> / <em>PRO-visk</em>)</div>
    <div>• <strong>Nd:YAG Laser</strong>: <em>EN-dee YAG</em> (Neodymium-doped Yttrium Aluminum Garnet)</div>
    <div>• <strong>He-Ne Beams</strong>: <em>HEE-nee</em> (Helium-Neon red aiming laser)</div>
    <div>• <strong>MIGS</strong>: <em>MIGZ</em> (Minimally Invasive Glaucoma Surgery)</div>
    <div>• <strong>Trabecular Meshwork</strong>: <em>truh-BEK-yoo-ler MESH-werk</em></div>
    <div>• <strong>Schlemm's Canal</strong>: <em>SHLEMZ kuh-NAL</em></div>
    <div>• <strong>Schwalbe's Line</strong>: <em>SHVAL-bays line</em></div>
  </div>

  <!-- Quick Reference Table -->
  <table class="table-summary">
    <thead>
      <tr>
        <th style="width: 70px;">Step #</th>
        <th style="width: 140px;">Target MP3 File</th>
        <th>Surgical Step Title</th>
        <th style="width: 60px; text-align: center;">Words</th>
        <th style="width: 80px; text-align: right;">Est. Duration</th>
      </tr>
    </thead>
    <tbody>
      ${jsonExport.map(item => `
        <tr>
          <td><span class="step-badge">${item.module.toUpperCase()} ${item.stepNumber}</span></td>
          <td><strong style="color: #0284c7; font-family: monospace;">${item.suggestedFilename}</strong></td>
          <td>${item.title}</td>
          <td style="text-align: center;">${item.wordCount}</td>
          <td style="text-align: right; color: #64748b;">~${item.estDurationSec} sec</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Detailed Step Scripts by Procedure -->
  ${procedures.map((proc, pIdx) => `
    <div class="${pIdx > 0 ? 'page-break' : ''}">
      <div class="section-title">
        ${proc.title} (${proc.steps.length} Steps)
      </div>

      ${proc.steps.map(step => {
        const paddedNum = String(step.stepNumber).padStart(2, '0');
        const mp3Name = STEP_VOICEOVER_MAP[step.id] || `${proc.filenamePrefix}${paddedNum}.mp3`;
        const words = step.spokenScript.trim().split(/\s+/).length;
        const estSec = Math.round((words / 135) * 60);

        return `
          <div class="step-card">
            <div class="step-header">
              <div class="step-title-area">
                <span class="step-badge">STEP ${step.stepNumber}</span>
                <span class="step-title">${step.title}</span>
              </div>
              <span class="file-chip">📁 ${mp3Name}</span>
            </div>
            <div class="step-body">
              <div class="spoken-script-label">
                <span>🔊 EXACT SPOKEN SCRIPT (${words} words • ~${estSec}s):</span>
              </div>
              <div class="spoken-script-box">
                "${step.spokenScript}"
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Recommended Instrument:</strong> ${step.recommendedInstrument.replace('_', ' ').toUpperCase()}
                </div>
                <div class="info-item">
                  <strong>Target Location:</strong> ${step.targetLocationDescription}
                </div>
                <div class="info-item" style="grid-column: span 2;">
                  <strong>Action Guide:</strong> ${step.actionCallout}
                </div>
                <div class="info-item" style="grid-column: span 2;">
                  <strong>Why Necessary:</strong> ${step.whyItsNecessary.replace(/^Why it is necessary:\s*/i, '')}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('')}

</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, html, 'utf8');
console.log('HTML script generated at:', outputHtmlPath);

// Render PDF using Edge headless
try {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const fileUrl = `file:///${outputHtmlPath.replace(/\\/g, '/')}`;
  const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" "${fileUrl}"`;
  console.log('Generating PDF via Microsoft Edge headless...');
  execSync(cmd, { stdio: 'inherit' });
  console.log('SUCCESS! PDF generated at:', outputPdfPath);
} catch (err) {
  console.error('Error generating PDF:', err.message);
}
