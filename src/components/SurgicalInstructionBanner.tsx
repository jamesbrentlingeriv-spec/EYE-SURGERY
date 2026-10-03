import React, { useEffect, useState } from 'react';
import { SurgicalStepInstruction } from '../data/surgicalInstructions';
import { ttsEngine } from '../audio/TtsNarrator';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Radio,
  Sliders
} from 'lucide-react';

interface SurgicalInstructionBannerProps {
  currentInstruction: SurgicalStepInstruction;
  onSelectInstrument?: (instrument: string) => void;
}

export const SurgicalInstructionBanner: React.FC<SurgicalInstructionBannerProps> = ({
  currentInstruction,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoNarrate, setAutoNarrate] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);

  // Subscribe to TTS speaking state
  useEffect(() => {
    const unsubscribe = ttsEngine.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsubscribe();
  }, []);

  // When step changes, read aloud if autoNarrate is enabled
  useEffect(() => {
    if (autoNarrate && currentInstruction) {
      // Small delay to allow audio context transition
      const timer = setTimeout(() => {
        ttsEngine.speak(currentInstruction.spokenScript);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentInstruction.id, autoNarrate]);

  const toggleSpeak = () => {
    if (isSpeaking) {
      ttsEngine.stop();
    } else {
      ttsEngine.speak(currentInstruction.spokenScript, true);
    }
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    ttsEngine.setRate(rate);
  };

  return (
    <div className="absolute top-4 left-4 z-20 max-w-xl w-full bg-[#0b1220]/95 backdrop-blur-md rounded-2xl border border-[#1e2f4a] shadow-2xl text-xs text-slate-200 select-none overflow-hidden transition-all duration-300">
      {/* Top Banner Row */}
      <div className="p-3.5 flex items-center justify-between gap-3 bg-gradient-to-r from-[#0d1728] via-[#0e1c33] to-[#0d1728] border-b border-[#1b2b44]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Speaker Indicator */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
              isSpeaking
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-900/50'
                : 'bg-[#101b2e] border-[#1c2c44] text-slate-400'
            }`}
          >
            {isSpeaking ? (
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3"></span>
                <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-4 delay-100"></span>
                <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-2 delay-200"></span>
              </div>
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                STEP {currentInstruction.stepNumber}
              </span>
              <span className="font-bold text-white text-xs truncate">
                {currentInstruction.title}
              </span>
            </div>
            <div className="text-[11px] text-cyan-300/80 font-medium truncate mt-0.5">
              Target: {currentInstruction.clinicalObjective}
            </div>
          </div>
        </div>

        {/* TTS Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Play/Stop Spoken Narration Button */}
          <button
            onClick={toggleSpeak}
            title={isSpeaking ? 'Stop Voice Narration' : 'Read Instruction Aloud (TTS)'}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shadow-md ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
            }`}
          >
            {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud'}</span>
          </button>

          {/* Auto Narration Toggle */}
          <button
            onClick={() => {
              const next = !autoNarrate;
              setAutoNarrate(next);
              ttsEngine.setAutoNarrate(next);
            }}
            title={autoNarrate ? 'Auto-Voice Enabled: Automatically reads each step' : 'Auto-Voice Disabled'}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition flex items-center gap-1 ${
              autoNarrate
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : 'bg-[#101b2e] border-[#1b2b44] text-slate-400'
            }`}
          >
            <Radio className={`w-3 h-3 ${autoNarrate ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Auto: {autoNarrate ? 'ON' : 'OFF'}</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-300 transition"
            title="Expand Clinical Pearls & Hazards"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Spoken Script Live Transcript */}
      <div className="p-3 bg-[#080f1c]/90 text-[11px] text-slate-300 leading-relaxed font-sans border-b border-[#162338]">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="italic text-slate-200">
            "{currentInstruction.spokenScript}"
          </p>
        </div>
      </div>

      {/* Expandable Clinical Details (Pearls & Hazards) */}
      {isExpanded && (
        <div className="p-3.5 bg-[#060c17] space-y-2.5 text-[11px] border-t border-[#162338] animate-fadeIn">
          {/* Technique Pearls */}
          <div className="space-y-1">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-cyan-300" />
              Surgical Technique & Vector Pearls:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
              {currentInstruction.techniquePearls.map((pearl, idx) => (
                <li key={idx}>{pearl}</li>
              ))}
            </ul>
          </div>

          {/* Hazards & Complication Prevention */}
          <div className="space-y-1 pt-1.5 border-t border-[#132034]">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Hazards to Avoid:
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
              {currentInstruction.hazards.map((hazard, idx) => (
                <li key={idx} className="text-amber-200/90">{hazard}</li>
              ))}
            </ul>
          </div>

          {/* Voice Speech Speed Slider */}
          <div className="pt-2 border-t border-[#132034] flex items-center justify-between text-slate-400 text-[10px]">
            <span>Voice Cadence:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{speechRate.toFixed(2)}x</span>
              <input
                type="range"
                min="0.8"
                max="1.25"
                step="0.05"
                value={speechRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="w-24 accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
