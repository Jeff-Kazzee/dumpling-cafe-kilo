'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { storage, Prompt } from '../lib/storage';

interface SavePromptModalProps {
  initialPrompt: string;
  onClose: () => void;
  onSave: () => void;
}

export function SavePromptModal({ initialPrompt, onClose, onSave }: SavePromptModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialPrompt);
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState('');

  const handleSave = async () => {
    if (!title || !content) return;

    const prompt: Prompt = {
      id: crypto.randomUUID(),
      title,
      content,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
    };

    await storage.save('prompts', prompt);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Save Prompt</h3>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Space Cat"
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Prompt</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Folder</label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, art"
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-[var(--color-teal)] text-[#1a1814] px-6 py-2 rounded-lg font-medium hover:bg-opacity-90">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
