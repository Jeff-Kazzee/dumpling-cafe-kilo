'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, CheckCircle, Play, Terminal, FileText, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { storage, ResearchTask } from '../lib/storage';
import { runPlannerAgent, runResearcherAgent, runWriterAgent, runCriticAgent } from '../lib/research';
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
      logs: [{ agent: 'System', message: 'Research task initialized.', timestamp: Date.now() }],
      totalCost: 0
    };

    setTasks(prev => [task, ...prev]);
    setActiveTaskId(task.id);
    setNewQuery('');
    await storage.save('research', task);

    executeResearch(task.id, task.query);
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

  const executeResearch = async (taskId: string, query: string) => {
    let currentCost = 0;
    
    try {
      // 1. Planner Agent
      addLog(taskId, 'Planner', `Analyzing topic: "${query}"...`);
      const plannerResult = await runPlannerAgent(query);
      currentCost += plannerResult.cost;
      updateTaskState(taskId, { totalCost: currentCost, progress: 10 });

      let subtopics: string[] = [];
      try {
        // Attempt to parse JSON array from content
        const jsonMatch = plannerResult.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          subtopics = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse planner output');
        }
      } catch (e) {
        console.error('Planner parse error:', e);
        addLog(taskId, 'Planner', 'Failed to parse plan. Using default structure.');
        subtopics = ['Overview', 'Key Findings', 'Conclusion'];
      }

      addLog(taskId, 'Planner', `Plan created: ${subtopics.join(', ')}`);
      updateTaskState(taskId, { progress: 20 });

      const finalResults: string[] = [];

      // 2. Execute loop for each subtopic
      for (let i = 0; i < subtopics.length; i++) {
        const subtopic = subtopics[i];
        const progressStep = 20 + ((i / subtopics.length) * 70); // Distribute remaining progress
        
        // Researcher
        addLog(taskId, 'Researcher', `Researching: "${subtopic}"...`);
        updateTaskState(taskId, { progress: progressStep });
        const researchResult = await runResearcherAgent(subtopic);
        currentCost += researchResult.cost;
        updateTaskState(taskId, { totalCost: currentCost });
        addLog(taskId, 'Researcher', `Found data for ${subtopic}.`);

        // Writer
        addLog(taskId, 'Writer', `Drafting section: "${subtopic}"...`);
        let writerResult = await runWriterAgent(subtopic, researchResult.content);
        currentCost += writerResult.cost;
        updateTaskState(taskId, { totalCost: currentCost });

        // Critic Loop
        addLog(taskId, 'Critic', `Reviewing draft for ${subtopic}...`);
        const criticResult = await runCriticAgent(writerResult.content);
        currentCost += criticResult.cost;
        updateTaskState(taskId, { totalCost: currentCost });

        if (!criticResult.passed) {
          addLog(taskId, 'Critic', `Critique: Score ${criticResult.score}/10. Requesting revision.`);
          addLog(taskId, 'Writer', `Revising "${subtopic}" based on feedback...`);
          
          // Revision
          writerResult = await runWriterAgent(subtopic, researchResult.content, criticResult.content);
          currentCost += writerResult.cost;
          updateTaskState(taskId, { totalCost: currentCost });
          addLog(taskId, 'Writer', 'Revision complete.');
        } else {
          addLog(taskId, 'Critic', `Critique: Score ${criticResult.score}/10. Approved.`);
        }

        finalResults.push(writerResult.content);
      }

      // Complete
      updateTaskState(taskId, { 
        status: 'completed', 
        progress: 100, 
        results: finalResults,
        totalCost: currentCost
      });
      addLog(taskId, 'System', 'Research completed successfully.');

    } catch (error) {
      console.error('Research error:', error);
      addLog(taskId, 'System', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        {activeTask ? (
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
                  <div className="flex items-center gap-2 mb-4 text-[var(--color-teal)]">
                    <FileText size={20} />
                    <h3 className="font-bold text-lg">Research Findings</h3>
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
