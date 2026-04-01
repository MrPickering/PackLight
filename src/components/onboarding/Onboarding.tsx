import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { TERRAIN_META, AGENTS } from '../../types';
import type { TerrainType, Compartment } from '../../types';

type Step = 'welcome' | 'profile' | 'first-items' | 'meet-crew';

interface QuickItem {
  prompt: string;
  compartment: Compartment;
  placeholder: string;
}

const QUICK_ITEMS: QuickItem[] = [
  { prompt: 'Name something weighing on you emotionally', compartment: 'stones', placeholder: 'e.g., Unresolved conflict with a friend' },
  { prompt: 'Name a skill you\'re proud of', compartment: 'tools', placeholder: 'e.g., Public speaking' },
  { prompt: 'Name a goal you\'re working toward', compartment: 'maps', placeholder: 'e.g., Career change by end of year' },
];

export default function Onboarding() {
  const setProfile = usePackStore(s => s.setProfile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const addItem = usePackStore(s => s.addItem);
  const completeOnboarding = usePackStore(s => s.completeOnboarding);

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [terrain, setTerrainLocal] = useState<TerrainType>('camp');
  const [itemValues, setItemValues] = useState(['', '', '']);

  const handleProfileNext = () => {
    setProfile({ name: name.trim() });
    setTerrain(terrain);
    setStep('first-items');
  };

  const handleItemsNext = () => {
    itemValues.forEach((val, i) => {
      if (val.trim()) {
        const qi = QUICK_ITEMS[i];
        addItem({
          name: val.trim(),
          compartment: qi.compartment,
          weight: 5,
          utility: 5,
          description: '',
          tags: ['onboarding'],
        });
      }
    });
    setStep('meet-crew');
  };

  const handleFinish = () => {
    completeOnboarding();
  };

  const TERRAINS: TerrainType[] = ['summit', 'downhill', 'camp', 'uphill', 'ridge', 'swamp'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {step === 'welcome' && (
              <>
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <Sparkles size={48} className="text-amber-400 mx-auto" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-white">PackLight</h1>
                  <p className="text-slate-400 leading-relaxed">
                    Everyone carries an invisible backpack. Yours is full of everything you've accumulated — stress, skills, obligations, dreams, resources, and meaning.
                  </p>
                  <p className="text-slate-500 text-sm">
                    PackLight helps you see what's inside, drop what's crushing you, and sharpen what matters. Let's unpack.
                  </p>
                </div>
                <button
                  onClick={() => setStep('profile')}
                  className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  Begin <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">Who's carrying this pack?</h2>
                  <p className="text-sm text-slate-500">Tell us your name and what the trail looks like right now.</p>
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
                  <label className="block text-sm text-slate-400 mb-2">Current Terrain</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TERRAINS.map(t => {
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

                <button
                  onClick={handleProfileNext}
                  disabled={!name.trim()}
                  className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 'first-items' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">Let's start unpacking</h2>
                  <p className="text-sm text-slate-500">Add a few items to get started. You can always add more later.</p>
                </div>

                {QUICK_ITEMS.map((qi, i) => (
                  <div key={i}>
                    <label className="block text-sm text-slate-400 mb-1.5">{qi.prompt}</label>
                    <input
                      type="text"
                      value={itemValues[i]}
                      onChange={e => {
                        const next = [...itemValues];
                        next[i] = e.target.value;
                        setItemValues(next);
                      }}
                      placeholder={qi.placeholder}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                ))}

                <button
                  onClick={handleItemsNext}
                  className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 'meet-crew' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">Meet your crew</h2>
                  <p className="text-sm text-slate-500">Six specialists who'll observe your pack and offer insights over time.</p>
                </div>

                <div className="space-y-2">
                  {(Object.values(AGENTS)).map(agent => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Object.keys(AGENTS).indexOf(agent.id) * 0.1 }}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3"
                    >
                      <span className="text-2xl">{agent.emoji}</span>
                      <div>
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                        <p className="text-xs text-slate-500">{agent.title} — {agent.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  Start Using PackLight <Sparkles size={16} />
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
