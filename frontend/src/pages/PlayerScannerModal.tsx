import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseSquare, Scan } from 'react-iconly';

interface PlayerScannerModalProps {
  showScannerModal: boolean;
  setShowScannerModal: (show: boolean) => void;
  scanInput: string;
  setScanInput: (input: string) => void;
  scanError: string;
  handleScanSubmit: (e: React.FormEvent) => void;
}

export const PlayerScannerModal: React.FC<PlayerScannerModalProps> = ({
  showScannerModal,
  setShowScannerModal,
  scanInput,
  setScanInput,
  scanError,
  handleScanSubmit
}) => {
  return (
    <AnimatePresence>
      {showScannerModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface-card max-w-md w-full rounded-xl p-6 sm:p-8 space-y-6 relative border border-surface-border shadow-2xl">
            <button onClick={() => setShowScannerModal(false)} className="absolute top-4 right-4 text-dark-muted hover:text-white transition-colors p-2 rounded-full hover:bg-surface-hover">
              <CloseSquare set="bold" className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2">
              <Scan set="bold" className="w-12 h-12 text-brand mx-auto mb-4 opacity-80" />
              <h2 className="font-heading text-xl font-black text-white uppercase tracking-tight">Scan Player Card</h2>
              <p className="text-sm text-dark-surface font-medium">Use a physical barcode scanner or enter the Player ID manually.</p>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="e.g. MIUCC-PLY-XXXX"
                  className="input-field text-center font-mono font-bold tracking-wider text-sm py-3"
                  autoFocus
                />
                {scanError && <p className="text-xs text-status-live font-bold text-center">{scanError}</p>}
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-sm">Verify Player</button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
