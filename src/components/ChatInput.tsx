'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, model: string, aspectRatio: string) => void;
  disabled?: boolean;
  initialValue?: string | null;
  onClearInitialValue?: () => void;

  /** Optional app-shell controlled model selection (Header + Settings). */
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export function ChatInput({
  onSend,
  disabled,
  initialValue,
  onClearInitialValue,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [model, setModel] = useState(selectedModel || 'google/gemini-2.0-flash-exp:free'); // Default model
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (onClearInitialValue) onClearInitialValue();
    }
  }, [initialValue, onClearInitialValue]);

  useEffect(() => {
    if (selectedModel && selectedModel !== model) {
      setModel(selectedModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input, model, aspectRatio);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-[var(--color-background)] border-t border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[var(--color-teal)] transition-shadow">
        
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your image or ask a question..."
          disabled={disabled}
          className="w-full bg-transparent text-[var(--color-text-primary)] px-4 py-3 focus:outline-none resize-none min-h-[60px] max-h-[200px]"
          rows={1}
        />

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-active)]/30 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="relative group">
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  onModelChange?.(e.target.value);
                }}
                className="appearance-none bg-transparent text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] pr-6 cursor-pointer focus:outline-none"
              >
                <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash</option>
                <option value="stabilityai/stable-diffusion-xl-base-1.0">SDXL 1.0</option>
                <option value="openai/dall-e-3">DALL-E 3</option>
                <option value="midjourney">Midjourney (Mock)</option>
              </select>
              <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>

            <div className="w-px h-4 bg-[var(--color-border)]" />

            {/* Aspect Ratio Selector */}
            <div className="relative group">
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="appearance-none bg-transparent text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] pr-6 cursor-pointer focus:outline-none"
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="4:3">4:3 Standard</option>
                <option value="3:4">3:4 Vertical</option>
              </select>
              <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="bg-[var(--color-teal)] text-[#1a1814] p-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
