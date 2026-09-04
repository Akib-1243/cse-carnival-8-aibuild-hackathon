# Acceptance Tests

Run these before submitting. The current challenge date is `2026-09-04`; the application itself should use the runtime date rather than hardcoding this value.

## Dashboard and persistence

- [ ] All five systems are visible from the dashboard.
- [ ] Add a schedule, reload, and confirm it remains.
- [ ] Edit a room capacity, reload, and confirm the new value remains.
- [ ] Delete an announcement, reload, and confirm it remains deleted.
- [ ] Add, edit, and delete at least one record in each system.
- [ ] Forms show validation errors without losing existing data.

## Room rules

- [ ] `7A02` can be booked on `2026-09-05` from `15:00` to `17:00`.
- [ ] A booking that overlaps an existing booking is rejected.
- [ ] A booking for an unavailable room is rejected.
- [ ] A booking with an invalid time range is rejected.
- [ ] A cancelled booking is no longer returned as active availability.
- [ ] The new booking appears in the dashboard immediately.

## Event rules

- [ ] Registration increases the event's registered count and adds the student.
- [ ] Duplicate registration is rejected.
- [ ] Registration for `Workshop: Git & GitHub for Beginners` is rejected because it is full.
- [ ] Cancellation removes the registration and updates the count.
- [ ] Cancelled or completed events cannot accept new registrations.

## Agent questions

- [ ] “When is my next class?” returns a schedule-based answer.
- [ ] “What classes do I have on Wednesday?” returns Wednesday classes.
- [ ] “What assignments do I have due this week?” filters by deadline and current week.
- [ ] “Show me all high priority announcements.” filters by priority.
- [ ] “Which labs have a projector and can fit at least 30 people?” filters capacity and equipment.
- [ ] “I am free until 2 PM - is there anything on campus I could drop into?” combines schedule and events.
- [ ] “I need a room for 5 people with a projector, tomorrow between 2 and 4.” returns suitable available rooms.
- [ ] “Just book me any room tomorrow afternoon.” asks for missing details instead of booking.
- [ ] After a dashboard edit, the next agent request reflects the edit.

## Submission readiness

- [ ] A fresh clone installs with the README commands.
- [ ] The app starts without manual database setup.
- [ ] `.env.example` lists every required key.
- [ ] No real API keys or secrets are committed.
- [ ] The repository is public before the deadline.
- [ ] README documents the stack, database, setup, and agent usage.
