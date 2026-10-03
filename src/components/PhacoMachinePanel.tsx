import React from 'react';
import {
  FluidicsState,
  PhacoMachineSettings,
  LocsNuclearGrade,
  PhacoMode
} from '../types/ophthalmic';
import {
  Gauge,
  Activity,
  Wind,
  Zap,
  Sliders,
  AlertTriangle,
  Flame,
  ArrowUpCircle
} from 'lucide-react';

interface PhacoMachinePanelProps {
  fluidics: FluidicsState;
  settings: PhacoMachineSettings;
  cataractGrade: LocsNuclearGrade;
  onUpdateSettings: (newSettings: Partial<PhacoMachineSettings>) => void;
  onUpdateFluidics: (bottleHeight: number, vacuumTarget: number, flowTarget: number) => void;
  onGradeChange: (grade: LocsNuclearGrade) => void;
}

export const PhacoMachinePanel: React.FC<PhacoMachinePanelProps> = ({
  fluidics,
  settings,
  cataractGrade,
  onUpdateSettings,
  onUpdateFluidics,
  onGradeChange,
}) => {
  const modes: PhacoMode[] = ['continuous', 'pulse', 'burst'];
  const grades: LocsNuclearGrade[] = ['NO1', 'NO2', 'NO3', 'NO4', 'NO5', 'NO6'];

  return (
    <div className="w-80 bg-[#0a101d] border-l border-[#1b2b44] p-3 flex flex-col gap-3 text-xs select-none overflow-y-auto">
      {/* Console Header */}
      <div className="pb-2 border-b border-[#1b2b44] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-xs">CENTURION® VISION</div>
            <div className="text-[10px] text-slate-400 font-mono">Active Fluidics™ System</div>
          </div>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
          ONLINE
        </span>
      </div>

      {/* Cataract Nuclear Density Selector (LOCS III NO1 - NO6) */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-1.5">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            LOCS III Nuclear Grade
          </span>
          <span className="font-mono font-bold text-amber-400">{cataractGrade}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {grades.map(g => (
            <button
              key={g}
              onClick={() => onGradeChange(g)}
              className={`py-1 rounded text-center font-mono font-semibold transition ${
                cataractGrade === g
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-[#0f1b2c] text-slate-400 hover:bg-[#15253e]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Real-Time Fluidics Gauges: Vacuum & Flow */}
      <div className="grid grid-cols-2 gap-2">
        {/* Vacuum Monitor */}
        <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Vacuum</span>
            <span className="font-mono text-cyan-400">{fluidics.vacuumTarget} max</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-extrabold text-cyan-300">
              {Math.round(fluidics.vacuumActual)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">mmHg</span>
          </div>
          {/* Gauge meter */}
          <div className="w-full bg-[#101c2e] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                fluidics.isOccluded ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (fluidics.vacuumActual / 600) * 100)}%` }}
            />
          </div>
          {fluidics.isOccluded && (
            <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              TIP OCCLUDED
            </span>
          )}
        </div>

        {/* Aspiration Flow Monitor */}
        <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Aspiration</span>
            <span className="font-mono text-teal-400">{fluidics.aspirationFlowTarget} set</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-extrabold text-teal-300">
              {fluidics.aspirationFlowActual.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">cc/min</span>
          </div>
          {/* Meter */}
          <div className="w-full bg-[#101c2e] h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 transition-all duration-75"
              style={{ width: `${Math.min(100, (fluidics.aspirationFlowActual / 50) * 100)}%` }}
            />
          </div>
          {fluidics.isSurgeOccurring && (
            <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1 animate-pulse">
              SURGE DETECTED
            </span>
          )}
        </div>
      </div>

      {/* Ultrasound Power & Modes */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Ultrasound Power
          </span>
          <span className="font-mono font-bold text-yellow-400 text-sm">
            {settings.powerPercent}%
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1">
          {modes.map(m => (
            <button
              key={m}
              onClick={() => onUpdateSettings({ mode: m })}
              className={`py-1 rounded text-center font-mono capitalize transition ${
                settings.mode === m
                  ? 'bg-yellow-600 text-white font-bold'
                  : 'bg-[#0f1b2c] text-slate-400 hover:bg-[#15253e]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Power Slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={settings.powerPercent}
          onChange={(e) => onUpdateSettings({ powerPercent: Number(e.target.value) })}
          className="w-full accent-yellow-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
        />
      </div>

      {/* Fluidics Parameter Sliders: Bottle Height & Vacuum Limit */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-2.5">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Infusion & Limits
        </div>

        {/* Bottle Height Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Bottle Infusion Head</span>
            <span className="font-mono text-cyan-300">{fluidics.bottleHeightCm} cm H₂O</span>
          </div>
          <input
            type="range"
            min="40"
            max="110"
            value={fluidics.bottleHeightCm}
            onChange={(e) => onUpdateFluidics(Number(e.target.value), fluidics.vacuumTarget, fluidics.aspirationFlowTarget)}
            className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Vacuum Limit Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Vacuum Limit</span>
            <span className="font-mono text-cyan-300">{fluidics.vacuumTarget} mmHg</span>
          </div>
          <input
            type="range"
            min="100"
            max="600"
            step="10"
            value={fluidics.vacuumTarget}
            onChange={(e) => onUpdateFluidics(fluidics.bottleHeightCm, Number(e.target.value), fluidics.aspirationFlowTarget)}
            className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Flow Rate Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Aspiration Flow Limit</span>
            <span className="font-mono text-teal-300">{fluidics.aspirationFlowTarget} cc/min</span>
          </div>
          <input
            type="range"
            min="15"
            max="50"
            value={fluidics.aspirationFlowTarget}
            onChange={(e) => onUpdateFluidics(fluidics.bottleHeightCm, fluidics.vacuumTarget, Number(e.target.value))}
            className="w-full accent-teal-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Safety & Surge Alerts */}
      {fluidics.endothelialContactAlert && (
        <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-200 flex items-center gap-2 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>WARNING: Instrument in contact with corneal endothelium!</span>
        </div>
      )}

      {fluidics.posteriorCapsuleContactAlert && (
        <div className="p-2 rounded-lg bg-red-950/90 border border-red-500 text-white flex items-center gap-2 text-[11px] animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>DANGER: Active tip &lt; 1mm from posterior capsule!</span>
        </div>
      )}
    </div>
  );
};
