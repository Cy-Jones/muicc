import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { TwoUsers, Location, Home, Plus, Document, CloseSquare } from 'react-iconly';

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamDetail, setTeamDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const data = await api.getTeams();
        setTeams(data);
      } catch (err) {
        console.error('Failed to load teams:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

  const openTeamModal = async (team: any) => {
    setSelectedTeam(team);
    try {
      const detail = await api.getTeamById(team.id);
      setTeamDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-border">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-dark-bg uppercase tracking-tight">
            Participating Teams
          </h1>
          <p className="text-sm text-dark-surface mt-1 font-medium">
            Official university football clubs competing in the MIUCC 2026.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={api.getPublicTeamsExportPdfUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn-outline text-xs inline-flex items-center gap-2 bg-surface-card"
          >
            <Document set="bold" className="w-4 h-4" /> Download PDF
          </a>
          <Link
            to="/teams/register"
            className="btn-primary text-xs inline-flex items-center gap-2"
          >
            <Plus set="bold" className="w-4 h-4" /> Register New Team
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="data-card p-12 text-center text-dark-muted font-medium border-dashed">Loading approved teams...</div>
      ) : teams.length === 0 ? (
        <div className="data-card p-12 text-center text-dark-muted border-dashed">No approved teams available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => openTeamModal(team)}
              className="data-card p-6 cursor-pointer hover:bg-surface-hover hover:border-brand/30 transition-colors group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-surface-bg rounded-lg border border-surface-border p-2 shrink-0 flex items-center justify-center">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="max-h-full object-contain" />
                  ) : (
                    <span className="text-xl font-bold text-dark-muted">{team.name.substring(0,2)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-tight group-hover:text-brand transition-colors truncate">{team.name}</h3>
                  <p className="text-xs text-dark-surface uppercase flex items-center gap-1 mt-1 truncate font-bold"><Home set="bold" className="w-3.5 h-3.5 text-dark-muted shrink-0" />{team.university}</p>
                  <p className="text-xs text-dark-surface uppercase flex items-center gap-1 mt-0.5 truncate font-bold"><Location set="bold" className="w-3.5 h-3.5 text-dark-muted shrink-0" />{team.country}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-dark-surface">
                <span className="flex items-center gap-1.5 font-bold">
                  <TwoUsers set="bold" className="w-4 h-4 text-dark-muted" /> {team.player_count || 0} Players
                </span>
                <span className="px-2 py-1 rounded bg-brand/10 text-brand-dark font-bold uppercase border border-brand/20">
                  {team.group_name || 'Group Phase'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedTeam && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-surface-card border border-surface-border max-w-2xl w-full rounded-xl p-6 sm:p-8 space-y-8 relative shadow-2xl"
            >
              <button onClick={() => { setSelectedTeam(null); setTeamDetail(null); }} className="absolute top-4 right-4 text-dark-muted hover:text-dark-bg transition-colors p-2 rounded-full hover:bg-surface-hover">
                <CloseSquare set="bold" className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-surface-border">
                <div className="w-24 h-24 bg-surface-bg rounded-lg border border-surface-border p-4 flex items-center justify-center shrink-0">
                  {selectedTeam.logo_url ? (
                    <img src={selectedTeam.logo_url} alt="" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-3xl font-bold text-dark-muted">{selectedTeam.name.substring(0,2)}</span>
                  )}
                </div>
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-black text-dark-bg uppercase tracking-tight">{selectedTeam.name}</h2>
                  <p className="text-sm text-dark-surface uppercase tracking-wide mt-1 font-bold">{selectedTeam.university} • {selectedTeam.country}</p>
                  <p className="text-xs text-brand uppercase tracking-wider mt-2 font-bold bg-brand/10 inline-block px-3 py-1 rounded border border-brand/20">
                    Mgr: {selectedTeam.manager_name} | Coach: {selectedTeam.coach_name}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-heading text-sm font-black text-dark-bg uppercase tracking-widest border-l-4 border-brand pl-3">
                  Squad Roster ({teamDetail?.players?.length || 0})
                </h4>

                {!teamDetail ? (
                  <p className="text-sm text-dark-muted font-medium">Loading squad roster...</p>
                ) : teamDetail.players.length === 0 ? (
                  <p className="text-sm text-dark-muted bg-surface-bg p-4 rounded border border-surface-border font-medium">No verified players found for this team.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {teamDetail.players.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-card border border-surface-border rounded-lg shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-surface-bg border border-surface-border flex items-center justify-center shrink-0 overflow-hidden">
                          {p.photo_url ? (
                            <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-dark-muted">{p.name.substring(0,1)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-dark-bg truncate">{p.name}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded border border-brand/20">{p.position}</span>
                            <span className="text-[10px] text-dark-muted font-bold truncate ml-2">#{p.passport_number?.substring(0,4)}...</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
