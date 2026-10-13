'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Mic, FileUp, Cpu, X, RefreshCw, Volume2 } from 'lucide-react';
import { useJarvisStore, ChatMessage } from '../../lib/store/jarvis-store';
import { ChatMessageView } from './chat-message';
import { VoiceInput } from './voice-input';
import { FileUpload } from './file-upload';
import { cn } from '../../lib/utils';

export function ChatPanel() {
  const isOpen = useJarvisStore((state) => state.chatPanelOpen);
  const setOpen = useJarvisStore((state) => state.setChatPanelOpen);
  const messages = useJarvisStore((state) => state.messages);
  const addMessage = useJarvisStore((state) => state.addMessage);
  const updateLastMessageContent = useJarvisStore((state) => state.updateLastMessageContent);
  const updateLastMessageTools = useJarvisStore((state) => state.updateLastMessageTools);
  const isStreaming = useJarvisStore((state) => state.isStreaming);
  const setIsStreaming = useJarvisStore((state) => state.setIsStreaming);
  const statusMessage = useJarvisStore((state) => state.statusMessage);
  const setStatusMessage = useJarvisStore((state) => state.setStatusMessage);

  const [input, setInput] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll on new message or status updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusMessage]);

  const handleSubmit = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() && attachedFiles.length === 0) return;

    let finalPrompt = text;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(', ');
      finalPrompt += `\n\n[Attached Files: ${fileNames}]`;
    }

    // Add user message
    addMessage({ role: 'user', content: finalPrompt });
    setInput('');
    setAttachedFiles([]);
    setShowUpload(false);
    setIsStreaming(true);
    setStatusMessage('JARVIS is processing context...');

    // Place an empty assistant message to receive stream
    addMessage({ role: 'model', content: '' });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: useJarvisStore.getState().messages.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) throw new Error('API failed');
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Reader unavailable');

      let accumulatedText = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('JARVIS_STATUS:')) {
            const status = line.substring(14);
            setStatusMessage(status);
          } else if (line.startsWith('JARVIS_TOOLS:')) {
            const toolsJson = line.substring(13);
            try {
              const tools = JSON.parse(toolsJson);
              updateLastMessageTools(tools);
            } catch (e) {
              console.error('Failed to parse tools logs:', e);
            }
          } else if (line) {
            accumulatedText += line;
            updateLastMessageContent(line, true);
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      updateLastMessageContent('\n\n*Error: JARVIS connection offline. Google APIs could not be contacted.*', true);
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
    }
  };

  const suggestedPrompts = [
    'Check my agenda today',
    'Summarize my emails',
    'Analyze expenses sheet',
    'Schedule a sync tomorrow at 10 AM',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="w-[400px] h-screen border-l border-white/5 bg-[#070710]/95 backdrop-blur-xl flex flex-col z-30 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] shrink-0"
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header Panel */}
          <div className="h-16 px-5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm text-white">AI Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages scroll pane */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <ChatMessageView key={msg.id || idx} message={msg} />
            ))}

            {/* Processing indicator */}
            {statusMessage && (
              <div className="flex items-center gap-3 px-1">
                <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-spin shrink-0" />
                <span className="text-xs text-slate-400">{statusMessage}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Prompt suggestions */}
          {messages.length <= 1 && (
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(p)}
                  className="px-3 py-1.5 rounded-lg bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/15 text-xs text-slate-400 hover:text-slate-200 transition duration-150"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Upload panel overlay */}
          {showUpload && (
            <div className="px-6 py-3 border-t border-white/5 bg-slate-950/40">
              <FileUpload
                onClose={() => setShowUpload(false)}
                onFileAdded={(file) => setAttachedFiles(prev => [...prev, file])}
                attachedFiles={attachedFiles}
                onRemoveFile={(idx) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
              />
            </div>
          )}

          {/* Form input controls */}
          <div className="p-4 border-t border-white/5 space-y-2.5">
            <div className="relative flex items-center bg-white/4 border border-white/8 hover:border-white/12 focus-within:border-cyan-500/30 rounded-xl px-4 py-3 transition-colors duration-150">
              
              {/* File Upload button */}
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className={cn(
                  "p-1.5 text-slate-400 hover:text-cyan-400 transition mr-2",
                  showUpload && "text-cyan-400"
                )}
                title="Attach sheet or documents"
              >
                <FileUp className="h-4 w-4" />
              </button>

              {/* Text Input */}
              <input
                className="flex-1 bg-transparent text-sm placeholder-slate-600 text-slate-200 outline-none pr-10"
                placeholder={isStreaming ? "Thinking..." : "Ask Jarvis anything..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={isStreaming}
              />

              {/* Voice microphone button */}
              <button
                type="button"
                onClick={() => setShowVoice(true)}
                className="absolute right-14 text-slate-400 hover:text-cyan-400 transition p-1.5"
                title="Simulate speech voice input"
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Submit button */}
              <button
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && attachedFiles.length === 0) || isStreaming}
                className="absolute right-4 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 transition"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>

          {/* Voice Input dialog overlay */}
          <VoiceInput
            isOpen={showVoice}
            onClose={() => setShowVoice(false)}
            onTranscript={(text) => {
              setInput(text);
              handleSubmit(text);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
