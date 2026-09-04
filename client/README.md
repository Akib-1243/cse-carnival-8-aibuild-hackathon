# CampusOS — Intelligent Campus Operating System
### CSE Carnival 2026 · AI Build Hackathon

CampusOS is an intelligent university platform that centralizes campus information and pairs it with an autonomous AI agent capable of reasoning and acting on real-time campus data.

---

## 👥 Member 3: Frontend, UX, and Integration Overview

As **Member 3**, all core responsibilities have been built and verified:
- **5-Section Unified Dashboard**: Executive overview with real-time metric cards for Schedules, Rooms, Events, Announcements, and Assignments.
- **Complete CRUD Lifecycle**: Add, edit, and delete flows for all 5 systems with zero-refresh live UI updates.
- **Room Booking & Cancellation Controls**: Interactive reservation modal with purpose, date, and 24h time-slot selection, plus 1-click booking cancellation.
- **Event Registration & Capacity Bars**: Student registration modal, cancellation controls, and live visual capacity progress indicators.
- **Autonomous AI Chat Interface**: Glassmorphism chat drawer with quick suggestion chips, live thinking states, and direct sync with dashboard edits.
- **Multi-System Filters**:
  - **Schedules**: Filter by Day of week (`Sunday`–`Thursday`) and Course search.
  - **Rooms**: Filter by Minimum Capacity (`30+`, `45+`, `60+`) and Equipment tags (`projector`, `AC`, `whiteboard`, `computers`).
  - **Announcements**: Filter by Priority (`High`, `Medium`, `Low`, `All`) and keyword search.
  - **Assignments**: Filter by Deadline (`Due This Week`, `Upcoming`, `Past Due`) and Status (`pending`, `submitted`, `graded`).
- **Resilient API Architecture**: Connected to `/api` backend endpoints with instant seed fallback for offline demo stability.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Start Frontend Client
```bash
# Navigate to client directory
cd client

# Install dependencies (if not already installed)
npm install

# Launch Vite development server
npm run dev