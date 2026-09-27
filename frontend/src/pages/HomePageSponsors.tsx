import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, scaleIn } from '../lib/animations';

interface HomePageSponsorsProps {
  sponsors: any[];
}

export const HomePageSponsors: React.FC<HomePageSponsorsProps> = ({ sponsors }) => {
  const validSponsors = Array.isArray(sponsors) ? sponsors.filter(s => s.name && s.name.trim() !== '' && s.logo_url && s.logo_url.trim() !== '') : [];
  if (validSponsors.length === 0) return null;

  let gridClass = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  let containerClass = 'max-w-[96%]';
  
  if (validSponsors.length === 1) {
    gridClass = 'grid-cols-1';
    containerClass = 'max-w-xs';
  } else if (validSponsors.length === 2) {
    gridClass = 'grid-cols-2';
    containerClass = 'max-w-lg';
  } else if (validSponsors.length === 3) {
    gridClass = 'grid-cols-2 sm:grid-cols-3';
    containerClass = 'max-w-3xl';
  }

  return (
    <motion.section 
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.1 }}
      className="w-full max-w-[96%] mx-auto px-4 py-8"
    >
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-black uppercase text-dark-bg tracking-tight">
          OFFICIAL <span className="text-brand text-glow">SPONSORS & PARTNERS</span>
        </h2>
        <p className="text-xs text-dark-muted font-bold uppercase tracking-widest mt-1">
          Proudly supported by our official tournament partners
        </p>
      </div>

      <div className={`mx-auto ${containerClass}`}>
        <div className={`grid ${gridClass} gap-4 sm:gap-6 items-center`}>
          {validSponsors.map((s) => {
            const CardContent = (
              <motion.div variants={scaleIn} className="data-card relative flex flex-col justify-end overflow-hidden hover:border-brand/50 hover:-translate-y-1 transition-all duration-300 group aspect-[4/5] sm:aspect-[3/4]">
                <img 
                  src={s.logo_url} 
                  alt={s.name} 
                  className="absolute inset-0 w-full h-full object-cover object-top filter group-hover:scale-105 transition-transform duration-300 z-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                
                {/* Fading Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-3/5 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent"></div>
                
                <div className="relative z-20 p-4 text-center flex flex-col items-center w-full">
                  <p className="font-heading text-sm font-bold text-dark-bg group-hover:text-brand transition-colors line-clamp-1 drop-shadow-md">{s.name}</p>
                  <span className="inline-block mt-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 shadow-sm">
                    {s.tier || 'PARTNER'}
                  </span>
                </div>
              </motion.div>
            );

            return s.website ? (
              <a key={s.id} href={s.website} target="_blank" rel="noreferrer" className="block h-full">
                {CardContent}
              </a>
            ) : (
              <div key={s.id} className="h-full">
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
