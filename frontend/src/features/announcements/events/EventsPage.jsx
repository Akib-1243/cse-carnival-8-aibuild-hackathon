import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecords, addRecord, updateRecord, deleteRecord, registerForEvent, cancelEventRegistration } from '../../api/client';
import { PartyPopper, Plus, Calendar, Clock, MapPin, Users, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import clsx from 'clsx';

export default function EventsPage() {
    const queryClient = useQueryClient();
    const [registeringEvent, setRegisteringEvent] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => getRecords('events'),
    });

    const registerMutation = useMutation({
        mutationFn: ({ eventId, data }) => registerForEvent(eventId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setRegisteringEvent(null);
        },
    });

    const cancelRegMutation = useMutation({
        mutationFn: ({ eventId, regId }) => cancelEventRegistration(eventId, regId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
    });

    const addMutation = useMutation({
        mutationFn: (data) => addRecord('events', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsAddModalOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteRecord('events', id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
    });

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        if (!registeringEvent) return;
        registerMutation.mutate({ eventId: registeringEvent.id, data: studentInfo });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PartyPopper className="h-7 w-7 text-blue-600" />
                        Campus Events & Hackathons
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Seminars, hackathons, workshops, and student club activities.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
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

                    return (
                        <div key={ev.id} className="glass p-5 rounded-2xl flex flex-col justify-between border border-white/40 hover:shadow-md transition">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
                                        {ev.status || 'upcoming'}
                                    </span>
                                    <button
                                        onClick={() => deleteMutation.mutate(ev.id)}
                                        className="text-gray-400 hover:text-rose-600 transition"
                                        title="Delete event"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{ev.name}</h3>
                                <p className="text-xs text-gray-600 mb-4 line-clamp-3">{ev.description}</p>

                                <div className="text-xs text-gray-500 space-y-1.5 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        <span>{ev.date} ({ev.start_time} - {ev.end_time})</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Venue: {ev.venue}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Organizer: {ev.organizer}</span>
                                    </div>
                                </div>

                                {/* Capacity progress */}
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Registration</span>
                                        <span className="font-semibold text-gray-700">{registered} / {capacity}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => cancelRegMutation.mutate({ eventId: ev.id, regId: '20-40532' })}
                                    className="text-xs text-gray-400 hover:text-rose-600 transition"
                                >
                                    Cancel Reg
                                </button>
                                <button
                                    onClick={() => setRegisteringEvent(ev)}
                                    disabled={registered >= capacity}
                                    className="gradient-btn text-white px-4 py-1.5 rounded-xl text-xs font-medium shadow-sm disabled:opacity-50"
                                >
                                    {registered >= capacity ? 'Full' : 'Register Now'}
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
                        <p className="text-xs text-gray-500 mb-4">{registeringEvent.name}</p>

                        <form onSubmit={handleRegisterSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Student ID</label>
                                <input
                                    required
                                    type="text"
                                    value={studentInfo.student_id}
                                    onChange={(e) => setStudentInfo({ ...studentInfo, student_id: e.target.value })}
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
                                    className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium shadow"
                                >
                                    Confirm Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Event Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                addMutation.mutate(formData);
                            }}
                            className="space-y-3"
                        >
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}