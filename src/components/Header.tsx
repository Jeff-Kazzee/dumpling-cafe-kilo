/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { MessageSquare, Search, Library, Image as ImageIcon, Settings } from 'lucide-react';
import clsx from 'clsx';

import { ASSETS } from '../lib/assets';
import { CHAT_MODELS } from '../lib/models';

type Tab = 'chat' | 'research' | 'prompts' | 'media';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;

  selectedModel: string;
  onModelChange: (model: string) => void;

  onOpenSettings: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  selectedModel,
  onModelChange,
  onOpenSettings,
}: HeaderProps) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'research', label: 'Research', icon: <Search size={18} /> },
    { id: 'prompts', label: 'Prompts', icon: <Library size={18} /> },
    { id: 'media', label: 'Media', icon: <ImageIcon size={18} /> },
  ];

  // Group models by tier
  const groupedModels = CHAT_MODELS.reduce((acc, model) => {
    if (!acc[model.tier]) acc[model.tier] = [];
    acc[model.tier].push(model);
    return acc;
  }, {} as Record<string, typeof CHAT_MODELS>);

  const tiers: Array<keyof typeof groupedModels> = ['free', 'budget', 'mid', 'premium', 'frontier'];

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <img
          src={ASSETS.logo}
          alt="Logo"
          className="w-8 h-8"
        />
        <h1 className="text-lg font-bold text-[var(--color-text-primary)] hidden md:block">Dumpling Cafe</h1>
      </div>

      <nav className="flex items-center gap-1 bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)]",
              activeTab === tab.id
                ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <select
          aria-label="Model"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm rounded-md px-2 py-1 focus:outline-none focus:border-[var(--color-teal)] focus-visible:ring-2 focus-visible:ring-[var(--color-teal)]"
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
        <button
          onClick={onOpenSettings}
          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)]"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
