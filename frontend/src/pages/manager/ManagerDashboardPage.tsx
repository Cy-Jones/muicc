import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShieldDone, User, ArrowRight, Document, Edit, CloseSquare, Delete, Plus, Camera, Upload } from 'react-iconly';
import { motion } from 'framer-motion';

const getCountryFlag = (country: string) => {
  const map: Record<string, string> = {
    'Liberia': '🇱🇷', 'Eswatini': '🇸🇿', 'Tanzania': '🇹🇿',
    'South Sudan': '🇸🇸', 'Zimbabwe': '🇿🇼', 'India': '🇮🇳',
    'Mozambique': '🇲🇿', 'Nigeria': '🇳🇬', 'Uganda': '🇺🇬', 'Zambia': '🇿🇲'
  };
  return map[country] || '🏳️';
};

export const ManagerDashboardPage: React.FC = () => {
  const [data, setData] = useState<{ team: any; players: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const defaultPlayerForm = {
    full_name: '', position: 'Forward', jersey_number: '',
    course: '', student_id: '', dob: '', nationality: '',
    medical_conditions: '', emergency_contact_name: '',
    emergency_contact_phone: '+91 ', photo_url: ''
  };
  const [editForm, setEditForm] = useState(defaultPlayerForm);
  const [addForm, setAddForm] = useState(defaultPlayerForm);

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState<any>({});

  const handlePhotoFileUpload = (formType: 'add' | 'edit', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Player photo file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (formType === 'add') {
          setAddForm(prev => ({ ...prev, photo_url: reader.result as string }));
        } else {
          setEditForm(prev => ({ ...prev, photo_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeamLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Team logo file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamForm((prev: any) => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.getManagerTeam();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch manager team data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (player: any) => {
    setEditingPlayer(player);
    setEditForm({
      full_name: player.full_name || '',
      position: player.position || 'Forward',
      jersey_number: player.jersey_number || '',
      course: player.course || '',
      student_id: player.student_id || '',
      dob: player.dob || '',
      nationality: player.nationality || '',
      medical_conditions: player.medical_conditions || '',
      emergency_contact_name: player.emergency_contact_name || '',
      emergency_contact_phone: player.emergency_contact_phone || '+91 ',
      photo_url: player.photo_url || ''
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    try {
      await api.managerUpdatePlayer(editingPlayer.id, editForm);
      setEditingPlayer(null);
      fetchData(); // reload data
    } catch (err: any) {
      alert(err.message || 'Failed to update player');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.managerAddPlayer(addForm);
      setIsAddingPlayer(false);
      setAddForm(defaultPlayerForm);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add player');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      await api.managerDeletePlayer(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete player');
    }
  };

  const handleEditTeamClick = () => {
    setTeamForm({
      name: data?.team?.name || '',
      university: data?.team?.university || '',
      coach_name: data?.team?.coach_name || '',
      manager_name: data?.team?.manager_name || '',
      manager_email: data?.team?.manager_email || '',
      manager_phone: data?.team?.manager_phone || '',
      logo_url: data?.team?.logo_url || ''
    });
    setIsEditingTeam(true);
  };

  const handleTeamUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.managerUpdateTeam(teamForm);
      setIsEditingTeam(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update team details');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no team is registered yet
  if (!data?.team) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-card rounded-xl p-8 border border-surface-border text-center max-w-2xl mx-auto mt-12">
        <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-6 text-dark-muted">
          <ShieldDone set="bold" className="w-8 h-8" />
        </div>
        <h2 className="font-heading text-2xl font-black text-dark-bg uppercase tracking-widest mb-3">Welcome, Manager!</h2>
        <p className="text-dark-muted mb-8 text-sm">
          You haven't submitted your team registration yet. Click below to begin the registration process and submit your squad.
        </p>
        <Link to="/manager/register-team" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
          Register Team <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    );
  }

  const { team, players } = data;

  const statusColors: Record<string, string> = {
    'PENDING': 'text-status-pending',
    'APPROVED': 'text-status-completed',
    'CHANGES_REQUIRED': 'text-status-failed',
    'REJECTED': 'text-status-failed',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-24 max-w-[96%] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black text-dark-bg uppercase tracking-widest">Dashboard</h1>
          <p className="text-xs text-dark-muted font-medium mt-1">View your team's status and registered squad.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-surface-card px-4 py-2 rounded-lg border border-surface-border">
          <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest">Status:</div>
          <div className={`text-xs font-black uppercase tracking-widest ${statusColors[team.status] || 'text-dark-bg'}`}>
            {team.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-card rounded-xl border border-surface-border p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
            <Document set="bold" />
          </div>
          <div>
            <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Registration Ref</div>
            <div className="font-mono text-dark-bg font-bold">{team.registration_ref}</div>
          </div>
        </div>
        <div className="bg-surface-card rounded-xl border border-surface-border p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-center overflow-hidden shrink-0">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="max-h-full object-contain p-1" />
              ) : (
                <span className="text-[2.5rem] leading-none pt-1" title={team.country}>{getCountryFlag(team.country)}</span>
              )}
            </div>
            <div>
              <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Team Name</div>
              <div className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest truncate max-w-[150px]">{team.name}</div>
            </div>
          </div>
          <button onClick={handleEditTeamClick} className="btn-outline px-3 py-1.5 text-[10px]">Edit Team</button>
        </div>
        <div className="bg-surface-card rounded-xl border border-surface-border p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-hover text-dark-muted flex items-center justify-center">
            <User set="bold" />
          </div>
          <div>
            <div className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Total Players</div>
            <div className="font-heading text-xl font-black text-dark-bg">{players.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border flex justify-between items-center">
          <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Team Roster</h2>
          <button onClick={() => setIsAddingPlayer(true)} className="btn-primary text-xs flex items-center gap-2 px-4 py-2">
            <Plus set="bold" className="w-4 h-4" /> Add Player
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bg border-b border-surface-border text-[10px] font-black text-dark-muted uppercase tracking-widest">
                <th className="p-4">Player ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Position</th>
                <th className="p-4">Jersey</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p: any) => (
                <tr key={p.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                  <td className="p-4 font-mono text-brand font-bold text-sm">{p.player_id || 'PENDING'}</td>
                  <td className="p-4 text-dark-bg font-bold">{p.full_name}</td>
                  <td className="p-4 text-dark-muted text-sm">{p.position}</td>
                  <td className="p-4 text-dark-bg font-bold">{p.jersey_number}</td>
                  <td className={`p-4 text-xs font-black uppercase tracking-widest ${statusColors[p.status] || 'text-dark-muted'}`}>
                    {p.status}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEditClick(p)} className="p-1.5 rounded bg-surface-bg text-dark-muted hover:text-brand hover:bg-brand/10 transition-colors" title="Edit Player">
                      <Edit set="bold" className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeletePlayer(p.id)} className="p-1.5 rounded bg-surface-bg text-dark-muted hover:text-status-live hover:bg-status-live/10 transition-colors" title="Delete Player">
                      <Delete set="bold" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-dark-muted">No players found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-card w-full max-w-lg rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
              <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Edit Team Details</h2>
              <button onClick={() => setIsEditingTeam(false)} className="text-dark-muted hover:text-dark-bg transition-colors">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleTeamUpdateSubmit} className="p-6 space-y-4 overflow-y-auto no-scrollbar">
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Team Name <span className="text-status-error">*</span></label>
                <input required type="text" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">University <span className="text-status-error">*</span></label>
                <input required type="text" value={teamForm.university} onChange={e => setTeamForm({...teamForm, university: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Head Coach Name <span className="text-status-error">*</span></label>
                <input required type="text" value={teamForm.coach_name} onChange={e => setTeamForm({...teamForm, coach_name: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Manager Name <span className="text-status-error">*</span></label>
                <input required type="text" value={teamForm.manager_name} onChange={e => setTeamForm({...teamForm, manager_name: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Manager Email <span className="text-status-error">*</span></label>
                <input required type="email" value={teamForm.manager_email} onChange={e => setTeamForm({...teamForm, manager_email: e.target.value})} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Manager Phone <span className="text-status-error">*</span></label>
                <input required type="tel" value={teamForm.manager_phone} onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith('+91 ')) val = '+91 ';
                  if (val.length > 14) val = val.substring(0, 14);
                  setTeamForm({...teamForm, manager_phone: val});
                }} className="w-full bg-surface-bg border border-surface-border rounded px-4 py-2 text-sm text-dark-bg focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-dark-muted uppercase tracking-widest mb-2 block">Team Logo (Optional)</label>
                <div className="flex items-center gap-4">
                  {teamForm.logo_url && (
                    <img src={teamForm.logo_url} alt="Logo Preview" className="w-12 h-12 rounded object-contain bg-surface-bg border border-surface-border p-1" />
                  )}
                  <label className="btn-outline px-4 py-2 text-xs cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Logo
                    <input type="file" accept="image/*" onChange={handleTeamLogoUpload} className="hidden" />
                  </label>
                  {teamForm.logo_url && (
                    <button type="button" onClick={() => setTeamForm({...teamForm, logo_url: ''})} className="text-xs text-status-error hover:underline">Remove</button>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-surface-border flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditingTeam(false)} className="btn-outline px-6 py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary px-6 py-2 text-xs">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-card w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
              <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Edit Player</h2>
              <button onClick={() => setEditingPlayer(null)} className="text-dark-muted hover:text-dark-bg transition-colors">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Full Name</label>
                  <input type="text" value={editForm.full_name} onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Jersey Number</label>
                  <input type="number" value={editForm.jersey_number} onChange={e => setEditForm(prev => ({ ...prev, jersey_number: e.target.value }))} className="input-field" required min="1" max="99" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Position</label>
                  <select value={editForm.position} onChange={e => setEditForm(prev => ({ ...prev, position: e.target.value }))} className="input-field" required>
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Nationality</label>
                  <input type="text" value={editForm.nationality} onChange={e => setEditForm(prev => ({ ...prev, nationality: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Date of Birth</label>
                  <input type="date" value={editForm.dob} onChange={e => setEditForm(prev => ({ ...prev, dob: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Course/Program</label>
                  <input type="text" value={editForm.course} onChange={e => setEditForm(prev => ({ ...prev, course: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Student ID (GR#)</label>
                  <input type="text" value={editForm.student_id} onChange={e => setEditForm(prev => ({ ...prev, student_id: e.target.value }))} className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-bg border border-surface-border flex-shrink-0 flex items-center justify-center relative shadow-inner">
                      {editForm.photo_url ? (
                        <img src={editForm.photo_url} alt="Player" className="w-full h-full object-cover" />
                      ) : (
                        <Camera set="bold" className="w-4 h-4 text-dark-muted" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/40 rounded-md text-[10px] font-black tracking-widest uppercase cursor-pointer inline-flex items-center gap-2 transition-colors">
                        <Upload set="bold" className="w-3.5 h-3.5" /> Upload Photo
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoFileUpload('edit', e)} className="hidden" />
                      </label>
                      {editForm.photo_url && (
                        <button type="button" onClick={() => setEditForm(prev => ({ ...prev, photo_url: '' }))} className="text-[10px] text-status-error/80 hover:text-status-error font-black uppercase tracking-widest transition-colors">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-surface-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Medical Conditions / Allergies</label>
                  <input type="text" value={editForm.medical_conditions} onChange={e => setEditForm(prev => ({ ...prev, medical_conditions: e.target.value }))} placeholder="None" className="input-field" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Name</label>
                  <input type="text" value={editForm.emergency_contact_name} onChange={e => setEditForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Phone</label>
                  <input 
                    type="tel" 
                    required
                    pattern="^\+91 [0-9]{10}$"
                    maxLength={14}
                    title="Must be a valid 10-digit Indian phone number"
                    value={editForm.emergency_contact_phone} 
                    onChange={e => {
                      let val = e.target.value;
                      if (!val.startsWith('+91 ')) {
                        val = '+91 ' + val.replace(/^\+?9?1?\s*/, '').replace(/\D/g, '').slice(0, 10);
                      } else {
                        val = '+91 ' + val.slice(4).replace(/\D/g, '').slice(0, 10);
                      }
                      setEditForm(prev => ({ ...prev, emergency_contact_phone: val }));
                    }} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setEditingPlayer(null)} className="btn-outline px-6 py-2">Cancel</button>
                <button type="submit" className="btn-primary px-6 py-2">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isAddingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-card w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-surface-border shrink-0">
              <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Add Player</h2>
              <button onClick={() => setIsAddingPlayer(false)} className="text-dark-muted hover:text-dark-bg transition-colors">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Full Name</label>
                  <input type="text" value={addForm.full_name} onChange={e => setAddForm(prev => ({ ...prev, full_name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Jersey Number</label>
                  <input type="number" value={addForm.jersey_number} onChange={e => setAddForm(prev => ({ ...prev, jersey_number: e.target.value }))} className="input-field" required min="1" max="99" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Position</label>
                  <select value={addForm.position} onChange={e => setAddForm(prev => ({ ...prev, position: e.target.value }))} className="input-field" required>
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Nationality</label>
                  <input type="text" value={addForm.nationality} onChange={e => setAddForm(prev => ({ ...prev, nationality: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Date of Birth</label>
                  <input type="date" value={addForm.dob} onChange={e => setAddForm(prev => ({ ...prev, dob: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Course/Program</label>
                  <input type="text" value={addForm.course} onChange={e => setAddForm(prev => ({ ...prev, course: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Student ID (GR#)</label>
                  <input type="text" value={addForm.student_id} onChange={e => setAddForm(prev => ({ ...prev, student_id: e.target.value }))} className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-bg border border-surface-border flex-shrink-0 flex items-center justify-center relative shadow-inner">
                      {addForm.photo_url ? (
                        <img src={addForm.photo_url} alt="Player" className="w-full h-full object-cover" />
                      ) : (
                        <Camera set="bold" className="w-4 h-4 text-dark-muted" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/40 rounded-md text-[10px] font-black tracking-widest uppercase cursor-pointer inline-flex items-center gap-2 transition-colors">
                        <Upload set="bold" className="w-3.5 h-3.5" /> Upload Photo
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoFileUpload('add', e)} className="hidden" />
                      </label>
                      {addForm.photo_url && (
                        <button type="button" onClick={() => setAddForm(prev => ({ ...prev, photo_url: '' }))} className="text-[10px] text-status-error/80 hover:text-status-error font-black uppercase tracking-widest transition-colors">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-surface-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Medical Conditions / Allergies</label>
                  <input type="text" value={addForm.medical_conditions} onChange={e => setAddForm(prev => ({ ...prev, medical_conditions: e.target.value }))} placeholder="None" className="input-field" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Name</label>
                  <input type="text" value={addForm.emergency_contact_name} onChange={e => setAddForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Emergency Contact Phone</label>
                  <input 
                    type="tel" 
                    required
                    pattern="^\+91 [0-9]{10}$"
                    maxLength={14}
                    title="Must be a valid 10-digit Indian phone number"
                    value={addForm.emergency_contact_phone} 
                    onChange={e => {
                      let val = e.target.value;
                      if (!val.startsWith('+91 ')) {
                        val = '+91 ' + val.replace(/^\+?9?1?\s*/, '').replace(/\D/g, '').slice(0, 10);
                      } else {
                        val = '+91 ' + val.slice(4).replace(/\D/g, '').slice(0, 10);
                      }
                      setAddForm(prev => ({ ...prev, emergency_contact_phone: val }));
                    }} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-surface-border flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsAddingPlayer(false)} className="btn-outline px-6 py-2">Cancel</button>
                <button type="submit" className="btn-primary px-6 py-2">Add Player</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};
