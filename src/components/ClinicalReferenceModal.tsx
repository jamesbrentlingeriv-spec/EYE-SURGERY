import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Layers,
  Zap,
  Activity,
  Droplets,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

interface ClinicalReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReferenceModal: React.FC<ClinicalReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'phaco' | 'ccc' | 'fluidics' | 'iol' | 'yag'>('phaco');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="bg-[#0b1220] border border-[#1e2f4a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#1b2b44] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                OPHTHALMIC SURGICAL CONSULTANT COMPENDIUM
              </h2>
              <div className="text-xs text-slate-400">
                Biomedical Principles, Fluidics Equations, and Micro-Surgical Protocols
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1b2b44] bg-[#080d18] px-4 gap-2 text-xs">
          {[
            { id: 'phaco', label: 'Phaco Principles & CDE' },
            { id: 'ccc', label: 'Capsulorhexis & Little Rescue' },
            { id: 'fluidics', label: 'Fluidics & Surge Dynamics' },
            { id: 'iol', label: 'IOL Implantation & Washout' },
            { id: 'yag', label: 'Nd:YAG Laser Optical Physics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-3 font-semibold transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-[#0e1726]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'phaco' && (
            <div className="space-y-4">
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Cumulative Dissipated Energy (CDE) Formula
                </h3>
                <p>
                  Cumulative Dissipated Energy quantifies total acoustic ultrasound energy delivered into the eye:
                </p>
                <div className="font-mono bg-[#070c16] p-2.5 rounded-lg border border-[#17253a] text-yellow-300">
                  CDE = Phaco Time (sec) × (Average US Power [%] / 100) × Duty Cycle
                </div>
                <p className="text-slate-400">
                  Excessive CDE (&gt; 18 %-sec for LOCS III NO3) increases thermal endothelial apoptosis and post-op corneal edema.
                </p>
              </div>

              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h4 className="font-bold text-white text-xs">LOCS III Nuclear Opalescence (NO) Grading</h4>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-[#070c16] border border-[#17253a]">
                    <div className="text-amber-300 font-bold">NO1 - NO2</div>
                    <div className="text-slate-400">Soft cataract; Low phaco power (20-40%), gentle aspiration.</div>
                  </div>
                  <div className="p-2 rounded bg-[#070c16] border border-[#17253a]">
                    <div className="text-amber-400 font-bold">NO3 - NO4</div>
                    <div className="text-slate-400">Moderate/dense nucleus; Stop & chop or quick-chop with burst mode.</div>
                  </div>
                  <div className="p-2 rounded bg-[#070c16] border border-[#17253a]">
                    <div className="text-amber-500 font-bold">NO5 - NO6</div>
                    <div className="text-slate-400">Brunescent / black rock cataract; High CDE risk, dispersive OVD recoating.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ccc' && (
            <div className="space-y-4">
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Continuous Curvilinear Capsulorhexis (CCC) Biomechanics
                </h3>
                <p>
                  The capsulorhexis tear vector is governed by a balance of two vectors:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">Shearing (Tangential) Force:</strong> Pulling parallel to the tear edge creates a controlled circumferential curve.</li>
                  <li><strong className="text-slate-200">Stretching (Radial Outward) Force:</strong> Outward tension towards zonules increases if anterior chamber depth is lost or pull vector points outward.</li>
                </ul>
              </div>

              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h4 className="font-bold text-emerald-300 text-xs">Little's Technique for Rescuing Runaway Rhexis</h4>
                <p>
                  When a tear begins extending radially toward the zonules:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                  <li>Refill the anterior chamber with cohesive viscoelastic to eliminate positive vitreous upthrust and flatten the lens convexity.</li>
                  <li>Unfold the capsular flap so it lies completely flat against the anterior lens cortex.</li>
                  <li>Grasp the flap with micro-forceps just posterior to the apex of the tear.</li>
                  <li>Direct vector pull <strong>180 degrees directly back toward the center of the pupil</strong>.</li>
                  <li>The tear will redirect centripetally, returning to the desired 5.0–5.5 mm circular trajectory.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'fluidics' && (
            <div className="space-y-4">
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Fluidics Balance & Surge Physics
                </h3>
                <div className="font-mono bg-[#070c16] p-2.5 rounded-lg border border-[#17253a] text-cyan-300">
                  dV/dt = Inflow(Bottle Height / Forced Infusion) - Outflow(Aspiration + Incision Leak)
                </div>
                <p>
                  <strong>Post-Occlusion Surge:</strong> While the tip is occluded by a dense nuclear fragment, vacuum ramps up to the preset limit (e.g. 450 mmHg). Compliance in the tubing causes elastic expansion. When the fragment clears, this stored potential energy instantaneously evacuates fluid from the anterior chamber at high speed (&gt;60 cc/min), causing rapid chamber collapse unless compensated by active fluidics.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'iol' && (
            <div className="space-y-4">
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm">Foldable Hydrophobic Acrylic IOL Mechanics</h3>
                <p>
                  Modern single-piece acrylic lenses feature open C-loop haptics. The leading haptic must enter the capsular bag directly from the injector nozzle. The trailing haptic is dialed into the equator using a Sinskey hook with clockwise rotation.
                </p>
                <p>
                  <strong>360-Degree Optic Overlap:</strong> Complete capsular overlap (0.5 mm anterior rim around the 6.0 mm optic) acts as a mechanical barrier preventing lens epithelial cell migration and posterior capsular opacification (PCO).
                </p>
                <p>
                  <strong>Viscoelastic Washout:</strong> Retained cohesive OVD in the capsular bag blocks the trabecular meshwork postoperatively, causing severe IOP spikes (&gt;45 mmHg). Thorough bimanual / retro-lens aspiration is required.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'yag' && (
            <div className="space-y-4">
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1b2b44] space-y-2">
                <h3 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  1064nm Nd:YAG Laser Photodisruption & Focal Offset
                </h3>
                <p>
                  The Nd:YAG laser delivers a sub-nanosecond pulse creating an electric field exceeding the optical dielectric breakdown threshold of aqueous humor (~0.8 mJ). This produces plasma, accompanied by a supersonic shockwave and cavitation micro-bubble.
                </p>
                <div className="p-3 bg-[#070c16] rounded-lg border border-[#17253a] space-y-1">
                  <div className="font-bold text-white text-xs">Crucial Defocus Offset Rules:</div>
                  <ul className="list-disc pl-5 text-slate-300 space-y-1">
                    <li><strong className="text-red-400">Zero or Anterior Offset:</strong> Plasma shockwave occurs directly on the posterior IOL surface, producing pitting and crack defects.</li>
                    <li><strong className="text-emerald-400">+100 to +250 µm Posterior Offset:</strong> Safe clinical zone. The acoustic shockwave propagates forward to cleave the opacified capsule without contacting the acrylic optic.</li>
                    <li><strong className="text-amber-400">&gt; +320 µm Posterior Offset:</strong> Plasma breakdown disrupts the anterior hyaloid face, leading to vitreous prolapse and floaters.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2b44] flex justify-end bg-[#080d19]">
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
