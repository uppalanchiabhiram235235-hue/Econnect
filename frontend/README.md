# ECONNECT frontend (Phase 2 – app shell)

React 18 + Vite, hand-written CSS, React Router, lucide-react icons.

```
npm install
npm run dev        # http://localhost:5173  (proxies /api -> http://localhost:8080)
npm run build
```
Start the Spring Boot backend first (`mvn spring-boot:run` in the project root).
To call a backend on another host, set `VITE_API_BASE` (e.g. `VITE_API_BASE=https://api.example.com/api`).

## What is in Phase 2
- `styles/` – design tokens (light + dark, 8px spacing, type scale, event-type hues), global and component CSS.
- `lib/api.js` – fetch wrapper: JSON, HTTP Basic header, `ApiError` with `fieldErrors`, auto-logout on 401.
- `context/` – `ThemeContext` (system / light / dark, saved), `AuthContext` (login, register, logout, session kept in localStorage).
- `components/` – Button, Card, Badge, ProgressBar, Skeleton, EmptyState, Modal + ConfirmDialog (native `<dialog>`), Toast, Field + PasswordInput, Layout (header, role-based nav, mobile bottom bar), ProtectedRoute.
- `pages/` – working Login and Register (inline + server field errors), shell Home, `/styleguide` (visual check of every component), placeholders for later screens.
- Route guards: volunteer routes, organizer routes, signed-in routes.

## Notes
- The Basic-auth token is kept in localStorage so the session survives a refresh. Acceptable for a student project; JWT with short expiry would be the production choice.
- Event cards, dashboards, forms for events and impact arrive in Phases 3–5.
