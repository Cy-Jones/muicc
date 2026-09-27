import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ShieldDone, Plus, Document, Lock, CloseSquare } from 'react-iconly';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminManagerCredentialsModal } from './AdminManagerCredentialsModal';
import { AdminViewTeamModal } from './AdminViewTeamModal';

export const ManagersModule: React.FC = () => {
  const [managers, setManagers] = useState<any[]>([]);
  const [nations, setNations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ nation_id: '', email: '', password: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [manRes, settingsRes, teamsRes, playersRes] = await Promise.all([
        api.adminGetManagers(),
        api.getSettings(), // Has nations
        api.adminGetTeams(),
        api.adminGetPlayers()
      ]);
      setManagers(manRes);
      setTeams(teamsRes);
      setPlayers(playersRes);
      if (settingsRes?.nations) setNations(settingsRes.nations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: { nation_id: string; email: string; password: any }) => {
    setMessage('');
    try {
      await api.adminUpdateManager(data);
      setMessage('Manager credentials saved successfully.');
      setShowModal(false);
      loadData();
      setFormData({ nation_id: '', email: '', password: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to save manager credentials');
    }
  };

  const handleDelete = async (id: string, nationName: string) => {
    if (!window.confirm(`Are you sure you want to delete the manager for ${nationName}? This action cannot be undone.`)) return;
    try {
      await api.adminDeleteManager(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete manager');
    }
  };

  const handleToggleBlock = async (id: string, currentlyBlocked: number, nationName: string) => {
    const action = currentlyBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} the manager for ${nationName}?`)) return;
    try {
      await api.adminBlockManager(id, !currentlyBlocked);
      loadData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} manager`);
    }
  };

  const openModal = (nation_id?: string) => {
    if (nation_id) {
      const existing = managers.find(m => m.nation_id === nation_id);
      setFormData({ nation_id, email: existing?.email || '', password: '' });
      setIsEditMode(true);
    } else {
      setFormData({ nation_id: nations[0]?.id || '', email: '', password: '' });
      setIsEditMode(false);
    }
    setShowModal(true);
  };

  if (loading) return <div className="text-dark-muted font-bold animate-pulse text-sm">Loading Managers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-black text-dark-bg uppercase tracking-wide">Team Managers</h2>
          <p className="text-xs font-bold text-dark-muted mt-1">Manage portal access credentials for participating nations.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-xs shadow-sm flex items-center gap-2">
          <Plus set="bold" className="w-4 h-4" /> Create Credentials
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-xs font-bold uppercase text-center flex items-center justify-center gap-2">
          <ShieldDone set="bold" className="w-4 h-4" /> {message}
        </div>
      )}

      <div className="data-card overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border text-[10px] font-black text-dark-muted uppercase tracking-widest bg-surface-bg">
              <th className="p-4">Nation</th>
              <th className="p-4">Email</th>
              <th className="p-4">Password</th>
              <th className="p-4">Created At</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border text-xs font-bold text-dark-bg">
            {managers.map(m => {
              const team = teams.find((t: any) => t.country === m.nation_name);
              return (
              <tr key={m.id} className={`hover:bg-surface-hover transition-colors ${m.is_blocked ? 'opacity-60' : ''}`}>
                <td className="p-4 flex items-center gap-2">
                  {m.nation_name}
                  {m.is_blocked === 1 && <span className="bg-status-rejected/10 text-status-rejected text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Blocked</span>}
                </td>
                <td className="p-4 text-brand">{m.email}</td>
                <td className="p-4 text-dark-bg font-mono tracking-wider">{m.plain_password || '••••••••'}</td>
                <td className="p-4 text-dark-muted">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right flex justify-end gap-2 items-center">
                  {m.is_blocked ? (
                    <button onClick={() => handleToggleBlock(m.id, m.is_blocked, m.nation_name)} className="btn-outline text-[10px] py-1 px-2 border-status-completed text-status-completed hover:bg-status-completed/10">
                      Unblock
                    </button>
                  ) : (
                    <button onClick={() => handleToggleBlock(m.id, m.is_blocked, m.nation_name)} className="btn-outline text-[10px] py-1 px-2 border-status-warning text-status-warning hover:bg-status-warning/10">
                      Block
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id, m.nation_name)} className="btn-outline text-[10px] py-1 px-2 border-status-rejected text-status-rejected hover:bg-status-rejected/10">
                    Delete
                  </button>
                  <button onClick={() => openModal(m.nation_id)} className="btn-outline text-[10px] py-1 px-2">
                    Reset Password
                  </button>
                  {team && (
                    <button onClick={() => setSelectedTeam(team)} className="btn-primary text-[10px] py-1 px-2">
                      View Team
                    </button>
                  )}
                </td>
              </tr>
            )})}
            {managers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-dark-muted">No manager accounts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <AdminManagerCredentialsModal 
            initialData={formData}
            isEditMode={isEditMode}
            nations={nations}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}

        {selectedTeam && (
          <AdminViewTeamModal 
            selectedTeam={selectedTeam}
            players={players}
            onClose={() => setSelectedTeam(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
