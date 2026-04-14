import { useState, useMemo, type ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Atom, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, LIGHTENING_STRATEGIES, DIMENSION_LABELS } from '../../types';
import type { PackItem, Compartment, WeightDimensions } from '../../types';
import { TOP_LEVEL_CATEGORIES, dimensionsToWeight } from '../../types/suggestions';
import type { SubItemSuggestion } from '../../types/suggestions';

type FlowStep = 'select' | 'decompose' | 'classify-or-deeper' | 'classify' | 'summary';

// Maps a weight (roughly 1–10) to a visual size for the boulder emoji.
// Heavy items look like bigger rocks; light ones look like pebbles.
function boulderFontSize(weight: number): string {
  const clamped = Math.max(1, Math.min(10, weight));
  return `${0.95 + clamped * 0.18}em`;
}

function Boulder({ weight, className = '' }: { weight: number; className?: string }) {
  return (
    <motion.span
      className={`inline-block leading-none select-none ${className}`}
      style={{ fontSize: boulderFontSize(weight) }}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      aria-hidden
    >
      🪨
    </motion.span>
  );
}

export default function DecomposeFlow() {
  const { itemId: routeItemId } = useParams<{ itemId?: string }>();
  const navigate = useNavigate();

  const items = usePackStore(s => s.items);
  const addItem = usePackStore(s => s.addItem);
  const markAsContainer = usePackStore(s => s.markAsContainer);
  const markAtomic = usePackStore(s => s.markAtomic);
  const classifyItem = usePackStore(s => s.classifyItem);
  const getUnprocessedItems = usePackStore(s => s.getUnprocessedItems);
  const getChildItems = usePackStore(s => s.getChildItems);
  const getEffectiveWeight = usePackStore(s => s.getEffectiveWeight);


  // Stack of item IDs we're decomposing (allows going deeper)
  const [decomposeStack, setDecomposeStack] = useState<string[]>(routeItemId ? [routeItemId] : []);
  const [step, setStep] = useState<FlowStep>(routeItemId ? 'decompose' : 'select');
  const [customText, setCustomText] = useState('');
  const [classifyTarget, setClassifyTarget] = useState<string | null>(null);
  const [childrenToProcess, setChildrenToProcess] = useState<string[]>([]);
  const [childProcessIndex, setChildProcessIndex] = useState(0);

  // Classification form state
  const [classWhat, setClassWhat] = useState('');
  const [classHow, setClassHow] = useState('');
  const [classWhy, setClassWhy] = useState('');
  // Brief acknowledgment shown between classify and advance, once a direction is chosen.
  const [directionAck, setDirectionAck] = useState<'internal' | 'external' | null>(null);
  // Transient animation played when a big rock is being unpacked into smaller ones.
  const [showBreaking, setShowBreaking] = useState(false);
  // Ephemeral rock-drop animation when confirming a sub-item.
  const [droppingRock, setDroppingRock] = useState(false);

  // Pending item — staged for dimension rating before adding
  const [pendingItem, setPendingItem] = useState<{
    name: string;
    compartment: Compartment;
    utility: number;
    dimensions: WeightDimensions;
  } | null>(null);

  const DIMENSION_KEYS: (keyof WeightDimensions)[] = ['stress', 'worry', 'cognitive', 'urgency', 'emotional'];

  // Summary tracking
  const [decomposedIds, setDecomposedIds] = useState<string[]>([]);
  const [classifiedIds, setClassifiedIds] = useState<string[]>([]);
  const [atomicIds, setAtomicIds] = useState<string[]>([]);

  const currentItemId = decomposeStack[decomposeStack.length - 1];
  const currentItem = items.find(i => i.id === currentItemId);
  const unprocessed = getUnprocessedItems().sort((a, b) => b.weight - a.weight);

  // Sub-item suggestions for the current item being decomposed
  const subSuggestions = useMemo(() => {
    if (!currentItem) return [];
    const match = TOP_LEVEL_CATEGORIES.find(
      c => c.label.toLowerCase().includes(currentItem.name.toLowerCase()) ||
           currentItem.name.toLowerCase().includes(c.id),
    );
    return match?.subItems ?? [];
  }, [currentItem]);

  const currentChildren = currentItemId ? getChildItems(currentItemId) : [];

  // ── Handlers ──

  const selectItem = (id: string) => {
    setDecomposeStack([id]);
    setStep('decompose');
  };

  const addSubItem = (name: string, compartment: Compartment, weight: number, utility: number, weightDimensions?: WeightDimensions) => {
    if (!currentItemId) return;
    markAsContainer(currentItemId);
    addItem({
      name,
      compartment,
      weight,
      utility,
      description: '',
      tags: [],
      parentId: currentItemId,
      ...(weightDimensions ? { weightDimensions } : {}),
    });
  };

  const stageSuggestion = (sub: SubItemSuggestion) => {
    if (!currentItemId) return;
    const existingChildren = getChildItems(currentItemId);
    if (existingChildren.some(c => c.name.toLowerCase() === sub.name.toLowerCase())) return;
    setPendingItem({
      name: sub.name,
      compartment: sub.compartment ?? currentItem?.compartment ?? 'stones',
      utility: sub.utility,
      dimensions: { ...sub.dimensions },
    });
  };

  const stageCustom = () => {
    if (!customText.trim() || !currentItem || !currentItemId) return;
    const existingChildren = getChildItems(currentItemId);
    if (existingChildren.some(c => c.name.toLowerCase() === customText.trim().toLowerCase())) return;
    setPendingItem({
      name: customText.trim(),
      compartment: currentItem.compartment,
      utility: 5,
      dimensions: { stress: 0, worry: 0, cognitive: 0, urgency: 0, emotional: 0 },
    });
    setCustomText('');
  };

  const setPendingDimension = (key: keyof WeightDimensions, value: number) => {
    setPendingItem(p => {
      if (!p) return p;
      // Toggle: tapping the active value deselects the dimension
      const newVal = p.dimensions[key] === value ? 0 : value;
      return { ...p, dimensions: { ...p.dimensions, [key]: newVal } };
    });
  };

  const confirmPending = () => {
    if (!pendingItem) return;
    const dims = pendingItem.dimensions;
    const hasAny = DIMENSION_KEYS.some(k => dims[k] > 0);
    // Default to weight 3 if no dimensions rated
    const w = hasAny ? dimensionsToWeight(dims) : 3;
    addSubItem(pendingItem.name, pendingItem.compartment, w, pendingItem.utility, hasAny ? dims : undefined);
    setPendingItem(null);
    // Play a quick "rock drops into pack" feedback.
    setDroppingRock(true);
    setTimeout(() => setDroppingRock(false), 700);
  };

  const cancelPending = () => setPendingItem(null);

  const finishDecomposing = () => {
    if (!currentItemId) return;
    setDecomposedIds(prev => [...prev, currentItemId]);

    // Get fresh children for the item we just decomposed
    const children = getChildItems(currentItemId);
    if (children.length > 0) {
      setChildrenToProcess(children.map(c => c.id));
      setChildProcessIndex(0);
      setStep('classify-or-deeper');
    } else {
      // No children added — mark atomic and classify
      markAtomic(currentItemId);
      setAtomicIds(prev => [...prev, currentItemId]);
      setClassifyTarget(currentItemId);
      setClassWhat('');
      setClassHow('');
      setClassWhy('');
      setStep('classify');
    }
  };

  const handleClassifyOrDeeper = (action: 'deeper' | 'atomic') => {
    const childId = childrenToProcess[childProcessIndex];
    if (!childId) return;

    if (action === 'deeper') {
      // Play the big-rock-breaks-into-small-rocks animation, then advance.
      setShowBreaking(true);
      setTimeout(() => {
        setDecomposeStack(prev => [...prev, childId]);
        setStep('decompose');
        setShowBreaking(false);
      }, 950);
    } else {
      // Mark as atomic, go to classification
      markAtomic(childId);
      setAtomicIds(prev => [...prev, childId]);
      setClassifyTarget(childId);
      setClassWhat('');
      setClassHow('');
      setClassWhy('');
      setStep('classify');
    }
  };

  const advanceToNextChild = () => {
    const nextIndex = childProcessIndex + 1;
    if (nextIndex < childrenToProcess.length) {
      setChildProcessIndex(nextIndex);
      setStep('classify-or-deeper');
    } else {
      // Done with children at this level
      if (decomposeStack.length > 1) {
        // Pop back up to parent's child processing
        setDecomposeStack(prev => prev.slice(0, -1));
        // Re-enter the parent's children processing
        const parentId = decomposeStack[decomposeStack.length - 2];
        const parentChildren = getChildItems(parentId);
        const currentIdx = parentChildren.findIndex(c => c.id === currentItemId);
        if (currentIdx >= 0 && currentIdx + 1 < parentChildren.length) {
          setChildrenToProcess(parentChildren.map(c => c.id));
          setChildProcessIndex(currentIdx + 1);
          setStep('classify-or-deeper');
        } else {
          setStep('summary');
        }
      } else {
        setStep('summary');
      }
    }
  };

  const handleClassifySubmit = (direction?: 'internal' | 'external') => {
    if (classifyTarget && (classWhat.trim() || classHow.trim() || classWhy.trim())) {
      classifyItem(classifyTarget, {
        what: classWhat.trim(),
        how: classHow.trim(),
        why: classWhy.trim(),
        ...(direction ? { direction } : {}),
        classifiedAt: new Date().toISOString(),
      });
      setClassifiedIds(prev => [...prev, classifyTarget]);
    }
    // If a direction was chosen, show a brief acknowledgment before advancing.
    if (direction) {
      setDirectionAck(direction);
      setTimeout(() => {
        setDirectionAck(null);
        advanceToNextChild();
      }, 1400);
    } else {
      advanceToNextChild();
    }
  };

  const handleClassifySkip = () => {
    advanceToNextChild();
  };

  const currentChildItem = childrenToProcess[childProcessIndex]
    ? items.find(i => i.id === childrenToProcess[childProcessIndex])
    : null;

  const classifyTargetItem = classifyTarget ? items.find(i => i.id === classifyTarget) : null;

  // ── Render ──

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <motion.span
              key={`pack-${decomposeStack.length}`}
              initial={{ scale: 0.6, rotate: -14 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 12 }}
              className="text-2xl inline-block"
              aria-hidden
            >
              🎒
            </motion.span>
            Decompose
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Break big rocks into small ones</p>
        </div>
      </div>

      {/* Big rock → small rocks overlay (plays briefly on unpack) */}
      <AnimatePresence>
        {showBreaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-none"
          >
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* The big rock shakes, then shatters */}
              <motion.div
                className="absolute text-6xl"
                initial={{ scale: 1, rotate: 0, opacity: 1 }}
                animate={{
                  scale: [1, 1.15, 1.15, 0],
                  rotate: [0, -10, 10, -6, 0],
                  opacity: [1, 1, 1, 0],
                }}
                transition={{ duration: 0.55, times: [0, 0.35, 0.6, 1] }}
              >
                🪨
              </motion.div>
              {/* Shards fly outward */}
              {[
                { x: -70, y: -30, r: -30 },
                { x: 70, y: -20, r: 25 },
                { x: -20, y: 60, r: 15 },
                { x: 50, y: 55, r: -20 },
              ].map((d, i) => (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
                  animate={{
                    x: [0, 0, d.x],
                    y: [0, 0, d.y],
                    scale: [0.2, 0.2, 1, 1],
                    rotate: [0, 0, d.r],
                    opacity: [0, 0, 1, 1],
                  }}
                  transition={{ duration: 0.9, times: [0, 0.5, 0.75, 1], delay: i * 0.03 }}
                >
                  🪨
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {step !== 'select' && step !== 'summary' && (
        <div className="flex gap-1">
          {['decompose', 'classify-or-deeper', 'classify'].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full ${
                s === step ? 'bg-amber-500' :
                ['decompose', 'classify-or-deeper', 'classify'].indexOf(step) > i ? 'bg-amber-500/40' : 'bg-slate-800'
              }`} />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step + (currentItemId ?? '') + childProcessIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Select a Big Rock ── */}
          {step === 'select' && (
            <div className="space-y-3">
              {unprocessed.length > 0 ? (
                <>
                  <p className="text-sm text-slate-400">
                    Your heaviest unexamined items. Pick one to break down.
                  </p>
                  {unprocessed.slice(0, 10).map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectItem(item.id)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-amber-500/30 transition-colors flex items-center gap-3"
                    >
                      <Boulder weight={item.weight} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium block truncate">{item.name}</span>
                        <span className="block text-[10px] text-slate-500">
                          {COMPARTMENT_META[item.compartment].emoji} {COMPARTMENT_META[item.compartment].label}
                        </span>
                      </div>
                      <span className="text-rose-400 font-mono text-sm">W:{item.weight}</span>
                      <ArrowRight size={14} className="text-slate-600" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <Check size={40} className="text-emerald-400 mx-auto" />
                  <h2 className="text-lg font-medium text-white">Everything examined</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Every item in your pack has been broken down or marked as atomic. That's real clarity.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
                  >
                    Back to Pack
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Decompose ── */}
          {step === 'decompose' && currentItem && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-1">
                  <Boulder weight={currentItem.weight} />
                  <span className="text-white font-medium flex-1">{currentItem.name}</span>
                  <span className="text-rose-400 font-mono text-sm">W:{currentItem.weight}</span>
                </div>
                {decomposeStack.length > 1 && (
                  <p className="text-[10px] text-slate-500">
                    Depth: {decomposeStack.length} — inside {items.find(i => i.id === decomposeStack[decomposeStack.length - 2])?.name}
                  </p>
                )}
              </div>

              <p className="text-sm text-slate-400">
                What makes <span className="text-white">"{currentItem.name}"</span> heavy? Break it down.
              </p>

              {/* Rock-drops-into-pack feedback */}
              <AnimatePresence>
                {droppingRock && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative h-0 flex justify-center pointer-events-none"
                  >
                    <motion.span
                      className="absolute text-2xl"
                      initial={{ y: -30, opacity: 0, scale: 0.8 }}
                      animate={{ y: 20, opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.6] }}
                      transition={{ duration: 0.7, times: [0, 0.3, 0.7, 1] }}
                    >
                      🪨
                    </motion.span>
                    <motion.span
                      className="absolute text-2xl"
                      style={{ top: 24 }}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      🎒
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Children added so far */}
              {currentChildren.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Pieces identified ({currentChildren.length})
                  </span>
                  {currentChildren.map(child => (
                    <div key={child.id} className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-3">
                      <Boulder weight={child.weight} />
                      <span className="text-sm text-slate-300 flex-1">{child.name}</span>
                      <span className="text-xs text-rose-400 font-mono">W:{child.weight}</span>
                    </div>
                  ))}

                  {/* Lawn moment */}
                  {(() => {
                    const effectiveW = getEffectiveWeight(currentItem.id);
                    return effectiveW !== currentItem.originalWeight ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                        <span className="text-amber-300">
                          You estimated <span className="font-mono font-medium">{currentItem.originalWeight}</span>.
                          The pieces add up to <span className="font-mono font-medium">{effectiveW}</span>.
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Dimension rating for pending item */}
              {pendingItem && (() => {
                const activeCount = DIMENSION_KEYS.filter(k => pendingItem.dimensions[k] > 0).length;
                const computedWeight = activeCount > 0 ? dimensionsToWeight(pendingItem.dimensions) : 3;
                return (
                  <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {/* The boulder grows/shrinks live as the user tunes dimensions. */}
                      <Boulder weight={computedWeight} />
                      <span className="text-sm text-white font-medium flex-1">{pendingItem.name}</span>
                      <button onClick={cancelPending} className="text-xs text-slate-600 hover:text-slate-400">cancel</button>
                    </div>
                    <p className="text-xs text-slate-500">
                      How does this affect you? Rate only what's relevant. <span className="text-slate-400">1 = barely, 5 = overwhelming.</span>
                    </p>
                    <div className="space-y-2">
                      {DIMENSION_KEYS.map(key => {
                        const val = pendingItem.dimensions[key];
                        const isActive = val > 0;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <div className="w-20 shrink-0">
                              <span className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                                {DIMENSION_LABELS[key].label}
                              </span>
                            </div>
                            <div className="flex gap-1 flex-1">
                              {[1, 2, 3, 4, 5].map(v => (
                                <button
                                  key={v}
                                  onClick={() => setPendingDimension(key, v)}
                                  className={`flex-1 h-8 rounded text-xs font-medium transition-colors ${
                                    val === v
                                      ? v >= 4 ? 'bg-rose-500 text-white' : v >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-600 text-white'
                                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={confirmPending}
                      className="w-full py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
                    >
                      {activeCount > 0
                        ? `Add — weight ${computedWeight}`
                        : 'Add without rating'}
                    </button>
                  </div>
                );
              })()}

              {/* Suggestions */}
              {!pendingItem && (() => {
                const addedNames = new Set(currentChildren.map(c => c.name.toLowerCase()));
                const remaining = subSuggestions.filter(s => !addedNames.has(s.name.toLowerCase()));
                return remaining.length > 0 ? (
                  <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
                    {remaining.map(sub => {
                      const w = dimensionsToWeight(sub.dimensions);
                      return (
                        <button
                          key={sub.name}
                          onClick={() => stageSuggestion(sub)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-left hover:border-amber-500/30 transition-colors flex items-center gap-3"
                        >
                          <Boulder weight={w} />
                          <span className="text-sm text-white flex-1">{sub.name}</span>
                          <span className="text-xs text-slate-500 font-mono shrink-0">{w}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null;
              })()}

              {/* Custom input */}
              {!pendingItem && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && stageCustom()}
                    placeholder="Or type something specific..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={stageCustom}
                    disabled={!customText.trim()}
                    className="px-4 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Done button */}
              <button
                onClick={finishDecomposing}
                className="w-full py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                {currentChildren.length > 0 ? "That's everything" : "This can't be broken down further"}
              </button>
            </div>
          )}

          {/* ── Classify or Go Deeper ── */}
          {step === 'classify-or-deeper' && currentChildItem && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Item {childProcessIndex + 1} of {childrenToProcess.length}
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Boulder weight={currentChildItem.weight} />
                  <span className="text-white font-medium flex-1">{currentChildItem.name}</span>
                  <span className="text-rose-400 font-mono text-sm">W:{currentChildItem.weight}</span>
                </div>
              </div>

              <p className="text-sm text-slate-400">
                Can <span className="text-white">"{currentChildItem.name}"</span> be broken down further?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleClassifyOrDeeper('deeper')}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-amber-500/30 transition-colors"
                >
                  <span className="text-2xl mb-2 block" aria-hidden>🪨</span>
                  <span className="text-sm text-white font-medium block">Yes, unpack it</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Break it into smaller pieces
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleClassifyOrDeeper('atomic')}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-emerald-500/30 transition-colors"
                >
                  <Atom size={20} className="text-emerald-400 mb-2" />
                  <span className="text-sm text-white font-medium block">No, it's atomic</span>
                  <span className="text-[10px] text-slate-500 mt-1 block">This is as small as it gets</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* ── Classify Atomic Item ── */}
          {step === 'classify' && classifyTargetItem && directionAck && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-6 text-center border ${
                directionAck === 'internal'
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-sky-500/5 border-sky-500/30'
              }`}
            >
              <p className={`text-sm font-medium ${directionAck === 'internal' ? 'text-amber-200' : 'text-sky-200'}`}>
                {directionAck === 'internal'
                  ? 'Noted — you might be close to the root.'
                  : "Noted — we'll come back to that."}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                {directionAck === 'internal'
                  ? 'Worth staying with.'
                  : 'Parked for a future session.'}
              </p>
            </motion.div>
          )}

          {step === 'classify' && classifyTargetItem && !directionAck && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Boulder weight={classifyTargetItem.weight} />
                  <span className="text-white font-medium flex-1">{classifyTargetItem.name}</span>
                  <Atom size={16} className="text-emerald-400" />
                </div>
              </div>

              <p className="text-sm text-slate-400">
                Help yourself understand this better.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-amber-400 mb-1.5">What is this?</label>
                  <input
                    type="text"
                    value={classWhat}
                    onChange={e => setClassWhat(e.target.value)}
                    placeholder="In your own words..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-400 mb-1.5">How does it affect your daily life?</label>
                  <input
                    type="text"
                    value={classHow}
                    onChange={e => setClassHow(e.target.value)}
                    placeholder="What does it do to your days..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-400 mb-1.5">Why does it weigh on you?</label>
                  <input
                    type="text"
                    value={classWhy}
                    onChange={e => setClassWhy(e.target.value)}
                    placeholder="The root of its weight..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Why follow-up — direction signal. Only surfaces once the user has started answering. */}
              {classWhy.trim().length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-500">When you read that back, is it…</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleClassifySubmit('external')}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left hover:border-sky-500/40 transition-colors"
                    >
                      <span className="text-sm text-white font-medium block">About something in my life</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        A situation, a person, a circumstance
                      </span>
                    </button>
                    <button
                      onClick={() => handleClassifySubmit('internal')}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left hover:border-amber-500/40 transition-colors"
                    >
                      <span className="text-sm text-white font-medium block">About me</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        A belief, a pattern, something I carry
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Coach-mark.ai CTA */}
              <a
                href="https://coach-mark.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                <ExternalLink size={12} /> Want to explore this deeper? Try coach-mark.ai
              </a>

              <div className="flex gap-3">
                <button
                  onClick={handleClassifySkip}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => handleClassifySubmit()}
                  className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* ── Summary ── */}
          {step === 'summary' && (
            <div className="text-center py-8 space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <motion.span
                  className="text-5xl block mx-auto mb-3"
                  initial={{ rotate: -20, y: -10 }}
                  animate={{ rotate: 0, y: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 10 }}
                  aria-hidden
                >
                  🎒
                </motion.span>
                <h2 className="text-lg font-medium text-white">Decomposition Complete</h2>
              </motion.div>

              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="block font-mono text-2xl text-amber-400">{decomposedIds.length}</span>
                  <span className="text-[10px] text-slate-500">Unpacked</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="block font-mono text-2xl text-emerald-400">{atomicIds.length}</span>
                  <span className="text-[10px] text-slate-500">Atomic</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="block font-mono text-2xl text-violet-400">{classifiedIds.length}</span>
                  <span className="text-[10px] text-slate-500">Classified</span>
                </div>
              </div>

              {/* Decomposition tree preview */}
              {decomposeStack.length > 0 && (() => {
                const rootItem = items.find(i => i.id === decomposeStack[0]);
                if (!rootItem) return null;
                const renderTree = (item: PackItem, depth: number): ReactElement => {
                  const children = getChildItems(item.id);
                  return (
                    <div key={item.id} style={{ paddingLeft: depth * 16 }}>
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-xs">{COMPARTMENT_META[item.compartment].emoji}</span>
                        <span className={`text-xs ${item.isAtomic ? 'text-emerald-400' : item.isContainer ? 'text-amber-400' : 'text-slate-400'}`}>
                          {item.name}
                        </span>
                        {item.isAtomic && <Atom size={10} className="text-emerald-400" />}
                      </div>
                      {children.map(c => renderTree(c, depth + 1))}
                    </div>
                  );
                };
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left max-w-sm mx-auto">
                    {renderTree(rootItem, 0)}
                  </div>
                );
              })()}

              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Breaking things down is how you see what you're actually carrying. Small pieces are easier to lighten.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setDecomposeStack([]);
                    setDecomposedIds([]);
                    setClassifiedIds([]);
                    setAtomicIds([]);
                    setStep('select');
                  }}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  Decompose Another
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
                >
                  Back to Pack
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
