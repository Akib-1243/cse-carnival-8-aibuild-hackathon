import cors from 'cors';
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
const formatTime = (value) => {
  if (!validTime(value)) return value;
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
};
const formatTimeRange = (start, end) => `${formatTime(start)} to ${formatTime(end)}`;

const llmConfig = {
  url: process.env.LLM_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
  key: process.env.LLM_API_KEY,
  model: process.env.LLM_MODEL || 'qwen/qwen3.6-27b',
};

async function askConfiguredLLM(message, history, context) {
  if (!llmConfig.url || !llmConfig.key) return null;
  const response = await fetch(llmConfig.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llmConfig.key}` },
    body: JSON.stringify({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are CampusOS AI. Answer only from the supplied campus data. Use 12-hour time with AM/PM. Never claim an action succeeded unless the backend action result says so.',
        },
        ...history.filter((item) => ['user', 'assistant'].includes(item.role)).slice(-10),
        { role: 'user', content: `${message}\n\nLive campus data:\n${JSON.stringify(context)}` },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  });
  if (!response.ok) throw new Error(`LLM request failed with ${response.status}`);
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '';
  const withoutReasoning = content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
  return withoutReasoning || null;
}

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

app.post('/api/agent/chat', async (req, res) => {
  const rawMessage = String(req.body?.message || '').trim();
  const message = rawMessage.toLowerCase();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const requestedDay = message.includes('tomorrow') ? dayNames[tomorrow.getDay()] : message.includes('today') ? dayNames[now.getDay()] : null;
  const formatDate = (date) => date.toISOString().slice(0, 10);
  const parseTime = (value) => {
    const match = value.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minutes = Number(match[2] || 0);
    if (minutes > 59 || hour > 23) return null;
    if (match[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (match[3]?.toLowerCase() === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  const schedules = readRecords('schedules');
  const assignments = readRecords('assignments');

  const context = { schedules, assignments, rooms: readRecords('rooms'), announcements: readRecords('announcements') };
  const isAction = message.includes('create') && message.includes('announcement');
  const requiresDeterministicData = (message.includes('available') && message.includes('room')) || message.includes('before my next class');
  if (!isAction && !requiresDeterministicData) {
    try {
      const llmReply = await askConfiguredLLM(rawMessage, history, context);
      if (llmReply) return res.json({ reply: llmReply, source: 'llm' });
    } catch (error) {
      console.warn(`LLM unavailable, using local agent: ${error.message}`);
    }
  }

  if (message.includes('create') && message.includes('announcement')) {
    const announcementText = rawMessage.replace(/^.*?announcement\s*(about|that|for)?\s*/i, '').trim() || 'Campus announcement';
    const announcement = writeRecord('announcements', {
      id: newId('announcement'),
      title: announcementText.length > 80 ? `${announcementText.slice(0, 77)}...` : announcementText,
      body: announcementText,
      date: today,
      priority: 'medium',
      posted_by: 'CampusOS AI',
      expires: formatDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    });
    return res.status(201).json({ reply: `Announcement created: "${announcement.title}"`, action: 'create_announcement', record: announcement });
  }

  if (message.includes('available') && message.includes('room')) {
    const roomNumber = message.match(/room\s+([a-z0-9]+)/i)?.[1]?.toUpperCase();
    const requestedTime = parseTime(message);
    const rooms = readRecords('rooms');
    const available = rooms.filter((room) => {
      if (roomNumber && room.room_number.toUpperCase() !== roomNumber) return false;
      if (!requestedTime) return room.status === 'available';
      return room.status === 'available' && !(room.bookings || []).some((booking) => booking.date === (requestedDay ? formatDate(tomorrow) : today) && booking.start_time <= requestedTime && requestedTime < booking.end_time);
    });
    return res.json({ reply: available.length ? `Yes. ${available.map((room) => `Room ${room.room_number} is available`).join('; ')} at ${formatTime(requestedTime) || 'that time'}.` : 'No matching room is available at that time.' });
  }

  if (message.includes('which time') || message.includes('what time')) {
    const previousReply = history.slice().reverse().find((item) => item.role === 'assistant')?.content || '';
    const previousTime = previousReply.match(/\b(?:at|from)\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)?.[1];
    return res.json({ reply: previousTime ? `The room is available at ${previousTime}.` : 'Which class, room, or event would you like me to check?' });
  }

  if (message.includes('before my next class')) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = schedules.map((item) => {
      const dayOffset = (dayNames.indexOf(item.day) - now.getDay() + 7) % 7;
      const classMinutes = Number(item.start_time.slice(0, 2)) * 60 + Number(item.start_time.slice(3));
      return { item, dayOffset: dayOffset === 0 && classMinutes < currentMinutes ? 7 : dayOffset, classMinutes };
    }).sort((a, b) => a.dayOffset - b.dayOffset || a.classMinutes - b.classMinutes)[0];
    const nextClassDate = upcoming ? new Date(now) : null;
    if (nextClassDate) nextClassDate.setDate(now.getDate() + upcoming.dayOffset);
    const nextClassDateText = nextClassDate ? formatDate(nextClassDate) : '9999-12-31';
    const pending = assignments.filter((item) => item.status === 'pending' && item.deadline < nextClassDateText);
    return res.json({ reply: upcoming ? (pending.length ? `Yes. ${pending.map((item) => `${item.title} is due ${item.deadline}`).join('; ')} before your next class, ${upcoming.item.course} at ${formatTime(upcoming.item.start_time)} on ${upcoming.item.day}.` : `No pending assignment is due before your next class, ${upcoming.item.course} at ${formatTime(upcoming.item.start_time)} on ${upcoming.item.day}.`) : 'There are no scheduled classes to compare against.' });
  }

  if (message.includes('assignment') || message.includes('due') || message.includes('deadline')) {
    const pending = assignments.filter((assignment) => assignment.status === 'pending').sort((a, b) => a.deadline.localeCompare(b.deadline));
    return res.json({ reply: pending.length ? `You have ${pending.length} pending assignment(s):\n${pending.map((a) => `${a.course}: ${a.title} (due ${a.deadline})`).join('\n')}` : 'You have no pending assignments.' });
  }

  if (message.includes('announcement') || message.includes('notice')) {
    const announcements = readRecords('announcements').sort((a, b) => b.date.localeCompare(a.date));
    return res.json({ reply: announcements.length ? `Latest notice: ${announcements[0].title}\n${announcements[0].body}` : 'There are no announcements.' });
  }

  if (message.includes('schedule') || message.includes('class')) {
    const day = requestedDay || dayNames[now.getDay()];
    const daySchedule = schedules.filter((item) => item.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
    return res.json({ reply: daySchedule.length ? `${day} schedule:\n${daySchedule.map((item) => `${formatTimeRange(item.start_time, item.end_time)}: ${item.course} (${item.title}) in Room ${item.room}`).join('\n')}` : `You have no classes on ${day}.` });
  }

  return res.json({ reply: 'I can answer schedule, assignment, room availability, and announcement questions. I can also create an announcement when you ask.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  sendError(res, 500, 'Internal server error');
});

app.listen(port, () => console.log(`CampusOS API listening on http://localhost:${port}`));
