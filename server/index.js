import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(rootDir, process.env.DATABASE_PATH)
  : path.join(__dirname, 'campusos.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    entity TEXT NOT NULL,
    id TEXT NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (entity, id)
  );
`);

const entities = ['schedules', 'rooms', 'events', 'announcements', 'assignments'];
const seedFiles = Object.fromEntries(entities.map((entity) => [entity, path.join(dataDir, `${entity}.json`)]));

function seedDatabase() {
  const insert = db.prepare('INSERT OR IGNORE INTO records (entity, id, payload) VALUES (?, ?, ?)');
  const seed = db.transaction(() => {
    for (const entity of entities) {
      const records = JSON.parse(fs.readFileSync(seedFiles[entity], 'utf8'));
      for (const record of records) insert.run(entity, record.id, JSON.stringify(record));
    }
  });
  seed();
}
seedDatabase();

const app = express();
const port = Number(process.env.PORT || 5000);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const sendError = (res, status, message) => res.status(status).json({ error: message });
const readRecords = (entity) => db.prepare('SELECT payload FROM records WHERE entity = ?').all(entity).map(({ payload }) => JSON.parse(payload));
const readRecord = (entity, id) => {
  const row = db.prepare('SELECT payload FROM records WHERE entity = ? AND id = ?').get(entity, id);
  return row ? JSON.parse(row.payload) : null;
};
const writeRecord = (entity, record) => {
  db.prepare('INSERT OR REPLACE INTO records (entity, id, payload) VALUES (?, ?, ?)').run(entity, record.id, JSON.stringify(record));
  return record;
};
const removeRecord = (entity, id) => db.prepare('DELETE FROM records WHERE entity = ? AND id = ?').run(entity, id).changes > 0;
const newId = (entity) => `${entity.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const validTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const overlaps = (leftStart, leftEnd, rightStart, rightEnd) => leftStart < rightEnd && rightStart < leftEnd;

app.get('/api/health', (_req, res) => res.json({ ok: true, database: dbPath }));

for (const entity of entities) {
  app.get(`/api/${entity}`, (_req, res) => res.json(readRecords(entity)));
  app.post(`/api/${entity}`, (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return sendError(res, 400, 'A JSON object is required');
    const record = { ...req.body, id: req.body.id || newId(entity) };
    if (entity === 'rooms') record.bookings = Array.isArray(record.bookings) ? record.bookings : [];
    if (entity === 'events') {
      record.registrations = Array.isArray(record.registrations) ? record.registrations : [];
      record.registered = Number(record.registered || record.registrations.length);
    }
    writeRecord(entity, record);
    res.status(201).json(record);
  });
  app.put(`/api/${entity}/:id`, (req, res) => {
    const current = readRecord(entity, req.params.id);
    if (!current) return sendError(res, 404, `${entity.slice(0, -1)} not found`);
    const record = { ...current, ...req.body, id: current.id };
    if (entity === 'rooms') record.bookings = current.bookings;
    if (entity === 'events') {
      record.registrations = current.registrations;
      record.registered = current.registered;
    }
    writeRecord(entity, record);
    res.json(record);
  });
  app.delete(`/api/${entity}/:id`, (req, res) => {
    if (!removeRecord(entity, req.params.id)) return sendError(res, 404, `${entity.slice(0, -1)} not found`);
    res.json({ success: true });
  });
}

app.post('/api/rooms/:id/book', (req, res) => {
  const room = readRecord('rooms', req.params.id);
  if (!room) return sendError(res, 404, 'Room not found');
  const { booked_by, date, start_time, end_time, purpose } = req.body || {};
  if (!booked_by || !date || !purpose || !validTime(start_time) || !validTime(end_time) || start_time >= end_time) {
    return sendError(res, 400, 'booked_by, date, purpose, and a valid time range are required');
  }
  if (room.status !== 'available') return sendError(res, 409, 'Room is unavailable');
  const conflict = (room.bookings || []).some((booking) => booking.date === date && overlaps(start_time, end_time, booking.start_time, booking.end_time));
  if (conflict) return sendError(res, 409, 'Room is already booked during that time');
  const booking = { booking_id: newId('booking'), booked_by, date, start_time, end_time, purpose };
  room.bookings = [...(room.bookings || []), booking];
  writeRecord('rooms', room);
  res.status(201).json(booking);
});

app.delete('/api/rooms/:id/book/:bookingId', (req, res) => {
  const room = readRecord('rooms', req.params.id);
  if (!room) return sendError(res, 404, 'Room not found');
  const bookings = (room.bookings || []).filter((booking) => booking.booking_id !== req.params.bookingId);
  if (bookings.length === (room.bookings || []).length) return sendError(res, 404, 'Booking not found');
  room.bookings = bookings;
  writeRecord('rooms', room);
  res.json({ success: true });
});

app.post('/api/events/:id/register', (req, res) => {
  const event = readRecord('events', req.params.id);
  if (!event) return sendError(res, 404, 'Event not found');
  const { student_id, name } = req.body || {};
  if (!student_id || !name) return sendError(res, 400, 'student_id and name are required');
  const registrations = event.registrations || [];
  if (event.status === 'cancelled' || event.status === 'completed') return sendError(res, 409, 'Event is not accepting registrations');
  if (registrations.some((registration) => registration.student_id === student_id)) return sendError(res, 409, 'Student is already registered');
  if (Number(event.registered || registrations.length) >= Number(event.capacity)) return sendError(res, 409, 'Event is full');
  const registration = { student_id, name };
  event.registrations = [...registrations, registration];
  event.registered = Number(event.registered || registrations.length) + 1;
  if (event.registered >= event.capacity) event.status = 'full';
  writeRecord('events', event);
  res.status(201).json(registration);
});

app.delete('/api/events/:id/register/:studentId', (req, res) => {
  const event = readRecord('events', req.params.id);
  if (!event) return sendError(res, 404, 'Event not found');
  const registrations = event.registrations || [];
  const next = registrations.filter((registration) => registration.student_id !== req.params.studentId);
  if (next.length === registrations.length) return sendError(res, 404, 'Registration not found');
  event.registrations = next;
  event.registered = Math.max(0, Number(event.registered || registrations.length) - 1);
  if (event.status === 'full') event.status = 'upcoming';
  writeRecord('events', event);
  res.json({ success: true });
});

app.post('/api/agent/chat', (req, res) => {
  const message = String(req.body?.message || '').toLowerCase();
  if (message.includes('announcement') || message.includes('notice')) {
    const announcements = readRecords('announcements').sort((a, b) => b.date.localeCompare(a.date));
    return res.json({ reply: announcements.length ? `Latest notice: ${announcements[0].title}\n${announcements[0].body}` : 'There are no announcements.' });
  }
  if (message.includes('assignment') || message.includes('due')) {
    const assignments = readRecords('assignments').filter((assignment) => assignment.status === 'pending');
    return res.json({ reply: assignments.length ? `You have ${assignments.length} pending assignment(s):\n${assignments.map((a) => `${a.course}: ${a.title} (due ${a.deadline})`).join('\n')}` : 'You have no pending assignments.' });
  }
  const schedules = readRecords('schedules').sort((a, b) => a.start_time.localeCompare(b.start_time));
  return res.json({ reply: schedules.length ? `The earliest class in the schedule is ${schedules[0].course} on ${schedules[0].day} at ${schedules[0].start_time} in Room ${schedules[0].room}.` : 'There are no scheduled classes.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  sendError(res, 500, 'Internal server error');
});

app.listen(port, () => console.log(`CampusOS API listening on http://localhost:${port}`));
