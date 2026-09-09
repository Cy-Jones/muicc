export function getMatchLiveClock(match: any): { display: string; minuteNum: number; isHalftime: boolean; isFulltime: boolean } {
  if (!match) return { display: '', minuteNum: 0, isHalftime: false, isFulltime: false };

  if (match.status === 'FULL_TIME' || match.live_period === 'FULL_TIME') {
    return { display: 'FT', minuteNum: 90, isHalftime: false, isFulltime: true };
  }

  if (match.status === 'SCHEDULED') {
    return { display: match.time || '16:00', minuteNum: 0, isHalftime: false, isFulltime: false };
  }

  if (match.status === 'HALF_TIME' || match.live_period === 'HALF_TIME') {
    return { display: 'HT', minuteNum: 45, isHalftime: true, isFulltime: false };
  }

  const now = Date.now();
  const startTs = match.live_start_timestamp ? Number(match.live_start_timestamp) : now;
  const realElapsedSec = Math.max(0, Math.floor((now - startTs) / 1000) + (match.live_pause_elapsed_seconds || 0));

  // 9 real minutes = 90 in-game minutes => 1 real sec = 10 in-game sec
  const inGameElapsedSec = realElapsedSec * 10;
  const inGameMin = Math.floor(inGameElapsedSec / 60);

  const period = match.live_period || '1ST_HALF';
  const stop1 = Number(match.stoppage_time_1st || 0);
  const stop2 = Number(match.stoppage_time_2nd || 0);

  if (period === '1ST_HALF') {
    if (inGameMin <= 45) {
      return { display: `${Math.max(1, inGameMin)}'`, minuteNum: Math.max(1, inGameMin), isHalftime: false, isFulltime: false };
    } else {
      const extra = inGameMin - 45;
      if (extra > stop1) {
        return { display: 'HT', minuteNum: 45, isHalftime: true, isFulltime: false };
      }
      return { display: `45+${extra}'`, minuteNum: 45 + extra, isHalftime: false, isFulltime: false };
    }
  } else if (period === '2ND_HALF') {
    const min = 45 + inGameMin;
    if (min <= 90) {
      return { display: `${min}'`, minuteNum: min, isHalftime: false, isFulltime: false };
    } else {
      const extra = min - 90;
      if (extra > stop2) {
        return { display: 'FT', minuteNum: 90, isHalftime: false, isFulltime: true };
      }
      return { display: `90+${extra}'`, minuteNum: 90 + extra, isHalftime: false, isFulltime: false };
    }
  }

  return { display: match.minute_text || 'LIVE', minuteNum: 0, isHalftime: false, isFulltime: false };
}
