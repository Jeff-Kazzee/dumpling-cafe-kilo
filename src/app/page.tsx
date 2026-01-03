/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Library, Image as ImageIcon, KeyRound, X, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { ChatView } from '../components/ChatView';
import { ResearchView } from '../components/ResearchView';
import { PromptsView } from '../components/PromptsView';
import { MediaView } from '../components/MediaView';
import { storage, type AppSettings } from '../lib/storage';
import { ASSETS } from '../lib/assets';
import { CHAT_MODELS } from '../lib/models';

type Tab = 'chat' | 'research' | 'prompts' | 'media';

const DEFAULT_MODEL = CHAT_MODELS[0].id;

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [showSettings, setShowSettings] = useState(false);

  // New Chat Trigger
  const [triggerNewChat, setTriggerNewChat] = useState(false);

  useEffect(() => {
    // Initialize DB + load settings.
    let mounted = true;
    (async () => {
      try {
        await storage.init();
        const settings = await storage.get<AppSettings>('settings', 'settings');
        if (!mounted) return;
        setApiKey(settings?.openRouterApiKey || null);
        setSelectedModel(settings?.selectedModel || DEFAULT_MODEL);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('model-selector')?.focus();
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setActiveTab('chat');
        setTriggerNewChat(true);
      }

      // Tab switching
      const activeEl = document.activeElement as HTMLElement | null;
      const activeTag = activeEl?.tagName;
      const isTypingContext =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT' ||
        !!activeEl?.isContentEditable;

      if (!isTypingContext) {
        if (e.key === '1') setActiveTab('chat');
        if (e.key === '2') setActiveTab('research');
        if (e.key === '3') setActiveTab('prompts');
        if (e.key === '4') setActiveTab('media');
      }

      // Modal closing
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSettings]);

  const persistSettings = async (next: { openRouterApiKey?: string | null; selectedModel?: string }) => {
    const existing = await storage.get<AppSettings>('settings', 'settings');
    const model = next.selectedModel ?? existing?.selectedModel ?? selectedModel ?? DEFAULT_MODEL;

    const updated: AppSettings = {
      id: 'settings',
      theme: 'dark',
      selectedModel: model,
      ...(existing?.openRouterApiKey ? { openRouterApiKey: existing.openRouterApiKey } : {}),
    };

    if (typeof next.openRouterApiKey !== 'undefined') {
      if (next.openRouterApiKey) {
        updated.openRouterApiKey = next.openRouterApiKey;
      } else {
        delete (updated as Partial<AppSettings>).openRouterApiKey;
      }
    }

    await storage.save('settings', updated);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    void persistSettings({ selectedModel: model }).catch(console.error);
  };

  const handleSaveKey = async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    await persistSettings({ openRouterApiKey: trimmed, selectedModel });
    setApiKey(trimmed);
    setShowSettings(false);
    setActiveTab('chat');
  };

  const handleClearKey = async () => {
    await persistSettings({ openRouterApiKey: null, selectedModel });
    setApiKey(null);
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={ASSETS.loadingIcon}
            alt="Loading..." 
            className="w-16 h-16 animate-bounce"
          />
          <p>Loading Dumpling Cafe...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen flex flex-col bg-[var(--color-background)] overflow-hidden noise-overlay">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        onOpenSettings={() => setShowSettings(true)}
      />
      
      <div className="flex-1 overflow-hidden relative">
        {!apiKey ? (
          <OnboardingLanding onOpenSettings={() => setShowSettings(true)} />
        ) : (
          <>
            {activeTab === 'chat' && (
              <ChatView
                apiKey={apiKey}
                onOpenSettings={() => setShowSettings(true)}
                initialInput={pendingPrompt}
                onClearInitialInput={() => setPendingPrompt(null)}
                triggerNewChat={triggerNewChat}
                onNewChatTriggered={() => setTriggerNewChat(false)}
                onViewInMedia={() => setActiveTab('media')}
              />
            )}
            {activeTab === 'research' && (
              <ResearchView
                onDiscussInChat={(text) => {
                  setPendingPrompt(text);
                  setActiveTab('chat');
                }}
              />
            )}
            {activeTab === 'prompts' && (
              <PromptsView
                onUsePrompt={(text) => {
                  setPendingPrompt(text);
                  setActiveTab('chat');
                }}
              />
            )}
            {activeTab === 'media' && <MediaView />}
          </>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          selectedModel={selectedModel}
          apiKeyInitial={apiKey || ''}
          onClose={() => setShowSettings(false)}
          onSaveKey={handleSaveKey}
          onClearKey={handleClearKey}
          onModelChange={handleModelChange}
        />
      )}
    </main>
  );
}

