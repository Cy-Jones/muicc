import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ShieldDone, Plus, Document, Lock, CloseSquare } from 'react-iconly';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.adminUpdateManager(formData);
      setMessage('Manager credentials saved successfully.');
      setShowModal(false);
      loadData();
      setFormData({ nation_id: '', email: '', password: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to save manager credentials');
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
              <tr key={m.id} className="hover:bg-surface-hover transition-colors">
                <td className="p-4">{m.nation_name}</td>
                <td className="p-4 text-brand">{m.email}</td>
                <td className="p-4 text-dark-bg font-mono tracking-wider">{m.plain_password || '••••••••'}</td>
                <td className="p-4 text-dark-muted">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right flex justify-end gap-2">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface-card w-full max-w-md p-6 relative rounded-xl border border-surface-border">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-dark-muted hover:text-dark-bg">&times;</button>
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest mb-4">
                {isEditMode ? 'Reset Password' : 'Create Manager Account'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1.5">Nation</label>
                  <select required value={formData.nation_id} onChange={e => setFormData({...formData, nation_id: e.target.value})} className="input-field w-full">
                    <option value="">Select Nation</option>
                    {nations.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1.5">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field w-full" placeholder="manager@nation.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1.5">Password</label>
                  <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field w-full" placeholder="Secure password" />
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-2">Save Credentials</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {selectedTeam && (() => {
          const teamPlayers = players.filter(p => p.team_id === selectedTeam.id);
          return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface-card w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
                <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Team Details: {selectedTeam.name}</h2>
                <button onClick={() => setSelectedTeam(null)} className="text-dark-muted hover:text-dark-bg transition-colors">
                  <CloseSquare set="bold" className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-6">
                  {selectedTeam.logo_url ? (
                    <img src={selectedTeam.logo_url} alt="" className="w-24 h-24 rounded-lg object-contain bg-surface-bg p-2 border border-surface-border shrink-0" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center shrink-0">
                      <ShieldDone set="bold" className="w-12 h-12 text-dark-muted" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div>
                      <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">University</div>
                      <div className="text-sm text-dark-bg font-bold">{selectedTeam.university}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Country</div>
                      <div className="text-sm text-dark-bg font-bold">{selectedTeam.country}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Head Coach</div>
                      <div className="text-sm text-dark-bg font-bold">{selectedTeam.coach_name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Manager Contact</div>
                      <div className="text-sm text-dark-bg font-bold truncate">{selectedTeam.manager_email}</div>
                      <div className="text-xs text-dark-muted">{selectedTeam.manager_phone}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-sm font-black text-dark-bg uppercase tracking-widest border-b border-surface-border pb-2 mb-4">Roster ({teamPlayers.length} Players)</h3>
                  {teamPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teamPlayers.map((p: any) => (
                        <div key={p.id} className="p-3 rounded bg-surface-bg border border-surface-border flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-dark-bg">{p.full_name}</div>
                            <div className="text-[10px] text-dark-muted font-black uppercase">{p.position}</div>
                          </div>
                          <div className="text-sm font-mono font-bold text-brand">#{p.jersey_number}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-dark-muted">No players submitted.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  );
};
