'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, ChevronRight, Clock, CalendarDays, Wifi, WifiOff } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';

interface BriefData {
  brief: string | null;
  emailCount?: number;
  eventCount?: number;
  reason?: string;
  message?: string;
  error?: string;
}

export function GreetingWidget() {
  const googleConnected = useJarvisStore((state) => state.googleConnected);
  const userName = useJarvisStore((state) => state.googleUser?.name?.split(' ')[0] || 'Pradyumna');
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);

  const [time, setTime] = useState(new Date());
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);

  // Live clock — tick every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch AI brief when Google is connected
  useEffect(() => {
    if (googleConnected) {
      fetchBrief();
    }
  }, [googleConnected]);

  const fetchBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch('/api/google/brief');
      if (!res.ok) throw new Error('Brief fetch failed');
      const data = await res.json();
      setBrief(data);
    } catch (e) {
      console.error('Brief error:', e);
      setBrief(null);
    } finally {
      setBriefLoading(false);
    }
  };

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 5) return 'Good Night';
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
  };

  const formatTime = () =>
    time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

  const formatDate = () =>
    time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleAskBrief = () => {
    setChatPanelOpen(true);
    addMessage({ role: 'user', content: 'Give me a full executive daily brief — emails, calendar, tasks, and priorities.' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left: Greeting & Brief ─────────────────────────────────────────── */}
      <div className="lg:col-span-2 glass-card p-6 rounded-xl relative overflow-hidden flex flex-col justify-between min-h-[200px]">
        {/* Subtle ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/8 to-transparent pointer-events-none" />

        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            {/* Status pill */}
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
              {formatDate()}
            </div>

            {/* Greeting headline */}
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-1">
              {getGreeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {userName}.
              </span>
            </h1>
          </div>

          {/* Live clock */}
          <div className="text-right shrink-0">
            <div className="font-mono text-lg font-bold text-white tabular-nums">{formatTime()}</div>
            <div className={cn(
              "text-xs flex items-center justify-end gap-1 mt-1",
              googleConnected ? "text-emerald-400" : "text-slate-500"
            )}>
              {googleConnected
                ? <><Wifi className="h-3 w-3" /><span>Live</span></>
                : <><WifiOff className="h-3 w-3" /><span>Offline</span></>
              }
            </div>
          </div>
        </div>

        {/* ── AI Daily Brief Section ─────────────────────────────────────── */}
        <div className="mt-5 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">
                Daily Brief
              </span>
              {brief && (brief.emailCount !== undefined || brief.eventCount !== undefined) && (
                <span className="text-[9px] font-mono text-slate-500 ml-1">
                  ({brief.emailCount ?? 0} emails · {brief.eventCount ?? 0} events)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {googleConnected && (
                <button
                  onClick={fetchBrief}
                  disabled={briefLoading}
                  className="text-slate-500 hover:text-cyan-400 transition"
                  title="Regenerate brief"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', briefLoading && 'animate-spin')} />
                </button>
              )}
              {brief?.brief && (
                <button
                  onClick={() => setBriefExpanded((p) => !p)}
                  className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition flex items-center gap-0.5"
                >
                  {briefExpanded ? 'Collapse' : 'Expand'}
                  <ChevronRight className={cn('h-3 w-3 transition-transform', briefExpanded && 'rotate-90')} />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!googleConnected ? (
              <motion.div
                key="no-conn"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <CalendarDays className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Connect your Google Workspace to unlock your personalised AI daily brief — built from your real emails, calendar, and tasks.
                </p>
              </motion.div>
            ) : briefLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 animate-pulse"
              >
                {[80, 60, 90, 50].map((w, i) => (
                  <div key={i} className={`h-3 bg-slate-800 rounded`} style={{ width: `${w}%` }} />
                ))}
              </motion.div>
            ) : brief?.error || !brief?.brief ? (
              <motion.div
                key="error-or-empty"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5"
              >
                <Clock className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {brief?.message || 'No emails or calendar events found for today. Your slate is clear.'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="brief-content"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-[11px] text-slate-300 leading-relaxed overflow-hidden transition-all duration-300",
                  briefExpanded ? "max-h-[400px] overflow-y-auto" : "line-clamp-4 max-h-[72px]"
                )}
              >
                <div className="whitespace-pre-wrap prose-invert prose-xs font-sans">
                  {brief.brief}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA: Ask full brief in chat */}
          {googleConnected && (
            <button
              onClick={handleAskBrief}
              className="mt-3 text-xs text-cyan-500 hover:text-cyan-300 flex items-center gap-1.5 transition"
            >
              <Sparkles className="h-3 w-3" />
              Ask Jarvis for full briefing
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Right: Connection Status Panel ──────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/3 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            Workspace
          </span>
          <div className={cn(
            'h-1.5 w-1.5 rounded-full',
            googleConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-slate-600'
          )} />
        </div>

        {/* Service indicators */}
        <div className="space-y-2.5 flex-1">
          {[
            { name: 'Gmail', dot: googleConnected ? 'bg-blue-400' : 'bg-slate-700' },
            { name: 'Calendar', dot: googleConnected ? 'bg-purple-400' : 'bg-slate-700' },
            { name: 'Drive', dot: googleConnected ? 'bg-amber-400' : 'bg-slate-700' },
            { name: 'Tasks', dot: googleConnected ? 'bg-cyan-400' : 'bg-slate-700' },
            { name: 'Sheets', dot: googleConnected ? 'bg-emerald-400' : 'bg-slate-700' },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', svc.dot)} />
                <span className="text-xs text-slate-400">{svc.name}</span>
              </div>
              <span className={cn(
                'text-[11px] font-medium',
                googleConnected ? 'text-emerald-400' : 'text-slate-600'
              )}>
                {googleConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          ))}
        </div>

        {/* Gemini indicator */}
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs text-slate-400">Gemini 2.5 Flash</span>
            </div>
            <span className="text-[11px] font-medium text-violet-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
