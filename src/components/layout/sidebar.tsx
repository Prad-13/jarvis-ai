'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Settings, PanelRight, LogOut, Terminal, Link2, Sparkles, ChevronLeft } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const activeTab = useJarvisStore((state) => state.activeTab);
  const setActiveTab = useJarvisStore((state) => state.setActiveTab);
  const expanded = useJarvisStore((state) => state.sidebarExpanded);
  const setExpanded = useJarvisStore((state) => state.setSidebarExpanded);
  const chatOpen = useJarvisStore((state) => state.chatPanelOpen);
  const setChatOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const googleConnected = useJarvisStore((state) => state.googleConnected);
  const googleUser = useJarvisStore((state) => state.googleUser);
  const setOpenCommandPalette = useJarvisStore((state) => state.setCommandPaletteOpen);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error('Failed to trigger Google login:', e);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      const res = await fetch('/api/auth/session', { method: 'DELETE' });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  };

  return (
    <aside
      className={cn(
        "h-screen border-r border-white/5 bg-[#070710]/90 backdrop-blur-xl flex flex-col z-30 transition-all duration-300 ease-in-out relative shrink-0",
        expanded ? "w-60" : "w-[68px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {expanded && (
            <span className="font-semibold text-sm text-white whitespace-nowrap">
              Jarvis AI
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white bg-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
              title={!expanded ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {expanded && <span>{item.label}</span>}
            </button>
          );
        })}

        <button
          onClick={() => setOpenCommandPalette(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-150"
          title={!expanded ? 'Spotlight (Ctrl+K)' : undefined}
        >
          <Terminal className="h-4 w-4 shrink-0" />
          {expanded && (
            <div className="flex items-center justify-between flex-1">
              <span>Spotlight</span>
              <kbd className="text-[10px] bg-white/8 px-1.5 py-0.5 rounded border border-white/10 text-slate-500 font-mono">⌘K</kbd>
            </div>
          )}
        </button>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-white/5 space-y-3">
        {googleConnected ? (
          <div className={cn("flex items-center gap-3", !expanded && "justify-center")}>
            {googleUser?.picture ? (
              <img
                src={googleUser.picture}
                alt="Avatar"
                className="h-8 w-8 rounded-full border border-white/10 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-semibold text-xs text-cyan-400 shrink-0">
                {googleUser?.name?.[0] || 'P'}
              </div>
            )}
            {expanded && (
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-semibold text-slate-200 truncate">{googleUser?.name || 'User'}</div>
                <div className="text-[11px] text-slate-500 truncate">{googleUser?.email}</div>
              </div>
            )}
            {expanded && (
              <button
                onClick={handleGoogleDisconnect}
                className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-red-400 transition shrink-0"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleConnect}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full",
              expanded
                ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15"
                : "justify-center text-slate-500 hover:text-cyan-400 hover:bg-white/5"
            )}
            title={!expanded ? 'Connect Google' : undefined}
          >
            <Link2 className="h-4 w-4 shrink-0" />
            {expanded && <span>Connect Google</span>}
          </button>
        )}

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition text-slate-500 hover:text-white hover:bg-white/5",
              chatOpen && "text-cyan-400 bg-cyan-500/8"
            )}
            title="Toggle AI panel"
          >
            <PanelRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.2 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </div>
    </aside>
  );
}
