'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, RefreshCw, MapPin, Video, Trash2, CalendarPlus, CalendarX } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  status: string;
}

export function AgendaWidget() {
  const queryClient = useQueryClient();
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const googleConnected = useJarvisStore((state) => state.googleConnected);

  const { data: events = [], isLoading, isFetching, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/google/calendar?limit=5');
      if (!res.ok) throw new Error('Calendar fetch error');
      return res.json();
    },
    refetchInterval: 90000,
    enabled: googleConnected,
  });

  const cancelMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await fetch(`/api/google/calendar?eventId=${eventId}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const handleCreateMeeting = () => {
    setChatPanelOpen(true);
    addMessage({ role: 'user', content: 'Schedule a new calendar meeting.' });
  };

  const formatEventTime = (startIso: string, endIso: string) => {
    try {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${fmt(start)} – ${fmt(end)}`;
    } catch {
      return 'All Day';
    }
  };

  const getCountdown = (startIso: string): string | null => {
    try {
      const diff = new Date(startIso).getTime() - Date.now();
      if (diff <= 0) return null;
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `in ${mins}m`;
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return `in ${hrs}h${rem > 0 ? ` ${rem}m` : ''}`;
    } catch {
      return null;
    }
  };

  const isCurrentEvent = (startIso: string, endIso: string) => {
    try {
      const now = Date.now();
      return now >= new Date(startIso).getTime() && now <= new Date(endIso).getTime();
    } catch {
      return false;
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Agenda</span>
          {events.length > 0 && (
            <span className="text-[9px] font-mono text-slate-500">{events.length} upcoming</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateMeeting}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            title="Create meeting"
          >
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
          <button
            onClick={() => refetch()}
            className="text-slate-500 hover:text-cyan-400 transition"
            disabled={isFetching || !googleConnected}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Events timeline */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 relative">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-slate-800" />
                <div className="w-[1px] flex-1 bg-slate-800 mt-1" />
              </div>
              <div className="flex-1 p-3 border border-white/5 bg-white/5 rounded-lg space-y-2 mb-4">
                <div className="h-3 w-16 bg-slate-800 rounded" />
                <div className="h-3.5 w-36 bg-slate-800 rounded" />
                <div className="h-2.5 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))
        ) : !googleConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <CalendarX className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">Calendar not connected</p>
              <p className="text-slate-600 mt-1">Connect Google Workspace to see your schedule.</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <Calendar className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">No events scheduled</p>
              <p className="text-slate-600 mt-1">Your calendar is clear. Enjoy the focus time.</p>
            </div>
          </div>
        ) : (
          <div className="relative pl-3 border-l border-white/5 space-y-4">
            {events.map((event, i) => {
              const active = isCurrentEvent(event.start, event.end);
              const countdown = getCountdown(event.start);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute -left-[16.5px] top-2 h-2.5 w-2.5 rounded-full border bg-slate-950 transition-all duration-300',
                    active
                      ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] scale-110'
                      : 'border-white/20 group-hover:border-cyan-500/50'
                  )} />

                  <div className={cn(
                    'p-3 rounded-lg border text-left transition',
                    active
                      ? 'bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                      : 'bg-slate-950/20 border-white/5 group-hover:border-white/10'
                  )}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-semibold text-cyan-400 shrink-0">
                        {formatEventTime(event.start, event.end)}
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        {active && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 uppercase tracking-widest">
                            <span className="animate-ping inline-flex h-1 w-1 rounded-full bg-slate-950 opacity-75" />
                            Live
                          </span>
                        )}
                        {!active && countdown && (
                          <span className="text-[9px] font-mono text-slate-500">{countdown}</span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mt-1 leading-snug truncate pr-8">
                      {event.summary}
                    </h4>

                    {event.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{event.description}</p>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-mono">
                        {event.location.toLowerCase().includes('meet') || event.location.startsWith('http') ? (
                          <>
                            <Video className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <a
                              href={event.location.startsWith('http') ? event.location : '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline truncate"
                            >
                              Join Google Meet
                            </a>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Cancel action on hover */}
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition duration-150">
                      <button
                        onClick={() => cancelMutation.mutate(event.id)}
                        className="p-1 rounded bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition"
                        title="Cancel event"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
