import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ShieldDone, Plus, Document, Lock } from 'react-iconly';
import { motion, AnimatePresence } from 'framer-motion';

export const ManagersModule: React.FC = () => {
  const [managers, setManagers] = useState<any[]>([]);
  const [nations, setNations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ nation_id: '', email: '', password: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [manRes, settingsRes] = await Promise.all([
        api.adminGetManagers(),
        api.getSettings() // Has nations
      ]);
      setManagers(manRes);
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
            {managers.map(m => (
              <tr key={m.id} className="hover:bg-surface-hover transition-colors">
                <td className="p-4">{m.nation_name}</td>
                <td className="p-4 text-brand">{m.email}</td>
                <td className="p-4 text-dark-bg font-mono tracking-wider">{m.plain_password || '••••••••'}</td>
                <td className="p-4 text-dark-muted">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <button onClick={() => openModal(m.nation_id)} className="btn-outline text-[10px] py-1 px-2">
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
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
      </AnimatePresence>
    </div>
  );
};
