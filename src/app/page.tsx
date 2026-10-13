'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Calendar, FileSpreadsheet, Cpu, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      setIsLoadingAuth(false);
    }
  };

  const handleSandboxEnter = () => {
    router.push('/dashboard');
  };

  const features = [
    {
      icon: Mail,
      title: 'Gmail',
      text: 'Prioritize, draft replies, and stay on top of your inbox with natural language.',
    },
    {
      icon: Calendar,
      title: 'Calendar',
      text: 'View your schedule, resolve conflicts, and schedule meetings instantly.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Drive & Sheets',
      text: 'Audit spreadsheets, summarize documents, and append data on demand.',
    },
    {
      icon: Cpu,
      title: 'Memory',
      text: 'Jarvis remembers your preferences and adapts your daily briefing over time.',
    }
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col bg-cyber-bg overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 cyber-grid opacity-100 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-cyan-500/6 via-blue-600/4 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 w-full flex justify-between items-center px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">Jarvis AI</span>
        </div>
        <button
          onClick={handleSandboxEnter}
          className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1.5"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            Powered by Gemini 2.5 Flash
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Your Google Workspace,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              intelligently connected
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            Jarvis unifies your Gmail, Calendar, Drive, and Tasks into a single AI-powered interface.
            Get briefed, take action, and stay focused — all through natural conversation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoadingAuth}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(6,182,212,0.25)] hover:shadow-[0_4px_32px_rgba(6,182,212,0.4)] transition-all duration-200 disabled:opacity-50"
            >
              {isLoadingAuth ? 'Connecting...' : 'Connect Google Workspace'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSandboxEnter}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-sm transition-all duration-200"
            >
              Explore Guest Mode
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            OAuth 2.0 secured · Tokens stored locally
          </div>
        </motion.div>
      </main>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl mx-auto px-8 pb-20"
      >
        <div className="border-t border-white/5 pt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card p-5 rounded-xl group hover:border-white/10 transition-all duration-200"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/8 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all duration-200 mb-4">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1.5">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.text}</p>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
