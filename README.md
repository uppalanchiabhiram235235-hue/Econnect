# ECONNECT – Community Clean-Up & Cause Coordinator (Spring Boot backend)

Maven project generated from the ECONNECT abstract.
Stack: Java 17 · Spring Boot 3.2 · Maven · Spring Web · Spring Data JPA / Hibernate · Bean Validation · Spring Security (BCrypt) · MySQL.

Architecture: `React → REST controller → service layer → JPA repository → MySQL`

## Project Structure
- `backend/` – Spring Boot 3.2 backend (Maven, Java 17, JPA, MySQL)
- `frontend/` – React 18 + Vite frontend (Netlify deployment)

## Run
### Backend:
1. Install JDK 17+ and Maven 3.9+. (IDE: enable Lombok annotation processing.)
2. Start MySQL. Defaults: `root` / `root` on `localhost:3306`; the `econnect` database is created automatically.
   Override with env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
3. `cd backend && mvn spring-boot:run`  → API on http://localhost:8080
4. `cd backend && mvn clean package`    → runs tests (H2 in-memory) and builds `backend/target/econnect-1.0.0.jar`

### Frontend:
1. `cd frontend && npm install`
2. `npm run dev`                        → Web app on http://localhost:5173

Tables are created by Hibernate (`ddl-auto=update`); the six badges are seeded on first start.

## Authentication
`POST /api/auth/register` and `POST /api/auth/login` return the user profile.
Passwords are BCrypt-hashed. All other protected calls send the same email/password as
**HTTP Basic** (`Authorization: Basic base64(email:password)`) — stateless, role-based (`VOLUNTEER`, `ORGANIZER`).
CORS allows `http://localhost:3000` and `:5173` (edit `econnect.cors.allowed-origins`).

## Endpoints
| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Users | `GET/PUT /api/users/{id}`, `GET /api/users/{id}/statistics`, `GET /api/users/{id}/badges`, `GET /api/users/me/participations` |
| Events | `GET /api/events?q=&type=&location=&date=&status=&lat=&lng=&radiusKm=`, `GET /api/events/map`, `GET /api/events/featured`, `GET /api/events/mine`, `GET /api/events/{id}`, `POST /api/events`, `PUT /api/events/{id}`, `DELETE /api/events/{id}`, `GET /api/events/{id}/statistics` |
| Participation | `POST /api/events/{id}/join`, `DELETE /api/events/{id}/leave`, `GET /api/events/{id}/participants`, `PUT /api/participation/{id}/attendance` |
| Chat | `GET /api/events/{id}/chat?afterId={lastId}`, `POST /api/events/{id}/chat`, `DELETE /api/chat/{messageId}`, `PUT /api/chat/{messageId}/pin` |
| Impact | `POST /api/events/{id}/impact`, `GET /api/events/{id}/impact`, `PUT /api/impact/{id}/verify` |
| Stats / badges | `GET /api/stats/community`, `GET /api/organizers/{id}/statistics`, `GET /api/badges` |

## Business rules (all in the Java service layer)
- Duplicate email rejected; one `event_participants` row per (event, user) (also a DB unique constraint).
- Join: volunteer only, event must be `UPCOMING`, rejected when full (event row is locked while counting active registrations). Leaving sets participation to `CANCELLED`; rejoining reuses the row.
- Attendance (`PRESENT`/`ABSENT`) by the owning organizer only. `PRESENT` → **+10** points (once). When the event becomes `COMPLETED`, PRESENT volunteers become `COMPLETED` → **+20** points (once).
- Levels from total points: Beginner 0 · Active Volunteer 30 · Community Helper 90 · Green Champion 150 · Eco Warrior 240 · Community Hero 360 (edit `VolunteerLevel`).
- Badges (stored in `user_badges`): First Step (1 completed) · Community Helper (3) · Green Champion (2 environmental events) · Eco Warrior (50 verified kg/trees) · Cause Leader (5) · Community Hero (10 completed + 300 pts). Edit `GamificationService`.
- Impact is `PENDING` when recorded; the event owner marks it `VERIFIED`/`REJECTED`. Only `VERIFIED` rows reach public event pages, dashboards, profile totals and badges.
- Delete policy: events with registrations/impact are marked `CANCELLED`; empty events are deleted.
- Chat: `chat_messages` table indexed on `(event_id, id)`. `canAccessChat(event, user)` restricts access to the organizer and REGISTERED/COMPLETED volunteers (403 for outsiders). Cancelled events are read-only. Organizer only can pin announcements and delete any message; senders can soft delete their own messages. Rate limit: max 10 messages/minute per event per user.
- Location & Map Discovery: `latitude` and `longitude` are DECIMAL(9,6) (-90..90, -180..180). Both or neither must be provided. `GET /api/events` supports distance filtering (`lat`, `lng`, `radiusKm` max 200) using the Haversine formula, returning results sorted by ascending distance with `distanceKm`. `GET /api/events/map` provides a lightweight pin payload for upcoming geolocated events.
- All dashboard numbers are queried from the database — nothing hardcoded.

