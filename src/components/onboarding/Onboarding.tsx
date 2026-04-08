import { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { TERRAIN_META } from '../../types';
import type { TerrainType } from '../../types';
import { autoCategorize } from '../../utils/autoCategorize';

type Step = 'welcome' | 'profile' | 'whats-heavy' | 'recovery' | 'ready';
const ALL_STEPS: Step[] = ['welcome', 'profile', 'whats-heavy', 'recovery', 'ready'];

const RECOVERY_DIMENSIONS = [
  { key: 'sleep', label: 'Sleep quality', description: 'How well are you sleeping?' },
  { key: 'activity', label: 'Physical activity', description: 'Are you moving your body?' },
  { key: 'social', label: 'Social connection', description: 'Are you connecting with people?' },
  { key: 'downtime', label: 'Downtime & play', description: 'Do you have time to rest and enjoy things?' },
  { key: 'mindfulness', label: 'Reflection', description: 'Are you processing what\'s happening?' },
] as const;

export default function Onboarding() {
  const setProfile = usePackStore(s => s.setProfile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const addItem = usePackStore(s => s.addItem);
  const addRecoveryCheck = usePackStore(s => s.addRecoveryCheck);
  const completeOnboarding = usePackStore(s => s.completeOnboarding);

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [terrain, setTerrainLocal] = useState<TerrainType>('camp');

  // Free-text items
  const [freeItems, setFreeItems] = useState(['', '', '']);

  // Recovery scores
  const [recovery, setRecovery] = useState<Record<string, number>>({
    sleep: 3, activity: 3, social: 3, downtime: 3, mindfulness: 3,
  });

  const stepIndex = ALL_STEPS.indexOf(step);
  const totalSteps = ALL_STEPS.length;

  const goNext = () => {
    if (step === 'profile') {
      setProfile({ name: name.trim() });
      setTerrain(terrain);
    }
    if (stepIndex < totalSteps - 1) setStep(ALL_STEPS[stepIndex + 1]);
  };

  const goBack = () => {
    if (stepIndex > 0) setStep(ALL_STEPS[stepIndex - 1]);
  };

  const filledItems = freeItems.filter(t => t.trim());
  const recoveryTotal = Object.values(recovery).reduce((s, v) => s + v, 0);
  const recoveryNormalized = Math.round(((recoveryTotal - 5) / 2) * 10) / 10;

  const handleFinish = () => {
    // Add free-text items as pack items
    filledItems.forEach(text => {
      const compartment = autoCategorize(text);
      addItem({
        name: text.trim(),
        compartment,
        weight: 5,
        utility: 5,
        description: '',
        tags: ['onboarding'],
      });
    });

    // Save recovery baseline
    addRecoveryCheck({
      date: new Date().toISOString(),
      sleep: recovery.sleep,
      activity: recovery.activity,
      social: recovery.social,
      downtime: recovery.downtime,
      mindfulness: recovery.mindfulness,
    });

    completeOnboarding();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Progress bar */}
      {step !== 'welcome' && (
        <div className="w-full max-w-lg mb-6">
          <div className="flex gap-1">
            {ALL_STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 text-right">
            {stepIndex + 1} / {totalSteps}
          </div>
        </div>
      )}

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* ─── Welcome ─── */}
            {step === 'welcome' && (
              <>
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-white">PackLight</h1>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    Everything you carry has weight — good and bad.
                  </p>
                  <div className="space-y-3 text-sm text-slate-400">
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400 font-mono text-lg leading-none">1</span>
                      <p><span className="text-white">Name what you're carrying</span> — stress and joy, obligations and ambitions, skills and the pressure to use them.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400 font-mono text-lg leading-none">2</span>
                      <p><span className="text-white">See the real weight</span> — a promotion, a new baby, a loving relationship all weigh something. Not just the bad stuff.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400 font-mono text-lg leading-none">3</span>
                      <p><span className="text-white">Carry what matters, lighter</span> — the goal isn't an empty pack. It's the right load, carried consciously.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 pt-2">
                    Based on Holmes-Rahe (positive events are stressors too), allostatic load theory, and conservation of resources research.
                  </p>
                </div>
                <button
                  onClick={goNext}
                  className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight size={16} />
                </button>
              </>
            )}

            {/* ─── Profile ─── */}
            {step === 'profile' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">First, a bit about you</h2>
                  <p className="text-sm text-slate-500">Your name and how life feels right now.</p>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">How does life feel right now?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['summit', 'downhill', 'camp', 'uphill', 'ridge', 'swamp'] as TerrainType[]).map(t => {
                      const meta = TERRAIN_META[t];
                      return (
                        <button
                          key={t}
                          onClick={() => setTerrainLocal(t)}
                          className={`p-3 rounded-xl text-left transition-colors ${
                            terrain === t
                              ? 'bg-amber-500/20 border border-amber-500/30'
                              : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-lg">{meta.emoji}</div>
                          <div className="text-sm font-medium text-white">{meta.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{meta.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700">
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!name.trim()}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ─── What's Heavy ─── */}
            {step === 'whats-heavy' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">What's taking up the most space?</h2>
                  <p className="text-sm text-slate-500">
                    Just 1-3 things. Don't overthink it — whatever comes to mind first.
                  </p>
                </div>

                <div className="space-y-3">
                  {freeItems.map((item, i) => (
                    <input
                      key={i}
                      type="text"
                      value={item}
                      onChange={e => {
                        const next = [...freeItems];
                        next[i] = e.target.value;
                        setFreeItems(next);
                      }}
                      placeholder={
                        i === 0 ? 'Something on your mind...'
                          : i === 1 ? 'Another thing...'
                            : 'One more (optional)...'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-600">
                  You'll discover more over time through journaling and check-ins. This is just a starting point.
                </p>

                <div className="flex gap-3">
                  <button onClick={goBack} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700">
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {filledItems.length === 0 ? 'Skip' : 'Next'} <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ─── Recovery Baseline ─── */}
            {step === 'recovery' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">How well are you recovering?</h2>
                  <p className="text-sm text-slate-500">
                    This helps us understand your capacity, not just your load.
                  </p>
                </div>

                <div className="space-y-3">
                  {RECOVERY_DIMENSIONS.map(dim => (
                    <div key={dim.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-white">{dim.label}</div>
                        <div className="text-[10px] text-slate-600">{dim.description}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            onClick={() => setRecovery(prev => ({ ...prev, [dim.key]: v }))}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                              recovery[dim.key] === v
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700">
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ─── Ready ─── */}
            {step === 'ready' && (
              <>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-white">You're ready</h2>
                  <div className="space-y-2 text-sm text-slate-400">
                    {filledItems.length > 0 && (
                      <p>You mentioned <span className="text-white font-medium">{filledItems.length} thing{filledItems.length !== 1 ? 's' : ''}</span> on your mind.</p>
                    )}
                    <p>Your recovery score is <span className="text-amber-400 font-mono font-medium">{recoveryNormalized.toFixed(1)}/10</span>.</p>
                    <p>Next, we'll walk you through the core loop: <span className="text-white">break things down</span> into pieces, <span className="text-white">classify</span> what you find, and <span className="text-white">discover connections</span> between them.</p>
                  </div>
                </div>

                {filledItems.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
                    <span className="text-xs text-slate-500">Starting with:</span>
                    {filledItems.map((item, i) => (
                      <div key={i} className="text-sm text-slate-300">{item}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={goBack} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700">
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                  >
                    Start Using PackLight <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
