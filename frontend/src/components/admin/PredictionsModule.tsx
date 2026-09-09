import React, { useState, useEffect } from 'react';
import { Delete, Edit } from 'react-iconly';
import { api } from '../../lib/api';

export const PredictionsModule: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [matchDays, setMatchDays] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatchDayId, setSelectedMatchDayId] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mds, tms] = await Promise.all([
        api.getMatchDays(),
        api.getTeams()
      ]);
      setMatchDays(mds);
      setTeams(tms);
      if (mds.length > 0 && !selectedMatchDayId) {
        setSelectedMatchDayId(mds[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMatchDayId) {
      fetchPredictions(selectedMatchDayId);
    }
  }, [selectedMatchDayId]);

  const fetchPredictions = async (mdId: string) => {
    try {
      const data = await api.adminGetPredictions({ matchDayId: mdId });
      setPredictions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (mdId: string, status: string) => {
    try {
      await api.adminUpdateMatchDayPredictionStatus(mdId, status);
      loadData(); // refresh match days to get new status
    } catch (err) {
      alert('Error updating prediction status');
    }
  };

  const getTeamName = (id: string) => {
    const t = teams.find(t => t.id === id);
    return t ? t.name : 'Unknown';
  };

  const handleDeletePrediction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prediction?')) {
      try {
        await api.adminDeletePrediction(id);
        fetchPredictions(selectedMatchDayId);
      } catch (err) {
        alert('Failed to delete prediction');
      }
    }
  };

  const handlePredictionStatusUpdate = async (id: string) => {
    const status = window.prompt('Enter result (WINNER, LOSER, PENDING):', 'PENDING');
    if (status && ['WINNER', 'LOSER', 'PENDING'].includes(status.toUpperCase())) {
      try {
        await api.adminUpdatePredictionStatus(id, status.toUpperCase());
        fetchPredictions(selectedMatchDayId);
      } catch (err) {
        alert('Failed to update prediction status');
      }
    } else if (status) {
      alert('Invalid status. Please enter WINNER, LOSER, or PENDING.');
    }
  };

  const selectedMd = matchDays.find(m => m.id === selectedMatchDayId);

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border bg-surface-bg flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Fan Predictions</h2>
        {matchDays.length > 0 && (
          <select 
            value={selectedMatchDayId} 
            onChange={(e) => setSelectedMatchDayId(e.target.value)}
            className="admin-input max-w-[200px]"
          >
            {matchDays.map(md => (
              <option key={md.id} value={md.id}>{md.name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedMd && (
        <div className="p-4 border-b border-surface-border bg-surface-bg/50 flex items-center justify-between">
          <div className="text-xs font-bold text-dark-muted uppercase tracking-widest">
            Status: <span className="text-dark-bg">{selectedMd.prediction_status}</span>
          </div>
          <div className="space-x-2">
            <button onClick={() => handleUpdateStatus(selectedMd.id, 'NOT_OPEN')} className={`btn-outline text-[10px] ${selectedMd.prediction_status === 'NOT_OPEN' ? 'border-brand text-brand' : ''}`}>NOT OPEN</button>
            <button onClick={() => handleUpdateStatus(selectedMd.id, 'OPEN')} className={`btn-outline text-[10px] ${selectedMd.prediction_status === 'OPEN' ? 'border-brand text-brand' : ''}`}>OPEN</button>
            <button onClick={() => handleUpdateStatus(selectedMd.id, 'CLOSED')} className={`btn-outline text-[10px] ${selectedMd.prediction_status === 'CLOSED' ? 'border-brand text-brand' : ''}`}>CLOSED</button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
          <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
            <tr>
              <th className="p-4">Ref ID</th>
              <th className="p-4">User</th>
              <th className="p-4">Match Winner</th>
              <th className="p-4">Score</th>
              <th className="p-4">Champion Pick</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center text-dark-muted">Loading...</td></tr>
            ) : predictions.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-dark-muted">No predictions found for this match day.</td></tr>
            ) : (
              predictions.map((item) => (
                <tr key={item.id} className="hover:bg-surface-bg transition-colors">
                  <td className="p-4 font-mono text-brand">{item.prediction_ref}</td>
                  <td className="p-4">
                    <div className="font-bold text-dark-bg">{item.full_name}</div>
                    <div className="text-dark-muted lowercase">{item.email}</div>
                  </td>
                  <td className="p-4">{item.predicted_winner_team_id ? getTeamName(item.predicted_winner_team_id) : 'Draw'}</td>
                  <td className="p-4 font-mono">{item.predicted_score_a} - {item.predicted_score_b}</td>
                  <td className="p-4 text-brand">{getTeamName(item.predicted_champion_team_id)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-[9px] font-black ${
                      item.status === 'WINNER' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'LOSER' ? 'bg-red-500/20 text-red-400' :
                      'bg-surface-card text-dark-muted'
                    }`}>
                      {item.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handlePredictionStatusUpdate(item.id)} className="p-1.5 hover:bg-surface-border rounded text-dark-muted hover:text-brand transition-colors">
                        <Edit set="bold" className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePrediction(item.id)} className="p-1.5 hover:bg-surface-border rounded text-dark-muted hover:text-red-500 transition-colors">
                        <Delete set="bold" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
