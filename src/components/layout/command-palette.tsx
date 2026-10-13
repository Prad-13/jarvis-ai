'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Mail, FileText, Settings, ShieldAlert, Cpu, Trash2, Command } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';

export function CommandPalette() {
  const isOpen = useJarvisStore((state) => state.commandPaletteOpen);
  const setOpen = useJarvisStore((state) => state.setCommandPaletteOpen);
  const setActiveTab = useJarvisStore((state) => state.setActiveTab);
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const clearChat = useJarvisStore((state) => state.clearChat);
  const googleConnected = useJarvisStore((state) => state.googleConnected);
  
  const [query, setQuery] = useState('');

  // Handle Ctrl+K shortcut key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  const items = [
    {
      icon: Cpu,
      label: 'Navigate to Dashboard',
      subtitle: 'Open the core JARVIS interface',
      category: 'Navigation',
      action: () => {
        setActiveTab('dashboard');
        setOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Navigate to Settings',
      subtitle: 'Manage API keys and security control panels',
      category: 'Navigation',
      action: () => {
        setActiveTab('settings');
        setOpen(false);
      }
    },
    {
      icon: Mail,
      label: 'Ask JARVIS: Summarize primary emails',
      subtitle: 'Analyzes latest incoming messages',
      category: 'AI Commands',
      action: () => {
        setChatPanelOpen(true);
        addMessage({ role: 'user', content: 'Summarize my recent primary emails, please.' });
        setOpen(false);
      }
    },
    {
      icon: Calendar,
      label: 'Ask JARVIS: View today\'s schedule',
      subtitle: 'Retrieves calendar calendar meetings',
      category: 'AI Commands',
      action: () => {
        setChatPanelOpen(true);
        addMessage({ role: 'user', content: 'Show me my schedule for today.' });
        setOpen(false);
      }
    },
    {
      icon: FileText,
      label: 'Ask JARVIS: Analyze Q3 expense sheet',
      subtitle: 'Reads default sales/budget spreadsheet data',
      category: 'AI Commands',
      action: () => {
        setChatPanelOpen(true);
        addMessage({ role: 'user', content: 'Can you read the Q3 expense spreadsheet and summarize actual spent values?' });
        setOpen(false);
      }
    },
    {
      icon: Trash2,
      label: 'System reset: Clear chat log',
      subtitle: 'Clears current conversation memory buffer',
      category: 'System',
      action: () => {
        clearChat();
        setOpen(false);
      }
    },
    {
      icon: ShieldAlert,
      label: googleConnected ? 'Disconnect Google Account' : 'Connect Google Workspace Account',
      subtitle: googleConnected ? 'Sign out from Google session' : 'Perform Google OAuth 2.0 validation sync',
      category: 'System',
      action: async () => {
        if (googleConnected) {
          await fetch('/api/auth/session', { method: 'DELETE' });
          window.location.reload();
        } else {
          try {
            const res = await fetch('/api/auth/url');
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          } catch (e) {
            console.error('OAuth fail:', e);
          }
        }
        setOpen(false);
      }
    }
  ];

  // Filter items based on search input
  const filtered = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Dialog Container */}
          <motion.div 
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0a0a18]/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Input Area */}
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                className="flex-1 bg-transparent text-base text-slate-100 placeholder-slate-500 outline-none"
                placeholder="Search command panel or ask JARVIS..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </div>

            {/* Results Area */}
            <div className="max-h-[380px] overflow-y-auto px-2 py-3">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No system processes or actions found for "{query}"
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group items by category */}
                  {['Navigation', 'AI Commands', 'System'].map((cat) => {
                    const catItems = filtered.filter(i => i.category === cat);
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          {cat}
                        </div>
                        {catItems.map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={idx}
                              onClick={item.action}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-cyan-500/10 hover:text-white text-slate-300 group"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 border border-white/5 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="text-xs text-slate-500 group-hover:text-slate-400">{item.subtitle}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-[10px] text-slate-500 bg-black/40">
              <div>Type to filter, press Enter to execute</div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10">ESC</span> to close
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
