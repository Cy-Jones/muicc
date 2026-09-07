import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Discovery, Lock, TickSquare, Star } from 'react-iconly';

export const PredictWinPage: React.FC = () => {
  const [matchDays, setMatchDays] = useState<any[]>([]);
  const [selectedMatchDayId, setSelectedMatchDayId] = useState<string>('');
  const [statusData, setStatusData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    predicted_winner_team_id: '',
    predicted_score_a: '2',
    predicted_score_b: '1',
    predicted_champion_team_id: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [days, teamsData] = await Promise.all([
          api.getMatchDays(),
          api.getTeams()
        ]);
        setMatchDays(days);
        setTeams(teamsData);
        if (days.length > 0) {
          setSelectedMatchDayId(days[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadStatus() {
      if (!selectedMatchDayId) return;
      try {
        const status = await api.getPredictionStatus(selectedMatchDayId);
        setStatusData(status);
      } catch (err) {
        console.error(err);
      }
    }
    loadStatus();
  }, [selectedMatchDayId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const res = await api.submitPrediction({
        ...formData,
        match_day_id: selectedMatchDayId,
        predicted_score_a: parseInt(formData.predicted_score_a, 10),
        predicted_score_b: parseInt(formData.predicted_score_b, 10)
      });
      setSubmissionResult(res);

      const updatedStatus = await api.getPredictionStatus(selectedMatchDayId);
      setStatusData(updatedStatus);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit prediction.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFullOrClosed = statusData?.status === 'FULL' || statusData?.status === 'CLOSED' || statusData?.submittedCount >= (statusData?.maxLimit || 20);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      <motion.div variants={itemVariants} className="glass-card p-8 md:p-12 border-gold/40 bg-gradient-to-br from-dark-surface to-dark-bg rounded-2xl text-center space-y-4 shadow-glow-gold-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-[10px] font-black uppercase tracking-widest border border-gold/30 shadow-md relative z-10">
          <Discovery set="bold" className="w-3.5 h-3.5" /> OFFICIAL PREDICT & WIN HUB
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-black text-white uppercase tracking-tight relative z-10">PREDICT & <span className="text-gold text-glow">WIN PRIZES</span></h1>
        <p className="text-sm text-dark-surface max-w-xl mx-auto font-medium relative z-10 leading-relaxed">
          Public predictions are strictly limited to <span className="text-gold font-bold">20 entries per Match Day</span>. First come, first served.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-panel p-6 sm:p-8 space-y-6">
        <label className="block text-xs font-black uppercase tracking-widest text-dark-muted">Select Active Match Day</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {matchDays.map((md) => (
            <button
              key={md.id}
              onClick={() => { setSelectedMatchDayId(md.id); setSubmissionResult(null); setErrorMessage(''); }}
              className={`p-4 rounded-xl text-left transition-all duration-300 border shadow-md \${
                selectedMatchDayId === md.id ? 'bg-gold/10 border-gold/60 text-white font-bold scale-[1.02] shadow-glow-gold' : 'bg-dark-bg border-dark-border text-dark-muted hover:border-gold/30'
              }`}
            >
              <span className="font-heading text-sm font-black uppercase block text-gold tracking-widest mb-1">{md.name}</span>
              <span className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">{md.date}</span>
            </button>
          ))}
        </div>

        {statusData && (
          <div className="p-5 bg-dark-bg rounded-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner mt-6">
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">{statusData.matchDayName}</p>
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-1">{statusData.remainingSlots} slots remaining for this Match Day</p>
            </div>
            <div className="sm:text-right flex flex-col sm:items-end">
              <span className={`font-heading text-2xl font-black \${isFullOrClosed ? 'text-status-error' : 'text-gold'}`}>
                {statusData.submittedCount} <span className="text-sm text-dark-muted">/ {statusData.maxLimit}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 \${
                isFullOrClosed ? 'bg-status-error/10 text-status-error border border-status-error/30' : 'bg-status-completed/10 text-status-completed border border-status-completed/30'
              }`}>
                {isFullOrClosed ? <><Lock set="bold" className="w-3 h-3" /> CLOSED</> : <><div className="w-1.5 h-1.5 rounded-full bg-status-completed animate-pulse" /> ACCEPTING</>}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {submissionResult ? (
        <motion.div variants={itemVariants} className="glass-card p-10 border-gold/50 text-center space-y-8 shadow-glow-gold-lg">
          <TickSquare set="bold" className="w-20 h-20 text-gold mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest">PREDICTION SUBMITTED</h2>
            <p className="text-sm text-dark-surface font-medium">Your entry has been locked and recorded.</p>
          </div>

          <div className="bg-dark-bg p-8 rounded-xl border border-dark-border max-w-md mx-auto space-y-3 shadow-inner">
            <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest">YOUR PREDICTION REF ID</p>
            <p className="font-heading text-4xl font-black text-gold tracking-widest">{submissionResult.details.prediction_ref}</p>
            <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-2">{submissionResult.details.matchDayName} • Slot #{submissionResult.details.slotNumber}</p>
          </div>

          <button onClick={() => setSubmissionResult(null)} className="btn-outline-gold px-8 py-3 rounded-md text-xs font-bold uppercase tracking-widest">
            Submit Another
          </button>
        </motion.div>
      ) : isFullOrClosed ? (
        <motion.div variants={itemVariants} className="glass-card p-10 border-2 border-status-error/40 bg-gradient-to-b from-status-error/10 to-dark-bg text-center space-y-5 rounded-2xl shadow-lg">
          <div className="w-20 h-20 rounded-full bg-status-error/20 border-2 border-status-error text-status-error flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Lock set="bold" className="w-10 h-10" />
          </div>
          <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest">PREDICTIONS CLOSED</h2>
          <p className="text-sm text-dark-surface max-w-md mx-auto leading-relaxed font-medium">
            We are no longer accepting predictions for this Match Day. The maximum of <span className="text-gold font-bold">20 predictions</span> has already been reached.
          </p>
          <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest">Check back for the next Match Day!</p>
        </motion.div>
      ) : (
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="glass-card p-6 sm:p-10 space-y-8">
          <h2 className="font-heading text-2xl font-black text-white border-b border-dark-border pb-4 flex items-center gap-3 uppercase tracking-widest">
            <Star set="bold" className="w-6 h-6 text-gold" /> Make Your Prediction
          </h2>

          {errorMessage && <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/50 text-status-error text-xs font-bold uppercase tracking-wider">{errorMessage}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-2">Your Full Name *</label>
              <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" className="input-field" />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-2">Your Email Address *</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-2">Predicted Match Winner</label>
              <select value={formData.predicted_winner_team_id} onChange={(e) => setFormData({ ...formData, predicted_winner_team_id: e.target.value })} className="input-field">
                <option value="">Select Team</option>
                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name} ({t.country})</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-2">Predicted Tournament Champion</label>
              <select value={formData.predicted_champion_team_id} onChange={(e) => setFormData({ ...formData, predicted_champion_team_id: e.target.value })} className="input-field">
                <option value="">Select Overall Champion</option>
                {teams.map((t) => (<option key={t.id} value={t.id}>{t.name} ({t.country})</option>))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl text-sm shadow-glow-gold disabled:opacity-50 mt-4">
            {submitting ? 'Submitting Prediction...' : 'Lock In & Submit Prediction'}
          </button>
        </motion.form>
      )}
    </motion.div>
  );
};