function OnboardingLanding({ onOpenSettings }: { onOpenSettings: () => void }) {
  const features: Array<{ title: string; description: string; icon: React.ReactNode; tint: string }> = [
    {
      title: 'Chat',
      description: 'Describe what you want. Dumpling turns prompts into images with a cozy workflow.',
      icon: <MessageSquare size={18} />,
      tint: 'text-[var(--color-teal)]',
    },
    {
      title: 'Research',
      description: 'Collect notes and results in one place (lightweight, hackathon-friendly).',
      icon: <Search size={18} />,
      tint: 'text-[var(--color-sage)]',
    },
    {
      title: 'Prompts',
      description: 'Save prompts, reuse them, and keep your favorites close at hand.',
      icon: <Library size={18} />,
      tint: 'text-[var(--color-gold)]',
    },
    {
      title: 'Media',
      description: 'Browse your generated images and keep the best ones for later.',
      icon: <ImageIcon size={18} />,
      tint: 'text-[var(--color-coral)]',
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="dc-card p-6 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-60" style={{
            background:
              'radial-gradient(900px 420px at 20% 10%, rgba(124,190,204,0.18), transparent 70%), radial-gradient(900px 420px at 80% 0%, rgba(232,146,124,0.12), transparent 60%)',
          }} />

          <div className="relative grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[var(--color-text-secondary)] mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--color-teal)]" />
                One app • Cozy flow • Local-first
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] leading-tight">
                Dumpling Cafe
                <span className="block text-[var(--color-text-secondary)] font-bold mt-2">
                  A warm, focused workspace for prompts, media, and making.
                </span>
              </h2>

              <p className="text-[var(--color-text-secondary)] mt-5 max-w-xl">
                To get started, add your OpenRouter API key. It stays on your device (saved locally).
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-7">
                <button onClick={onOpenSettings} className="dc-button dc-button--primary">
                  <KeyRound size={18} />
                  Get Started
                </button>
                <div className="text-sm text-[var(--color-text-muted)]">
                  Press <kbd className="px-2 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-background)]">Esc</kbd> to close modals.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <img
                src={ASSETS.mascot.waving}
                alt="Dumpling mascot waving"
                className="w-56 h-56 md:w-64 md:h-64 drop-shadow-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {features.map((f) => (
            <div key={f.title} className="dc-card p-5 hover:bg-[var(--color-surface-hover)] transition-colors">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center ${f.tint}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-[var(--color-text-primary)]">{f.title}</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsModal({
  apiKeyInitial,
  selectedModel,
  onClose,
  onSaveKey,
  onClearKey,
  onModelChange,
}: {
  apiKeyInitial: string;
  selectedModel: string;
  onClose: () => void;
  onSaveKey: (key: string) => Promise<void>;
  onClearKey: () => Promise<void>;
  onModelChange: (model: string) => void;
}) {
  const [draftKey, setDraftKey] = useState(apiKeyInitial);
  const [isSaving, setIsSaving] = useState(false);

  // Group models by tier
  const groupedModels = CHAT_MODELS.reduce((acc, model) => {
    if (!acc[model.tier]) acc[model.tier] = [];
    acc[model.tier].push(model);
    return acc;
  }, {} as Record<string, typeof CHAT_MODELS>);

  const tiers: Array<keyof typeof groupedModels> = ['free', 'budget', 'mid', 'premium', 'frontier'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dc-card w-full max-w-lg p-6 md:p-7 border border-[var(--color-teal)]/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-teal)]">
                <KeyRound size={18} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-text-primary)]">Settings</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">API key + model selection</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="dc-button dc-button--ghost px-3 py-2"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">OpenRouter API key</label>
            <input
              type="password"
              placeholder="sk-or-..."
              className="dc-input"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void (async () => {
                    setIsSaving(true);
                    try {
                      await onSaveKey(draftKey);
                    } finally {
                      setIsSaving(false);
                    }
                  })();
                }
              }}
              autoFocus
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Saved locally via IndexedDB. Dumpling Cafe never uploads your key anywhere.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Default model</label>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="dc-input"
            >
              {tiers.map((tier) => {
                if (!groupedModels[tier]) return null;
                return (
                  <optgroup key={tier} label={tier.charAt(0).toUpperCase() + tier.slice(1) + ' Tier'}>
                    {groupedModels[tier].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              void (async () => {
                setIsSaving(true);
                try {
                  await onClearKey();
                  setDraftKey('');
                } finally {
                  setIsSaving(false);
                }
              })();
            }}
            className="dc-button dc-button--secondary"
            disabled={isSaving}
          >
            <Trash2 size={16} />
            Clear key
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="dc-button dc-button--ghost" disabled={isSaving}>
              Cancel
            </button>
            <button
              onClick={() => {
                void (async () => {
                  setIsSaving(true);
                  try {
                    await onSaveKey(draftKey);
                  } finally {
                    setIsSaving(false);
                  }
                })();
              }}
              className="dc-button dc-button--primary"
              disabled={isSaving || !draftKey.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
