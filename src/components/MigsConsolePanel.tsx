// MIGS Glaucoma Trabecular Micro-Bypass Console Panel
// Telemetry & Goldmann Hemodynamics: Direct Venous Drainage & 8-10 mmHg Backpressure Floor

import React from 'react';
import { MigsState } from '../types/ophthalmic';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Sliders,
  RotateCw,
  Droplets,
  Activity,
  Zap,
  Crosshair,
  Compass,
  CheckCircle2,
  X
} from 'lucide-react';

interface MigsConsolePanelProps {
  state: MigsState;
  onUpdateTilt: (microscope: number, head: number) => void;
  onTriggerBloodReflux: () => void;
  onClose?: () => void;
}

export const MigsConsolePanel: React.FC<MigsConsolePanelProps> = ({
  state,
  onUpdateTilt,
  onTriggerBloodReflux,
  onClose
}) => {
  const stentsDeployedCount = state.stents.filter(s => s.deployed).length;
  const isHypotonyProtected = state.hypotonyProtectedByVenousBackpressure;

  return (
    <div className="w-80 bg-[#090f1c] border-l border-[#1b2b44] flex flex-col h-full text-slate-200 select-none overflow-y-auto no-scrollbar font-sans p-3.5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2b44]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/80 text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">
              MIGS Glaucoma Console
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">
              Schlemm Venous Bypass
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 1. Episcleral Venous Back-Pressure Floor Callout (The 8-10 mmHg Secret) */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#0a1b2a] to-emerald-950/40 border border-emerald-600/60 rounded-xl p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-emerald-300 font-bold uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Venous Blood Floor</span>
          </span>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 px-1.5 py-0.2 rounded font-bold">
            8–10 mmHg
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Because the micro-stent drains directly into the episcleral venous bloodstream, natural venous pressure (<strong className="text-emerald-300">8.5 mmHg</strong>) prevents hypotony: the eye cannot drain below this blood floor!
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-emerald-900/60 text-[10px] font-mono">
          <span className="text-slate-400">Hypotony Risk:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>0% (Protected by Venous Floor)</span>
          </span>
        </div>
      </div>

      {/* 2. Real-Time IOP & Outflow Facility Telemetry */}
      <div className="bg-[#0b1426] border border-[#1b2f4c] rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
          <span>Goldmann Hemodynamics:</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        </div>

        {/* IOP Comparison */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-[#070d18] border border-[#17253a]">
            <div className="text-[10px] text-slate-400">Baseline IOP</div>
            <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
              {state.baselineIopMmHg.toFixed(1)} <span className="text-[9px]">mmHg</span>
            </div>
            <div className="text-[9px] text-rose-400/80 font-mono">Diseased TM</div>
          </div>

          <div className="p-2 rounded-lg bg-[#070d18] border border-emerald-800/60">
            <div className="text-[10px] text-emerald-400 font-semibold">Current IOP</div>
            <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
              {state.currentIopMmHg.toFixed(1)} <span className="text-[9px]">mmHg</span>
            </div>
            <div className="text-[9px] text-emerald-400/80 font-mono">
              {stentsDeployedCount === 0 ? 'Awaiting Stent' : `${stentsDeployedCount} Stent(s) Patent`}
            </div>
          </div>
        </div>

        {/* Outflow Facility Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Outflow Facility (C):</span>
            <span className="font-bold text-cyan-300">
              {state.outflowFacilityMicrolitersPerMinPerMmHg.toFixed(3)} µL/min/mmHg
            </span>
          </div>
          <div className="w-full bg-[#070c16] rounded-full h-1.5 overflow-hidden border border-[#17253a]">
            <div
              className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (state.outflowFacilityMicrolitersPerMinPerMmHg / 0.28) * 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>0.08 (Severe)</span>
            <span>0.18 (Moderate)</span>
            <span>0.28 (Target)</span>
          </div>
        </div>
      </div>

      {/* 3. Microscope & Head Tilt Alignment Controls */}
      <div className="bg-[#0b1426] border border-[#1b2f4c] rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 uppercase">
          <span>Gonioscopic Tilt Alignment:</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] ${state.gonioViewClarityPercent > 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
            {state.gonioViewClarityPercent}% Clarity
          </span>
        </div>

        {/* Microscope Tilt Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Microscope Tilt:</span>
            <span className="text-white font-bold">{state.microscopeTiltDeg}° (Target: 38°)</span>
          </div>
          <input
            type="range"
            min="0"
            max="45"
            value={state.microscopeTiltDeg}
            onChange={(e) => onUpdateTilt(Number(e.target.value), state.patientHeadTiltDeg)}
            className="w-full h-1.5 bg-[#070d18] accent-cyan-400 rounded-lg cursor-pointer"
          />
        </div>

        {/* Patient Head Tilt Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Patient Head Tilt:</span>
            <span className="text-white font-bold">{state.patientHeadTiltDeg}° (Target: 35°)</span>
          </div>
          <input
            type="range"
            min="0"
            max="45"
            value={state.patientHeadTiltDeg}
            onChange={(e) => onUpdateTilt(state.microscopeTiltDeg, Number(e.target.value))}
            className="w-full h-1.5 bg-[#070d18] accent-sky-400 rounded-lg cursor-pointer"
          />
        </div>

        {/* Auto-Align Tilt Button */}
        <button
          onClick={() => onUpdateTilt(38, 35)}
          className="w-full py-1.5 rounded-lg bg-[#0e1b30] hover:bg-[#162744] border border-[#22395a] text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Auto-Align 38°/35° Goniometry</span>
        </button>
      </div>

      {/* 4. Micro-Stent Deployment Status */}
      <div className="bg-[#0b1426] border border-[#1b2f4c] rounded-xl p-3 space-y-2">
        <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
          <span>Stent Deployment Status:</span>
          <span className="font-mono text-cyan-400">{stentsDeployedCount} / 2 Deployed</span>
        </div>

        <div className="space-y-1.5">
          {state.stents.map((stent, idx) => (
            <div
              key={stent.id}
              className={`p-2 rounded-lg border flex items-center justify-between text-xs font-mono ${
                stent.deployed
                  ? stent.isPatentToVenousStream
                    ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-700/80 text-amber-300'
                  : 'bg-[#070d18] border-[#17253a] text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-bold">Stent #{idx + 1} ({stent.clockPosition.toFixed(1)} o'clock)</span>
              </div>
              <span className="text-[10px] font-bold">
                {stent.deployed
                  ? stent.isPatentToVenousStream
                    ? 'Patent (In Bloodstream)'
                    : 'Seated'
                  : 'In Trocar'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Episcleral Blood Reflux Test Button */}
      <div className="bg-[#0b1426] border border-[#1b2f4c] rounded-xl p-3 space-y-2">
        <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
          Venous Bloodstream Confirmation:
        </div>

        <button
          onClick={onTriggerBloodReflux}
          disabled={stentsDeployedCount === 0}
          className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
            stentsDeployedCount > 0
              ? state.bloodRefluxWaveConfirmed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                : 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950/60 animate-pulse'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>
            {state.bloodRefluxWaveConfirmed
              ? 'Blood Reflux Wave Verified (Patent!)'
              : 'Trigger Blood Reflux Test (Decompress AC)'}
          </span>
        </button>

        <p className="text-[10px] text-slate-400 leading-snug">
          Confirms direct patency: lowering eye pressure below 8.5 mmHg pulls a retrograde plume of venous blood out of the stent lumen.
        </p>
      </div>
    </div>
  );
};
