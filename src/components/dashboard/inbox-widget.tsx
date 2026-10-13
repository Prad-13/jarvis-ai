'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, RefreshCw, Archive, MessageSquareQuote, Inbox } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isUrgent: boolean;
  label: string;
}

export function InboxWidget() {
  const queryClient = useQueryClient();
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const googleConnected = useJarvisStore((state) => state.googleConnected);

  const { data: emails = [], isLoading, isFetching, refetch } = useQuery<Email[]>({
    queryKey: ['emails'],
    queryFn: async () => {
      const res = await fetch('/api/google/gmail?limit=5');
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    refetchInterval: 60000,
    enabled: googleConnected,
  });

  const archiveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await fetch('/api/google/gmail', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, action: 'archive' }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emails'] }),
  });

  const handleQuickReply = (email: Email) => {
    setChatPanelOpen(true);
    addMessage({
      role: 'user',
      content: `Draft a concise executive reply to ${email.from} regarding: "${email.subject}".`
    });
  };

  const getLabelColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'urgent':   return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'security': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'finance':  return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'work':     return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:         return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  const cleanSenderName = (fromStr: string) => {
    const match = fromStr.match(/^(.*?)\s*<.*>$/);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : fromStr;
  };

  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Mail className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Inbox</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-blue-500 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={() => refetch()}
          className="text-slate-500 hover:text-cyan-400 transition"
          disabled={isFetching || !googleConnected}
          title="Sync inbox"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 border border-white/5 bg-white/5 rounded-lg space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-slate-800 rounded" />
                <div className="h-3 w-12 bg-slate-800 rounded" />
              </div>
              <div className="h-3.5 w-48 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800 rounded" />
            </div>
          ))
        ) : !googleConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <Inbox className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">Gmail not connected</p>
              <p className="text-slate-600 mt-1">Connect Google Workspace to see your inbox.</p>
            </div>
          </div>
        ) : emails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <Mail className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">Inbox is clear</p>
              <p className="text-slate-600 mt-1">No unread emails in primary inbox.</p>
            </div>
          </div>
        ) : (
          emails.map((email, i) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'p-3 rounded-lg border text-left group transition relative overflow-hidden flex flex-col justify-between gap-1.5',
                email.isRead
                  ? 'bg-slate-950/20 border-white/5 text-slate-400'
                  : 'bg-white/5 border-blue-500/15 text-slate-200'
              )}
            >
              {/* Urgent indicator strip */}
              {!email.isRead && email.isUrgent && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 rounded-l" />
              )}

              {/* Sender & Timestamp */}
              <div className="flex items-center justify-between text-[10px] font-mono pl-1">
                <span className="font-semibold text-slate-300 group-hover:text-cyan-400 transition truncate max-w-[160px]">
                  {cleanSenderName(email.from)}
                </span>
                <span className="text-slate-500 shrink-0 ml-2">{formatRelativeTime(email.date)}</span>
              </div>

              {/* Subject & Label */}
              <div className="flex items-start gap-2 justify-between pl-1">
                <h4 className="text-xs font-semibold truncate flex-1 leading-snug">{email.subject}</h4>
                <span className={cn('text-[9px] font-semibold font-mono border px-1.5 py-0.5 rounded uppercase shrink-0', getLabelColor(email.label))}>
                  {email.label}
                </span>
              </div>

              {/* Snippet */}
              <p className="text-[11px] text-slate-500 truncate pl-1">{email.snippet}</p>

              {/* Hover quick actions */}
              <div className="flex gap-2 border-t border-white/5 pt-2 mt-1 opacity-0 group-hover:opacity-100 transition duration-200 justify-end shrink-0">
                <button
                  onClick={() => handleQuickReply(email)}
                  className="flex items-center gap-1.5 py-1 px-2 text-[10px] font-semibold rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition"
                >
                  <MessageSquareQuote className="h-3 w-3" />
                  Reply
                </button>
                <button
                  onClick={() => archiveMutation.mutate(email.id)}
                  className="flex items-center gap-1.5 py-1 px-2 text-[10px] font-semibold rounded bg-slate-900 border border-white/10 hover:border-slate-500/30 text-slate-400 hover:text-white transition"
                  title="Archive message"
                >
                  <Archive className="h-3 w-3" />
                  Archive
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
