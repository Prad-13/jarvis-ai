'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Square, Trash2, Plus, Sparkles, RefreshCw, ListChecks } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  dueDate?: string;
  createdAt: string;
}

export function TasksWidget() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const googleConnected = useJarvisStore((state) => state.googleConnected);

  const { data: tasks = [], isLoading, isFetching, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Tasks fetch failed');
      return res.json();
    },
    enabled: googleConnected,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Create task failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTitle('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) => {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: status === 'pending' ? 'completed' : 'pending' }),
      });
      if (!res.ok) throw new Error('Toggle task failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !googleConnected) return;
    addTaskMutation.mutate(newTitle.trim());
  };

  const handlePrioritize = () => {
    setChatPanelOpen(true);
    addMessage({ role: 'user', content: 'Analyze my Google Tasks and prioritize them by importance and urgency.' });
  };

  const pending = tasks.filter((t) => t.status === 'pending');
  const completed = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CheckSquare className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Tasks</span>
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-cyan-500/20 text-[9px] font-bold text-cyan-400">
              {pending.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {googleConnected && (
            <button
              onClick={handlePrioritize}
              className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prioritize</span>
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="text-slate-500 hover:text-cyan-400 transition"
            disabled={isFetching || !googleConnected}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
              <div className="h-4 w-4 bg-slate-800 rounded" />
              <div className="h-3.5 w-2/3 bg-slate-800 rounded" />
            </div>
          ))
        ) : !googleConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <ListChecks className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">Tasks not connected</p>
              <p className="text-slate-600 mt-1">Connect Google Workspace to manage your tasks.</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <CheckSquare className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">All tasks cleared</p>
              <p className="text-slate-600 mt-1">No pending tasks in Google Tasks.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {/* Pending first */}
            {pending.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-white/5 border-white/5 hover:border-cyan-500/10 text-slate-200 group relative transition"
              >
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: task.id, status: task.status })}
                  className="text-slate-500 hover:text-cyan-400 transition shrink-0"
                >
                  <Square className="h-4 w-4" />
                </button>
                <span className="text-xs flex-1 truncate pr-8 leading-normal select-none">{task.title}</span>
                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 transition p-1 hover:text-red-400 text-slate-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}

            {/* Completed (dim) */}
            {completed.slice(0, 3).map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-slate-950/20 border-white/5 text-slate-500 group relative transition"
              >
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: task.id, status: task.status })}
                  className="text-cyan-400/50 hover:text-cyan-400 transition shrink-0"
                >
                  <CheckSquare className="h-4 w-4" />
                </button>
                <span className="text-xs flex-1 truncate pr-8 leading-normal select-none line-through">{task.title}</span>
                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 transition p-1 hover:text-red-400 text-slate-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Quick-add form */}
      <form onSubmit={handleAddTask} className="flex gap-2 shrink-0 pt-2 border-t border-white/5 mt-auto">
        <input
          className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs placeholder-slate-600 outline-none text-slate-200 focus:border-cyan-500/30 disabled:opacity-40"
          placeholder={googleConnected ? 'Add to Google Tasks...' : 'Connect Google to add tasks'}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={addTaskMutation.isPending || !googleConnected}
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || addTaskMutation.isPending || !googleConnected}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 transition shrink-0"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
