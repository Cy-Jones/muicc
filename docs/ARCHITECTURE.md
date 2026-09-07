# MIUCC 2026 Champions Cup — System Architecture

## Architecture Overview

The platform uses a decoupled, high-performance Full-Stack Web Architecture designed for zero-config local execution against a local libSQL file, and a managed Turso database in production.

```
+-------------------------------------------------------------+
|                      React 18 + Vite                        |
|   (Stitch UI Tailwind CSS, Montserrat/Inter, Lucide Icons)  |
+-------------------------------------------------------------+
                              |
                     RESTful JSON APIs
                              |
+-------------------------------------------------------------+
|                    Node.js + Express                        |
|  (TypeScript, JWT Auth Middleware, Zod Validation, Atomic)  |
+-------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          |                                       |
+-------------------+                   +-------------------+
|  libSQL (local)   |                   |   Turso (cloud)   |
| file:./local.db   |                   | libsql://...      |
| for development   |                   | for production    |
+-------------------+                   +-------------------+
```

## Security & Business Logic Guarantees
1. **Server-Side Enforcement**: Critical business rules (prediction 20-entry limit, duplicate email prevention, player ID generation, standings calculation, draw locking) are executed on the backend server within atomic transactions.
2. **Single Admin Access Control**: Admin routes are secured by JWT token verification (`authenticateAdmin`). Public users have read-only access to published content and submit access for team registration and predictions.
3. **Data Privacy**: Private athlete fields (Student ID, DOB, Emergency Contact, Private Documents) are strictly stripped out in public API response serializers.
