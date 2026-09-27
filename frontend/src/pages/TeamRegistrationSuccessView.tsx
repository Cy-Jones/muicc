import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TickSquare } from 'react-iconly';

interface TeamRegistrationSuccessViewProps {
  submissionResult: any;
}

export const TeamRegistrationSuccessView: React.FC<TeamRegistrationSuccessViewProps> = ({ submissionResult }) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-10 space-y-8 text-center border-gold/50 shadow-glow-gold-lg relative overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none"></div>
      <TickSquare set="bold" className="w-20 h-20 text-gold mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
      
      <div className="space-y-3 relative z-10">
        <h2 className="font-heading text-3xl font-black text-dark-bg uppercase tracking-widest">REGISTRATION RECEIVED</h2>
        <p className="text-sm text-dark-muted font-medium">
          Your team and <span className="text-brand font-bold">{submissionResult.playersCount || 0} players</span> have been submitted successfully.
        </p>
      </div>

      <div className="bg-surface-bg p-8 rounded-xl border border-surface-border max-w-md mx-auto space-y-4 shadow-inner relative z-10">
        <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest">YOUR REGISTRATION REFERENCE</p>
        <p className="font-heading text-3xl sm:text-4xl font-black text-brand tracking-widest">{submissionResult.registrationRef}</p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-status-warning/10 text-status-warning border border-status-warning/30 rounded text-[10px] font-black uppercase tracking-widest">
          STATUS: {submissionResult.status} REVIEW
        </div>
      </div>

      <button type="button" onClick={() => navigate('/manager')} className="btn-primary px-8 py-3 text-xs rounded-md font-bold uppercase tracking-widest relative z-10 cursor-pointer">
        Go to Dashboard
      </button>
    </motion.div>
  );
};
