import React from 'react';
import { YagLaserSettings, YagCapsulotomyState } from '../types/ophthalmic';
import {
  Sparkles,
  Zap,
  Sliders,
  Crosshair,
  ShieldAlert,
  Sun,
  Eye,
  RotateCw,
  AlertTriangle,
  X
} from 'lucide-react';

interface YagConsolePanelProps {
  settings: YagLaserSettings;
  capsulotomy: YagCapsulotomyState;
  onUpdateSettings: (newSettings: Partial<YagLaserSettings>) => void;
  onResetLaser: () => void;
  onClose?: () => void;
}

export const YagConsolePanel: React.FC<YagConsolePanelProps> = ({
  settings,
  capsulotomy,
  onUpdateSettings,
  onResetLaser,
  onClose,
}) => {
  return (
    <div className="w-full lg:w-80 bg-[#0a101d] lg:border-l border-[#1b2b44] p-3 flex flex-col gap-3 text-xs select-none overflow-y-auto h-full">
      {/* Console Header */}
      <div className="pb-2 border-b border-[#1b2b44] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-xs">ELLEX ULTRA Q: Nd:YAG</div>
            <div className="text-[10px] text-slate-400 font-mono">1064nm Q-Switched Photodisruptor</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold animate-pulse">
            ARMED
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#16253c] text-slate-400 hover:text-white transition lg:hidden"
              title="Close Console"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Laser Telemetry & Counters */}
      <div className="grid grid-cols-2 gap-2">
        {/* Shots Counter */}
        <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a]">
          <div className="text-slate-400 text-[11px]">Shots Fired</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            {settings.burstCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Cleared: {capsulotomy.cruciateOpeningAreaMm2} mm²
          </div>
        </div>

        {/* Total Energy Delivered */}
        <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a]">
          <div className="text-slate-400 text-[11px]">Total Energy</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
            {settings.totalEnergyDeliveredMj.toFixed(1)} <span className="text-xs text-slate-400">mJ</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Threshold: ~0.8 mJ
          </div>
        </div>
      </div>

      {/* Energy Level (0.8 - 2.5 mJ) */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Burst Energy
          </span>
          <span className="font-mono font-bold text-rose-400 text-sm">
            {settings.energyMj.toFixed(1)} mJ
          </span>
        </div>
        <input
          type="range"
          min="0.8"
          max="2.5"
          step="0.1"
          value={settings.energyMj}
          onChange={(e) => onUpdateSettings({ energyMj: Number(e.target.value) })}
          className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0.8 mJ (Low)</span>
          <span>1.5 mJ (Typical)</span>
          <span>2.5 mJ (High)</span>
        </div>
      </div>

      {/* Pulse Mode (Single, Double, Triple) */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-1.5">
        <div className="text-slate-300 font-semibold">Pulse Multiplier</div>
        <div className="grid grid-cols-3 gap-1.5">
          {([1, 2, 3] as const).map(p => (
            <button
              key={p}
              onClick={() => onUpdateSettings({ pulseMode: p })}
              className={`py-1.5 rounded-lg font-mono text-center transition ${
                settings.pulseMode === p
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/50'
                  : 'bg-[#0f1b2c] text-slate-400 hover:bg-[#15253e]'
              }`}
            >
              {p === 1 ? '1: Single' : p === 2 ? '2: Double' : '3: Triple'}
            </button>
          ))}
        </div>
      </div>

      {/* Posterior Focal Offset Control (Crucial Clinical Parameter) */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
            Posterior Defocus Offset
          </span>
          <span className={`font-mono font-bold text-sm ${settings.focalOffsetMicrons < 90 ? 'text-red-400' : 'text-emerald-400'}`}>
            +{settings.focalOffsetMicrons} µm
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="350"
          step="10"
          value={settings.focalOffsetMicrons}
          onChange={(e) => onUpdateSettings({ focalOffsetMicrons: Number(e.target.value) })}
          className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
        />
        <div className="text-[10px] leading-tight text-slate-400">
          {settings.focalOffsetMicrons < 90 ? (
            <span className="text-rose-400 font-semibold">
              ⚠️ Inadequate offset! High risk of pitting the IOL optic.
            </span>
          ) : settings.focalOffsetMicrons > 300 ? (
            <span className="text-amber-400">
              ⚠️ Deep offset: shockwave may rupture anterior hyaloid face.
            </span>
          ) : (
            <span className="text-emerald-400">
              ✓ Optimal defocus (+100 to +250 µm) protects IOL optic.
            </span>
          )}
        </div>
      </div>

      {/* Slit-Lamp Controls: Slit Width & Angle */}
      <div className="bg-[#070c16] p-2.5 rounded-xl border border-[#17253a] space-y-2">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          Slit-Lamp Beam Optics
        </div>

        {/* Slit Beam Width */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Beam Width</span>
            <span className="font-mono text-sky-300">{settings.slitBeamWidthMm.toFixed(1)} mm</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="14.0"
            step="0.5"
            value={settings.slitBeamWidthMm}
            onChange={(e) => onUpdateSettings({ slitBeamWidthMm: Number(e.target.value) })}
            className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Slit Beam Angle */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Beam Angle</span>
            <span className="font-mono text-sky-300">{settings.slitBeamAngleDeg}°</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            step="5"
            value={settings.slitBeamAngleDeg}
            onChange={(e) => onUpdateSettings({ slitBeamAngleDeg: Number(e.target.value) })}
            className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* Abraham Contact Lens Toggle */}
        <button
          onClick={() => onUpdateSettings({ contactLensFitted: !settings.contactLensFitted })}
          className={`w-full py-1.5 rounded-lg border text-center font-medium transition ${
            settings.contactLensFitted
              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
              : 'bg-[#0f1b2c] border-[#1b2c47] text-slate-400'
          }`}
        >
          {settings.contactLensFitted ? 'Abraham Lens: Fitted (+66D Button)' : 'Attach Abraham Contact Lens'}
        </button>
      </div>

      {/* Complications & Safety Feedback */}
      <div className="space-y-1.5">
        {capsulotomy.iolPitsCount > 0 && (
          <div className="p-2 rounded-lg bg-rose-950/90 border border-rose-600 text-rose-200 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold">IOL Pitting Occurred: </span>
              {capsulotomy.iolPitsCount} pit(s) identified on optic surface.
            </div>
          </div>
        )}

        {!capsulotomy.vitreousFaceIntact && (
          <div className="p-2 rounded-lg bg-red-950/90 border border-red-500 text-white text-[11px] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="font-bold">Anterior Hyaloid Breakthrough: </span>
              Vitreous face disrupted by deep shockwave.
            </div>
          </div>
        )}
      </div>

      {/* Reset Laser Button */}
      <button
        onClick={onResetLaser}
        className="mt-auto py-2 rounded-lg bg-[#0d1626] hover:bg-[#15233c] border border-[#1e2f4a] text-slate-300 hover:text-white font-medium transition text-center"
      >
        Reset Laser Shot Log
      </button>
    </div>
  );
};
