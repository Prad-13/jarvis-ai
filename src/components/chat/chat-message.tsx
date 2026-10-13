'use client';

import React from 'react';
import { Cpu, User, CheckCircle, XCircle, Terminal, Clipboard } from 'lucide-react';
import { ChatMessage } from '../../lib/store/jarvis-store';
import { cn } from '../../lib/utils';

export function ChatMessageView({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  // Custom minimal Markdown + Table Parser for premium styling
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    const parts = [];
    const lines = text.split('\n');
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let codeBlockContent: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Code Block Detection
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // Close Code Block
          parts.push(
            <div key={`code-${i}`} className="my-3 rounded-lg border border-cyan-500/20 bg-black/80 font-mono text-xs overflow-hidden shadow-md">
              <div className="flex items-center justify-between bg-white/5 px-4 py-1.5 text-[10px] text-slate-500 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Terminal className="h-3.5 w-3.5" />
                  {codeLanguage || 'terminal'}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(codeBlockContent.join('\n'))}
                  className="hover:text-slate-300 transition flex items-center gap-1"
                >
                  <Clipboard className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-300">
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Open Code Block
          inCodeBlock = true;
          codeLanguage = line.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(lines[i]); // Keep original formatting
        continue;
      }

      // Markdown Table Detection
      if (line.startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHeaders = line.split('|').map(s => s.trim()).filter(s => s);
          tableRows = [];
        } else if (line.includes('---')) {
          // Separator row, skip
          continue;
        } else {
          const cells = line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableRows.push(cells);
        }
        continue;
      }

      if (inTable && !line.startsWith('|')) {
        // Table finished, render table first
        parts.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-white/5 bg-slate-950/40">
            <table className="min-w-full divide-y divide-white/5 text-xs text-left">
              <thead className="bg-white/5 text-[10px] text-cyan-400 tracking-wider font-semibold uppercase">
                <tr>
                  {tableHeaders.map((h, idx) => (
                    <th key={idx} className="px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-cyan-500/5 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 max-w-[200px] truncate" title={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
      }

      // Normal parsing for bold (**), lists (- or *), etc.
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.substring(2);
        parts.push(
          <li key={`list-${i}`} className="ml-4 list-disc text-[13px] leading-relaxed text-slate-300 pl-1 py-0.5">
            {parseInlineStyling(itemText)}
          </li>
        );
      } else if (line.startsWith('### ')) {
        parts.push(<h4 key={`h3-${i}`} className="text-xs font-semibold text-cyan-400 mt-4 mb-1.5 uppercase tracking-wide">{line.substring(4)}</h4>);
      } else if (line.startsWith('## ')) {
        parts.push(<h3 key={`h2-${i}`} className="text-sm font-semibold text-slate-100 mt-4 mb-2 border-b border-white/8 pb-1.5">{line.substring(3)}</h3>);
      } else if (line) {
        parts.push(<p key={`p-${i}`} className="text-[13px] leading-relaxed text-slate-300 py-0.5">{parseInlineStyling(lines[i])}</p>);
      }
    }

    // Edge case if table runs until end of input
    if (inTable) {
      parts.push(
        <div key="table-end" className="my-3 overflow-x-auto rounded-lg border border-white/5 bg-slate-950/40">
          <table className="min-w-full divide-y divide-white/5 text-xs text-left">
            <thead className="bg-white/5 text-[10px] text-cyan-400 tracking-wider font-semibold uppercase">
              <tr>
                {tableHeaders.map((h, idx) => (
                  <th key={idx} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-cyan-500/5 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 truncate max-w-[200px]">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return parts;
  };

  const parseInlineStyling = (text: string) => {
    // Basic parser for **bold**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="text-cyan-400 font-semibold">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div
      className={cn(
        "flex gap-4 items-start w-full group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Icon Node */}
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded shrink-0",
          isUser
            ? "bg-cyan-500/10 border border-cyan-400/20 text-cyan-400"
            : "bg-slate-900 border border-white/5 text-slate-400"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4 text-purple-400" />}
      </div>

      {/* Message Balloon */}
      <div className="flex-1 max-w-[80%] space-y-2">
        <div
          className={cn(
            "rounded-xl px-4 py-3 leading-relaxed",
            isUser
              ? "bg-white/6 border border-white/10 text-slate-200 text-sm"
              : "bg-white/3 border border-white/5 text-slate-300 text-[13px]"
          )}
        >
          {renderMessageContent(message.content)}
        </div>

        {/* Executed Tools Indicators */}
        {!isUser && message.tools && message.tools.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {message.tools.map((t, idx) => {
              const SuccessIcon = t.status === 'success' ? CheckCircle : XCircle;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border",
                    t.status === 'success'
                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                      : "bg-red-950/20 border-red-500/20 text-red-400"
                  )}
                >
                  <SuccessIcon className="h-3 w-3" />
                  <span>{t.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
