'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, CheckCircle, Play, Terminal, FileText, Clock } from 'lucide-react';
import { storage, ResearchTask } from '../lib/storage';
import clsx from 'clsx';

const generateId = () => crypto.randomUUID();

export function ResearchView() {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

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
      logs: [{ agent: 'System', message: 'Research task initialized.', timestamp: Date.now() }]
    };

    setTasks(prev => [task, ...prev]);
    setActiveTaskId(task.id);
    setNewQuery('');
    await storage.save('research', task);

    simulateResearch(task.id);
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

  const updateProgress = (taskId: string, progress: number, status?: ResearchTask['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, progress, ...(status ? { status } : {}) };
        storage.save('research', updated);
        return updated;
      }
      return t;
    }));
  };

  const simulateResearch = async (taskId: string) => {
    const steps = [
      { agent: 'Planner', msg: 'Analyzing research query...', duration: 1000 },
      { agent: 'Planner', msg: 'Decomposing into sub-tasks: Market Analysis, Competitor Review, Future Trends.', duration: 1500 },
      { agent: 'Searcher', msg: 'Searching for "latest trends in ' + newQuery + '"...', duration: 2000 },
      { agent: 'Searcher', msg: 'Found 12 relevant sources from reputable domains.', duration: 1000 },
      { agent: 'Analyst', msg: 'Reading Source 1: Industry Report 2024...', duration: 1500 },
      { agent: 'Analyst', msg: 'Reading Source 2: TechCrunch Article...', duration: 1500 },
      { agent: 'Analyst', msg: 'Extracting key insights and data points...', duration: 2000 },
      { agent: 'Writer', msg: 'Synthesizing findings into executive summary...', duration: 1500 },
      { agent: 'Writer', msg: 'Formatting final report...', duration: 1000 },
    ];

    let currentStep = 0;
    
    const runStep = () => {
      if (currentStep >= steps.length) {
        updateProgress(taskId, 100, 'completed');
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            const updated = {
              ...t,
              results: [
                'Market is projected to grow by 15% CAGR.',
                'Key competitors are investing heavily in AI integration.',
                'Regulatory challenges remain a primary concern.',
                'Consumer sentiment is shifting towards sustainable options.'
              ]
            };
            storage.save('research', updated);
            return updated;
          }
          return t;
        }));
        addLog(taskId, 'System', 'Research completed successfully.');
        return;
      }

      const step = steps[currentStep];
      addLog(taskId, step.agent, step.msg);
      updateProgress(taskId, Math.round(((currentStep + 1) / steps.length) * 90));
      
      currentStep++;
      setTimeout(runStep, step.duration);
    };

    runStep();
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="h-full flex bg-[var(--color-background)]">
      {/* Sidebar Task List */}
      <div className="w-80 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-surface)] shrink-0">
        <div className="p-4 border-b border-[var(--color-border)]">
          <button 
            onClick={() => setNewQuery('')} // Just focus input
            className="w-full bg-[var(--color-teal)] text-[#1a1814] py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-opacity-90"
          >
            <Play size={16} /> New Research
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={clsx(
                "p-4 border-b border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors",
                activeTaskId === task.id ? "bg-[var(--color-surface-active)]" : ""
              )}
            >
              <h3 className="font-medium text-[var(--color-text-primary)] line-clamp-1 mb-1">{task.query}</h3>
              <div className="flex justify-between items-center text-xs">
                <span className={clsx(
                  "px-2 py-0.5 rounded-full",
                  task.status === 'completed' ? "bg-[var(--color-sage)]/20 text-[var(--color-sage)]" :
                  task.status === 'researching' ? "bg-[var(--color-gold)]/20 text-[var(--color-gold)]" :
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
        {activeTask ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{activeTask.query}</h2>
              <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(activeTask.timestamp).toLocaleString()}</span>
                <span className="flex items-center gap-1">
                  {activeTask.status === 'researching' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
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
                  <div className="flex items-center gap-2 mb-4 text-[var(--color-teal)]">
                    <FileText size={20} />
                    <h3 className="font-bold text-lg">Research Findings</h3>
                  </div>
                  <ul className="space-y-3">
                    {activeTask.results.map((result, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-[var(--color-text-primary)]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-teal)] shrink-0" />
                        <span className="leading-relaxed">{result}</span>
                      </li>
                    ))}
                  </ul>
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
                        log.agent === 'Searcher' ? "text-[var(--color-teal)]" :
                        log.agent === 'Analyst' ? "text-[var(--color-coral)]" :
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
            <Search size={64} className="text-[var(--color-surface-active)] mb-6" />
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Start New Research</h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mb-8">
              Enter a topic below to deploy our multi-agent system. We will analyze sources, extract insights, and compile a report.
            </p>
            
            <div className="w-full max-w-xl relative">
              <input
                type="text"
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startResearch()}
                placeholder="e.g., 'Impact of Quantum Computing on Cryptography'"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl pl-6 pr-14 py-4 text-lg focus:outline-none focus:border-[var(--color-teal)] shadow-lg"
              />
              <button
                onClick={startResearch}
                className="absolute right-2 top-2 bottom-2 bg-[var(--color-teal)] text-[#1a1814] px-4 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <Play size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
