import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecords, addRecord, updateRecord, deleteRecord } from '../../api/client';
import {
    ClipboardList,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    Trash2,
    Edit3,
    Award,
} from 'lucide-react';
import clsx from 'clsx';

export default function AssignmentsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('all');
    const [deadlineFilter, setDeadlineFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const [formData, setFormData] = useState({
        course: '',
        course_title: '',
        title: '',
        description: '',
        assigned_date: new Date().toISOString().split('T')[0],
        deadline: '',
        submission_platform: 'Google Classroom',
        status: 'pending',
        marks: 10,
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['assignments'],
        queryFn: () => getRecords('assignments'),
    });

    const addMutation = useMutation({
        mutationFn: (data) => addRecord('assignments', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            setIsModalOpen(false);
            showToast('Assignment added successfully!');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateRecord('assignments', id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            setIsModalOpen(false);
            showToast('Assignment updated!');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteRecord('assignments', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            showToast('Assignment deleted.');
        },
    });

    const toggleStatus = (item) => {
        const nextStatus = item.status === 'pending' ? 'submitted' : 'pending';
        updateMutation.mutate({ id: item.id, data: { ...item, status: nextStatus } });
        showToast(`Marked as ${nextStatus}!`);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            course: '',
            course_title: '',
            title: '',
            description: '',
            assigned_date: new Date().toISOString().split('T')[0],
            deadline: '',
            submission_platform: 'Google Classroom',
            status: 'pending',
            marks: 10,
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

    const filtered = assignments.filter((a) => {
        const matchesStatus =
            statusFilter === 'all' || a.status?.toLowerCase() === statusFilter.toLowerCase();

        const today = new Date();
        const deadlineDate = new Date(a.deadline);
        const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

        let matchesDeadline = true;
        if (deadlineFilter === 'this_week') {
            matchesDeadline = diffDays >= 0 && diffDays <= 7;
        } else if (deadlineFilter === 'upcoming') {
            matchesDeadline = diffDays > 7;
        } else if (deadlineFilter === 'past') {
            matchesDeadline = diffDays < 0;
        }

        const matchesSearch =
            (a.course?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (a.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (a.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        return matchesStatus && matchesDeadline && matchesSearch;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Toast Notification */}
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
                        <ClipboardList className="h-7 w-7 text-blue-600" />
                        Course Assignments & Deadlines
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track coursework deadlines, submissions, evaluation marks, and platforms.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="gradient-btn text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Assignment
                </button>
            </div>

            {/* Filter Bar */}
            <div className="glass p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="relative w-full lg:w-72">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                        type="text"
                        placeholder="Search assignment or course..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/70 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    {/* Deadline Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Deadline:
                        </span>
                        <select
                            value={deadlineFilter}
                            onChange={(e) => setDeadlineFilter(e.target.value)}
                            className="bg-white/80 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
                        >
                            <option value="all">All Deadlines</option>
                            <option value="this_week">Due This Week (7 Days)</option>
                            <option value="upcoming">Upcoming (&gt; 7 Days)</option>
                            <option value="past">Past Due</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
                            Status:
                        </span>
                        {['all', 'pending', 'submitted', 'graded'].map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition',
                                    statusFilter === st
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-100'
                                )}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Assignments Table */}
            <div className="glass rounded-2xl overflow-hidden border border-white/40 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                        <thead className="bg-slate-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-5 py-3.5">Course & Title</th>
                                <th className="px-5 py-3.5">Deadline</th>
                                <th className="px-5 py-3.5">Platform</th>
                                <th className="px-5 py-3.5">Marks</th>
                                <th className="px-5 py-3.5">Status (Click to Toggle)</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/60">
                            {filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-white/50 transition">
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-gray-900">{item.title}</div>
                                        <div className="text-xs text-blue-600 mt-0.5">
                                            {item.course} · {item.course_title || 'Core Course'}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            {item.deadline}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-600">
                                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700">
                                            {item.submission_platform || 'Google Classroom'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-semibold text-gray-800 text-xs flex items-center gap-1">
                                            <Award className="h-3.5 w-3.5 text-amber-500" />
                                            {item.marks || 10} pts
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => toggleStatus(item)}
                                            title="Click to toggle between Pending and Submitted"
                                            className={clsx(
                                                'px-3 py-1 rounded-full text-xs font-semibold capitalize transition flex items-center gap-1.5 cursor-pointer shadow-xs',
                                                item.status === 'submitted'
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                                            )}
                                        >
                                            <span
                                                className={clsx(
                                                    'w-1.5 h-1.5 rounded-full',
                                                    item.status === 'submitted' ? 'bg-emerald-500' : 'bg-amber-500'
                                                )}
                                            />
                                            {item.status}
                                        </button>
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
                            {editingItem ? 'Edit Assignment' : 'Add New Assignment'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Course Code
                                    </label>
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
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Assignment 1"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Full Course Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.course_title}
                                    onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                                    placeholder="Pattern Recognition"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Deadline Date
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Platform</label>
                                    <input
                                        type="text"
                                        value={formData.submission_platform}
                                        onChange={(e) =>
                                            setFormData({ ...formData, submission_platform: e.target.value })
                                        }
                                        placeholder="Google Classroom"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Marks / Points
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.marks}
                                        onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="graded">Graded</option>
                                    </select>
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
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}