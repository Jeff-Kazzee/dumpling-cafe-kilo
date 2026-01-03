const DB_NAME = 'DumplingCafeDB';
const DB_VERSION = 1;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: string[];
  imageIds?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  createdAt: number;
  isFavorite?: boolean;
  usageCount?: number;
  lastUsed?: number;
}

export interface PromptFolder {
  id: string;
  name: string;
}

export interface MediaItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  isFavorite?: boolean;
}

export interface ResearchTask {
  id: string;
  query: string;
  status: 'pending' | 'researching' | 'completed' | 'failed';
  progress: number;
  results: string[];
  timestamp: number;
  logs?: { agent: string; message: string; timestamp: number }[];
}

export interface AppSettings {
  id: 'settings';
  selectedModel: string;
  theme: 'dark'; // Enforced dark mode
  openRouterApiKey?: string;
}

class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prompts')) {
          db.createObjectStore('prompts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('research')) {
          db.createObjectStore('research', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.init();
    return this.db!.transaction(storeName, mode).objectStore(storeName);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save<T>(storeName: string, item: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storage = new StorageService();
