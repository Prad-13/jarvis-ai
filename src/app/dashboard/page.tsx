'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../../components/layout/sidebar';
import { ChatPanel } from '../../components/chat/chat-panel';
import { CommandPalette } from '../../components/layout/command-palette';
import { GreetingWidget } from '../../components/dashboard/greeting-widget';
import { InboxWidget } from '../../components/dashboard/inbox-widget';
import { AgendaWidget } from '../../components/dashboard/agenda-widget';
import { TasksWidget } from '../../components/dashboard/tasks-widget';
import { SheetsWidget } from '../../components/dashboard/sheets-widget';
import { FilesWidget } from '../../components/dashboard/files-widget';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { Sparkles, Link2, Mail, Calendar, CheckSquare, FileSpreadsheet, Folder, ChevronRight } from 'lucide-react';

function OnboardingOverlay({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center p-6"
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Glow aura */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/10 blur-sm pointer-events-none" />

        <div className="glass-card rounded-2xl p-8 text-center space-y-7 border border-cyan-500/10 shadow-[0_0_60px_rgba(6,182,212,0.08)]">
          {/* Animated logo orb */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin-slow" />
              {/* Inner glow */}
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shadow-[0_0_30px_rgba(6,182,212,0.3)]" />
              {/* Core icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Connect Google Workspace
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              Connect your Google account to display your real emails, calendar, tasks, and files. No placeholder data — ever.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: Mail, label: 'Gmail Inbox', desc: 'Priority emails & replies', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: Calendar, label: 'Google Calendar', desc: "Today's schedule & meetings", color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              { icon: CheckSquare, label: 'Google Tasks', desc: 'Create, complete & delete', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { icon: Folder, label: 'Google Drive', desc: 'Recent files & AI summaries', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { icon: FileSpreadsheet, label: 'Google Sheets', desc: 'Spreadsheet data & analysis', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { icon: Sparkles, label: 'AI Daily Brief', desc: 'Personalised from real data', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition"
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded border shrink-0 ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-200">{label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={onConnect}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]"
          >
            <Link2 className="h-4 w-4" />
            Connect Google Workspace
            <ChevronRight className="h-4 w-4" />
          </button>

          <p className="text-[10px] text-slate-600 font-mono">
            Scopes: Gmail · Calendar · Drive (read) · Tasks · Sheets
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const googleConnected = useJarvisStore((state) => state.googleConnected);
  const [connecting, setConnecting] = useState(false);

  const handleGoogleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      setConnecting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg relative">
      <div className="fixed inset-0 cyber-grid pointer-events-none" />
      {/* 1. Sidebar Nav */}
      <Sidebar />

      {/* 2. Central content */}
      <main className="flex-1 h-full overflow-y-auto px-6 lg:px-8 py-8 z-10 space-y-6 relative">
        {/* Dynamic header */}
        <GreetingWidget />

        {/* Gmail & Calendar row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <InboxWidget />
          <AgendaWidget />
        </div>

        {/* Tasks, Sheets & Files row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          <TasksWidget />
          <SheetsWidget />
          <FilesWidget />
        </div>

        {/* Onboarding overlay when not authenticated */}
        <AnimatePresence>
          {!googleConnected && (
            <OnboardingOverlay onConnect={handleGoogleConnect} />
          )}
        </AnimatePresence>
      </main>

      {/* 3. Persistent JARVIS voice chat drawer */}
      <ChatPanel />

      {/* 4. Ctrl+K Spotlight Query overlay */}
      <CommandPalette />
    </div>
  );
}
