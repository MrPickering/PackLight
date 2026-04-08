import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';

export default function FirstSteps() {
  const profile = usePackStore(s => s.profile);
  const items = usePackStore(s => s.items);
  const getActiveItems = usePackStore(s => s.getActiveItems);
  const getChildItems = usePackStore(s => s.getChildItems);
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

  // Track context selection for step 2
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);

  // Auto-detect step 1 completion: user has unpacked an item (container with 2+ children)
  useEffect(() => {
    if (step === 1) {
      const hasUnpacked = active.some(i => i.isContainer && getChildItems(i.id).length >= 2);
      if (hasUnpacked) advanceFirstStep();
    }
  }, [step, active, getChildItems, advanceFirstStep]);

  const balance = getLoadBalance();

  const handleContextSave = () => {
    if (firstItem && selectedContexts.length > 0) {
      updateItem(firstItem.id, { contexts: selectedContexts } as Parameters<typeof updateItem>[1]);
    }
    advanceFirstStep();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-amber-500' : 'bg-slate-800'}`} />
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
          {/* Step 0/1: Unpack your first item */}
          {(step === 0 || step === 1) && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">First, let's look deeper</h2>
                {firstItem ? (
                  <p className="text-sm text-slate-400">
                    You mentioned '<span className="text-white">{firstItem.name}</span>'. There's probably more to it.
                    Tap it to see what's inside.
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Add your first item, then we'll unpack it together.
                  </p>
                )}
              </div>

              {firstItem && (
                <button
                  onClick={() => navigate(`/pack/${firstItem.compartment}`, {
                    state: { highlightItemId: firstItem.id },
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-amber-500/30 transition-colors"
                >
                  <div className="text-white font-medium">{firstItem.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Weight: {firstItem.weight} — Tap to unpack what's inside</div>
                </button>
              )}

              <p className="text-xs text-slate-600">
                Add 2+ sub-items to continue. Most things we carry aren't one thing.
              </p>

              <button
                onClick={advanceFirstStep}
                className="text-xs text-slate-600 hover:text-slate-400"
              >
                Skip this step
              </button>
            </>
          )}

          {/* Step 2: Tag with context */}
          {step === 2 && (
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

          {/* Step 3: Check your balance */}
          {step === 3 && (
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
                  Higher = more sustainable. This updates as you add items, unpack them, and check in on recovery.
                </p>
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

      {step < 3 && (
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
