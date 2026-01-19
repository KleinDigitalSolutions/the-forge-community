'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'de-DE'; // German

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  async function toggleListening() {
    if (!recognitionRef.current) return;

    if (isListening) {
      // Stop & polish text
      recognitionRef.current.stop();
      setIsListening(false);

      if (transcript.trim()) {
        await polishText(transcript);
      }
    } else {
      // Start listening
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  async function polishText(rawText: string) {
    setIsPolishing(true);
    try {
      const response = await fetch('/api/voice/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });

      if (!response.ok) throw new Error('Polish failed');

      const data = await response.json();
      onTranscript(data.polished);
      setTranscript('');
    } catch (error) {
      console.error('Text polishing failed:', error);
      // Fallback: use raw transcript
      onTranscript(rawText);
    } finally {
      setIsPolishing(false);
    }
  }

  if (!supported) {
    return null; // Hide button if not supported
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={isPolishing}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
        } disabled:opacity-50`}
      >
        {isPolishing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI poliert...
          </>
        ) : isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            Stop
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Diktieren
          </>
        )}
      </button>

      {/* Live Transcript Preview */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 min-w-[300px] max-w-[500px] z-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">
                Aufnahme läuft...
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              {transcript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
