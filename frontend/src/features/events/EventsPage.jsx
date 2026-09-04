import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    registerForEvent,
    cancelEventRegistration,
} from '../../api/client';
import {
    PartyPopper,
    Plus,
    Calendar,
    Clock,
    MapPin,
    Users,
    CheckCircle2,
    Trash2,
    Edit3,
    UserCheck,
} from 'lucide-react';
import clsx from 'clsx';

export default function EventsPage() {
    const queryClient = useQueryClient();
    const [registeringEvent, setRegisteringEvent] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const [studentInfo, setStudentInfo] = useState({
        student_id: '20-40532',
        name: 'Md. Student',
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        venue: '7C01',
        organizer: 'CSE Society',
        capacity: 50,
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => getRecords('events'),
    });

    const registerMutation = useMutation({
        mutationFn: ({ eventId, data }) => registerForEvent(eventId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setRegisteringEvent(null);
            showToast('Successfully registered for event!');
        },
    });

    const cancelRegMutation = useMutation({
        mutationFn: ({ eventId, regId }) => cancelEventRegistration(eventId, regId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            showToast('Registration cancelled.');
        },
    });

    const addMutation = useMutation({
        mutationFn: (data) => addRecord('events', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsAddModalOpen(false);
            showToast('Event created successfully!');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateRecord('events', id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsAddModalOpen(false);
            setEditingEvent(null);
            showToast('Event updated!');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteRecord('events', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            showToast('Event deleted.');
        },
    });

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (!registeringEvent) return;
        registerMutation.mutate({ eventId: registeringEvent.id, data: studentInfo });
    };

    const handleEventSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            capacity: Number(formData.capacity),
            registered: editingEvent ? editingEvent.registered : 0,
            status: 'upcoming',
        };

        if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, data: payload });
        } else {
            addMutation.mutate(payload);
        }
    };

    const openEditModal = (ev) => {
        setEditingEvent(ev);
        setFormData({
            name: ev.name,
            description: ev.description,
            date: ev.date,
            start_time: ev.start_time,
            end_time: ev.end_time,
            venue: ev.venue,
            organizer: ev.organizer,
            capacity: ev.capacity,
        });
        setIsAddModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {toastMessage && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce">
                    <CheckCircle2 className="h-4 w-4" />
                    {toastMessage}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PartyPopper className="h-7 w-7 text-blue-600" />
                        Campus Events & Hackathons
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Workshops, seminars, competitions, and student club activities.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingEvent(null);
                        setFormData({
                            name: '',
                            description: '',
                            date: new Date().toISOString().split('T')[0],
                            start_time: '14:00',
                            end_time: '16:00',
                            venue: '7C01',
                            organizer: 'CSE Society',
                            capacity: 50,
                        });
                        setIsAddModalOpen(true);
                    }}
                    className="gradient-btn text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Create Event
                </button>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((ev) => {
                    const registered = ev.registered || 0;
                    const capacity = ev.capacity || 1;
                    const percent = Math.min(100, Math.round((registered / capacity) * 100));
                    const isFull = registered >= capacity;

                    return (
                        <div
                            key={ev.id}
                            className="glass p-5 rounded-2xl flex flex-col justify-between border border-white/40 hover:shadow-md transition"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={clsx(
                                            'text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize',
                                            isFull
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-blue-100 text-blue-700'
                                        )}
                                    >
                                        {isFull ? 'Registration Full' : ev.status || 'upcoming'}
                                    </span>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <button
                                            onClick={() => openEditModal(ev)}
                                            className="p-1 hover:text-blue-600 transition"
                                            title="Edit"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(ev.id)}
                                            className="p-1 hover:text-rose-600 transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1.5 leading-snug">{ev.name}</h3>
                                <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                    {ev.description}
                                </p>

                                <div className="text-xs text-gray-500 space-y-1.5 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        <span>
                                            {ev.date} · {ev.start_time} - {ev.end_time}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Venue: <strong className="text-gray-700">{ev.venue}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                        <span>By: {ev.organizer}</span>
                                    </div>
                                </div>

                                {/* Capacity Progress Bar */}
                                <div className="space-y-1.5 mb-4 bg-white/50 p-2.5 rounded-xl border border-gray-100">
                                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                                        <span>Slots Filled</span>
                                        <span>
                                            {registered} / {capacity} ({percent}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={clsx(
                                                'h-2 rounded-full transition-all duration-300',
                                                percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-blue-600'
                                            )}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => cancelRegMutation.mutate({ eventId: ev.id, regId: '20-40532' })}
                                    className="text-xs text-gray-400 hover:text-rose-600 transition"
                                    title="Cancel standard registration"
                                >
                                    Cancel Registration
                                </button>
                                <button
                                    onClick={() => setRegisteringEvent(ev)}
                                    disabled={isFull}
                                    className="gradient-btn text-white px-4 py-1.5 rounded-xl text-xs font-medium shadow-sm disabled:opacity-50"
                                >
                                    {isFull ? 'Full' : 'Register Now'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Register Modal */}
            {registeringEvent && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Register for Event</h2>
                        <p className="text-xs text-blue-600 font-medium mb-4">{registeringEvent.name}</p>

                        <form onSubmit={handleRegisterSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Student ID</label>
                                <input
                                    required
                                    type="text"
                                    value={studentInfo.student_id}
                                    onChange={(e) => setStudentInfo({ ...studentInfo, student_id: e.target.value })}
                                    placeholder="20-40532"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={studentInfo.name}
                                    onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                                    placeholder="Student Name"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setRegisteringEvent(null)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={registerMutation.isPending}
                                    className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium shadow"
                                >
                                    Confirm Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add / Edit Event Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingEvent ? 'Edit Event' : 'Create New Event'}
                        </h2>
                        <form onSubmit={handleEventSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Hackathon or Workshop Title"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What is this event about?"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Venue</label>
                                    <input
                                        type="text"
                                        value={formData.venue}
                                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                        placeholder="7C01"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Organizer</label>
                                    <input
                                        type="text"
                                        value={formData.organizer}
                                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                                        placeholder="Club / Department"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium"
                                >
                                    Save Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}