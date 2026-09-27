import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CloseSquare, Edit, Delete } from 'react-iconly';

interface AdminEditMatchModalProps {
  match: any;
  teams: any[];
  players: any[];
  onClose: () => void;
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

export const AdminEditMatchModal: React.FC<AdminEditMatchModalProps> = ({ match, teams, players, onClose, onRefresh, setMessage }) => {
  const [editMatchStatus, setEditMatchStatus] = useState<'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FULL_TIME' | 'POSTPONED' | 'CANCELLED'>(match.status || 'SCHEDULED');
  const [editScoreA, setEditScoreA] = useState(match.score_a?.toString() || '0');
  const [editScoreB, setEditScoreB] = useState(match.score_b?.toString() || '0');
  const [editMatchDate, setEditMatchDate] = useState(match.date?.split('T')[0] || '');
  const [editMatchTime, setEditMatchTime] = useState(match.time || '');
  
  const [editEventMinute, setEditEventMinute] = useState('1');
  const [editEventType, setEditEventType] = useState('GOAL');
  const [editEventTeam, setEditEventTeam] = useState('');
  const [editEventPlayer, setEditEventPlayer] = useState('');
  const [editEventSecondary, setEditEventSecondary] = useState('');
  const [editMatchEvents, setEditMatchEvents] = useState<any[]>([]);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const details = await api.getMatchDetail(match.id);
        setEditMatchEvents(details.events || []);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [match.id]);

  const handleRecordEvent = async () => {
    if (!editEventTeam || !editEventPlayer || !editEventType || isSavingEvent) return;
    setIsSavingEvent(true);
    try {
      await api.adminRecordMatchEvent(match.id, {
        team_id: editEventTeam,
        player_id: editEventPlayer,
        event_type: editEventType,
        secondary_player_id: editEventSecondary || undefined,
        minute: parseInt(editEventMinute, 10)
      });
      setMessage(`Recorded ${editEventType.replace('_', ' ')} successfully.`);
      const details = await api.getMatchDetail(match.id);
      setEditMatchEvents(details.events || []);
      setEditEventPlayer('');
      setEditEventSecondary('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.adminDeleteMatchEvent(match.id, eventId);
      const details = await api.getMatchDetail(match.id);
      setEditMatchEvents(details.events || []);
      setMessage('Match event deleted.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveMatch = async () => {
    try {
      await api.adminUpdateMatchStatus(match.id, {
        status: editMatchStatus,
        score_a: parseInt(editScoreA, 10),
        score_b: parseInt(editScoreB, 10),
        minute_text: match.minute_text,
        date: editMatchDate,
        time: editMatchTime
      });
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-lg p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6">
        <div className="flex justify-between items-center border-b border-surface-border pb-3">
          <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2">
            <Edit set="bold" className="w-5 h-5 text-brand" /> Edit Match
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-bg">
            <CloseSquare set="bold" className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Status</label>
            <select className="admin-input" value={editMatchStatus} onChange={e => setEditMatchStatus(e.target.value as any)}>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="LIVE">LIVE</option>
              <option value="HALF_TIME">HALF TIME</option>
              <option value="FULL_TIME">FULL TIME</option>
              <option value="POSTPONED">POSTPONED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">{match.team_a_name} Score</label>
              <input type="number" min="0" className="admin-input" value={editScoreA} onChange={e => setEditScoreA(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">{match.team_b_name} Score</label>
              <input type="number" min="0" className="admin-input" value={editScoreB} onChange={e => setEditScoreB(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" className="admin-input" value={editMatchDate} onChange={e => setEditMatchDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Time</label>
              <input type="time" className="admin-input" value={editMatchTime} onChange={e => setEditMatchTime(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-surface-border pt-4">
            <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-3">Record Match Event</label>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Minute</label>
                <input type="number" min="1" max="120" className="admin-input" value={editEventMinute} onChange={e => setEditEventMinute(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Event Type</label>
                <select className="admin-input" value={editEventType} onChange={e => setEditEventType(e.target.value)}>
                  <option value="GOAL">Goal</option>
                  <option value="YELLOW_CARD">Yellow Card</option>
                  <option value="RED_CARD">Red Card</option>
                  <option value="SUBSTITUTION">Substitution</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Team</label>
                <select className="admin-input" value={editEventTeam} onChange={e => {
                  setEditEventTeam(e.target.value);
                  setEditEventPlayer('');
                  setEditEventSecondary('');
                }}>
                  <option value="">Select Team...</option>
                  <option value={match.team_a_id}>{match.team_a_name}</option>
                  <option value={match.team_b_id}>{match.team_b_name}</option>
                </select>
              </div>
              {editEventTeam && (
                <div>
                  <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Primary Player</label>
                  <select className="admin-input" value={editEventPlayer} onChange={e => setEditEventPlayer(e.target.value)}>
                    <option value="">Select Player...</option>
                    {(editEventType === 'YELLOW_CARD' || editEventType === 'RED_CARD') && teams.find(t => t.id === editEventTeam)?.coach_name && (
                      <option value={`COACH: ${teams.find(t => t.id === editEventTeam)?.coach_name}`}>
                        Coach: {teams.find(t => t.id === editEventTeam)?.coach_name}
                      </option>
                    )}
                    {players.filter(p => p.team_id === editEventTeam || p.team_name === (editEventTeam === match.team_a_id ? match.team_a_name : match.team_b_name)).map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {editEventTeam && (editEventType === 'GOAL' || editEventType === 'SUBSTITUTION') && (
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">
                  {editEventType === 'GOAL' ? 'Assist (Optional)' : 'Sub Out Player'}
                </label>
                <select className="admin-input" value={editEventSecondary} onChange={e => setEditEventSecondary(e.target.value)}>
                  <option value="">{editEventType === 'GOAL' ? 'No Assist' : 'Select Player...'}</option>
                  {players.filter(p => p.team_id === editEventTeam || p.team_name === (editEventTeam === match.team_a_id ? match.team_a_name : match.team_b_name)).map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              onClick={handleRecordEvent} 
              disabled={!editEventTeam || !editEventPlayer || (editEventType === 'SUBSTITUTION' && !editEventSecondary) || isSavingEvent}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isSavingEvent ? 'Saving...' : 'Save Event'}
            </button>
          </div>

          {editMatchEvents.length > 0 && (
            <div className="border-t border-surface-border pt-4">
              <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-3">Recorded Events</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {editMatchEvents.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between bg-surface-bg p-2 rounded border border-surface-border">
                    <div className="text-xs">
                      <span className="font-bold text-brand">{ev.minute}'</span>
                      <span className="mx-2 text-dark-muted">|</span>
                      <span className="font-medium text-dark-bg">{ev.player_name || ev.player_id}</span>
                      <span className="mx-2 text-dark-muted">|</span>
                      <span className="text-dark-muted">{ev.event_type.replace('_', ' ')}</span>
                    </div>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 rounded bg-status-error/10 text-status-error hover:bg-status-error hover:text-dark-bg transition-colors" title="Delete Event">
                      <Delete set="bold" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-dark-muted hover:text-dark-bg transition-colors">Cancel</button>
          <button onClick={handleSaveMatch} className="btn-primary py-2.5 px-6">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
