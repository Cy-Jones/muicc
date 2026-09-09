import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    navigate(`/player/${targetId}`);
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
      {createPortal(
        <AnimatePresence>
          {selectedPlayer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md overflow-y-auto print:overflow-visible flex items-start justify-center p-4 sm:p-8 print:p-0">
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#0a0a0a] rounded-2xl overflow-hidden relative border border-[#333] text-left w-full max-w-md mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col my-auto shrink-0 print:m-0 print:border-none print:shadow-none print:w-screen print:h-screen print:rounded-none print:max-w-none print:bg-white">
                
                <style type="text/css" media="print">
                  {`
                    @media print {
                      @page { size: portrait; margin: 0; }
                      * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                      }
                      ::-webkit-scrollbar { display: none !important; }
                      body { background-color: white !important; margin: 0; padding: 0; overflow: hidden; }
                      #root { display: none !important; }
                    }
                  `}
                </style>

                {/* Toolbar: Close & Download */}
                <div className="absolute top-4 right-4 z-50 flex gap-2 print:hidden">
                  <button onClick={() => window.print()} title="Download as PDF" className="text-white bg-black/50 hover:bg-black/80 backdrop-blur-md transition-colors p-2.5 rounded-full border border-white/10 shadow-lg flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </button>
                  <button onClick={() => setSelectedPlayer(null)} className="text-white bg-black/50 hover:bg-black/80 backdrop-blur-md transition-colors p-2.5 rounded-full border border-white/10 shadow-lg">
                    <CloseSquare set="bold" className="w-5 h-5" />
                  </button>
                </div>

                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0 h-[75%] print:h-[60%] flex flex-col justify-end overflow-hidden rounded-t-2xl print:rounded-none bg-[#0a0a0a] print:bg-white">
                  {selectedPlayer.photo_url ? (
                    <img 
                      src={selectedPlayer.photo_url} 
                      alt={selectedPlayer.full_name} 
                      className="absolute inset-0 w-full h-full object-cover object-top z-10 opacity-90 [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] print:[-webkit-mask-image:none_!important] print:[mask-image:none_!important] print:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-800 text-8xl font-black text-white/20 z-10 print:bg-gray-200 print:text-black/10">{selectedPlayer.full_name.substring(0,1)}</div>
                  )}
                  {/* CSS Gradient for screen (fallback if mask fails, hidden on print) */}
                  <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent print:hidden"></div>
                </div>

                {/* Faint background number */}
                <div className="absolute right-[-2%] top-[10%] text-[14rem] md:text-[18rem] print:text-[28rem] font-black text-white/10 print:text-black/5 leading-none pointer-events-none select-none z-0">
                  {selectedPlayer.jersey_number}
                </div>

                <div className="relative z-10 pt-6 px-6 md:px-8 pb-3 flex-grow min-h-[350px] flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="drop-shadow-lg print:drop-shadow-none">
                      <h3 className="text-brand font-black text-sm md:text-base uppercase leading-tight drop-shadow-md print:drop-shadow-none">MULSU ICC '26</h3>
                      <p className="text-white/70 print:text-black/70 text-[9px] md:text-[10px] uppercase tracking-widest font-bold">Champions Cup - Official Player Card</p>
                    </div>
                    {/* Pushed verified badge slightly down/left to avoid close button */}
                    <div className="mr-24 bg-[#165a34] text-white text-[10px] md:text-xs px-3 py-1 rounded-full font-bold tracking-widest uppercase shadow-md print:mr-0">
                      Verified
                    </div>
                  </div>

                  {/* Position and Name */}
                  <div className="mt-auto pt-24">
                    <div className="text-brand text-xs md:text-sm font-black uppercase tracking-widest mb-1 drop-shadow-md print:drop-shadow-none">{selectedPlayer.position}</div>
                    <div className="text-white print:text-black text-4xl md:text-5xl lg:text-6xl print:text-5xl font-black uppercase tracking-tight leading-none drop-shadow-xl print:drop-shadow-none">{selectedPlayer.full_name}</div>
                  </div>
                </div>

                {/* Yellow Line */}
                <div className="h-1.5 w-full bg-brand z-20 relative shadow-[0_0_15px_rgba(250,204,21,0.5)] print:hidden"></div>

                {/* Stats */}
                <div className="p-4 md:p-5 grid grid-cols-2 gap-y-3 gap-x-4 relative z-10 bg-[#0a0a0a] print:bg-white">
                  <div>
                    <div className="text-white/40 print:text-black/50 text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1">Team</div>
                    <div className="text-white print:text-black font-bold text-base md:text-lg">{selectedPlayer.team_name}</div>
                  </div>
                  <div>
                    <div className="text-white/40 print:text-black/50 text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1">Country</div>
                    <div className="text-white print:text-black font-bold text-base md:text-lg">{selectedPlayer.team_country || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-white/40 print:text-black/50 text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1">Nationality</div>
                    <div className="text-white print:text-black font-bold text-base md:text-lg">{selectedPlayer.nationality || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-white/40 print:text-black/50 text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1">University</div>
                    <div className="text-white print:text-black font-bold text-base md:text-lg">{selectedPlayer.university || 'N/A'}</div>
                  </div>
                  <div></div>
                  <div>
                    <div className="text-white/40 print:text-black/50 text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1">Squad No.</div>
                    <div className="text-brand font-bold text-base md:text-lg">#{selectedPlayer.jersey_number}</div>
                  </div>
                  
                  {/* Footer Row */}
                  <div className="col-span-2 flex justify-between items-end mt-1 pt-4 print:pb-6 border-t border-white/10 print:border-black/10">
                    <div>
                      <div className="text-white/40 print:text-black/50 text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1">Player ID</div>
                      <div className="text-brand font-black text-base md:text-xl">{selectedPlayer.player_id}</div>
                    </div>
                    <div className="text-white/30 print:text-black/40 text-[8px] md:text-[10px] tracking-widest uppercase text-right max-w-[120px]">
                      Beyond Borders, United by Football.
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* SCANNER MODAL */}
      <AnimatePresence>
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
