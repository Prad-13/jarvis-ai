'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '../../components/layout/sidebar';
import { ChatPanel } from '../../components/chat/chat-panel';
import { CommandPalette } from '../../components/layout/command-palette';
import {
  Settings, Key, Shield, Brain, Trash2, Plus,
  Link2, RefreshCw, Download, AlertTriangle, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';

interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'bio' | 'rule' | 'general';
  createdAt: string;
}

const CATEGORY_COLORS: Record<MemoryItem['category'], string> = {
  preference: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  bio:        'text-purple-400 bg-purple-500/10 border-purple-500/20',
  rule:       'text-amber-400 bg-amber-500/10 border-amber-500/20',
  general:    'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const googleConnected = useJarvisStore((state) => state.googleConnected);
  const googleUser = useJarvisStore((state) => state.googleUser);

  const [memoryInput, setMemoryInput] = useState('');
  const [memoryCategory, setMemoryCategory] = useState<MemoryItem['category']>('general');
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: memories = [], isLoading, isFetching, refetch } = useQuery<MemoryItem[]>({
    queryKey: ['memories'],
    queryFn: async () => {
      const res = await fetch('/api/memory');
      if (!res.ok) throw new Error('Failed to fetch memories');
      return res.json();
    },
  });

  const addMemoryMutation = useMutation({
    mutationFn: async (payload: { content: string; category: string }) => {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setMemoryInput('');
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memories'] }),
  });

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryInput.trim()) return;
    addMemoryMutation.mutate({ content: memoryInput.trim(), category: memoryCategory });
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      const res = await fetch('/api/auth/session', { method: 'DELETE' });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = () => {
    const backup = { timestamp: new Date().toISOString(), memories };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `jarvis_backup_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg relative">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto px-6 lg:px-10 py-8 z-10 space-y-6 max-w-3xl">
        {/* Page header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-slate-400">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Settings</h1>
            <p className="text-xs text-slate-500">Manage your connections, AI model, and memory.</p>
          </div>
        </div>

        {/* AI Model */}
        <section className="glass-card p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-400" />
            AI Model
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Model</label>
              <select
                className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-500/30 transition"
                defaultValue="gemini-2.5-flash"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (default)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none pr-16 font-mono"
                  value={process.env.NEXT_PUBLIC_GEMINI_KEY_HINT ?? '••••••••••••••••••••'}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Google Connection */}
        <section className="glass-card p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            Google Workspace
          </h2>

          {googleConnected ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-200">Connected</div>
                  <div className="text-xs text-slate-500 truncate">{googleUser?.email}</div>
                </div>
              </div>
              <button
                onClick={handleGoogleDisconnect}
                className="py-1.5 px-3 rounded-lg bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 text-xs text-red-400 hover:text-red-300 transition font-medium shrink-0"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/5 border border-amber-500/15 gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-amber-400">Not connected</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable Gmail, Calendar, Tasks, Drive, and Sheets.
                </p>
              </div>
              <button
                onClick={handleGoogleConnect}
                className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition text-xs shrink-0 flex items-center gap-1.5"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect
              </button>
            </div>
          )}
        </section>

        {/* Memory */}
        <section className="glass-card p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Brain className="h-4 w-4 text-slate-400" />
              Memory
            </h2>
            <button
              onClick={() => refetch()}
              className="text-slate-500 hover:text-slate-300 transition"
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            </button>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/3 border border-white/5 animate-pulse rounded-lg" />
              ))
            ) : memories.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No memories saved yet.</p>
            ) : (
              memories.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/3 border border-white/5 group"
                >
                  <div className="flex items-center gap-2.5 flex-1 pr-4 min-w-0">
                    <span className={cn('text-[10px] font-semibold border px-1.5 py-0.5 rounded shrink-0 uppercase', CATEGORY_COLORS[item.category])}>
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-300 truncate">{item.content}</span>
                  </div>
                  <button
                    onClick={() => deleteMemoryMutation.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddMemory} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
            <input
              className="flex-1 bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-sm placeholder-slate-600 outline-none text-slate-200 focus:border-cyan-500/30 transition"
              placeholder="Something for Jarvis to remember..."
              value={memoryInput}
              onChange={(e) => setMemoryInput(e.target.value)}
              disabled={addMemoryMutation.isPending}
            />
            <div className="flex gap-2">
              <select
                className="bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500/30 transition"
                value={memoryCategory}
                onChange={(e) => setMemoryCategory(e.target.value as MemoryItem['category'])}
              >
                <option value="preference">Preference</option>
                <option value="bio">Bio</option>
                <option value="rule">Rule</option>
                <option value="general">General</option>
              </select>
              <button
                type="submit"
                disabled={!memoryInput.trim() || addMemoryMutation.isPending}
                className="py-2 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-slate-600 text-slate-950 font-semibold rounded-lg transition text-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Save
              </button>
            </div>
          </form>
        </section>

        {/* Data */}
        <section className="glass-card p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-400" />
            Data & Backup
          </h2>
          <button
            onClick={handleExportData}
            className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 text-slate-300 hover:text-white font-medium transition text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export data
          </button>
        </section>
      </main>

      <ChatPanel />
      <CommandPalette />
    </div>
  );
}
