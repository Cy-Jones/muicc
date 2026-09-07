import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Star, TickSquare, Danger, ArrowLeft, Activity } from 'react-iconly';

export const PlayerVerificationPage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      if (!playerId) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.verifyPlayer(playerId);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Player verification failed. Record not found.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [playerId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-dark-muted font-bold uppercase tracking-widest">Verifying player record...</div>;
  }

  if (error || !data) {
    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-md px-4 py-20 text-center space-y-6">
        <motion.div variants={itemVariants} className="w-20 h-20 rounded-full bg-status-error/10 border-2 border-status-error/50 text-status-error flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <Danger set="bold" className="w-10 h-10" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <h2 className="font-heading text-3xl font-black text-white uppercase tracking-tight">VERIFICATION FAILED</h2>
          <p className="text-sm text-dark-muted font-medium mt-2">{error || 'Player ID invalid or not approved.'}</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Link to="/players" className="btn-outline px-6 py-3 rounded-md text-xs inline-flex items-center gap-2 font-bold uppercase tracking-widest shadow-lg">
            <ArrowLeft set="bold" className="w-4 h-4" /> Return to Directory
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  const p = data.player;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 pb-20">
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 border-2 border-status-completed/50 bg-gradient-to-r from-status-completed/10 via-dark-surface to-status-completed/10 shadow-[0_0_30px_rgba(34,197,94,0.15)] rounded-2xl text-center space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-status-completed/20 border border-status-completed/50 text-status-completed text-xs font-black uppercase tracking-widest shadow-md">
            <TickSquare set="bold" className="w-4 h-4" /> {data.badge}
          </div>

          <button
            onClick={() => window.print()}
            className="btn-primary text-[10px] sm:text-xs shadow-glow-gold"
          >
            <Star set="bold" className="w-4 h-4" /> Print Passport
          </button>
        </div>

        <div>
          <h1 className="font-heading text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">OFFICIAL VERIFICATION PASSPORT</h1>
          <p className="text-xs text-dark-muted font-medium uppercase tracking-widest mt-2">Verified record for MIUCC 2026</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="glass-card p-8 text-center space-y-5 border-gold/40 shadow-glow-gold-lg relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none"></div>
          <div className="w-40 h-40 mx-auto rounded-full border-4 border-gold p-1.5 bg-dark-bg overflow-hidden shadow-xl relative z-10">
            <img src={p.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="relative z-10">
            <h2 className="font-heading text-2xl font-black text-white uppercase">{p.full_name}</h2>
            <p className="text-sm font-mono font-black text-gold tracking-widest mt-1">{p.player_id}</p>
          </div>
          <div className="pt-5 border-t border-dark-border text-xs text-dark-muted space-y-1.5 relative z-10">
            <p className="font-black text-white uppercase tracking-wider">{p.team_name}</p>
            <p className="uppercase tracking-widest font-bold">{p.university}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 space-y-8">
          <div className="glass-card p-6 md:p-8 space-y-5 shadow-lg">
            <h3 className="font-heading text-lg font-black text-white border-b border-dark-border pb-3 flex items-center gap-3 uppercase tracking-widest">
              <Star set="bold" className="w-5 h-5 text-gold" /> Public Profile
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-dark-bg rounded-xl border border-dark-border"><span className="text-[10px] text-dark-muted uppercase block font-bold tracking-widest mb-1">Position</span><span className="font-black text-gold text-sm uppercase">{p.position}</span></div>
              <div className="p-4 bg-dark-bg rounded-xl border border-dark-border"><span className="text-[10px] text-dark-muted uppercase block font-bold tracking-widest mb-1">Jersey Number</span><span className="font-black text-white text-sm">#{p.jersey_number}</span></div>
              <div className="p-4 bg-dark-bg rounded-xl border border-dark-border"><span className="text-[10px] text-dark-muted uppercase block font-bold tracking-widest mb-1">Nationality</span><span className="font-black text-white text-sm uppercase">{p.nationality}</span></div>
              <div className="p-4 bg-dark-bg rounded-xl border border-dark-border"><span className="text-[10px] text-dark-muted uppercase block font-bold tracking-widest mb-1">Preferred Foot</span><span className="font-black text-white text-sm uppercase">{p.preferred_foot || 'Right'}</span></div>
              <div className="p-4 bg-dark-bg rounded-xl border border-dark-border"><span className="text-[10px] text-dark-muted uppercase block font-bold tracking-widest mb-1">Country Team</span><span className="font-black text-white text-sm uppercase">{p.team_country}</span></div>
              <div className="p-4 bg-status-completed/10 rounded-xl border border-status-completed/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]"><span className="text-[10px] text-status-completed/70 uppercase block font-bold tracking-widest mb-1">Status</span><span className="font-black text-status-completed text-sm uppercase tracking-widest">VERIFIED</span></div>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8 space-y-5 shadow-lg">
            <h3 className="font-heading text-lg font-black text-white border-b border-dark-border pb-3 flex items-center gap-3 uppercase tracking-widest">
              <Activity set="bold" className="w-5 h-5 text-gold" /> Tournament Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-5 bg-dark-bg rounded-xl border border-dark-border"><p className="text-3xl font-black font-heading text-gold">{p.stats?.appearances || 0}</p><p className="text-[9px] uppercase font-bold tracking-widest text-dark-muted mt-2">Appearances</p></div>
              <div className="p-5 bg-dark-bg rounded-xl border border-dark-border"><p className="text-3xl font-black font-heading text-gold">{p.stats?.goals || 0}</p><p className="text-[9px] uppercase font-bold tracking-widest text-dark-muted mt-2">Goals</p></div>
              <div className="p-5 bg-dark-bg rounded-xl border border-dark-border"><p className="text-3xl font-black font-heading text-gold">{p.stats?.assists || 0}</p><p className="text-[9px] uppercase font-bold tracking-widest text-dark-muted mt-2">Assists</p></div>
              <div className="p-5 bg-dark-bg rounded-xl border border-dark-border"><p className="text-3xl font-black font-heading text-gold">{p.stats?.potm || 0}</p><p className="text-[9px] uppercase font-bold tracking-widest text-dark-muted mt-2">POTM</p></div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
