/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_URL || '';

export function getAuthToken(): string | null {
  return localStorage.getItem('miucc_admin_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('miucc_admin_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('miucc_admin_token');
}

export function getManagerToken(): string | null {
  return localStorage.getItem('miucc_manager_token');
}

export function setManagerToken(token: string) {
  localStorage.setItem('miucc_manager_token', token);
}

export function removeManagerToken() {
  localStorage.removeItem('miucc_manager_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token: string | null = null;
  if (endpoint.startsWith('/api/manager')) {
    token = getManagerToken();
  } else {
    token = getAuthToken() || getManagerToken();
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'An unexpected server error occurred.');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request<any>('/api/auth/me'),

  // Tournament Settings & Summary
  getSettings: () => request<any>('/api/tournament/settings'),
  getSummary: () => request<any>('/api/tournament/summary'),
  updateSettings: (settings: any) => request<any>('/api/tournament/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Teams
  getTeams: () => request<any>('/api/teams'),
  getTeamById: (id: string) => request<any>(`/api/teams/${id}`),
  registerTeam: (payload: any) => request<any>('/api/teams/register', { method: 'POST', body: JSON.stringify(payload) }),
  checkTeamStatus: (ref: string) => request<any>(`/api/teams/status/${ref}`),
  adminGetTeams: () => request<any>('/api/teams/admin/all'),
  adminUpdateTeamStatus: (id: string, status: string) => request<any>(`/api/teams/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminSaveTeam: (payload: any) => request<any>('/api/teams/admin/save', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteTeam: (id: string) => request<any>(`/api/teams/admin/${id}`, { method: 'DELETE' }),

  // Players
  getPlayers: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/players?${query}`);
  },
  verifyPlayer: (playerId: string) => request<any>(`/api/players/verify/${playerId}`),
  adminGetPlayers: () => request<any>('/api/players/admin/all'),
  adminSavePlayer: (payload: any) => request<any>('/api/players/admin/save', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdatePlayerStatus: (id: string, status: string) => request<any>(`/api/players/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminDeletePlayer: (id: string) => request<any>(`/api/players/admin/${id}`, { method: 'DELETE' }),

  // Matches & Match Days
  getMatchDays: () => request<any>('/api/matches/days'),
  getMatches: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/matches?${query}`);
  },
  getMatchDetail: (id: string) => request<any>(`/api/matches/${id}`),
  getMatchEvents: (id: string) => request<any>(`/api/matches/${id}/events`),

  // Manager endpoints
  managerLogin: (credentials: any) => request<any>('/api/manager/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getManagerTeam: () => request<any>('/api/manager/my-team'),
  managerUpdateTeam: (data: any) => request<any>('/api/manager/my-team', { method: 'PUT', body: JSON.stringify(data) }),
  managerUpdatePlayer: (playerId: string, data: any) => request<any>(`/api/manager/players/${playerId}`, { method: 'PUT', body: JSON.stringify(data) }),
  managerAddPlayer: (payload: any) => request<any>('/api/manager/players', { method: 'POST', body: JSON.stringify(payload) }),
  managerDeletePlayer: (playerId: string) => request<any>(`/api/manager/players/${playerId}`, { method: 'DELETE' }),

  adminSaveMatch: (payload: any) => request<any>('/api/matches/admin/save', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteMatch: (matchId: string) => request<any>(`/api/matches/admin/${matchId}`, { method: 'DELETE' }),
  adminControlLiveClock: (matchId: string, payload: { action: string; stoppage_time?: number }) => request<any>(`/api/matches/admin/${matchId}/live-clock`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminRecordMatchEvent: (matchId: string, payload: any) => request<any>(`/api/matches/admin/${matchId}/events`, { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateMatchStatus: (matchId: string, payload: any) => request<any>(`/api/matches/admin/${matchId}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminConfirmMatchResult: (matchId: string) => request<any>(`/api/matches/admin/${matchId}/confirm-result`, { method: 'POST' }),

  // Standings
  getStandings: () => request<any>('/api/standings'),

  // Draw
  getDraw: () => request<any>('/api/draw'),
  adminGenerateDraw: (type: string) => request<any>('/api/draw/admin/generate', { method: 'POST', body: JSON.stringify({ type }) }),
  adminConfirmDraw: () => request<any>('/api/draw/admin/confirm', { method: 'POST' }),
  adminUnlockDraw: () => request<any>('/api/draw/admin/unlock', { method: 'POST' }),

  // Predictions
  getPredictionStatus: (matchDayId: string) => request<any>(`/api/predictions/status/${matchDayId}`),
  submitPrediction: (payload: any) => request<any>('/api/predictions/submit', { method: 'POST', body: JSON.stringify(payload) }),
  checkPredictionStatus: (ref: string) => request<any>(`/api/predictions/check/${ref}`),
  adminGetPredictions: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/api/predictions/admin/all?${query}`);
  },
  adminUpdateMatchDayPredictionStatus: (matchDayId: string, status: string) => request<any>(`/api/predictions/admin/match-day/${matchDayId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminDeletePrediction: (id: string) => request<any>(`/api/predictions/admin/${id}`, { method: 'DELETE' }),
  adminUpdatePredictionStatus: (id: string, status: string) => request<any>(`/api/predictions/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // News
  getNews: () => request<any>('/api/news'),
  getNewsBySlug: (slug: string) => request<any>(`/api/news/${slug}`),
  adminGetNews: () => request<any>('/api/news/admin/all'),
  adminSaveNews: (payload: any) => request<any>('/api/news/admin/save', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteNews: (id: string) => request<any>(`/api/news/admin/${id}`, { method: 'DELETE' }),

  // Gallery
  getGallery: () => request<any>('/api/gallery'),
  adminSaveGallery: (payload: any) => request<any>('/api/gallery/admin/save', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteGallery: (id: string) => request<any>(`/api/gallery/admin/${id}`, { method: 'DELETE' }),

  // Sponsors
  getSponsors: () => request<any>('/api/sponsors'),
  adminSaveSponsor: (payload: any) => request<any>('/api/sponsors/admin/save', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteSponsor: (id: string) => request<any>(`/api/sponsors/admin/${id}`, { method: 'DELETE' }),

  // Admin Metrics & Export
  adminGetManagers: () => request<any[]>('/api/admin/managers'),
  adminUpdateManager: (data: { nation_id: string; email: string; password: string; }) => request<any>('/api/admin/managers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  adminGetDashboardStats: () => request<any>('/api/admin/dashboard-stats'),
  adminGetAuditLogs: () => request<any>('/api/admin/audit-logs'),
  getExportPdfUrl: (type: string) => {
    const token = localStorage.getItem('miucc_admin_token') || '';
    return `${API_BASE}/api/admin/export-pdf/${type}?token=${encodeURIComponent(token)}`;
  },
  getPublicTeamsExportPdfUrl: () => `${API_BASE}/api/teams/export-pdf`,
  getTeamExportPdfUrl: (teamId: string) => {
    const token = localStorage.getItem('miucc_manager_token') || '';
    return `${API_BASE}/api/teams/${teamId}/export-pdf?token=${encodeURIComponent(token)}`;
  },

  // File Upload
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    let token = getAuthToken() || getManagerToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }
    return data;
  }
};
