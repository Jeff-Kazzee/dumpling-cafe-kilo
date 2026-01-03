'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Download, Edit2, Heart, Save, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, MediaItem } from '../lib/storage';
import { Mascot } from './Mascot';
import clsx from 'clsx';

interface ChatMessageItemProps {
  message: ChatMessage;
  images?: MediaItem[];
  onDownload: (image: MediaItem) => void;
  onEdit: (image: MediaItem) => void;
  onSavePrompt: (image: MediaItem) => void;
  onFavorite: (image: MediaItem) => void;
  onViewInMedia: () => void;
}

export function ChatMessageItem({
  message,
  images,
  onDownload,
  onEdit,
  onSavePrompt,
  onFavorite,
  onViewInMedia
}: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx("flex gap-4 mb-6", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-10 h-10 rounded-full bg-[var(--color-teal)] flex items-center justify-center text-[#1a1814] font-bold">
            U
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
            <Mascot state="default" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={clsx(
        "max-w-[85%] space-y-3",
        isUser ? "items-end flex flex-col" : "items-start"
      )}>
        {/* Text Bubble */}
        {message.content && (
          <div className={clsx(
            "px-4 py-3 rounded-2xl whitespace-pre-wrap",
            isUser 
              ? "bg-[var(--color-teal)] text-[#1a1814] rounded-tr-none" 
              : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-tl-none"
          )}>
            {message.content}
          </div>
        )}

        {/* Images Grid */}
        {images && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
            {images.map((img) => (
              <div key={img.id} className="group relative bg-[var(--color-surface)] rounded-xl overflow-hidden border border-[var(--color-border)]">
                <img 
                  src={img.url} 
                  alt={img.prompt} 
                  className="w-full h-auto object-cover aspect-square"
                />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onDownload(img)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => onEdit(img)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => onSavePrompt(img)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Save Prompt"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => onFavorite(img)}
                    className={clsx(
                      "p-2 rounded-full backdrop-blur-sm transition-colors",
                      img.isFavorite
                        ? "bg-[var(--color-soft-red)] text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title="Favorite"
                  >
                    <Heart size={18} fill={img.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={onViewInMedia}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="View in Media Hub"
                  >
                    <ImageIcon size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
