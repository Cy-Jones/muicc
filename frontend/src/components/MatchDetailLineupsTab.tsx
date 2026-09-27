import React from 'react';
import { TimeCircle } from 'react-iconly';

interface MatchDetailLineupsTabProps {
  lineupA: any;
  lineupB: any;
}

export const MatchDetailLineupsTab: React.FC<MatchDetailLineupsTabProps> = ({ lineupA, lineupB }) => {
  return (
    <div className="animate-fade-in">
      {!lineupA && !lineupB ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-bg border border-surface-border mb-4">
            <TimeCircle className="w-6 h-6 text-dark-muted" />
          </div>
          <h3 className="font-heading text-lg font-black uppercase tracking-widest mb-1">Lineups Not Available</h3>
          <p className="text-dark-muted text-sm">The starting lineups will be announced closer to kickoff.</p>
        </div>
      ) : (
        <div className="flex flex-col rounded-xl overflow-hidden bg-surface-bg border border-surface-border">
          {/* Formation Header */}
          {(lineupA?.formation || lineupB?.formation) && (
            <div className="flex justify-between items-center py-2 px-4 bg-surface-bg border-b border-surface-border text-xs font-bold tracking-wider">
              <span>{lineupA?.formation || '-'}</span>
              <span className="text-dark-muted">FORMATION</span>
              <span>{lineupB?.formation || '-'}</span>
            </div>
          )}

          {/* Pitch Graphic */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-[#1a3826] overflow-hidden rounded-t-xl border-b border-surface-border">
            {/* Pitch lines */}
            <div className="absolute inset-0 border border-white/20 m-2 sm:m-4"></div>
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0 border-l border-white/20 -translate-x-1/2"></div>
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-28 sm:h-28 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            {/* Penalty areas */}
            <div className="absolute top-[20%] bottom-[20%] left-2 sm:left-4 w-12 sm:w-24 border border-white/20 border-l-0"></div>
            <div className="absolute top-[20%] bottom-[20%] right-2 sm:right-4 w-12 sm:w-24 border border-white/20 border-r-0"></div>
            <div className="absolute top-[35%] bottom-[35%] left-2 sm:left-4 w-4 sm:w-8 border border-white/20 border-l-0"></div>
            <div className="absolute top-[35%] bottom-[35%] right-2 sm:right-4 w-4 sm:w-8 border border-white/20 border-r-0"></div>

            {/* Render Players */}
            {[
              { lineup: lineupA, isAway: false },
              { lineup: lineupB, isAway: true }
            ].map(({ lineup, isAway }) => {
              if (!lineup || !lineup.players) return null;
              
              const startingPlayers = lineup.players.filter((p: any) => p.is_starting);
              if (startingPlayers.length === 0) return null;

              // Parse formation
              const formationParts = (lineup.formation || "4-3-3").split('-').map(Number).filter((n: any) => !isNaN(n));
              const layers: any[][] = [];
              
              // Layer 0: GK
              layers.push([startingPlayers[0]]);
              
              let playerIdx = 1;
              for (const count of formationParts) {
                const layerPlayers = [];
                for (let i = 0; i < count; i++) {
                  if (playerIdx < startingPlayers.length) {
                    layerPlayers.push(startingPlayers[playerIdx]);
                    playerIdx++;
                  }
                }
                layers.push(layerPlayers);
              }
              
              // Any leftover players
              while (playerIdx < startingPlayers.length) {
                layers[layers.length - 1].push(startingPlayers[playerIdx]);
                playerIdx++;
              }

              return layers.map((layerPlayers, colIdx) => {
                const totalLayers = layers.length;
                const minX = 8;
                const maxX = 45;
                const fraction = colIdx / Math.max(1, totalLayers - 1);
                const x = minX + fraction * (maxX - minX);
                const finalX = isAway ? 100 - x : x;

                return layerPlayers.map((p, rowIdx) => {
                  const y = ((rowIdx + 1) * 100) / (layerPlayers.length + 1);
                  return (
                    <div key={p.player_id} className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${finalX}%`, top: `${y}%` }}>
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.full_name} className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-full drop-shadow-md" />
                      ) : (
                        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-end justify-center overflow-hidden pt-2 text-white/50 bg-[#0A1620] border border-[#1A2D3C]">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 mb-[-4px]">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                          </svg>
                        </div>
                      )}
                      <div className="mt-[-4px] z-20 flex items-center bg-[#111111] rounded-full px-1.5 py-[1px] shadow border border-[#222222]">
                        <span className="text-[#888888] text-[9px] sm:text-[10px] font-mono mr-1.5 font-bold">{p.jersey_number}</span>
                        <span className="text-white text-[9px] sm:text-[10px] font-bold whitespace-nowrap overflow-hidden max-w-[45px] sm:max-w-[60px] text-ellipsis leading-tight">{p.full_name.split(' ').pop()}</span>
                      </div>
                    </div>
                  );
                });
              });
            })}
          </div>

          {/* Starting XI Header */}
          <div className="bg-surface-card border-y border-surface-border py-2 text-center text-xs font-black tracking-widest text-dark-muted uppercase">
            STARTING LINEUPS
          </div>

          <div className="flex flex-col">
            {Array.from({ length: Math.max(
              (lineupA?.players?.filter((p: any) => p.is_starting) || []).length,
              (lineupB?.players?.filter((p: any) => p.is_starting) || []).length
            )}).map((_, i) => {
              const pA = lineupA?.players?.filter((p: any) => p.is_starting)[i];
              const pB = lineupB?.players?.filter((p: any) => p.is_starting)[i];
              return (
                <div key={`start-${i}`} className={`flex justify-between items-center py-2.5 px-4 ${i % 2 === 0 ? 'bg-surface-bg' : 'bg-surface-card'}`}>
                  {/* Home Player */}
                  <div className="flex-1 flex items-center justify-start gap-3">
                    {pA ? (
                      <>
                        <span className="w-5 text-center font-mono font-semibold text-sm">{pA.jersey_number}</span>
                        <span className="font-semibold text-sm truncate text-dark-bg">
                          {pA.full_name} {pA.position === 'GK' && <span className="text-dark-muted font-normal text-xs ml-1">(G)</span>}
                        </span>
                      </>
                    ) : <div className="flex-1" />}
                  </div>
                  {/* Away Player */}
                  <div className="flex-1 flex items-center justify-end gap-3">
                    {pB ? (
                      <>
                        <span className="font-semibold text-sm text-right truncate text-dark-bg">
                          {pB.position === 'GK' && <span className="text-dark-muted font-normal text-xs mr-1">(G)</span>} {pB.full_name}
                        </span>
                        <span className="w-5 text-center font-mono font-semibold text-sm">{pB.jersey_number}</span>
                      </>
                    ) : <div className="flex-1" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Substitutes Header */}
          <div className="bg-surface-card border-y border-surface-border py-2 text-center text-xs font-black tracking-widest text-dark-muted uppercase">
            SUBSTITUTES
          </div>

          <div className="flex flex-col">
            {Array.from({ length: Math.max(
              (lineupA?.players?.filter((p: any) => !p.is_starting) || []).length,
              (lineupB?.players?.filter((p: any) => !p.is_starting) || []).length
            )}).map((_, i) => {
              const pA = lineupA?.players?.filter((p: any) => !p.is_starting)[i];
              const pB = lineupB?.players?.filter((p: any) => !p.is_starting)[i];
              return (
                <div key={`sub-${i}`} className={`flex justify-between items-center py-2.5 px-4 ${i % 2 === 0 ? 'bg-surface-bg' : 'bg-surface-card'}`}>
                  {/* Home Player */}
                  <div className="flex-1 flex items-center justify-start gap-3">
                    {pA ? (
                      <>
                        <span className="w-5 text-center font-mono font-semibold text-sm">{pA.jersey_number}</span>
                        <span className="font-semibold text-sm truncate text-dark-muted">
                          {pA.full_name} {pA.position === 'GK' && <span className="text-dark-muted/70 font-normal text-xs ml-1">(G)</span>}
                        </span>
                      </>
                    ) : <div className="flex-1" />}
                  </div>
                  {/* Away Player */}
                  <div className="flex-1 flex items-center justify-end gap-3">
                    {pB ? (
                      <>
                        <span className="font-semibold text-sm text-right truncate text-dark-muted">
                          {pB.position === 'GK' && <span className="text-dark-muted/70 font-normal text-xs mr-1">(G)</span>} {pB.full_name}
                        </span>
                        <span className="w-5 text-center font-mono font-semibold text-sm">{pB.jersey_number}</span>
                      </>
                    ) : <div className="flex-1" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
