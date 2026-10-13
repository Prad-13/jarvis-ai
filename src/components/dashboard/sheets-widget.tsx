'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, RefreshCw, Sparkles, TableProperties } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function SheetsWidget() {
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const googleConnected = useJarvisStore((state) => state.googleConnected);

  const { data: rows = [], isLoading, isFetching, refetch } = useQuery<any[][]>({
    queryKey: ['sheet-data'],
    queryFn: async () => {
      const res = await fetch('/api/google/sheets?range=Sheet1!A1:E20');
      if (!res.ok) throw new Error('Sheets query failed');
      return res.json();
    },
    enabled: googleConnected,
  });

  const handleAnalyze = () => {
    setChatPanelOpen(true);
    addMessage({
      role: 'user',
      content: 'Read my connected Google Spreadsheet and summarize the key data, trends, and any notable values.'
    });
  };

  // Header row and data rows
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Sheets</span>
        </div>

        <div className="flex items-center gap-2.5">
          {googleConnected && rows.length > 0 && (
            <button
              onClick={handleAnalyze}
              className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analyze</span>
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="text-slate-500 hover:text-emerald-400 transition"
            disabled={isFetching || !googleConnected}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-6 w-full bg-slate-800/80 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="h-5 flex-1 bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-800 rounded" />
                <div className="h-5 w-16 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : !googleConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <TableProperties className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">Sheets not connected</p>
              <p className="text-slate-600 mt-1">Connect Google Workspace to view spreadsheets.</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <FileSpreadsheet className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">No spreadsheet data</p>
              <p className="text-slate-600 mt-1">
                Set a spreadsheet ID in your{' '}
                <a href="/settings" className="text-emerald-400 hover:underline">settings</a> to preview data here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono border-collapse min-w-[300px]">
              {/* Table header */}
              {headerRow && (
                <thead>
                  <tr className="border-b border-white/5">
                    {headerRow.map((cell: string, ci: number) => (
                      <th
                        key={ci}
                        className="text-left py-1.5 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {dataRows.map((row, ri) => (
                  <motion.tr
                    key={ri}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ri * 0.04 }}
                    className="border-b border-white/3 hover:bg-white/3 transition group"
                  >
                    {row.map((cell: any, ci: number) => (
                      <td
                        key={ci}
                        className={cn(
                          'py-1.5 px-2 whitespace-nowrap',
                          ci === 0 ? 'text-slate-300 font-semibold' : 'text-slate-500'
                        )}
                      >
                        {cell ?? ''}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer action */}
      {googleConnected && rows.length > 0 && (
        <div className="pt-3 border-t border-white/5 mt-2 shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">{dataRows.length} row{dataRows.length !== 1 ? 's' : ''} loaded</span>
          <button
            onClick={handleAnalyze}
            className="text-[10px] font-mono text-emerald-400/70 hover:text-emerald-400 flex items-center gap-1 transition"
          >
            <Sparkles className="h-3 w-3" />
            Run AI analysis
          </button>
        </div>
      )}
    </div>
  );
}
