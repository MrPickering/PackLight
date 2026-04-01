import { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { TERRAIN_META, COMPARTMENT_META } from '../../types';
import type { TerrainType, Compartment } from '../../types';
import { EXAMPLE_ITEMS } from '../../types/research';

type Step = 'welcome' | 'profile' | 'stones' | 'chains' | 'tools' | 'provisions' | 'maps' | 'souvenirs' | 'ready';
const ITEM_STEPS: Compartment[] = ['stones', 'chains', 'tools', 'provisions', 'maps', 'souvenirs'];
const ALL_STEPS: Step[] = ['welcome', 'profile', ...ITEM_STEPS, 'ready'];

const STEP_INTROS: Record<Compartment, { heading: string; subtext: string }> = {
  stones: {
    heading: 'What\'s weighing on you?',
    subtext: 'Emotional and psychological burdens — stress, grief, anxiety, self-doubt. Research shows these daily hassles impact health more than major life events (Lazarus, 1981).',
  },
  chains: {
    heading: 'What are you obligated to?',
    subtext: 'Commitments that drain your energy — debt, overwork, draining relationships. The APA reports money and work are the #1 and #2 stressors every year since 2007.',
  },
  tools: {
    heading: 'What skills do you have?',
    subtext: 'Your capabilities and strengths. The WHO identifies education and skills as key protective factors against chronic stress.',
  },
  provisions: {
    heading: 'What resources protect you?',
    subtext: 'Safety nets and support systems. Research on allostatic load (McEwen, 1998) shows adequate resources buffer against cumulative stress damage.',
  },
  maps: {
    heading: 'What are you working toward?',
    subtext: 'Goals and aspirations. Having direction and purpose is a proven protective factor against stress accumulation.',
  },
  souvenirs: {
    heading: 'What gives your life meaning?',
    subtext: 'Passions, values, relationships, and identity. The WHO\'s 2022 report identifies social connection and meaning as essential for mental health.',
  },
};

interface SelectedItem {
  name: string;
  compartment: Compartment;
  weight: number;
  utility: number;
  description: string;
  isCustom: boolean;
}

export default function Onboarding() {
  const setProfile = usePackStore(s => s.setProfile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const addItem = usePackStore(s => s.addItem);
  const completeOnboarding = usePackStore(s => s.completeOnboarding);

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [terrain, setTerrainLocal] = useState<TerrainType>('camp');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [customInput, setCustomInput] = useState('');

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

  const toggleExample = (item: typeof EXAMPLE_ITEMS.stones[number]) => {
    const exists = selectedItems.find(s => s.name === item.name && s.compartment === item.compartment);
    if (exists) {
      setSelectedItems(prev => prev.filter(s => !(s.name === item.name && s.compartment === item.compartment)));
    } else {
      setSelectedItems(prev => [...prev, { ...item, isCustom: false }]);
    }
  };

  const addCustomItem = (compartment: Compartment) => {
    if (!customInput.trim()) return;
    setSelectedItems(prev => [...prev, {
      name: customInput.trim(),
      compartment,
      weight: 5,
      utility: compartment === 'tools' || compartment === 'provisions' || compartment === 'souvenirs' ? 7 : 5,
      description: '',
      isCustom: true,
    }]);
    setCustomInput('');
  };

  const removeItem = (name: string, compartment: Compartment) => {
    setSelectedItems(prev => prev.filter(s => !(s.name === name && s.compartment === compartment)));
  };

  const handleFinish = () => {
    selectedItems.forEach(item => {
      addItem({
        name: item.name,
        compartment: item.compartment,
        weight: item.weight,
        utility: item.utility,
        description: item.description,
        tags: ['onboarding'],
      });
    });
    completeOnboarding();
  };

  const isCompartmentStep = ITEM_STEPS.includes(step as Compartment);
  const currentCompartment = step as Compartment;
  const selectedForCurrent = selectedItems.filter(s => s.compartment === currentCompartment);

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
                    Identify what's draining you. Track it. Improve it.
                  </p>
                  <div className="space-y-3 text-sm text-slate-400">
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400 font-mono text-lg leading-none">1</span>
                      <p><span className="text-white">Name what you're carrying</span> — stress, obligations, skills, goals, and what gives you meaning.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400 font-mono text-lg leading-none">2</span>
                      <p><span className="text-white">Rate the weight and usefulness</span> of each item so you can see what's helping vs. hurting.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400 font-mono text-lg leading-none">3</span>
                      <p><span className="text-white">Get a clearer picture</span> of your total load and take action — drop, reduce, or strengthen.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 pt-2">
                    Based on research from the APA Stress in America Survey, Holmes-Rahe Stress Scale, and WHO mental health frameworks.
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

            {/* ─── Compartment Steps ─── */}
            {isCompartmentStep && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{COMPARTMENT_META[currentCompartment].emoji}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{STEP_INTROS[currentCompartment].heading}</h2>
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">{COMPARTMENT_META[currentCompartment].label}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {STEP_INTROS[currentCompartment].subtext}
                </p>

                {/* Example chips */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2">Tap any that apply to you:</label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_ITEMS[currentCompartment].map(item => {
                      const isSelected = selectedItems.some(s => s.name === item.name && s.compartment === item.compartment);
                      return (
                        <button
                          key={item.name}
                          onClick={() => toggleExample(item)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-amber-400" />}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom write-in */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Or add your own:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomItem(currentCompartment)}
                      placeholder="Type something specific to you..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={() => addCustomItem(currentCompartment)}
                      disabled={!customInput.trim()}
                      className="px-3 py-2.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Selected items for this compartment */}
                {selectedForCurrent.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Selected ({selectedForCurrent.length}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedForCurrent.map(item => (
                        <span
                          key={item.name}
                          className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full"
                        >
                          {item.name}
                          <button onClick={() => removeItem(item.name, item.compartment)} className="hover:text-amber-100">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={goBack} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700">
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 bg-amber-500 text-slate-950 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {selectedForCurrent.length === 0 ? 'Skip' : 'Next'} <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ─── Ready ─── */}
            {step === 'ready' && (
              <>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-white">Your pack is ready</h2>
                  <p className="text-sm text-slate-400">
                    You selected {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} across {new Set(selectedItems.map(s => s.compartment)).size} categories. Here's what you'll be tracking:
                  </p>
                </div>

                {selectedItems.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ITEM_STEPS.map(comp => {
                      const items = selectedItems.filter(s => s.compartment === comp);
                      if (items.length === 0) return null;
                      const meta = COMPARTMENT_META[comp];
                      return (
                        <div key={comp} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span>{meta.emoji}</span>
                            <span className="text-sm font-medium text-white">{meta.label}</span>
                            <span className="text-[10px] text-slate-600">{items.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {items.map(item => (
                              <span key={item.name} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center">
                    <p className="text-sm text-slate-500">No items selected — you can always add them later from the home screen.</p>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  You can adjust weights, add details, and drop items anytime. This is your starting point, not a final answer.
                </p>

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
