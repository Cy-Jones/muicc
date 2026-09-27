import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'react-iconly';

interface MatchDaySelectorProps {
  matchDays: any[];
  selectedMatchDayId: string;
  setSelectedMatchDayId: (id: string) => void;
  setSubmissionResult: (result: any) => void;
  setErrorMessage: (msg: string) => void;
  statusData: any;
  isFullOrClosed: boolean;
  itemVariants: any;
}

export const MatchDaySelector: React.FC<MatchDaySelectorProps> = ({
  matchDays,
  selectedMatchDayId,
  setSelectedMatchDayId,
  setSubmissionResult,
  setErrorMessage,
  statusData,
  isFullOrClosed,
  itemVariants
}) => {
  return (
    <motion.div variants={itemVariants} className="data-card p-6 sm:p-8 space-y-6">
      <label className="block text-xs font-black uppercase tracking-widest text-dark-muted">Select Active Match Day</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {matchDays.map((md) => (
          <button
            key={md.id}
            onClick={() => { setSelectedMatchDayId(md.id); setSubmissionResult(null); setErrorMessage(''); }}
            className={`p-4 rounded-xl text-left transition-all duration-300 border shadow-md ${
              selectedMatchDayId === md.id ? 'bg-brand/10 border-brand/60 text-dark-bg font-bold scale-[1.02] shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'bg-surface-bg border-surface-border text-dark-muted hover:border-brand/30'
            }`}
          >
            <span className="font-heading text-sm font-black uppercase block text-gold tracking-widest mb-1">{md.name}</span>
            <span className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">{md.date}</span>
          </button>
        ))}
      </div>

      {statusData && (
        <div className="p-5 bg-surface-bg rounded-xl border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner mt-6">
          <div>
            <p className="text-sm font-black text-dark-bg uppercase tracking-widest">{statusData.matchDayName}</p>
            <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-1">{statusData.remainingSlots} slots remaining for this Match Day</p>
          </div>
          <div className="sm:text-right flex flex-col sm:items-end">
            <span className={`font-heading text-2xl font-black ${isFullOrClosed ? 'text-status-error' : 'text-gold'}`}>
              {statusData.submittedCount} <span className="text-sm text-dark-muted">/ {statusData.maxLimit}</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 ${
              isFullOrClosed ? 'bg-status-error/10 text-status-error border border-status-error/30' : 'bg-status-completed/10 text-status-completed border border-status-completed/30'
            }`}>
              {isFullOrClosed ? <><Lock set="bold" className="w-3 h-3" /> CLOSED</> : <><div className="w-1.5 h-1.5 rounded-full bg-status-completed animate-pulse" /> ACCEPTING</>}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
