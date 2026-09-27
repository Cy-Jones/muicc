import React, { useState } from 'react';
import { api } from '../../lib/api';
import { ShieldDone, TwoUsers, Danger, Star, Lock, Search } from 'react-iconly';

interface AdminOverviewModuleProps {
  stats: any;
  teams: any[];
  players: any[];
  isDrawLocked: boolean;
  setActiveTab: (tab: any) => void;
}

export default function AdminOverviewModule({ stats, teams, players, isDrawLocked, setActiveTab }: AdminOverviewModuleProps) {
  const [searchRef, setSearchRef] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setSearching(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const res = await api.checkTeamStatus(searchRef.trim());
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(err.message || 'Reference code not found.');
    } finally {
      setSearching(false);
    }
  };

  const pendingTeamsCount = teams.filter(t => t.status === 'PENDING').length;
  const pendingPlayersCount = players.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
  
  const approvedTeams = teams.filter(t => t.status === 'APPROVED');
  const approvedPlayers = players.filter(p => p.status === 'APPROVED');
  
  const teamsUnderstaffed = approvedTeams.map(t => {
    const teamPlayersCount = approvedPlayers.filter(p => p.team_id === t.id || p.team_name === t.name).length;
    return { ...t, count: teamPlayersCount };
  }).filter(t => t.count < 11);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm flex flex-col">
          <span className="text-[10px] uppercase font-black text-dark-muted tracking-widest">Teams (Approved)</span>
          <span className="text-3xl font-heading font-black text-dark-bg mt-2">{stats?.teams?.approved || 0} <span className="text-sm text-slate-400">/ {stats?.teams?.total || 0}</span></span>
        </div>
        <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm flex flex-col">
          <span className="text-[10px] uppercase font-black text-dark-muted tracking-widest">Players (Approved)</span>
          <span className="text-3xl font-heading font-black text-dark-bg mt-2">{stats?.players?.approved || 0} <span className="text-sm text-slate-400">/ {stats?.players?.total || 0}</span></span>
        </div>
        <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm flex flex-col">
          <span className="text-[10px] uppercase font-black text-dark-muted tracking-widest">Matches Completed</span>
          <span className="text-3xl font-heading font-black text-dark-bg mt-2">{stats?.matches?.completed || 0} <span className="text-sm text-slate-400">/ {stats?.matches?.total || 0}</span></span>
        </div>
        <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm flex flex-col">
          <span className="text-[10px] uppercase font-black text-dark-muted tracking-widest">Total Goals Scored</span>
          <span className="text-3xl font-heading font-black text-brand mt-2">{stats?.goals || 0}</span>
        </div>
        <div className="bg-surface-card p-5 rounded-xl border border-surface-border shadow-sm flex flex-col">
          <span className="text-[10px] uppercase font-black text-dark-muted tracking-widest">Predictions Submissions</span>
          <span className="text-3xl font-heading font-black text-dark-bg mt-2">{stats?.predictions || 0}</span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest border-b border-surface-border pb-2">Operations Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Approvals Check */}
          {(pendingTeamsCount > 0 || pendingPlayersCount > 0) ? (
            <div className="bg-status-warning/10 border border-status-warning/30 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-status-warning">
                <Danger set="bold" className="w-5 h-5" />
                <h4 className="font-bold uppercase tracking-widest text-xs">Pending Approvals</h4>
              </div>
              <p className="text-sm text-dark-bg">You have {pendingTeamsCount > 0 ? `${pendingTeamsCount} team(s)` : ''} {pendingTeamsCount > 0 && pendingPlayersCount > 0 ? 'and' : ''} {pendingPlayersCount > 0 ? `${pendingPlayersCount} player(s)` : ''} awaiting review.</p>
              <div className="flex gap-2">
                {pendingTeamsCount > 0 && <button onClick={() => setActiveTab('TEAMS')} className="action-btn bg-status-warning/20 text-status-warning hover:bg-status-warning hover:text-black">Review Teams</button>}
                {pendingPlayersCount > 0 && <button onClick={() => setActiveTab('PLAYERS')} className="action-btn bg-status-warning/20 text-status-warning hover:bg-status-warning hover:text-black">Review Players</button>}
              </div>
            </div>
          ) : (
            <div className="bg-status-completed/10 border border-status-completed/30 p-5 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-status-completed mb-1">
                  <ShieldDone set="bold" className="w-5 h-5" />
                  <h4 className="font-bold uppercase tracking-widest text-xs">Approvals Up to Date</h4>
                </div>
                <p className="text-xs text-dark-muted">No pending teams or players.</p>
              </div>
            </div>
          )}

          {/* Roster Check */}
          {teamsUnderstaffed.length > 0 ? (
            <div className="bg-status-error/10 border border-status-error/30 p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-status-error">
                <TwoUsers set="bold" className="w-5 h-5" />
                <h4 className="font-bold uppercase tracking-widest text-xs">Roster Warning</h4>
              </div>
              <p className="text-sm text-dark-bg">{teamsUnderstaffed.length} approved team(s) have fewer than 11 approved players.</p>
              <ul className="text-xs text-status-error font-medium space-y-1">
                {teamsUnderstaffed.slice(0,3).map(t => <li key={t.id}>• {t.name} ({t.count}/11)</li>)}
                {teamsUnderstaffed.length > 3 && <li>• ...and {teamsUnderstaffed.length - 3} more</li>}
              </ul>
            </div>
          ) : (
            <div className="bg-status-completed/10 border border-status-completed/30 p-5 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-status-completed mb-1">
                  <TwoUsers set="bold" className="w-5 h-5" />
                  <h4 className="font-bold uppercase tracking-widest text-xs">Rosters Verified</h4>
                </div>
                <p className="text-xs text-dark-muted">All approved teams meet the 11-player minimum.</p>
              </div>
            </div>
          )}

          {/* Draw Check */}
          {!isDrawLocked ? (
            <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-xl space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Star set="bold" className="w-5 h-5" />
                <h4 className="font-bold uppercase tracking-widest text-xs">Tournament Draw Action Required</h4>
              </div>
              <p className="text-sm text-dark-bg">The tournament draw has not been locked. Group assignments and fixtures may be incomplete.</p>
              <button onClick={() => setActiveTab('DRAW')} className="action-btn bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-dark-bg">Go to Draw Manager</button>
            </div>
          ) : (
            <div className="bg-status-completed/10 border border-status-completed/30 p-5 rounded-xl flex items-center justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-2 text-status-completed mb-1">
                  <Lock set="bold" className="w-5 h-5" />
                  <h4 className="font-bold uppercase tracking-widest text-xs">Draw Locked</h4>
                </div>
                <p className="text-xs text-dark-muted">The tournament structure is officially finalized.</p>
              </div>
              <button onClick={() => setActiveTab('DRAW')} className="action-btn bg-status-completed/20 text-status-completed hover:bg-status-completed hover:text-dark-bg">View Draw</button>
            </div>
          )}

          {/* Status Check Lookup Tool */}
          <div className="bg-surface-card border border-surface-border p-5 rounded-xl md:col-span-2 space-y-4 shadow-sm">
            <h4 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2 border-b border-surface-border pb-2">
              <Search set="bold" className="w-5 h-5 text-gold" /> Status Check
            </h4>
            <p className="text-xs text-dark-muted font-medium">Enter a registration reference code to verify a team and its players.</p>
            
            <form onSubmit={handleLookup} className="flex gap-3">
              <input type="text" required value={searchRef} onChange={(e) => setSearchRef(e.target.value)} placeholder="MIUCC-..." className="admin-input font-mono uppercase tracking-widest flex-1" />
              <button type="submit" disabled={searching} className="btn-outline px-6 py-2 text-xs disabled:opacity-50 min-w-[120px]">
                {searching ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {lookupError && <p className="text-[10px] text-status-error font-black uppercase tracking-widest bg-status-error/10 p-3 rounded-lg border border-status-error/30 text-center">{lookupError}</p>}

            {lookupResult && lookupResult.type === 'team' && (
              <div className="p-4 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-between shadow-inner">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-dark-muted font-mono text-[10px]">{lookupResult.data.registration_ref}</span>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${
                      lookupResult.data.status === 'APPROVED' ? 'bg-status-completed/10 text-status-completed border border-status-completed/30' : 'bg-status-warning/10 text-status-warning border border-status-warning/30'
                    }`}>
                      {lookupResult.data.status}
                    </span>
                  </div>
                  <p className="font-black text-dark-bg text-sm uppercase tracking-wider">{lookupResult.data.name}</p>
                  <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-0.5">{lookupResult.data.university} • {lookupResult.data.country}</p>
                </div>
                <button onClick={() => { setActiveTab('TEAMS'); setSearchRef(''); setLookupResult(null); }} className="action-btn bg-brand/10 text-brand border-brand/30 hover:bg-brand hover:text-black">
                  Manage Team
                </button>
              </div>
            )}

            {lookupResult && lookupResult.type === 'player' && (
              <div className="p-4 rounded-lg bg-surface-bg border border-surface-border flex items-center justify-between shadow-inner">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-dark-muted font-mono text-[10px]">{lookupResult.data.player_id}</span>
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${
                      lookupResult.data.status === 'APPROVED' ? 'bg-status-completed/10 text-status-completed border border-status-completed/30' : 'bg-status-warning/10 text-status-warning border border-status-warning/30'
                    }`}>
                      {lookupResult.data.status}
                    </span>
                  </div>
                  <p className="font-black text-dark-bg text-sm uppercase tracking-wider">{lookupResult.data.full_name}</p>
                  <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-0.5">{lookupResult.data.position} • {lookupResult.data.team_name} ({lookupResult.data.team_country})</p>
                </div>
                <button onClick={() => { setActiveTab('PLAYERS'); setSearchRef(''); setLookupResult(null); }} className="action-btn bg-brand/10 text-brand border-brand/30 hover:bg-brand hover:text-black">
                  Manage Player
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
