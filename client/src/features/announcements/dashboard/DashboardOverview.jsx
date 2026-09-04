import { useQuery } from '@tanstack/react-query';
import { getRecords } from '../../api/client';
import { Calendar, DoorOpen, PartyPopper, Megaphone, ClipboardList, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardOverview() {
    const { data: schedules = [] } = useQuery({ queryKey: ['schedules'], queryFn: () => getRecords('schedules') });
    const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => getRecords('rooms') });
    const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => getRecords('events') });
    const { data: announcements = [] } = useQuery({ queryKey: ['announcements'], queryFn: () => getRecords('announcements') });
    const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => getRecords('assignments') });

    const stats = [
        { label: 'Weekly Classes', count: schedules.length, icon: Calendar, to: '/schedules', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Available Rooms', count: rooms.filter((r) => r.status === 'available').length, icon: DoorOpen, to: '/rooms', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Campus Events', count: events.length, icon: PartyPopper, to: '/events', color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Announcements', count: announcements.length, icon: Megaphone, to: '/announcements', color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Pending Tasks', count: assignments.filter((a) => a.status === 'pending').length, icon: ClipboardList, to: '/assignments', color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Banner */}
            <div className="glass p-8 rounded-3xl relative overflow-hidden border border-white/50 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 text-white shadow-xl">
                <div className="max-w-2xl relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold mb-4 border border-white/20">
                        <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                        CampusOS Hackathon Edition
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                        Intelligent Campus Operating System
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed mb-6">
                        Real-time management for schedules, facility bookings, events, circulars, and coursework. Powered by an interactive campus AI assistant.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <Link
                            key={s.label}
                            to={s.to}
                            className="glass p-5 rounded-2xl border border-white/40 hover:-translate-y-1 hover:shadow-lg transition flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{s.count}</div>
                                <div className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latest Announcements */}
                <div className="glass p-6 rounded-2xl border border-white/40 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-amber-500" />
                            Recent Notices
                        </h2>
                        <Link to="/announcements" className="text-xs font-semibold text-blue-600 hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {announcements.slice(0, 3).map((ann) => (
                            <div key={ann.id} className="p-3 bg-white/60 rounded-xl border border-gray-100/60">
                                <div className="font-semibold text-sm text-gray-900">{ann.title}</div>
                                <div className="text-xs text-gray-500 line-clamp-2 mt-1">{ann.body}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Classes */}
                <div className="glass p-6 rounded-2xl border border-white/40 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Next Scheduled Classes
                        </h2>
                        <Link to="/schedules" className="text-xs font-semibold text-blue-600 hover:underline">
                            Full Schedule
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {schedules.slice(0, 3).map((sch) => (
                            <div key={sch.id} className="p-3 bg-white/60 rounded-xl border border-gray-100/60 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm text-gray-900">{sch.course} · {sch.title}</div>
                                    <div className="text-xs text-gray-500">{sch.day} from {sch.start_time} to {sch.end_time}</div>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                    Room {sch.room}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}