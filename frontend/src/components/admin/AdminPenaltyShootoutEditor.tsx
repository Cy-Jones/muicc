import React, { useState, useEffect } from 'react';
import { Plus, Delete, TickSquare } from 'react-iconly';

export interface PenaltyKick {
  player_id?: string;
  player_name: string;
  scored: boolean;
}

export interface PenaltyRound {
  round: number;
  team_a: PenaltyKick;
  team_b: PenaltyKick;
}

interface AdminPenaltyShootoutEditorProps {
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  players: any[];
  penaltyA: string;
  penaltyB: string;
  penaltyDetails: string;
  onUpdate: (data: { penalty_a: string; penalty_b: string; penalty_details: string }) => void;
}

export const AdminPenaltyShootoutEditor: React.FC<AdminPenaltyShootoutEditorProps> = ({
  teamAName,
  teamBName,
  teamAId,
  teamBId,
  players,
  penaltyA,
  penaltyB,
  penaltyDetails,
  onUpdate
}) => {
  const [rounds, setRounds] = useState<PenaltyRound[]>([]);
  const [autoSyncScore, setAutoSyncScore] = useState(true);
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState(penaltyDetails || '');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Filter players by team
  const teamAPlayers = players.filter(p => p.team_id === teamAId || p.team_name === teamAName);
  const teamBPlayers = players.filter(p => p.team_id === teamBId || p.team_name === teamBName);

  // Parse penaltyDetails on mount or change
  useEffect(() => {
    if (!penaltyDetails || !penaltyDetails.trim()) {
      setRounds([]);
      return;
    }
    try {
      const parsed = typeof penaltyDetails === 'string' ? JSON.parse(penaltyDetails) : penaltyDetails;
      if (Array.isArray(parsed)) {
        const normalized: PenaltyRound[] = parsed.map((r: any, idx: number) => ({
          round: r.round || idx + 1,
          team_a: {
            player_id: r.team_a?.player_id || '',
            player_name: r.team_a?.player_name || r.team_a?.player || '',
            scored: r.team_a?.scored === true || r.team_a?.scored === 1
          },
          team_b: {
            player_id: r.team_b?.player_id || '',
            player_name: r.team_b?.player_name || r.team_b?.player || '',
            scored: r.team_b?.scored === true || r.team_b?.scored === 1
          }
        }));
        setRounds(normalized);
        setRawJsonText(JSON.stringify(normalized, null, 2));
      }
    } catch (e: any) {
      console.error('Error parsing penalty details in editor:', e);
    }
  }, [penaltyDetails]);

  // Propagate updates to parent
  const commitRounds = (updatedRounds: PenaltyRound[], syncScores = autoSyncScore) => {
    setRounds(updatedRounds);
    const jsonStr = updatedRounds.length > 0 ? JSON.stringify(updatedRounds, null, 2) : '';
    setRawJsonText(jsonStr);

    let nextScoreA = penaltyA;
    let nextScoreB = penaltyB;

    if (syncScores) {
      const scoreA = updatedRounds.filter(r => r.team_a?.scored).length;
      const scoreB = updatedRounds.filter(r => r.team_b?.scored).length;
      nextScoreA = updatedRounds.length > 0 ? scoreA.toString() : '';
      nextScoreB = updatedRounds.length > 0 ? scoreB.toString() : '';
    }

    onUpdate({
      penalty_a: nextScoreA,
      penalty_b: nextScoreB,
      penalty_details: jsonStr
    });
  };

  const handleAddRound = () => {
    const nextRoundNum = rounds.length + 1;
    const newRound: PenaltyRound = {
      round: nextRoundNum,
      team_a: { player_id: '', player_name: '', scored: true },
      team_b: { player_id: '', player_name: '', scored: true }
    };
    commitRounds([...rounds, newRound]);
  };

  const handleSetupFiveRounds = () => {
    const fiveRounds: PenaltyRound[] = Array.from({ length: 5 }, (_, i) => ({
      round: i + 1,
      team_a: { player_id: '', player_name: '', scored: true },
      team_b: { player_id: '', player_name: '', scored: true }
    }));
    commitRounds(fiveRounds);
  };

  const handleDeleteRound = (index: number) => {
    const updated = rounds.filter((_, idx) => idx !== index).map((r, idx) => ({
      ...r,
      round: idx + 1
    }));
    commitRounds(updated);
  };

  const handleClearAll = () => {
    if (rounds.length === 0) return;
    if (window.confirm('Are you sure you want to clear all penalty shootout rounds?')) {
      commitRounds([]);
    }
  };

  const handleToggleScored = (index: number, side: 'team_a' | 'team_b') => {
    const updated = [...rounds];
    updated[index] = {
      ...updated[index],
      [side]: {
        ...updated[index][side],
        scored: !updated[index][side].scored
      }
    };
    commitRounds(updated);
  };

  const handlePlayerChange = (index: number, side: 'team_a' | 'team_b', playerName: string, playerId = '') => {
    const updated = [...rounds];
    updated[index] = {
      ...updated[index],
      [side]: {
        ...updated[index][side],
        player_name: playerName,
        player_id: playerId
      }
    };
    commitRounds(updated);
  };

  const handleApplyRawJson = () => {
    setJsonError(null);
    if (!rawJsonText.trim()) {
      commitRounds([]);
      return;
    }
    try {
      const parsed = JSON.parse(rawJsonText);
      if (!Array.isArray(parsed)) {
        setJsonError('JSON must be an array of rounds');
        return;
      }
      const normalized: PenaltyRound[] = parsed.map((r: any, idx: number) => ({
        round: r.round || idx + 1,
        team_a: {
          player_id: r.team_a?.player_id || '',
          player_name: r.team_a?.player_name || r.team_a?.player || '',
          scored: Boolean(r.team_a?.scored)
        },
        team_b: {
          player_id: r.team_b?.player_id || '',
          player_name: r.team_b?.player_name || r.team_b?.player || '',
          scored: Boolean(r.team_b?.scored)
        }
      }));
      commitRounds(normalized);
      setShowJsonMode(false);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  // Calculate live tallies
  const calculatedScoreA = rounds.filter(r => r.team_a?.scored).length;
  const calculatedScoreB = rounds.filter(r => r.team_b?.scored).length;

  return (
    <div className="space-y-4">
      {/* Header bar with summary score */}
      <div className="bg-surface-card p-3 rounded-xl border border-surface-border flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Shootout Score</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-heading font-black text-lg text-dark-bg">{teamAName}</span>
            <span className="text-base font-black px-2.5 py-0.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
              {penaltyA !== '' ? penaltyA : (rounds.length > 0 ? calculatedScoreA : '-')}
              {' - '}
              {penaltyB !== '' ? penaltyB : (rounds.length > 0 ? calculatedScoreB : '-')}
            </span>
            <span className="font-heading font-black text-lg text-dark-bg">{teamBName}</span>
          </div>
        </div>

        {/* Total Score Inputs & Sync Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div>
              <span className="block text-[9px] font-bold text-dark-muted text-center uppercase">{teamAName.substring(0, 4)}</span>
              <input
                type="number"
                min="0"
                className="w-14 text-center admin-input text-xs py-1 px-1 font-black"
                value={penaltyA}
                onChange={e => onUpdate({ penalty_a: e.target.value, penalty_b: penaltyB, penalty_details: rawJsonText })}
                placeholder={calculatedScoreA.toString()}
              />
            </div>
            <span className="text-dark-muted font-bold text-sm mt-3">:</span>
            <div>
              <span className="block text-[9px] font-bold text-dark-muted text-center uppercase">{teamBName.substring(0, 4)}</span>
              <input
                type="number"
                min="0"
                className="w-14 text-center admin-input text-xs py-1 px-1 font-black"
                value={penaltyB}
                onChange={e => onUpdate({ penalty_a: penaltyA, penalty_b: e.target.value, penalty_details: rawJsonText })}
                placeholder={calculatedScoreB.toString()}
              />
            </div>
          </div>

          <label className="flex items-center gap-1 text-[11px] font-bold text-dark-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncScore}
              onChange={e => {
                const nextVal = e.target.checked;
                setAutoSyncScore(nextVal);
                if (nextVal) {
                  onUpdate({
                    penalty_a: calculatedScoreA.toString(),
                    penalty_b: calculatedScoreB.toString(),
                    penalty_details: rawJsonText
                  });
                }
              }}
              className="rounded border-surface-border text-brand focus:ring-brand"
            />
            Auto-sync totals
          </label>
        </div>
      </div>

      {/* Rounds list or Empty state */}
      {rounds.length === 0 ? (
        <div className="bg-surface-card/60 p-6 rounded-xl border border-dashed border-surface-border text-center space-y-3">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="font-bold text-sm text-dark-bg">No Penalty Shootout Rounds Recorded</div>
            <p className="text-xs text-dark-muted mt-1 max-w-sm mx-auto">
              Add individual kick rounds or quickly generate standard 5 rounds to record player shootout attempts.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSetupFiveRounds}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand text-dark-bg hover:opacity-90 shadow-sm transition-all"
            >
              ⚡ Setup Standard 5 Rounds
            </button>
            <button
              type="button"
              onClick={handleAddRound}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-surface-card border border-surface-border text-dark-bg hover:border-brand/40 transition-all flex items-center gap-1"
            >
              <Plus set="bold" className="w-3.5 h-3.5" /> Add Round 1
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header Labels */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 px-3 text-[10px] font-bold text-dark-muted uppercase tracking-wider">
            <div className="text-left truncate">{teamAName} Taker & Result</div>
            <div className="text-center w-12">Round</div>
            <div className="text-right truncate">{teamBName} Result & Taker</div>
            <div className="w-6"></div>
          </div>

          {/* List of Rounds */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {rounds.map((rnd, idx) => {
              const kickA = rnd.team_a;
              const kickB = rnd.team_b;

              return (
                <div
                  key={idx}
                  className="bg-surface-card p-2.5 rounded-xl border border-surface-border shadow-sm hover:border-brand/30 transition-all grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
                >
                  {/* Team A: Dropdown + Scored Toggle */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <select
                        className="admin-input text-xs py-1.5 px-2 truncate w-full"
                        value={kickA.player_name || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const found = teamAPlayers.find(p => p.full_name === val);
                          handlePlayerChange(idx, 'team_a', val, found?.id || '');
                        }}
                      >
                        <option value="">Select Taker...</option>
                        {kickA.player_name && !teamAPlayers.some(p => p.full_name === kickA.player_name) && (
                          <option value={kickA.player_name}>{kickA.player_name} (Custom)</option>
                        )}
                        {teamAPlayers.map(p => (
                          <option key={p.id} value={p.full_name}>
                            {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleScored(idx, 'team_a')}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
                        kickA.scored
                          ? 'bg-status-completed/20 text-status-completed border border-status-completed/40 hover:bg-status-completed/30'
                          : 'bg-status-error/20 text-status-error border border-status-error/40 hover:bg-status-error/30'
                      }`}
                      title={kickA.scored ? 'Scored! Click to mark Miss' : 'Missed! Click to mark Goal'}
                    >
                      {kickA.scored ? (
                        <>
                          <span>⚽</span>
                          <span className="hidden sm:inline">Goal</span>
                        </>
                      ) : (
                        <>
                          <span>✕</span>
                          <span className="hidden sm:inline">Miss</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Round Badge */}
                  <div className="w-12 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-surface-bg border border-surface-border text-dark-muted inline-block">
                      R{rnd.round}
                    </span>
                  </div>

                  {/* Team B: Scored Toggle + Dropdown */}
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleScored(idx, 'team_b')}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
                        kickB.scored
                          ? 'bg-status-completed/20 text-status-completed border border-status-completed/40 hover:bg-status-completed/30'
                          : 'bg-status-error/20 text-status-error border border-status-error/40 hover:bg-status-error/30'
                      }`}
                      title={kickB.scored ? 'Scored! Click to mark Miss' : 'Missed! Click to mark Goal'}
                    >
                      {kickB.scored ? (
                        <>
                          <span>⚽</span>
                          <span className="hidden sm:inline">Goal</span>
                        </>
                      ) : (
                        <>
                          <span>✕</span>
                          <span className="hidden sm:inline">Miss</span>
                        </>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <select
                        className="admin-input text-xs py-1.5 px-2 truncate w-full text-right"
                        value={kickB.player_name || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const found = teamBPlayers.find(p => p.full_name === val);
                          handlePlayerChange(idx, 'team_b', val, found?.id || '');
                        }}
                      >
                        <option value="">Select Taker...</option>
                        {kickB.player_name && !teamBPlayers.some(p => p.full_name === kickB.player_name) && (
                          <option value={kickB.player_name}>{kickB.player_name} (Custom)</option>
                        )}
                        {teamBPlayers.map(p => (
                          <option key={p.id} value={p.full_name}>
                            {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delete round */}
                  <div className="w-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRound(idx)}
                      className="p-1 rounded text-dark-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
                      title="Remove this round"
                    >
                      <Delete set="bold" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRound}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20 transition-all flex items-center gap-1"
              >
                <Plus set="bold" className="w-3.5 h-3.5" /> Add Round {rounds.length + 1}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-status-error hover:bg-status-error/10 transition-all"
              >
                Clear Shootout
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowJsonMode(!showJsonMode)}
              className="text-xs font-bold text-dark-muted hover:text-dark-bg transition-colors"
            >
              {showJsonMode ? 'Hide JSON View' : '</> Advanced JSON'}
            </button>
          </div>
        </div>
      )}

      {/* Optional Raw JSON Editor */}
      {showJsonMode && (
        <div className="bg-surface-card p-3 rounded-xl border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Raw JSON Data</span>
            <button
              type="button"
              onClick={handleApplyRawJson}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
            >
              <TickSquare set="bold" className="w-3 h-3" /> Apply JSON to Rounds
            </button>
          </div>

          <textarea
            rows={5}
            value={rawJsonText}
            onChange={e => setRawJsonText(e.target.value)}
            className="admin-input font-mono text-[11px] w-full"
            placeholder='[{"round": 1, "team_a": {"player_name": "...", "scored": true}, "team_b": {"player_name": "...", "scored": true}}]'
          />

          {jsonError && (
            <div className="text-[11px] font-bold text-status-error bg-status-error/10 p-2 rounded">
              {jsonError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
