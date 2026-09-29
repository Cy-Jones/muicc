import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getAuthToken, removeAuthToken } from '../../lib/api';
import { getMatchLiveClock } from '../../lib/liveClock';
import { Star, TwoUsers, ShieldDone, Calendar, Activity, Discovery, Document, Image, Lock, CloseSquare, Swap } from 'react-iconly';

import { NewsModule } from '../../components/admin/NewsModule';
import { GalleryModule } from '../../components/admin/GalleryModule';
import { SponsorsModule } from '../../components/admin/SponsorsModule';
import { PredictionsModule } from '../../components/admin/PredictionsModule';
import { ExportsModule } from '../../components/admin/ExportsModule';
import AdminTeamsModule from '../../components/admin/AdminTeamsModule';
import AdminPlayersModule from '../../components/admin/AdminPlayersModule';
import AdminCoachesModule from '../../components/admin/AdminCoachesModule';
import AdminOverviewModule from '../../components/admin/AdminOverviewModule';
import AdminDrawModule from '../../components/admin/AdminDrawModule';
import { AdminMatchesModule } from '../../components/admin/AdminMatchesModule';
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATCHES' | 'LINEUPS' | 'DRAW' | 'TEAMS' | 'PLAYERS' | 'COACHES' | 'NEWS' | 'GALLERY' | 'SPONSORS' | 'PREDICTIONS' | 'MANAGERS' | 'EXPORTS'>('OVERVIEW');

  const [stats, setStats] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  const [gallery, setGallery] = useState<any[]>([]);
  const [draw, setDraw] = useState<any[]>([]);
  const [bracket, setBracket] = useState<any>(null);
  const [isDrawLocked, setIsDrawLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  

  



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
      const [statsRes, teamsRes, playersRes, matchesRes, predsRes, sponRes, newsRes, galRes, drawRes] = await Promise.allSettled([
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

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.metrics);
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value);
      if (playersRes.status === 'fulfilled') setPlayers(playersRes.value);
      if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value);
      if (predsRes.status === 'fulfilled') setPredictions(predsRes.value);
      if (sponRes.status === 'fulfilled') setSponsors(sponRes.value || []);
      if (newsRes.status === 'fulfilled') setNews(newsRes.value || []);
      if (galRes.status === 'fulfilled') setGallery(galRes.value || []);
      if (drawRes.status === 'fulfilled') {
        setDraw(drawRes.value.draw || []);
        setBracket(drawRes.value.knockoutBracket || null);
        setIsDrawLocked(drawRes.value.isLocked || false);
      }

    } catch (err) {
      console.error(err);
      removeAuthToken();
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  }





  const TABS = [
    { key: 'OVERVIEW', label: 'Overview', icon: Activity },
    { key: 'MATCHES', label: 'Matches & Live Center', icon: Calendar },
    { key: 'LINEUPS', label: 'Lineups', icon: TwoUsers },
    { key: 'DRAW', label: 'Tournament Draw', icon: Star },
    { key: 'TEAMS', label: 'Teams', icon: ShieldDone },
    { key: 'PLAYERS', label: 'Players', icon: TwoUsers },
    { key: 'COACHES', label: 'Coaches', icon: TwoUsers },
    { key: 'NEWS', label: 'News', icon: Star },
    { key: 'GALLERY', label: 'Gallery', icon: Image },
    { key: 'SPONSORS', label: 'Sponsors', icon: Star },
    { key: 'PREDICTIONS', label: 'Predictions', icon: Discovery },
    { key: 'MANAGERS', label: 'Managers', icon: Lock },
    { key: 'EXPORTS', label: 'Exports', icon: Document },
  ];

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
            <AdminOverviewModule 
              stats={stats} 
              teams={teams} 
              players={players} 
              isDrawLocked={isDrawLocked} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'MATCHES' && (
            <AdminMatchesModule 
              matches={matches} 
              teams={teams} 
              players={players} 
              onRefresh={loadAllAdminData} 
              setMessage={setMessage} 
            />
          )}

          {activeTab === 'DRAW' && (
            <AdminDrawModule 
              draw={draw} 
              isDrawLocked={isDrawLocked} 
              onRefresh={loadAllAdminData} 
              setMessage={setMessage} 
            />
          )}

          {activeTab === 'TEAMS' && <AdminTeamsModule teams={teams} onRefresh={loadAllAdminData} setMessage={setMessage} />}

          {activeTab === 'PLAYERS' && <AdminPlayersModule players={players} onRefresh={loadAllAdminData} setMessage={setMessage} />}
          {activeTab === 'COACHES' && <AdminCoachesModule players={players} onRefresh={loadAllAdminData} setMessage={setMessage} />}
          
          {activeTab === 'NEWS' && <NewsModule />}
          {activeTab === 'GALLERY' && <GalleryModule />}
          {activeTab === 'SPONSORS' && <SponsorsModule />}
          {activeTab === 'PREDICTIONS' && <PredictionsModule />}
          {activeTab === 'MANAGERS' && <ManagersModule />}
          {activeTab === 'EXPORTS' && <ExportsModule />}
          {activeTab === 'LINEUPS' && <AdminLineupsModule />}

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


    </div>
  );
};

