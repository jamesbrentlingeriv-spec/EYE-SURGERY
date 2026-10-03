import React, { useEffect, useState } from 'react';
import {
  SurgicalModule,
  PhacoStep,
  IolStep,
  YagStep,
  FluidicsState,
  PatientVitals
} from '../types/ophthalmic';
import {
  Heart,
  Droplets,
  Zap,
  Timer,
  HelpCircle,
  FileText,
  Volume2,
  VolumeX,
  Download,
  Menu,
  Gauge,
  Activity
} from 'lucide-react';
import { audioEngine } from '../audio/SoundSynthesizer';
import { InstrumentType } from '../types/ophthalmic';

interface TopVitalsBarProps {
  module: SurgicalModule;
  phacoStep: PhacoStep;
  iolStep: IolStep;
  yagStep: YagStep;
  fluidics: FluidicsState;
  cde: number;
  vitals: PatientVitals;
  elapsedSeconds: number;
  onOpenReport: () => void;
  onOpenReference: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleTools: () => void;
  isToolsOpen?: boolean;
  onToggleConsole?: () => void;
  isConsoleOpen?: boolean;
  activeInstrument?: InstrumentType;
}

export const TopVitalsBar: React.FC<TopVitalsBarProps> = ({
  module,
  phacoStep,
  iolStep,
  yagStep,
  fluidics,
  cde,
  vitals,
  elapsedSeconds,
  onOpenReport,
  onOpenReference,
  isMuted,
  onToggleMute,
  onToggleTools,
  isToolsOpen = false,
  onToggleConsole,
  isConsoleOpen = false,
  activeInstrument = 'mvr_blade',
}) => {
  const [pulse, setPulse] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  // PWA Install prompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('PWA Ready: You can install this app directly from your browser toolbar via "Install App" or "Add to Home Screen".');
    }
  };

  // Synchronized pulse indicator
  useEffect(() => {
    const intervalMs = (60 / vitals.heartRate) * 1000;
    const timer = setInterval(() => {
      setPulse(true);
      if (!isMuted) {
        audioEngine.playTelemetryHeartbeat();
      }
      setTimeout(() => setPulse(false), 160);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [vitals.heartRate, isMuted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStepTitle = () => {
    if (module === 'phaco') {
      const stepLabels: Record<PhacoStep, string> = {
        paracentesis: 'Step 1: Paracentesis (~1.0mm MVR)',
        clear_corneal_incision: 'Step 2: Clear Corneal Incision (2.4mm Tri-planar)',
        ovd_injection: 'Step 3: OVD Injection (Viscoat / Provisc)',
        capsulorhexis: 'Step 4: Continuous Curvilinear Capsulorhexis (CCC)',
        hydrodissection: 'Step 5: Hydrodissection & Rotation Test',
        phaco_chop: 'Step 6: Phaco-Chop Nucleofractis & Aspiration',
        cortex_removal: 'Step 7: Cortical Remnant Clearance (I/A)'
      };
      return stepLabels[phacoStep];
    } else if (module === 'iol') {
      const stepLabels: Record<IolStep, string> = {
        ovd_bag_refill: 'Step 1: Bag Refill with Cohesive OVD',
        cartridge_insertion: 'Step 2: Cartridge Delivery into Bag',
        haptic_unfolding: 'Step 3: Leading Haptic Placement',
        sinskey_dialing: 'Step 4: Sinskey Hook 360° Rotational Centering',
        viscoelastic_washout: 'Step 5: Retro-lens & AC Viscoelastic Washout'
      };
      return stepLabels[iolStep];
    } else {
      const stepLabels: Record<YagStep, string> = {
        contact_lens_placement: 'Step 1: Abraham Capsulotomy Lens Placement',
        aiming_focus: 'Step 2: Dual HeNe Aiming Beam Convergence',
        offset_adjustment: 'Step 3: Posterior Focal Offset (+150µm)',
        cruciate_capsulotomy: 'Step 4: Cruciate Pattern Laser Breakdown',
        post_yag_assessment: 'Step 5: PCO Visual Axis Clearance & IOP Check'
      };
      return stepLabels[yagStep];
    }
  };

  return (
    <header className="h-14 bg-[#0a101d] border-b border-[#1b2b44] px-2 sm:px-4 flex items-center justify-between text-xs text-slate-300 select-none shadow-md z-30 relative gap-2">
      {/* Left: Hamburger Tools Menu + Branding */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Hamburger Menu Button for Surgical Tools */}
        <button
          onClick={onToggleTools}
          title="Toggle Surgical Tools Menu (Hamburger)"
          aria-label="Toggle Surgical Tools Menu"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm active:scale-95 ${
            isToolsOpen
              ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-900/50'
              : 'bg-[#0e1726] hover:bg-[#16253c] border-cyan-800/80 text-cyan-300 hover:border-cyan-500'
          }`}
        >
          <Menu className="w-4 h-4 shrink-0" />
          <span className="text-[11px] sm:text-xs">Tools</span>
        </button>

        {/* Branding & App Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 sm:pr-3 sm:border-r border-[#1b2b44]">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse hidden xs:inline-block"></span>
          <span className="font-bold tracking-wide text-white text-xs sm:text-sm">
            <span className="hidden sm:inline">SURGICAL SIMULATOR</span>
            <span className="sm:hidden">EYE SIM</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded hidden sm:inline-block">
            PWA
          </span>
        </div>

        {/* Desktop / Tablet Step Title */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-slate-400 font-medium">Phase:</span>
          <span className="font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] truncate max-w-[200px] xl:max-w-none">
            {getStepTitle()}
          </span>
        </div>
      </div>

      {/* Center: Live Telemetry (Responsive) */}
      <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0 overflow-hidden">
        {/* IOP Monitor (Always shown) */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
          <Droplets className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
          <span className="text-slate-400 text-[10px] hidden sm:inline">IOP:</span>
          <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300">
            {fluidics.iopActual.toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-500 font-mono hidden md:inline">mmHg</span>
        </div>

        {/* CDE Tracker (Visible on sm+) */}
        {module === 'phaco' && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
            <Zap className={`w-3.5 h-3.5 shrink-0 ${cde > 18 ? 'text-amber-400' : 'text-yellow-400'}`} />
            <span className="text-slate-400 text-[10px] hidden md:inline">CDE:</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-yellow-300">
              {cde.toFixed(2)}
            </span>
          </div>
        )}

        {/* Patient Vitals (Heart Rate, BP, SpO2) (Visible on xl+) */}
        <div className="hidden xl:flex items-center gap-2.5 px-2.5 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
          <div className="flex items-center gap-1.5">
            <Heart className={`w-3.5 h-3.5 text-rose-500 transition-transform ${pulse ? 'scale-125' : 'scale-100'}`} />
            <span className="font-mono font-bold text-slate-200">{vitals.heartRate}</span>
            <span className="text-[10px] text-slate-500">BPM</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">BP:</span>
            <span className="font-mono font-bold text-slate-200">{vitals.bloodPressureSys}/{vitals.bloodPressureDia}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">SpO₂:</span>
            <span className="font-mono font-bold text-emerald-400">{vitals.spO2}%</span>
          </div>
        </div>

        {/* Stopwatch Timer (Visible on md+) */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
          <Timer className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono font-bold text-slate-200 text-xs">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Modals */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile Machine Console Drawer Toggle Button (Visible on < lg) */}
        {onToggleConsole && (
          <button
            onClick={onToggleConsole}
            title="Toggle Machine Settings Console"
            aria-label="Toggle Machine Settings Console"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition lg:hidden ${
              isConsoleOpen
                ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                : 'bg-[#0d1626] hover:bg-[#162238] border-[#1e2f4a] text-amber-400 hover:text-amber-300'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Console</span>
          </button>
        )}

        {/* Install PWA Button (Hidden on small mobile) */}
        {!isAppInstalled && (
          <button
            onClick={handleInstallClick}
            title="Install Ophthalmic Simulator"
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-semibold text-xs shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PWA</span>
          </button>
        )}

        {/* Sound Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          aria-label={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          className="p-1.5 rounded-lg bg-[#0d1626] hover:bg-[#162238] border border-[#1e2f4a] text-slate-300 hover:text-white transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Clinical Guide */}
        <button
          onClick={onOpenReference}
          title="Clinical Anatomical Reference & Technique Guide"
          aria-label="Clinical Guide"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#0d1626] hover:bg-[#162238] border border-[#1e2f4a] text-slate-300 hover:text-cyan-300 text-xs transition flex items-center gap-1.5"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Post-Op Debrief */}
        <button
          onClick={onOpenReport}
          title="View Surgical Efficiency & Report Card"
          aria-label="Post-Op Debrief"
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/40 transition flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Debrief</span>
        </button>
      </div>
    </header>
  );
};
