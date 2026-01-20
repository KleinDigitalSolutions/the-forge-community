/**
 * AIGenerator - AI Content Generation UI
 * Used by: Legal Studio, Email Studio
 */

'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

interface AIGeneratorProps {
  onGenerate: () => Promise<string>;
  isGenerating: boolean;
  generatedContent?: string;
  brandContext?: {
    brandName: string;
    toneOfVoice?: string;
  };
  placeholder?: string;
  buttonText?: string;
}

export function AIGenerator({
  onGenerate,
  isGenerating,
  generatedContent,
  brandContext,
  placeholder = 'AI-generated content will appear here...',
  buttonText = 'Generate with AI',
}: AIGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl border border-white/10 space-y-4">
      {/* Brand Context Chip */}
      {brandContext && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-white/40">Using brand context:</span>
          <span className="px-2 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold">
            {brandContext.brandName}
          </span>
          {brandContext.toneOfVoice && (
            <span className="px-2 py-1 rounded-full bg-white/5 text-white/60 font-medium">
              {brandContext.toneOfVoice}
            </span>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#FFD700] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </button>

      {/* Generated Output */}
      {generatedContent ? (
        <div className="relative">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/60" />
            )}
          </button>

          {/* Content */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
              {generatedContent}
            </pre>
          </div>
        </div>
      ) : (
        !isGenerating && (
          <div className="p-8 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">{placeholder}</p>
          </div>
        )
      )}
    </div>
  );
}
