import React, { useEffect, useState, useRef } from 'react';
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
  Crosshair,
  Wrench,
  HelpCircle,
  Compass,
  X
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
  const [autoNarrate, setAutoNarrate] = useState<boolean>(() => {
    const saved = localStorage.getItem('rhexis_voice_autoplay');
    return saved !== null ? saved === 'true' : true;
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentInstruction.id, autoNarrate]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

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
    <div
      ref={dropdownRef}
      className="relative flex items-center gap-1.5 sm:gap-2 bg-[#091120] border border-emerald-900/60 hover:border-emerald-700/60 rounded-xl px-2 py-1 text-xs text-slate-200 select-none shadow-sm transition max-w-full"
    >
      {/* Speaker / Voice Play-Stop Toggle */}
      <button
        onClick={toggleSpeak}
        className={`p-1 sm:p-1.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
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

      {/* Step Pill */}
      <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-1.5 py-0.5 rounded font-bold shrink-0">
        STEP {currentInstruction.stepNumber}
      </span>

      {/* Step Title & Instruction Text */}
      <div className="min-w-0 flex items-center gap-1 truncate text-xs">
        <span className="font-bold text-white shrink-0 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[170px] md:max-w-[210px]">
          {isBeginnerMode ? currentInstruction.beginnerTitle : currentInstruction.title}
        </span>
        <span className="text-emerald-400/80 hidden lg:inline truncate">
          - {currentInstruction.actionCallout}
        </span>
      </div>

      {/* Recommended Tool Quick-Select */}
      {onSelectInstrument && currentInstruction.recommendedInstrument !== 'none' && (
        <button
          onClick={() => onSelectInstrument(currentInstruction.recommendedInstrument)}
          className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono font-semibold transition shrink-0 shadow-sm"
          title="Equip recommended instrument"
        >
          <Wrench className="w-2.5 h-2.5 text-emerald-400" />
          <span className="truncate max-w-[85px]">
            {toolDisplayNames[currentInstruction.recommendedInstrument] || currentInstruction.recommendedInstrument}
          </span>
        </button>
      )}

      {/* Expand / Details Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border text-[10px] font-medium transition shrink-0 ${
          isExpanded
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
            : 'bg-[#101b2e] hover:bg-[#16253c] border-[#1b2b44] text-slate-300'
        }`}
        title="Toggle Full Surgical Guidance Details"
      >
        <span>Details</span>
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Dropdown Floating Details Drawer */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-[92vw] sm:w-[500px] md:w-[560px] max-w-lg bg-[#000000] border-2 border-emerald-600/80 rounded-2xl shadow-2xl p-3.5 space-y-3 text-[11px] z-50 text-slate-200 animate-fadeIn max-h-[460px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1b2b44] pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-2 py-0.5 rounded font-bold shrink-0">
                STEP {currentInstruction.stepNumber}
              </span>
              <span className="font-bold text-white text-xs truncate">
                {isBeginnerMode ? currentInstruction.beginnerTitle : currentInstruction.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={toggleSpeak}
                className={`p-1.5 rounded-lg border text-xs font-bold transition ${
                  isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={isSpeaking ? 'Stop Voice' : 'Read Aloud'}
              >
                {isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg bg-[#101b2e] hover:bg-[#1b2b44] text-slate-400 hover:text-white transition"
                title="Close Details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action callout banner */}
          <div className="p-2 bg-[#091528] rounded-lg border border-emerald-800/60 text-emerald-300 font-medium">
            {currentInstruction.actionCallout}
          </div>

          {/* Target Location & Recommended Tool */}
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
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-[10px] font-mono font-semibold transition shadow-sm active:scale-95"
              >
                <Wrench className="w-2.5 h-2.5 text-emerald-400" />
                <span>Select {toolDisplayNames[currentInstruction.recommendedInstrument] || currentInstruction.recommendedInstrument}</span>
              </button>
            )}
          </div>

          {/* "Why It's Necessary" Callout */}
          <div className="p-2.5 bg-[#081224] rounded-lg border border-[#15233c] text-[11px] leading-relaxed text-slate-300 flex items-start gap-2">
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
          <div className="space-y-1 bg-[#091122] p-2.5 rounded-lg border border-[#17253d]">
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
          <div className="space-y-1 bg-[#170a10] p-2.5 rounded-lg border border-rose-950">
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

          {/* Mode & Visual Guide Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#16253c]">
            <div className="flex items-center gap-1.5">
              {/* Beginner / Surgeon toggle */}
              <button
                onClick={() => setIsBeginnerMode(!isBeginnerMode)}
                className={`px-2 py-0.5 rounded border text-[10px] font-bold transition ${
                  isBeginnerMode
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                    : 'bg-[#101b2e] border-[#1b2b44] text-slate-400'
                }`}
                title={isBeginnerMode ? 'Mode: Beginner' : 'Mode: Surgeon'}
              >
                {isBeginnerMode ? 'Beginner Mode' : 'Surgeon Mode'}
              </button>

              {/* On-screen target guides toggle */}
              {onToggleGuides && (
                <button
                  onClick={onToggleGuides}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition ${
                    showGuides
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-[#101b2e] border-[#1b2b44] text-slate-500'
                  }`}
                  title={showGuides ? 'Visual Target Guidance is ON' : 'Visual Target Guidance is OFF'}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Target Guides: {showGuides ? 'ON' : 'OFF'}</span>
                </button>
              )}
            </div>

            {/* Audio Auto-Voice & Speed Controls */}
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <button
                onClick={() => {
                  const next = !autoNarrate;
                  setAutoNarrate(next);
                  localStorage.setItem('rhexis_voice_autoplay', String(next));
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

              <div className="flex items-center gap-1.5">
                <span>Speed:</span>
                <span className="font-mono text-emerald-300">{speechRate.toFixed(2)}x</span>
                <input
                  type="range"
                  min="0.8"
                  max="1.25"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => handleRateChange(Number(e.target.value))}
                  className="w-16 accent-emerald-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
