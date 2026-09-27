import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Discovery } from 'react-iconly';
import { api } from '../lib/api';

interface PredictWinCheckStatusProps {
  pastPredictions: string[];
  itemVariants: any;
}

export const PredictWinCheckStatus: React.FC<PredictWinCheckStatusProps> = ({ pastPredictions, itemVariants }) => {
  const [checkRef, setCheckRef] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkError, setCheckError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async (refToCheck: string = checkRef) => {
    if (!refToCheck.trim()) return;
    setIsChecking(true);
    setCheckError('');
    setCheckResult(null);
    try {
      const res = await api.checkPredictionStatus(refToCheck.trim());
      setCheckResult(res);
      setCheckRef(refToCheck.trim());
    } catch (err: any) {
      setCheckError(err.message || 'Failed to check status. Invalid reference number.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.div variants={itemVariants} className="data-card p-6 sm:p-10 space-y-6">
      <h2 className="font-heading text-2xl font-black text-dark-bg border-b border-surface-border pb-4 flex items-center gap-3 uppercase tracking-widest">
        <Discovery set="bold" className="w-6 h-6 text-brand" /> Check Prediction Status
      </h2>

      {pastPredictions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted">Your Past Predictions</label>
          <div className="flex flex-wrap gap-2">
            {pastPredictions.map((ref) => (
              <button
                key={ref}
                onClick={() => { setCheckRef(ref); handleCheckStatus(ref); }}
                className="px-3 py-1.5 rounded-md bg-surface-bg border border-surface-border hover:border-brand/50 text-xs font-bold text-dark-muted hover:text-dark-bg transition-colors"
              >
                {ref}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <div className="flex-1">
          <input 
            type="text" 
            value={checkRef} 
            onChange={(e) => setCheckRef(e.target.value.toUpperCase())} 
            placeholder="e.g. MULSU-PRED-0001" 
            className="input-field w-full" 
          />
        </div>
        <button 
          onClick={() => handleCheckStatus()} 
          disabled={isChecking || !checkRef.trim()} 
          className="btn-primary py-3 px-8 rounded-xl text-sm whitespace-nowrap"
        >
          {isChecking ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {checkError && <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/50 text-status-error text-xs font-bold uppercase tracking-wider">{checkError}</div>}
      
      {checkResult && (
        <div className="p-6 rounded-xl bg-surface-bg border border-brand/30 space-y-4 shadow-inner mt-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest">Prediction Ref</p>
              <p className="font-heading text-xl font-black text-dark-bg">{checkResult.prediction_ref}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              checkResult.status === 'WINNER' ? 'bg-status-completed/10 text-status-completed border-status-completed/30' :
              checkResult.status === 'LOSER' ? 'bg-status-error/10 text-status-error border-status-error/30' :
              'bg-brand/10 text-brand border-brand/30'
            }`}>
              {checkResult.status}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-border">
            <div>
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">Match Day</p>
              <p className="text-sm font-medium text-dark-bg">{checkResult.match_day_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">Predicted Winner</p>
              <p className="text-sm font-medium text-dark-bg">{checkResult.predicted_winner_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-2">Predictor</p>
              <p className="text-sm font-medium text-dark-bg">{checkResult.full_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-2">Email</p>
              <p className="text-sm font-medium text-dark-bg truncate" title={checkResult.email}>{checkResult.email}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
