import React, { useState, useEffect } from 'react';
import { Location, Calendar, Discovery } from 'react-iconly';
import { motion, AnimatePresence } from 'framer-motion';

const heroImages = [
  '/images/hero.jpg',
  '/images/hero1.jpg'
];

export const AboutPage: React.FC = () => {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(heroInterval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* IMMERSIVE HERO SECTION (Full Width) */}
      <section className="relative w-full h-[380px] sm:h-[450px] md:h-[550px] flex flex-col items-center justify-center -mt-8">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <AnimatePresence>
            <motion.img
              key={currentHeroIndex}
              src={heroImages[currentHeroIndex]}
              alt="About Background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-50"
            />
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/80 to-transparent z-0"></div>
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        
        <div className="relative z-10 w-full max-w-4xl px-4 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-gold text-black text-xs sm:text-sm font-black uppercase tracking-wider mx-auto">
            ABOUT THE TOURNAMENT
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tight drop-shadow-xl">
            MULSU ICC '26 <br />
            <span className="text-gold glow-gold-text">CHAMPIONS CUP</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-xl mx-auto font-bold tracking-[0.2em] sm:tracking-[0.2em] uppercase mt-4 drop-shadow">
            BEYOND BORDERS, UNITED BY FOOTBALL.
          </p>
        </div>
      </section>

      {/* PAGE CONTENT */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[96%] px-4 sm:px-6 lg:px-8 space-y-12 mb-12 relative z-20 -mt-16 sm:-mt-24 md:-mt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-dark p-6 space-y-2 border-t-2 border-gold text-center">
            <Location set="bold" className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-heading font-bold text-white text-base">HOST VENUE</h3>
            <p className="text-xs text-dark-muted">Marwadi University Campus</p>
          </div>

          <div className="card-dark p-6 space-y-2 border-t-2 border-gold text-center">
            <Calendar set="bold" className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-heading font-bold text-white text-base">OFFICIAL DATES</h3>
            <p className="text-xs text-dark-muted">26 September – 10 October 2026</p>
          </div>

          <div className="card-dark p-6 space-y-2 border-t-2 border-gold text-center">
            <Discovery set="bold" className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-heading font-bold text-white text-base">NATIONS</h3>
            <p className="text-xs text-dark-muted">10 Participating University Nations</p>
          </div>
        </div>

        <div className="card-dark p-8 space-y-6">
          <h2 className="font-heading text-2xl font-black text-white border-b border-surface-border pb-3">TOURNAMENT OVERVIEW</h2>
          <div className="text-sm text-dark-surface space-y-4 leading-relaxed">
            <p>
              The <strong>MULSU ICC '26 Champions Cup</strong> represents the premier collegiate football tournament uniting student athletes across 10 nations: <strong>Liberia, Eswatini, Tanzania, South Sudan, Zimbabwe, India, Mozambique, Nigeria, Uganda, and Zambia</strong>.
            </p>
            <p>
              Hosted at the state-of-the-art facilities of <strong>Marwadi University Campus</strong>, the 14-day tournament showcases group stage competition, knockout rounds, and the championship grand final.
            </p>
          </div>

          <div className="pt-4 border-t border-surface-border">
            <h3 className="font-heading text-sm font-bold text-gold uppercase tracking-wider mb-4">Participating Nations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { name: 'Liberia', code: 'lbr' },
                { name: 'Eswatini', code: 'swz' },
                { name: 'Tanzania', code: 'tza' },
                { name: 'South Sudan', code: 'ssd' },
                { name: 'Zimbabwe', code: 'zwe' },
                { name: 'India', code: 'ind' },
                { name: 'Mozambique', code: 'moz' },
                { name: 'Nigeria', code: 'nga' },
                { name: 'Uganda', code: 'uga' },
                { name: 'Zambia', code: 'zmb' }
              ].map(nation => (
                <div key={nation.code} className="flex items-center gap-3 p-3 bg-[#0f1115] border border-gray-800 rounded-lg hover:border-gold/50 transition">
                  <img 
                    src={`/images/flags/${nation.code}.png`} 
                    alt={`${nation.name} Flag`} 
                    className="w-7 h-5 object-contain rounded-sm shadow-sm" 
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="text-xs font-bold text-white leading-tight">{nation.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
