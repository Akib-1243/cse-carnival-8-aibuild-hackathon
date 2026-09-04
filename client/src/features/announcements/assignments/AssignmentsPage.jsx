import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecords, addRecord, updateRecord, deleteRecord } from '../../api/client';
import {
    Megaphone,
    Plus,
    Search,
    Trash2,
    Edit3,
    Calendar,
    User,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

export default function AnnouncementsPage() {
    const queryClient = useQueryClient();
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        body: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        posted_by: 'Faculty Office',
        expires: '',
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // 1. Fetch data
    const { data: announcements = [], isLoading, isError } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => getRecords('announcements'),
    });

    // 2. Add mutation
    const addMutation = useMutation({
        mutationFn: (newAnn) => addRecord('announcements', newAnn),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            closeModal();
            showToast('Announcement posted successfully!');
        },
    });

    // 3. Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateRecord('announcements', id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            closeModal();
            showToast('Announcement updated!');
        },
    });

    // 4. Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteRecord('announcements', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setDeleteConfirmId(null);
            showToast('Announcement deleted.');
        },
    });

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            body: '',
            date: new Date().toISOString().split('T')[0],
            priority: 'medium',
            posted_by: 'Faculty Office',
            expires: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            body: item.body || '',
            date: item.date || '',
            priority: item.priority || 'medium',
            posted_by: item.posted_by || '',
            expires: item.expires || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.body) return;

        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            addMutation.mutate(formData);
        }
    };

    // Filtering by priority & search term
    const filtered = announcements.filter((ann) => {
        const matchesPriority =
            priorityFilter === 'all' || ann.priority?.toLowerCase() === priorityFilter.toLowerCase();
        const matchesSearch =
            (ann.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (ann.body?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (ann.posted_by?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesPriority && matchesSearch;
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
                        <Megaphone className="h-7 w-7 text-blue-600" />
                        Campus Announcements
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Real-time university circulars, class rescheduling, and exam notices.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="gradient-btn text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Post Notice
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                        type="text"
                        placeholder="Search notices, courses, topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/70 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority:</span>
                    {['all', 'high', 'medium', 'low'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition',
                                priorityFilter === p
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900 border border-gray-100'
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid / State Handling */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="glass p-5 rounded-2xl h-48 animate-pulse bg-gray-200/50" />
                    ))}
                </div>
            ) : isError ? (
                <div className="p-8 text-center text-red-500 glass rounded-2xl">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    Failed to load notices. Please check API server.
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-gray-400 glass rounded-2xl">
                    <p className="text-base font-medium">No announcements found matching your filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((ann) => (
                        <div
                            key={ann.id}
                            className="glass p-5 rounded-2xl flex flex-col justify-between hover:shadow-lg transition duration-200 border border-white/40"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span
                                        className={clsx(
                                            'text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize',
                                            ann.priority === 'high' && 'bg-rose-100 text-rose-700 border border-rose-200',
                                            ann.priority === 'medium' && 'bg-amber-100 text-amber-700 border border-amber-200',
                                            ann.priority === 'low' && 'bg-slate-100 text-slate-700 border border-slate-200'
                                        )}
                                    >
                                        {ann.priority || 'Normal'}
                                    </span>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <button
                                            onClick={() => openEditModal(ann)}
                                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Edit Notice"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(ann.id)}
                                            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                            title="Delete Notice"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
                                    {ann.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed mb-4">
                                    {ann.body}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {ann.posted_by || 'Staff'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {ann.date}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingItem ? 'Edit Notice' : 'Post New Notice'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Headline / Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. CSE 4113 Class Rescheduled"
                                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Content / Body</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    placeholder="Details of the announcement..."
                                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Posted By</label>
                                    <input
                                        type="text"
                                        value={formData.posted_by}
                                        onChange={(e) => setFormData({ ...formData, posted_by: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date Posted</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.expires}
                                        onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addMutation.isPending || updateMutation.isPending}
                                    className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium shadow"
                                >
                                    {editingItem ? 'Save Changes' : 'Publish Notice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-sm w-full rounded-2xl p-6 text-center shadow-xl">
                        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">Delete Notice?</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-5">
                            This notice will be permanently deleted and removed from the AI agent's view.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}