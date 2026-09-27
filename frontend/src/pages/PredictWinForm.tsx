import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'react-iconly';

interface PredictWinFormProps {
  formData: any;
  setFormData: (data: any) => void;
  submitting: boolean;
  errorMessage: string;
  teams: any[];
  handleSubmit: (e: React.FormEvent) => void;
  itemVariants: any;
}

export const PredictWinForm: React.FC<PredictWinFormProps> = ({
  formData,
  setFormData,
  submitting,
  errorMessage,
  teams,
  handleSubmit,
  itemVariants
}) => {
  return (
    <motion.form variants={itemVariants} onSubmit={handleSubmit} className="data-card p-6 sm:p-10 space-y-8">
      <h2 className="font-heading text-2xl font-black text-dark-bg border-b border-surface-border pb-4 flex items-center gap-3 uppercase tracking-widest">
        <Star set="bold" className="w-6 h-6 text-brand" /> Make Your Prediction
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
  );
};
