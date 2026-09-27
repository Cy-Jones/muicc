import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { Search, ShieldDone, Scan, CloseSquare } from 'react-iconly';
import { PlayerDetailModal } from './PlayerDetailModal';
import { PlayerScannerModal } from './PlayerScannerModal';

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
    navigate(`/player/${targetId}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-border">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
          {players.map((player) => (
            <div 
              key={player.id} 
              onClick={() => setSelectedPlayer(player)} 
              className="relative overflow-hidden rounded-xl cursor-pointer shadow-lg border border-[#333] bg-[#0a0a0a] flex flex-col hover:scale-[1.02] transition-transform duration-300 min-h-[350px] md:min-h-[380px] lg:min-h-[400px] 2xl:min-h-[450px]"
            >
              {/* Background Image & Overlay */}
              <div className="absolute inset-0 z-0 h-[75%] flex flex-col justify-end overflow-hidden bg-[#0a0a0a]">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.full_name} className="absolute inset-0 w-full h-full object-cover object-top z-10 opacity-90" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-800 text-6xl font-black text-white/20 z-10">{player.full_name.substring(0,1)}</div>
                )}
                {/* Gradient overlay to blend image into the dark bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent pointer-events-none z-20"></div>
              </div>

              {/* Faint Number */}
              <div className="absolute right-[-5%] top-[5%] text-[8rem] md:text-[10rem] 2xl:text-[12rem] font-black text-white/10 leading-none pointer-events-none select-none z-0">
                {player.jersey_number}
              </div>
              
              {/* Top Section */}
              <div className="relative z-10 pt-4 px-4 pb-2 flex-grow flex flex-col justify-between">
                {/* Verified Badge */}
                <div className="flex justify-end">
                  <div className="bg-[#165a34] text-white text-[7px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-md">
                    Verified
                  </div>
                </div>

                {/* Position & Name */}
                <div className="mt-auto pt-16">
                  <div className="text-brand text-[8px] font-black uppercase tracking-widest leading-none mb-1 drop-shadow-md">{player.position}</div>
                  <div className="text-white text-xl font-black uppercase leading-tight truncate drop-shadow-lg">{player.full_name}</div>
                </div>
              </div>

              {/* Yellow Line */}
              <div className="h-0.5 w-full bg-brand relative z-10 shadow-[0_0_5px_rgba(250,204,21,0.5)]"></div>

              {/* Stats Section */}
              <div className="p-3 grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] relative z-10 bg-[#0a0a0a]">
                <div>
                  <div className="text-white/40 uppercase font-bold tracking-widest mb-0.5 text-[7px]">Team</div>
                  <div className="text-white font-bold truncate text-[11px]">{player.team_name}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase font-bold tracking-widest mb-0.5 text-[7px]">Country</div>
                  <div className="text-white font-bold truncate text-[11px]">{player.team_country || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase font-bold tracking-widest mb-0.5 text-[7px]">Nationality</div>
                  <div className="text-white font-bold truncate text-[11px]">{player.nationality || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-white/40 uppercase font-bold tracking-widest mb-0.5 text-[7px]">University</div>
                  <div className="text-white font-bold truncate text-[11px]">{player.university || 'N/A'}</div>
                </div>
                <div></div>
                <div>
                  <div className="text-white/40 uppercase font-bold tracking-widest mb-0.5 text-[7px]">Squad No.</div>
                  <div className="text-brand font-bold text-[11px]">#{player.jersey_number}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/10 mt-1 flex justify-between items-end">
                  <div>
                    <div className="text-brand font-black text-[10px]">{player.player_id}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLAYER DETAIL MODAL */}
      <PlayerDetailModal selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer} />

      {/* SCANNER MODAL */}
      <PlayerScannerModal
        showScannerModal={showScannerModal}
        setShowScannerModal={setShowScannerModal}
        scanInput={scanInput}
        setScanInput={setScanInput}
        scanError={scanError}
        handleScanSubmit={handleScanSubmit}
      />
    </motion.div>
  );
};
