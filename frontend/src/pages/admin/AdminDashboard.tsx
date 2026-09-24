import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getAuthToken, removeAuthToken } from '../../lib/api';
import { getMatchLiveClock } from '../../lib/liveClock';
import { Star, TwoUsers, ShieldDone, Calendar, Activity, Discovery, Document, Image, Lock, Plus, Delete, Play, TimeCircle, Danger, CloseSquare, Swap, Edit, TickSquare, Search, Message } from 'react-iconly';

import { NewsModule } from '../../components/admin/NewsModule';
import { GalleryModule } from '../../components/admin/GalleryModule';
import { SponsorsModule } from '../../components/admin/SponsorsModule';
import { PredictionsModule } from '../../components/admin/PredictionsModule';
import { ExportsModule } from '../../components/admin/ExportsModule';
import { ManagersModule } from '../../components/admin/ManagersModule';
import { AdminLineupsModule } from './AdminLineupsModule';

const ToastMessage = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);
  return (
    <div className="relative overflow-hidden px-3 py-1.5 rounded-md bg-status-completed/10 border border-status-completed/30 text-status-completed text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
      <style>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
      <Document set="bold" className="w-3.5 h-3.5" />
      {message}
      <button onClick={onClose} className="ml-2 hover:text-dark-bg"><CloseSquare set="bold" className="w-3 h-3" /></button>
      <div className="absolute bottom-0 left-0 h-[2px] bg-status-completed" style={{ animation: 'shrink 3s linear forwards' }} />
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATCHES' | 'LINEUPS' | 'DRAW' | 'TEAMS' | 'PLAYERS' | 'NEWS' | 'GALLERY' | 'SPONSORS' | 'PREDICTIONS' | 'MANAGERS' | 'EXPORTS'>('OVERVIEW');

  const [stats, setStats] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  
  const [messageModalTeam, setMessageModalTeam] = useState<any>(null);
  const [adminMessageInput, setAdminMessageInput] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);
  const [draw, setDraw] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any>(null);
  const [isDrawLocked, setIsDrawLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Player Search & View State
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [viewingPlayer, setViewingPlayer] = useState<any>(null);

  // Match Filter & Creation Modal State
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'FULL_TIME'>('ALL');
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  
  // New Match Form Fields
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [stage, setStage] = useState('GROUP');
  const [groupId, setGroupId] = useState('grp-a');
  const [matchStatus, setMatchStatus] = useState<'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FULL_TIME' | 'POSTPONED' | 'CANCELLED'>('SCHEDULED');
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [minuteText, setMinuteText] = useState('');
  const [matchDate, setMatchDate] = useState('2026-09-26');
  const [matchTime, setMatchTime] = useState('16:00');
  const [matchVenue, setMatchVenue] = useState('Marwadi University Main Stadium');

  // Edit Match State
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [editMatchStatus, setEditMatchStatus] = useState<'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FULL_TIME' | 'POSTPONED' | 'CANCELLED'>('SCHEDULED');
  const [editScoreA, setEditScoreA] = useState('0');
  const [editScoreB, setEditScoreB] = useState('0');
  const [editMatchDate, setEditMatchDate] = useState('');
  const [editMatchTime, setEditMatchTime] = useState('');
  
  // Edit Match Events State
  const [editEventMinute, setEditEventMinute] = useState('1');
  const [editEventType, setEditEventType] = useState('GOAL');
  const [editEventTeam, setEditEventTeam] = useState('');
  const [editEventPlayer, setEditEventPlayer] = useState('');
  const [editEventSecondary, setEditEventSecondary] = useState('');

  // Extra Time State
  const [extraTimeMatch, setExtraTimeMatch] = useState<any>(null);
  const [extraMins, setExtraMins] = useState('3');

  // Status Check Fields
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
      // The API now returns { type: 'team' | 'player', data: any }
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(err.message || 'Reference code not found.');
    } finally {
      setSearching(false);
    }
  };

  const FLAG_MAP: Record<string, string> = {
    liberia: '/images/flags/lbr.png',
    eswatini: '/images/flags/swz.png',
    tanzania: '/images/flags/tza.png',
    'south sudan': '/images/flags/ssd.png',
    zimbabwe: '/images/flags/zwe.png',
    india: '/images/flags/ind.png',
    nigeria: '/images/flags/nga.png',
    uganda: '/images/flags/uga.png',
    zambia: '/images/flags/zmb.png'
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAllAdminData();
  }, [navigate]);

  // Live timer tick for admin clock UI
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [statsRes, teamsRes, playersRes, matchesRes, predsRes, sponRes, newsRes, galRes, drawRes] = await Promise.all([
        api.adminGetDashboardStats(),
        api.adminGetTeams(),
        api.adminGetPlayers(),
        api.getMatches(),
        api.adminGetPredictions(),
        api.getSponsors(),
        api.getNews(),
        api.getGallery(),
        api.getDraw()
      ]);

      setStats(statsRes.metrics);
      setTeams(teamsRes);
      setPlayers(playersRes);
      setMatches(matchesRes);
      setPredictions(predsRes);
      setSponsors(sponRes || []);
      setNews(newsRes || []);
      setGallery(galRes || []);
      setDraw(drawRes.draw || []);
      setBracket(drawRes.knockoutBracket || null);
      setIsDrawLocked(drawRes.isLocked || false);

      if (teamsRes.length >= 2) {
        if (!teamAId) setTeamAId(teamsRes[0].id);
        if (!teamBId) setTeamBId(teamsRes[1].id);
      }
    } catch (err) {
      console.error(err);
      removeAuthToken();
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateTeamStatus = async (id: string, status: string) => {
    try {
      await api.adminUpdateTeamStatus(id, status);
      setMessage(`Team status updated to ${status}.`);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePlayerStatus = async (id: string, status: string) => {
    try {
      const res = await api.adminUpdatePlayerStatus(id, status);
      setMessage(`Player updated to ${status}. ${res.player_id ? 'Generated Player ID: ' + res.player_id : ''}`);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this team and all its players? This action cannot be undone.')) return;
    try {
      await api.adminDeleteTeam(id);
      setMessage('Team deleted successfully.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openMessageModal = (team: any) => {
    setMessageModalTeam(team);
    setAdminMessageInput(team.admin_message || '');
    setIsMessageModalOpen(true);
  };

  const handleSaveMessage = async () => {
    if (!messageModalTeam) return;
    try {
      await api.adminTeamMessage(messageModalTeam.id, adminMessageInput);
      setIsMessageModalOpen(false);
      setMessageModalTeam(null);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update message');
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this player?')) return;
    try {
      await api.adminDeletePlayer(id);
      setMessage('Player deleted successfully.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmResult = async (matchId: string) => {
    if (!window.confirm('Confirm this match result? This will automatically recalculate group standings.')) return;
    try {
      await api.adminConfirmMatchResult(matchId);
      setMessage('Match result confirmed! Standings and statistics updated automatically.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateDraw = async () => {
    try {
      const res = await api.adminGenerateDraw('REGIONAL_SEEDED');
      setMessage(res.message || 'Regional Seeded 3-Group Draw generated successfully!');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmDraw = async () => {
    if (!window.confirm('Are you sure you want to lock the draw? This will make it official and visible to the public.')) return;
    try {
      await api.adminConfirmDraw();
      setMessage('Draw confirmed and locked successfully.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordEvent = async () => {
    if (!editingMatch || !editEventTeam || !editEventPlayer || !editEventType) return;
    try {
      await api.adminRecordMatchEvent(editingMatch.id, {
        team_id: editEventTeam,
        player_id: editEventPlayer,
        event_type: editEventType,
        secondary_player_id: editEventSecondary || undefined,
        minute: parseInt(editEventMinute, 10)
      });
      setMessage(`Recorded ${editEventType.replace('_', ' ')} successfully.`);
      setEditEventPlayer('');
      setEditEventSecondary('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnlockDraw = async () => {
    if (!window.confirm('Are you sure you want to unlock the draw? This will allow you to generate a new draw.')) return;
    try {
      await api.adminUnlockDraw();
      setMessage('Draw unlocked successfully.');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAId || !teamBId) { alert('Please select both Team A and Team B'); return; }
    if (teamAId === teamBId) { alert('Team A and Team B must be different teams!'); return; }

    try {
      const res = await api.adminSaveMatch({
        team_a_id: teamAId,
        team_b_id: teamBId,
        stage,
        group_id: groupId,
        status: matchStatus,
        score_a: parseInt(scoreA || '0', 10),
        score_b: parseInt(scoreB || '0', 10),
        date: matchDate,
        time: matchTime,
        venue: matchVenue,
        minute_text: minuteText
      });
      setMessage(res.message || `Match created successfully!`);
      setShowCreateMatchModal(false);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMatch = async (matchId: string, matchCode: string) => {
    if (!window.confirm(`Delete match "${matchCode}"?`)) return;
    try {
      await api.adminDeleteMatch(matchId);
      setMessage(`Match ${matchCode} deleted successfully.`);
      loadAllAdminData();
    } catch (err: any) { alert(err.message); }
  };

  const handleLiveClockControl = async (matchId: string, action: string, stoppageTime?: number) => {
    try {
      const res = await api.adminControlLiveClock(matchId, { action, stoppage_time: stoppageTime });
      setMessage(res.message);
      loadAllAdminData();
    } catch (err: any) { alert(err.message); }
  };

  const getTeamFlag = (teamName: string, countryName?: string, logoUrl?: string) => {
    let src = logoUrl;
    if (!src) {
      const key = Object.keys(FLAG_MAP).find(k => 
        (countryName && countryName.toLowerCase().includes(k)) ||
        (teamName && teamName.toLowerCase().includes(k))
      );
      if (key) src = FLAG_MAP[key];
    }
    if (src) {
      return <img src={src} alt={teamName} className="w-5 h-3.5 object-cover rounded-sm border border-surface-border shadow-sm" />;
    }
    return <span className="text-[10px]">⚽</span>;
  };

  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'LIVE') return m.status === 'LIVE' || m.status === 'HALF_TIME';
    if (matchFilter === 'SCHEDULED') return m.status === 'SCHEDULED';
    if (matchFilter === 'FULL_TIME') return m.status === 'FULL_TIME';
    return true;
  });

  const TABS = [
    { key: 'OVERVIEW', label: 'Overview', icon: Activity },
    { key: 'MATCHES', label: 'Matches & Live Center', icon: Calendar },
    { key: 'LINEUPS', label: 'Lineups', icon: TwoUsers },
    { key: 'DRAW', label: 'Tournament Draw', icon: Star },
    { key: 'TEAMS', label: 'Teams', icon: ShieldDone },
    { key: 'PLAYERS', label: 'Players', icon: TwoUsers },
    { key: 'NEWS', label: 'News', icon: Star },
    { key: 'GALLERY', label: 'Gallery', icon: Image },
    { key: 'SPONSORS', label: 'Sponsors', icon: Star },
    { key: 'PREDICTIONS', label: 'Predictions', icon: Discovery },
    { key: 'MANAGERS', label: 'Managers', icon: Lock },
    { key: 'EXPORTS', label: 'Exports', icon: Document },
  ];

  const filteredPlayers = players.filter(p => {
    const q = playerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    
    return (
      (p.full_name || '').toLowerCase().includes(q) || 
      (p.team_name || '').toLowerCase().includes(q) || 
      (p.university || '').toLowerCase().includes(q) ||
      (
        (p.player_id || '').toLowerCase().includes(q) && 
        !['mulsu', 'mulsu-', 'mulsu-ply', 'mulsu-ply-'].includes(q)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black text-dark-bg uppercase tracking-widest">Dashboard</h1>
          <p className="text-xs text-dark-muted font-medium mt-1">Manage tournament operations efficiently.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {message && (
            <ToastMessage message={message} onClose={() => setMessage('')} />
          )}
          <button onClick={loadAllAdminData} className="p-2 rounded-md bg-surface-border text-dark-bg hover:text-dark-bg hover:bg-surface-border transition border border-surface-border shadow-sm">
            <Swap set="bold" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-surface-border pb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${
                isActive 
                ? 'bg-brand text-black shadow-md scale-[1.02]' 
                : 'bg-surface-card text-dark-muted border border-surface-border hover:bg-surface-border hover:text-dark-bg'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Swap set="bold" className="w-8 h-8 text-brand animate-spin" />
          <p className="text-xs text-dark-muted font-black uppercase tracking-widest">Syncing Operations Data...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {activeTab === 'OVERVIEW' && (
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

            {/* Operations Status & Verification Panel */}
            {(() => {
              const pendingTeamsCount = teams.filter(t => t.status === 'PENDING').length;
              const pendingPlayersCount = players.filter(p => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
              
              const approvedTeams = teams.filter(t => t.status === 'APPROVED');
              const approvedPlayers = players.filter(p => p.status === 'APPROVED');
              
              const teamsUnderstaffed = approvedTeams.map(t => {
                const teamPlayersCount = approvedPlayers.filter(p => p.team_id === t.id || p.team_name === t.name).length;
                return { ...t, count: teamPlayersCount };
              }).filter(t => t.count < 11);

              return (
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
              );
            })()}
          </>
          )}

          {activeTab === 'MATCHES' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-4 rounded-xl border border-surface-border">
                <div className="flex gap-2 bg-surface-bg p-1 rounded-md border border-surface-border">
                  {['ALL', 'LIVE', 'SCHEDULED', 'FULL_TIME'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMatchFilter(f as any)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-colors ${
                        matchFilter === f ? 'bg-brand text-black shadow-sm' : 'text-dark-muted hover:text-dark-bg'
                      }`}
                    >
                      {f === 'ALL' ? 'All' : f === 'LIVE' ? 'Live' : f === 'SCHEDULED' ? 'Upcoming' : 'Finished'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowCreateMatchModal(true)}
                  className="btn-primary px-4 py-2 text-[10px] flex items-center gap-1.5 shadow-sm"
                >
                  <Plus set="bold" className="w-3.5 h-3.5" /> Create Match
                </button>
              </div>

              <div className="space-y-4">
                {filteredMatches.length === 0 && <div className="p-8 text-center text-dark-muted text-xs font-bold uppercase tracking-widest bg-surface-card rounded-xl border border-surface-border border-dashed">No matches found.</div>}
                {filteredMatches.map(m => {
                  const liveClock = getMatchLiveClock(m);
                  const isLiveOrHt = m.status === 'LIVE' || m.status === 'HALF_TIME';

                  return (
                    <div key={m.id} className={`bg-surface-card rounded-xl border overflow-hidden shadow-sm transition-all ${
                      isLiveOrHt ? 'border-status-error/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-surface-border'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest p-3 bg-surface-bg border-b border-surface-border">
                        <div className="flex items-center gap-3">
                          <span className="text-dark-muted">{m.match_code}</span>
                          <span className="text-dark-bg">{m.stage?.replace(/_/g, ' ')}</span>
                          {isLiveOrHt && (
                            <span className="px-2 py-0.5 rounded-sm bg-status-error/20 text-status-error border border-status-error/30 flex items-center gap-1 animate-pulse">
                              <TimeCircle set="bold" className="w-3 h-3" /> {liveClock.display}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-dark-muted">{m.date} • {m.time}</span>
                          <span className={`px-2 py-0.5 rounded-sm ${
                            m.status === 'FULL_TIME' ? 'bg-status-completed/10 text-status-completed border border-status-completed/30' :
                            m.status === 'LIVE' ? 'bg-status-error/10 text-status-error border border-status-error/30' :
                            m.status === 'HALF_TIME' ? 'bg-status-warning/10 text-status-warning border border-status-warning/30' : 'bg-surface-border text-dark-muted'
                          }`}>
                            {m.status === 'HALF_TIME' ? 'HT' : m.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-[1fr,auto,1fr] items-center gap-6">
                        <div className="flex flex-col items-end gap-1.5 text-right">
                          {getTeamFlag(m.team_a_name, m.team_a_country, m.team_a_logo)}
                          <span className="font-heading font-black text-dark-bg text-sm sm:text-base leading-tight">{m.team_a_name}</span>
                        </div>
                        <div className="font-heading text-3xl font-black text-brand px-4 py-2 bg-surface-bg rounded-lg border border-surface-border min-w-[100px] text-center ">
                          {m.score_a} - {m.score_b}
                        </div>
                        <div className="flex flex-col items-start gap-1.5 text-left">
                          {getTeamFlag(m.team_b_name, m.team_b_country, m.team_b_logo)}
                          <span className="font-heading font-black text-dark-bg text-sm sm:text-base leading-tight">{m.team_b_name}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-surface-bg border-t border-surface-border flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {liveClock.phase === 'PRE_MATCH' && <button onClick={() => handleLiveClockControl(m.id, 'START_1ST_HALF')} className="action-btn bg-status-completed/10 text-status-completed border-status-completed/30"><Play set="bold" className="w-3.5 h-3.5" /> Start 1st Half</button>}
                          
                          {liveClock.phase === 'FIRST_HALF' && (
                            <>
                              <button onClick={() => handleLiveClockControl(m.id, 'END_1ST_HALF')} className="action-btn bg-status-warning/10 text-status-warning border-status-warning/30"><CloseSquare set="bold" className="w-3.5 h-3.5" /> End 1st Half</button>
                              <button onClick={() => { setExtraTimeMatch(m); setExtraMins('3'); }} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                            </>
                          )}
                          
                          {liveClock.phase === 'HALF_TIME' && <button onClick={() => handleLiveClockControl(m.id, 'START_2ND_HALF')} className="action-btn bg-blue-500/10 text-blue-400 border-blue-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Start 2nd Half</button>}
                          
                          {liveClock.phase === 'SECOND_HALF' && (
                            <>
                              <button onClick={() => handleLiveClockControl(m.id, 'END_2ND_HALF')} className="action-btn bg-status-error/10 text-status-error border-status-error/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> Full Time</button>
                              <button onClick={() => { setExtraTimeMatch(m); setExtraMins('3'); }} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                            </>
                          )}
                          
                          {liveClock.phase === 'FULL_TIME' && (
                            <>
                              <button onClick={() => handleLiveClockControl(m.id, 'START_ET_1')} className="action-btn bg-orange-500/10 text-orange-400 border-orange-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Start ET1</button>
                            </>
                          )}
                          
                          {liveClock.phase === 'EXTRA_TIME_FIRST_HALF' && (
                            <>
                              <button onClick={() => handleLiveClockControl(m.id, 'END_ET_1')} className="action-btn bg-status-warning/10 text-status-warning border-status-warning/30"><CloseSquare set="bold" className="w-3.5 h-3.5" /> End ET1</button>
                              <button onClick={() => { setExtraTimeMatch(m); setExtraMins('1'); }} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                            </>
                          )}
                          
                          {liveClock.phase === 'EXTRA_TIME_HALF_TIME' && <button onClick={() => handleLiveClockControl(m.id, 'START_ET_2')} className="action-btn bg-blue-500/10 text-blue-400 border-blue-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Start ET2</button>}

                          {liveClock.phase === 'EXTRA_TIME_SECOND_HALF' && (
                            <>
                              <button onClick={() => handleLiveClockControl(m.id, 'START_PENALTIES')} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> Pens</button>
                              <button onClick={() => handleLiveClockControl(m.id, 'END_MATCH')} className="action-btn bg-status-error/10 text-status-error border-status-error/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> End Match</button>
                              <button onClick={() => { setExtraTimeMatch(m); setExtraMins('1'); }} className="action-btn bg-purple-500/10 text-purple-400 border-purple-500/30"><Play set="bold" className="w-3.5 h-3.5" /> +Time</button>
                            </>
                          )}
                          
                          {liveClock.phase === 'PENALTY_SHOOTOUT' && (
                            <button onClick={() => handleLiveClockControl(m.id, 'END_MATCH')} className="action-btn bg-status-error/10 text-status-error border-status-error/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> End Match</button>
                          )}

                          {liveClock.phase !== 'COMPLETED' && (
                            <button onClick={() => handleLiveClockControl(m.id, 'TOGGLE_TEST_MODE')} className={`action-btn ${m.is_test_mode ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                              {m.is_test_mode === 1 ? 'Test Mode: ON' : 'Test Mode: OFF'}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingMatch(m);
                            setEditMatchStatus(m.status);
                            setEditScoreA(m.score_a?.toString() || '0');
                            setEditScoreB(m.score_b?.toString() || '0');
                            setEditMatchDate(m.date || '');
                            setEditMatchTime(m.time || '');
                          }} className="action-btn bg-surface-border text-dark-bg hover:bg-surface-border border-surface-border"><Edit set="bold" className="w-3.5 h-3.5" /> Edit</button>
                          
                          {m.status !== 'FULL_TIME' && <button onClick={() => handleConfirmResult(m.id)} className="action-btn bg-status-completed/10 text-status-completed hover:bg-status-completed/20 border-status-completed/30"><TickSquare set="bold" className="w-3.5 h-3.5" /> Confirm FT</button>}
                          
                          <button onClick={() => handleDeleteMatch(m.id, m.match_code)} className="action-btn bg-status-error/10 text-status-error hover:bg-status-error/20 border-status-error/30 px-2"><Delete set="bold" className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showCreateMatchModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-surface-card w-full max-w-lg p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6">
                    <div className="flex justify-between items-center border-b border-surface-border pb-3">
                      <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2">
                        <Plus set="bold" className="w-4 h-4 text-brand" /> Create Match
                      </h3>
                      <button onClick={() => setShowCreateMatchModal(false)} className="text-dark-muted hover:text-dark-bg"><CloseSquare set="bold" className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleCreateMatchSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="admin-label">Team A *</label><select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="admin-input" required>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div><label className="admin-label">Team B *</label><select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="admin-input" required>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="admin-label">Status *</label><select value={matchStatus} onChange={(e) => setMatchStatus(e.target.value as any)} className="admin-input"><option value="SCHEDULED">SCHEDULED</option><option value="LIVE">LIVE</option><option value="HALF_TIME">HALF TIME</option><option value="FULL_TIME">FULL TIME</option><option value="POSTPONED">POSTPONED</option><option value="CANCELLED">CANCELLED</option></select></div>
                        <div><label className="admin-label">Score A</label><input type="number" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className="admin-input text-center" /></div>
                        <div><label className="admin-label">Score B</label><input type="number" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className="admin-input text-center" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="admin-label">Stage</label><select value={stage} onChange={(e) => setStage(e.target.value)} className="admin-input"><option value="GROUP">Group Stage</option><option value="ROUND_OF_16">Round of 16</option><option value="QUARTER_FINAL">Quarter-Final</option><option value="SEMI_FINAL">Semi-Final</option><option value="THIRD_PLACE">Third Place</option><option value="FINAL">Grand Final</option></select></div>
                        <div><label className="admin-label">Group</label><select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="admin-input"><option value="grp-a">Group A</option><option value="grp-b">Group B</option><option value="grp-c">Group C</option><option value="">None</option></select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="admin-label">Date</label><input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="admin-input" /></div>
                        <div><label className="admin-label">Time</label><input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="admin-input" /></div>
                      </div>
                      <div className="pt-4 flex justify-end gap-3 border-t border-surface-border">
                        <button type="button" onClick={() => setShowCreateMatchModal(false)} className="btn-outline px-4 py-2 text-xs">Cancel</button>
                        <button type="submit" className="btn-primary px-4 py-2 text-xs">Create Match</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'DRAW' && (
            <div className="bg-surface-card p-6 rounded-xl border border-surface-border space-y-6">
              <div className="flex items-center justify-between border-b border-surface-border pb-4">
                <div>
                  <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Tournament Draw Manager</h2>
                  <p className="text-[10px] text-dark-muted font-bold uppercase tracking-widest mt-1">Regional Seeded format strictly enforced.</p>
                </div>
                <div className="flex items-center gap-3">
                  {!isDrawLocked ? (
                    <>
                      <button onClick={handleGenerateDraw} className="btn-outline px-4 py-2 text-[10px] flex items-center gap-1.5"><Star set="bold" className="w-3.5 h-3.5" /> Generate Draw</button>
                      <button onClick={handleConfirmDraw} className="btn-primary bg-status-completed text-dark-bg px-4 py-2 text-[10px] flex items-center gap-1.5 shadow-none"><Lock set="bold" className="w-3.5 h-3.5" /> Confirm & Lock</button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-status-completed/10 text-status-completed border border-status-completed/30 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Lock set="bold" className="w-3 h-3" /> Draw Locked</span>
                      <button onClick={handleUnlockDraw} className="btn-outline px-4 py-2 text-[10px] flex items-center gap-1.5 text-status-error hover:border-status-error hover:bg-status-error/10">Unlock Draw</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {draw.map((gData: any) => (
                  <div key={gData.group.id} className="bg-surface-bg p-4 rounded-lg border border-surface-border space-y-3 ">
                    <div className="flex justify-between items-center border-b border-surface-border pb-2">
                      <h3 className="font-heading font-black text-brand uppercase tracking-widest">{gData.group.name}</h3>
                      <span className="text-[10px] text-dark-muted font-black tracking-widest uppercase">{gData.teams?.length || 0} Teams</span>
                    </div>
                    <div className="space-y-1.5">
                      {!gData.teams || gData.teams.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">No teams assigned.</p>
                      ) : (
                        gData.teams.map((t: any, idx: number) => (
                          <div key={t.id} className="bg-surface-card p-2 rounded-md border border-surface-border flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                              <span className="text-dark-muted w-3">{idx + 1}</span>
                              <span className="text-dark-bg truncate max-w-[120px]">{t.name}</span>
                            </div>
                            <span className="text-slate-400 truncate max-w-[80px]">{t.country}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'TEAMS' && (
            <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
              <div className="p-4 border-b border-surface-border bg-surface-bg">
                <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Teams Roster ({teams.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
                  <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
                    <tr><th className="p-4">Ref ID</th><th className="p-4">Team Name</th><th className="p-4">University</th><th className="p-4">Country</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {teams.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-bg transition-colors">
                        <td className="p-4 text-brand font-mono">{t.registration_ref}</td>
                        <td className="p-4 text-dark-bg">{t.name}</td>
                        <td className="p-4 text-dark-muted">{t.university}</td>
                        <td className="p-4">{t.country}</td>
                        <td className="p-4"><span className={`status-badge ${t.status === 'APPROVED' ? 'status-completed' : t.status === 'REJECTED' ? 'status-error' : 'status-warning'}`}>{t.status}</span></td>
                        <td className="p-4 text-right space-x-2 flex items-center justify-end">
                          {t.status !== 'APPROVED' && <button onClick={() => handleUpdateTeamStatus(t.id, 'APPROVED')} className="action-btn bg-status-completed/10 text-status-completed border-status-completed/30 hover:bg-status-completed/20">Approve</button>}
                          {t.status !== 'REJECTED' && <button onClick={() => handleUpdateTeamStatus(t.id, 'REJECTED')} className="action-btn bg-status-error/10 text-status-error border-status-error/30 hover:bg-status-error/20">Reject</button>}
                          <button onClick={() => openMessageModal(t)} className="p-1.5 rounded bg-brand/10 text-brand hover:bg-brand hover:text-black transition-colors" title="Send Message">
                            <Message set="bold" className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTeam(t.id)} className="p-1.5 rounded bg-status-error/10 text-status-error hover:bg-status-error hover:text-dark-bg transition-colors" title="Delete Team">
                            <Delete set="bold" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'PLAYERS' && (
            <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
              <div className="p-4 border-b border-surface-border bg-surface-bg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest">Player Approvals ({filteredPlayers.length})</h2>
                <div className="relative w-full md:w-auto">
                  <Search set="light" className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, ID, team..."
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    className="admin-input !pl-10 text-xs w-full md:w-64"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-dark-bg">
                  <thead className="bg-surface-bg text-dark-muted border-b border-surface-border">
                    <tr><th className="p-4">Player ID</th><th className="p-4">Athlete Name</th><th className="p-4">Team</th><th className="p-4">Pos</th><th className="p-4">Jersey</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-bg transition-colors">
                        <td className="p-4 text-brand font-mono">{p.player_id || 'PENDING'}</td>
                        <td className="p-4 text-dark-bg flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-surface-bg border border-surface-border overflow-hidden flex-shrink-0">
                            {p.photo_url && <img src={p.photo_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          {p.full_name}
                        </td>
                        <td className="p-4 text-dark-muted">{p.team_name}</td>
                        <td className="p-4">{p.position}</td>
                        <td className="p-4 text-brand">#{p.jersey_number}</td>
                        <td className="p-4"><span className={`status-badge ${p.status === 'APPROVED' ? 'status-completed' : p.status === 'REJECTED' ? 'status-error' : 'status-warning'}`}>{p.status}</span></td>
                        <td className="p-4 text-right space-x-2 flex items-center justify-end">
                          <button onClick={() => setViewingPlayer(p)} className="action-btn bg-brand/10 text-brand border-brand/30 hover:bg-brand/20" title="View Details">Details</button>
                          {p.status !== 'APPROVED' && <button onClick={() => handleUpdatePlayerStatus(p.id, 'APPROVED')} className="action-btn bg-status-completed/10 text-status-completed border-status-completed/30 hover:bg-status-completed/20">Approve</button>}
                          {p.status !== 'REJECTED' && <button onClick={() => handleUpdatePlayerStatus(p.id, 'REJECTED')} className="action-btn bg-status-error/10 text-status-error border-status-error/30 hover:bg-status-error/20">Reject</button>}
                          <button onClick={() => handleDeletePlayer(p.id)} className="p-1.5 rounded bg-status-error/10 text-status-error hover:bg-status-error hover:text-dark-bg transition-colors" title="Delete Player">
                            <Delete set="bold" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'NEWS' && <NewsModule />}
          {activeTab === 'GALLERY' && <GalleryModule />}
          {activeTab === 'SPONSORS' && <SponsorsModule />}
          {activeTab === 'PREDICTIONS' && <PredictionsModule />}
          {activeTab === 'MANAGERS' && <ManagersModule />}
          {activeTab === 'EXPORTS' && <ExportsModule />}
          {activeTab === 'LINEUPS' && <AdminLineupsModule />}

        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-lg p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2">
                <Edit set="bold" className="w-5 h-5 text-brand" /> Edit Match
              </h3>
              <button onClick={() => setEditingMatch(null)} className="text-dark-muted hover:text-dark-bg">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Status</label>
                <select className="input-field" value={editMatchStatus} onChange={e => setEditMatchStatus(e.target.value as any)}>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="LIVE">LIVE</option>
                  <option value="HALF_TIME">HALF TIME</option>
                  <option value="FULL_TIME">FULL TIME</option>
                  <option value="POSTPONED">POSTPONED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">{editingMatch.team_a_name} Score</label>
                  <input type="number" min="0" className="input-field" value={editScoreA} onChange={e => setEditScoreA(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">{editingMatch.team_b_name} Score</label>
                  <input type="number" min="0" className="input-field" value={editScoreB} onChange={e => setEditScoreB(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" className="input-field" value={editMatchDate} onChange={e => setEditMatchDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Time</label>
                  <input type="time" className="input-field" value={editMatchTime} onChange={e => setEditMatchTime(e.target.value)} />
                </div>
              </div>

              <div className="border-t border-surface-border pt-4">
                <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-3">Record Match Event</label>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Minute</label>
                    <input type="number" min="1" max="120" className="input-field" value={editEventMinute} onChange={e => setEditEventMinute(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Event Type</label>
                    <select className="input-field" value={editEventType} onChange={e => setEditEventType(e.target.value)}>
                      <option value="GOAL">Goal</option>
                      <option value="YELLOW_CARD">Yellow Card</option>
                      <option value="RED_CARD">Red Card</option>
                      <option value="SUBSTITUTION">Substitution</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Team</label>
                    <select className="input-field" value={editEventTeam} onChange={e => {
                      setEditEventTeam(e.target.value);
                      setEditEventPlayer('');
                      setEditEventSecondary('');
                    }}>
                      <option value="">Select Team...</option>
                      <option value={editingMatch.team_a_id}>{editingMatch.team_a_name}</option>
                      <option value={editingMatch.team_b_id}>{editingMatch.team_b_name}</option>
                    </select>
                  </div>
                  {editEventTeam && (
                    <div>
                      <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">Primary Player</label>
                      <select className="input-field" value={editEventPlayer} onChange={e => setEditEventPlayer(e.target.value)}>
                        <option value="">Select Player...</option>
                        {players.filter(p => p.team_id === editEventTeam || p.team_name === (editEventTeam === editingMatch.team_a_id ? editingMatch.team_a_name : editingMatch.team_b_name)).map(p => (
                          <option key={p.id} value={p.id}>{p.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {editEventTeam && (editEventType === 'GOAL' || editEventType === 'SUBSTITUTION') && (
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-dark-muted uppercase mb-1">
                      {editEventType === 'GOAL' ? 'Assist (Optional)' : 'Sub Out Player'}
                    </label>
                    <select className="input-field" value={editEventSecondary} onChange={e => setEditEventSecondary(e.target.value)}>
                      <option value="">{editEventType === 'GOAL' ? 'No Assist' : 'Select Player...'}</option>
                      {players.filter(p => p.team_id === editEventTeam || p.team_name === (editEventTeam === editingMatch.team_a_id ? editingMatch.team_a_name : editingMatch.team_b_name)).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button 
                  onClick={handleRecordEvent} 
                  disabled={!editEventTeam || !editEventPlayer || (editEventType === 'SUBSTITUTION' && !editEventSecondary)}
                  className="w-full py-2 bg-brand/10 text-brand font-bold rounded-lg text-sm hover:bg-brand/20 disabled:opacity-50 transition-colors"
                >
                  Save Event
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4 mt-6">
              <button onClick={() => setEditingMatch(null)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-dark-muted hover:text-dark-bg transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  await api.adminUpdateMatchStatus(editingMatch.id, {
                    status: editMatchStatus,
                    score_a: parseInt(editScoreA, 10),
                    score_b: parseInt(editScoreB, 10),
                    minute_text: editingMatch.minute_text,
                    date: editMatchDate,
                    time: editMatchTime
                  });
                  loadAllAdminData();
                  setEditingMatch(null);
                } catch (err: any) {
                  alert(err.message);
                }
              }} className="btn-primary py-2.5 px-6">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Time Modal */}
      {extraTimeMatch && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-sm p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-2">
                <Play set="bold" className="w-5 h-5 text-brand" /> Add Extra Time
              </h3>
              <button onClick={() => setExtraTimeMatch(null)} className="text-dark-muted hover:text-dark-bg">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-muted uppercase tracking-widest mb-1.5">Minutes</label>
                <input type="number" min="1" className="input-field" value={extraMins} onChange={e => setExtraMins(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4 mt-6">
              <button onClick={() => setExtraTimeMatch(null)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-dark-muted hover:text-dark-bg transition-colors">Cancel</button>
              <button onClick={() => {
                let action = 'SET_STOPPAGE_1ST';
                if (extraTimeMatch.live_period === 'SECOND_HALF' || extraTimeMatch.live_period === '2ND_HALF') action = 'SET_STOPPAGE_2ND';
                if (extraTimeMatch.live_period === 'EXTRA_TIME_FIRST_HALF') action = 'SET_STOPPAGE_ET1';
                if (extraTimeMatch.live_period === 'EXTRA_TIME_SECOND_HALF') action = 'SET_STOPPAGE_ET2';
                handleLiveClockControl(extraTimeMatch.id, action, parseInt(extraMins));
                setExtraTimeMatch(null);
              }} className="btn-primary py-2.5 px-6">Confirm</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .admin-label { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; }
        .admin-input { width: 100%; background-color: rgba(0,0,0,0.2); border: 1px solid #1E2332; border-radius: 6px; padding: 10px; color: #FFFFFF; font-size: 12px; font-weight: bold; }
        .admin-input:focus { outline: none; border-color: #FDE047; }
        .action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent; transition: all 0.2s; }
        .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid transparent; display: inline-block; }
        .status-completed { background-color: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(34, 197, 94, 0.4); }
        .status-error { background-color: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.4); }
        .status-warning { background-color: rgba(234, 179, 8, 0.15); color: #facc15; border-color: rgba(234, 179, 8, 0.4); }
      `}</style>
      {isMessageModalOpen && messageModalTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-md rounded-2xl border border-surface-border p-6 shadow-2xl relative">
            <button onClick={() => setIsMessageModalOpen(false)} className="absolute top-4 right-4 text-dark-muted hover:text-brand">
              <CloseSquare set="bold" className="w-6 h-6" />
            </button>
            <h2 className="font-heading text-xl font-black text-dark-bg uppercase tracking-widest mb-2">Message {messageModalTeam.name}</h2>
            <p className="text-xs text-dark-muted mb-4 font-medium">This message will appear on the manager's dashboard.</p>
            <textarea
              value={adminMessageInput}
              onChange={(e) => setAdminMessageInput(e.target.value)}
              placeholder="Enter message here (leave blank to clear)..."
              className="w-full h-32 input-field mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setIsMessageModalOpen(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={handleSaveMessage} className="btn-primary flex-1">Save Message</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Details Modal */}
      {viewingPlayer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-2xl p-6 rounded-xl border border-surface-border shadow-2xl animate-fade-in space-y-6">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="font-heading text-lg font-black text-dark-bg uppercase tracking-widest flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-bg border border-surface-border overflow-hidden flex-shrink-0 shadow-md">
                  {viewingPlayer.photo_url && <img src={viewingPlayer.photo_url} alt="" className="w-full h-full object-cover" />}
                </div>
                Player Details: {viewingPlayer.full_name}
              </h3>
              <button onClick={() => setViewingPlayer(null)} className="text-dark-muted hover:text-dark-bg self-start mt-2">
                <CloseSquare set="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Registration Information</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Player ID:</span> <span className="font-mono text-brand">{viewingPlayer.player_id || 'PENDING'}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Team:</span> <span className="font-bold">{viewingPlayer.team_name}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Status:</span> <span className="font-bold">{viewingPlayer.status}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Registration Date:</span> <span>{new Date(viewingPlayer.created_at).toLocaleDateString()}</span></p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Personal Details</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Date of Birth:</span> <span>{new Date(viewingPlayer.dob).toLocaleDateString()}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Nationality:</span> <span>{viewingPlayer.nationality}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Emergency Contact:</span> <span>{viewingPlayer.emergency_contact || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Athletic Profile</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Position:</span> <span>{viewingPlayer.position}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Jersey Number:</span> <span>#{viewingPlayer.jersey_number}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Preferred Foot:</span> <span>{viewingPlayer.preferred_foot}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Medical Conditions:</span> <span>{viewingPlayer.medical_conditions || 'None'}</span></p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-dark-muted uppercase tracking-widest mb-1">Academic Information</label>
                  <div className="bg-surface-bg border border-surface-border p-3 rounded-lg space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-dark-muted">Student ID:</span> <span className="font-mono text-brand">{viewingPlayer.student_id}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">University:</span> <span>{viewingPlayer.university}</span></p>
                    <p className="flex justify-between"><span className="text-dark-muted">Course/Major:</span> <span>{viewingPlayer.course || 'N/A'}</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-surface-border">
               <button onClick={() => setViewingPlayer(null)} className="btn-outline px-6 py-2 text-xs uppercase tracking-widest">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
