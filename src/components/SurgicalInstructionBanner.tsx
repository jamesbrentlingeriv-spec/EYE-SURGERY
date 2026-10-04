import React, { useEffect, useState } from 'react';
import { SurgicalStepInstruction } from '../data/surgicalInstructions';
import { ttsEngine } from '../audio/TtsNarrator';
import {
  Volume2,
  Play,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Radio,
  Minimize2,
  Maximize2,
  Crosshair,
  Wrench,
  HelpCircle,
  Compass
} from 'lucide-react';

interface SurgicalInstructionBannerProps {
  currentInstruction: SurgicalStepInstruction;
  onSelectInstrument?: (instrument: string) => void;
  showGuides?: boolean;
  onToggleGuides?: () => void;
}

export const SurgicalInstructionBanner: React.FC<SurgicalInstructionBannerProps> = ({
  currentInstruction,
  onSelectInstrument,
  showGuides = true,
  onToggleGuides
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoNarrate, setAutoNarrate] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true);

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
      const timer = setTimeout(() => {
        ttsEngine.speak(currentInstruction.spokenScript, false, currentInstruction.id);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentInstruction.id, autoNarrate]);

  const toggleSpeak = () => {
    if (isSpeaking) {
      ttsEngine.stop();
    } else {
      ttsEngine.speak(currentInstruction.spokenScript, true, currentInstruction.id);
    }
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    ttsEngine.setRate(rate);
  };

  const toolDisplayNames: Record<string, string> = {
    mvr_blade: '1.0mm MVR Blade',
    keratome_2_4: '2.4mm Keratome Blade',
    ovd_viscoat: 'Viscoat Protective Jelly',
    ovd_provisc: 'Provisc Cohesive Jelly',
    cystotome: 'Needle Cystotome',
    utrata_forceps: 'Utrata Micro-Forceps',
    hydro_cannula: 'Hydrodissection Cannula',
    phaco_tip: 'Phaco Ultrasound Needle',
    ia_handpiece: 'Irrigation & Suction Wand',
    iol_injector: 'Foldable IOL Injector',
    sinskey_hook: 'Sinskey Dialing Hook',
    yag_laser: 'Nd:YAG Q-Switched Laser',
    none: 'Hands Free'
  };

  return (
    <div className="absolute top-2 left-2 right-2 sm:right-auto sm:top-3 sm:left-3 sm:max-w-lg md:max-w-xl z-20 bg-[#0b1220]/95 backdrop-blur-md rounded-2xl border border-[#1e2f4a] shadow-2xl text-xs text-slate-200 select-none overflow-hidden transition-all duration-300">
      {/* Minimized Pill View */}
      {isMinimized ? (
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-bold shrink-0">
              STEP {currentInstruction.stepNumber}
            </span>
            <span className="font-bold text-white text-xs truncate">
              {isBeginnerMode ? currentInstruction.beginnerTitle : currentInstruction.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleSpeak}
              className={`p-1.5 rounded-lg font-bold text-xs transition ${
                isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-cyan-600 text-white'
              }`}
              title={isSpeaking ? 'Stop Voice' : 'Read Aloud'}
            >
              {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-300 transition"
              title="Expand Instructions HUD"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Banner Row */}
          <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-3 bg-gradient-to-r from-[#0d1728] via-[#0e1c33] to-[#0d1728] border-b border-[#1b2b44]">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {/* Speaker Indicator */}
              <button
                onClick={toggleSpeak}
                className={`p-1.5 sm:p-2 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                  isSpeaking
                    ? 'bg-rose-950 border-rose-400 text-rose-300 shadow-md shadow-rose-900/50 animate-pulse'
                    : 'bg-[#101b2e] border-[#1c2c44] text-slate-400 hover:text-cyan-300'
                }`}
                title={isSpeaking ? 'Stop Spoken Voice' : 'Play Attending Voice Narration'}
              >
                {isSpeaking ? (
                  <div className="flex items-center gap-0.5 h-3.5 sm:h-4">
                    <span className="w-1 bg-rose-400 rounded-full animate-bounce h-2.5 sm:h-3"></span>
                    <span className="w-1 bg-rose-400 rounded-full animate-bounce h-3.5 sm:h-4 delay-100"></span>
                    <span className="w-1 bg-rose-400 rounded-full animate-bounce h-2 delay-200"></span>
                  </div>
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                    STEP {currentInstruction.stepNumber}
                  </span>
                  <span className="font-bold text-white text-xs sm:text-[13px] truncate">
                    {isBeginnerMode ? currentInstruction.beginnerTitle : currentInstruction.title}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-cyan-300 font-medium truncate mt-0.5">
                  {currentInstruction.beginnerSummary}
                </div>
              </div>
            </div>

            {/* Mode Controls & Banner Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Beginner vs Pro Mode Toggle */}
              <button
                onClick={() => setIsBeginnerMode(!isBeginnerMode)}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
                  isBeginnerMode
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                    : 'bg-[#101b2e] border-[#1b2b44] text-slate-400'
                }`}
                title={isBeginnerMode ? 'Beginner Guide Mode Active (Simple Plain English)' : 'Clinical Specialist Mode Active'}
              >
                <span>{isBeginnerMode ? 'Beginner' : 'Surgeon'}</span>
              </button>

              {/* On-screen target guides toggle */}
              {onToggleGuides && (
                <button
                  onClick={onToggleGuides}
                  className={`p-1.5 rounded-lg border text-[10px] transition ${
                    showGuides
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-[#101b2e] border-[#1b2b44] text-slate-500'
                  }`}
                  title={showGuides ? 'Visual Target Guidance is ON' : 'Visual Target Guidance is OFF'}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Expand Details Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 sm:p-1.5 rounded-xl bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-300 transition"
                title="Expand Anatomical Details & Why It's Necessary"
              >
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              {/* Minimize to small floating pill button */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 sm:p-1.5 rounded-xl bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-300 transition"
                title="Minimize Banner"
              >
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* High-Visibility Action Guide Box (What to do right now) */}
          <div className="p-3 bg-gradient-to-r from-amber-950/30 via-[#0a1426] to-[#071120] border-b border-[#1a2d48] space-y-2">
            <div className="flex items-start gap-2">
              <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                  WHAT TO DO RIGHT NOW:
                </div>
                <div className="text-xs text-white font-medium leading-relaxed mt-0.5">
                  {currentInstruction.actionCallout}
                </div>
              </div>
            </div>

            {/* Target Location & Recommended Tool Bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[#13233a] text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Crosshair className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-slate-400 text-[10px]">Target:</span>
                <span className="text-cyan-200 font-medium text-[11px] truncate max-w-[200px] xs:max-w-none">
                  {currentInstruction.targetLocationDescription}
                </span>
              </div>

              {/* Tool Quick-Select Button */}
              {onSelectInstrument && currentInstruction.recommendedInstrument !== 'none' && (
                <button
                  onClick={() => onSelectInstrument(currentInstruction.recommendedInstrument)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-[10px] font-mono font-semibold transition active:scale-95 shadow-sm"
                  title="Click to automatically equip this instrument"
                >
                  <Wrench className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Select {toolDisplayNames[currentInstruction.recommendedInstrument] || currentInstruction.recommendedInstrument}</span>
                </button>
              )}
            </div>
          </div>

          {/* "Why It's Necessary" Callout */}
          <div className="p-2.5 sm:p-3 bg-[#070e1c] border-b border-[#162338] text-[11px] leading-relaxed text-slate-300 flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-300 mr-1">Why this is necessary:</span>
              <span className="text-slate-300">{currentInstruction.whyItsNecessary}</span>
            </div>
          </div>

          {/* Expandable Comprehensive Details: Anatomy, Technique, Hazards */}
          {isExpanded && (
            <div className="p-3.5 bg-[#050b16] space-y-3 text-[11px] border-t border-[#162338] animate-fadeIn max-h-[350px] overflow-y-auto">
              {/* Detailed Incision & Tissue Anatomy */}
              {currentInstruction.detailedAnatomy && (
                <div className="bg-[#0b1424] p-2.5 rounded-xl border border-[#1b2f4c] space-y-1.5">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Micro-Surgical Anatomy & Wound Architecture:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-400">Target Tissue: </span>
                      <span className="text-slate-200">{currentInstruction.detailedAnatomy.tissueTarget}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Instrument / Calibration: </span>
                      <span className="text-slate-200">{currentInstruction.detailedAnatomy.instrumentDepthOrSize}</span>
                    </div>
                  </div>
                  <div className="text-slate-300 text-[10.5px] pt-1 border-t border-[#16253c]">
                    <span className="font-semibold text-cyan-400">Biomechanics: </span>
                    {currentInstruction.detailedAnatomy.biomechanicsExplanation}
                  </div>
                </div>
              )}

              {/* Technique Pearls */}
              <div className="space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  Surgical Pearls & Best Practices:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                  {currentInstruction.techniquePearls.map((pearl, idx) => (
                    <li key={idx}>{pearl}</li>
                  ))}
                </ul>
              </div>

              {/* Hazards & Complication Prevention */}
              <div className="space-y-1 pt-1.5 border-t border-[#132034]">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Hazards & What Happens If You Do It Wrong:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-rose-200/90">
                  {currentInstruction.hazards.map((hazard, idx) => (
                    <li key={idx}>{hazard}</li>
                  ))}
                </ul>
              </div>

              {/* Audio Controls */}
              <div className="pt-2 border-t border-[#132034] flex items-center justify-between text-slate-400 text-[10px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const next = !autoNarrate;
                      setAutoNarrate(next);
                      ttsEngine.setAutoNarrate(next);
                    }}
                    className={`px-2 py-0.5 rounded border text-[10px] font-medium transition flex items-center gap-1 ${
                      autoNarrate
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                        : 'bg-[#101b2e] border-[#1b2b44] text-slate-400'
                    }`}
                  >
                    <Radio className="w-2.5 h-2.5" />
                    <span>Auto-Voice: {autoNarrate ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span>Speed:</span>
                  <span className="font-mono text-cyan-300">{speechRate.toFixed(2)}x</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.25"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => handleRateChange(Number(e.target.value))}
                    className="w-20 accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
