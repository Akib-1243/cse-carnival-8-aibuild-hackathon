import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 3000,
});

// Seed data storage helpers for offline / standalone resilience
const SEED_DATA = {
    schedules: [
        { id: 'sch-001', course: 'CSE 4113', title: 'Pattern Recognition', day: 'Sunday', start_time: '13:00', end_time: '14:30', room: '7A04', instructor: 'Prof. Dr. Md. Shahriar Mahbub', section: 'B' },
        { id: 'sch-002', course: 'CSE 4137', title: 'Soft Computing', day: 'Monday', start_time: '10:00', end_time: '11:30', room: '7A03', instructor: 'Prof. Dr. Faisal Muhammad Shah', section: 'B' },
        { id: 'sch-003', course: 'IPE 4111', title: 'Industrial Management', day: 'Tuesday', start_time: '08:30', end_time: '10:00', room: '7A02', instructor: 'Mr. Md. Arif Hossain', section: 'B' },
        { id: 'sch-004', course: 'CSE 4114', title: 'Pattern Recognition Lab', day: 'Wednesday', start_time: '14:00', end_time: '16:30', room: '7B02', instructor: 'TBA', section: 'B1' },
        { id: 'sch-005', course: 'CSE 4138', title: 'Soft Computing Lab', day: 'Thursday', start_time: '11:30', end_time: '14:00', room: '7B06', instructor: 'TBA', section: 'B2' }
    ],
    rooms: [
        { id: 'room-001', room_number: '7A03', type: 'classroom', capacity: 45, equipment: ['projector', 'AC', 'whiteboard'], floor: 7, status: 'available', bookings: [] },
        { id: 'room-002', room_number: '7A04', type: 'classroom', capacity: 50, equipment: ['projector', 'whiteboard'], floor: 7, status: 'available', bookings: [] },
        { id: 'room-003', room_number: '7B02', type: 'lab', capacity: 30, equipment: ['computers', 'projector', 'AC'], floor: 7, status: 'available', bookings: [] },
        { id: 'room-004', room_number: '7C01', type: 'seminar', capacity: 70, equipment: ['projector', 'sound system', 'AC'], floor: 7, status: 'available', bookings: [] }
    ],
    events: [
        { id: 'evt-001', name: 'AI Build Hackathon Final Demo', description: 'Showcase of CampusOS solutions to faculty and judges.', date: '2026-09-05', start_time: '10:00', end_time: '16:00', end_date: '2026-09-05', venue: '7C01', organizer: 'CSE Society', capacity: 100, registered: 42, registrations: [], status: 'upcoming' },
        { id: 'evt-002', name: 'Intro to LLM Agents Workshop', description: 'Hands-on session building tool-calling agents.', date: '2026-09-08', start_time: '14:00', end_time: '16:00', end_date: '2026-09-08', venue: '7B02', organizer: 'AI Club', capacity: 30, registered: 28, registrations: [], status: 'upcoming' }
    ],
    announcements: [
        { id: 'ann-001', title: 'CSE 4113 Class Rescheduled — Sunday 7 Sep', body: 'The CSE 4113 (Pattern Recognition) class scheduled for Sunday at 1:00 PM has been moved to Room 7A04 at 3:30 PM. — Prof. Dr. Md. Shahriar Mahbub', date: '2026-09-04', priority: 'high', posted_by: 'Prof. Dr. Md. Shahriar Mahbub', expires: '2026-09-07' },
        { id: 'ann-002', title: 'CSE 4137 Midterm Syllabus', body: 'Soft Computing midterm covers: Fuzzy Logic (Ch 1-3), Neural Networks (Ch 4), and Genetic Algorithms (Ch 5). — Prof. Dr. Faisal Muhammad Shah', date: '2026-09-03', priority: 'high', posted_by: 'Prof. Dr. Faisal Muhammad Shah', expires: '2026-09-20' },
        { id: 'ann-003', title: 'IPE 4111 Instructor Update', body: 'Classes will now be conducted by Mr. Md. Arif Hossain. Schedule and room remain unchanged. — CSE Dept', date: '2026-09-02', priority: 'medium', posted_by: 'CSE Department', expires: '2026-09-10' }
    ],
    assignments: [
        { id: 'asgn-001', course: 'CSE 4113', course_title: 'Pattern Recognition', title: 'Assignment 1 — Bayes Classifier', description: 'Implement Bayesian classification on 2D synthetic dataset.', assigned_date: '2026-09-01', deadline: '2026-09-10', submission_platform: 'Google Classroom', status: 'pending', marks: 10 },
        { id: 'asgn-002', course: 'CSE 4137', course_title: 'Soft Computing', title: 'Lab Report 1 — Fuzzy Inference', description: 'Fuzzy logic controller simulation report.', assigned_date: '2026-09-02', deadline: '2026-09-08', submission_platform: 'Google Classroom', status: 'pending', marks: 15 }
    ]
};

const getLocal = (key) => {
    const data = localStorage.getItem(`campusos_${key}`);
    if (!data) {
        localStorage.setItem(`campusos_${key}`, JSON.stringify(SEED_DATA[key] || []));
        return SEED_DATA[key] || [];
    }
    try {
        return JSON.parse(data);
    } catch {
        return SEED_DATA[key] || [];
    }
};

const setLocal = (key, data) => {
    localStorage.setItem(`campusos_${key}`, JSON.stringify(data));
};

