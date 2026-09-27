import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUp } from '../lib/animations';

const heroImages = [
  '/images/hero.jpg?v=2',
  '/images/hero1.jpg',
  '/images/hero2.jpg',
  '/images/hero3.jpg'
];

export const HomePageHero: React.FC = () => {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(heroInterval);
  }, []);

  return (
    <>
      {/* Spacer to push content down since the hero is absolutely positioned */}
      <div className="w-full h-[420px] sm:h-[550px] md:h-[650px] lg:h-[700px] -mt-8 pb-16 md:pb-0"></div>
      
      <section className="absolute left-0 right-0 top-16 sm:top-20 h-[420px] sm:h-[550px] md:h-[650px] lg:h-[700px] flex flex-col items-center justify-center pt-16 md:pt-24 pb-16 md:pb-0 overflow-hidden z-0">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <AnimatePresence>
            <motion.img
              key={currentHeroIndex}
              src={heroImages[currentHeroIndex]}
              alt="Tournament Background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className={`absolute inset-0 w-full h-full object-cover ${heroImages[currentHeroIndex].includes('hero3') ? 'object-center' : 'object-top'}`}
            />
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-[var(--color-hero-overlay)] backdrop-blur-[1px] z-0 transition-colors duration-500"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-bg via-transparent to-transparent z-0"></div>
        
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 w-full max-w-4xl px-4 text-center space-y-5"
        >

          <motion.h1 variants={fadeUp} className="font-heading font-black uppercase text-3xl sm:text-4xl md:text-6xl lg:text-[5rem] text-dark-bg tracking-tight leading-none flex flex-col items-center gap-1 sm:gap-2">
            <span className="drop-shadow-lg">BEYOND BORDERS</span>
            <span className="text-brand drop-shadow-[0_0_30px_rgba(253,224,71,0.7)]">UNITED BY FOOTBALL</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-dark-surface text-[10px] sm:text-xs md:text-sm lg:text-base max-w-3xl mx-auto font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mt-6 drop-shadow">
            ONE CAMPUS. MANY NATIONS. ONE CHAMPION.
          </motion.p>
        </motion.div>
      </section>
    </>
  );
};
