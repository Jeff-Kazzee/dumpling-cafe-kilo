'use client';

import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface VariableFillerModalProps {
  promptContent: string;
  onClose: () => void;
  onSubmit: (filledPrompt: string) => void;
}

export function VariableFillerModal({ promptContent, onClose, onSubmit }: VariableFillerModalProps) {
  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Extract variables {{varName}}
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...promptContent.matchAll(regex)];
    const vars = [...new Set(matches.map(m => m[1].trim()))];
    setVariables(vars);
  }, [promptContent]);

  const handleSubmit = () => {
    let filled = promptContent;
    variables.forEach(v => {
      const val = values[v] || '';
      filled = filled.replace(new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'g'), val);
    });
    onSubmit(filled);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Fill Variables</h3>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {variables.map(v => (
            <div key={v}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">{v}</label>
              <input
                type="text"
                value={values[v] || ''}
                onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-teal)] outline-none"
                placeholder={`Enter ${v}...`}
              />
            </div>
          ))}
          {variables.length === 0 && (
            <p className="text-[var(--color-text-muted)]">No variables found in this prompt.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Cancel
          </button>
          <button onClick={handleSubmit} className="bg-[var(--color-teal)] text-[#1a1814] px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 flex items-center gap-2">
            <Send size={16} />
            Use Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
