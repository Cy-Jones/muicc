export type MatchPhase = 
  | 'PRE_MATCH'
  | 'FIRST_HALF'
  | 'HALF_TIME'
  | 'SECOND_HALF'
  | 'FULL_TIME'
  | 'EXTRA_TIME_BREAK'
  | 'EXTRA_TIME_FIRST_HALF'
  | 'EXTRA_TIME_HALF_TIME'
  | 'EXTRA_TIME_SECOND_HALF'
  | 'PENALTY_SHOOTOUT'
  | 'COMPLETED';

export function getMatchLiveClock(match: any): { display: string; minuteNum: number; isHalftime: boolean; isFulltime: boolean; phase: MatchPhase } {
  if (!match) return { display: '', minuteNum: 0, isHalftime: false, isFulltime: false, phase: 'PRE_MATCH' };

  if (match.status === 'SCHEDULED') {
    return { display: match.time || '16:00', minuteNum: 0, isHalftime: false, isFulltime: false, phase: 'PRE_MATCH' };
  }

  if (match.status === 'POSTPONED' || match.status === 'CANCELLED') {
    return { display: match.status, minuteNum: 90, isHalftime: false, isFulltime: true, phase: 'COMPLETED' };
  }

  const now = Date.now();
  let startTs = match.live_start_timestamp ? Number(match.live_start_timestamp) : now;
  if (isNaN(startTs) || startTs <= 0) startTs = now;
  
  const realElapsedSec = Math.max(0, Math.floor((now - startTs) / 1000) + (match.live_pause_elapsed_seconds || 0));

  // Test mode: 1 real second = 1 in-game minute => 60 in-game seconds
  const inGameElapsedSec = match.is_test_mode === 1 ? realElapsedSec * 60 : realElapsedSec;
  const inGameMin = Math.floor(inGameElapsedSec / 60);

  let period: MatchPhase = match.live_period || 'PRE_MATCH';
  // Legacy mappings
  if (period as any === '1ST_HALF') period = 'FIRST_HALF';
  if (period as any === '2ND_HALF') period = 'SECOND_HALF';

  const stop1 = Number(match.stoppage_time_1st || 0);
  const stop2 = Number(match.stoppage_time_2nd || 0);
  const stopEt1 = Number(match.stoppage_time_et1 || 0);
  const stopEt2 = Number(match.stoppage_time_et2 || 0);

  if (period === 'FIRST_HALF') {
    if (inGameMin >= 45 + stop1) {
      return { display: 'HT', minuteNum: 45, isHalftime: true, isFulltime: false, phase: 'HALF_TIME' };
    }
    if (inGameMin >= 45) {
      return { display: `45+${inGameMin - 45}'`, minuteNum: inGameMin, isHalftime: false, isFulltime: false, phase: 'FIRST_HALF' };
    }
    return { display: `${Math.max(1, inGameMin)}'`, minuteNum: Math.max(1, inGameMin), isHalftime: false, isFulltime: false, phase: 'FIRST_HALF' };
  }

  if (period === 'HALF_TIME') {
    return { display: 'HT', minuteNum: 45, isHalftime: true, isFulltime: false, phase: 'HALF_TIME' };
  }

  if (period === 'SECOND_HALF') {
    const min = 45 + inGameMin;
    if (min >= 90 + stop2) {
      return { display: 'FT', minuteNum: 90, isHalftime: false, isFulltime: true, phase: 'FULL_TIME' };
    }
    if (min >= 90) {
      return { display: `90+${min - 90}'`, minuteNum: min, isHalftime: false, isFulltime: false, phase: 'SECOND_HALF' };
    }
    return { display: `${min}'`, minuteNum: min, isHalftime: false, isFulltime: false, phase: 'SECOND_HALF' };
  }

  if (period === 'FULL_TIME') {
    return { display: 'FT', minuteNum: 90, isHalftime: false, isFulltime: true, phase: 'FULL_TIME' };
  }

  if (period === 'EXTRA_TIME_BREAK') {
    return { display: 'ET Break', minuteNum: 90, isHalftime: false, isFulltime: false, phase: 'EXTRA_TIME_BREAK' };
  }

  if (period === 'EXTRA_TIME_FIRST_HALF') {
    const min = 90 + inGameMin;
    if (min >= 105 + stopEt1) {
      return { display: 'HT ET', minuteNum: 105, isHalftime: true, isFulltime: false, phase: 'EXTRA_TIME_HALF_TIME' };
    }
    if (min >= 105) {
      return { display: `105+${min - 105}'`, minuteNum: min, isHalftime: false, isFulltime: false, phase: 'EXTRA_TIME_FIRST_HALF' };
    }
    return { display: `${min}'`, minuteNum: min, isHalftime: false, isFulltime: false, phase: 'EXTRA_TIME_FIRST_HALF' };
  }

  if (period === 'EXTRA_TIME_HALF_TIME') {
    return { display: 'HT ET', minuteNum: 105, isHalftime: true, isFulltime: false, phase: 'EXTRA_TIME_HALF_TIME' };
  }

  if (period === 'EXTRA_TIME_SECOND_HALF') {
    const min = 105 + inGameMin;
    if (min >= 120 + stopEt2) {
      // Don't auto complete since there might be penalties. Go to full time ET
      return { display: 'FT ET', minuteNum: 120, isHalftime: false, isFulltime: true, phase: 'COMPLETED' };
    }
    if (min >= 120) {
      return { display: `120+${min - 120}'`, minuteNum: min, isHalftime: false, isFulltime: false, phase: 'EXTRA_TIME_SECOND_HALF' };
    }
    return { display: `${min}'`, minuteNum: min, isHalftime: false, isFulltime: false, phase: 'EXTRA_TIME_SECOND_HALF' };
  }

  if (period === 'PENALTY_SHOOTOUT') {
    return { display: 'Pens', minuteNum: 120, isHalftime: false, isFulltime: true, phase: 'PENALTY_SHOOTOUT' };
  }

  if (period === 'COMPLETED') {
    return { display: match.minute_text || 'FT', minuteNum: 120, isHalftime: false, isFulltime: true, phase: 'COMPLETED' };
  }

  return { display: match.minute_text || 'LIVE', minuteNum: 0, isHalftime: false, isFulltime: false, phase: period };
}
