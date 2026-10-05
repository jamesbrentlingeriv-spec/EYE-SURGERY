import React, { useEffect, useState, useRef } from 'react';
import {
  Eye,
  Activity,
  Zap,
  ShieldCheck,
  ChevronRight,
  Crosshair,
  Layers,
  Sparkles,
  Volume2
} from 'lucide-react';
import { audioEngine } from '../audio/SoundSynthesizer';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const TOTAL_DURATION_SEC = 20;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_DURATION_SEC);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const telemetryPhases = [
    {
      title: 'MICROSURGICAL SUBSYSTEM INITIALIZATION',
      desc: 'Synchronizing High-Resolution Stereo Coaxial Illumination & 3D Cornea Meshes...',
      badge: 'OPTICS 25x OK',
      tag: 'SYSTEM BOOT'
    },
    {
      title: 'ANTERIOR SEGMENT BIOMETRIC MAPPING',
      desc: 'Axial Length: 23.45mm • ACD: 3.15mm • Pupil Dilation: 8.2mm • Pachymetry: 540µm',
      badge: 'LOCS III NO3',
      tag: 'BIOMETRICS'
    },
    {
      title: 'ACTIVE FLUIDICS CASSETTE CALIBRATION',
      desc: 'Dynamic Forced Infusion (Target: 30 mmHg) • Vacuum Sensor Limit: 650 mmHg',
      badge: 'SURGE GUARD ON',
      tag: 'FLUIDICS'
    },
    {
      title: 'ND:YAG 1064nm PHOTODISRUPTION ARRAY',
      desc: 'Dual Red HeNe Aiming Laser Convergence • Posterior Offset Lock: +150 µm Defocus',
      badge: 'ZERO PIT SHIELD',
      tag: 'LASER READY'
    },
    {
      title: 'RHEXIS SURGICAL SUITE READY',
      desc: 'Preparing 3 Advanced Surgical Modules: Phacoemulsification, Foldable IOL, Nd:YAG Laser',
      badge: '100% CALIBRATED',
      tag: 'ENTER SUITE'
    }
  ];

  // 20-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        const next = prev - 1;
        // Update phase every 4 seconds
        const elapsed = TOTAL_DURATION_SEC - next;
        const phase = Math.min(telemetryPhases.length - 1, Math.floor(elapsed / 4));
        setCurrentPhaseIndex(phase);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Keyboard shortcut: Space or Enter or Escape to skip intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  // Canvas futuristic biometric laser scan animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.38;

      // Rotating laser scanner sweep beam
      angle += 0.025;
      const sweepX = cx + Math.cos(angle) * (baseR * 1.05);
      const sweepY = cy + Math.sin(angle) * (baseR * 1.05);

      // Sweep gradient sector
      const sweepGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, baseR * 1.05);
      sweepGrad.addColorStop(0, 'rgba(0, 210, 255, 0.25)');
      sweepGrad.addColorStop(0.7, 'rgba(0, 180, 255, 0.08)');
      sweepGrad.addColorStop(1, 'rgba(0, 210, 255, 0)');

      ctx.save();
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, baseR * 1.05, angle - 0.5, angle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Outer corneal ring
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed limbus ring
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Pupil circle
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Iris radiating fibers
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (baseR * 0.45);
        const y1 = cy + Math.sin(a) * (baseR * 0.45);
        const x2 = cx + Math.cos(a) * (baseR * 0.75);
        const y2 = cy + Math.sin(a) * (baseR * 0.75);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // Crosshair reticle
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - baseR * 1.15, cy);
      ctx.lineTo(cx + baseR * 1.15, cy);
      ctx.moveTo(cx, cy - baseR * 1.15);
      ctx.lineTo(cx, cy + baseR * 1.15);
      ctx.stroke();

      // Laser Sweep Tip
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sweepX, sweepY, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const progressPercent = ((TOTAL_DURATION_SEC - secondsRemaining) / TOTAL_DURATION_SEC) * 100;
  const currentPhase = telemetryPhases[currentPhaseIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#000000] text-slate-200 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <img
            src="./icons/logo.png"
            alt="RHEXIS"
            className="w-10 h-10 rounded-xl object-contain bg-black border border-emerald-500/80 shadow-lg shadow-emerald-950/60 p-0.5"
          />
          <div>
            <div className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
              RHEXIS • OPHTHALMIC SURGERY
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Virtual Microsurgical Operating Theater 2026.1
            </div>
          </div>
        </div>

        {/* Skip to Menu Button */}
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#0a0a0a] border border-emerald-700/80 text-emerald-300 hover:text-white font-bold text-xs transition shadow-lg active:scale-95 group"
          title="Skip Intro to Main Menu (or press Space / Escape)"
        >
          <span>Skip Intro to Menu</span>
          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Center Cinematic Biometric Visual */}
      <div className="flex flex-col items-center justify-center my-auto relative w-full max-w-lg">
        {/* Animated Background Glow */}
        <div className="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />

        {/* Scanning Canvas */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="w-full h-full pointer-events-none drop-shadow-2xl"
          />

          {/* Central Logo Overlay */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <img
              src="./icons/logo.png"
              alt="RHEXIS"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-contain bg-black/90 border border-emerald-500/80 shadow-2xl p-1 mb-1.5"
            />
            <span className="text-2xl sm:text-3xl font-black tracking-widest text-white drop-shadow font-mono">
              RHEXIS
            </span>
            <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase font-bold mt-0.5">
              SURGICAL SUITE
            </span>
          </div>
        </div>

        {/* Dynamic Telemetry Status Card */}
        <div className="mt-6 w-full bg-[#0a1222]/90 border border-[#1b2f4c] rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-cyan-400 flex items-center gap-1.5 uppercase">
              <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              {currentPhase.tag}
            </span>
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">
              {currentPhase.badge}
            </span>
          </div>

          <div className="text-xs sm:text-sm font-bold text-white leading-snug">
            {currentPhase.title}
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed font-mono">
            {currentPhase.desc}
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar & Countdown */}
      <div className="w-full max-w-xl flex flex-col items-center space-y-3 pb-4">
        {/* Progress Bar */}
        <div className="w-full bg-[#0d1627] rounded-full h-2.5 overflow-hidden border border-[#1b2b44] p-0.5">
          <div
            className="bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-lg shadow-cyan-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Countdown & Helper Label */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>Calibrating Simulation Engine...</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Entering Menu in:</span>
            <span className="text-sm font-bold text-cyan-300 bg-[#09101d] px-2 py-0.5 rounded border border-[#17253a]">
              00:{secondsRemaining.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
