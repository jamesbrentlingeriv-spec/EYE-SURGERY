import React, { useState } from 'react';
import {
  Video,
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw,
  Layers,
  Disc,
  Sparkles,
  Sliders,
  HelpCircle,
  Compass
} from 'lucide-react';
import { SurgicalModule } from '../types/ophthalmic';

interface SurgicalVideoOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSurgery: SurgicalModule;
  videoUrls: Record<SurgicalModule, string>;
  onUpdateVideoUrl: (module: SurgicalModule, url: string) => void;
}

export const SurgicalVideoOverlayModal: React.FC<SurgicalVideoOverlayModalProps> = ({
  isOpen,
  onClose,
  currentSurgery,
  videoUrls,
  onUpdateVideoUrl
}) => {
  const [activeModule, setActiveModule] = useState<SurgicalModule>(currentSurgery);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(0.96);

  if (!isOpen) return null;

  const surgeryInfo = {
    phaco: {
      title: 'Cataract Phacoemulsification & Foldable IOL Surgery Video',
      badge: 'SURGERY 1',
      color: 'text-cyan-400 border-cyan-500 bg-cyan-950/40',
      chapters: [
        { label: '01: Paracentesis (10h)', time: '0:00' },
        { label: '02: Tri-Planar Cornea (2.4mm)', time: '0:45' },
        { label: '03: OVD Soft-Shell Shield', time: '1:30' },
        { label: '04: Capsulorhexis (5.2mm CCC)', time: '2:15' },
        { label: '05: Hydrodissection Wave', time: '3:20' },
        { label: '06: Phaco-Chop & Cavitation', time: '4:10' },
        { label: '07: Cortex Removal (I/A)', time: '6:30' },
        { label: '08: Capsular Bag OVD Refill', time: '7:45' },
        { label: '09: Cartridge IOL Delivery', time: '8:20' },
        { label: '10: Distal Haptic Placement', time: '9:00' },
        { label: '11: Sinskey Hook 360° Overlap', time: '9:40' },
        { label: '12: Retro-Lens Visco Washout', time: '10:30' }
      ]
    },
    iol: {
      title: 'Cataract & Foldable IOL Implantation Video',
      badge: 'SURGERY 1 (PHASE 2)',
      color: 'text-sky-400 border-sky-500 bg-sky-950/40',
      chapters: [
        { label: '08: Capsular Bag OVD Refill', time: '7:45' },
        { label: '09: Cartridge IOL Delivery', time: '8:20' },
        { label: '10: Distal Haptic Placement', time: '9:00' },
        { label: '11: Sinskey Hook 360° Overlap', time: '9:40' },
        { label: '12: Retro-Lens Visco Washout', time: '10:30' }
      ]
    },
    yag: {
      title: 'Nd:YAG Laser Posterior Capsulotomy Video',
      badge: 'SURGERY 2',
      color: 'text-rose-400 border-rose-500 bg-rose-950/40',
      chapters: [
        { label: '01: Abraham Contact Lens Fit', time: '0:00' },
        { label: '02: HeNe Aiming Beam Focus', time: '0:30' },
        { label: '03: +150µm Defocus Offset Check', time: '1:00' },
        { label: '04: Cruciate Pattern Cross Cuts', time: '1:30' },
        { label: '05: Visual Axis Clearance Check', time: '2:20' }
      ]
    },
    migs: {
      title: 'MIGS: Trabecular Micro-Bypass Glaucoma Stent Video',
      badge: 'SURGERY 3',
      color: 'text-emerald-400 border-emerald-500 bg-emerald-950/40',
      chapters: [
        { label: '01: Microscope 40° & Head Tilt', time: '0:00' },
        { label: '02: Swan-Jacob Gonioprism Place', time: '0:35' },
        { label: '03: Cohesive OVD Angle Deepening', time: '1:10' },
        { label: '04: Micro-Stent 1 Insertion (2:30)', time: '1:50' },
        { label: '05: Micro-Stent 2 Insertion (4:00)', time: '2:35' },
        { label: '06: Venous Blood Reflux Wave & Washout', time: '3:20' }
      ]
    }
  };

  const currentInfo = surgeryInfo[activeModule] || surgeryInfo['phaco'];
  const currentUrl = videoUrls[activeModule] || (activeModule === 'iol' ? videoUrls['phaco'] : (activeModule === 'migs' ? 'istent.mp4' : ''));

  // Helper to parse embeddable video URL (YouTube, Vimeo, or direct MP4)
  const getEmbedUrl = (rawUrl: string): { type: 'iframe' | 'video' | 'empty'; url: string } => {
    if (!rawUrl || !rawUrl.trim()) {
      return { type: 'empty', url: '' };
    }
    const trimmed = rawUrl.trim();

    // YouTube regex parser
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'iframe',
        url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`
      };
    }

    // Vimeo regex parser
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'iframe',
        url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
      };
    }

    // Direct video file (.mp4, .webm, .ogg)
    if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.ogg')) {
      const resolved = (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'))
        ? trimmed
        : `${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}${trimmed}`;
      return { type: 'video', url: resolved };
    }

    // Fallback: try as iframe or direct link
    return { type: 'iframe', url: trimmed };
  };

  const embedInfo = getEmbedUrl(currentUrl);

  const handleSaveCustomUrl = () => {
    if (inputUrl.trim()) {
      onUpdateVideoUrl(activeModule, inputUrl.trim());
      setIsEditingUrl(false);
      setInputUrl('');
    }
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMiniMode
          ? 'bottom-4 right-4 w-96 max-w-[90vw] shadow-2xl'
          : 'inset-0 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md'
      }`}
      style={{ opacity }}
    >
      <div
        className={`bg-[#0b1220] border border-[#1e2f4a] rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-200 select-none ${
          isMiniMode ? 'w-full' : 'w-full max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-[#0d1728] via-[#0e1c33] to-[#0d1728] border-b border-[#1b2b44] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                  {currentInfo.badge}
                </span>
                <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                  {currentInfo.title}
                </h3>
              </div>
              {!isMiniMode && (
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  Real Surgical Footage & Technique Video Overlay
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Opacity slider */}
            {!isMiniMode && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#070c16] border border-[#162338] text-[10px] text-slate-400 mr-1">
                <span>Opacity:</span>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-14 accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Minimize / Float PiP Button */}
            <button
              onClick={() => setIsMiniMode(!isMiniMode)}
              className="p-1.5 rounded-lg bg-[#101b2e] hover:bg-[#16253c] border border-[#1b2b44] text-slate-300 hover:text-white transition"
              title={isMiniMode ? 'Expand to Full Modal' : 'Minimize to Floating Picture-in-Picture'}
            >
              {isMiniMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-900/60 border border-transparent hover:border-rose-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Surgery Module Selector Tabs (When in full modal mode) */}
        {!isMiniMode && (
          <div className="flex border-b border-[#1b2b44] bg-[#080d18] px-3 sm:px-4 gap-1 text-xs overflow-x-auto no-scrollbar">
            {[
              { id: 'phaco', label: '1. Cataract & Foldable IOL', icon: Layers },
              { id: 'yag', label: '2. Nd:YAG Laser Capsulotomy', icon: Sparkles },
              { id: 'migs', label: '3. MIGS Glaucoma Stent', icon: Compass }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSel = activeModule === tab.id || (tab.id === 'phaco' && activeModule === 'iol');
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveModule(tab.id as SurgicalModule);
                    setIsEditingUrl(false);
                  }}
                  className={`py-2.5 px-3 font-semibold transition border-b-2 flex items-center gap-1.5 shrink-0 ${
                    isSel
                      ? 'border-cyan-400 text-cyan-300 bg-[#0e1726]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Video Player Display Area */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
          {embedInfo.type === 'iframe' ? (
            <iframe
              src={embedInfo.url}
              title={currentInfo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : embedInfo.type === 'video' ? (
            <video
              src={embedInfo.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            /* Ready For Video Placement Card */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/80 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/60 animate-pulse">
                <Video className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  Awaiting Surgical Video Link for {currentInfo.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ready to stream! You can paste any YouTube URL, Vimeo link, or MP4 video address below, or share the link in chat.
                </p>
              </div>

              <button
                onClick={() => setIsEditingUrl(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Paste Video Link Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Custom URL Input Bar / Video Configuration */}
        {(!isMiniMode || isEditingUrl) && (
          <div className="p-3 bg-[#080e1a] border-t border-[#162338] text-xs">
            {isEditingUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube, Vimeo, or MP4 URL here..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-[#0b1424] border border-cyan-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomUrl()}
                />
                <button
                  onClick={handleSaveCustomUrl}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set</span>
                </button>
                <button
                  onClick={() => setIsEditingUrl(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-slate-400 text-[11px] truncate">
                  <span className="font-semibold text-slate-300">Active Source:</span>
                  <span className="font-mono text-cyan-300 truncate max-w-[320px]">
                    {currentUrl || 'No video assigned yet (ready for your link)'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setInputUrl(currentUrl);
                    setIsEditingUrl(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#101b2d] hover:bg-[#16253c] border border-[#1e2f4a] text-cyan-300 hover:text-white text-[11px] font-semibold transition shrink-0"
                >
                  <Edit3 className="w-3 h-3 text-cyan-400" />
                  <span>{currentUrl ? 'Change Link' : 'Add Link'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step Chapters Bar (When in full modal mode) */}
        {!isMiniMode && (
          <div className="p-3 bg-[#060b14] border-t border-[#162338] space-y-1.5 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Key Surgical Phase Bookmarks:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentInfo.chapters.map((chap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[#0e1726] border border-[#1b2b44] text-[10px] text-slate-300 font-mono"
                >
                  {chap.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
