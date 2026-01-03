'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, Play, Terminal, FileText, Clock, DollarSign, AlertCircle, MessageSquare, Trash2, Plus, Settings } from 'lucide-react';
import { storage, ResearchTask } from '../lib/storage';
import { runPlannerAgent, runResearcherAgent, runWriterAgent, runQuickResearch, RESEARCH_PRESETS, ResearchModels, getResearchModels } from '../lib/research';
import { Mascot } from './Mascot';
import clsx from 'clsx';

const generateId = () => crypto.randomUUID();

interface ResearchViewProps {
  onDiscussInChat?: (text: string) => void;
}

export function ResearchView({ onDiscussInChat }: ResearchViewProps) {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [showNewResearch, setShowNewResearch] = useState(false);
  const [researchMode, setResearchMode] = useState<'quick' | 'deep'>('quick');
  const [preset, setPreset] = useState<'fast' | 'balanced' | 'quality' | 'custom'>('fast');
  const [customModels, setCustomModels] = useState<ResearchModels>(RESEARCH_PRESETS.fast.models);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current models based on preset
  const currentModels = preset === 'custom' ? customModels : RESEARCH_PRESETS[preset].models;

  useEffect(() => {
    const loadTasks = async () => {
      const loaded = await storage.getAll<ResearchTask>('research');
      const sorted = loaded.sort((a, b) => b.timestamp - a.timestamp);
      setTasks(sorted);
      if (!activeTaskId && sorted.length > 0) {
        setActiveTaskId(sorted[0].id);
      }
    };
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTaskId && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tasks, activeTaskId]);

  const startResearch = async () => {
    if (!newQuery.trim()) return;

    const task: ResearchTask = {
      id: generateId(),
      query: newQuery,
      status: 'researching',
      progress: 0,
      results: [],
      timestamp: Date.now(),
      logs: [{ agent: 'System', message: 'Research task initialized.', timestamp: Date.now() }],
      totalCost: 0
    };

    setTasks(prev => [task, ...prev]);
    setActiveTaskId(task.id);
    setNewQuery('');
    setShowNewResearch(false);
    await storage.save('research', task);

    executeResearch(task.id, task.query, researchMode, currentModels);
  };

  const deleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this research task?')) return;

    await storage.delete('research', taskId);
    setTasks(prev => {
      const remaining = prev.filter(t => t.id !== taskId);
      if (activeTaskId === taskId) {
        setActiveTaskId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  const handleNewResearch = () => {
    setShowNewResearch(true);
    setActiveTaskId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const addLog = (taskId: string, agent: string, message: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = {
          ...t,
          logs: [...(t.logs || []), { agent, message, timestamp: Date.now() }]
        };
        storage.save('research', updated);
        return updated;
      }
      return t;
    }));
  };

  const updateTaskState = (taskId: string, updates: Partial<ResearchTask>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, ...updates };
        storage.save('research', updated);
        return updated;
      }
      return t;
    }));
  };

  const executeResearch = async (taskId: string, query: string, mode: 'quick' | 'deep', models: ResearchModels) => {
    let currentCost = 0;

    try {
      if (mode === 'quick') {
        // QUICK MODE: Single API call with web search
        addLog(taskId, 'Researcher', `Quick research using ${models.researcher.split('/').pop()}...`);
        updateTaskState(taskId, { progress: 30 });

        const result = await runQuickResearch(query, models.researcher);
        currentCost += result.cost;
        updateTaskState(taskId, { totalCost: currentCost, progress: 90 });

        addLog(taskId, 'Researcher', 'Research complete.');
        updateTaskState(taskId, {
          status: 'completed',
          progress: 100,
          results: [result.content],
          totalCost: currentCost
        });
        addLog(taskId, 'System', 'Quick research completed successfully.');
        return;
      }

      // DEEP MODE: Multi-agent pipeline
      addLog(taskId, 'Planner', `Planning with ${models.planner.split('/').pop()}...`);
      updateTaskState(taskId, { progress: 5 });

      const plannerResult = await runPlannerAgent(query, models.planner);
      currentCost += plannerResult.cost;
      updateTaskState(taskId, { totalCost: currentCost, progress: 15 });

      let subtopics: string[] = [];
      try {
        const jsonMatch = plannerResult.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          subtopics = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse planner output');
        }
      } catch (e) {
        console.error('Planner parse error:', e);
        addLog(taskId, 'Planner', 'Using default structure.');
        subtopics = ['Overview', 'Key Findings', 'Conclusion'];
      }

      subtopics = subtopics.slice(0, 3);
      addLog(taskId, 'Planner', `Sections: ${subtopics.join(', ')}`);
      updateTaskState(taskId, { progress: 20 });

      const finalResults: string[] = [];

      for (let i = 0; i < subtopics.length; i++) {
        const subtopic = subtopics[i];
        const baseProgress = 20 + (i * 25);

        addLog(taskId, 'Researcher', `Researching: "${subtopic}"...`);
        updateTaskState(taskId, { progress: baseProgress + 5 });

        const researchResult = await runResearcherAgent(subtopic, models.researcher, true);
        currentCost += researchResult.cost;
        updateTaskState(taskId, { totalCost: currentCost, progress: baseProgress + 10 });
        addLog(taskId, 'Researcher', `Found data for ${subtopic}.`);

        addLog(taskId, 'Writer', `Writing: "${subtopic}"...`);
        const writerResult = await runWriterAgent(subtopic, researchResult.content, models.writer);
        currentCost += writerResult.cost;
        updateTaskState(taskId, { totalCost: currentCost, progress: baseProgress + 20 });
        addLog(taskId, 'Writer', `Section complete.`);

        finalResults.push(writerResult.content);
      }

      updateTaskState(taskId, {
        status: 'completed',
        progress: 100,
        results: finalResults,
        totalCost: currentCost
      });
      addLog(taskId, 'System', 'Deep research completed successfully.');

    } catch (error) {
      console.error('Research error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(taskId, 'System', `Error: ${errorMsg}`);
      updateTaskState(taskId, { status: 'failed', totalCost: currentCost });
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="h-full flex bg-[var(--color-background)]">
      {/* Sidebar Task List */}
      <div className="w-80 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-surface)] shrink-0">
        <div className="p-4 border-b border-[var(--color-border)]">
          <button
            onClick={handleNewResearch}
            className="w-full bg-[var(--color-teal)] text-[#1a1814] py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90"
          >
            <Plus size={16} /> New Research
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => { setActiveTaskId(task.id); setShowNewResearch(false); }}
              className={clsx(
                "p-4 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors group",
                activeTaskId === task.id && !showNewResearch ? "bg-[var(--color-surface-active)]" : ""
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-medium text-[var(--color-text-primary)] line-clamp-1 mb-1 flex-1">{task.query}</h3>
                <button
                  onClick={(e) => deleteTask(task.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--color-coral)]/20 rounded transition-all"
                  title="Delete research"
                >
                  <Trash2 size={14} className="text-[var(--color-coral)]" />
                </button>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={clsx(
                  "px-2 py-0.5 rounded-full",
                  task.status === 'completed' ? "bg-[var(--color-sage)]/20 text-[var(--color-sage)]" :
                  task.status === 'researching' ? "bg-[var(--color-gold)]/20 text-[var(--color-gold)]" :
                  task.status === 'failed' ? "bg-[var(--color-coral)]/20 text-[var(--color-coral)]" :
                  "bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]"
                )}>
                  {task.status}
                </span>
                <span className="text-[var(--color-text-muted)]">{new Date(task.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeTask && !showNewResearch ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{activeTask.query}</h2>
                <div className="flex items-center gap-2 bg-[var(--color-background)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                  <DollarSign size={14} className="text-[var(--color-gold)]" />
                  <span className="text-sm font-mono text-[var(--color-text-primary)]">
                    ${(activeTask.totalCost || 0).toFixed(4)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(activeTask.timestamp).toLocaleString()}</span>
                <span className="flex items-center gap-1">
                  {activeTask.status === 'researching' ? <Loader2 size={14} className="animate-spin" /> : 
                   activeTask.status === 'failed' ? <AlertCircle size={14} className="text-[var(--color-coral)]" /> :
                   <CheckCircle size={14} />}
                  {activeTask.status.toUpperCase()}
                </span>
              </div>
              
              {/* Progress Bar */}
              {activeTask.status === 'researching' && (
                <div className="mt-4 w-full bg-[var(--color-background)] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[var(--color-teal)] h-full transition-all duration-500"
                    style={{ width: `${activeTask.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Results Section */}
              {activeTask.results.length > 0 && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[var(--color-teal)]">
                      <FileText size={20} />
                      <h3 className="font-bold text-lg">Research Findings</h3>
                    </div>
                    {onDiscussInChat && (
                      <button
                        onClick={() => onDiscussInChat(activeTask.results.join('\n\n'))}
                        className="flex items-center gap-2 text-sm bg-[var(--color-teal)]/10 text-[var(--color-teal)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-teal)] hover:text-[#1a1814] transition-colors"
                      >
                        <MessageSquare size={14} />
                        Discuss in Chat
                      </button>
                    )}
                  </div>
                  <div className="space-y-6">
                    {activeTask.results.map((result, idx) => (
                      <div key={idx} className="prose prose-invert max-w-none border-b border-[var(--color-border)] last:border-0 pb-6 last:pb-0">
                        <div className="whitespace-pre-wrap text-[var(--color-text-primary)] leading-relaxed">
                          {result}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Logs */}
              <div className="bg-[#100f0d] border border-[var(--color-border)] rounded-xl overflow-hidden font-mono text-sm">
                <div className="bg-[var(--color-surface)] px-4 py-2 border-b border-[var(--color-border)] flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <Terminal size={14} />
                  <span className="font-bold uppercase tracking-wider text-xs">Agent Activity Log</span>
                </div>
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {activeTask.logs?.map((log, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-[var(--color-text-muted)] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={clsx(
                        "font-bold shrink-0 w-20",
                        log.agent === 'Planner' ? "text-[var(--color-gold)]" :
                        log.agent === 'Researcher' ? "text-[var(--color-teal)]" :
                        log.agent === 'Critic' ? "text-[var(--color-coral)]" :
                        log.agent === 'Writer' ? "text-[var(--color-lavender)]" :
                        "text-[var(--color-text-secondary)]"
                      )}>
                        {log.agent}
                      </span>
                      <span className="text-[var(--color-text-primary)]">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Mascot state="searching" className="w-32 h-32 mb-6" />
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Start New Research</h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
              Enter a topic below. Choose Quick for fast results or Deep for comprehensive analysis.
            </p>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setResearchMode('quick')}
                className={clsx(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  researchMode === 'quick'
                    ? "bg-[var(--color-teal)] text-[#1a1814]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                Quick (1 call)
              </button>
              <button
                onClick={() => setResearchMode('deep')}
                className={clsx(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  researchMode === 'deep'
                    ? "bg-[var(--color-lavender)] text-[#1a1814]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                Deep (multi-agent)
              </button>
            </div>

            {/* Model Preset Selector */}
            <div className="w-full max-w-xl mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Model Preset:</span>
                <button
                  onClick={() => setShowModelSettings(!showModelSettings)}
                  className="text-xs text-[var(--color-teal)] hover:underline flex items-center gap-1"
                >
                  <Settings size={12} />
                  {showModelSettings ? 'Hide' : 'Customize'}
                </button>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {(Object.keys(RESEARCH_PRESETS) as Array<keyof typeof RESEARCH_PRESETS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setPreset(key as 'fast' | 'balanced' | 'quality' | 'custom')}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      preset === key
                        ? key === 'fast' ? "bg-[var(--color-sage)] text-[#1a1814]"
                        : key === 'balanced' ? "bg-[var(--color-gold)] text-[#1a1814]"
                        : key === 'quality' ? "bg-[var(--color-lavender)] text-[#1a1814]"
                        : "bg-[var(--color-teal)] text-[#1a1814]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    )}
                    title={RESEARCH_PRESETS[key].description}
                  >
                    {RESEARCH_PRESETS[key].name}
                  </button>
                ))}
              </div>

              <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                {RESEARCH_PRESETS[preset].description}
              </p>

              {/* Custom Model Settings */}
              {showModelSettings && preset === 'custom' && (
                <div className="mt-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl space-y-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Planner Model</label>
                    <select
                      value={customModels.planner}
                      onChange={(e) => setCustomModels(prev => ({ ...prev, planner: e.target.value }))}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)]"
                    >
                      {getResearchModels().map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Researcher Model</label>
                    <select
                      value={customModels.researcher}
                      onChange={(e) => setCustomModels(prev => ({ ...prev, researcher: e.target.value }))}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)]"
                    >
                      {getResearchModels().map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Writer Model</label>
                    <select
                      value={customModels.writer}
                      onChange={(e) => setCustomModels(prev => ({ ...prev, writer: e.target.value }))}
                      className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-teal)]"
                    >
                      {getResearchModels().map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-xl relative">
              <input
                ref={inputRef}
                type="text"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startResearch()}
                placeholder={researchMode === 'quick' ? "Quick question..." : "Topic to research deeply..."}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl pl-6 pr-14 py-4 text-lg focus:outline-none focus:border-[var(--color-teal)] shadow-lg"
                autoFocus
              />
              <button
                onClick={startResearch}
                disabled={!newQuery.trim()}
                className="absolute right-2 top-2 bottom-2 bg-[var(--color-teal)] text-[#1a1814] px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                <Play size={20} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mt-4">
              {researchMode === 'quick'
                ? "Uses web search for fast, factual answers"
                : "Uses Planner → Researcher → Writer agents for comprehensive reports"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
