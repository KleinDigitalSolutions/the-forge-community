'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Send, Image as ImageIcon, Eye, Code, Smile, Bold, Italic, List, Link as LinkIcon, X,
  Palette, Layout, Type, AlignLeft, AlignCenter, AlignRight, Maximize2, Minimize2
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
  markdownComponents?: any;
}

interface HeroSettings {
  bg?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const META_REGEX = /<!--metadata: ({[\s\S]*}) -->$/;

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
  const [showVisualTools, setShowVisualTools] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [emojiPickerSize, setEmojiPickerSize] = useState({ width: 320, height: 400 });
  const [heroSettings, setHeroSettings] = useState<HeroSettings>({
    color: '#ffffff',
    align: 'left',
    size: 'md'
  });

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Extract metadata on init
  useEffect(() => {
    const match = value.match(META_REGEX);
    if (match && match[1]) {
      try {
        const meta = JSON.parse(match[1]);
        setHeroSettings(prev => ({ ...prev, ...meta }));
        setShowVisualTools(true);
      } catch (e) { console.error('Meta parse error', e); }
    }
  }, []);

  // Update value with metadata when settings change
  useEffect(() => {
    if (!showVisualTools && !heroSettings.bg) return; // Don't add meta if not active

    const cleanValue = value.replace(META_REGEX, '').trimEnd();
    
    // If tools are closed and no BG is set, we might want to strip metadata. 
    // But let's keep it if tools are just hidden but settings exist.
    // Only strip if user explicitly wants "Plain Text" - for now we assume toggle means "show tools" not "enable mode".
    // Actually, let's treat `showVisualTools` as the toggle for "Visual Mode".
    
    if (showVisualTools) {
      const metaString = `\n\n<!--metadata: ${JSON.stringify(heroSettings)} -->`;
      if (value !== cleanValue + metaString) {
        // Avoid infinite loop if value creates new effect
        // We need to call onChange, but this is an effect... carefully.
        // Better: Don't update value in effect. Update value when settings change via handler.
      }
    }
  }, [heroSettings, showVisualTools]);

  const updateMetadata = (newSettings: Partial<HeroSettings>) => {
    const nextSettings = { ...heroSettings, ...newSettings };
    setHeroSettings(nextSettings);
    
    const cleanValue = value.replace(META_REGEX, '').trimEnd();
    const metaString = `\n\n<!--metadata: ${JSON.stringify(nextSettings)} -->`;
    onChange(cleanValue + metaString);
  };

  const toggleVisualMode = () => {
    if (showVisualTools) {
      // Turn off: remove metadata
      const cleanValue = value.replace(META_REGEX, '').trimEnd();
      onChange(cleanValue);
      setShowVisualTools(false);
    } else {
      // Turn on: add default metadata
      const metaString = `\n\n<!--metadata: ${JSON.stringify(heroSettings)} -->`;
      onChange(value.trimEnd() + metaString);
      setShowVisualTools(true);
    }
  };

