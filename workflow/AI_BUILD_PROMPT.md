# Prompt for an AI Coding Agent

Copy the prompt below into your coding agent after opening the repository.

```text
You are the lead engineer building CampusOS in this repository.

Read these files before editing:
- PROBLEM_STATEMENT.md
- schema/schema.md
- sample_queries/sample_queries.md
- workflow/PROJECT_STRUCTURE.md
- workflow/TEAM_WORKFLOW.md

Build a complete, runnable application with:
1. A dashboard that displays schedules, rooms, events, announcements, and assignments.
2. Add, edit, and delete operations for every system.
3. Room booking and cancellation.
4. Event registration and cancellation.
5. An AI chat agent using real LLM tool/function calling.
6. A persistent backend database seeded from the JSON files in data/.

Technical rules:
- Use a simple maintainable full-stack TypeScript setup unless the repository already has a different stack.
- Use SQLite or another local persistent database that starts without external infrastructure.
- Load seed files only during first initialization. Do not use JSON files as live storage.
- The dashboard and agent must read and write the same database.
- The agent must query the backend on every request; do not cache or hardcode seed data.
- Keep the exact field names and enum values in schema/schema.md.
- Validate all incoming data and return actionable errors.
- Keep secrets in environment variables and create or update .env.example without real keys.
- Do not add unrelated dependencies or refactor unrelated files.

Agent tools to implement:
- get_schedule
- get_assignments
- get_announcements
- get_events
- find_available_rooms
- book_room
- cancel_room_booking
- register_for_event
- cancel_event_registration

Agent behavior:
- Resolve relative dates using the current date supplied by the server.
- For “When is my next class?”, use the current day/time and schedule data.
- For “due this week”, calculate the current university week correctly.
- Combine sources when needed, such as schedule plus events.
- Before booking, verify room status and detect overlapping bookings using interval logic.
- Before registering, verify event status, capacity, and duplicate registration.
- Ask for missing date, time, student identity, or purpose before changing data.
- Never invent records, availability, or successful actions.
- After an action, return the saved result from the backend.

Required validation scenarios:
- Edit an announcement in the dashboard, then ask the agent about it.
- Book Room 7A02 tomorrow from 15:00 to 17:00.
- Reject an overlapping room booking.
- Find a room for five people with a projector between 14:00 and 16:00.
- Register for the Guest Lecture: Deep Learning in Medical Imaging.
- Reject registration for the full Git & GitHub workshop.
- Ask “Just book me any room tomorrow afternoon” and request clarification.

Implementation process:
- First inspect the repository and state a short implementation plan.
- Build one working room-booking vertical slice before expanding.
- After each substantive edit, run the narrowest relevant test or typecheck.
- Add tests for persistence, CRUD, room overlap, event capacity, agent tools, and live-data behavior.
- Finish by updating README.md with exact install/start commands, tech stack, environment variables, and agent examples.
- Verify the app starts from a clean checkout using the documented commands.

Do not stop at scaffolding. Implement, test, and fix the complete working path.
```
