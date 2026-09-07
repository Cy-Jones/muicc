# MIUCC 2026 Champions Cup — Database Schema & Data Model

## Database Tables

1. **`admins`**: Single administrator credentials (`id`, `email`, `password_hash`).
2. **`tournament_settings`**: Global config (`name`, `full_name`, `host`, `start_date`, `end_date`, `status`, `max_predictions_per_match_day`).
3. **`participating_nations`**: 10 Nations (`Liberia`, `Eswatini`, `Tanzania`, `South Sudan`, `Zimbabwe`, `India`, `Mozambique`, `Nigeria`, `Uganda`, `Zambia`).
4. **`teams`**: Registered teams with reference code (`MIUCC-TEAM-XXXX`) and review status.
5. **`players`**: Student athletes linked to teams with player ID (`MIUCC-PLY-XXXX`).
6. **`player_cards`**: Verified player card records and QR verification URLs (`/player/MIUCC-PLY-XXXX`).
7. **`match_days`**: Match Days 1 to 6 with prediction status (`OPEN`, `FULL`, `CLOSED`, `NOT_OPEN`).
8. **`groups`**: Tournament groups (`Group A`, `Group B`).
9. **`matches`**: Fixtures, scores, stages (`GROUP`, `QUARTER_FINAL`, `SEMI_FINAL`, `THIRD_PLACE`, `FINAL`), and confirmation flag.
10. **`match_events`**: Live event log (`GOAL`, `ASSIST`, `YELLOW_CARD`, `RED_CARD`, `SUBSTITUTION`, `VAR`).
11. **`standings`**: Automatically calculated group standings (`played`, `won`, `drawn`, `lost`, `goals_for`, `goals_against`, `goal_difference`, `points`, `position`).
12. **`predictions`**: Public entries with reference code (`MIUCC-PRED-XXXX`) and email normalization.
13. **`audit_logs`**: Admin action history.
