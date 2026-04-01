import { useState, useMemo } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { AGENTS, TERRAIN_META, COMPARTMENT_META } from '../../types';
import type { TerrainType, PackItem } from '../../types';
import { calculatePaceScore } from '../../utils/paceScore';

type Step = 'review' | 'briefing' | 'triage' | 'terrain' | 'summary';
const STEPS: Step[] = ['review', 'briefing', 'triage', 'terrain', 'summary'];
const STEP_LABELS: Record<Step, string> = {
  review: 'Review Changes',
  briefing: 'Agent Briefing',
  triage: 'Triage Items',
  terrain: 'Terrain Check',
  summary: 'Summary',
};

export default function RepackMode() {
  const items = usePackStore(s => s.items);
  const agentNotes = usePackStore(s => s.agentNotes);
  const profile = usePackStore(s => s.profile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const updateItem = usePackStore(s => s.updateItem);
  const dropItem = usePackStore(s => s.dropItem);

  const [step, setStep] = useState<Step>('review');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [triageActions, setTriageActions] = useState<Record<string, 'keep' | 'drop'>>({});

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentlyChanged = items.filter(
    i => !i.droppedAt && new Date(i.updatedAt) >= weekAgo,
  );

  const flaggedItems = useMemo(() => {
    const flaggedIds = new Set(
      agentNotes.filter(n => n.status === 'pending').flatMap(n => n.relatedItemIds),
    );
    return items.filter(i => !i.droppedAt && flaggedIds.has(i.id));
  }, [agentNotes, items]);

  const agentBriefings = useMemo(() => {
    const byAgent = new Map<string, typeof agentNotes>();
    agentNotes.filter(n => n.status === 'pending').forEach(n => {
      if (!byAgent.has(n.agentId)) byAgent.set(n.agentId, []);
      byAgent.get(n.agentId)!.push(n);
    });
    return byAgent;
  }, [agentNotes]);

  const initialScore = calculatePaceScore(items, profile.currentTerrain);

  const handleTriage = (itemId: string, action: 'keep' | 'drop') => {
    setTriageActions(prev => ({ ...prev, [itemId]: action }));
  };

  const applyTriage = () => {
    Object.entries(triageActions).forEach(([id, action]) => {
      if (action === 'drop') dropItem(id);
    });
  };

  const finalScore = useMemo(() => {
    const simulated = items.map(i => {
      if (triageActions[i.id] === 'drop') return { ...i, droppedAt: 'simulated' };
      return i;
    });
    return calculatePaceScore(simulated as PackItem[], profile.currentTerrain);
  }, [items, triageActions, profile.currentTerrain]);

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    if (step === 'triage') applyTriage();
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-xl font-semibold text-white">Weekly Repack</h1>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= stepIndex ? 'bg-amber-500' : 'bg-slate-800'}`} />
            <span className={`text-[10px] mt-1 block ${i === stepIndex ? 'text-amber-400' : 'text-slate-600'}`}>
              {STEP_LABELS[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 'review' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Items that changed this week:</p>
              {recentlyChanged.length > 0 ? (
                recentlyChanged.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white">{item.name}</span>
                      <span className="text-xs text-slate-500 ml-2">{COMPARTMENT_META[item.compartment].emoji}</span>
                    </div>
                    <div className="flex gap-2 text-xs font-mono">
                      <span className="text-rose-400">W:{item.weight}</span>
                      <span className="text-emerald-400">U:{item.utility}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 italic py-6 text-center">No items changed this week. Your pack has been stable.</p>
              )}
            </div>
          )}

          {step === 'briefing' && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Your agents have observations to share:</p>
              {agentBriefings.size > 0 ? (
                Array.from(agentBriefings.entries()).map(([agentId, notes]) => {
                  const agent = AGENTS[agentId as keyof typeof AGENTS];
                  const isExpanded = expandedAgent === agentId;
                  return (
                    <div key={agentId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedAgent(isExpanded ? null : agentId)}
                        className="w-full p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{agent.emoji}</span>
                          <span className="text-sm font-medium text-white">{agent.name}</span>
                          <span className="text-[10px] text-slate-500">{notes.length} notes</span>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-2">
                              {notes.slice(0, 3).map(note => (
                                <p key={note.id} className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-2.5">
                                  {note.content}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-600 italic py-6 text-center">Your agents are quiet this week. All clear.</p>
              )}
            </div>
          )}

          {step === 'triage' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Items flagged by your agents. Decide their fate:</p>
              {flaggedItems.length > 0 ? (
                flaggedItems.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">{item.name}</span>
                      <span className="text-xs text-slate-500">{COMPARTMENT_META[item.compartment].emoji} {COMPARTMENT_META[item.compartment].label}</span>
                    </div>
                    <div className="flex gap-2 text-xs font-mono mb-3">
                      <span className="text-rose-400">W:{item.weight}</span>
                      <span className="text-emerald-400">U:{item.utility}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTriage(item.id, 'keep')}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          triageActions[item.id] === 'keep'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        Keep
                      </button>
                      <button
                        onClick={() => handleTriage(item.id, 'drop')}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          triageActions[item.id] === 'drop'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 italic py-6 text-center">Nothing flagged for triage. Your pack is in good shape.</p>
              )}
            </div>
          )}

          {step === 'terrain' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Has your terrain changed?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['summit', 'downhill', 'camp', 'uphill', 'ridge', 'swamp'] as TerrainType[]).map(t => {
                  const meta = TERRAIN_META[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setTerrain(t)}
                      className={`p-3 rounded-xl text-left transition-colors ${
                        profile.currentTerrain === t
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-lg mb-1">{meta.emoji}</div>
                      <div className="text-sm font-medium text-white">{meta.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{meta.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="text-center py-8 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Pace Score</p>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <span className="font-mono text-2xl text-slate-500">{initialScore.toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-600">Before</span>
                  </div>
                  <ArrowRight size={20} className="text-amber-500" />
                  <div>
                    <motion.span
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="font-mono text-3xl text-amber-400 block"
                    >
                      {finalScore.toFixed(2)}
                    </motion.span>
                    <span className="block text-[10px] text-slate-600">After</span>
                  </div>
                </div>
              </div>
              {Object.values(triageActions).filter(a => a === 'drop').length > 0 && (
                <p className="text-emerald-400 text-sm">
                  You let go of {Object.values(triageActions).filter(a => a === 'drop').length} item(s). That's lighter already.
                </p>
              )}
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Every repack is a chance to carry only what serves you. You're doing the work. Keep going.
              </p>
              <Check size={32} className="text-amber-500 mx-auto" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step !== 'summary' && (
        <div className="flex justify-end">
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            {step === 'terrain' ? 'Finish Repack' : 'Next'} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
