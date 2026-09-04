# Three-Member Team Workflow

## Ownership

### Member 1 - Backend and persistence

Owns the database, seed import, API routes, validation, and business rules.

Deliverables:

- Persistent database initialized from all five seed files.
- CRUD for schedules, rooms, events, announcements, and assignments.
- Room booking/cancellation with overlap checks.
- Event registration/cancellation with capacity and duplicate checks.
- Stable JSON API responses and useful error messages.

### Member 2 - AI agent

Owns the LLM integration, tool definitions, agent prompt, and action safety.

Deliverables:

- Read tools for all five systems.
- `find_available_rooms`, `book_room`, and `cancel_room_booking`.
- `register_for_event` and `cancel_event_registration`.
- Tool calls that query current backend state on every request.
- Clarifying questions for missing date/time/identity/purpose.
- Refusal of unsupported or unauthorized actions.

### Member 3 - frontend and integration

Owns the dashboard, chat experience, UX states, and final demo.

Deliverables:

- Visible sections for all five systems.
- Add, edit, and delete UI for every system.
- Room booking and event registration controls.
- Chat interface connected to `/api/agent/chat`.
- Loading, validation, success, empty, and error states.
- Responsive layout and final README walkthrough.

## Build Order

### Stage 1: Contract and vertical slice

1. Agree on framework, database, LLM provider, and environment variables.
2. Member 1 defines API request/response examples.
3. Member 3 creates the app shell and navigation.
4. Member 2 registers one read tool and one action tool.
5. Complete this vertical slice: list rooms -> find an available room -> book it -> show the booking in the dashboard.

### Stage 2: Expand coverage

1. Add all database models and seed loading.
2. Complete all CRUD endpoints.
3. Complete schedule, assignment, announcement, room, and event read tools.
4. Add all room and event action tools.
5. Connect every dashboard form to the real API.
6. Add validation and error handling.

### Stage 3: Judge-focused hardening

1. Test current-data behavior after dashboard edits.
2. Test booking overlap, full events, duplicate registrations, and unavailable rooms.
3. Test relative dates using the system date rather than hardcoded dates.
4. Test unclear requests and confirmation behavior.
5. Test clean startup from a fresh clone.
6. Update README and record a short demo script.

## Handoffs

- Backend publishes the API contract before frontend and agent integration.
- Frontend and agent use the API, never direct database access.
- Any schema or endpoint change must be announced before merging.
- Each member merges small, working commits into `main`; avoid one final large merge.
- Before merging, run the narrow tests for the files changed.

## Suggested Daily Checkpoint

Each member reports:

- What is working now.
- What API or field they depend on.
- What they will finish next.
- Any blocker that could affect another member.

## Demo Sequence

1. Open the dashboard and show all five data sections.
2. Edit a high-priority announcement.
3. Ask the agent about the edited announcement and show the latest answer.
4. Search for a projector room for five people at a requested time.
5. Book an available room and show the new booking in the dashboard.
6. Attempt a conflicting booking and show the rejection.
7. Register for the Guest Lecture and attempt registration for the full Git workshop.
8. Show the README setup instructions and environment variable list.
