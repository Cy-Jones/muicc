# MIUCC 2026 Champions Cup — Administrator Operating Guide

## Admin Login
- URL: `http://localhost:3000/admin/login`
- Default Email: `admin@miucc2026.org`
- Default Password: `AdminPassword2026!`

---

## Operating Workflows

### 1. Team Approval Workflow
1. Navigate to **Teams Roster** tab.
2. Review pending team registrations.
3. Click **Approve**. The team will be assigned to a group and initialized in the standings table.

### 2. Player Review & Card Generation
1. Navigate to **Player Approvals** tab.
2. Review player applications.
3. Click **Approve & Generate Card**.
4. The system assigns a unique Player ID (`MIUCC-PLY-XXXX`), generates the QR code, and publishes the athlete to the public directory.

### 3. Executing & Locking the Tournament Draw
1. Navigate to **Draw Generator** tab.
2. Choose **Random Draw** or **Seeded Draw**.
3. Inspect generated groups (Group A and Group B).
4. Click **Confirm & Lock Draw**.

### 4. Live Match Management & Result Confirmation
1. Navigate to **Matches & Live Center** tab.
2. Select an active match and click **Log Event** (Goals, Cards, Substitutions, POTM).
3. Once the match finishes, click **CONFIRM RESULT & UPDATE STANDINGS**.
4. The system locks the final score and automatically updates group points, goal difference, team stats, and player stats.

### 5. Managing Predictions
1. Navigate to **Predictions System** tab.
2. View submissions for each Match Day (`17 / 20 PREDICTIONS`).
3. Click **Export Predictions CSV** to download a spreadsheet report.
