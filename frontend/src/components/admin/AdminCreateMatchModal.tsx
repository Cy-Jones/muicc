import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Plus, CloseSquare } from 'react-iconly';

interface AdminCreateMatchModalProps {
  teams: any[];
  onClose: () => void;
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

export const AdminCreateMatchModal: React.FC<AdminCreateMatchModalProps> = ({ teams, onClose, onRefresh, setMessage }) => {
  const [teamAId, setTeamAId] = useState(teams[0]?.id || '');
  const [teamBId, setTeamBId] = useState(teams[1]?.id || '');
  const [stage, setStage] = useState('GROUP');
  const [groupId, setGroupId] = useState('grp-a');
  const [matchStatus, setMatchStatus] = useState<'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FULL_TIME' | 'POSTPONED' | 'CANCELLED'>('SCHEDULED');
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [matchDate, setMatchDate] = useState('2026-09-26');
  const [matchTime, setMatchTime] = useState('16:00');
  const [matchVenue, setMatchVenue] = useState('RAILWAY PITCH, MADHAPAR, RAJKOT');

  const handleCreateMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId || !teamBId) return alert('Select both teams.');
    if (teamAId === teamBId) return alert('Teams must be different.');
    try {
      await api.adminSaveMatch({
        team_a_id: teamAId,
        team_b_id: teamBId,
        stage,
        group_id: stage === 'GROUP' ? groupId : null,
        status: matchStatus,
        score_a: parseInt(scoreA, 10),
        score_b: parseInt(scoreB, 10),
        date: matchDate,
        time: matchTime,
        venue: matchVenue
      });
      setMessage('Match created successfully!');
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-lg p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-surface-border pb-3">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2">
            <Plus set="bold" className="w-5 h-5 text-brand" /> Create Match
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg">
            <CloseSquare set="bold" className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleCreateMatchSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="admin-label">Team A *</label><select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="admin-input" required>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="admin-label">Team B *</label><select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="admin-input" required>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="admin-label">Status *</label><select value={matchStatus} onChange={(e) => setMatchStatus(e.target.value as any)} className="admin-input"><option value="SCHEDULED">SCHEDULED</option><option value="LIVE">LIVE</option><option value="HALF_TIME">HALF TIME</option><option value="FULL_TIME">FULL TIME</option><option value="POSTPONED">POSTPONED</option><option value="CANCELLED">CANCELLED</option></select></div>
            <div><label className="admin-label">Score A</label><input type="number" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className="admin-input text-center" /></div>
            <div><label className="admin-label">Score B</label><input type="number" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className="admin-input text-center" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="admin-label">Stage</label><select value={stage} onChange={(e) => setStage(e.target.value)} className="admin-input"><option value="GROUP">Group Stage</option><option value="ROUND_OF_16">Round of 16</option><option value="QUARTER_FINAL">Quarter-Final</option><option value="SEMI_FINAL">Semi-Final</option><option value="THIRD_PLACE">Third Place</option><option value="FINAL">Grand Final</option></select></div>
            <div><label className="admin-label">Group</label><select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="admin-input"><option value="grp-a">Group A</option><option value="grp-b">Group B</option><option value="grp-c">Group C</option><option value="">None</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="admin-label">Date</label><input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="admin-input" /></div>
            <div><label className="admin-label">Time</label><input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="admin-input" /></div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-surface-border">
            <button type="button" onClick={onClose} className="btn-outline px-4 py-2 text-xs">Cancel</button>
            <button type="submit" className="btn-primary px-4 py-2 text-xs">Create Match</button>
          </div>
        </form>
      </div>
    </div>
  );
};
