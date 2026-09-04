import cors from 'cors';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import express from 'express';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dbPath = process.env.DATABASE_PATH ? path.resolve(rootDir, process.env.DATABASE_PATH) : path.join(__dirname, 'campusos.sqlite');
const entities = ['schedules', 'rooms', 'events', 'announcements', 'assignments'];
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec('CREATE TABLE IF NOT EXISTS records (entity TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (entity, id))');
const seed = db.prepare('INSERT OR IGNORE INTO records (entity, id, payload) VALUES (?, ?, ?)');
for (const entity of entities) {
  const file = path.join(dataDir, `${entity}.json`);
  for (const record of JSON.parse(fs.readFileSync(file, 'utf8'))) seed.run(entity, record.id, JSON.stringify(record));
}

const app = express();
const port = Number(process.env.PORT || 5000);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
const sessions = new Set();
const adminId = process.env.ADMIN_ID || 'admin@campusos.demo';
const adminPassword = process.env.ADMIN_PASSWORD;
const error = (res, status, message) => res.status(status).json({ error: message });
const read = (entity) => db.prepare('SELECT payload FROM records WHERE entity = ?').all(entity).map((row) => JSON.parse(row.payload));
const one = (entity, id) => { const row = db.prepare('SELECT payload FROM records WHERE entity = ? AND id = ?').get(entity, id); return row ? JSON.parse(row.payload) : null; };
const write = (entity, record) => { db.prepare('INSERT OR REPLACE INTO records (entity, id, payload) VALUES (?, ?, ?)').run(entity, record.id, JSON.stringify(record)); return record; };
const id = (entity) => `${entity.slice(0, 4)}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const admin = (req, res, next) => { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token || !sessions.has(token)) return error(res, 401, 'Admin authentication required'); next(); };
const validTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const overlaps = (a, b, c, d) => a < d && c < b;
const formatTime = (value) => { if (!validTime(value)) return value; const [hour, minute] = value.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`; };

app.get('/api/health', (_req, res) => res.json({ ok: true, database: dbPath }));
app.post('/api/auth/admin/login', (req, res) => { if (!adminPassword) return error(res, 503, 'Admin login is not configured'); if (String(req.body?.adminId || '') !== adminId || String(req.body?.password || '') !== adminPassword) return error(res, 401, 'Invalid admin ID or password'); const token = crypto.randomBytes(32).toString('hex'); sessions.add(token); res.json({ token, role: 'admin', adminId }); });
app.post('/api/auth/admin/logout', admin, (req, res) => { sessions.delete(req.headers.authorization?.replace(/^Bearer\s+/i, '')); res.json({ success: true }); });

for (const entity of entities) {
  app.get(`/api/${entity}`, (_req, res) => res.json(read(entity)));
  app.post(`/api/${entity}`, admin, (req, res) => { if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return error(res, 400, 'A JSON object is required'); const record = { ...req.body, id: req.body.id || id(entity) }; if (entity === 'rooms') record.bookings = Array.isArray(record.bookings) ? record.bookings : []; if (entity === 'events') { record.registrations = Array.isArray(record.registrations) ? record.registrations : []; record.registered = Number(record.registered || record.registrations.length); } res.status(201).json(write(entity, record)); });
  app.put(`/api/${entity}/:id`, admin, (req, res) => { const current = one(entity, req.params.id); if (!current) return error(res, 404, 'Record not found'); res.json(write(entity, { ...current, ...req.body, id: current.id })); });
  app.delete(`/api/${entity}/:id`, admin, (req, res) => { if (!one(entity, req.params.id)) return error(res, 404, 'Record not found'); db.prepare('DELETE FROM records WHERE entity = ? AND id = ?').run(entity, req.params.id); res.json({ success: true }); });
}

