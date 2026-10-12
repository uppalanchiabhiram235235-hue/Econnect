# ECONNECT – Community Clean-Up & Cause Coordinator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://econnect-au.netlify.app/)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://econnect-au.netlify.app/)
[![Database](https://img.shields.io/badge/Database-Aiven%20MySQL%208-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://econnect-au.netlify.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://econnect-au.netlify.app/)

> **Live Website:** [https://econnect-au.netlify.app/](https://econnect-au.netlify.app/)  
> **Backend Service:** Hosted on Render (Spring Boot 3.2 Java 17 REST API)  
> **Database:** Aiven Cloud MySQL 8

---

## 📖 Table of Contents
1. [Executive Overview](#-executive-overview)
2. [Why ECONNECT is Beneficial](#-why-econnect-is-beneficial)
3. [How the Entire Project Works](#-how-the-entire-project-works)
   - [System Architecture](#system-architecture)
   - [End-to-End Workflow](#end-to-end-workflow)
   - [Core Features & Modules](#core-features--modules)
4. [Monorepo Project Structure](#-monorepo-project-structure)
5. [Getting Started (Run Locally)](#-getting-started-run-locally)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Docker Compose](#docker-compose-setup)
6. [Deployment Architecture](#-deployment-architecture)
   - [Render (Backend Web Service)](#render-backend)
   - [Netlify (Frontend Web App)](#netlify-frontend)
   - [Aiven Cloud MySQL](#aiven-cloud-mysql)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Business Rules & Security](#-business-rules--security)

---

## 🌟 Executive Overview

**ECONNECT** is a full-stack, community-driven social and environmental coordination platform. It bridges the gap between passionate volunteers and grassroots civic organizers by centralizing cause discovery, real-time coordination, verified impact auditing, and gamified recognition.

Traditional volunteer recruitment often suffers from fragmented communication (spreadsheets, messaging groups, paper forms), vague reporting, and low volunteer retention. ECONNECT solves this by providing a unified digital workspace featuring:
* **Interactive Map & Distance Discovery:** Pinpoint causes on OpenStreetMap tiles with geolocation filtering.
* **Controlled Participation & Attendance:** Atomic registration with database locks and attendance verification.
* **Context-Driven Group Chat:** Dedicated, spam-protected in-event chat with pinned organizer announcements.
* **Audited Environmental Impact:** Proof-based impact logs (kg of waste cleaned, trees planted) with organizer verification.
* **Gamification & Verifiable Credentials:** Tiered leveling, milestone badges, public leaderboards, and verifiable digital certificates.

---

## 💡 Why ECONNECT is Beneficial

### 1. For Volunteers
* **Hyper-Local Discovery:** Use the interactive map and "Near Me" radius filters (5–50 km) to discover cleanup drives and social causes happening directly in their neighborhood.
* **Tangible Motivation & Gamification:** Gain 10 points for verified attendance and 20 points upon event completion. Level up across 6 volunteer tiers (from *Beginner* to *Community Hero*) and unlock merit badges.
* **Verifiable Digital Credentials:** Earn tamper-proof digital certificates of participation with unique certificate IDs, ideal for academic community service credits, resumes, and LinkedIn.
* **Safe, Focused Communication:** Directly communicate with event organizers and fellow volunteers in an isolated, secure event chat without having to share personal phone numbers.

### 2. For Organizers
* **Elimination of Administrative Overhead:** Replace messy spreadsheets and WhatsApp groups with a unified dashboard to publish events, track volunteer caps, and monitor live attendance.
* **Live Broadcasts & Anti-Spam Chat:** Pin critical announcements (gear instructions, meetup points) at the top of the event feed, with built-in rate-limiting and message moderation.
* **Verified Social Impact Reporting:** Review and audit participant claims (kg of trash collected, trees planted) before they count toward public event records, ensuring credibility for sponsors and donors.
* **Automated Data Insights:** Instant statistics on volunteer turnout rate, completed causes, and cumulative environmental impact metrics.

### 3. For Communities & the Environment
* **Data-Backed Environmental Action:** Aggregates real metrics—measuring hundreds of kilograms of removed plastic or trees planted rather than vague estimates.
* **Sustained Civic Engagement:** Automated gamification mechanisms convert one-time volunteers into lifelong community advocates.

---

## ⚙️ How the Entire Project Works

### System Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│               React 18 + Vite Frontend (Netlify)                  │
│       [https://econnect-au.netlify.app/]                         │
│                                                                   │
│  • React Router 6       • Leaflet + OpenStreetMap Map Discovery   │
│  • Lucide React Icons   • Responsive Dark/Light Design Tokens     │
│  • Polling Event Chat   • Verifiable Digital Certificate Engine   │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │  REST API / JSON / HTTP Basic Auth
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│           Spring Boot 3.2 Java 17 Backend (Render)                │
│                                                                   │
│  • Spring Web (REST)    • Spring Security (BCrypt + Basic Auth)   │
│  • Service Layer Rules  • JPA / Hibernate ORM Layer               │
│  • Haversine Distance   • Gamification & Milestone Evaluator      │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │  JDBC (SSL Required)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                Aiven Cloud MySQL 8 Managed Database               │
│                                                                   │
│  • Users & Roles        • Events & Geolocations (DECIMAL 9,6)     │
│  • Participations       • Chat Messages with Event Indexes        │
│  • Impact Logs          • User Badges & Leaderboard Aggregates    │
└───────────────────────────────────────────────────────────────────┘
```

### End-to-End Workflow

1. **Authentication & Roles:**  
   Users register as either a `VOLUNTEER` or an `ORGANIZER`. Passwords are encrypted using BCrypt. Authenticated requests use stateless HTTP Basic Authentication.
2. **Event Creation & Geolocation:**  
   Organizers create events specifying title, date, capacity, category (`CLEANUP`, `TREE_PLANTING`, `FOOD_DRIVE`, `EDUCATION`, `ANIMAL_WELFARE`, `OTHER`), and map coordinates. Coordinates are stored with `DECIMAL(9,6)` precision.
3. **Discovery & Radius Search:**  
   Volunteers explore events via a searchable list or an interactive Leaflet map. Using the browser's Geolocation API, the backend calculates spherical distances using the mathematical **Haversine formula** to return sorted events within the specified radius.
4. **Registration & Slot Locking:**  
   When a volunteer joins an event, the backend verifies capacity under transaction locks to prevent race conditions. Duplicate registrations are rejected.
5. **Real-Time Group Chat:**  
   Confirmed attendees and the organizer access a dedicated group chat. The frontend polls messages (`afterId`) every 4 seconds, pauses polling when the browser tab is hidden (Page Visibility API), and backs off during inactivity.
6. **Attendance & Point Allocation:**  
   During the event, the organizer marks volunteer attendance (`PRESENT` or `ABSENT`). Marking attendance awards **+10 points**.
7. **Event Completion & Bonus Points:**  
   When the event is marked `COMPLETED`, present volunteers receive **+20 bonus points** and automatic eligibility for certificates.
8. **Impact Logging & Verification:**  
   Volunteers submit impact metrics (e.g. 15 kg plastic collected). The entry remains `PENDING` until the organizer reviews and marks it `VERIFIED`. Only verified impact updates user stats and community dashboards.
9. **Gamification & Badges:**  
   The `GamificationService` checks for badge milestones (e.g., *First Step*, *Community Helper*, *Eco Warrior*) and adjusts volunteer rank levels accordingly.
10. **Digital Certificate Verification:**  
    Volunteers view and print high-resolution certificates. Each certificate includes a verification link and unique code verifiable publicly at `/certificates/verify`.

---

## 📁 Monorepo Project Structure

```
claudeEconnect/econnect/
├── backend/                       # Spring Boot 3.2 Java 17 Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/econnect/
│   │   │   │   ├── config/        # Security, Initializers, Constants
│   │   │   │   ├── controller/    # REST Controllers
│   │   │   │   ├── dto/           # Request & Response DTOs
│   │   │   │   ├── entity/        # JPA Entities (User, Event, Chat, etc.)
│   │   │   │   ├── exception/     # Global exception handler & error formats
│   │   │   │   ├── repository/    # Spring Data JPA Repositories
│   │   │   │   └── service/       # Business logic, Gamification, Chat
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                  # Integration tests (H2 in-memory DB)
│   ├── pom.xml                    # Maven build configuration
│   ├── Dockerfile                 # Multi-stage container build
│   └── .dockerignore
│
├── frontend/                      # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/            # Reusable UI (Buttons, Cards, Modals, Maps)
│   │   │   └── map/               # Leaflet maps (Discovery, Pickers, Static)
│   │   ├── context/               # AuthContext, ThemeContext
│   │   ├── hooks/                 # Custom React hooks (useApi, debounce)
│   │   ├── lib/                   # API client, route helpers, leafletSetup
│   │   ├── pages/                 # Full screens (Home, Discover, Chat, Dashboard)
│   │   └── styles/                # CSS design system (tokens, components)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── netlify.toml               # Netlify build & rewrite configuration
│
├── docker-compose.yml             # Orchestration for local containerized backend
├── .gitignore                     # Workspace ignore rules
└── README.md                      # Complete project documentation
```

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
* **Java 17+** (JDK 17 or higher)
* **Apache Maven 3.9+**
* **Node.js 18+** & **npm**
* **MySQL 8** (or Docker for database)

---

### Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Configure database credentials in `backend/src/main/resources/application.properties` or set environment variables:
   ```bash
   export DB_URL="jdbc:mysql://localhost:3306/econnect?createDatabaseIfNotExist=true"
   export DB_USERNAME="root"
   export DB_PASSWORD="yourpassword"
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
4. The REST API will start at: `http://localhost:8080`

To build and run tests:
```bash
mvn clean package
```

---

### Frontend Setup

1. Open another terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (configured to proxy `/api` calls to `http://localhost:8080`):
   ```bash
   npm run dev
   ```
4. Access the web application at: `http://localhost:5173`

---

### Docker Compose Setup

To run the containerized backend locally:
```bash
docker-compose up --build
```

---

## ☁️ Deployment Architecture

### Render (Backend)
* **Service Type:** Web Service (Docker or Native Java)
* **GitHub Repository:** Connected to `main` branch
* **Root Directory:** `backend` *(Crucial: must be set to `backend` in Render Dashboard -> Settings)*
* **Environment Variables:**
  * `PORT`: `8080` (managed by Render)
  * `DB_URL`: JDBC connection URL to cloud MySQL
  * `DB_USERNAME`: Database username
  * `DB_PASSWORD`: Database password
  * `ECONNECT_CORS_ALLOWED_ORIGINS`: `https://econnect-au.netlify.app,https://playful-mochi-dec0b3.netlify.app`

### Netlify (Frontend)
* **Live URL:** [https://econnect-au.netlify.app/](https://econnect-au.netlify.app/)
* **Base Directory:** `frontend`
* **Build Command:** `npm run build`
* **Publish Directory:** `dist`
* **Environment Variables:**
  * `VITE_API_BASE`: Public URL of your deployed Render backend (e.g. `https://<your-render-app>.onrender.com/api`)

### Aiven Cloud MySQL
* Hosted MySQL 8 database with SSL enforced (`sslMode=REQUIRED`).
* Automatically initializes and updates tables via Hibernate (`ddl-auto=update`).
* Default gamification badges seeded on first boot by `DataInitializer.java`.

---

## 📡 API Endpoints Reference

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register a new Volunteer or Organizer |
| | `POST` | `/api/auth/login` | Authenticate user and return profile details |
| **Users** | `GET` | `/api/users/{id}` | Get user profile |
| | `PUT` | `/api/users/{id}` | Update bio and avatar |
| | `GET` | `/api/users/{id}/statistics` | Get user impact and event stats |
| | `GET` | `/api/users/{id}/badges` | Get user earned badges |
| | `GET` | `/api/users/me/participations`| Get current user joined events |
| **Events** | `GET` | `/api/events` | Filter events by query, type, date, radius |
| | `GET` | `/api/events/map` | Lightweight coordinates pin payload |
| | `GET` | `/api/events/featured` | Get featured upcoming causes |
| | `GET` | `/api/events/mine` | Get events created by logged-in organizer |
| | `GET` | `/api/events/{id}` | Get complete event details |
| | `POST` | `/api/events` | Create new cause (Organizer only) |
| | `PUT` | `/api/events/{id}` | Update event details (Organizer only) |
| | `DELETE` | `/api/events/{id}` | Cancel/delete event (Organizer only) |
| **Participation**| `POST` | `/api/events/{id}/join` | Register for an upcoming event |
| | `DELETE` | `/api/events/{id}/leave`| Cancel registration |
| | `GET` | `/api/events/{id}/participants`| View attendee list |
| | `PUT` | `/api/participation/{id}/attendance`| Mark attendance `PRESENT`/`ABSENT` |
| **Chat** | `GET` | `/api/events/{id}/chat?afterId=`| Fetch chat messages and pinned posts |
| | `POST` | `/api/events/{id}/chat` | Post a new message or announcement |
| | `DELETE` | `/api/chat/{messageId}` | Soft delete a message |
| | `PUT` | `/api/chat/{messageId}/pin` | Pin/unpin announcement (Organizer only)|
| **Impact** | `POST` | `/api/events/{id}/impact`| Submit impact record for verification |
| | `GET` | `/api/events/{id}/impact` | View event impact metrics |
| | `PUT` | `/api/impact/{id}/verify`| Approve (`VERIFIED`) or reject impact |
| **Gamification**| `GET` | `/api/badges` | List all system badges |
| | `GET` | `/api/leaderboard` | View top volunteers (global/monthly) |
| | `GET` | `/api/certificates/{id}` | Generate digital participation certificate|
| | `GET` | `/api/certificates/verify/{code}`| Publicly verify certificate authenticity|
| **Statistics** | `GET` | `/api/stats/community` | Global platform metrics summary |
| | `GET` | `/api/organizers/{id}/statistics`| Organizer track record and verified reach |

---

## 🔒 Business Rules & Security

* **Stateless Authentication:** Passwords hashed with BCrypt; all protected endpoints use stateless HTTP Basic Authentication.
* **Role-Based Authorization:** Strict separation between `VOLUNTEER` and `ORGANIZER` roles enforced at the Spring Security filter and service layers.
* **Concurrency Protection:** Database row locking prevents over-subscription past the maximum attendee capacity.
* **Spam Prevention:** Chat endpoint enforces a rate limit of 10 messages per minute per user per event. Outsiders receive `403 Forbidden`.
* **Audit Trail:** Impact records require organizer verification before appearing in public totals or affecting leaderboards.
* **Standardized Errors:** Unified JSON error envelope:
  ```json
  {
    "timestamp": "2026-10-12T19:30:00Z",
    "status": 400,
    "error": "Bad Request",
    "message": "Event is already at full capacity",
    "fieldErrors": {}
  }
  ```

---

*Made with ❤️ for communities and a cleaner planet.*
