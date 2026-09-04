# Target Project Structure

The following is the recommended structure after implementation. It keeps the frontend, backend, agent tools, data, and tests separate without creating unnecessary layers.

```text
cse-carnival-8-aibuild-hackathon/
|
|-- README.md                         # Project overview and run instructions
|-- PROBLEM_STATEMENT.md              # Original challenge requirements
|-- SUBMISSION.md                     # Submission rules
|-- .env.example                      # Variable names only, no secrets
|-- .gitignore
|-- package.json                      # Scripts and dependencies
|-- package-lock.json
|-- tsconfig.json
|-- vite.config.ts                    # Or the selected framework config
|
|-- data/                             # Seed input; never used as live storage
|   |-- schedules.json
|   |-- rooms.json
|   |-- events.json
|   |-- announcements.json
|   `-- assignments.json
|
|-- schema/
|   `-- schema.md                     # Required field names and constraints
|
|-- sample_queries/
|   `-- sample_queries.md             # Judge queries
|
|-- workflow/                         # Team build and verification docs
|   |-- README.md
|   |-- PROJECT_STRUCTURE.md
|   |-- TEAM_WORKFLOW.md
|   |-- AI_BUILD_PROMPT.md
|   `-- ACCEPTANCE_TESTS.md
|
|-- backend/                          # Persistent API and domain rules
|   |-- index.js                      # Start the API server
|   |-- package.json                   # Backend scripts and dependencies
|   |-- db/
|   |   |-- client.ts                 # Database connection
|   |   |-- seed.ts                   # Import data once
|   |   `-- migrations/               # Database migrations if needed
|   |-- routes/
|   |   |-- schedules.ts
|   |   |-- rooms.ts                  # Includes booking/cancellation
|   |   |-- events.ts                 # Includes registration/cancellation
|   |   |-- announcements.ts
|   |   `-- assignments.ts
|   |-- services/
|   |   |-- schedule-service.ts
|   |   |-- room-service.ts            # Overlap and availability rules
|   |   |-- event-service.ts           # Capacity and duplicate rules
|   |   |-- announcement-service.ts
|   |   `-- assignment-service.ts
|   |-- validation/
|   |   `-- schemas.ts                # Request and response validation
|   `-- errors.ts
|
|-- agent/                            # LLM integration and tools
|   |-- agent.ts                       # Conversation and tool-calling loop
|   |-- system-prompt.ts               # Agent behavior and safety rules
|   |-- tools/
|   |   |-- schedule-tools.ts
|   |   |-- room-tools.ts
|   |   |-- event-tools.ts
|   |   |-- announcement-tools.ts
|   |   `-- assignment-tools.ts
|   `-- tool-registry.ts               # Exposes tools to the LLM
|
|-- frontend/                         # Dashboard and chat UI
|   |-- src/main.jsx
|   |-- src/App.jsx
|   |-- src/api/client.js              # Calls server API only
|   |-- components/
|   |   |-- Layout.tsx
|   |   |-- ChatPanel.tsx
|   |   |-- DataTable.tsx
|   |   |-- RecordForm.tsx
|   |   |-- ConfirmDialog.tsx
|   |   `-- StatusMessage.tsx
|   |-- features/
|   |   |-- schedules/
|   |   |-- rooms/
|   |   |-- events/
|   |   |-- announcements/
|   |   `-- assignments/
|   |-- styles/
|   |   `-- app.css
|   `-- src/index.css
|
|-- tests/
|   |-- api/                          # CRUD and domain-rule tests
|   |-- agent/                        # Tool and response tests
|   |-- integration/                  # Dashboard/backend/agent tests
|   `-- fixtures/
|       `-- test-data.ts
```

## Request Flow

```text
User
  |
  +--> Dashboard --> API route --> service --> database
  |                                      ^
  +--> Chat UI --> agent --> tool ------+
```

The agent must call backend services or API endpoints at request time. It must not import JSON seed files, keep a stale in-memory copy, or answer from hardcoded examples.

## Recommended API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/schedules` | List or create classes |
| PATCH/DELETE | `/api/schedules/:id` | Edit or remove a class |
| GET/POST | `/api/rooms` | List or create rooms |
| PATCH/DELETE | `/api/rooms/:id` | Edit or remove a room |
| POST | `/api/rooms/:id/bookings` | Book a room after availability validation |
| DELETE | `/api/rooms/:id/bookings/:bookingId` | Cancel a booking |
| GET/POST | `/api/events` | List or create events |
| PATCH/DELETE | `/api/events/:id` | Edit or remove an event |
| POST | `/api/events/:id/registrations` | Register a student |
| DELETE | `/api/events/:id/registrations/:studentId` | Cancel registration |
| GET/POST | `/api/announcements` | List or create announcements |
| PATCH/DELETE | `/api/announcements/:id` | Edit or remove an announcement |
| GET/POST | `/api/assignments` | List or create assignments |
| PATCH/DELETE | `/api/assignments/:id` | Edit or remove an assignment |
| POST | `/api/agent/chat` | Send a message to the AI agent |

Use the exact field names from [schema/schema.md](../schema/schema.md). Keep date values as `YYYY-MM-DD` and times as `HH:MM`.
