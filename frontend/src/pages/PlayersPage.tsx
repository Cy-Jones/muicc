import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Search, ShieldDone, Scan, CloseSquare } from 'react-iconly';

export const PlayersPage: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [teamId, setTeamId] = useState('');
  const [position, setPosition] = useState('');

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [playersData, teamsData] = await Promise.all([
          api.getPlayers({ search, team_id: teamId, position }),
          api.getTeams()
        ]);
        setPlayers(playersData);
        setTeams(teamsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [search, teamId, position]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    const cleaned = scanInput.trim();
    if (!cleaned) {
      setScanError('Please enter a valid Player ID or scan link.');
      return;
    }
    const match = cleaned.match(/MIUCC-PLY-[A-Za-z0-9]+/i) || [cleaned];
    const targetId = match[0].toUpperCase();
    setShowScannerModal(false);
    navigate(`/player/\${targetId}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-border">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-dark-bg uppercase tracking-tight">
            Player Directory
          </h1>
          <p className="text-sm text-dark-surface mt-1 font-medium">Search and verify official approved student athletes participating in MIUCC 2026.</p>
        </div>
      </div>

      <div className="data-card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search set="bold" className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            className="input-field pl-10 text-xs font-bold"
          />
        </div>

        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="input-field text-xs font-bold uppercase tracking-wider">
          <option value="">All Teams</option>
          {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>

        <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-field text-xs font-bold uppercase tracking-wider">
          <option value="">All Positions</option>
          <option value="Goalkeeper">Goalkeeper</option>
          <option value="Defender">Defender</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Forward">Forward</option>
        </select>

        <button onClick={() => { setSearch(''); setTeamId(''); setPosition(''); }} className="btn-outline text-xs bg-surface-card">
          Reset Filters
        </button>
      </div>

      {loading ? (
        <div className="data-card p-12 text-center text-dark-muted font-medium border-dashed">Loading verified players...</div>
      ) : players.length === 0 ? (
        <div className="data-card p-12 text-center text-dark-muted border-dashed font-medium">No approved players found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
          {players.map((player) => (
            <div key={player.id} onClick={() => setSelectedPlayer(player)} className="data-card overflow-hidden hover:border-brand/30 hover:shadow-card-hover cursor-pointer transition-all duration-200 group flex flex-col justify-between p-0">
              <div className="relative aspect-[3/4] bg-surface-bg border-b border-surface-border">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-dark-muted bg-surface-bg">
                    <span className="font-heading text-4xl font-black">{player.full_name.substring(0,1)}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-surface-card/90 backdrop-blur border border-surface-border text-brand text-[10px] font-black shadow-sm">#{player.jersey_number}</div>
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-brand/90 backdrop-blur border border-brand text-black text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm">
                  <ShieldDone set="bold" className="w-3 h-3" /> VERIFIED
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-2 bg-surface-card group-hover:bg-surface-hover transition-colors">
                <div>
                  <h3 className="font-heading text-sm font-black text-dark-bg uppercase tracking-tight group-hover:text-brand transition-colors truncate">{player.full_name}</h3>
                  <p className="text-[9px] text-dark-muted font-mono tracking-wider mt-0.5 truncate">{player.player_id}</p>
                </div>
                <div className="text-[10px] text-dark-surface pt-2 border-t border-surface-border space-y-1 font-bold uppercase tracking-widest">
                  <p className="flex justify-between"><span className="text-dark-muted">Team</span><span className="text-dark-bg truncate max-w-[60%] text-right">{player.team_name}</span></p>
                  <p className="flex justify-between"><span className="text-dark-muted">Pos</span><span className="text-brand">{player.position}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLAYER DETAIL MODAL */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface-card max-w-md w-full rounded-xl p-6 sm:p-8 space-y-6 relative border border-surface-border shadow-2xl">
              <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 text-dark-muted hover:text-dark-bg transition-colors p-2 rounded-full hover:bg-surface-hover">
                <CloseSquare set="bold" className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-bg border-2 border-brand shrink-0 relative shadow-lg">
                  {selectedPlayer.photo_url ? (
                    <img src={selectedPlayer.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-3xl font-black text-dark-muted">{selectedPlayer.full_name.substring(0,1)}</span>
                  )}
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-black text-dark-bg uppercase tracking-tight">{selectedPlayer.full_name}</h2>
                  <p className="text-sm font-bold text-dark-surface uppercase tracking-wider mt-1">{selectedPlayer.team_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-surface-bg border border-surface-border flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-dark-muted tracking-widest">Position</span>
                  <span className="text-sm font-black text-dark-bg">{selectedPlayer.position}</span>
                </div>
                <div className="p-3 rounded bg-surface-bg border border-surface-border flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-dark-muted tracking-widest">Jersey #</span>
                  <span className="text-sm font-black text-dark-bg">{selectedPlayer.jersey_number}</span>
                </div>
                <div className="p-3 rounded bg-surface-bg border border-surface-border flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-dark-muted tracking-widest">Date of Birth</span>
                  <span className="text-sm font-black text-dark-bg">{new Date(selectedPlayer.dob).toLocaleDateString()}</span>
                </div>
                <div className="p-3 rounded bg-brand/10 border border-brand/20 flex flex-col items-center text-center">
                  <span className="text-[10px] uppercase font-bold text-brand tracking-widest">Player ID</span>
                  <span className="text-xs font-mono font-black text-brand-dark">{selectedPlayer.player_id}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-surface-border flex justify-center">
                <Link to={`/player/\${selectedPlayer.player_id}`} className="btn-primary text-sm w-full text-center py-3">View Full Profile</Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCANNER MODAL */}
        {showScannerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface-card max-w-md w-full rounded-xl p-6 sm:p-8 space-y-6 relative border border-surface-border shadow-2xl">
              <button onClick={() => setShowScannerModal(false)} className="absolute top-4 right-4 text-dark-muted hover:text-dark-bg transition-colors p-2 rounded-full hover:bg-surface-hover">
                <CloseSquare set="bold" className="w-5 h-5" />
              </button>
              
              <div className="text-center space-y-2">
                <Scan set="bold" className="w-12 h-12 text-brand mx-auto mb-4 opacity-80" />
                <h2 className="font-heading text-xl font-black text-dark-bg uppercase tracking-tight">Scan Player Card</h2>
                <p className="text-sm text-dark-surface font-medium">Use a physical barcode scanner or enter the Player ID manually.</p>
              </div>

              <form onSubmit={handleScanSubmit} className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="e.g. MIUCC-PLY-XXXX"
                    className="input-field text-center font-mono font-bold tracking-wider text-sm py-3"
                    autoFocus
                  />
                  {scanError && <p className="text-xs text-status-live font-bold text-center">{scanError}</p>}
                </div>
                <button type="submit" className="btn-primary w-full py-3 text-sm">Verify Player</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
