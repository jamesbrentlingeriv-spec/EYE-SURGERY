import React from 'react';
import { InstrumentType, SurgicalModule } from '../types/ophthalmic';
import {
  Scissors,
  Syringe,
  Compass,
  Zap,
  RotateCw,
  Eye,
  Disc,
  Crosshair,
  Sparkles,
  Waves,
  X
} from 'lucide-react';

interface InstrumentTrayProps {
  module: SurgicalModule;
  activeInstrument: InstrumentType;
  onSelectInstrument: (inst: InstrumentType) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface ToolDefinition {
  id: InstrumentType;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  modules: SurgicalModule[];
}

const INSTRUMENT_REGISTRY: ToolDefinition[] = [
  {
    id: 'mvr_blade',
    name: '1.0mm MVR Blade',
    category: 'Incision',
    description: 'Micro-vitreoretinal blade for paracentesis entry at limbus',
    icon: <Scissors className="w-4 h-4 text-cyan-400 rotate-45" />,
    modules: ['phaco']
  },
  {
    id: 'keratome_2_4',
    name: '2.4mm Keratome',
    category: 'Incision',
    description: 'Diamond / steel blade for tri-planar clear corneal incision',
    icon: <Scissors className="w-4 h-4 text-cyan-300" />,
    modules: ['phaco']
  },
  {
    id: 'ovd_viscoat',
    name: 'Viscoat (Dispersive OVD)',
    category: 'Viscosurgical',
    description: 'Chondroitin sulfate/hyaluronate coating corneal endothelium',
    icon: <Syringe className="w-4 h-4 text-amber-400" />,
    modules: ['phaco']
  },
  {
    id: 'ovd_provisc',
    name: 'Provisc (Cohesive OVD)',
    category: 'Viscosurgical',
    description: 'High molecular weight hyaluronate to maintain AC depth and bag volume',
    icon: <Syringe className="w-4 h-4 text-sky-400" />,
    modules: ['phaco', 'iol', 'migs']
  },
  {
    id: 'cystotome',
    name: '27G Cystotome',
    category: 'Capsulotomy',
    description: 'Bent needle for central anterior capsule puncture and flap initiation',
    icon: <Compass className="w-4 h-4 text-purple-400" />,
    modules: ['phaco']
  },
  {
    id: 'utrata_forceps',
    name: 'Utrata Micro-Forceps',
    category: 'Capsulotomy',
    description: 'Delicate rhexis forceps for steering capsulorhexis tear vector',
    icon: <Compass className="w-4 h-4 text-emerald-400" />,
    modules: ['phaco']
  },
  {
    id: 'hydro_cannula',
    name: 'Hydrodissection Cannula',
    category: 'Hydro-dynamics',
    description: '27G flattened cannula injecting BSS beneath anterior capsule rim',
    icon: <Waves className="w-4 h-4 text-cyan-400" />,
    modules: ['phaco']
  },
  {
    id: 'phaco_tip',
    name: 'Phaco Tip + Chopper',
    category: 'Nucleofractis',
    description: 'Ultrasonic needle with silicone sleeve + Nagahara horizontal chopper',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    modules: ['phaco']
  },
  {
    id: 'ia_handpiece',
    name: 'I/A Handpiece',
    category: 'Fluidics & Cleanup',
    description: 'Coaxial Irrigation/Aspiration for cortical clearance & OVD evacuation',
    icon: <RotateCw className="w-4 h-4 text-sky-300" />,
    modules: ['phaco', 'iol', 'migs']
  },
  {
    id: 'iol_injector',
    name: 'IOL Cartridge Injector',
    category: 'Implantation',
    description: 'Screw/plunger injector delivering foldable hydrophobic acrylic optic',
    icon: <Disc className="w-4 h-4 text-emerald-400" />,
    modules: ['phaco', 'iol']
  },
  {
    id: 'sinskey_hook',
    name: 'Sinskey Manipulator Hook',
    category: 'Positioning',
    description: '0.2mm angled hook for dialing trailing haptic and centration',
    icon: <Compass className="w-4 h-4 text-indigo-400" />,
    modules: ['phaco', 'iol']
  },
  {
    id: 'yag_laser',
    name: '1064nm Nd:YAG Laser',
    category: 'Laser Photodisruption',
    description: 'Q-switched laser with dual red HeNe aiming diodes and focus offset',
    icon: <Sparkles className="w-4 h-4 text-rose-500" />,
    modules: ['yag']
  },
  {
    id: 'gonio_lens',
    name: 'Swan-Jacob Gonioprism',
    category: 'Angle Visualization',
    description: 'Direct surgical prism lens revealing iridocorneal drainage structures',
    icon: <Eye className="w-4 h-4 text-emerald-300" />,
    modules: ['migs']
  },
  {
    id: 'migs_injector',
    name: 'iStent Inject® Delivery Pen',
    category: 'Trabecular Micro-Bypass',
    description: 'Preloaded trocar pen delivering micro-bypass stents directly into Schlemm canal',
    icon: <Crosshair className="w-4 h-4 text-amber-400" />,
    modules: ['migs']
  }
];

export const InstrumentTray: React.FC<InstrumentTrayProps> = ({
  module,
  activeInstrument,
  onSelectInstrument,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const availableInstruments = INSTRUMENT_REGISTRY.filter(tool =>
    tool.modules.includes(module)
  );

  const handleSelect = (toolId: InstrumentType) => {
    onSelectInstrument(toolId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-label="Close instrument drawer backdrop"
        />
      )}

      <aside
        className={`bg-[#000000] border-r border-[#1b2b44] flex flex-col select-none transition-transform duration-300 ease-in-out
          fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] h-full shadow-2xl
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:w-64 lg:h-full lg:z-auto lg:shadow-none
        `}
      >
        <div className="p-3 border-b border-[#1b2b44] flex items-center justify-between">
          <div>
            <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <span>Surgical Tray</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                {availableInstruments.length} Available
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Select active sterile instrument</div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-[#16253c] text-slate-400 hover:text-white transition lg:hidden"
            title="Close Surgical Tray"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instruments List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {availableInstruments.map(tool => {
            const isSelected = activeInstrument === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleSelect(tool.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-3 active:scale-[0.98] ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-950/60 text-white'
                    : 'bg-[#000000] hover:bg-[#070e0a] border-emerald-950/80 hover:border-emerald-700/60 text-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg mt-0.5 border ${
                    isSelected
                      ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200'
                      : 'bg-[#080808] border-[#1b2b44] text-slate-400'
                  }`}
                >
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {tool.name}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-500 px-1 rounded bg-[#09111e]">
                      {tool.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info Box */}
        <div className="p-3 border-t border-[#1b2b44] bg-[#070c17] text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="flex justify-between">
            <span>Active Tip:</span>
            <span className="text-cyan-400 font-bold uppercase">{activeInstrument.replace('_', ' ')}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Click or drag in the ocular viewport to operate with selected tool.
          </div>
        </div>
      </aside>
    </>
  );
};
