import { useEffect, useState } from 'react';
import { Routes, Route, Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from './components/common/Layout';
import { getRecords } from './api/client';
import SchedulesPage from './features/schedules/SchedulesPage';
import RoomsPage from './features/rooms/RoomsPage';
import EventsPage from './features/events/EventsPage';
import AnnouncementsPage from './features/announcements/AnnouncementsPage';
import AssignmentsPage from './features/assignments/AssignmentsPage';
import {
  Calendar,
  DoorOpen,
  PartyPopper,
  Megaphone,
  ClipboardList,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

function DashboardOverview() {
  const { openAssistant } = useOutletContext();
  const [promptIndex, setPromptIndex] = useState(0);
  const assistantPrompts = [
    'What classes do I have tomorrow?',
    'Is room 7A03 available at 4:20 PM?',
    'Do I have an assignment due before my next class?',
    'What is the latest campus announcement?',
    'What events are happening this week?',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPromptIndex((current) => (current + 1) % assistantPrompts.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [assistantPrompts.length]);

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getRecords('schedules'),
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => getRecords('rooms'),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => getRecords('events'),
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => getRecords('announcements'),
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => getRecords('assignments'),
  });

  const stats = [
    {
      label: 'Weekly Classes',
      count: schedules.length,
      icon: Calendar,
      to: '/schedules',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Available Rooms',
      count: rooms.filter((r) => r.status === 'available').length,
      icon: DoorOpen,
      to: '/rooms',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Campus Events',
      count: events.length,
      icon: PartyPopper,
      to: '/events',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Announcements',
      count: announcements.length,
      icon: Megaphone,
      to: '/announcements',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Pending Tasks',
      count: assignments.filter((a) => a.status === 'pending').length,
      icon: ClipboardList,
      to: '/assignments',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Command center hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.22),transparent_30%),radial-gradient(circle_at_15%_100%,rgba(37,99,235,0.35),transparent_42%)]" />
        <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
              Live campus command center
            </div>
            <h1 className="max-w-2xl text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Know what is happening on campus before you need to ask.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              One workspace for today&apos;s classes, room availability, upcoming events, campus notices, and coursework deadlines.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/schedules" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-100">
                Open today&apos;s schedule
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/rooms" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">
                Find a room
                <DoorOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="rounded-xl bg-blue-500/20 p-2.5 text-blue-200">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">Ask CampusOS AI</div>
                <div className="mt-0.5 text-xs text-slate-400">Connected to live campus data</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAssistant(assistantPrompts[promptIndex])}
              className="mt-4 block w-full rounded-xl bg-slate-900/70 p-3 text-left text-xs leading-5 text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300/70"
              aria-label={`Ask CampusOS AI: ${assistantPrompts[promptIndex]}`}
            >
              <span className="font-semibold text-white">Try asking:</span>
              <span key={promptIndex} className="ml-1 inline-block animate-[fade-in_500ms_ease-out]">
                “{assistantPrompts[promptIndex]}”
              </span>
              <span className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                Click to open assistant
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </button>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Schedules, rooms, deadlines, and notices synced
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
        <Clock3 className="h-4 w-4 text-blue-600" />
        Your campus snapshot
        <span className="ml-1 normal-case tracking-normal text-gray-400">Updated from the current workspace</span>
      </div>

      {/* Live workspace totals */}
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
              <div key={ann.id} className="p-3 bg-white/70 rounded-xl border border-gray-100">
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
              <div key={sch.id} className="p-3 bg-white/70 rounded-xl border border-gray-100 flex items-center justify-between">
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
      </Route>
    </Routes>
  );
}