'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Wait, "mramer-motion" is a typo! It should be "framer-motion". I will fix it.
import { Mic, X, Volume2, Sparkles } from 'lucide-react';

interface VoiceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export function VoiceInput({ isOpen, onClose, onTranscript }: VoiceInputProps) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setTranscript('Listening for query inputs...');
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          setTimeout(() => {
            onTranscript(text);
            onClose();
          }, 1500);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event);
          setIsListening(false);
          setTranscript('Vocal synchronization lost. Attempting offline simulation...');
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [onTranscript, onClose]);

  // Start speech recognition
  useEffect(() => {
    if (isOpen) {
      setTranscript('Activating audio matrix...');
      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error starting recognition:', e);
          simulateVocalInput();
        }
      } else {
        simulateVocalInput();
      }
    } else {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setTranscript('');
    }
  }, [isOpen, recognition]);

  // Cyberpunk simulator in case microphone is unavailable
  const simulateVocalInput = () => {
    setIsListening(true);
    const samplePhrases = [
      'Show my agenda for this afternoon',
      'Summarize recent emails from John',
      'Read expenses sheet statistics',
      'Create meeting with product designers tomorrow at 3 PM',
    ];
    
    // Pick a random phrase
    const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    
    // Simulate typing
    let currentText = '';
    let charIdx = 0;
    
    setTimeout(() => {
      setTranscript('Vocal pattern detected: ');
      
      const interval = setInterval(() => {
        if (charIdx < randomPhrase.length) {
          currentText += randomPhrase[charIdx];
          setTranscript('Vocal input: "' + currentText + '"');
          charIdx++;
        } else {
          clearInterval(interval);
          setIsListening(false);
          setTimeout(() => {
            onTranscript(randomPhrase);
            onClose();
          }, 1500);
        }
      }, 50);
    }, 2000);
  };

  const handleSampleClick = (phrase: string) => {
    setTranscript(`Selected input: "${phrase}"`);
    setIsListening(false);
    setTimeout(() => {
      onTranscript(phrase);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog content */}
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/90 shadow-[0_0_50px_rgba(6,182,212,0.25)] p-6 relative flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition p-1"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Glowing Orb */}
            <div className="relative mt-8 mb-6 flex h-24 w-24 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-500/20"
                animate={{
                  scale: isListening ? [1, 1.4, 1] : 1,
                  opacity: isListening ? [0.6, 0.2, 0.6] : 0.6,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute h-16 w-16 rounded-full bg-cyan-950/40 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                animate={{
                  scale: isListening ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Mic className="h-7 w-7" />
              </motion.div>
            </div>

            {/* Bouncing Audio Waveform */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-8 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-1 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full"
                    animate={{
                      height: [8, Math.random() * 24 + 8, 8],
                    }}
                    transition={{
                      duration: 0.6 + Math.random() * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}

            <div className="text-center space-y-2 mb-8">
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase flex items-center justify-center gap-1.5">
                <Volume2 className="h-4 w-4 text-cyan-400" />
                Vocal Matrix Active
              </h3>
              <p className="text-xs text-slate-400 px-4 min-h-[36px] font-mono leading-relaxed">
                {transcript}
              </p>
            </div>

            {/* Suggested vocal templates */}
            <div className="w-full border-t border-white/5 pt-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-500" />
                Vocal Interface Suggestions
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Check my agenda today',
                  'Summarize my emails',
                  'Schedule meeting tomorrow at 10 AM',
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSampleClick(phrase)}
                    className="text-left w-full px-3 py-2 rounded bg-slate-900/60 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-[11px] text-slate-300 hover:text-white transition duration-200 font-mono truncate"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