  const insertText = (text: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value; // Use local ref or prop
    const newText = currentVal.substring(0, start) + text + currentVal.substring(end);
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

    const apply = (replacement: string, selStart: number, selEnd: number) => {
      const next = value.substring(0, start) + replacement + value.substring(end);
      onChange(next);
      if (textarea) setTimeout(() => { textarea.focus(); textarea.setSelectionRange(selStart, selEnd); }, 0);
    };

    if (format === 'bold') {
      const body = hasSelection ? selected : 'Fett';
      apply(`**${body}**`, start + 2, start + 2 + body.length);
    } else if (format === 'italic') {
      const body = hasSelection ? selected : 'Kursiv';
      apply(`_${body}_`, start + 1, start + 1 + body.length);
    } else if (format === 'link') {
      const text = hasSelection ? selected : 'Link';
      apply(`[${text}](https://)`, start + text.length + 3, start + text.length + 3 + 8);
    } else {
      const body = hasSelection ? selected.split('\n').map(l => l ? `- ${l}` : '- ').join('\n') : '- Liste';
      apply(body, hasSelection ? start : start + 2, start + body.length);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBg = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setStatusMessage('❌ Nur Bilder erlaubt.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('❌ Max. 5 MB.');
      return;
    }

    setStatusMessage(isBg ? '🎨 Hintergrund...' : '🚀 Upload...');
    try {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const response = await fetch(`/api/forum/upload?filename=${encodeURIComponent(safeName)}`, {
        method: 'POST',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Upload failed');

      if (isBg) {
        updateMetadata({ bg: data.url });
      } else {
        insertText(`\n![${file.name}](${data.url})\n`);
      }
      setStatusMessage('✅');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (error: any) {
      setStatusMessage('❌ Fehler');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Main Toolbar */}
      <div className="bg-white/5 p-2 rounded-xl border border-white/10 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Formatting */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
            <button onClick={() => formatText('bold')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Bold className="w-4 h-4" /></button>
            <button onClick={() => formatText('italic')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Italic className="w-4 h-4" /></button>
            <button onClick={() => formatText('list')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><List className="w-4 h-4" /></button>
            <button onClick={() => formatText('link')} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><LinkIcon className="w-4 h-4" /></button>
          </div>
          
          {/* Insert Tools */}
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-2 mr-1">
            <div className="relative">
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1.5 hover:bg-white/10 rounded-lg transition-all ${showEmojiPicker ? 'text-[#D4AF37] bg-white/10' : 'text-white/60 hover:text-white'}`}
              >
                <Smile className="w-4 h-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10" style={{ width: 300 }}>
                  <EmojiPicker theme={Theme.DARK} onEmojiClick={(d) => { insertText(d.emoji); setShowEmojiPicker(false); }} emojiStyle={EmojiStyle.NATIVE} width={300} height={350} />
                </div>
              )}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-[#D4AF37] transition-all"><ImageIcon className="w-4 h-4" /></button>
            <input type="file" ref={fileInputRef} onChange={(e) => handleUpload(e, false)} className="hidden" accept="image/*" />
            <VoiceInput variant="icon" onTranscript={insertText} />
          </div>

          {/* Visual Mode Toggle */}
          <button 
            onClick={toggleVisualMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${ 
              showVisualTools ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5' 
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Design</span>
          </button>

          <div className="flex-1" />

          {/* Preview Toggle */}
          <button 
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${ 
              isPreview ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white hover:bg-white/5' 
            }`}
          >
            {isPreview ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPreview ? 'View' : 'Raw'}</span>
          </button>
        </div>

        {/* Visual Tools Panel */}
        <AnimatePresence>
          {showVisualTools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs">
                {/* Background */}
                <div className="flex items-center gap-2">
                  <span className="text-white/40 uppercase text-[9px] font-bold tracking-widest">Hintergrund</span>
                  <button onClick={() => bgInputRef.current?.click()} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white transition-all border border-white/10">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {heroSettings.bg ? 'Ändern' : 'Bild wählen'}
                  </button>
                  {heroSettings.bg && (
                    <button onClick={() => updateMetadata({ bg: undefined })} className="text-white/40 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  )}
                  <input type="file" ref={bgInputRef} onChange={(e) => handleUpload(e, true)} className="hidden" accept="image/*" />
                </div>

                {/* Color */}
                <div className="flex items-center gap-2">
                  <span className="text-white/40 uppercase text-[9px] font-bold tracking-widest">Text</span>
                  <div className="flex gap-1">
                    {['#ffffff', '#000000', '#D4AF37', '#ff0055', '#00ff99'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateMetadata({ color: c })}
                        className={`w-5 h-5 rounded-full border ${heroSettings.color === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Align */}
                <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                  {['left', 'center', 'right'].map((a) => (
                    <button
                      key={a}
                      onClick={() => updateMetadata({ align: a as any })}
                      className={`p-1.5 rounded-md transition-all ${heroSettings.align === a ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      {a === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {a === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {a === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                {/* Size */}
                <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                  {['sm', 'md', 'lg', 'xl'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateMetadata({ size: s as any })}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${heroSettings.size === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area / Preview */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/3 transition-all min-h-[inherit]" style={{ minHeight }}>
        {showVisualTools && heroSettings.bg && (
          <div className="absolute inset-0 z-0">
            <img src={heroSettings.bg} className="w-full h-full object-cover opacity-60 blur-[2px]" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        
        {isPreview ? (
          <div className={`relative z-10 p-6 h-full overflow-y-auto ${showVisualTools ? 'flex flex-col justify-center' : ''}`} style={{ minHeight, textAlign: heroSettings.align, color: heroSettings.color }}>
             <div className={`prose prose-invert max-w-none ${ 
               heroSettings.size === 'sm' ? 'prose-sm' : 
               heroSettings.size === 'lg' ? 'prose-xl' : 
               heroSettings.size === 'xl' ? 'prose-2xl' : 'prose-base' 
             }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {value.replace(META_REGEX, '').trimEnd() || '*Vorschau...*'}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            ref={editorRef}
            autoFocus={autoFocus}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`relative z-10 w-full h-full bg-transparent px-6 py-4 text-sm outline-none resize-none placeholder:text-white/20 ${showVisualTools ? 'font-bold shadow-black drop-shadow-md' : ''}`}
            style={{ 
              minHeight,
              textAlign: showVisualTools ? heroSettings.align : 'left',
              color: showVisualTools ? heroSettings.color : 'white',
              fontSize: showVisualTools && heroSettings.size === 'xl' ? '1.5rem' : 'inherit'
            }}
          />
        )}
      </div>

      {/* Footer */}
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