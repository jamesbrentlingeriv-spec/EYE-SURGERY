import React, { useEffect } from 'react';
import { FootPedalPosition } from '../types/ophthalmic';
import { audioEngine } from '../audio/SoundSynthesizer';
import { Disc, Waves, Wind, Zap } from 'lucide-react';

interface FootPedalControlProps {
  pedalPosition: FootPedalPosition;
  onPedalChange: (pos: FootPedalPosition) => void;
  disabled?: boolean;
}

export const FootPedalControl: React.FC<FootPedalControlProps> = ({
  pedalPosition,
  onPedalChange,
  disabled = false,
}) => {
  // Listen for keyboard controls (0, 1, 2, 3, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '0' || e.code === 'Digit0') {
        onPedalChange(0);
        audioEngine.playPedalClick(0);
      } else if (e.key === '1' || e.code === 'Digit1') {
        onPedalChange(1);
        audioEngine.playPedalClick(1);
      } else if (e.key === '2' || e.code === 'Digit2') {
        onPedalChange(2);
        audioEngine.playPedalClick(2);
      } else if (e.key === '3' || e.code === 'Digit3') {
        onPedalChange(3);
        audioEngine.playPedalClick(3);
      } else if (e.code === 'Space') {
        e.preventDefault();
        // Cycle pedal position forward or toggle Pos 1
        const nextPos = ((pedalPosition + 1) % 4) as FootPedalPosition;
        onPedalChange(nextPos);
        audioEngine.playPedalClick(nextPos);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pedalPosition, onPedalChange, disabled]);

  const setPos = (pos: FootPedalPosition) => {
    if (disabled) return;
    onPedalChange(pos);
    audioEngine.playPedalClick(pos);
  };

  return (
    <div className="bg-[#000000] border-t border-[#1b2b44] p-2 sm:p-3 flex items-center justify-between text-xs select-none gap-2">
      {/* Pedal Visual & Detents */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-initial">
        <div className="hidden lg:flex flex-col">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            SURGEON DUAL-PEDAL
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Keys: [0] Idle | [1] Irrig | [2] Asp | [3] Phaco | [Space] Cycle
          </span>
        </div>

        {/* 4 Position Buttons - Equal 4 columns on mobile for easy thumb tapping */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 bg-[#070c16] p-1 rounded-xl border border-[#17253a] w-full sm:w-auto">
          {/* Pos 0 */}
          <button
            onClick={() => setPos(0)}
            className={`px-1.5 py-2 sm:px-3 sm:py-1.5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 font-medium transition text-center min-h-[44px] active:scale-95 ${
              pedalPosition === 0
                ? 'bg-slate-700 text-white shadow-inner font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#121f33]'
            }`}
          >
            <Disc className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Standby</span>
          </button>

          {/* Pos 1 */}
          <button
            onClick={() => setPos(1)}
            className={`px-1.5 py-2 sm:px-3 sm:py-1.5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 font-medium transition text-center min-h-[44px] active:scale-95 ${
              pedalPosition === 1
                ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50 font-bold'
                : 'text-slate-400 hover:text-sky-300 hover:bg-[#121f33]'
            }`}
          >
            <Waves className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Irrig</span>
          </button>

          {/* Pos 2 */}
          <button
            onClick={() => setPos(2)}
            className={`px-1.5 py-2 sm:px-3 sm:py-1.5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 font-medium transition text-center min-h-[44px] active:scale-95 ${
              pedalPosition === 2
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/50 font-bold'
                : 'text-slate-400 hover:text-teal-300 hover:bg-[#121f33]'
            }`}
          >
            <Wind className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Asp</span>
          </button>

          {/* Pos 3 */}
          <button
            onClick={() => setPos(3)}
            className={`px-1.5 py-2 sm:px-3 sm:py-1.5 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 font-medium transition text-center min-h-[44px] active:scale-95 ${
              pedalPosition === 3
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50 font-bold animate-pulse'
                : 'text-slate-400 hover:text-amber-300 hover:bg-[#121f33]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">Phaco</span>
          </button>
        </div>
      </div>

      {/* Live Pedal Angle Depth Meter (Hidden on very small screens, visible on sm+) */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right">
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono">TRAVEL</div>
          <div className="text-xs sm:text-sm font-bold font-mono text-cyan-300">
            {pedalPosition === 0 ? '0%' : pedalPosition === 1 ? '33%' : pedalPosition === 2 ? '66%' : '100%'}
          </div>
        </div>

        {/* 3D-styled physical pedal bar */}
        <div className="w-16 sm:w-24 h-3.5 sm:h-4 bg-[#070c16] rounded-full border border-[#17253a] p-0.5 relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              pedalPosition === 0
                ? 'w-1 bg-slate-500'
                : pedalPosition === 1
                ? 'w-1/3 bg-sky-500'
                : pedalPosition === 2
                ? 'w-2/3 bg-teal-500'
                : 'w-full bg-amber-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
