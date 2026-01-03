'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, MessageCircle, Image, Globe, Brain } from 'lucide-react';
import { CHAT_MODELS, IMAGE_MODELS } from '../lib/models';

interface ChatInputProps {
  onSend: (text: string, model: string, aspectRatio: string, mode: 'chat' | 'image', webSearch: boolean, reasoning: boolean, reasoningEffort: 'high' | 'medium' | 'low') => void;
  disabled?: boolean;
  initialValue?: string | null;
  onClearInitialValue?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  initialValue,
  onClearInitialValue,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const [chatModel, setChatModel] = useState(CHAT_MODELS[0].id);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<'high' | 'medium' | 'low'>('medium');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get the current model based on mode
  const currentModel = mode === 'chat' ? chatModel : imageModel;
  const currentModels = mode === 'chat' ? CHAT_MODELS : IMAGE_MODELS;

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (onClearInitialValue) onClearInitialValue();
    }
  }, [initialValue, onClearInitialValue]);

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
    onSend(input, currentModel, aspectRatio, mode, webSearchEnabled, reasoningEnabled, reasoningEffort);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (mode === 'chat') {
      setChatModel(e.target.value);
    } else {
      setImageModel(e.target.value);
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
          placeholder={mode === 'chat' ? "Ask a question..." : "Describe your image..."}
          disabled={disabled}
          className="w-full bg-transparent text-[var(--color-text-primary)] px-4 py-3 focus:outline-none resize-none min-h-[60px] max-h-[200px]"
          rows={1}
        />

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-active)]/30 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--color-surface)] rounded-lg p-0.5">
              <button
                onClick={() => setMode('chat')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  mode === 'chat'
                    ? 'bg-[var(--color-teal)] text-[#1a1814]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
                title="Chat mode"
              >
                <MessageCircle size={12} />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setMode('image')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  mode === 'image'
                    ? 'bg-[var(--color-teal)] text-[#1a1814]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
                title="Image generation mode"
              >
                <Image size={12} />
                <span>Image</span>
              </button>
            </div>

            {/* Web Search Toggle - only show in chat mode */}
            {mode === 'chat' && (
              <>
                <div className="w-px h-4 bg-[var(--color-border)]" />
                <button
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    webSearchEnabled
                      ? 'bg-[var(--color-gold)] text-[#1a1814]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                  title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
                >
                  <Globe size={12} />
                  <span>Web</span>
                </button>
              </>
            )}

            {/* Reasoning Toggle - only show in chat mode */}
            {mode === 'chat' && (
              <>
                <div className="w-px h-4 bg-[var(--color-border)]" />
                <button
                  onClick={() => setReasoningEnabled(!reasoningEnabled)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    reasoningEnabled
                      ? 'bg-[#e07a5f] text-[#1a1814]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                  title={reasoningEnabled ? "Reasoning enabled" : "Enable reasoning mode"}
                >
                  <Brain size={12} />
                  <span>Reason</span>
                </button>
                {/* Effort Selector - only show when reasoning is enabled */}
                {reasoningEnabled && (
                  <div className="relative group">
                    <select
                      value={reasoningEffort}
                      onChange={(e) => setReasoningEffort(e.target.value as 'high' | 'medium' | 'low')}
                      className="appearance-none bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 pr-6 rounded-md cursor-pointer focus:outline-none border border-[var(--color-border)]"
                      title="Reasoning effort level"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                  </div>
                )}
              </>
            )}

            <div className="w-px h-4 bg-[var(--color-border)]" />

            {/* Model Selector */}
            <div className="relative group">
              <select
                value={currentModel}
                onChange={handleModelChange}
                className="appearance-none bg-transparent text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] pr-6 cursor-pointer focus:outline-none max-w-[150px] truncate"
                title={currentModels.find(m => m.id === currentModel)?.description}
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id} title={m.description}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            </div>

            {/* Aspect Ratio Selector - only show in image mode */}
            {mode === 'image' && (
              <>
                <div className="w-px h-4 bg-[var(--color-border)]" />

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
              </>
            )}
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
