import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  Layers,
  Disc,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  X,
  FileText,
  Printer,
  Compass
} from 'lucide-react';
import { SURGICAL_INSTRUCTIONS } from '../data/surgicalInstructions';

interface SurgicalGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModule?: 'phaco' | 'iol' | 'yag' | 'master' | 'migs';
}

export const SurgicalGuidesModal: React.FC<SurgicalGuidesModalProps> = ({
  isOpen,
  onClose,
  initialModule = 'phaco'
}) => {
  const [selectedModule, setSelectedModule] = useState<'phaco' | 'iol' | 'yag' | 'master' | 'migs'>(initialModule);

  if (!isOpen) return null;

  const pdfFiles = {
    phaco: {
      fileName: 'Cataract_Phacoemulsification_Surgery_Guide.pdf',
      title: 'Cataract Phacoemulsification Surgery',
      desc: '7-step beginner guide: Paracentesis, Tri-Planar Wound (300µm groove, 1.5mm tunnel, Descemet entry), OVD shield, Capsulorhexis, Hydrodissection, Phaco-Chop, and Cortex I/A.',
      icon: Layers,
      color: 'text-cyan-400 border-cyan-500 bg-cyan-950/40'
    },
    iol: {
      fileName: 'Foldable_IOL_Implantation_Guide.pdf',
      title: 'Foldable Intraocular Lens (IOL) Implantation',
      desc: '5-step beginner guide: Bag re-inflation with Provisc, cartridge insertion through 2.4mm incision, leading haptic seating, Sinskey dialing & 360° overlap, and retro-lens OVD washout.',
      icon: Disc,
      color: 'text-sky-400 border-sky-500 bg-sky-950/40'
    },
    yag: {
      fileName: 'Nd_YAG_Laser_Posterior_Capsulotomy_Guide.pdf',
      title: 'Nd:YAG Laser Posterior Capsulotomy',
      desc: '5-step beginner guide: Abraham +66D contact lens, HeNe aiming beam alignment, crucial +150µm posterior defocus offset to avoid lens pits, cruciate cutting pattern, and IOP management.',
      icon: Sparkles,
      color: 'text-rose-400 border-rose-500 bg-rose-950/40'
    },
    migs: {
      fileName: 'MIGS_Trabecular_Micro_Stent_Glaucoma_Guide.pdf',
      title: 'MIGS: Trabecular Micro-Bypass Glaucoma Stent Surgery',
      desc: '6-step beginner guide: Gonioprism placement, iridocorneal angle landmarks, Schlemm canal stent insertion, episcleral venous blood reflux test, and physiological 8-10 mmHg backpressure floor.',
      icon: Compass,
      color: 'text-emerald-400 border-emerald-500 bg-emerald-950/40'
    },
    master: {
      fileName: 'Comprehensive_Ophthalmic_Surgical_Manual.pdf',
      title: 'Comprehensive Master Surgical Compendium',
      desc: 'Complete all-in-one clinical field manual uniting all three surgical procedures, anatomical SVG diagrams, fluidics equations, and complication rescue protocols.',
      icon: BookOpen,
      color: 'text-cyan-400 border-cyan-500 bg-cyan-950/40'
    }
  };

  const getInstructionsForModule = (mod: string) => {
    return Object.values(SURGICAL_INSTRUCTIONS).filter(inst => inst.module === mod);
  };

  const currentPdf = pdfFiles[selectedModule];

  // Helper to open PDF or HTML
  const getAssetUrl = (relativePath: string) => {
    const base = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    return `${base}${relativePath.replace(/^\.?\//, '')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="bg-[#0b1220] border border-[#1e2f4a] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1b2b44] flex items-center justify-between bg-gradient-to-r from-[#0d1728] via-[#0e1c33] to-[#0d1728]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                OPHTHALMIC SURGICAL MANUALS & PDF GUIDES
              </h2>
              <div className="text-xs text-slate-400">
                Beginner-friendly step-by-step guides with detailed incisions, clinical rationale & diagrams
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#16253c] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Surgical Module Selector Tabs */}
        <div className="flex border-b border-[#1b2b44] bg-[#080d18] px-3 sm:px-4 gap-1 sm:gap-2 text-xs overflow-x-auto no-scrollbar">
          {[
            { id: 'phaco', label: '1. Phacoemulsification PDF', icon: Layers },
            { id: 'iol', label: '2. Foldable IOL PDF', icon: Disc },
            { id: 'yag', label: '3. Nd:YAG Laser PDF', icon: Sparkles },
            { id: 'migs', label: '4. MIGS Glaucoma PDF', icon: Compass },
            { id: 'master', label: '★ Master Compendium', icon: BookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = selectedModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedModule(tab.id as typeof selectedModule)}
                className={`py-3 px-3 font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
                  isSel
                    ? 'border-cyan-400 text-cyan-300 bg-[#0e1726]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Download Banner */}
        <div className="p-4 bg-gradient-to-r from-[#0d1b30] via-[#0d223c] to-[#0a1728] border-b border-[#1b2f4c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>{currentPdf.title}</span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">
              {currentPdf.desc}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={getAssetUrl(`guides/${currentPdf.fileName}`)}
              download={currentPdf.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>

            <a
              href={getAssetUrl(`guides/${currentPdf.fileName.replace('.pdf', '.html')}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#101b2d] hover:bg-[#16253c] border border-[#1e2f4a] text-slate-300 hover:text-white text-xs font-semibold transition"
              title="Open Printable HTML Version in New Tab"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Print / View</span>
            </a>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs leading-relaxed">
          {/* Quick Beginner Summary Box */}
          <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Summary for Beginners (No Experience Required)</span>
            </div>
            <p className="text-slate-300 text-xs">
              {selectedModule === 'phaco' && (
                <>
                  In cataract surgery, we replace the eye's cloudy natural lens with a clear artificial one. The procedure is performed through a tiny <strong>2.4mm self-sealing tunnel</strong> cut in three staggered planes into the clear window of the eye (cornea). We inject a protective gel to shield delicate cells, tear a smooth circular 5.2mm window in the lens capsule bag, loosen the lens with water, pulverize the rock-hard cataract using ultrasonic sound waves (phacoemulsification), and vacuum away the fluffy remnants.
                </>
              )}
              {selectedModule === 'iol' && (
                <>
                  After removing the cataract, we must insert a new artificial lens (IOL) so light can focus on the retina. Because the new lens is 6.0mm wide and our incision is only 2.4mm, the lens is folded like a tiny taco inside an injector cartridge. We re-inflate the natural bag with jelly, inject the folded lens, watch its spring arms (haptics) seat into the bag corners, dial it clockwise with a Sinskey hook to achieve 360° anterior capsule overlap, and vacuum out all the jelly to prevent high eye pressure.
                </>
              )}
              {selectedModule === 'yag' && (
                <>
                  Months or years after cataract surgery, microscopic cells can grow across the back bag like frost on glass (Posterior Capsule Opacification, or PCO). We use an invisible infrared Nd:YAG laser to zap a crystal-clear window through the cloudy membrane. A specialized Abraham contact lens magnifies the view, twin red HeNe aiming beams converge to guarantee sharp focus, and a <strong>+150µm posterior defocus offset</strong> ensures the laser spark occurs safely behind the artificial lens, preventing scratches or pits!
                </>
              )}
              {selectedModule === 'master' && (
                <>
                  The Master Compendium integrates all three surgical workflows into a unified reference document with complete anatomical SVG illustrations, fluidic calculations, Cumulative Dissipated Energy (CDE) parameters, and complications prevention protocols.
                </>
              )}
            </p>
          </div>

          {/* Detailed Step-by-Step Breakdown Cards */}
          <div className="space-y-3">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Step-by-Step Surgical Steps & Clinical Rationale:
            </div>

            {getInstructionsForModule(selectedModule === 'master' ? 'phaco' : selectedModule).map((step, idx) => (
              <div key={idx} className="bg-[#090f1c] rounded-xl border border-[#18283f] overflow-hidden space-y-0">
                <div className="p-3 bg-[#0e1726] border-b border-[#18283f] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                      STEP {step.stepNumber}
                    </span>
                    <span className="font-bold text-white text-xs">
                      {step.beginnerTitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-[#070c16] px-2 py-0.5 rounded border border-[#17253a]">
                    Tool: {step.recommendedInstrument.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 text-xs">
                  {/* Action guide */}
                  <div className="bg-[#101b2d] p-2.5 rounded-lg border border-[#1a2d48] text-slate-200">
                    <div className="text-[10px] font-bold uppercase text-amber-400 font-mono">
                      What You Do:
                    </div>
                    <div className="text-white mt-0.5 leading-relaxed">
                      {step.actionCallout}
                    </div>
                  </div>

                  {/* Why it's necessary */}
                  <div className="bg-[#071222] p-2.5 rounded-lg border border-[#152a48] text-slate-300">
                    <div className="text-[10px] font-bold uppercase text-sky-400 font-mono">
                      Why It Is Strictly Necessary:
                    </div>
                    <div className="text-slate-300 mt-0.5 leading-relaxed">
                      {step.whyItsNecessary}
                    </div>
                  </div>

                  {/* Anatomical Details if available */}
                  {step.detailedAnatomy && (
                    <div className="p-2.5 rounded-lg bg-[#060c18] border border-[#132238] space-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-400">Target Tissue: </span>
                        <span className="text-slate-200">{step.detailedAnatomy.tissueTarget}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tissue Biomechanics: </span>
                        <span className="text-slate-300">{step.detailedAnatomy.biomechanicsExplanation}</span>
                      </div>
                    </div>
                  )}

                  {/* Hazards */}
                  <div className="flex items-start gap-2 text-rose-300 text-[11px] pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-rose-400">Critical Hazard: </span>
                      <span>{step.hazards[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2b44] flex items-center justify-between bg-[#080d19]">
          <div className="text-[11px] text-slate-400">
            PDF files are stored in <span className="font-mono text-cyan-300">guides/</span> and available for offline review.
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
