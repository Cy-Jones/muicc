import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseSquare } from 'react-iconly';

interface PlayerDetailModalProps {
  selectedPlayer: any;
  setSelectedPlayer: (player: any) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ selectedPlayer, setSelectedPlayer }) => {
  return createPortal(
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
  );
};
