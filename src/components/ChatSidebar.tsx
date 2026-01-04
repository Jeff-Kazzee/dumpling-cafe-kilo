'use client';

import React from 'react';
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { ChatSession } from '../lib/storage';
import clsx from 'clsx';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isCollapsed = false,
  onToggleCollapse
}: ChatSidebarProps) {
  
  const groupSessions = () => {
    const groups: Record<string, ChatSession[]> = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    sessions.forEach(session => {
      if (session.updatedAt >= today) {
        groups['Today'].push(session);
      } else if (session.updatedAt >= yesterday) {
        groups['Yesterday'].push(session);
      } else if (session.updatedAt >= lastWeek) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const grouped = groupSessions();

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div className="w-12 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col h-full shrink-0">
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft size={20} />
          </button>
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center p-2 mt-2 bg-[var(--color-teal)] text-[#1a1814] rounded-lg hover:bg-opacity-90 transition-colors"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col h-full shrink-0">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onToggleCollapse}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
          <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Chats</span>
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-teal)] text-[#1a1814] py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6">
        {Object.entries(grouped).map(([label, group]) => (
          group.length > 0 && (
            <div key={label}>
              <h3 className="px-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                {label}
              </h3>
              <div className="space-y-1">
                {group.map(session => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={clsx(
                      "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                      activeSessionId === session.id
                        ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare size={14} className="shrink-0 opacity-70" />
                      <span className="truncate">{session.title || 'New Chat'}</span>
                    </div>
                    <button
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-background)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-soft-red)] transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
