'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Eraser, Pen } from 'lucide-react';
import { MediaItem } from '../lib/storage';

interface ImageEditorProps {
  image: MediaItem;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

export function ImageEditor({ image, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#e8927c'); // Coral default
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  }, [image]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#1a1814' : color; // Eraser paints background color for now, or could use globalCompositeOperation

    if (tool === 'eraser') {
        // Simple eraser implementation
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-16 border-b border-[var(--color-border)] flex items-center justify-between px-6 bg-[var(--color-surface)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Image Editor</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="bg-[var(--color-teal)] text-[#1a1814] px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-opacity-90">
              <Save size={18} /> Save
            </button>
            <button onClick={onClose} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-background)] p-4 flex flex-col gap-6 overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 block">Tools</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool('pen')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${tool === 'pen' ? 'bg-[var(--color-teal)] text-[#1a1814]' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
                >
                  <Pen size={20} />
                  <span className="text-xs">Pen</span>
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${tool === 'eraser' ? 'bg-[var(--color-teal)] text-[#1a1814]' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
                >
                  <Eraser size={20} />
                  <span className="text-xs">Eraser</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 block">Colors</label>
              <div className="grid grid-cols-4 gap-2">
                {['#e8927c', '#7cbecc', '#7db07d', '#d4a84b', '#d4726a', '#a78bba', '#f5f0e8', '#000000'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-[var(--color-text-primary)]' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 block">Brush Size</label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-[var(--color-teal)]"
              />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-[#100f0d] flex items-center justify-center p-8 overflow-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="max-w-full max-h-full shadow-2xl cursor-crosshair"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
