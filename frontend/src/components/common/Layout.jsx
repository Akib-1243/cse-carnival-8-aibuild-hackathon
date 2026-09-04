import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

import {
    Calendar,
    DoorOpen,
    PartyPopper,
    Megaphone,
    ClipboardList,
    Menu,
    X,
    Sparkles,
    Home,
    ArrowLeft,
    ChevronRight,
    Bot,
    ExternalLink,
} from 'lucide-react';

import ChatPanel from '../chat/ChatPanel';

const navItems = [
    {
        to: '/',
        label: 'Overview',
        icon: Home,
    },
    {
        to: '/schedules',
        label: 'Schedule',
        icon: Calendar,
    },
    {
        to: '/rooms',
        label: 'Rooms',
        icon: DoorOpen,
    },
    {
        to: '/events',
        label: 'Events',
        icon: PartyPopper,
    },
    {
        to: '/announcements',
        label: 'Announcements',
        icon: Megaphone,
    },
    {
        to: '/assignments',
        label: 'Assignments',
        icon: ClipboardList,
    },
];

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [assistantPrompt, setAssistantPrompt] = useState('');

    const openAssistant = (prompt) => {
        if (prompt) setAssistantPrompt(prompt);
        setIsChatOpen(true);
        setIsChatMinimized(false);
    };

    const closeAssistant = () => {
        setIsChatOpen(false);
        setIsChatMinimized(false);
        setAssistantPrompt('');
    };

    const pageTitles = {
        '/': 'Campus overview',
        '/schedules': 'Schedule',
        '/rooms': 'Rooms and facilities',
        '/events': 'Campus events',
        '/announcements': 'Announcements',
        '/assignments': 'Assignments',
    };
    const pageTitle = pageTitles[location.pathname] || 'CampusOS';
    const isHome = location.pathname === '/';

    return (
        <div className="flex h-screen bg-[#f8fafc]">
            {/* Sidebar */}
            <aside
                className={clsx(
                    'bg-white/80 backdrop-blur-md border-r border-white/20 shadow-xl flex flex-col transition-all duration-300 z-20',
                    isSidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                {/* Logo + Toggle */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100/50">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-blue-600" />

                        {isSidebarOpen && (
                            <h1 className="text-xl font-bold gradient-text">
                                CampusOS
                            </h1>
                        )}
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1 rounded-lg hover:bg-gray-100/50 transition"
                        aria-label="Toggle sidebar"
                    >
                        {isSidebarOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className="block"
                            >
                                {({ isActive }) => (
                                    <div
                                        className={clsx(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                                : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                                        )}
                                    >
                                        <Icon
                                            className={clsx(
                                                'h-5 w-5 flex-shrink-0',
                                                isActive && 'text-white'
                                            )}
                                        />

                                        {isSidebarOpen && (
                                            <span>{item.label}</span>
                                        )}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100/50">
                    {isSidebarOpen ? (
                        <span className="text-xs text-gray-400">
                            v1.0 · Hackathon
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400 block text-center">
                            v1.0
                        </span>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-[#f8fafc]/90 px-4 py-3 backdrop-blur-md sm:px-6">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-2 text-sm">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                disabled={isHome}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Go back"
                                title="Go back"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                            <span className="truncate font-bold text-slate-900">{pageTitle}</span>
                        </div>
                        <NavLink
                            to="/"
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-blue-700"
                        >
                            <Home className="h-4 w-4" />
                            <span className="hidden sm:inline">Home</span>
                        </NavLink>
                    </div>
                </header>

                <div className="mx-auto flex min-h-[calc(100vh-113px)] max-w-7xl flex-col px-4 py-6 sm:px-6">
                    <div className="flex-1">
                        <Outlet context={{ openAssistant }} />
                    </div>
                    <footer className="mt-12 overflow-hidden rounded-t-3xl bg-[#123b5d] text-white shadow-[0_-12px_32px_rgba(15,23,42,0.12)]">
                        <div className="grid gap-8 px-6 py-9 sm:px-9 lg:grid-cols-[1fr_1.25fr_1fr] lg:gap-12">
                            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                                <NavLink to="/" className="flex items-center gap-3">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white text-[#123b5d] shadow-lg">
                                        <Sparkles className="h-6 w-6" />
                                    </span>
                                    <span className="text-2xl font-black tracking-tight">CampusOS</span>
                                </NavLink>
                                <p className="mt-4 max-w-xs text-sm leading-6 text-sky-50/80">
                                    Your connected workspace for everyday campus operations.
                                </p>
                                <p className="mt-4 text-xs leading-5 text-sky-100/70">
                                    CampusOS Hackathon Edition<br />
                                    Intelligent campus operations
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-y border-white/15 py-7 sm:grid-cols-3 sm:border-y-0 sm:border-x sm:px-8 sm:py-0">
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Workspace</h2>
                                    <div className="mt-4 flex flex-col items-start gap-3 text-sm text-sky-50/85">
                                        <NavLink to="/" className="transition hover:text-white">Overview</NavLink>
                                        <NavLink to="/schedules" className="transition hover:text-white">Schedule</NavLink>
                                        <NavLink to="/rooms" className="transition hover:text-white">Rooms</NavLink>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Campus</h2>
                                    <div className="mt-4 flex flex-col items-start gap-3 text-sm text-sky-50/85">
                                        <NavLink to="/events" className="transition hover:text-white">Events</NavLink>
                                        <NavLink to="/announcements" className="transition hover:text-white">Notices</NavLink>
                                        <NavLink to="/assignments" className="transition hover:text-white">Coursework</NavLink>
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Assistant</h2>
                                    <button type="button" onClick={() => openAssistant()} className="mt-4 inline-flex items-center gap-2 text-left text-sm text-sky-50/85 transition hover:text-white">
                                        <Bot className="h-4 w-4" />
                                        Ask CampusOS AI
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center lg:items-end lg:text-right">
                                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Stay connected</h2>
                                <p className="mt-4 max-w-xs text-sm leading-6 text-sky-50/85">
                                    Live schedules, room status, deadlines, and announcements in one place.
                                </p>
                                <NavLink to="/announcements" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-sm font-bold text-[#123b5d] transition hover:bg-sky-50">
                                    View latest notices
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </NavLink>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-white/15 px-6 py-4 text-xs text-sky-100/70 sm:flex-row sm:items-center sm:justify-between sm:px-9">
                            <span>© 2026 CampusOS. Built for connected campus life.</span>
                            <span>Schedules · Rooms · Events · Coursework</span>
                        </div>
                    </footer>
                </div>
            </main>

            {/* AI Chat Button */}
            <button
                onClick={() => openAssistant()}
                className="fixed bottom-6 right-6 z-10 flex h-16 w-16 items-center justify-center rounded-full gradient-btn text-white shadow-xl ring-4 ring-blue-100/80 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                aria-label="Open AI assistant"
                title="Open CampusOS AI"
            >
                <Bot className="h-7 w-7" />
            </button>

            {/* Chat Panel */}
            {isChatOpen && (
                <ChatPanel
                    key={assistantPrompt}
                    onClose={closeAssistant}
                    onMinimize={() => setIsChatMinimized(true)}
                    isMinimized={isChatMinimized}
                    initialPrompt={assistantPrompt}
                />
            )}
        </div>
    );
}