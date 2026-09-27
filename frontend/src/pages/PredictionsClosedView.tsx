import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'react-iconly';

interface PredictionsClosedViewProps {
  itemVariants: any;
}

export const PredictionsClosedView: React.FC<PredictionsClosedViewProps> = ({ itemVariants }) => {
  return (
    <motion.div variants={itemVariants} className="data-card p-10 border border-status-error/40 bg-gradient-to-b from-status-error/10 to-surface-bg text-center space-y-5 rounded-2xl shadow-lg">
      <div className="w-20 h-20 rounded-full bg-status-error/20 border-2 border-status-error text-status-error flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
        <Lock set="bold" className="w-10 h-10" />
      </div>
      <h2 className="font-heading text-3xl font-black text-dark-bg uppercase tracking-widest">PREDICTIONS CLOSED</h2>
      <p className="text-sm text-dark-surface max-w-md mx-auto leading-relaxed font-medium">
        We are no longer accepting predictions for this Match Day. The maximum of <span className="text-gold font-bold">20 predictions</span> has already been reached.
      </p>
      <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">Check back for the next Match Day!</p>
    </motion.div>
  );
};
