'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Send, Image as ImageIcon, Eye, Code, Smile, Bold, Italic, List, Link as LinkIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { VoiceInput } from '@/app/components/VoiceInput';

interface ForumEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  minHeight?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  showCancel?: boolean;
  className?: string;
  markdownComponents?: any; // To maintain styling consistency
}

export function ForumEditor({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder = "Was brennt dir auf der Seele?",
  minHeight = "200px",
  autoFocus = false,
  onCancel,
  submitLabel = "Posten",
  showCancel = false,
  className = "",
  markdownComponents
}: ForumEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [emojiPickerSize, setEmojiPickerSize] = useState({ width: 320, height: 400 });
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateEmojiPickerSize = () => {
      if (typeof window === 'undefined') return;
      const width = Math.max(260, Math.min(320, window.innerWidth - 32));
      const height = Math.max(260, Math.min(400, window.innerHeight - 260));
      setEmojiPickerSize({ width, height });
    };
    updateEmojiPickerSize();
    window.addEventListener('resize', updateEmojiPickerSize);
    return () => window.removeEventListener('resize', updateEmojiPickerSize);
  }, []);

  const insertText = (text: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = value.substring(0, start) + text + value.substring(end);
    
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const formatText = (format: 'bold' | 'italic' | 'list' | 'link') => {
    const textarea = editorRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selected = value.substring(start, end);
    const hasSelection = start !== end;

    const apply = (replacement: string, selectionStart: number, selectionEnd: number) => {
      const next = value.substring(0, start) + replacement + value.substring(end);
      onChange(next);
      if (textarea) {
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(selectionStart, selectionEnd);
        }, 0);
      }
    };

    if (format === 'bold') {
      const body = hasSelection ? selected : 'Fett';
      const replacement = `**${body}**`;
      apply(replacement, start + 2, start + 2 + body.length);
      return;
    }

    if (format === 'italic') {
      const body = hasSelection ? selected : 'Kursiv';
      const replacement = `_${body}_`;
      apply(replacement, start + 1, start + 1 + body.length);
      return;
    }

    if (format === 'link') {
      const text = hasSelection ? selected : 'Link Text';
      const url = 'https://';
      const replacement = `[${text}](${url})`;
      const urlStart = start + text.length + 3;
      apply(replacement, urlStart, urlStart + url.length);
      return;
    }

    const listText = hasSelection
      ? selected
          .split('\n')
          .map(line => (line.trim().length ? `- ${line}` : '- '))
          .join('\n')
      : '- Liste';
    const selectionStart = hasSelection ? start : start + 2;
    const selectionEnd = hasSelection ? start + listText.length : start + 2 + 'Liste'.length;
    apply(listText, selectionStart, selectionEnd);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertText(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setStatusMessage('❌ Bitte nur JPG, PNG, WEBP oder GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('❌ Max. 5 MB.');
      return;
    }

    setStatusMessage('🚀 Lädt...');
    try {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const response = await fetch(`/api/forum/upload?filename=${encodeURIComponent(safeName)}`, {
        method: 'POST',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });

      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Upload fehlgeschlagen');

      insertText(`\n![${file.name}](${data.url})\n`);
      setStatusMessage('✅');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (error: any) {
      setStatusMessage(`❌ Fehler`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <button type="button" onClick={() => formatText('bold')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => formatText('italic')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => formatText('list')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => formatText('link')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><LinkIcon className="w-4 h-4" /></button>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1.5 hover:bg-white/10 rounded-lg transition-all ${showEmojiPicker ? 'text-[#D4AF37] bg-white/10' : 'text-white/60 hover:text-white'}`}
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute left-0 bottom-full mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10" style={{ width: emojiPickerSize.width }}>
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={handleEmojiClick}
                  emojiStyle={EmojiStyle.NATIVE}
                  width={emojiPickerSize.width}
                  height={emojiPickerSize.height}
                />
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-[#D4AF37] transition-all"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
          
          <VoiceInput variant="icon" onTranscript={insertText} />
        </div>
        
        <div className="flex-1" />

        <button 
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${ 
            isPreview ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          {isPreview ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
          {isPreview ? 'Editor' : 'Vorschau'}
        </button>
      </div>

      {/* Input Area */}
      <div className="relative" style={{ minHeight }}>
        {isPreview ? (
          <div className="prose prose-invert prose-sm max-w-none p-4 bg-white/3 border border-white/5 rounded-2xl h-full overflow-y-auto" style={{ minHeight }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {value || '*Vorschau...*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={editorRef}
            autoFocus={autoFocus}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full bg-white/3 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/10 outline-none focus:border-[#D4AF37] transition-all resize-none"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-end gap-3">
        {statusMessage && <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{statusMessage}</span>}
        {showCancel && onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Abbrechen</button>
        )}
        <button 
          type="button"
          onClick={onSubmit} 
          disabled={isSubmitting || !value.trim()}
          className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-20 hover:brightness-110 transition-all flex items-center gap-2"
        >
          {isSubmitting ? '...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
