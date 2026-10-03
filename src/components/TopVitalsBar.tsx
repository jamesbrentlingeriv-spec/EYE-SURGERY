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
  Download
} from 'lucide-react';
import { audioEngine } from '../audio/SoundSynthesizer';

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
        audioEngine.playTelemetryHeartbeat(fluidics.cornealFoldsPresent);
      }
      setTimeout(() => setPulse(false), 160);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [vitals.heartRate, isMuted, fluidics.cornealFoldsPresent]);

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
    <header className="h-14 bg-[#0a101d] border-b border-[#1b2b44] px-4 flex items-center justify-between text-xs text-slate-300 select-none shadow-md z-30 relative">
      {/* Left: Procedure & Active Clinical Step */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-[#1b2b44]">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold tracking-wide text-white text-sm">SURGICAL SIMULATOR</span>
          <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
            PWA
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Phase:</span>
          <span className="font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded">
            {getStepTitle()}
          </span>
        </div>
      </div>

      {/* Center: Live Real-Time Telemetry & Surgical Fluidics */}
      <div className="flex items-center gap-5">
        {/* IOP Monitor */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
          <Droplets className={`w-3.5 h-3.5 ${fluidics.iopActual < 8 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
          <span className="text-slate-400">IOP:</span>
          <span className={`font-mono font-bold text-sm ${fluidics.iopActual < 8 ? 'text-rose-400 font-extrabold' : fluidics.iopActual > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {fluidics.iopActual.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-500">mmHg</span>
        </div>

        {/* CDE Tracker */}
        {module === 'phaco' && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
            <Zap className={`w-3.5 h-3.5 ${cde > 18 ? 'text-amber-400' : 'text-yellow-400'}`} />
            <span className="text-slate-400">CDE:</span>
            <span className="font-mono font-bold text-sm text-yellow-300">
              {cde.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">%-sec</span>
          </div>
        )}

        {/* Patient Vitals (Heart Rate, BP, SpO2) */}
        <div className="flex items-center gap-3 px-3 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
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

        {/* Stopwatch Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1626] border border-[#1e2f4a]">
          <Timer className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono font-bold text-slate-200">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Report Trigger */}
      <div className="flex items-center gap-2">
        {/* Install PWA Button */}
        {!isAppInstalled && (
          <button
            onClick={handleInstallClick}
            title="Install Ophthalmic Simulator as Standalone Desktop/Mobile App"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-semibold text-xs shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install PWA</span>
          </button>
        )}

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          className="p-1.5 rounded-lg bg-[#0d1626] hover:bg-[#162238] border border-[#1e2f4a] text-slate-300 hover:text-white transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <button
          onClick={onOpenReference}
          title="Clinical Anatomical Reference & Technique Guide"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d1626] hover:bg-[#162238] border border-[#1e2f4a] text-slate-300 hover:text-cyan-300 text-xs transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Clinical Guide</span>
        </button>

        <button
          onClick={onOpenReport}
          title="View Surgical Efficiency & Report Card"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/40 transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Post-Op Debrief</span>
        </button>
      </div>
    </header>
  );
};
