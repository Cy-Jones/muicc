import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { PredictWinCheckStatus } from './PredictWinCheckStatus';
import { PredictWinForm } from './PredictWinForm';
import { MatchDaySelector } from './MatchDaySelector';
import { PredictionSuccessView } from './PredictionSuccessView';
import { PredictionsClosedView } from './PredictionsClosedView';

export const PredictWinPage: React.FC = () => {
  const [matchDays, setMatchDays] = useState<any[]>([]);
  const [selectedMatchDayId, setSelectedMatchDayId] = useState<string>('');
  const [statusData, setStatusData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);

  const [pastPredictions, setPastPredictions] = useState<string[]>([]);

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

    const stored = localStorage.getItem('miucc_past_predictions');
    if (stored) {
      try {
        setPastPredictions(JSON.parse(stored));
      } catch(e) {}
    }
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
      
      const newRef = res.details.prediction_ref;
      setSubmissionResult(res);

      const stored = localStorage.getItem('miucc_past_predictions');
      let currentSaved = [];
      try { if (stored) currentSaved = JSON.parse(stored); } catch(e) {}
      if (!currentSaved.includes(newRef)) {
        const updatedSaved = [newRef, ...currentSaved].slice(0, 5);
        localStorage.setItem('miucc_past_predictions', JSON.stringify(updatedSaved));
        setPastPredictions(updatedSaved);
      }

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
      <motion.div variants={itemVariants} className="data-card p-8 md:p-12 border border-brand/40 bg-surface-card rounded-2xl text-center space-y-4 shadow-[0_0_15px_rgba(250,204,21,0.2)] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="font-heading text-4xl sm:text-5xl font-black text-dark-bg uppercase tracking-tight relative z-10">PREDICT & <span className="text-gold text-glow">WIN PRIZES</span></h1>
        <p className="text-sm text-dark-surface max-w-xl mx-auto font-medium relative z-10 leading-relaxed">
          Public predictions are strictly limited to <span className="text-gold font-bold">20 entries per Match Day</span>. First come, first served.
        </p>
      </motion.div>

      <MatchDaySelector
        matchDays={matchDays}
        selectedMatchDayId={selectedMatchDayId}
        setSelectedMatchDayId={setSelectedMatchDayId}
        setSubmissionResult={setSubmissionResult}
        setErrorMessage={setErrorMessage}
        statusData={statusData}
        isFullOrClosed={isFullOrClosed}
        itemVariants={itemVariants}
      />

      {submissionResult ? (
        <PredictionSuccessView 
          submissionResult={submissionResult} 
          setSubmissionResult={setSubmissionResult} 
          itemVariants={itemVariants} 
        />
      ) : isFullOrClosed ? (
        <PredictionsClosedView itemVariants={itemVariants} />
      ) : (
        <PredictWinForm
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
          errorMessage={errorMessage}
          teams={teams}
          handleSubmit={handleSubmit}
          itemVariants={itemVariants}
        />
      )}

      {/* Check Status Section */}
      <PredictWinCheckStatus 
        pastPredictions={pastPredictions}
        itemVariants={itemVariants}
      />
    </motion.div>
  );
};
