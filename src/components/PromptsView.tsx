'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Folder, Trash2, Search, Heart, Play, Grid, X } from 'lucide-react';
import { storage, Prompt, PromptFolder } from '../lib/storage';
import { VariableFillerModal } from './VariableFillerModal';
import { Mascot } from './Mascot';
import clsx from 'clsx';

const generateId = () => crypto.randomUUID();

interface PromptsViewProps {
  onUsePrompt?: (text: string) => void;
}

export function PromptsView({ onUsePrompt }: PromptsViewProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | 'all' | 'favorites'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt>>({});
  const [fillingPrompt, setFillingPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedPrompts = await storage.getAll<Prompt>('prompts');
    const loadedFolders = await storage.getAll<PromptFolder>('folders');
    setPrompts(loadedPrompts);
    setFolders(loadedFolders);
  };

  const handleSave = async () => {
    if (!currentPrompt.title || !currentPrompt.content) return;

    const promptToSave: Prompt = {
      id: currentPrompt.id || generateId(),
      title: currentPrompt.title,
      content: currentPrompt.content,
      tags: currentPrompt.tags || [],
      folder: currentPrompt.folder || 'General',
      createdAt: currentPrompt.createdAt || Date.now(),
      isFavorite: currentPrompt.isFavorite || false,
      usageCount: currentPrompt.usageCount || 0,
      lastUsed: currentPrompt.lastUsed || 0,
    };

    await storage.save('prompts', promptToSave);
    
    // Save folder if new
    if (promptToSave.folder && !folders.find(f => f.name === promptToSave.folder)) {
        const newFolder = { id: generateId(), name: promptToSave.folder };
        await storage.save('folders', newFolder);
        setFolders(prev => [...prev, newFolder]);
    }

    await loadData();
    setIsEditing(false);
    setCurrentPrompt({});
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      await storage.delete('prompts', id);
      await loadData();
    }
  };

  const handleToggleFavorite = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...prompt, isFavorite: !prompt.isFavorite };
    await storage.save('prompts', updated);
    setPrompts(prev => prev.map(p => p.id === prompt.id ? updated : p));
  };

  const handleUsePrompt = (prompt: Prompt) => {
    // Check for variables
    if (prompt.content.includes('{{')) {
      setFillingPrompt(prompt);
    } else {
      submitPrompt(prompt.content, prompt);
    }
  };

  const submitPrompt = async (text: string, originalPrompt: Prompt) => {
    if (onUsePrompt) {
      // Update usage stats
      const updated = { 
        ...originalPrompt, 
        usageCount: (originalPrompt.usageCount || 0) + 1,
        lastUsed: Date.now()
      };
      await storage.save('prompts', updated);
      onUsePrompt(text);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      const newFolder = { id: generateId(), name };
      await storage.save('folders', newFolder);
      setFolders(prev => [...prev, newFolder]);
    }
  };

  // Filtering
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = (p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()));
    const matchesFolder = activeFolder === 'all' ? true : activeFolder === 'favorites' ? p.isFavorite : p.folder === activeFolder;
    const matchesTag = activeTag ? p.tags.includes(activeTag) : true;
    return matchesSearch && matchesFolder && matchesTag;
  });

  // Extract all tags
  const allTags = Array.from(new Set(prompts.flatMap(p => p.tags)));

  return (
    <div className="h-full flex bg-[var(--color-background)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shrink-0">
        <div className="p-4">
          <button 
            onClick={handleCreateFolder}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-surface-active)] text-[var(--color-text-primary)] py-2 rounded-lg font-medium hover:bg-[var(--color-surface-hover)] transition-colors border border-[var(--color-border)]"
          >
            <Plus size={16} /> New Folder
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          {/* Main Filters */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveFolder('all'); setActiveTag(null); }}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                activeFolder === 'all' ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              )}
            >
              <span className="flex items-center gap-2"><Grid size={16} /> All Prompts</span>
              <span className="text-xs opacity-70">{prompts.length}</span>
            </button>
            <button
              onClick={() => { setActiveFolder('favorites'); setActiveTag(null); }}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                activeFolder === 'favorites' ? "bg-[var(--color-soft-red)]/10 text-[var(--color-soft-red)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              )}
            >
              <span className="flex items-center gap-2"><Heart size={16} /> Favorites</span>
              <span className="text-xs opacity-70">{prompts.filter(p => p.isFavorite).length}</span>
            </button>
          </div>

          {/* Folders */}
          <div>
            <h3 className="px-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Folders</h3>
            <div className="space-y-1">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => { setActiveFolder(folder.name); setActiveTag(null); }}
                  className={clsx(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    activeFolder === folder.name ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <Folder size={16} />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="px-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 px-3">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={clsx(
                    "text-xs px-2 py-1 rounded-full transition-colors",
                    activeTag === tag ? "bg-[var(--color-teal)] text-[#1a1814]" : "bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-background)]">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
            />
          </div>
          <button
            onClick={() => {
              setCurrentPrompt({});
              setIsEditing(true);
            }}
            className="bg-[var(--color-teal)] text-[#1a1814] px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 flex items-center gap-2"
          >
            <Plus size={18} /> Add Prompt
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPrompts.map(prompt => (
              <div 
                key={prompt.id}
                onClick={() => { setCurrentPrompt(prompt); setIsEditing(true); }}
                className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-teal)] transition-all cursor-pointer flex flex-col h-64"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs">
                    <Folder size={14} />
                    <span>{prompt.folder}</span>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(prompt, e)}
                    className={clsx(
                      "p-1.5 rounded-full transition-colors",
                      prompt.isFavorite ? "text-[var(--color-soft-red)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                    )}
                  >
                    <Heart size={16} fill={prompt.isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>

                <h3 className="font-bold text-[var(--color-text-primary)] mb-2 line-clamp-1">{prompt.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm line-clamp-4 mb-4 font-mono bg-[var(--color-background)] p-2 rounded flex-1">
                  {prompt.content}
                </p>

                <div className="flex justify-between items-center mt-auto pt-3 border-t border-[var(--color-border)]">
                  <div className="flex gap-1 overflow-hidden">
                    {prompt.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full truncate">
                        #{tag}
                      </span>
                    ))}
                    {prompt.tags.length > 2 && <span className="text-[10px] text-[var(--color-text-muted)]">+{prompt.tags.length - 2}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <Play size={10} /> {prompt.usageCount || 0}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUsePrompt(prompt); }}
                      className="p-1.5 bg-[var(--color-teal)]/10 text-[var(--color-teal)] rounded hover:bg-[var(--color-teal)] hover:text-[#1a1814] transition-colors"
                      title="Use in Chat"
                    >
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredPrompts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] opacity-60">
              <Mascot state="reading" className="w-32 h-32 mb-4" />
              <p className="text-lg font-medium">No prompts found.</p>
              <p className="text-sm">Create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {currentPrompt.id ? 'Edit Prompt' : 'Create Prompt'}
              </h3>
              <div className="flex gap-2">
                {currentPrompt.id && (
                  <button 
                    onClick={() => handleDelete(currentPrompt.id!)}
                    className="p-2 text-[var(--color-soft-red)] hover:bg-[var(--color-surface-hover)] rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => setIsEditing(false)} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Title</label>
                <input
                  type="text"
                  value={currentPrompt.title || ''}
                  onChange={(e) => setCurrentPrompt({ ...currentPrompt, title: e.target.value })}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Content (Use {'{{variable}}'} for placeholders)</label>
                <textarea
                  value={currentPrompt.content || ''}
                  onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                  rows={8}
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none resize-none font-mono text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Folder</label>
                  <input
                    type="text"
                    value={currentPrompt.folder || ''}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, folder: e.target.value })}
                    placeholder="General"
                    list="folders-list"
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
                  />
                  <datalist id="folders-list">
                    {folders.map(f => <option key={f.id} value={f.name} />)}
                  </datalist>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={currentPrompt.tags?.join(', ') || ''}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, tags: e.target.value.split(',').map(t => t.trim()) })}
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-[var(--color-teal)] text-[#1a1814] px-6 py-2 rounded-lg font-medium hover:bg-opacity-90">
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {fillingPrompt && (
        <VariableFillerModal 
          promptContent={fillingPrompt.content} 
          onClose={() => setFillingPrompt(null)} 
          onSubmit={(text) => {
            submitPrompt(text, fillingPrompt);
            setFillingPrompt(null);
          }} 
        />
      )}
    </div>
  );
}
