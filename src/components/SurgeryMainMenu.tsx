import React, { useState } from 'react';
import {
  Layers,
  Disc,
  Sparkles,
  ArrowRight,
  Video,
  FileText,
  BookOpen,
  Award,
  Shield,
  Activity,
  CheckCircle2,
  Eye,
  Compass,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Sun,
  Moon
} from 'lucide-react';
import { SurgicalModule } from '../types/ophthalmic';

interface SurgeryMainMenuProps {
  onSelectSurgery: (module: SurgicalModule) => void;
  onOpenVideoOverlay: (module: SurgicalModule) => void;
  onOpenPdfGuides: (module: 'phaco' | 'iol' | 'yag' | 'migs' | 'master') => void;
  onOpenReference: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const SurgeryMainMenu: React.FC<SurgeryMainMenuProps> = ({
  onSelectSurgery,
  onOpenVideoOverlay,
  onOpenPdfGuides,
  onOpenReference,
  theme = 'dark',
  onToggleTheme
}) => {
  const surgeries = [
    {
      id: 'phaco' as SurgicalModule,
      num: 'SURGERY 01',
      title: 'Cataract Phacoemulsification & Foldable IOL',
      subtitle: 'Complete 12-Step Ultrasonic Emulsification & In-The-Bag Acrylic Optic Delivery',
      badge: '12-STEP UNIFIED PROTOCOL',
      accentColor: 'emerald',
      themeBorder: 'border-emerald-500/50 hover:border-emerald-400',
      themeBg: 'bg-gradient-to-b from-emerald-950/25 to-[#050806]',
      themeButton: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60',
      icon: Layers,
      summary:
        'The complete gold-standard cataract procedure combining Phacoemulsification and Foldable IOL Implantation: 2.4mm tri-planar self-sealing corneal entry, dispersive OVD endothelial shield, 5.2mm continuous capsulorhexis, hydrodissection wave, phaco-chop nucleus fragmentation, cortical remnant clearance, cohesive OVD bag inflation, screw-drive folded acrylic IOL injection, Sinskey hook 360° rotational overlap, and thorough retro-lens viscoelastic washout.',
      highlights: [
        'Phase 1 (Steps 1–7): 3-Plane Corneal Tunnel → 5.2mm CCC → Phaco-Chop Ultrasonic Cavitation',
        'Phase 2 (Steps 8–12): Cohesive Bag Refill → Foldable IOL Delivery → Sinskey 360° Dialing',
        'Real Surgical Video Overlay (cataract.mp4) Included with Multi-Chapter Tracking'
      ],
      pdfGuideName: 'Cataract_Phacoemulsification_Surgery_Guide.pdf'
    },
    {
      id: 'yag' as SurgicalModule,
      num: 'SURGERY 02',
      title: 'Nd:YAG Laser Posterior Capsulotomy',
      subtitle: 'Q-Switched Slit-Lamp Photodisruption for PCO',
      badge: '5-STEP PROTOCOL',
      accentColor: 'emerald',
      themeBorder: 'border-emerald-500/50 hover:border-emerald-400',
      themeBg: 'bg-gradient-to-b from-emerald-950/25 to-[#050806]',
      themeButton: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60',
      icon: Sparkles,
      summary:
        'Treat secondary cataracts (posterior capsule opacification) by photodisrupting a pristine central optical aperture behind the artificial lens. Features Abraham +66D contact lens stabilization, twin HeNe laser triangulation, and +150µm posterior defocus offset to guarantee zero IOL pitting.',
      highlights: [
        'Crucial +150µm Posterior Defocus Offset Prevents Acrylic Optic Pitting',
        'Dual HeNe Laser Triangulation for Sub-Millimeter Focus',
        'Cruciate Pattern (+) Cuts Release Tension & Clear Visual Axis Without Vitreous Breakthrough'
      ],
      pdfGuideName: 'Nd_YAG_Laser_Posterior_Capsulotomy_Guide.pdf'
    },
    {
      id: 'migs' as SurgicalModule,
      num: 'SURGERY 03',
      title: 'MIGS: Trabecular Micro-Bypass Stent',
      subtitle: "Direct Schlemm's Canal Venous Bypass & 8–10 mmHg Backpressure Floor",
      badge: '6-STEP PROTOCOL',
      accentColor: 'emerald',
      themeBorder: 'border-emerald-500/50 hover:border-emerald-400',
      themeBg: 'bg-gradient-to-b from-emerald-950/25 to-[#050806]',
      themeButton: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60',
      icon: Compass,
      summary:
        "Bypass the diseased, clogged trabecular meshwork by implanting biocompatible titanium micro-bypass stents directly into Schlemm's canal and venous collector channels. Aqueous humor flows straight into the episcleral venous bloodstream, where natural blood pressure creates an unbreakable 8 to 10 mmHg backpressure floor, permanently preventing hypotony.",
      highlights: [
        'Micro-Stent Bypasses 90% of Glaucoma Resistance in Trabecular Meshwork',
        'Direct Venous Connection: Episcleral Bloodstream Creates 8–10 mmHg Floor',
        'Episcleral Blood Reflux Wave Verifies 100% Patent Outflow'
      ],
      pdfGuideName: 'MIGS_Trabecular_Micro_Stent_Glaucoma_Guide.pdf'
    }
  ];

  const [activeFilter, setActiveFilter] = useState<number | 'all'>('all');

  return (
    <div className="fixed inset-0 w-full h-full bg-[#000000] text-slate-200 select-none overflow-y-auto overscroll-contain font-sans p-4 sm:p-6 lg:p-8 flex flex-col justify-between z-10">
      {/* Top Navigation / Brand Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#1b2b44] gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="./icons/logo.png"
            alt="RHEXIS"
            className="w-12 h-12 rounded-2xl object-contain bg-black border border-emerald-500/80 shadow-xl shadow-emerald-950/60 p-1 shrink-0"
          />
          <div>
            <div className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold flex items-center gap-1.5">
              <span>RHEXIS MEDICAL SPECIALTY SUITE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ophthalmic Surgical Operations Hub
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode (Pure White with Green Accents)' : 'Switch to Dark Mode (Pure Black with Green Accents)'}
              aria-label="Toggle Theme Mode"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-300 text-xs font-semibold transition active:scale-95 shadow-md"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-emerald-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-300" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onOpenPdfGuides('master')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1a2942] border border-[#233857] text-slate-200 text-xs font-semibold transition active:scale-95 shadow-md"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Master PDF Manual</span>
          </button>

          <button
            onClick={onOpenReference}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1a2942] border border-[#233857] text-slate-200 text-xs font-semibold transition active:scale-95 shadow-md"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Clinical Compendium</span>
          </button>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <div className="max-w-6xl w-full mx-auto my-5 bg-gradient-to-r from-emerald-950/30 via-[#0a1426] to-[#071120] border border-emerald-900/60 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
            RESIDENCY & FELLOWSHIP SIMULATION
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5">
            Select an Ophthalmic Surgical Procedure to Begin
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Practice anterior segment micro-surgery with real fluidics differential equations, progressive 3-plane incisions, tactile sound synthesis, real surgical video overlays, and attending voice coaching.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3 Surgical Suites Ready</span>
          </span>
        </div>
      </div>

      {/* Quick Surgery Carousel & Selector Strip */}
      <div className="max-w-6xl w-full mx-auto mb-4 sticky top-0 z-30 bg-[#080d19]/95 backdrop-blur-md p-2.5 rounded-2xl border border-emerald-900/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-[#1e2f47]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All 3 Surgeries</span>
          </button>

          {surgeries.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveFilter(idx);
                const el = document.getElementById(`surgery-card-${s.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 ${
                activeFilter === idx
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'bg-[#0f172a] text-slate-300 hover:text-white border border-[#1e2f47]'
              }`}
            >
              <span>{idx + 1}. {s.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Carousel Prev / Next Controls */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] font-mono text-slate-400">
            {activeFilter === 'all' ? 'Scroll below or switch:' : `Surgery ${activeFilter + 1} of 3`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const nextIdx = activeFilter === 'all' ? 2 : (activeFilter - 1 + surgeries.length) % surgeries.length;
                setActiveFilter(nextIdx);
                const el = document.getElementById(`surgery-card-${surgeries[nextIdx].id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#16253c] border border-[#20324c] text-slate-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-sm"
              title="Previous Surgery"
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => {
                const nextIdx = activeFilter === 'all' ? 0 : (activeFilter + 1) % surgeries.length;
                setActiveFilter(nextIdx);
                const el = document.getElementById(`surgery-card-${surgeries[nextIdx].id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#16253c] border border-[#20324c] text-slate-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-sm"
              title="Next Surgery"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* The Three Surgical Suites */}
      <div className={`max-w-6xl w-full mx-auto my-2 ${
        activeFilter === 'all'
          ? 'grid grid-cols-1 lg:grid-cols-3 gap-5'
          : 'flex flex-col max-w-2xl'
      }`}>
        {(activeFilter === 'all' ? surgeries : [surgeries[activeFilter]]).map((surg) => {
          const Icon = surg.icon;
          return (
            <div
              key={surg.id}
              id={`surgery-card-${surg.id}`}
              className={`rounded-2xl border ${surg.themeBorder} ${surg.themeBg} backdrop-blur-md p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] group relative overflow-hidden scroll-mt-24`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1b2b44]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    {surg.num}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#09101d] text-cyan-300 border border-[#1b2b44] px-2 py-0.5 rounded font-bold">
                    {surg.badge}
                  </span>
                </div>

                {/* Surgery Icon & Title */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#09101d] border border-[#1e2f4a] group-hover:border-cyan-400 text-cyan-400 transition-colors shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {surg.title}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      {surg.subtitle}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed mt-4">
                  {surg.summary}
                </p>

                {/* Highlights List */}
                <div className="mt-4 pt-3 border-t border-[#17253a] space-y-1.5 text-[11px]">
                  {surg.highlights.map((hl, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#17253a] space-y-2">
                {/* Primary Enter Simulator Button */}
                <button
                  onClick={() => onSelectSurgery(surg.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${surg.themeButton}`}
                >
                  <span>Launch {surg.title.split(' ')[0]} Simulator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Secondary Actions: Video Overlay & PDF Guide */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenVideoOverlay(surg.id)}
                    className="py-1.5 px-2 rounded-lg bg-[#0a1220] hover:bg-[#132035] border border-[#1b2b44] hover:border-cyan-500/80 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                    title={`Watch Real Surgical Video for ${surg.title}`}
                  >
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Video Overlay</span>
                  </button>

                  <button
                    onClick={() => onOpenPdfGuides(surg.id as any)}
                    className="py-1.5 px-2 rounded-lg bg-[#0a1220] hover:bg-[#132035] border border-[#1b2b44] hover:border-sky-500/80 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                    title={`Open Field Guide PDF for ${surg.title}`}
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>PDF Guide</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      <footer className="max-w-6xl w-full mx-auto mt-6 pt-4 border-t border-[#1b2b44] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span>RHEXIS Simulator v2026.1</span>
          <span>•</span>
          <span>Chrome/Edge WebGL 3D & 2D Composite Viewports</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-mono">TTS Autoplay: OFF (Manual Activation)</span>
          <span>•</span>
          <span>High-Resolution Real Eye Photography</span>
        </div>
      </footer>
    </div>
  );
};
