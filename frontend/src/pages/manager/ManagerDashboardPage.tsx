import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShieldDone, User, ArrowRight, Document, Edit, CloseSquare, Delete, Plus, Camera, Upload } from 'react-iconly';
import { motion } from 'framer-motion';
import { ManagerMatchesSection } from './ManagerMatchesSection';
import { ManagerEditTeamModal } from './ManagerEditTeamModal';
import { ManagerPlayerModal } from './ManagerPlayerModal';
const getCountryFlag = (country: string) => {
  const map: Record<string, string> = {
    'Liberia': '🇱🇷', 'Eswatini': '🇸🇿', 'Tanzania': '🇹🇿',
    'South Sudan': '🇸🇸', 'Zimbabwe': '🇿🇼',
    'Nigeria': '🇳🇬', 'Uganda': '🇺🇬'
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
            {team.status.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {team.admin_message && (
        <div className="bg-status-warning/10 border border-status-warning/30 p-5 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-status-warning">
            <h4 className="font-bold uppercase tracking-widest text-xs">Admin Announcement</h4>
          </div>
          <p className="text-sm text-dark-bg whitespace-pre-wrap">{team.admin_message}</p>
        </div>
      )}

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
        <ManagerEditTeamModal
          teamForm={teamForm}
          setTeamForm={setTeamForm}
          onClose={() => setIsEditingTeam(false)}
          onSaved={() => {
            setIsEditingTeam(false);
            fetchData();
          }}
        />
      )}

      {editingPlayer && (
        <ManagerPlayerModal
          mode="edit"
          playerForm={editForm}
          setPlayerForm={setEditForm}
          editingPlayerId={editingPlayer.id}
          onClose={() => setEditingPlayer(null)}
          onSaved={() => {
            setEditingPlayer(null);
            fetchData();
          }}
        />
      )}

      {isAddingPlayer && (
        <ManagerPlayerModal
          mode="add"
          playerForm={addForm}
          setPlayerForm={setAddForm}
          onClose={() => setIsAddingPlayer(false)}
          onSaved={() => {
            setIsAddingPlayer(false);
            setAddForm(defaultPlayerForm);
            fetchData();
          }}
        />
      )}

      <ManagerMatchesSection team={team} players={players} />
    </motion.div>
  );
};
