/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { storage, MediaItem } from '../lib/storage';
import { ImageEditor } from './ImageEditor';
import { Mascot } from './Mascot';

export function MediaView() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [editingImage, setEditingImage] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const loaded = await storage.getAll<MediaItem>('media');
    setImages(loaded.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleSaveEdit = async (dataUrl: string) => {
    if (!editingImage) return;

    const newImage: MediaItem = {
      ...editingImage,
      id: crypto.randomUUID(),
      url: dataUrl,
      timestamp: Date.now(),
      metadata: { ...editingImage.metadata, editedFrom: editingImage.id }
    };

    await storage.save('media', newImage);
    await loadImages();
    setEditingImage(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this image?')) {
      await storage.delete('media', id);
      await loadImages();
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Media Hub</h2>
        <p className="text-[var(--color-text-secondary)]">Gallery of your generated and edited creations.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pb-10">
        {images.map((img) => (
          <div
            key={img.id}
            onClick={() => setEditingImage(img)}
            className="group relative aspect-square bg-transparent rounded-xl overflow-hidden border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-teal)] transition-all"
          >
            <img
              src={img.url}
              alt={img.prompt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 bg-[var(--color-surface)]"
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <p className="text-white text-sm line-clamp-2 mb-3">{img.prompt}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300">{new Date(img.timestamp).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleDelete(img.id, e)}
                    className="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImage(img);
                    }}
                    className="p-2 bg-[var(--color-teal)] text-[#1a1814] rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Mascot state="sleeping" className="w-32 h-32 mb-4" />
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No images yet</h3>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Generate some images in the Chat tab to see them here.
            </p>
          </div>
        )}
      </div>

      {editingImage && (
        <ImageEditor 
          image={editingImage} 
          onClose={() => setEditingImage(null)} 
          onSave={handleSaveEdit} 
        />
      )}
    </div>
  );
}
