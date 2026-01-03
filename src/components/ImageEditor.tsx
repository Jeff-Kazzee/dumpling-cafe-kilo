'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Eraser, Pen, Undo, Redo, Trash2, Wand2, Loader2, Check, RotateCcw } from 'lucide-react';
import { MediaItem } from '../lib/storage';
import { editImage } from '../lib/api';
import { EDIT_CAPABLE_MODELS } from '../lib/models';

interface ImageEditorProps {
  image: MediaItem;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

export function ImageEditor({ image, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#e8927c'); // Coral default
  const [brushSize, setBrushSize] = useState(10);
  
  // History State
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // AI Edit State
  const [editPrompt, setEditPrompt] = useState('');
  // Default to Gemini 2.5 Flash for editing (first edit-capable model)
  const [selectedModel, setSelectedModel] = useState(EDIT_CAPABLE_MODELS[0]?.id || 'google/gemini-2.5-flash-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      if (canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        // Save initial blank state
        saveHistory();
      }
    };
    img.onerror = () => {
      console.error('Failed to load image for editor');
    };
    img.src = image.url;
  }, [image]);

  // History Management
  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      restoreHistory(newStep);
      setHistoryStep(newStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      restoreHistory(newStep);
      setHistoryStep(newStep);
    }
  };

  const restoreHistory = (step: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(history[step], 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  // AI Edit Logic
  const getMaskBase64 = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    // Create mask canvas (Black background, White strokes)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const mCtx = maskCanvas.getContext('2d');
    if (!mCtx) return null;

    // 1. Fill Black
    mCtx.fillStyle = 'black';
    mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // 2. Draw strokes as White
    // Create temp canvas to extract shape
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return null;
    
    tCtx.drawImage(canvas, 0, 0);
    tCtx.globalCompositeOperation = 'source-in';
    tCtx.fillStyle = 'white';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 3. Composite
    mCtx.drawImage(tempCanvas, 0, 0);
    
    return maskCanvas.toDataURL('image/png');
  };

  const getOriginalBase64 = async (): Promise<string> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Context creation failed');
    ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  };

  const handleGenerateEdit = async () => {
    if (!editPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const originalBase64 = await getOriginalBase64();
      const maskBase64 = getMaskBase64();
      
      const result = await editImage(
        originalBase64,
        maskBase64,
        editPrompt,
        selectedModel
      );
      
      setGeneratedImage(result);
    } catch (error) {
      console.error('Edit failed:', error);
      alert('Failed to generate edit. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Final Save (Merge Image + Drawing)
  const handleSave = async () => {
    if (generatedImage) {
      onSave(generatedImage);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    // Draw Original
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    await new Promise(r => img.onload = r);
    ctx.drawImage(img, 0, 0);

    // Draw Strokes
    ctx.drawImage(canvas, 0, 0);

    onSave(finalCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
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
          <div className="w-80 border-r border-[var(--color-border)] bg-[var(--color-background)] p-4 flex flex-col gap-6 overflow-y-auto">
            
            {/* Drawing Tools */}
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 block">Drawing Tools</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
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

              <div className="flex gap-2 mb-4">
                <button onClick={handleUndo} disabled={historyStep <= 0} className="flex-1 p-2 bg-[var(--color-surface)] rounded-lg flex justify-center disabled:opacity-50 hover:bg-[var(--color-surface-hover)]">
                  <Undo size={18} />
                </button>
                <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="flex-1 p-2 bg-[var(--color-surface)] rounded-lg flex justify-center disabled:opacity-50 hover:bg-[var(--color-surface-hover)]">
                  <Redo size={18} />
                </button>
                <button onClick={handleClear} className="flex-1 p-2 bg-[var(--color-surface)] rounded-lg flex justify-center text-red-400 hover:bg-[var(--color-surface-hover)]">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs text-[var(--color-text-muted)] mb-2 block">Brush Size: {brushSize}px</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full accent-[var(--color-teal)]"
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {['#e8927c', '#7cbecc', '#7db07d', '#d4a84b', '#d4726a', '#a78bba', '#f5f0e8', '#000000', '#ffffff', '#ff0000'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-[var(--color-text-primary)]' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--color-border)]" />

            {/* AI Edit */}
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Wand2 size={14} /> AI Edit
              </label>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Draw a mask over the area you want to change, then describe the change.
              </p>
              
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe what to generate in the masked area..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-sm text-[var(--color-text-primary)] mb-3 focus:outline-none focus:border-[var(--color-teal)] resize-none h-24"
              />

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-[var(--color-text-primary)] mb-3 focus:outline-none focus:border-[var(--color-teal)]"
              >
                {EDIT_CAPABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <button
                onClick={handleGenerateEdit}
                disabled={isGenerating || !editPrompt.trim()}
                className="w-full bg-gradient-to-r from-[var(--color-teal)] to-emerald-500 text-[#1a1814] p-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                Generate Edit
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-[#100f0d] flex items-center justify-center p-8 overflow-auto relative">
            <div 
              ref={containerRef}
              className="relative shadow-2xl"
              style={{ width: dimensions.width ? dimensions.width : 'auto', height: dimensions.height ? dimensions.height : 'auto', maxWidth: '100%', maxHeight: '100%', aspectRatio: dimensions.width && dimensions.height ? `${dimensions.width}/${dimensions.height}` : 'auto' }}
            >
              {/* Background Image */}
              <img 
                src={image.url} 
                alt="Original" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              />
              
              {/* Drawing Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              />

              {/* Generated Result Overlay */}
              {generatedImage && (
                <div className="absolute inset-0 z-20 bg-black">
                  <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-md">
                    <button 
                      onClick={() => {
                        // Keep: Update original image to generated, clear mask
                        // In a real app, we might want to update the 'image' prop or notify parent
                        // For now, we'll just call onSave with this image
                        onSave(generatedImage);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-600"
                    >
                      <Check size={18} /> Keep
                    </button>
                    <button 
                      onClick={() => setGeneratedImage(null)}
                      className="bg-white/10 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-white/20"
                    >
                      <RotateCcw size={18} /> Retry
                    </button>
                    <button 
                      onClick={() => {
                        setGeneratedImage(null);
                        setEditPrompt('');
                      }}
                      className="bg-red-500/80 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-600"
                    >
                      <X size={18} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
