'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mascot, type MascotState } from './Mascot';
import { storage, ChatMessage, ChatSession, MediaItem } from '../lib/storage';
import { ChatSidebar } from './ChatSidebar';
import { ChatInput } from './ChatInput';
import { ChatMessageItem } from './ChatMessageItem';
import { SavePromptModal } from './SavePromptModal';
import { ImageEditor } from './ImageEditor';
import { generateImage } from '../lib/api';

const generateId = () => crypto.randomUUID();

interface ChatViewProps {
  initialInput?: string | null;
  onClearInitialInput?: () => void;

  apiKey: string | null;

  onOpenSettings: () => void;
  
  triggerNewChat?: boolean;
  onNewChatTriggered?: () => void;
  onViewInMedia?: () => void;
}

export function ChatView({
  initialInput,
  onClearInitialInput,
  apiKey,
  onOpenSettings,
  triggerNewChat,
  onNewChatTriggered,
  onViewInMedia,
}: ChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mascotState, setMascotState] = useState<MascotState>('default');
  
  // Modals
  const [editingImage, setEditingImage] = useState<MediaItem | null>(null);
  const [savingPromptImage, setSavingPromptImage] = useState<MediaItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewChat = async () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now(),
    };
    await storage.save('chats', newSession);
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  useEffect(() => {
    const loadSessions = async () => {
      const loaded = await storage.getAll<ChatSession>('chats');
      const sorted = loaded.sort((a, b) => b.updatedAt - a.updatedAt);
      setSessions(sorted);
      
      if (!activeSessionId && sorted.length > 0) {
        setActiveSessionId(sorted[0].id);
      } else if (sorted.length === 0) {
        handleNewChat();
      }
    };
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (triggerNewChat) {
      handleNewChat();
      if (onNewChatTriggered) onNewChatTriggered();
    }
  }, [triggerNewChat, onNewChatTriggered]);

  useEffect(() => {
    if (activeSessionId) {
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) {
        setMessages(session.messages);
      }
    } else {
      setMessages([]);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      await storage.delete('chats', id);
      const remaining = sessions.filter(s => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0]?.id || null);
        if (remaining.length === 0) handleNewChat();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text: string, model: string, aspectRatio: string) => {
    if (!activeSessionId) return;
    if (!apiKey) {
      onOpenSettings();
      return;
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setMascotState('thinking');

    // Update session immediately
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: Date.now(),
        title: currentSession.messages.length === 0 ? text.slice(0, 30) : currentSession.title
      };
      await storage.save('chats', updatedSession);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
    }

    try {
      // Generate Image
      setMascotState('writing');
      const imageUrl = await generateImage(text, model, aspectRatio);
      
      // Save Image
      const mediaItem: MediaItem = {
        id: generateId(),
        url: imageUrl,
        prompt: text,
        timestamp: Date.now(),
        metadata: { model, aspectRatio }
      };
      await storage.save('media', mediaItem);

      // Create Assistant Message
      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Here is your image for "${text}"`,
        timestamp: Date.now(),
        imageIds: [mediaItem.id]
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setMascotState('celebration');
      setTimeout(() => setMascotState('default'), 2000);

      // Update Session
      if (currentSession) {
        const finalSession = {
          ...currentSession,
          messages: finalMessages,
          updatedAt: Date.now(),
          title: currentSession.messages.length === 0 ? text.slice(0, 30) : currentSession.title
        };
        await storage.save('chats', finalSession);
        setSessions(prev => prev.map(s => s.id === activeSessionId ? finalSession : s));
      }

    } catch (error) {
      console.error(error);
      setMascotState('error');
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: "Sorry, I couldn't generate that image. Please check your API key or try again.",
        timestamp: Date.now()
      };
      setMessages([...updatedMessages, errorMsg]);
    }
  };

  // Actions
  const handleDownload = async (image: MediaItem) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dumpling-cafe-${image.timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
      window.open(image.url, '_blank');
    }
  };

  const handleFavorite = async (image: MediaItem) => {
    const updated = { ...image, isFavorite: !image.isFavorite };
    await storage.save('media', updated);
    // Force re-render of messages if needed, but since we pass images prop to ChatMessageItem,
    // we need to fetch the images. 
    // Actually, ChatMessageItem receives MediaItem. 
    // We need to update the local state if we want to see the heart toggle immediately.
    // But messages only store imageIds. We need to fetch the full media items.
    // For now, we'll just update DB. The UI might not reflect until reload unless we manage a media cache.
    // Let's trigger a reload of the current view's images.
    // A simple way is to force update or use a context. 
    // For this phase, I'll just update the DB.
  };

  // Helper to get images for a message
  // In a real app, we'd use a hook or context to fetch these efficiently.
  // Here, we'll fetch them on render or use a simple async effect?
  // Better: Load all media on mount and keep in state? Or fetch on demand.
  // Given the scale, loading all media might be heavy.
  // I'll create a component `MessageImagesLoader` inside `ChatMessageItem` or just fetch them.
  // Actually, `ChatMessageItem` expects `images`.
  // I'll wrap `ChatMessageItem` with a loader.
  
  return (
    <div className="flex h-full relative">
      {/* Sidebar */}
      <ChatSidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {!apiKey && (
            <div className="mb-4 dc-card dc-card--soft p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--color-text-primary)] font-semibold">Add an API key to generate images</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Dumpling Cafe saves your key locally in your browser.
                </p>
              </div>
              <button onClick={onOpenSettings} className="dc-button dc-button--primary shrink-0">
                Open Settings
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            !apiKey ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Mascot state="waving" className="w-32 h-32 mb-4" />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Welcome to Dumpling Cafe</h2>
                <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">
                  Add your OpenRouter API key to start generating cozy images.
                </p>
                <button onClick={onOpenSettings} className="dc-button dc-button--primary mt-6">
                  Get Started
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <Mascot state="celebration" className="w-32 h-32 mb-4" />
                <p>Start a new conversation!</p>
              </div>
            )
          ) : (
            messages.map((msg) => (
              <MessageWithImages
                key={msg.id}
                message={msg}
                onDownload={handleDownload}
                onEdit={setEditingImage}
                onSavePrompt={setSavingPromptImage}
                onFavorite={handleFavorite}
                onViewInMedia={onViewInMedia || (() => {})}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mascot Indicator */}
        <div className="absolute bottom-24 right-8 pointer-events-none">
          <Mascot state={mascotState} className="w-24 h-24 drop-shadow-xl transition-all" />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={!apiKey}
          initialValue={initialInput}
          onClearInitialValue={onClearInitialInput}
        />
      </div>

      {/* Modals */}
      {editingImage && (
        <ImageEditor 
          image={editingImage} 
          onClose={() => setEditingImage(null)} 
          onSave={async (url) => {
            const newImage = { ...editingImage, id: generateId(), url, timestamp: Date.now() };
            await storage.save('media', newImage);
            setEditingImage(null);
          }} 
        />
      )}

      {savingPromptImage && (
        <SavePromptModal 
          initialPrompt={savingPromptImage.prompt} 
          onClose={() => setSavingPromptImage(null)} 
          onSave={() => setSavingPromptImage(null)} 
        />
      )}
    </div>
  );
}

interface MessageWithImagesProps {
  message: ChatMessage;
  onDownload: (image: MediaItem) => void;
  onEdit: (image: MediaItem) => void;
  onSavePrompt: (image: MediaItem) => void;
  onFavorite: (image: MediaItem) => void;
  onViewInMedia: () => void;
}

// Helper component to load images for a message
function MessageWithImages({ message, onDownload, onEdit, onSavePrompt, onFavorite, onViewInMedia }: MessageWithImagesProps) {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (message.imageIds && message.imageIds.length > 0) {
      setLoading(true);
      Promise.all(message.imageIds.map((id: string) => storage.get<MediaItem>('media', id)))
        .then(items => {
          setImages(items.filter((i): i is MediaItem => !!i));
          setLoading(false);
        });
    }
  }, [message.imageIds]);

  if (loading) {
    return (
      <div className="flex gap-4 mb-6 flex-row">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
        <div className="space-y-3 w-full max-w-2xl">
          <div className="h-10 bg-[var(--color-surface)] rounded-2xl w-3/4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="aspect-square bg-[var(--color-surface)] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatMessageItem
      message={message}
      images={images}
      onDownload={onDownload}
      onEdit={onEdit}
      onSavePrompt={onSavePrompt}
      onFavorite={onFavorite}
      onViewInMedia={onViewInMedia}
    />
  );
}
