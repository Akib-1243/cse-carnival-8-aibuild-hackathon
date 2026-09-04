import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
} from 'lucide-react';

import ChatPanel from '../chat/ChatPanel';

const navItems = [
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

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
            <main className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </main>

            {/* AI Chat Button */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 gradient-btn text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 z-10"
                aria-label="Open AI assistant"
            >
                💬
            </button>

            {/* Chat Panel */}
            {isChatOpen && (
                <ChatPanel onClose={() => setIsChatOpen(false)} />
            )}
        </div>
    );
}