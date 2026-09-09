-- MIUCC 2026 Champions Cup Master Database Schema

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_managers (
  id TEXT PRIMARY KEY,
  nation_id TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plain_password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nation_id) REFERENCES participating_nations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournament_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  host TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT CHECK(status IN ('UPCOMING', 'LIVE', 'COMPLETED')) DEFAULT 'UPCOMING',
  tagline TEXT NOT NULL,
  secondary_tagline TEXT NOT NULL,
  max_predictions_per_match_day INTEGER DEFAULT 20,
  rules TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participating_nations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  flag_emoji TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  registration_ref TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  country TEXT NOT NULL,
  logo_url TEXT,
  coach_name TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED')) DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  player_id TEXT UNIQUE,
  team_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  dob TEXT NOT NULL,
  nationality TEXT NOT NULL,
  student_id TEXT NOT NULL,
  university TEXT NOT NULL,
  position TEXT NOT NULL,
  jersey_number INTEGER NOT NULL,
  preferred_foot TEXT DEFAULT 'Right',
  course TEXT,
  medical_conditions TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status TEXT CHECK(status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED')) DEFAULT 'SUBMITTED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_cards (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL UNIQUE,
  qr_code_url TEXT NOT NULL,
  card_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  capacity INTEGER DEFAULT 10000
);

CREATE TABLE IF NOT EXISTS match_days (
  id TEXT PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  prediction_status TEXT CHECK(prediction_status IN ('NOT_OPEN', 'OPEN', 'FULL', 'CLOSED')) DEFAULT 'NOT_OPEN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS group_teams (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(group_id, team_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  match_code TEXT UNIQUE NOT NULL,
  match_day_id TEXT NOT NULL,
  group_id TEXT,
  stage TEXT NOT NULL CHECK(stage IN ('GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL')),
  team_a_id TEXT NOT NULL,
  team_b_id TEXT NOT NULL,
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  penalty_a INTEGER,
  penalty_b INTEGER,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('SCHEDULED', 'LIVE', 'HALF_TIME', 'FULL_TIME', 'POSTPONED', 'CANCELLED')) DEFAULT 'SCHEDULED',
  potm_player_id TEXT,
  confirmed_result INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_day_id) REFERENCES match_days(id),
  FOREIGN KEY (team_a_id) REFERENCES teams(id),
  FOREIGN KEY (team_b_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS match_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  minute INTEGER NOT NULL,
  team_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'VAR')),
  secondary_player_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS standings (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  team_id TEXT NOT NULL UNIQUE,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  prediction_ref TEXT UNIQUE NOT NULL,
  match_day_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  predicted_winner_team_id TEXT,
  predicted_score_a INTEGER,
  predicted_score_b INTEGER,
  predicted_champion_team_id TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_day_id) REFERENCES match_days(id),
  UNIQUE(match_day_id, email_normalized)
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_published INTEGER DEFAULT 1,
  publish_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'IMAGE',
  album_name TEXT DEFAULT 'General',
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  tier TEXT CHECK(tier IN ('TITLE', 'GOLD', 'SILVER', 'PARTNER')) DEFAULT 'GOLD',
  website TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_day ON matches(match_day_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_day ON predictions(match_day_id);
CREATE INDEX IF NOT EXISTS idx_predictions_email ON predictions(email_normalized);
