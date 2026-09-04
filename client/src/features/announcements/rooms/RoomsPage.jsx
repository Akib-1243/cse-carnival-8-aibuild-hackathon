import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecords, addRecord, updateRecord, deleteRecord, bookRoom, cancelRoomBooking } from '../../api/client';
import { DoorOpen, Plus, Search, Calendar, Users, Cpu, CheckCircle, XCircle, Trash2, Edit3, Bookmark } from 'lucide-react';
import clsx from 'clsx';

export default function RoomsPage() {
    const queryClient = useQueryClient();
    const [minCapacity, setMinCapacity] = useState(0);
    const [selectedEquipment, setSelectedEquipment] = useState('all');
    const [bookingRoom, setBookingRoom] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Booking Form State
    const [bookingData, setBookingData] = useState({
        booked_by: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        purpose: '',
    });

    const { data: rooms = [], isLoading } = useQuery({
        queryKey: ['rooms'],
        queryFn: () => getRecords('rooms'),
    });

    const bookMutation = useMutation({
        mutationFn: ({ roomId, data }) => bookRoom(roomId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            setBookingRoom(null);
        },
    });

    const cancelBookingMutation = useMutation({
        mutationFn: ({ roomId, bookingId }) => cancelRoomBooking(roomId, bookingId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
    });

    const deleteRoomMutation = useMutation({
        mutationFn: (id) => deleteRecord('rooms', id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
    });

    const handleBookingSubmit = (e) => {
        e.preventDefault();
        if (!bookingRoom || !bookingData.booked_by) return;
        bookMutation.mutate({ roomId: bookingRoom.id, data: bookingData });
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <DoorOpen className="h-7 w-7 text-blue-600" />
                        Room Availability & Booking
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Browse lecture halls, labs, seminar spaces, and manage reservations.
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
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
                        <div key={room.id} className="glass p-5 rounded-2xl flex flex-col justify-between border border-white/40 shadow-sm hover:shadow-md transition">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900">Room {room.room_number}</span>
                                        <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                                            {room.type}
                                        </span>
                                    </div>
                                    <span
                                        className={clsx(
                                            'text-xs font-semibold px-2 py-0.5 rounded-full capitalize',
                                            room.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        )}
                                    >
                                        {room.status}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-500 space-y-1.5 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Capacity: <strong className="text-gray-800">{room.capacity} seats</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="capitalize">{room.equipment?.join(', ') || 'Standard equipment'}</span>
                                    </div>
                                </div>

                                {/* Existing Bookings */}
                                {activeBookings.length > 0 && (
                                    <div className="bg-blue-50/60 p-3 rounded-xl mb-4 border border-blue-100/80">
                                        <div className="text-xs font-semibold text-blue-900 mb-1 flex items-center justify-between">
                                            <span>Reserved Bookings ({activeBookings.length})</span>
                                        </div>
                                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                            {activeBookings.map((b) => (
                                                <div key={b.booking_id} className="flex items-center justify-between text-xs text-blue-800 bg-white/70 p-1.5 rounded">
                                                    <div>
                                                        <span className="font-semibold">{b.booked_by}</span> ({b.start_time} - {b.end_time})
                                                    </div>
                                                    <button
                                                        onClick={() => cancelBookingMutation.mutate({ roomId: room.id, bookingId: b.booking_id })}
                                                        className="text-rose-600 hover:underline text-[11px] font-medium"
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
                                    onClick={() => setBookingRoom(room)}
                                    className="gradient-btn text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-sm hover:shadow"
                                >
                                    Book Room
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
                            Capacity: {bookingRoom.capacity} · {bookingRoom.type}
                        </p>

                        <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name / Organization</label>
                                <input
                                    required
                                    type="text"
                                    value={bookingData.booked_by}
                                    onChange={(e) => setBookingData({ ...bookingData, booked_by: e.target.value })}
                                    placeholder="e.g. CSE Study Group / Tanvir"
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
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose</label>
                                <input
                                    type="text"
                                    value={bookingData.purpose}
                                    onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
                                    placeholder="e.g. Project presentation practice"
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
        </div>
    );
}