## Architecture Notes
### Feature 1 - Event Group Chat & Announcements
- **Backend**: `ChatMessage` entity with table `chat_messages` indexed on `(event_id, id)`. Access controlled in `ChatService.canAccessChat(event, user)` which enforces that only the event organizer and registered/completed volunteers can view and post messages. Anti-spam counts user messages in the last 60 seconds (`countByEventIdAndSenderIdAndCreatedAtAfter`).
- **Endpoints**: `GET /api/events/{id}/chat?afterId={lastId}` (returns messages > afterId ordered oldest-first, plus pinned announcements on initial load), `POST /api/events/{id}/chat`, `DELETE /api/chat/{messageId}` (soft delete: sets `deleted=true` and `content="Message removed"`), `PUT /api/chat/{messageId}/pin` (organizer pin toggle).
- **Frontend**: `EventChat.jsx` integrated inside `EventDetail.jsx` (under the "Group Chat" tab and directly at `/events/:id/chat`), and accessible from "Chat" buttons on `JoinedEvents.jsx` (`/my-events`). Automatically polls with `afterId` every 4s, pauses when the browser tab is hidden using the Page Visibility API, and backs off to 10s after 2 minutes of inactivity. Features message bubbles, optimistic delivery with error rollback, auto-scroll with "New messages" jump pill, collapsible pinned announcements banner, and accessibility tags (`role="log"`, `aria-live="polite"`).

### Feature 2 - Map-Based Event Discovery (Leaflet + OpenStreetMap)
- **Backend**: Added `latitude` and `longitude` (DECIMAL(9,6)) to `Event`. Added validation and coordinate pair constraint ("both or neither") in `EventService`. Implemented Haversine formula in `EventService.haversineKm` to calculate spherical distance cleanly across both MySQL and H2 databases. Added `GET /api/events/map` public endpoint returning `EventMapPinResponse` (`id`, `title`, `eventType`, `latitude`, `longitude`, `eventDate`, `status`, `remainingSlots`) and distance filtering (`lat, lng, radiusKm` capped at 200 km) on `GET /api/events`.
- **Frontend**: Integrated `leaflet` and `react-leaflet@^4.2.1` using lazy-loading (`React.lazy`) with `Suspense` fallback. Built `EventsMap.jsx` with OpenStreetMap tiles, custom SVG color-coded pins matching event category themes, auto-bounds fitting, interactive popups, and empty state overlays. Added a List / Map toggle on `EventsDiscover.jsx` preserving filter state, alongside a "Near Me" geolocation search with 5 / 10 / 25 / 50 km radius selector. Added `LocationPickerMap.jsx` to `EventForm.jsx` (click/drag marker or use browser geolocation) and embedded `EventStaticMap.jsx` on `EventDetail.jsx` with an OpenStreetMap directions link.

## Manual Demo Scripts
### Demo Script 1: Feature 1 (Group Chat & Announcements)
1. **Log in as an Organizer**: Register or log in with an `ORGANIZER` account (e.g. `org@test.com` / `secret123`). Create a new upcoming event or locate an existing one.
2. **Access Group Chat**: Click "View Details" on the event, then click the **Group Chat** tab (or navigate to `/events/{id}/chat`). Post a message as the organizer with the **"Post as Pinned Announcement"** checkbox checked. Verify the message appears in both the chat feed and the collapsible pinned banner at the top.
3. **Register and Join as Volunteer**: In an incognito window, log in as a `VOLUNTEER` account. Before joining, visit `/events/{id}/chat` and verify the friendly locked state explaining that the user must join the event. Click **Join Event Now**.
4. **Chat Interaction & Polling**: As the volunteer, post a message. Switch to the organizer window and watch the volunteer's message appear within 4 seconds via automatic polling without page refresh. Post a reply from the organizer.
5. **Pin & Delete Controls**: Notice the organizer can toggle the Pin icon on any message and delete messages (which replaces the text with "Message removed"). Notice the volunteer can delete their own message but cannot pin or delete organizer messages.

### Demo Script 2: Feature 2 (Map-Based Event Discovery)
1. **Create Geolocated Event**: Log in as an Organizer and navigate to `/organizer/events/new` ("Create Event"). Fill in event details and scroll to the location map. Click on the map or click "Use my current location" to place the pin (e.g., in your city), then click "Create Event".
2. **Discover on Map**: Navigate to **Discover Events** (`/events`). Notice the **List / Map** segmented control toggle at the top right of the search area. Click **Map**.
3. **Explore Map Pins & Popups**: Verify the interactive Leaflet map renders with OpenStreetMap tiles and automatically fits bounds to visible events. Observe color-coded pins categorized by event type. Click on an event pin to view the popup showing title, date, available slots, and a "View details" button.
4. **Test "Near Me" Geolocation & Radius Filter**: Click the **Near me** button. Accept the browser location prompt or pick a radius (e.g. 25 km). Observe the event list and map refresh with distance calculations, displaying badges like "12.4 km away" on the event cards sorted by closest distance.
5. **Check Event Detail Mini-Map**: Click on a geolocated event to open its detail page (`/events/:id`). In the sidebar, verify the mini interactive map displays the event pin with coordinates and includes a direct **"Get directions"** link opening OpenStreetMap directions.

## Error format
`{ timestamp, status, error, message, fieldErrors }` — 400 validation, 401 bad credentials, 403 forbidden, 404 not found, 409 business-rule conflict.

## Layout
`controller · service · repository · entity · dto · exception · config` under `com.econnect`.


