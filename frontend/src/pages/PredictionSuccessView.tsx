import React from 'react';
import { motion } from 'framer-motion';
import { TickSquare } from 'react-iconly';

interface PredictionSuccessViewProps {
  submissionResult: any;
  setSubmissionResult: (res: any) => void;
  itemVariants: any;
}

export const PredictionSuccessView: React.FC<PredictionSuccessViewProps> = ({ submissionResult, setSubmissionResult, itemVariants }) => {
  return (
    <motion.div variants={itemVariants} className="data-card p-10 border border-brand/50 text-center space-y-8 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
      <TickSquare set="bold" className="w-20 h-20 text-brand mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
      <div className="space-y-3">
        <h2 className="font-heading text-3xl font-black text-dark-bg uppercase tracking-widest">PREDICTION SUBMITTED</h2>
        <p className="text-sm text-dark-surface font-medium">Your entry has been locked and recorded.</p>
      </div>

      <div className="bg-surface-bg p-8 rounded-xl border border-surface-border max-w-md mx-auto space-y-3 shadow-inner">
        <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest">YOUR PREDICTION REF ID</p>
        <p className="font-heading text-4xl font-black text-gold tracking-widest">{submissionResult.details.prediction_ref}</p>
        <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-2">{submissionResult.details.matchDayName} • Slot #{submissionResult.details.slotNumber}</p>
      </div>

      <button onClick={() => setSubmissionResult(null)} className="btn-outline-gold px-8 py-3 rounded-md text-xs font-bold uppercase tracking-widest">
        Submit Another
      </button>
    </motion.div>
  );
};