app.post('/api/rooms/:id/book', admin, (req, res) => { const room = one('rooms', req.params.id); const { booked_by, date, start_time, end_time, purpose } = req.body || {}; if (!room) return error(res, 404, 'Room not found'); if (!booked_by || !date || !purpose || !validTime(start_time) || !validTime(end_time) || start_time >= end_time) return error(res, 400, 'A valid booking is required'); if ((room.bookings || []).some((b) => b.date === date && overlaps(start_time, end_time, b.start_time, b.end_time))) return error(res, 409, 'Room is already booked during that time'); const booking = { booking_id: id('booking'), booked_by, date, start_time, end_time, purpose }; write('rooms', { ...room, bookings: [...(room.bookings || []), booking] }); res.status(201).json(booking); });
app.delete('/api/rooms/:id/book/:bookingId', admin, (req, res) => { const room = one('rooms', req.params.id); if (!room) return error(res, 404, 'Room not found'); write('rooms', { ...room, bookings: (room.bookings || []).filter((booking) => booking.booking_id !== req.params.bookingId) }); res.json({ success: true }); });

app.post('/api/agent/chat', async (req, res) => { const message = String(req.body?.message || '').trim(); const lower = message.toLowerCase(); const rooms = read('rooms'); if (lower.includes('available') && lower.includes('room')) { const roomNumber = lower.match(/room\s+([a-z0-9]+)/i)?.[1]?.toUpperCase(); const match = rooms.find((room) => !roomNumber || room.room_number.toUpperCase() === roomNumber); return res.json({ reply: match ? `Yes. Room ${match.room_number} is available at ${formatTime(message.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i)?.[0]) || 'that time'}.` : 'No matching room is available.' }); } if (lower.includes('create') && lower.includes('announcement')) { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token || !sessions.has(token)) return error(res, 401, 'Admin authentication required to create announcements'); const text = message.replace(/^.*?announcement\s*(about|that|for)?\s*/i, '').trim() || 'Campus announcement'; const record = write('announcements', { id: id('announcement'), title: text, body: text, date: new Date().toISOString().slice(0, 10), priority: 'medium', posted_by: 'CampusOS AI' }); return res.status(201).json({ reply: `Announcement created: "${record.title}"`, record }); } const data = { schedules: read('schedules'), assignments: read('assignments'), rooms, announcements: read('announcements'), events: read('events') }; if (process.env.LLM_API_KEY && process.env.LLM_API_URL) { try { const response = await fetch(process.env.LLM_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY}` }, body: JSON.stringify({ model: process.env.LLM_MODEL, max_tokens: 500, temperature: 0.2, messages: [{ role: 'system', content: 'You are CampusOS AI. Answer only from the supplied data. Use 12-hour time.' }, ...(req.body.history || []).slice(-10), { role: 'user', content: `${message}\n${JSON.stringify(data)}` }] }) }); const result = await response.json(); const reply = String(result.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim(); if (response.ok && reply) return res.json({ reply, source: 'llm' }); } catch (requestError) { console.warn(`LLM unavailable: ${requestError.message}`); } } return res.json({ reply: 'I can help with schedules, assignments, room availability, events, and announcements.' }); });

app.post('/api/events/:id/register', admin, (req, res) => { const event = one('events', req.params.id); if (!event) return error(res, 404, 'Event not found'); const { student_id, name } = req.body || {}; if (!student_id || !name) return error(res, 400, 'student_id and name are required'); const registrations = event.registrations || []; if (registrations.some((item) => item.student_id === student_id)) return error(res, 409, 'Student is already registered'); const registration = { student_id, name }; write('events', { ...event, registrations: [...registrations, registration], registered: Number(event.registered || registrations.length) + 1 }); res.status(201).json(registration); });
app.delete('/api/events/:id/register/:studentId', admin, (req, res) => { const event = one('events', req.params.id); if (!event) return error(res, 404, 'Event not found'); write('events', { ...event, registrations: (event.registrations || []).filter((item) => item.student_id !== req.params.studentId), registered: Math.max(0, Number(event.registered || 0) - 1) }); res.json({ success: true }); });

app.listen(port, () => console.log(`CampusOS API listening on http://localhost:${port}`));
