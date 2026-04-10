import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Atom, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';

const TOTAL_STEPS = 4;

export default function FirstSteps() {
  const profile = usePackStore(s => s.profile);
  const items = usePackStore(s => s.items);
  const getActiveItems = usePackStore(s => s.getActiveItems);
  const getChildItems = usePackStore(s => s.getChildItems);
  const getAtomicItems = usePackStore(s => s.getAtomicItems);
  const getLoadBalance = usePackStore(s => s.getLoadBalance);
  const updateItem = usePackStore(s => s.updateItem);
  const advanceFirstStep = usePackStore(s => s.advanceFirstStep);
  const completeFirstSteps = usePackStore(s => s.completeFirstSteps);
  const availableContexts = usePackStore(s => s.profile.contexts);
  const navigate = useNavigate();

  const step = profile.firstStepsStep;
  const active = getActiveItems();
  const onboardingItems = active.filter(i => i.tags.includes('onboarding'));
  const firstItem = onboardingItems[0] ?? active[0];

  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);

  // Auto-detect step 1 completion: user has decomposed an item (container with 2+ children)
  useEffect(() => {
    if (step === 1) {
      const hasUnpacked = active.some(i => i.isContainer && getChildItems(i.id).length >= 2);
      if (hasUnpacked) advanceFirstStep();
    }
  }, [step, active, getChildItems, advanceFirstStep]);

  // Auto-detect step 2 completion: user has classified an atomic item
  useEffect(() => {
    if (step === 2) {
      const atomics = getAtomicItems();
      const hasClassified = atomics.some(i => i.classification);
      if (hasClassified) advanceFirstStep();
    }
  }, [step, getAtomicItems, advanceFirstStep]);

  const balance = getLoadBalance();

  const handleContextSave = () => {
    if (firstItem && selectedContexts.length > 0) {
      updateItem(firstItem.id, { contexts: selectedContexts } as Parameters<typeof updateItem>[1]);
    }
    advanceFirstStep();
  };

  // Map internal step numbers to display step (steps 0 and 1 share visual step 1)
  const displayStep = step <= 1 ? 1 : step;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${displayStep >= i + 1 ? 'bg-amber-500' : 'bg-slate-800'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Step 1: Decompose your first item */}
          {(step === 0 || step === 1) && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-violet-400" />
                  <h2 className="text-xl font-semibold text-white">Break it down</h2>
                </div>
                {firstItem ? (
                  <p className="text-sm text-slate-400">
                    You mentioned '<span className="text-white">{firstItem.name}</span>'. Most things we carry aren't one thing — they're made up of smaller pieces.
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Add your first item, then we'll break it down together.
                  </p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="text-amber-400 font-mono text-lg leading-none shrink-0">1</span>
                  <p><span className="text-white">Decompose</span> — break big items into the pieces that actually make them heavy</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="text-amber-400 font-mono text-lg leading-none shrink-0">2</span>
                  <p><span className="text-white">Go deeper</span> — keep breaking down until you reach things that can't be split further (atomic items)</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <span className="text-amber-400 font-mono text-lg leading-none shrink-0">3</span>
                  <p><span className="text-white">Classify</span> — for each atomic piece, understand what it is, how it affects you, and why it weighs on you</p>
                </div>
              </div>

              {firstItem && (
                <button
                  onClick={() => navigate(`/decompose/${firstItem.id}`)}
                  className="w-full py-3 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-xl text-sm font-semibold hover:bg-violet-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Layers size={16} /> Decompose '{firstItem.name}' <ArrowRight size={16} />
                </button>
              )}

              <p className="text-xs text-slate-600">
                The decompose flow will guide you through each step. Add 2+ sub-items to continue.
              </p>

              <button
                onClick={advanceFirstStep}
                className="text-xs text-slate-600 hover:text-slate-400"
              >
                Skip this step
              </button>
            </>
          )}

          {/* Step 2: Classify an atomic item */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Atom size={18} className="text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">Classify what you found</h2>
                </div>
                <p className="text-sm text-slate-400">
                  Now that you've broken things down, classify the atomic pieces. For each one, answer three questions:
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 font-medium text-sm shrink-0">What</span>
                  <p className="text-sm text-slate-400">What is this thing, in your own words?</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 font-medium text-sm shrink-0">How</span>
                  <p className="text-sm text-slate-400">How does it affect your daily life?</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-400 font-medium text-sm shrink-0">Why</span>
                  <p className="text-sm text-slate-400">Why does it weigh on you?</p>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Classification helps you understand the real nature of what you carry. It turns vague weight into something you can work with.
              </p>

              {(() => {
                const atomics = getAtomicItems();
                const unclassified = atomics.filter(i => !i.classification);
                const firstUnclassified = unclassified[0];
                if (firstUnclassified) {
                  return (
                    <button
                      onClick={() => navigate(`/decompose/${firstUnclassified.id}`)}
                      className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Atom size={16} /> Classify '{firstUnclassified.name}' <ArrowRight size={16} />
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => navigate('/decompose')}
                    className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Atom size={16} /> Open Decompose Flow <ArrowRight size={16} />
                  </button>
                );
              })()}

              <button
                onClick={advanceFirstStep}
                className="text-xs text-slate-600 hover:text-slate-400"
              >
                Skip this step
              </button>
            </>
          )}

          {/* Step 3: Tag with context + connections teaser */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">When does this weigh on you?</h2>
                <p className="text-sm text-slate-400">
                  {firstItem
                    ? `When does '${firstItem.name}' come up? At work? At home? Both?`
                    : 'Tag your items with contexts so you can filter by situation.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableContexts.map(ctx => (
                  <button
                    key={ctx.id}
                    onClick={() => setSelectedContexts(prev =>
                      prev.includes(ctx.id) ? prev.filter(c => c !== ctx.id) : [...prev, ctx.id]
                    )}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      selectedContexts.includes(ctx.id)
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {ctx.emoji} {ctx.name}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-600">
                Contexts let you filter your view — carry only what's relevant right now.
              </p>

              {/* Connections teaser */}
              <div className="bg-slate-900 border border-violet-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-violet-300">
                  <Link2 size={14} />
                  <span className="font-medium">Connections are automatic</span>
                </div>
                <p className="text-xs text-slate-500">
                  As you add tags, contexts, and items across compartments, PackLight discovers relationships between them. Check the Connections tab in Trail Map to see what surfaces.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleContextSave}
                  className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  {selectedContexts.length > 0 ? 'Save & Continue' : 'Skip'} <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 4: Check your balance */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Your Load Balance</h2>
                <p className="text-sm text-slate-400">
                  This is how your demands compare to your resources and recovery.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className={`font-mono text-5xl font-bold block ${
                    balance.score >= 70 ? 'text-emerald-400' : balance.score >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {balance.score}
                </motion.span>
                <span className="text-xs text-slate-500 block mt-2">out of 100</span>
                <p className="text-sm text-slate-400 mt-4">
                  Higher = more sustainable. This updates as you decompose items, classify them, and check in on recovery.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs text-amber-400 font-medium">Your ongoing loop</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5"><Layers size={12} className="text-violet-400 shrink-0" /> Decompose heavy items</div>
                  <div className="flex items-center gap-1.5"><Atom size={12} className="text-emerald-400 shrink-0" /> Classify atomic pieces</div>
                  <div className="flex items-center gap-1.5"><Link2 size={12} className="text-blue-400 shrink-0" /> Discover connections</div>
                  <div className="flex items-center gap-1.5"><ArrowRight size={12} className="text-amber-400 shrink-0" /> Weekly check-ins</div>
                </div>
              </div>

              <button
                onClick={() => { advanceFirstStep(); completeFirstSteps(); }}
                className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                Open My Pack <ArrowRight size={16} />
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 4 && (
        <button
          onClick={completeFirstSteps}
          className="block text-xs text-slate-600 hover:text-slate-400 text-center w-full"
        >
          Skip all and go to my pack
        </button>
      )}
    </div>
  );
}
