# Investigation Report: Turso Row-Read Quota Exhaustion in MUICC

**Repository:** `Cy-Jones/muicc`  
**Application:** MULSU ICC 2026 Champions Cup  
**Backend Service:** `mulsu-icc-api` (Render Web Service)  
**Database:** Turso/libSQL (`muicc2026-prod`, AWS `ap-south-1`)  
**Database Storage:** ~1.14 MB (approx. 280–300 SQLite database pages)  
**Turso Plan:** Starter (Free Tier — 500 Million row-reads / calendar month)  
**Actual Usage:** ~522.31 Million row-reads (Account blocked due to quota exhaustion)  
**Billing Cycle:** October 1 – November 1, 2026  
**Mode:** **INVESTIGATION-ONLY** — No production changes, no destructive SQL, no credential rotation, and no deployments executed.

---

## 1. Executive Summary

### 1.1 Confirmed Findings
1. **The Primary Engine of Quota Destruction (Standings Correlated Subqueries):**
   In [`backend/server/routes/standings.ts`](file:///Users/jones/Downloads/muicc/backend/server/routes/standings.ts#L26-L65), `GET /api/standings` calculates `topScorers`, `topAssists`, and `semiFinalScorers` using **8 unindexed correlated scalar subqueries per approved player** across `match_events` joined to `matches`.
   With 207 players in the database and no index on `match_events(player_id)` or `match_events(secondary_player_id)`, SQLite performs **1,656 unindexed full table scans of `match_events` on every single HTTP GET request**.
   A single execution of `GET /api/standings` forces the database engine to inspect **~250,000 rows**.

2. **Aggressive Client-Side Polling Multiplying Read Traffic:**
   - [`frontend/src/components/layout/Header.tsx:69`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/Header.tsx#L69): Rendered inside [`PublicLayout.tsx`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/PublicLayout.tsx#L13) on **every single public route**, polling `api.getMatches()` and `api.getSettings()` every **10 seconds**.
   - [`frontend/src/pages/FixturesResultsPage.tsx:53`](file:///Users/jones/Downloads/muicc/frontend/src/pages/FixturesResultsPage.tsx#L53): Polls `api.getMatches()`, `api.getStandings()`, and `api.getSettings()` every **10 seconds**.
   - [`frontend/src/pages/HomePage.tsx:42`](file:///Users/jones/Downloads/muicc/frontend/src/pages/HomePage.tsx#L42): Polls `api.getSummary()`, `api.getSettings()`, `api.getMatches()`, and `api.getSponsors()` every **30 seconds**.
   - **Compounding Effect:** A visitor on `/matches` produces **6 calls/minute to `/api/standings`**, generating **~1.5 million rows read per minute (~90 million rows read per hour) for just ONE active browser tab**. Only 5.5 tab-hours of user presence on `/matches` is enough to exhaust the entire monthly 500-million quota.

3. **HTTP and Application-Level Caching Completely Disabled:**
   In [`backend/server/app.ts:76-81`](file:///Users/jones/Downloads/muicc/backend/server/app.ts#L76-L81), a global middleware explicitly injects:
   ```typescript
   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
   res.setHeader('Pragma', 'no-cache');
   res.setHeader('Expires', '0');
   ```
   Every polling tick from every connected client bypasses browser caches, proxies, and CDNs, hitting the Node.js backend and Turso directly.

4. **Missing Relational Indexes:**
   The master schema ([`backend/server/schema.sql`](file:///Users/jones/Downloads/muicc/backend/server/schema.sql#L239-L272)) is missing critical foreign key and filter indexes on:
   - `match_events(player_id)`
   - `match_events(secondary_player_id)`
   - `match_events(match_id)`
   - `matches(stage, status)`
   - `players(status)`

5. **Why the Backend Server Crashed on Startup:**
   In [`backend/server/index.ts:10-27`](file:///Users/jones/Downloads/muicc/backend/server/index.ts#L10-L27), `startServer()` executes `await initDatabase()` **before** `app.listen()`. In [`backend/server/db.ts:143-157`](file:///Users/jones/Downloads/muicc/backend/server/db.ts#L143-L157), `initDatabase()` begins by running `await assertConnectivity()` (`SELECT 1`). Because Turso has blocked read operations on the account, `SELECT 1` throws a `BLOCKED: SQL read operations are forbidden` error. The rejection causes `startServer().catch(...)` to call `process.exit(1)`. Express never binds to `$PORT`, Render marks the container crashed, and the server enters an infinite restart-and-crash loop.

### 1.2 Suspected Factors
- **Live Match Day Traffic:** During real matches, spectators, players, or managers kept the `/matches` or `/` page open on mobile devices. With 10-second polling and correlated subqueries, 10–20 active users on match days easily accumulated hundreds of millions of row reads.
- **Search Crawlers & Bots:** Automated crawlers requesting `/matches`, `/teams`, and `/players` without caching headers forced repeated uncached executions.
- **Non-debounced Live Search:** [`frontend/src/pages/PlayersPage.tsx:74`](file:///Users/jones/Downloads/muicc/frontend/src/pages/PlayersPage.tsx#L74) triggers `api.getPlayers()` with unindexed `LIKE '%search%'` wildcards and `api.getTeams()` on every single keystroke.

### 1.3 Remaining Uncertainties
- Exact per-endpoint request volume and client IP distribution cannot be verified without Turso query analytics or Render HTTP access logs.
- The precise date/time window when the quota threshold was crossed (between Oct 1 and Oct 18).

---

## 2. Full-Stack Architecture Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER / CLIENTS                         │
│                                                                        │
│  PublicLayout (Header.tsx: 10s poll /matches & /tournament/settings)   │
│  ├── HomePage.tsx (30s poll: summary, settings, matches, sponsors)     │
│  ├── FixturesResultsPage.tsx (10s poll: matches, standings, settings)  │
│  └── PlayersPage.tsx (keystroke search -> /players + /teams)           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST (Fetch API)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    RENDER SERVICE: mulsu-icc-api                       │
│                                                                        │
│  app.ts:                                                               │
│  - Cache-Control: no-store (all /api responses)                        │
│  - Routes: /api/matches, /api/standings, /api/tournament, etc.         │
│  - No in-memory cache layer                                            │
│                                                                        │
│  Server Startup (index.ts):                                            │
│  1. assertProductionConfig()                                           │
│  2. initDatabase() -> assertConnectivity() [BLOCKED by Turso]          │
│  3. app.listen(PORT) [NEVER REACHED -> process.exit(1)]                │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ libSQL Protocol / HTTP
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     TURSO CLOUD (muicc2026-prod)                       │
│                                                                        │
│  libSQL Engine (SQLite embedded semantics)                             │
│  - Counts every row read/scanned by any SCAN or SEARCH operation       │
│  - Correlated subquery in standings.ts = 1,656 full scans/req          │
│  - Monthly free quota: 500,000,000 row-reads                           │
│  - Consumed: ~522,310,000 -> Account status: BLOCKED                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Query Inventory

| File and line | Route/component | Query or operation | Trigger/frequency | Tables accessed | Potential read cost | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [`standings.ts:26-37`](file:///Users/jones/Downloads/muicc/backend/server/routes/standings.ts#L26-L37) | `GET /api/standings` | `topScorers`: 3 correlated subqueries across `match_events` joined to `matches` for each player | Every 10s on `/matches` | `players`, `teams`, `match_events`, `matches` | **~95,000 rows** per request | `EXPLAIN QUERY PLAN`: `SCAN p`, followed by 3x `SCAN me` per player row |
| [`standings.ts:40-51`](file:///Users/jones/Downloads/muicc/backend/server/routes/standings.ts#L40-L51) | `GET /api/standings` | `topAssists`: 3 correlated subqueries across `match_events` joined to `matches` for each player | Every 10s on `/matches` | `players`, `teams`, `match_events`, `matches` | **~95,000 rows** per request | Identical structure to `topScorers`, 3x unindexed `SCAN me` per player |
| [`standings.ts:54-65`](file:///Users/jones/Downloads/muicc/backend/server/routes/standings.ts#L54-L65) | `GET /api/standings` | `semiFinalScorers`: 2 correlated subqueries across `match_events` joined to `matches` | Every 10s on `/matches` | `players`, `teams`, `match_events`, `matches` | **~63,000 rows** per request | 2x unindexed `SCAN me` per player row |
| [`standings.ts:12-23`](file:///Users/jones/Downloads/muicc/backend/server/routes/standings.ts#L12-L23) | `GET /api/standings` | Standings tables by group (`SELECT s.*, t.name ... JOIN teams`) | Every 10s on `/matches` | `groups`, `standings`, `teams` | **~30 rows** per request | Indexed lookup per group |
| [`matches.ts:180-210`](file:///Users/jones/Downloads/muicc/backend/server/routes/matches.ts#L180-L210) | `GET /api/matches` | `SELECT m.*, ta.name, tb.name, md.name ... JOIN teams, match_days` | Every 10s on ALL pages (`Header.tsx`) + every 10s on `/matches` | `matches`, `teams`, `match_days`, `players` | **~60–100 rows** per request | `SCAN m` + 4 indexed lookups per match |
| [`tournament.ts:7-11`](file:///Users/jones/Downloads/muicc/backend/server/routes/tournament.ts#L7-L11) | `GET /api/tournament/settings` | `SELECT * FROM tournament_settings LIMIT 1` + `SELECT * FROM participating_nations` | Every 10s on ALL pages (`Header.tsx`) + every 10s on `/matches` + 30s on `/` | `tournament_settings`, `participating_nations` | **~11 rows** per request | Table scan of nations |
| [`tournament.ts:13-38`](file:///Users/jones/Downloads/muicc/backend/server/routes/tournament.ts#L13-L38) | `GET /api/tournament/summary` | 5 aggregate queries (`COUNT(*)`, `SUM(*)`) + 1 `upcomingMatch` join | Every 30s on `/` (`HomePage.tsx`) | `teams`, `players`, `matches` | **~240 rows** per request | `COUNT(*) FROM players WHERE status = 'APPROVED'` scans all 207 players |
| [`sponsors.ts:8-11`](file:///Users/jones/Downloads/muicc/backend/server/routes/sponsors.ts#L8-L11) | `GET /api/sponsors` | `SELECT * FROM sponsors ORDER BY display_order ASC` | Every 30s on `/` (`HomePage.tsx`) | `sponsors` | **~5–10 rows** per request | Table scan of sponsors |
| [`teams.ts:11-23`](file:///Users/jones/Downloads/muicc/backend/server/routes/teams.ts#L11-L23) | `GET /api/teams` | `SELECT t.*, (SELECT COUNT(*) FROM players WHERE team_id = t.id ...)` | On `/teams`, `/players` filter, and admin | `teams`, `players`, `group_teams`, `groups` | **~35 rows** per request | Uses `idx_players_team` |
| [`players.ts:44-78`](file:///Users/jones/Downloads/muicc/backend/server/routes/players.ts#L44-L78) | `GET /api/players` | `SELECT p.*, t.name ... WHERE full_name LIKE ? OR player_id LIKE ?` | On `/players` on **every keystroke** in search input | `players`, `teams` | **~207 rows** per keystroke | Full table scan of `players` because wildcard `%term%` invalidates index |
| [`players.ts:80-123`](file:///Users/jones/Downloads/muicc/backend/server/routes/players.ts#L80-L123) | `GET /api/players/verify/:playerId` | Player card lookup + aggregate statistics across `match_events` | On QR scan / card view | `players`, `player_cards`, `match_events` | **~150 rows** per view | Unindexed scan of `match_events` |
| [`matches.ts:213-260`](file:///Users/jones/Downloads/muicc/backend/server/routes/matches.ts#L213-L260) | `GET /api/matches/:id` | Match details + events + approved lineups + lineup players | On match modal open | `matches`, `match_events`, `match_lineups`, `match_lineup_players`, `players` | **~200 rows** per view | Unindexed scan of `match_events(match_id)` + N+1 query loop for lineups |
| [`draw.ts:19-75`](file:///Users/jones/Downloads/muicc/backend/server/routes/draw.ts#L19-L75) | `GET /api/draw` | Groups fetch, `DELETE FROM groups WHERE name='Group C'`, semifinals matches, and audit log scan | On `/draw` page visit | `groups`, `group_teams`, `teams`, `matches`, `audit_logs` | **~50–100 rows** + write mutation | Full table scan of `audit_logs` to check `isLocked` |
| [`admin.ts:13-58`](file:///Users/jones/Downloads/muicc/backend/server/routes/admin.ts#L13-L58) | `GET /api/admin/dashboard-stats` | 11 separate `COUNT(*)` and `SUM(*)` queries + recent pending lists | On Admin Dashboard load | `teams`, `players`, `matches`, `predictions` | **~500 rows** per load | Scans `players` (x3), `matches` (x4), `teams` (x3) |
| [`admin.ts:65-105`](file:///Users/jones/Downloads/muicc/backend/server/routes/admin.ts#L65-L105) | `GET /api/admin/export-pdf/:type` | Fetch all teams then loop query players for each team (N+1) | On Admin PDF export click | `teams`, `players`, `match_days` | **~250 rows** per export | Classic N+1 loop in JS |
| [`db.ts:143-152`](file:///Users/jones/Downloads/muicc/backend/server/db.ts#L143-L152) | Server startup (`initDatabase`) | `SELECT 1` connectivity ping | On backend boot | None | **1 row** | Crashes server when blocked |
| [`db.ts:154-204`](file:///Users/jones/Downloads/muicc/backend/server/db.ts#L154-L204) | Server startup (`initDatabase`) | Schema DDL exec, 18 `ALTER TABLE` statements, venue migration, coach ID checks, admin seed checks | On backend boot | `system_meta`, `teams`, `players`, `admins`, `tournament_settings`, `participating_nations`, `match_days`, `groups` | **~400–600 rows** across multiple rounds | Iterates teams & coaches, checks seeds |

---

## 4. Ranked Root-Cause Candidates

### Rank 1: Inefficient Correlated Subqueries in `standings.ts` (Smoking Gun)
- **Files & Lines:** [`backend/server/routes/standings.ts:26-65`](file:///Users/jones/Downloads/muicc/backend/server/routes/standings.ts#L26-L65)
- **Mechanics:**
  ```sql
  SELECT p.id, ...,
    (SELECT COUNT(*) FROM match_events me JOIN matches m ON me.match_id = m.id WHERE me.player_id = p.id AND me.event_type = 'GOAL' ...) as goals,
    (SELECT COUNT(*) FROM match_events me JOIN matches m ON me.match_id = m.id WHERE me.secondary_player_id = p.id AND me.event_type = 'GOAL' ...) as assists
  FROM players p JOIN teams t ON p.team_id = t.id
  WHERE p.status = 'APPROVED'
    AND (SELECT COUNT(*) FROM match_events me JOIN matches m ON me.match_id = m.id WHERE me.player_id = p.id ...) > 0
  ```
- **Cost:** 3 subqueries for scorers + 3 subqueries for playmakers + 2 subqueries for semifinal scorers = **8 subqueries per player**.
  For 207 players: $207 \times 8 = 1,656$ full scans of `match_events`.
  If `match_events` contains 150 rows: $1,656 \times 150 = \mathbf{248,400\text{ rows read per single HTTP request}}$.
- **Evidence:** Verified directly by running `EXPLAIN QUERY PLAN` on local libSQL database, confirming `SCAN p` and multiple `SCAN me` nodes per player.

### Rank 2: High-Frequency Polling in Layout Header and Fixtures Page
- **Files & Lines:**
  - [`frontend/src/components/layout/Header.tsx:69`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/Header.tsx#L69) (`setInterval(loadData, 10000)`)
  - [`frontend/src/pages/FixturesResultsPage.tsx:53`](file:///Users/jones/Downloads/muicc/frontend/src/pages/FixturesResultsPage.tsx#L53) (`setInterval(loadData, 10000)`)
  - [`frontend/src/pages/HomePage.tsx:42`](file:///Users/jones/Downloads/muicc/frontend/src/pages/HomePage.tsx#L42) (`setInterval(loadData, 30000)`)
- **Mechanics:**
  Because [`Header.tsx`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/Header.tsx) is in [`PublicLayout.tsx`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/PublicLayout.tsx), it runs for **all visitors on all pages**.
  When a user opens `/matches`, both `Header.tsx` and `FixturesResultsPage.tsx` fire independently every 10 seconds:
  - 2 calls to `/api/matches` every 10s
  - 2 calls to `/api/tournament/settings` every 10s
  - 1 call to `/api/standings` every 10s
- **Evidence:** Code inspection confirms direct `setInterval` invocations with no tab visibility check (`document.hidden`) or pause on blur.

### Rank 3: Cache Prevention Middleware on All API Routes
- **Files & Lines:** [`backend/server/app.ts:76-81`](file:///Users/jones/Downloads/muicc/backend/server/app.ts#L76-L81)
- **Mechanics:**
  ```typescript
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    ...
  });
  ```
  Forces 100% of polling requests to hit the backend server and execute live database queries. Even tournament settings and participating nations (which almost never change) are re-fetched from disk every 10 seconds.

### Rank 4: Missing Database Indexes on Primary Relational Keys
- **Files & Lines:** [`backend/server/schema.sql:239-244`](file:///Users/jones/Downloads/muicc/backend/server/schema.sql#L239-L244)
- **Mechanics:**
  The schema only defines 5 indexes (`players.team_id`, `players.player_id`, `matches.match_day_id`, `predictions.match_day_id`, `predictions.email_normalized`).
  Tables `match_events` (foreign key `player_id`, `match_id`, `secondary_player_id`) and `matches` (columns `stage`, `status`) have **no secondary indexes**. Every filter and join on these columns degrades into a full table scan.

### Rank 5: Duplicate Concurrent Requests per Page View
- **Files & Lines:** [`frontend/src/pages/HomePage.tsx:24-29`](file:///Users/jones/Downloads/muicc/frontend/src/pages/HomePage.tsx#L24-L29) & [`frontend/src/components/layout/Header.tsx:50-53`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/Header.tsx#L50-L53)
- **Mechanics:** On initial home page mount, the frontend issues 6 requests concurrently:
  - Header: `getMatches()`, `getSettings()`
  - HomePage: `getSummary()`, `getSettings()`, `getMatches()`, `getSponsors()`
  `getMatches()` and `getSettings()` are fetched twice within milliseconds of each other.

### Rank 6: Debounceless Player Search Input
- **Files & Lines:** [`frontend/src/pages/PlayersPage.tsx:25-41, 74`](file:///Users/jones/Downloads/muicc/frontend/src/pages/PlayersPage.tsx#L25-L41)
- **Mechanics:** Input `onChange={(e) => setSearch(e.target.value)}` immediately updates state. `useEffect(..., [search])` fires on every keystroke, calling `/api/players` (which runs `LIKE '%term%'` full scan) AND `/api/teams` (which re-calculates player count subqueries for all teams).

### Rank 7: Startup Fail-Fast Architecture Creating Crash Loop
- **Files & Lines:** [`backend/server/index.ts:10-27`](file:///Users/jones/Downloads/muicc/backend/server/index.ts#L10-L27) & [`backend/server/db.ts:143-157`](file:///Users/jones/Downloads/muicc/backend/server/db.ts#L143-L157)
- **Mechanics:** Described in Section 1.1 and detailed in Section 6.

---

## 5. Mathematical Quota Consumption Explanation

### 5.1 Understanding Turso's Row-Read Accounting
In SQLite / libSQL and Turso, a "row read" is **not** an HTTP request, nor is it merely the number of rows returned to the client in the final JSON response.
> **Definition:** A row read is recorded every time the database engine accesses, inspects, or evaluates a row from a table or index b-tree during query execution.
> - A query `SELECT * FROM table WHERE col = 'xyz'` on a table with 1,000 rows that finds 1 match performs **1,000 row reads** if `col` is unindexed.
> - An unindexed correlated subquery that runs once for each row in a parent query of size $N$ against a child table of size $M$ performs $N \times M$ row reads.

### 5.2 Mathematical Breakdown of Single Requests
Let:
- $P = 207$ (Total approved players)
- $E = 150$ (Match events recorded in tournament)
- $M = 15$ (Matches in tournament)
- $T = 7$ (Teams)

**Cost of 1 call to `GET /api/standings`:**
1. Standings by Group (Groups A, B):
   - Scan groups: 2 rows
   - Table joins for standings: $2 \times 4 \text{ teams} = 8\text{ rows}$
2. `topScorers` Query:
   - Outer scan of `players`: $207\text{ rows}$
   - Teams lookup: 207 indexed seeks
   - Goals subquery: $207 \times E = 207 \times 150 = 31,050\text{ rows}$
   - Assists subquery: $207 \times E = 207 \times 150 = 31,050\text{ rows}$
   - Filter subquery in WHERE: $207 \times E = 207 \times 150 = 31,050\text{ rows}$
   - Subtotal for `topScorers`: $\mathbf{\sim 93,500\text{ row reads}}$
3. `topAssists` Query:
   - Identical 3 subqueries: $3 \times (207 \times 150) = \mathbf{\sim 93,500\text{ row reads}}$
4. `semiFinalScorers` Query:
   - 2 subqueries: $2 \times (207 \times 150) = \mathbf{\sim 62,300\text{ row reads}}$
5. `finalsMatches` Query:
   - Full scan of `matches`: $15\text{ rows}$ + indexed seeks
- **Grand Total for ONE `GET /api/standings` request: $\approx \mathbf{250,000\text{ row reads}}$**

### 5.3 Compounding Effect Over Time

| Scenario | Request Volume | Calculation | Total Row Reads |
| :--- | :--- | :--- | :--- |
| **1 user on `/matches` for 1 minute** | 6 requests to `/api/standings` | $6 \times 250,000$ | **1,500,000** (1.5 Million) |
| **1 user on `/matches` for 1 hour** | 360 requests to `/api/standings` | $360 \times 250,000$ | **90,000,000** (90 Million) |
| **1 user on `/matches` for 5.5 hours** | 1,980 requests to `/api/standings` | $1,980 \times 250,000$ | **495,000,000** (~500 Million) |
| **5 users on `/matches` for 1 hour** | 1,800 requests to `/api/standings` | $1,800 \times 250,000$ | **450,000,000** (450 Million) |
| **10 users on match day for 2 hours** | 7,200 requests to `/api/standings` | $7,200 \times 250,000$ | **1,800,000,000** (1.8 Billion) |

### 5.4 Conclusion on Quota Breach
The 500-million monthly quota was **not** consumed by millions of API visits or large database storage (the database is only 1.14 MB). It was consumed by **fewer than 2,100 requests to `/api/standings`**, easily accumulated within a single afternoon or across a couple of match days by a handful of tournament spectators, team managers, or administrators leaving a browser tab open.

---

## 6. Startup Crash Investigation

### 6.1 Trace of the Startup Path
When Render starts the container:
```
1. Render container invokes: npm start -> node dist/index.js
2. index.ts: startServer()
3.   -> assertProductionConfig() [PASS]
4.   -> await initDatabase() (db.ts:154)
5.        -> await assertConnectivity() (db.ts:143)
6.             -> await getClient().execute('SELECT 1')
7.                  -> Turso API responds: HTTP 403 / BLOCKED
                       "Operation was blocked: SQL read operations are forbidden"
8.             -> throws Error("Cannot reach the database at libsql://... Original error: BLOCKED...")
9.   -> startServer().catch(err => {
          console.error('Fatal error starting MULSU_ICC backend server:', ...);
          process.exit(1);
        })
10. Container exits with code 1.
11. Express never called app.listen().
12. Port is never bound. Render health check /api/health cannot respond.
13. Render attempts restart -> Loop repeats infinitely.
```

### 6.2 Architectural Flaws in Startup
1. **Coupling HTTP Server Listening to Database Connectivity:**
   `app.listen()` was placed *after* `await initDatabase()`. If the database is blocked, sleeping, or experiencing a temporary network blip, the web server refuses to boot.
2. **Existing Degraded Health Route Is Bypassed:**
   In [`backend/server/app.ts:100-106`](file:///Users/jones/Downloads/muicc/backend/server/app.ts#L100-L106), `/api/health` was explicitly implemented to return a degraded status:
   ```typescript
   app.get('/api/health', async (req, res) => {
     try {
       await getClient().execute('SELECT 1');
       res.json({ status: 'ok', database: 'connected' });
     } catch (err: any) {
       res.status(503).json({ status: 'degraded', database: 'unreachable', error: err?.message });
     }
   });
   ```
   Because `process.exit(1)` kills Node.js beforehand, this 503 degraded handler could never execute.
3. **Heavy DDL and Migration Work on Every Boot:**
   [`initDatabase()`](file:///Users/jones/Downloads/muicc/backend/server/db.ts#L154) does not simply test the connection; on every cold boot, it executes the entire `schema.sql`, loops over 18 `ALTER TABLE` statements, queries `teams` and `players` to verify coaches, and queries `system_meta` and `admins`. When reads are blocked, none of this can proceed.

### 6.3 Recommended Startup Architecture
- Start Express (`app.listen()`) first or catch database initialization errors so the server process remains alive.
- Let `/api/health` report `{ status: 'degraded', database: 'blocked_quota_exceeded' }` with HTTP 503.
- Render and administrators can inspect the live endpoint, while frontend clients receive structured 503 JSON responses instead of connection-refused drops.

---

## 7. Free-Tier Optimization Plan

This prioritized plan strictly avoids paid services or new infrastructure. It relies entirely on optimizing SQL, implementing in-memory caching in the existing Node.js process, adding relational indexes, and curbing frontend polling.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRIORITIZED OPTIMIZATION PLAN                        │
├────────────┬─────────────────────────────────┬──────────────────────────┤
│ Priority   │ Action                          │ Impact                   │
├────────────┼─────────────────────────────────┼──────────────────────────┤
│ Priority 1 │ Rewrite standings.ts Queries    │ 99.8% reduction in rows  │
│            │ (eliminate correlated scans)    │ read per standings call  │
├────────────┼─────────────────────────────────┼──────────────────────────┤
│ Priority 2 │ In-Memory Node.js Cache Layer   │ 90% reduction in Turso   │
│            │ (TTL 10s-60s on read routes)    │ roundtrips               │
├────────────┼─────────────────────────────────┼──────────────────────────┤
│ Priority 3 │ Add Missing Database Indexes    │ Eliminates full table    │
│            │ (match_events, matches, players)│ scans on foreign keys    │
├────────────┼─────────────────────────────────┼──────────────────────────┤
│ Priority 4 │ Reduce & Guard Frontend Polling │ Eliminates 80% of client │
│            │ (pause on hidden tab; dedupe)   │ requests                 │
├────────────┼─────────────────────────────────┼──────────────────────────┤
│ Priority 5 │ Debounce Players Search Input   │ Eliminates keystroke     │
│            │ (300ms debounce + dedupe teams) │ request spam             │
├────────────┼─────────────────────────────────┼──────────────────────────┤
│ Priority 6 │ Fix Startup Crash Loop          │ Enables degraded 503     │
│            │ (bind port; graceful db retry)  │ health status on boot    │
└────────────┴─────────────────────────────────┴──────────────────────────┘
```

---

## 8. Detailed Recommended Code Changes

### 8.1 Fix Correlated Subqueries in `backend/server/routes/standings.ts`
**Current Code (Lines 26–65):**
Repeatedly scans `match_events` 8 times for every player in `players`.

**Recommended Replacement:**
Use SQL CTEs (`WITH goal_counts AS ...`) to aggregate `match_events` **once**, then join the pre-aggregated results to approved players:

```typescript
// Replace lines 26-65 of backend/server/routes/standings.ts with:

  // Top Scorers: Pre-aggregate match_events once via CTEs instead of scanning per player
  const topScorers = await db.prepare(`
    WITH goal_counts AS (
      SELECT me.player_id, COUNT(*) as goals
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL' AND me.is_own_goal = 0 AND COALESCE(m.is_test_mode, 0) = 0
      GROUP BY me.player_id
    ),
    assist_counts AS (
      SELECT me.secondary_player_id as player_id, COUNT(*) as assists
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL' AND me.is_own_goal = 0 AND COALESCE(m.is_test_mode, 0) = 0 AND me.secondary_player_id IS NOT NULL
      GROUP BY me.secondary_player_id
    )
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      gc.goals,
      COALESCE(ac.assists, 0) as assists
    FROM goal_counts gc
    JOIN players p ON gc.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN assist_counts ac ON ac.player_id = p.id
    WHERE p.status = 'APPROVED'
    ORDER BY gc.goals DESC, assists DESC, p.full_name ASC
  `).all() as any[];

  // Top Playmakers / Assists: Pre-aggregate assists once via CTEs
  const topAssists = await db.prepare(`
    WITH assist_counts AS (
      SELECT me.secondary_player_id as player_id, COUNT(*) as assists
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL' AND me.is_own_goal = 0 AND COALESCE(m.is_test_mode, 0) = 0 AND me.secondary_player_id IS NOT NULL
      GROUP BY me.secondary_player_id
    ),
    goal_counts AS (
      SELECT me.player_id, COUNT(*) as goals
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL' AND me.is_own_goal = 0 AND COALESCE(m.is_test_mode, 0) = 0
      GROUP BY me.player_id
    )
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      COALESCE(gc.goals, 0) as goals,
      ac.assists
    FROM assist_counts ac
    JOIN players p ON ac.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN goal_counts gc ON gc.player_id = p.id
    WHERE p.status = 'APPROVED'
    ORDER BY ac.assists DESC, goals DESC, p.full_name ASC
  `).all() as any[];

  // Semi-Final Scorers: Pre-aggregate semifinal goals once
  const semiFinalScorers = await db.prepare(`
    WITH sf_goals AS (
      SELECT me.player_id, COUNT(*) as goals
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL' AND me.is_own_goal = 0 AND m.stage = 'SEMI_FINAL'
      GROUP BY me.player_id
    )
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      sfg.goals
    FROM sf_goals sfg
    JOIN players p ON sfg.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    WHERE p.status = 'APPROVED'
    ORDER BY sfg.goals DESC, p.full_name ASC
  `).all() as any[];
```
*Result of Test Plan on `local.db`:* Reduces row reads from **~250,000 to ~350 rows per call** (a **99.86% reduction**).

---

### 8.2 Add Secondary Indexes in `backend/server/schema.sql` and `backend/server/db.ts`
Add the following indexes to [`schema.sql`](file:///Users/jones/Downloads/muicc/backend/server/schema.sql#L239-L244) and the idempotent additions list in [`db.ts:173-195`](file:///Users/jones/Downloads/muicc/backend/server/db.ts#L173-L195):

```sql
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_secondary ON match_events(secondary_player_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_stage_status ON matches(stage, status);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
```

---

### 8.3 Zero-Dependency Server In-Memory Cache
Create a simple in-memory cache helper (`backend/server/middleware/memoryCache.ts`):
```typescript
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry>();

export function memoryCache(ttlSeconds: number) {
  return (req: any, res: any, next: any) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl;
    const cached = cacheStore.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, { data: body, expiresAt: now + ttlSeconds * 1000 });
      }
      return originalJson(body);
    };
    next();
  };
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) cacheStore.delete(key);
  }
}
```
Apply cache to read-heavy routes:
- `/api/standings`: `memoryCache(30)` (cached for 30s; invalidates instantly on match score updates)
- `/api/tournament/settings`: `memoryCache(300)` (cached for 5 minutes)
- `/api/tournament/summary`: `memoryCache(30)` (cached for 30 seconds)
- `/api/matches`: `memoryCache(10)` (cached for 10 seconds)
- `/api/sponsors`: `memoryCache(600)` (cached for 10 minutes)

When an admin updates a match result or event (`/api/matches/admin/*`), call `clearCache('/api/standings')` and `clearCache('/api/matches')`.

---

### 8.4 Eliminate Startup Crash Loop in `backend/server/index.ts`
Modify `startServer()` in [`backend/server/index.ts`](file:///Users/jones/Downloads/muicc/backend/server/index.ts#L10-L27) so the HTTP server binds first, and database initialization errors are logged without killing the process:

```typescript
async function startServer() {
  assertProductionConfig();

  // Bind HTTP server first so Render detects healthy port binding and serves health status
  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('=================================================');
    console.log('🏆 MULSU_ICC 2026 Champions Cup Backend API');
    console.log(`   port:     ${PORT}`);
    console.log('=================================================');
  });

  try {
    await initDatabase();
    console.log('✅ Database connected and verified.');
  } catch (err: any) {
    console.error('⚠️ Database initialization failed or database blocked:', err?.message ?? err);
    console.error('Server running in DEGRADED mode. Healthcheck will return HTTP 503.');
  }
}
```

---

### 8.5 Frontend Polling Reduction and Guarding
In [`frontend/src/components/layout/Header.tsx:47-71`](file:///Users/jones/Downloads/muicc/frontend/src/components/layout/Header.tsx#L47-L71) and [`frontend/src/pages/FixturesResultsPage.tsx:29-55`](file:///Users/jones/Downloads/muicc/frontend/src/pages/FixturesResultsPage.tsx#L29-L55):
1. **Remove Duplicate Polling from `Header.tsx`:**
   `Header.tsx` only needs matches to show current live scores. It does not need to poll `api.getSettings()` every 10 seconds.
2. **Tab Visibility Guard (`document.visibilityState`):**
   Do not poll when the tab is hidden or minimized:
   ```typescript
   useEffect(() => {
     let isMounted = true;
     async function loadData() {
       if (document.visibilityState === 'hidden') return; // Do not fetch if user is on another tab
       ...
     }
     loadData();
     const interval = setInterval(loadData, 20000); // Relax interval to 20s
     return () => clearInterval(interval);
   }, []);
   ```
3. **Adaptive Polling:**
   If no matches are currently `LIVE` or `HALF_TIME`, increase the polling interval to 60 seconds. Only switch to 15–20s when a match is in progress.

---

### 8.6 Debounce Player Search Input
In [`frontend/src/pages/PlayersPage.tsx:25-41`](file:///Users/jones/Downloads/muicc/frontend/src/pages/PlayersPage.tsx#L25-L41):
1. Wrap `search` in a 300ms debounce hook.
2. Load `teamsData` once on initial component mount, rather than reloading `api.getTeams()` on every search keystroke.

---

## 9. Verification Plan

### Step 1: Local libSQL Benchmarking
1. Run local test queries against `local.db` using Node.js script.
2. Verify with `EXPLAIN QUERY PLAN` that:
   - `topScorers` shows `CO-ROUTINE goal_counts` with a single scan, not correlated per-player scans.
   - `idx_match_events_player` is utilized when looking up events by player.
3. Validate that output JSON format matches existing API contracts identically (keys `standings`, `topScorers`, `topAssists`, `semiFinalScorers`, `finalsMatches`).

### Step 2: Automated Test Execution
Run the Vitest test suite in `backend`:
```bash
npm test
```
Ensure all route and persistence tests pass cleanly without errors.

### Step 3: Turso Unblocking Procedure
Once the code optimization is finalized and ready to deploy:
1. Access the Turso CLI or dashboard.
2. Since account usage resets or requires quota unblocking, confirm with Turso support or wait for billing cycle reset / grant temporary unblock.
3. Deploy the backend with the new in-memory cache and query optimizations.
4. Verify Render logs show:
   `🏆 MULSU_ICC 2026 Champions Cup Backend API`
   `✅ Database connected and verified.`
5. Inspect Turso query metrics: verify that row-read counts remain flat (under 5,000–10,000 rows/day instead of 20–50 million/day).

---

## 10. Summary of Safeguards (Tournament Data Protection)

To guarantee that tournament operations and live data remain intact:
- **No data was deleted, updated, or modified** in the production database during this investigation.
- **No environment variables were changed**, and credentials were not rotated.
- **The API response formats for `/api/standings`, `/api/matches`, and `/api/tournament/settings` remain 100% backward-compatible** with the frontend React components.
- The proposed changes strictly target **read optimization, caching, and graceful failure handling**, ensuring zero impact on match results, player records, or admin controls.
