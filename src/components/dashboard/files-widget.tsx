'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { File, FileSpreadsheet, FileText, Image, RefreshCw, Sparkles, ExternalLink, FolderOpen } from 'lucide-react';
import { useJarvisStore } from '../../lib/store/jarvis-store';
import { formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: string;
  webViewLink: string;
}

export function FilesWidget() {
  const setChatPanelOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const googleConnected = useJarvisStore((state) => state.googleConnected);

  const { data: files = [], isLoading, isFetching, refetch } = useQuery<DriveFile[]>({
    queryKey: ['drive-files'],
    queryFn: async () => {
      const res = await fetch('/api/google/drive?limit=5');
      if (!res.ok) throw new Error('Drive query failed');
      return res.json();
    },
    enabled: googleConnected,
  });

  const handleSummarize = (fileName: string) => {
    setChatPanelOpen(true);
    addMessage({
      role: 'user',
      content: `Summarize the Google Drive document named "${fileName}" — key sections, highlights, and action items.`
    });
  };

  const getFileIconAndColor = (mimeType: string) => {
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return { icon: FileText, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
      return { icon: FileSpreadsheet, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
    if (mimeType.includes('image') || mimeType.includes('fig')) {
      return { icon: Image, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return { icon: FileText, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
    return { icon: File, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
  };

  const getMimeLabel = (mimeType: string): string => {
    if (mimeType.includes('document')) return 'Doc';
    if (mimeType.includes('spreadsheet')) return 'Sheet';
    if (mimeType.includes('presentation')) return 'Slide';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'Image';
    if (mimeType.includes('folder')) return 'Folder';
    return 'File';
  };

  return (
    <div className="glass-card p-6 rounded-xl flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <FolderOpen className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Drive</span>
          {files.length > 0 && (
            <span className="text-[9px] font-mono text-slate-500">{files.length} recent</span>
          )}
        </div>

        <button
          onClick={() => refetch()}
          className="text-slate-500 hover:text-amber-400 transition"
          disabled={isFetching || !googleConnected}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 border border-white/5 bg-white/5 rounded-lg space-y-2 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-800 rounded shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 bg-slate-800 rounded" />
                  <div className="h-2.5 w-20 bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : !googleConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <FolderOpen className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">Drive not connected</p>
              <p className="text-slate-600 mt-1">Connect Google Workspace to browse your files.</p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8 gap-3">
            <File className="h-10 w-10 text-slate-700" />
            <div>
              <p className="font-semibold text-slate-400">No recent files</p>
              <p className="text-slate-600 mt-1">Your Drive is empty or no recent files found.</p>
            </div>
          </div>
        ) : (
          files.map((file, i) => {
            const { icon: Icon, color } = getFileIconAndColor(file.mimeType);
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg border border-white/5 bg-slate-950/20 hover:border-white/10 group flex items-start gap-3 relative transition"
              >
                {/* File icon */}
                <div className={cn('flex h-8 w-8 items-center justify-center rounded shrink-0 border', color)}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0 pr-12">
                  <h4
                    className="text-xs font-bold text-slate-200 truncate leading-snug group-hover:text-cyan-400 transition"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <div className="flex gap-2 items-center text-[10px] text-slate-500 mt-1 font-mono">
                    <span className="uppercase tracking-wider text-[9px]">{getMimeLabel(file.mimeType)}</span>
                    {file.size !== 'unknown' && (
                      <>
                        <span>·</span>
                        <span>{file.size}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Modified {formatRelativeTime(file.modifiedTime)}</span>
                  </div>
                </div>

                {/* Hover action buttons */}
                <div className="absolute right-3 top-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">
                  <button
                    onClick={() => handleSummarize(file.name)}
                    className="p-1.5 rounded bg-slate-900 border border-white/5 hover:border-cyan-500/20 text-slate-500 hover:text-cyan-400 transition"
                    title="Summarize with JARVIS"
                  >
                    <Sparkles className="h-3 w-3" />
                  </button>
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-slate-900 border border-white/5 hover:border-amber-500/20 text-slate-500 hover:text-amber-400 flex items-center justify-center transition"
                    title="Open in Google Drive"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
