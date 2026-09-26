export const getTeamFlagImage = (countryName?: string, teamName?: string): string | null => {
  if (!countryName && !teamName) return null;
  const name = (countryName || teamName || '').toLowerCase().trim();
  
  const map: Record<string, string> = {
    'liberia': '/images/flags/lbr.png',
    'eswatini': '/images/flags/swz.png',
    'tanzania': '/images/flags/tza.png',
    'south sudan': '/images/flags/ssd.png',
    'zimbabwe': '/images/flags/zwe.png',
    'india': '/images/flags/ind.png',
    'nigeria': '/images/flags/nga.png',
    'uganda': '/images/flags/uga.png',
    'zambia': '/images/flags/zmb.png',
    'mozambique': '/images/flags/moz.png'
  };

  const matchedKey = Object.keys(map).find(k => name.includes(k));
  return matchedKey ? map[matchedKey] : null;
};
