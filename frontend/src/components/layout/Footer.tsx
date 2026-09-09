import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Location, Calendar, Discovery, Lock } from 'react-iconly';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-surface-border bg-surface-card text-dark-muted font-sans py-8">
      <div className="mx-auto max-w-[96%] px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0 w-full justify-center md:w-auto md:flex-1 md:justify-start">
          <img 
            src="/logo.png" 
            alt="MIUCC Logo" 
            className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]" 
          />
          <div className="flex flex-col">
            <span className="font-heading text-lg font-black text-gold tracking-widest leading-none">MULSU ICC <span className="text-white">'26</span></span>
            <span className="text-[9px] text-dark-muted uppercase tracking-[0.2em] mt-0.5 font-bold">Champions Cup</span>
          </div>
        </div>

        {/* Middle: Links */}
        <div className="flex flex-row flex-nowrap justify-center items-center gap-3 sm:gap-6 text-[9px] sm:text-[11px] font-bold text-white uppercase tracking-widest w-full md:w-auto mt-4 md:mt-0">
          <Link to="/predict" className="hover:text-gold transition-colors py-2">Predict</Link>
          <Link to="/news" className="hover:text-gold transition-colors py-2">News</Link>
          <Link to="/gallery" className="hover:text-gold transition-colors py-2">Gallery</Link>
          <Link to="/manager/login" className="hover:text-gold transition-colors py-2">Manager</Link>
          <Link to="/admin" className="hover:text-gold transition-colors py-2">Admin</Link>
        </div>

        {/* Right: Socials */}
        <div className="flex items-center gap-4 shrink-0 w-full justify-center md:w-auto md:flex-1 md:justify-end">
          <a 
            href="https://www.instagram.com/mulsu_icc?stkn=aTd4anppZ3I4M3p3" 
            target="_blank" 
            rel="noreferrer" 
            className="text-white hover:text-gold transition-colors"
            title="Follow us on Instagram"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="mx-auto max-w-[96%] px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-surface-border flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest gap-3 text-center md:text-left">
        <p>© 2026 MULSU ICC Champions Cup. All rights reserved.</p>
        <p>ONE CAMPUS. MANY NATIONS. ONE CHAMPION.</p>
      </div>
    </footer>
  );
};
