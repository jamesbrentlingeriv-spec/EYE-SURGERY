import React from 'react';
import { SurgicalReportCard, SurgicalModule } from '../types/ophthalmic';
import {
  Award,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Zap,
  Disc,
  Sparkles,
  Download,
  RotateCcw,
  X
} from 'lucide-react';

interface PostOpReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SurgicalReportCard;
  onRestartModule: () => void;
}

export const PostOpReportModal: React.FC<PostOpReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onRestartModule,
}) => {
  if (!isOpen) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500 bg-emerald-950/40';
      case 'B':
        return 'text-cyan-400 border-cyan-500 bg-cyan-950/40';
      case 'C':
        return 'text-amber-400 border-amber-500 bg-amber-950/40';
      default:
        return 'text-rose-500 border-rose-500 bg-rose-950/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="bg-[#0b1220] border border-[#1e2f4a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#1b2b44] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                OPHTHALMIC SURGICAL DEBRIEF & REPORT CARD
              </h2>
              <div className="text-xs text-slate-400 font-mono">
                Procedure: {report.module.toUpperCase()} | Operative Time: {report.operativeTimeSeconds}s
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#16253c] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Grade Banner */}
        <div className="p-6 bg-[#070d18] border-b border-[#1b2b44] flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-mono">
              Clinical Competency Evaluation
            </div>
            <div className="text-2xl font-black text-white mt-1">
              Score: {report.overallScore} / 100
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {report.overallScore >= 85
                ? 'Outstanding anterior segment surgical execution with optimal tissue preservation.'
                : report.overallScore >= 70
                ? 'Acceptable clinical result. Review technique refinements below to optimize metrics.'
                : 'Complications encountered requiring surgical management review.'}
            </div>
          </div>

          <div
            className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getGradeColor(
              report.grade
            )}`}
          >
            <span className="text-3xl leading-none">{report.grade}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider mt-1">Grade</span>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Module A: Phaco Metrics */}
          {report.module === 'phaco' && (
            <>
              {/* CCC Circularity */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Disc className="w-4 h-4 text-cyan-400" />
                    Capsulorhexis (CCC)
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {report.cccCircularity.value}% Circularity
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Rating: <span className="text-slate-200 font-medium">{report.cccCircularity.rating}</span>
                </div>
                <div className="w-full bg-[#070d18] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${report.cccCircularity.value}%` }}
                  />
                </div>
              </div>

              {/* CDE Score */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Cumulative Dissipated Energy
                  </span>
                  <span className="font-mono text-yellow-400 font-bold">
                    {report.cdeScore.value.toFixed(2)} %-sec
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Target for LOCS {report.cdeScore.expectedGrade}:{' '}
                  <span className="text-slate-200 font-medium">{report.cdeScore.rating}</span>
                </div>
                <div className="w-full bg-[#070d18] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${Math.min(100, (report.cdeScore.value / 25) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Corneal Endothelium Preservation */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Corneal Endothelium
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    -{report.endotheliumPreservation.estimatedLossPercent.toFixed(1)}% Loss
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Endothelial Status:{' '}
                  <span className="text-slate-200 font-medium">
                    {report.endotheliumPreservation.rating}
                  </span>
                </div>
              </div>

              {/* Posterior Capsule Status */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Disc className="w-4 h-4 text-sky-400" />
                    Posterior Capsule Integrity
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      report.posteriorCapsuleState === 'Intact' || report.posteriorCapsuleState === 'Polished'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {report.posteriorCapsuleState}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Capsule Thickness: 4-9 µm equatorial elastic reserve
                </div>
              </div>
            </>
          )}

          {/* Module B: IOL Metrics */}
          {report.module === 'iol' && (
            <>
              {/* IOL Centration */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Optic Centration</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {report.iolCentration.offsetMm.toFixed(2)} mm offset
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Rating: <span className="text-slate-200 font-medium">{report.iolCentration.rating}</span>
                </div>
              </div>

              {/* Rhexis Optic Overlap */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">360° Rhexis Overlap</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {report.rhexisOverlapScore.value}%
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Status: <span className="text-slate-200 font-medium">{report.rhexisOverlapScore.rating}</span>
                </div>
              </div>

              {/* Viscoelastic Retention */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Residual Viscoelastic in AC/Bag</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {report.viscoelasticRetention.value}% Retained
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Risk of post-op IOP spike: <span className="text-slate-200 font-medium">{report.viscoelasticRetention.rating}</span>
                </div>
              </div>
            </>
          )}

          {/* Module C: YAG Laser Metrics */}
          {report.module === 'yag' && (
            <>
              {/* Total Shots & Energy */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    Photodisruption Efficiency
                  </span>
                  <span className="font-mono text-rose-400 font-bold">
                    {report.yagEfficiency.totalEnergyMj.toFixed(1)} mJ Total
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {report.yagEfficiency.totalShots} shots fired ({report.yagEfficiency.rating})
                </div>
              </div>

              {/* IOL Pits Damage */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">IOL Optic Pitting</span>
                  <span
                    className={`font-mono font-bold ${
                      report.iolPittingScore.count === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {report.iolPittingScore.count} Pits
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Result: <span className="text-slate-200 font-medium">{report.iolPittingScore.rating}</span>
                </div>
              </div>

              {/* Vitreous Status */}
              <div className="bg-[#0e1726] p-4 rounded-xl border border-[#1c2e47] space-y-2 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Anterior Hyaloid Membrane</span>
                  <span
                    className={`font-mono font-bold ${
                      report.vitreousStatus === 'Preserved Hyaloid Face' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {report.vitreousStatus}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Clinical Consultant Critique & Pearls */}
        <div className="px-6 pb-6 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Clinical Consultant Review
          </div>
          <div className="bg-[#070d18] p-4 rounded-xl border border-[#1c2e47] space-y-2 text-xs text-slate-300">
            {report.clinicalSummary.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#1b2b44] flex items-center justify-between bg-[#080d19]">
          <button
            onClick={onRestartModule}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111c2e] hover:bg-[#192b45] text-slate-300 hover:text-white border border-[#213554] text-xs font-semibold transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Module</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition"
          >
            Continue Practice
          </button>
        </div>
      </div>
    </div>
  );
};
