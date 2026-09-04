import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecords, addRecord, updateRecord, deleteRecord, bookRoom, cancelRoomBooking } from '../../api/client';
import {
    DoorOpen,
    Plus,
    Search,
    Users,
    Cpu,
    Bookmark,
    XCircle,
    Clock,
    Trash2,
    Edit3,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

export default function RoomsPage() {
    const queryClient = useQueryClient();
    const [minCapacity, setMinCapacity] = useState(0);
    const [selectedEquipment, setSelectedEquipment] = useState('all');
    const [bookingRoom, setBookingRoom] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        booked_by: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        purpose: '',
    });

    // Room Form State
    const [roomFormData, setRoomFormData] = useState({
        room_number: '',
        type: 'classroom',
        capacity: 40,
        equipment: 'projector, AC, whiteboard',
        floor: 7,
        status: 'available',
    });

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const { data: rooms = [], isLoading } = useQuery({
        queryKey: ['rooms'],
        queryFn: () => getRecords('rooms'),
    });

    // Mutations
    const bookMutation = useMutation({
        mutationFn: ({ roomId, data }) => bookRoom(roomId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            setBookingRoom(null);
            showToast('Room reservation confirmed!');
        },
    });

    const cancelBookingMutation = useMutation({
        mutationFn: ({ roomId, bookingId }) => cancelRoomBooking(roomId, bookingId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            showToast('Booking cancelled.');
        },
    });

    const addRoomMutation = useMutation({
        mutationFn: (data) => addRecord('rooms', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            setIsAddModalOpen(false);
            showToast('Room added!');
        },
    });

    const updateRoomMutation = useMutation({
        mutationFn: ({ id, data }) => updateRecord('rooms', id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            setIsAddModalOpen(false);
            setEditingRoom(null);
            showToast('Room updated!');
        },
    });

    const deleteRoomMutation = useMutation({
        mutationFn: (id) => deleteRecord('rooms', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            showToast('Room deleted.');
        },
    });

    const handleBookingSubmit = (e) => {
        e.preventDefault();
        if (!bookingRoom || !bookingData.booked_by) return;
        bookMutation.mutate({ roomId: bookingRoom.id, data: bookingData });
    };

    const handleRoomSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...roomFormData,
            capacity: Number(roomFormData.capacity),
            equipment: typeof roomFormData.equipment === 'string'
                ? roomFormData.equipment.split(',').map((s) => s.trim()).filter(Boolean)
                : roomFormData.equipment,
        };

        if (editingRoom) {
            updateRoomMutation.mutate({ id: editingRoom.id, data: payload });
        } else {
            addRoomMutation.mutate(payload);
        }
    };

    const openEditRoom = (room) => {
        setEditingRoom(room);
        setRoomFormData({
            room_number: room.room_number,
            type: room.type,
            capacity: room.capacity,
            equipment: Array.isArray(room.equipment) ? room.equipment.join(', ') : '',
            floor: room.floor,
            status: room.status,
        });
        setIsAddModalOpen(true);
    };

    const filtered = rooms.filter((r) => {
        const matchesCap = (r.capacity || 0) >= minCapacity;
        const matchesEquip =
            selectedEquipment === 'all' ||
            (r.equipment || []).some((eq) => eq.toLowerCase() === selectedEquipment.toLowerCase());
        return matchesCap && matchesEquip;
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
                        <DoorOpen className="h-7 w-7 text-blue-600" />
                        Campus Rooms & Facility Reservations
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Lecture halls, computer labs, and seminar rooms with live booking controls.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingRoom(null);
                        setRoomFormData({
                            room_number: '',
                            type: 'classroom',
                            capacity: 40,
                            equipment: 'projector, AC, whiteboard',
                            floor: 7,
                            status: 'available',
                        });
                        setIsAddModalOpen(true);
                    }}
                    className="gradient-btn text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Room
                </button>
            </div>

            {/* Filters Bar */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Min Capacity:</label>
                    <select
                        value={minCapacity}
                        onChange={(e) => setMinCapacity(Number(e.target.value))}
                        className="bg-white/80 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
                    >
                        <option value={0}>Any Capacity</option>
                        <option value={30}>30+ People</option>
                        <option value={45}>45+ People</option>
                        <option value={60}>60+ People</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Equipment:</span>
                    {['all', 'projector', 'AC', 'whiteboard', 'computers'].map((eq) => (
                        <button
                            key={eq}
                            onClick={() => setSelectedEquipment(eq)}
                            className={clsx(
                                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition',
                                selectedEquipment === eq
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-100'
                            )}
                        >
                            {eq}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((room) => {
                    const activeBookings = room.bookings || [];
                    return (
                        <div
                            key={room.id}
                            className="glass p-5 rounded-2xl flex flex-col justify-between border border-white/40 shadow-sm hover:shadow-md transition"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900">Room {room.room_number}</span>
                                        <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                                            {room.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={clsx(
                                                'text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize',
                                                room.status === 'available'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                            )}
                                        >
                                            {room.status}
                                        </span>
                                        <button
                                            onClick={() => openEditRoom(room)}
                                            className="p-1 text-gray-400 hover:text-blue-600"
                                            title="Edit"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => deleteRoomMutation.mutate(room.id)}
                                            className="p-1 text-gray-400 hover:text-rose-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 space-y-1.5 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Capacity: <strong className="text-gray-800">{room.capacity} seats</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="capitalize">{room.equipment?.join(', ') || 'Standard'}</span>
                                    </div>
                                </div>

                                {/* Active Bookings with Cancellation Button */}
                                {activeBookings.length > 0 && (
                                    <div className="bg-blue-50/70 p-3 rounded-xl mb-4 border border-blue-100">
                                        <div className="text-xs font-semibold text-blue-900 mb-1.5 flex items-center justify-between">
                                            <span>Active Reservations ({activeBookings.length})</span>
                                        </div>
                                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                            {activeBookings.map((b) => (
                                                <div
                                                    key={b.booking_id}
                                                    className="flex items-center justify-between text-xs text-blue-900 bg-white/80 p-1.5 rounded-lg shadow-xs"
                                                >
                                                    <div>
                                                        <span className="font-semibold">{b.booked_by}</span>
                                                        <div className="text-[11px] text-gray-500">
                                                            {b.date} · {b.start_time} - {b.end_time}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            cancelBookingMutation.mutate({ roomId: room.id, bookingId: b.booking_id })
                                                        }
                                                        className="text-rose-600 hover:text-rose-700 font-medium text-xs px-2 py-0.5 rounded hover:bg-rose-50 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Floor {room.floor}</span>
                                <button
                                    onClick={() => {
                                        setBookingRoom(room);
                                        setBookingData({
                                            booked_by: '',
                                            date: new Date().toISOString().split('T')[0],
                                            start_time: '14:00',
                                            end_time: '16:00',
                                            purpose: '',
                                        });
                                    }}
                                    className="gradient-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-sm"
                                >
                                    Book This Room
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Book Room Modal */}
            {bookingRoom && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            Book Room {bookingRoom.room_number}
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">
                            Capacity: {bookingRoom.capacity} Seats · Floor {bookingRoom.floor}
                        </p>

                        <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Name / Student Club</label>
                                <input
                                    required
                                    type="text"
                                    value={bookingData.booked_by}
                                    onChange={(e) => setBookingData({ ...bookingData, booked_by: e.target.value })}
                                    placeholder="e.g. CSE Society / Tanvir"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                                <input
                                    required
                                    type="date"
                                    value={bookingData.date}
                                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time (24h)</label>
                                    <input
                                        type="time"
                                        value={bookingData.start_time}
                                        onChange={(e) => setBookingData({ ...bookingData, start_time: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Time (24h)</label>
                                    <input
                                        type="time"
                                        value={bookingData.end_time}
                                        onChange={(e) => setBookingData({ ...bookingData, end_time: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose of Booking</label>
                                <input
                                    type="text"
                                    value={bookingData.purpose}
                                    onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
                                    placeholder="e.g. Hackathon Team Practice"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setBookingRoom(null)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookMutation.isPending}
                                    className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium shadow"
                                >
                                    Confirm Reservation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add / Edit Room Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingRoom ? 'Edit Room' : 'Add New Room'}
                        </h2>
                        <form onSubmit={handleRoomSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Room Number</label>
                                    <input
                                        required
                                        type="text"
                                        value={roomFormData.room_number}
                                        onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })}
                                        placeholder="7A03"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                                    <select
                                        value={roomFormData.type}
                                        onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    >
                                        <option value="classroom">Classroom</option>
                                        <option value="lab">Lab</option>
                                        <option value="seminar">Seminar Hall</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        value={roomFormData.capacity}
                                        onChange={(e) => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Floor</label>
                                    <input
                                        type="number"
                                        value={roomFormData.floor}
                                        onChange={(e) => setRoomFormData({ ...roomFormData, floor: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment (comma separated)</label>
                                <input
                                    type="text"
                                    value={roomFormData.equipment}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, equipment: e.target.value })}
                                    placeholder="projector, AC, whiteboard"
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                />
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
                                    Save Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}