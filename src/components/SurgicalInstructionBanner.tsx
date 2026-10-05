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
    keratome_2_4: '2.4mm Keratome',
    ovd_viscoat: 'Viscoat Jelly',
    ovd_provisc: 'Provisc Jelly',
    cystotome: 'Cystotome',
    utrata_forceps: 'Utrata Forceps',
    hydro_cannula: 'Hydro Cannula',
    phaco_tip: 'Phaco Tip',
    ia_handpiece: 'I/A Handpiece',
    iol_injector: 'IOL Injector',
    sinskey_hook: 'Sinskey Hook',
    yag_laser: 'Nd:YAG Laser',
    none: 'Hands Free'
  };

  return (
    <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-[96%] sm:w-[92%] max-w-xl md:max-w-2xl z-20 bg-[#0b1220]/95 backdrop-blur-md rounded-xl border border-emerald-600/40 shadow-2xl text-xs text-slate-200 select-none overflow-hidden transition-all duration-300">
      {/* Minimized Pill View */}
      {isMinimized ? (
        <div className="px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-1.5 py-0.5 rounded font-bold shrink-0">
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
                isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
              }`}
              title={isSpeaking ? 'Stop Voice' : 'Read Aloud'}
            >
              {isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-300 transition"
              title="Expand Instructions HUD"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sleek Compact Single-Line HUD Strip */}
          <div className="px-3 py-2 flex items-center justify-between gap-2 bg-gradient-to-r from-[#0d1728] via-[#0e1c33] to-[#0d1728]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Speaker Indicator */}
              <button
                onClick={toggleSpeak}
                className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  isSpeaking
                    ? 'bg-rose-950 border-rose-400 text-rose-300 shadow-md shadow-rose-900/50 animate-pulse'
                    : 'bg-[#101b2e] border-[#1c2c44] text-slate-400 hover:text-emerald-300'
                }`}
                title={isSpeaking ? 'Stop Spoken Voice' : 'Play Attending Voice Narration'}
              >
                {isSpeaking ? (
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 bg-rose-400 rounded-full animate-bounce h-2"></span>
                    <span className="w-0.5 bg-rose-400 rounded-full animate-bounce h-3 delay-100"></span>
                    <span className="w-0.5 bg-rose-400 rounded-full animate-bounce h-1.5 delay-200"></span>
                  </div>
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-1.5 py-0.5 rounded font-bold shrink-0">
                STEP {currentInstruction.stepNumber}
              </span>

              <div className="min-w-0 flex items-center gap-1.5 truncate">
                <span className="font-bold text-white text-xs shrink-0">
                  {isBeginnerMode ? currentInstruction.beginnerTitle : currentInstruction.title}:
                </span>
                <span className="text-emerald-300 text-xs font-medium truncate">
                  {currentInstruction.actionCallout}
                </span>
              </div>

              {/* Recommended Tool Quick-Select */}
              {onSelectInstrument && currentInstruction.recommendedInstrument !== 'none' && (
                <button
                  onClick={() => onSelectInstrument(currentInstruction.recommendedInstrument)}
                  className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono font-semibold transition shrink-0 active:scale-95 shadow-sm"
                  title="Equip recommended instrument"
                >
                  <Wrench className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="truncate max-w-[110px]">
                    {toolDisplayNames[currentInstruction.recommendedInstrument] || currentInstruction.recommendedInstrument}
                  </span>
                </button>
              )}
            </div>

            {/* Right-Hand Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Beginner / Surgeon toggle */}
              <button
                onClick={() => setIsBeginnerMode(!isBeginnerMode)}
                className={`hidden sm:inline-flex px-1.5 py-0.5 rounded border text-[10px] font-bold transition ${
                  isBeginnerMode
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                    : 'bg-[#101b2e] border-[#1b2b44] text-slate-400'
                }`}
                title={isBeginnerMode ? 'Mode: Beginner' : 'Mode: Surgeon'}
              >
                {isBeginnerMode ? 'Beginner' : 'Surgeon'}
              </button>

              {/* On-screen target guides toggle */}
              {onToggleGuides && (
                <button
                  onClick={onToggleGuides}
                  className={`p-1.5 rounded-lg border text-[10px] transition ${
                    showGuides
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
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
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium transition ${
                  isExpanded
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-[#101b2e] hover:bg-[#16253c] border-[#1b2b44] text-slate-300'
                }`}
                title="Expand Anatomical Guidance & Details"
              >
                <span>Details</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Minimize to small floating pill button */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-400 hover:text-slate-200 transition"
                title="Minimize Banner"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Expandable Comprehensive Details Drawer */}
          {isExpanded && (
            <div className="p-3 bg-[#050b16] space-y-2.5 text-[11px] border-t border-[#162338] animate-fadeIn max-h-[360px] overflow-y-auto">
              {/* Target Location & Recommended Tool Bar */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-[#091122] rounded-lg border border-[#17253d]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Compass className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 text-[10px]">Target:</span>
                  <span className="text-emerald-200 font-medium text-[11px]">
                    {currentInstruction.targetLocationDescription}
                  </span>
                </div>

                {onSelectInstrument && currentInstruction.recommendedInstrument !== 'none' && (
                  <button
                    onClick={() => onSelectInstrument(currentInstruction.recommendedInstrument)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono font-semibold transition shadow-sm"
                  >
                    <Wrench className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Select {toolDisplayNames[currentInstruction.recommendedInstrument] || currentInstruction.recommendedInstrument}</span>
                  </button>
                )}
              </div>

              {/* "Why It's Necessary" Callout */}
              <div className="p-2 bg-[#081224] rounded-lg border border-[#15233c] text-[11px] leading-relaxed text-slate-300 flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-400 mr-1">Why this is necessary:</span>
                  <span className="text-slate-300">{currentInstruction.whyItsNecessary}</span>
                </div>
              </div>

              {/* Detailed Incision & Tissue Anatomy */}
              {currentInstruction.detailedAnatomy && (
                <div className="bg-[#0b1424] p-2.5 rounded-lg border border-emerald-900/60 space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
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
                    <span className="font-semibold text-emerald-400">Biomechanics: </span>
                    {currentInstruction.detailedAnatomy.biomechanicsExplanation}
                  </div>
                </div>
              )}

              {/* Technique Pearls */}
              <div className="space-y-1 bg-[#091122] p-2 rounded-lg border border-[#17253d]">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  Surgical Pearls & Best Practices:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-300 text-[10.5px]">
                  {currentInstruction.techniquePearls.map((pearl, idx) => (
                    <li key={idx}>{pearl}</li>
                  ))}
                </ul>
              </div>

              {/* Hazards & Complication Prevention */}
              <div className="space-y-1 bg-[#170a10] p-2 rounded-lg border border-rose-950">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Hazards & What Happens If You Do It Wrong:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-rose-200/90 text-[10.5px]">
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
                  <span className="font-mono text-emerald-300">{speechRate.toFixed(2)}x</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.25"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => handleRateChange(Number(e.target.value))}
                    className="w-20 accent-emerald-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
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
