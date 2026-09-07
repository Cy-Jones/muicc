import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Star, TickSquare, Search, TwoUsers, Plus, Delete, Document, Upload, Camera, Image, ShieldDone } from 'react-iconly';

interface PlayerDraft {
  full_name: string;
  position: string;
  jersey_number: string;
  nationality: string;
  student_id: string;
  preferred_foot: string;
  photo_url: string;
}

export const TeamRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    country: '', // Will be set by manager profile
    coach_name: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    description: '',
    logo_url: ''
  });
  
  const [managerLoaded, setManagerLoaded] = useState(false);

  useEffect(() => {
    async function loadManager() {
      try {
        const token = localStorage.getItem('miucc_manager_token');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/manager/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.manager?.nation?.name) {
            setFormData(prev => ({ ...prev, country: data.manager.nation.name }));
            // Also update any players default nationality
            setPlayers(prev => prev.map(p => ({ ...p, nationality: data.manager.nation.name })));
          }
        }
        
        // Also check if they already have a team
        try {
          const teamRes = await api.getManagerTeam();
          if (teamRes.team) {
            navigate('/manager');
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error(err);
      } finally {
        setManagerLoaded(true);
      }
    }
    loadManager();
  }, []);

  const [players, setPlayers] = useState<PlayerDraft[]>([
    {
      full_name: '',
      position: 'Forward',
      jersey_number: '10',
      nationality: 'Liberia',
      student_id: '',
      preferred_foot: 'Right',
      photo_url: ''
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchRef, setSearchRef] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');
  const [searching, setSearching] = useState(false);

  const handlePhotoFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Player photo file size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handlePlayerChange(index, 'photo_url', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = () => {
    setPlayers([
      ...players,
      {
        full_name: '',
        position: 'Midfielder',
        jersey_number: (players.length + 1).toString(),
        nationality: formData.country,
        student_id: '',
        preferred_foot: 'Right',
        photo_url: ''
      }
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length === 1) return;
    setPlayers(players.filter((_, idx) => idx !== index));
  };

  const handlePlayerChange = (index: number, field: keyof PlayerDraft, value: string) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validPlayers = players.filter(p => p.full_name.trim() !== '');
    if (validPlayers.length === 0) {
      setErrorMessage('Please add at least 1 player to your team squad roster.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.registerTeam({
        ...formData,
        players: validPlayers
      });
      setSubmissionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit team registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setLookupError('');
    setSearching(true);

    try {
      const data = await api.checkTeamStatus(searchRef.trim());
      setLookupResult(data);
    } catch (err: any) {
      setLookupError(err.message || 'Registration reference code not found.');
      setLookupResult(null);
    } finally {
      setSearching(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-12 pb-16">
      
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-dark-border">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            TEAM <span className="text-gold text-glow">REGISTRATION</span>
          </h1>
          <p className="text-sm text-dark-muted mt-2">
            Official University Football Team & Athlete Squad Entry Portal for MIUCC 2026.
          </p>
        </div>

        <a
          href={api.getPublicTeamsExportPdfUrl()}
          target="_blank"
          rel="noreferrer"
          className="btn-outline text-xs flex items-center gap-2 shadow-md"
        >
          <Document set="bold" className="w-4 h-4" /> Download Team Listing (PDF)
        </a>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {submissionResult ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-10 space-y-8 text-center border-gold/50 shadow-glow-gold-lg relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none"></div>
                <TickSquare set="bold" className="w-20 h-20 text-gold mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                
                <div className="space-y-3 relative z-10">
                  <h2 className="font-heading text-3xl font-black text-white uppercase tracking-widest">REGISTRATION RECEIVED</h2>
                  <p className="text-sm text-dark-muted font-medium">
                    Your team and <span className="text-brand font-bold">{submissionResult.playersCount || 0} players</span> have been submitted successfully.
                  </p>
                </div>

                <div className="bg-surface-bg p-8 rounded-xl border border-surface-border max-w-md mx-auto space-y-4 shadow-inner relative z-10">
                  <p className="text-[10px] text-dark-muted font-black uppercase tracking-widest">YOUR REGISTRATION REFERENCE</p>
                  <p className="font-heading text-3xl sm:text-4xl font-black text-brand tracking-widest">{submissionResult.registrationRef}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-status-warning/10 text-status-warning border border-status-warning/30 rounded text-[10px] font-black uppercase tracking-widest">
                    STATUS: {submissionResult.status} REVIEW
                  </div>
                </div>

                <button type="button" onClick={() => navigate('/manager')} className="btn-primary px-8 py-3 text-xs rounded-md font-bold uppercase tracking-widest relative z-10 cursor-pointer">
                  Go to Dashboard
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="glass-card p-6 sm:p-10 space-y-10"
              >
                {/* TEAM INFO */}
                <div className="space-y-6">
                  <h2 className="font-heading text-xl font-black text-white border-b border-dark-border pb-4 flex items-center gap-3 uppercase tracking-widest">
                    <Star set="bold" className="w-5 h-5 text-gold" /> Official Team Information
                  </h2>

                  {errorMessage && <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/50 text-status-error text-xs font-bold uppercase tracking-wider">{errorMessage}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Team Name</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Liberia Eagles FC" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">University / Org</label>
                      <input type="text" required value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} placeholder="Marwadi University" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Country</label>
                      <select 
                        required
                        disabled
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full input-field opacity-70 cursor-not-allowed"
                      >  {['Liberia','Eswatini','Tanzania','South Sudan','Zimbabwe','India','Mozambique','Nigeria','Uganda','Zambia'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Head Coach Name</label>
                      <input type="text" required value={formData.coach_name} onChange={(e) => setFormData({ ...formData, coach_name: e.target.value })} placeholder="George Weah Jr." className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Team Manager Name</label>
                      <input type="text" required value={formData.manager_name} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} placeholder="Samuel Kollie" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Manager Email</label>
                      <input type="email" required value={formData.manager_email} onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })} placeholder="manager@university.edu" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Manager Phone</label>
                      <input type="text" required value={formData.manager_phone} onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })} placeholder="+231 88 123 4567" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Team Logo URL</label>
                      <input type="url" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." className="input-field" />
                    </div>
                  </div>
                </div>

                {/* SQUAD BUILDER */}
                <div className="space-y-6 pt-6 border-t border-dark-border">
                  <div className="flex items-end justify-between border-b border-dark-border pb-4">
                    <div>
                      <h2 className="font-heading text-xl font-black text-white flex items-center gap-3 uppercase tracking-widest">
                        <TwoUsers set="bold" className="w-5 h-5 text-gold" /> Squad Roster
                      </h2>
                      <p className="text-[10px] text-dark-muted mt-1 uppercase tracking-widest font-bold">Register all athletes ({players.length} Players)</p>
                    </div>
                    <button type="button" onClick={handleAddPlayer} className="btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1 shadow-glow-gold">
                      <Plus set="bold" className="w-3 h-3" /> Add Player
                    </button>
                  </div>

                  <div className="space-y-6">
                    {players.map((p, idx) => (
                      <div key={idx} className="p-6 bg-surface-card rounded-xl border border-surface-border space-y-5 relative hover:border-gold/50 transition-colors group">
                        <div className="flex justify-between items-center border-b border-dark-border pb-3">
                          <span className="font-heading text-sm font-black text-gold tracking-widest">PLAYER #{idx + 1}</span>
                          {players.length > 1 && (
                            <button type="button" onClick={() => handleRemovePlayer(idx)} className="text-[10px] text-status-error/80 hover:text-status-error flex items-center gap-1 font-black uppercase tracking-widest transition-colors">
                              <Delete set="bold" className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Full Athlete Name</label>
                            <input type="text" required value={p.full_name} onChange={(e) => handlePlayerChange(idx, 'full_name', e.target.value)} placeholder="Emmanuel Flomo" className="input-field" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Jersey #</label>
                            <input type="number" required value={p.jersey_number} onChange={(e) => handlePlayerChange(idx, 'jersey_number', e.target.value)} placeholder="10" className="input-field" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Position</label>
                            <select value={p.position} onChange={(e) => handlePlayerChange(idx, 'position', e.target.value)} className="input-field">
                              <option value="Goalkeeper">Goalkeeper</option>
                              <option value="Defender">Defender</option>
                              <option value="Midfielder">Midfielder</option>
                              <option value="Forward">Forward</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Nationality</label>
                            <input type="text" required value={p.nationality} onChange={(e) => handlePlayerChange(idx, 'nationality', e.target.value)} placeholder="Liberia" className="input-field" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-dark-muted mb-1.5">Student ID (GR#)</label>
                            <input type="text" value={p.student_id} onChange={(e) => handlePlayerChange(idx, 'student_id', e.target.value)} placeholder="GR-2026-001" className="input-field" />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface-bg p-4 rounded-lg border">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-bg border border-gold/40 flex-shrink-0 flex items-center justify-center relative shadow-inner">
                            {p.photo_url ? (
                              <img src={p.photo_url} alt="Player" className="w-full h-full object-cover" />
                            ) : (
                              <Camera set="bold" className="w-5 h-5 text-gold/40" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/40 rounded-md text-[10px] font-black tracking-widest uppercase cursor-pointer inline-flex items-center gap-2 transition-colors">
                                <Upload set="bold" className="w-3.5 h-3.5" /> Upload Photo
                                <input type="file" accept="image/*" onChange={(e) => handlePhotoFileUpload(idx, e)} className="hidden" />
                              </label>
                              {p.photo_url && (
                                <button type="button" onClick={() => handlePlayerChange(idx, 'photo_url', '')} className="text-[10px] text-status-error/80 hover:text-status-error font-black uppercase tracking-widest transition-colors">
                                  Clear
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <Image set="bold" className="w-4 h-4 text-dark-muted" />
                                <input type="text" value={p.photo_url} onChange={(e) => handlePlayerChange(idx, 'photo_url', e.target.value)} placeholder="Or paste image URL" className="input-field py-1.5 text-[10px]" />
                              </div>
                              {players.length > 1 && (
                                <button type="button" onClick={() => handleRemovePlayer(idx)} className="p-1.5 text-status-error hover:bg-status-error/10 rounded transition-colors" title="Delete Player">
                                  <Delete set="bold" className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={handleAddPlayer} className="w-full py-4 bg-surface-card border border-dashed border-surface-border hover:border-gold hover:text-gold text-dark-muted rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    <Plus set="bold" className="w-4 h-4" /> Create new player
                  </button>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full py-4 rounded-xl text-sm shadow-glow-gold disabled:opacity-50 mt-8">
                  {submitting ? 'Submitting...' : `Submit Team & ${players.filter(p => p.full_name.trim()).length} Players`}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="glass-card p-6 border-gold/30 space-y-5">
            <h3 className="font-heading text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-dark-border pb-3">
              <Search set="bold" className="w-5 h-5 text-gold" /> Status Check
            </h3>
            <p className="text-xs text-dark-muted font-medium">Enter your reference code to check review progress.</p>

            <form onSubmit={handleLookup} className="space-y-4">
              <input type="text" required value={searchRef} onChange={(e) => setSearchRef(e.target.value)} placeholder="MIUCC-..." className="input-field font-mono uppercase tracking-widest text-center" />
              <button type="submit" disabled={searching} className="btn-outline w-full text-xs py-3">
                {searching ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {lookupError && <p className="text-[10px] text-status-error font-black uppercase tracking-widest bg-status-error/10 p-3 rounded-lg border border-status-error/30 text-center">{lookupError}</p>}

            {lookupResult && (
              <div className="p-4 rounded-lg bg-surface-bg border border-surface-border space-y-3 shadow-inner">
                <div className="flex justify-between items-center border-b border-surface-border pb-2">
                  <span className="text-dark-muted font-mono text-[10px]">{lookupResult.registration_ref}</span>
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                    lookupResult.status === 'APPROVED' ? 'bg-status-completed/10 text-status-completed border border-status-completed/30' : 'bg-status-warning/10 text-status-warning border border-status-warning/30'
                  }`}>
                    {lookupResult.status}
                  </span>
                </div>
                <div>
                  <p className="font-black text-white text-xs uppercase tracking-wider">{lookupResult.name}</p>
                  <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-0.5">{lookupResult.university} • {lookupResult.country}</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 border-gold/30 space-y-4">
             <h3 className="font-heading text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-dark-border pb-3">
               <TwoUsers set="bold" className="w-5 h-5 text-gold" /> Squad Summary
             </h3>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
                  <span>Total Players</span>
                  <span className="text-brand bg-surface-bg px-2 py-0.5 rounded border border-surface-border">{players.filter(p => p.full_name.trim()).length} / 26</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
                  <span>Forwards</span>
                  <span className="text-white">{players.filter(p => p.position === 'Forward').length}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
                  <span>Midfielders</span>
                  <span className="text-white">{players.filter(p => p.position === 'Midfielder').length}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
                  <span>Defenders</span>
                  <span className="text-white">{players.filter(p => p.position === 'Defender').length}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-dark-muted">
                  <span>Goalkeepers</span>
                  <span className="text-white">{players.filter(p => p.position === 'Goalkeeper').length}</span>
                </div>
             </div>
          </div>

          <div className="glass-card p-6 border-gold/30 space-y-4 hidden sm:block">
             <h3 className="font-heading text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-dark-border pb-3">
               <ShieldDone set="bold" className="w-5 h-5 text-gold" /> Guidelines
             </h3>
             <ul className="text-[10px] text-dark-muted space-y-3 font-bold uppercase tracking-wider list-disc pl-4 marker:text-gold/50">
               <li>All athletes must be enrolled students.</li>
               <li>Valid Student ID is required.</li>
               <li>Squad size limited to 26 players (FIFA Rules).</li>
               <li>Teams must bring own training kits.</li>
             </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
