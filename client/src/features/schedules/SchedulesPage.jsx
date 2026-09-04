import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecords, addRecord, updateRecord, deleteRecord } from '../../api/client';
import { Calendar, Plus, Search, Edit3, Trash2, Clock, MapPin, User, BookOpen, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const DAYS = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export default function SchedulesPage() {
    const queryClient = useQueryClient();
    const [selectedDay, setSelectedDay] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const [formData, setFormData] = useState({
        course: '',
        title: '',
        day: 'Sunday',
        start_time: '09:00',
        end_time: '10:30',
        room: '7A03',
        instructor: 'TBA',
        section: 'B',
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => getRecords('schedules'),
    });

    const addMutation = useMutation({
        mutationFn: (data) => addRecord('schedules', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setIsModalOpen(false);
            showToast('Class schedule added successfully!');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateRecord('schedules', id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setIsModalOpen(false);
            showToast('Schedule updated!');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteRecord('schedules', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            showToast('Schedule removed.');
        },
    });

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            course: '',
            title: '',
            day: 'Sunday',
            start_time: '09:00',
            end_time: '10:30',
            room: '7A03',
            instructor: 'TBA',
            section: 'B',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            addMutation.mutate(formData);
        }
    };

    const filtered = schedules.filter((s) => {
        const matchesDay = selectedDay === 'All' || s.day === selectedDay;
        const matchesSearch =
            (s.course?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (s.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (s.room?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (s.instructor?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesDay && matchesSearch;
    });

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
                        <Calendar className="h-7 w-7 text-blue-600" />
                        Class Schedules
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Weekly timetable across lecture halls and lab facilities.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="gradient-btn text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Schedule
                </button>
            </div>

            {/* Filter Bar */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                        type="text"
                        placeholder="Search course, room, instructor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/70 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                                selectedDay === day
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-100'
                            )}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden border border-white/40 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-slate-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-5 py-3.5">Course</th>
                                <th className="px-5 py-3.5">Day & Time</th>
                                <th className="px-5 py-3.5">Room</th>
                                <th className="px-5 py-3.5">Instructor</th>
                                <th className="px-5 py-3.5">Section</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/60">
                            {filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-white/50 transition">
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-gray-900">{item.course}</div>
                                        <div className="text-xs text-gray-500">{item.title}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                            {item.day}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.start_time} – {item.end_time}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-medium text-gray-800 flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                            Room {item.room}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600">{item.instructor}</td>
                                    <td className="px-5 py-4">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-medium">
                                            {item.section}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right space-x-1">
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                                            title="Edit"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(item.id)}
                                            className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingItem ? 'Edit Schedule' : 'Add Class Schedule'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Course Code</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                        placeholder="CSE 4113"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Section</label>
                                    <input
                                        type="text"
                                        value={formData.section}
                                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                        placeholder="B or B1"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Pattern Recognition"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Day</label>
                                    <select
                                        value={formData.day}
                                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    >
                                        {DAYS.filter((d) => d !== 'All').map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Room</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        placeholder="7A03"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Instructor</label>
                                    <input
                                        type="text"
                                        value={formData.instructor}
                                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                        placeholder="Prof. Name or TBA"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium"
                                >
                                    Save Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}