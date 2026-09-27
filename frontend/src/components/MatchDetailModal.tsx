import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { MatchDetailHeader } from './MatchDetailHeader';
import { MatchDetailSummaryTab } from './MatchDetailSummaryTab';
import { MatchDetailLineupsTab } from './MatchDetailLineupsTab';

interface MatchDetailModalProps {
  matchId: string;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ matchId, onClose }) => {
  const [matchData, setMatchData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineupA, setLineupA] = useState<any>(null);
  const [lineupB, setLineupB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'LINEUPS'>('SUMMARY');

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const data = await api.getMatchDetail(matchId);
        setMatchData(data.match);
        setEvents(data.events || []);
        
        const la = data.lineups?.find((l: any) => l.team_id === data.match.team_a_id);
        const lb = data.lineups?.find((l: any) => l.team_id === data.match.team_b_id);
        setLineupA(la);
        setLineupB(lb);
      } catch (err) {
        console.error("Failed to fetch match details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="animate-pulse bg-surface-card w-full max-w-3xl h-[60vh] rounded-2xl border border-surface-border" />
      </div>
    );
  }

  if (!matchData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-surface-border shadow-2xl flex flex-col overflow-hidden"
      >
        <MatchDetailHeader matchData={matchData} onClose={onClose} />

        {/* Navigation Tabs */}
        <div className="flex px-6 pt-4 border-b border-surface-border shrink-0 bg-surface-card gap-6">
          <button 
            onClick={() => setActiveTab('SUMMARY')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'SUMMARY' ? 'text-brand' : 'text-dark-muted hover:text-dark-bg'}`}
          >
            Summary
            {activeTab === 'SUMMARY' && <motion.div layoutId="matchTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
          <button 
            onClick={() => setActiveTab('LINEUPS')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === 'LINEUPS' ? 'text-brand' : 'text-dark-muted hover:text-dark-bg'}`}
          >
            Lineups
            {activeTab === 'LINEUPS' && <motion.div layoutId="matchTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-card">
          {activeTab === 'SUMMARY' && (
            <MatchDetailSummaryTab matchData={matchData} events={events} />
          )}

          {activeTab === 'LINEUPS' && (
            <MatchDetailLineupsTab lineupA={lineupA} lineupB={lineupB} />
          )}
        </div>
      </motion.div>
    </div>
  );
};