export const getRecords = async (endpoint) => {
    try {
        const res = await api.get(`/${endpoint}`);
        return res.data;
    } catch (err) {
        console.warn(`API unavailable for /${endpoint}, using local cache`, err.message);
        return getLocal(endpoint);
    }
};

export const addRecord = async (endpoint, data) => {
    try {
        const res = await api.post(`/${endpoint}`, data);
        return res.data;
    } catch {
        const items = getLocal(endpoint);
        const newItem = { id: `${endpoint.slice(0, 3)}-${Date.now()}`, ...data };
        const updated = [newItem, ...items];
        setLocal(endpoint, updated);
        return newItem;
    }
};

export const updateRecord = async (endpoint, id, data) => {
    try {
        const res = await api.put(`/${endpoint}/${id}`, data);
        return res.data;
    } catch {
        const items = getLocal(endpoint);
        const updated = items.map((item) => (item.id === id ? { ...item, ...data } : item));
        setLocal(endpoint, updated);
        return { id, ...data };
    }
};

export const deleteRecord = async (endpoint, id) => {
    try {
        const res = await api.delete(`/${endpoint}/${id}`);
        return res.data;
    } catch {
        const items = getLocal(endpoint);
        const updated = items.filter((item) => item.id !== id);
        setLocal(endpoint, updated);
        return { success: true };
    }
};

// --- Room specific actions ---
export const bookRoom = async (roomId, bookingData) => {
    try {
        const res = await api.post(`/rooms/${roomId}/book`, bookingData);
        return res.data;
    } catch {
        const rooms = getLocal('rooms');
        const newBooking = { booking_id: `bk-${Date.now()}`, ...bookingData };
        const updated = rooms.map((r) => {
            if (r.id === roomId) {
                return { ...r, bookings: [...(r.bookings || []), newBooking] };
            }
            return r;
        });
        setLocal('rooms', updated);
        return newBooking;
    }
};

export const cancelRoomBooking = async (roomId, bookingId) => {
    try {
        const res = await api.delete(`/rooms/${roomId}/book/${bookingId}`);
        return res.data;
    } catch {
        const rooms = getLocal('rooms');
        const updated = rooms.map((r) => {
            if (r.id === roomId) {
                return {
                    ...r,
                    bookings: (r.bookings || []).filter((b) => b.booking_id !== bookingId),
                };
            }
            return r;
        });
        setLocal('rooms', updated);
        return { success: true };
    }
};

// --- Event specific actions ---
export const registerForEvent = async (eventId, userData) => {
    try {
        const res = await api.post(`/events/${eventId}/register`, userData);
        return res.data;
    } catch {
        const events = getLocal('events');
        const newReg = {
            student_id: userData.student_id || '20-40532',
            name: userData.name || 'Student',
        };
        const updated = events.map((ev) => {
            if (ev.id === eventId) {
                const regs = ev.registrations || [];
                return {
                    ...ev,
                    registered: (ev.registered || 0) + 1,
                    registrations: [...regs, newReg],
                };
            }
            return ev;
        });
        setLocal('events', updated);
        return newReg;
    }
};

export const cancelEventRegistration = async (eventId, registrationId) => {
    try {
        const res = await api.delete(`/events/${eventId}/register/${registrationId}`);
        return res.data;
    } catch {
        const events = getLocal('events');
        const updated = events.map((ev) => {
            if (ev.id === eventId) {
                const regs = (ev.registrations || []).filter((r) => r.student_id !== registrationId);
                return {
                    ...ev,
                    registered: Math.max(0, (ev.registered || 1) - 1),
                    registrations: regs,
                };
            }
            return ev;
        });
        setLocal('events', updated);
        return { success: true };
    }
};

// --- Agent chat with smart campus responder ---
export const sendChatMessage = async (message, history = []) => {
    try {
        return await api.post('/agent/chat', { message, history });
    } catch {
        const lower = message.toLowerCase();
        const announcements = getLocal('announcements');
        const schedules = getLocal('schedules');
        const assignments = getLocal('assignments');
        const rooms = getLocal('rooms');

        let reply = "I'm your CampusOS Assistant. I can check your schedules, book rooms, check assignments, and find notices.";

        if (lower.includes('next class') || lower.includes('class') || lower.includes('schedule')) {
            const sch = schedules[0];
            reply = `Your next class is ${sch.course} (${sch.title}) on ${sch.day} from ${sch.start_time} to ${sch.end_time} in Room ${sch.room} with ${sch.instructor}.`;
        } else if (lower.includes('due') || lower.includes('assignment') || lower.includes('deadline')) {
            const pending = assignments.filter((a) => a.status === 'pending');
            if (pending.length > 0) {
                reply = `You have ${pending.length} pending assignment(s):\n` +
                    pending.map((a) => `• ${a.course}: ${a.title} (Due: ${a.deadline} on ${a.submission_platform})`).join('\n');
            } else {
                reply = "You have no pending assignments right now!";
            }
        } else if (lower.includes('announcement') || lower.includes('notice') || lower.includes('cancelled') || lower.includes('moved')) {
            const top = announcements[0];
            reply = `Latest Notice: "${top.title}"\n${top.body} (Posted: ${top.date})`;
        } else if (lower.includes('book room') || lower.includes('available room') || lower.includes('room')) {
            const avail = rooms.filter((r) => r.status === 'available');
            reply = `We have ${avail.length} available rooms. For example, Room ${avail[0]?.room_number} (Capacity: ${avail[0]?.capacity}, Equipment: ${avail[0]?.equipment.join(', ')}). You can book it directly from the Rooms tab!`;
        }

        return { data: { reply } };
    }
};

export default api;