import { useState, useMemo } from 'react';
import { ArrowRight, ArrowLeft, Check, Feather, ExternalLink, Layers, Atom } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePackStore } from '../../store';
import { TERRAIN_META, COMPARTMENT_META, LIGHTENING_STRATEGIES } from '../../types';
import type { TerrainType, PackItem } from '../../types';
import { calculateLoadBalance } from '../../utils/loadBalance';
import { useDisplayMode } from '../shared/DisplayModeProvider';
import ReleaseRitualModal from '../items/ReleaseRitualModal';

type Step = 'review' | 'stuck' | 'classify' | 'terrain' | 'summary';
const STEPS: Step[] = ['review', 'stuck', 'classify', 'terrain', 'summary'];
const STEP_LABELS: Record<Step, string> = {
  review: 'Review All',
  stuck: 'Stuck Items',
  classify: 'Quick Classify',
  terrain: 'Terrain',
  summary: 'Summary',
};

export default function RepackMode() {
  const navigate = useNavigate();
  const items = usePackStore(s => s.items);
  const agentNotes = usePackStore(s => s.agentNotes);
  const profile = usePackStore(s => s.profile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const dropItem = usePackStore(s => s.dropItem);
  const setLighteningApproach = usePackStore(s => s.setLighteningApproach);
  const setNextStep = usePackStore(s => s.setNextStep);
  const classifyItem = usePackStore(s => s.classifyItem);
  const displayConfig = useDisplayMode();

  const [step, setStep] = useState<Step>('review');
  const [triageActions, setTriageActions] = useState<Record<string, 'keep' | 'drop' | 'lighten' | 'decompose'>>({});
  const [lightenExpanded, setLightenExpanded] = useState<string | null>(null);
  const [triageNextStep, setTriageNextStep] = useState<Record<string, string>>({});
  const [releaseQueue, setReleaseQueue] = useState<PackItem[]>([]);
  const [currentReleaseItem, setCurrentReleaseItem] = useState<PackItem | null>(null);

  // Quick classify state
  const [classifyIndex, setClassifyIndex] = useState(0);
  const [classWhat, setClassWhat] = useState('');
  const [classHow, setClassHow] = useState('');
  const [classWhy, setClassWhy] = useState('');
  const [classifiedCount, setClassifiedCount] = useState(0);

  const activeItems = items.filter(i => !i.droppedAt);
  const recoveryHistory = profile.recoveryHistory ?? [];
  const initialScore = calculateLoadBalance(items, profile.currentTerrain, recoveryHistory).score;

  // Review: ALL items grouped by compartment
  const itemsByCompartment = useMemo(() => {
    const groups = new Map<string, PackItem[]>();
    for (const item of activeItems.filter(i => !i.parentId)) {
      const comp = item.compartment;
      if (!groups.has(comp)) groups.set(comp, []);
      groups.get(comp)!.push(item);
    }
    return groups;
  }, [activeItems]);

  // Stuck items: weight stable 2+ weeks, no lightening strategy, or agent-flagged
  const stuckItems = useMemo(() => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const flaggedIds = new Set(
      agentNotes.filter(n => n.status === 'pending').flatMap(n => n.relatedItemIds),
    );

    return activeItems.filter(item => {
      if (item.parentId) return false;
      const isStale = new Date(item.updatedAt) < twoWeeksAgo;
      const noStrategy = item.weight > item.utility && !item.lighteningApproach;
      const isFlagged = flaggedIds.has(item.id);
      return isStale || noStrategy || isFlagged;
    });
  }, [activeItems, agentNotes]);

  // Unclassified atomic items
  const unclassifiedAtomic = useMemo(
    () => activeItems.filter(i => i.isAtomic && !i.classification),
    [activeItems],
  );

  const handleTriage = (itemId: string, action: 'keep' | 'drop' | 'lighten' | 'decompose') => {
    setTriageActions(prev => ({ ...prev, [itemId]: action }));
    if (action === 'lighten') {
      setLightenExpanded(itemId);
    } else if (lightenExpanded === itemId) {
      setLightenExpanded(null);
    }
  };

  const applyTriage = () => {
    const itemsToDrop = Object.entries(triageActions)
      .filter(([, action]) => action === 'drop')
      .map(([id]) => items.find(i => i.id === id)!)
      .filter(Boolean);

    if (itemsToDrop.length > 0) {
      setReleaseQueue(itemsToDrop.slice(1));
      setCurrentReleaseItem(itemsToDrop[0]);
    }
  };

  const handleReleaseComplete = () => {
    if (releaseQueue.length > 0) {
      setCurrentReleaseItem(releaseQueue[0]);
      setReleaseQueue(prev => prev.slice(1));
    } else {
      setCurrentReleaseItem(null);
    }
  };

  const handleQuickClassify = () => {
    const item = unclassifiedAtomic[classifyIndex];
    if (item && (classWhat.trim() || classHow.trim() || classWhy.trim())) {
      classifyItem(item.id, {
        what: classWhat.trim(),
        how: classHow.trim(),
        why: classWhy.trim(),
        classifiedAt: new Date().toISOString(),
      });
      setClassifiedCount(prev => prev + 1);
    }
    setClassWhat('');
    setClassHow('');
    setClassWhy('');
    setClassifyIndex(prev => prev + 1);
  };

  const finalScore = useMemo(() => {
    const simulated = items.map(i => {
      if (triageActions[i.id] === 'drop') return { ...i, droppedAt: 'simulated' };
      return i;
    });
    return calculateLoadBalance(simulated as PackItem[], profile.currentTerrain, recoveryHistory).score;
  }, [items, triageActions, profile.currentTerrain, recoveryHistory]);

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    if (step === 'stuck') applyTriage();
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]);
  };

  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-xl font-semibold text-white">Weekly Check-in</h1>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < stepIndex && setStep(s)} className="flex-1">
            <div className={`h-1 rounded-full ${i <= stepIndex ? 'bg-amber-500' : 'bg-slate-800'}`} />
            <span className={`text-[10px] mt-1 block ${i === stepIndex ? 'text-amber-400' : 'text-slate-600'}`}>
              {STEP_LABELS[s]}
            </span>
          </button>
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
          {/* ── Review All ── */}
          {step === 'review' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Everything in your pack right now:</p>
              {Array.from(itemsByCompartment.entries()).map(([comp, compItems]) => {
                const meta = COMPARTMENT_META[comp as keyof typeof COMPARTMENT_META];
                return (
                  <div key={comp} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{meta.emoji}</span>
                      <span className="text-xs font-medium text-slate-400">{meta.label}</span>
                      <span className="text-[10px] text-slate-600">{compItems.length}</span>
                    </div>
                    {compItems.map(item => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-white truncate">{item.name}</span>
                          {item.isAtomic && <Atom size={10} className="text-emerald-400 shrink-0" />}
                          {item.isContainer && <Layers size={10} className="text-amber-400 shrink-0" />}
                          {item.classification && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1 rounded shrink-0">classified</span>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs font-mono shrink-0 ml-2">
                          <span className="text-rose-400">W:{item.weight}</span>
                          <span className="text-emerald-400">U:{item.utility}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {activeItems.length === 0 && (
                <p className="text-sm text-slate-600 italic py-6 text-center">Your pack is empty.</p>
              )}
            </div>
          )}

          {/* ── Stuck Items ── */}
          {step === 'stuck' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Items that are stale, unstrategized, or flagged by agents:</p>
              {stuckItems.length > 0 ? (
                stuckItems.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">{item.name}</span>
                      <span className="text-xs text-slate-500">{COMPARTMENT_META[item.compartment].emoji} {COMPARTMENT_META[item.compartment].label}</span>
                    </div>
                    <div className="flex gap-2 text-xs font-mono mb-3">
                      <span className="text-rose-400">W:{item.weight}</span>
                      <span className="text-emerald-400">U:{item.utility}</span>
                      <span className="text-slate-600">Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
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
                        onClick={() => handleTriage(item.id, 'lighten')}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                          triageActions[item.id] === 'lighten'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <Feather size={10} /> Lighten
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
                      {!item.isContainer && !item.isAtomic && (
                        <button
                          onClick={() => {
                            handleTriage(item.id, 'decompose');
                            navigate(`/decompose/${item.id}`);
                          }}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                            triageActions[item.id] === 'decompose'
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <Layers size={10} /> Unpack
                        </button>
                      )}
                    </div>

                    {/* Inline lightening panel */}
                    <AnimatePresence>
                      {lightenExpanded === item.id && triageActions[item.id] === 'lighten' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2 pt-3 border-t border-slate-800">
                            {!item.lighteningApproach ? (
                              <>
                                <p className="text-[10px] text-slate-500">Pick an approach:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {LIGHTENING_STRATEGIES[item.compartment].map(strategy => (
                                    <button
                                      key={strategy.key}
                                      onClick={() => setLighteningApproach(item.id, strategy.key)}
                                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
                                      title={strategy.description}
                                    >
                                      {strategy.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded">
                                    {LIGHTENING_STRATEGIES[item.compartment].find(s => s.key === item.lighteningApproach)?.label ?? item.lighteningApproach}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={triageNextStep[item.id] ?? ''}
                                    onChange={e => setTriageNextStep(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    placeholder="Next step this week..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && triageNextStep[item.id]?.trim()) {
                                        setNextStep(item.id, triageNextStep[item.id].trim());
                                        setTriageNextStep(prev => ({ ...prev, [item.id]: '' }));
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      if (triageNextStep[item.id]?.trim()) {
                                        setNextStep(item.id, triageNextStep[item.id].trim());
                                        setTriageNextStep(prev => ({ ...prev, [item.id]: '' }));
                                      }
                                    }}
                                    disabled={!triageNextStep[item.id]?.trim()}
                                    className="px-2.5 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-[11px] font-medium hover:bg-amber-400 transition-colors disabled:opacity-40"
                                  >
                                    Set
                                  </button>
                                </div>
                                {item.nextStep && (
                                  <p className="text-[11px] text-emerald-400">Next step set!</p>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 italic py-6 text-center">Nothing stuck. Your pack is in good shape.</p>
              )}
            </div>
          )}

          {/* ── Quick Classify ── */}
          {step === 'classify' && (
            <div className="space-y-4">
              {classifyIndex < unclassifiedAtomic.length ? (
                (() => {
                  const item = unclassifiedAtomic[classifyIndex];
                  return (
                    <>
                      <p className="text-xs text-slate-500">
                        {classifyIndex + 1} of {unclassifiedAtomic.length} unclassified atomic items
                      </p>
                      <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{COMPARTMENT_META[item.compartment].emoji}</span>
                          <span className="text-white font-medium">{item.name}</span>
                          <Atom size={12} className="text-emerald-400" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-amber-400 mb-1.5">What is this?</label>
                          <input type="text" value={classWhat} onChange={e => setClassWhat(e.target.value)}
                            placeholder="In your own words..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-amber-400 mb-1.5">How does it affect your daily life?</label>
                          <input type="text" value={classHow} onChange={e => setClassHow(e.target.value)}
                            placeholder="What does it do to your days..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-amber-400 mb-1.5">Why does it weigh on you?</label>
                          <input type="text" value={classWhy} onChange={e => setClassWhy(e.target.value)}
                            placeholder="The root of its weight..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50" />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={handleQuickClassify}
                          className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm hover:bg-slate-700 transition-colors">
                          Skip
                        </button>
                        <button onClick={handleQuickClassify}
                          className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors">
                          Save & Next
                        </button>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="text-center py-8 space-y-3">
                  <Atom size={32} className="text-emerald-400 mx-auto" />
                  <p className="text-sm text-slate-400">
                    {unclassifiedAtomic.length === 0
                      ? 'All atomic items are classified. Nice work.'
                      : `Done! Classified ${classifiedCount} item${classifiedCount !== 1 ? 's' : ''} this session.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Terrain ── */}
          {step === 'terrain' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">How does life feel now?</p>
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

          {/* ── Summary ── */}
          {step === 'summary' && (
            <div className="text-center py-8 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">{displayConfig.framingStyle === 'progress' ? 'Progress' : 'Load Balance'}</p>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <span className="font-mono text-2xl text-slate-500">{initialScore}</span>
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
                      {finalScore}
                    </motion.span>
                    <span className="block text-[10px] text-slate-600">After</span>
                  </div>
                </div>
              </div>

              {/* Session stats */}
              <div className="space-y-2 text-sm">
                {Object.values(triageActions).filter(a => a === 'drop').length > 0 && (
                  <p className="text-emerald-400">
                    Released {Object.values(triageActions).filter(a => a === 'drop').length} item(s).
                  </p>
                )}
                {Object.values(triageActions).filter(a => a === 'lighten').length > 0 && (
                  <p className="text-amber-400">
                    Lightening {Object.values(triageActions).filter(a => a === 'lighten').length} item(s).
                  </p>
                )}
                {classifiedCount > 0 && (
                  <p className="text-violet-400">
                    Classified {classifiedCount} item{classifiedCount !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {/* Active next steps */}
              {(() => {
                const itemsWithSteps = activeItems.filter(i => i.nextStep && !i.nextStep.completedAt);
                return itemsWithSteps.length > 0 ? (
                  <div className="text-left max-w-sm mx-auto space-y-1.5">
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider">Active Next Steps</span>
                    {itemsWithSteps.map(item => (
                      <div key={item.id} className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-xs">{COMPARTMENT_META[item.compartment].emoji}</span>
                        <span className="text-xs text-slate-300 truncate">{item.nextStep!.text}</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Every check-in is a chance to carry only what serves you. Keep going.
              </p>

              {/* Coach-mark.ai CTA */}
              <a
                href="https://coach-mark.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                <ExternalLink size={12} /> Want deeper support? Try coach-mark.ai
              </a>

              <Check size={32} className="text-amber-500 mx-auto" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step !== 'summary' && (
        <div className="flex justify-between">
          {stepIndex > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            {step === 'terrain' ? 'Finish' : 'Next'} <ArrowRight size={16} />
          </button>
        </div>
      )}

      {currentReleaseItem && (
        <ReleaseRitualModal
          item={currentReleaseItem}
          onClose={() => {
            setCurrentReleaseItem(null);
            setReleaseQueue([]);
          }}
          onComplete={handleReleaseComplete}
        />
      )}
    </div>
  );
}
