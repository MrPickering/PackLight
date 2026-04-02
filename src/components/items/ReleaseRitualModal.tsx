import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META } from '../../types';
import type { PackItem } from '../../types';

interface Props {
  item: PackItem;
  onClose: () => void;
  onComplete: () => void;
}

type RitualStep = 'acknowledge' | 'speak' | 'release';

const RELEASE_PROMPTS: Record<string, string[]> = {
  stones: [
    'How has this affected your daily life?',
    'What changes when you stop carrying this?',
    'Anything you want to say about it before you let go?',
  ],
  chains: [
    'How has this responsibility weighed on you?',
    'What becomes possible when you put this down?',
    'Anything you want to acknowledge before moving on?',
  ],
  tools: [
    'How did this ability serve you?',
    'Why is it time to stop maintaining it?',
    'Anything you want to acknowledge about what it gave you?',
  ],
  provisions: [
    'What did this resource protect you from?',
    'What do you trust now that you didn\'t before?',
    'Anything you want to say as you let go of needing this?',
  ],
  maps: [
    'What were you hoping this goal would bring you?',
    'Why is it no longer the right direction?',
    'Anything you want to say before changing course?',
  ],
  souvenirs: [
    'What did this part of your identity mean to you?',
    'What of that meaning do you carry in yourself, even without this?',
    'Anything you want to say before you set this down?',
  ],
};

export default function ReleaseRitualModal({ item, onClose, onComplete }: Props) {
  const dropItem = usePackStore(s => s.dropItem);
  const meta = COMPARTMENT_META[item.compartment];
  const prompts = RELEASE_PROMPTS[item.compartment];

  const [step, setStep] = useState<RitualStep>('acknowledge');
  const [releaseNote, setReleaseNote] = useState('');
  const [released, setReleased] = useState(false);

  const handleRelease = () => {
    dropItem(item.id, releaseNote.trim() || undefined);
    setReleased(true);
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden"
        >
          {/* Released state */}
          {released ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 1, y: 0 }}
                animate={{ scale: 0.5, y: -40, opacity: 0 }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
                className="text-4xl"
              >
                {meta.emoji}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-slate-400 text-sm italic"
              >
                The wound that's released heals.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-emerald-400 text-xs"
              >
                -{item.weight} weight released
              </motion.p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div>
                    <h2 className="text-white font-medium">{item.name}</h2>
                    <p className="text-xs text-slate-500">Release Ritual</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {step === 'acknowledge' && (
                    <motion.div
                      key="acknowledge"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-slate-300 text-sm leading-relaxed">{prompts[0]}</p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        You've been carrying <strong className="text-slate-300">{item.name}</strong> at
                        weight <strong className="text-rose-400">{item.weight}/10</strong>.
                        {item.completedSteps?.length > 0 && (
                          <> You've taken <strong className="text-emerald-400">{item.completedSteps.length} step{item.completedSteps.length !== 1 ? 's' : ''}</strong> toward lightening it.</>
                        )}
                      </p>
                      <button
                        onClick={() => setStep('speak')}
                        className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-slate-600 transition-colors"
                      >
                        I acknowledge this
                      </button>
                    </motion.div>
                  )}

                  {step === 'speak' && (
                    <motion.div
                      key="speak"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <p className="text-slate-300 text-sm leading-relaxed">{prompts[2]}</p>
                      <textarea
                        value={releaseNote}
                        onChange={e => setReleaseNote(e.target.value)}
                        placeholder="Speak it here... (optional, but witnessed words carry power)"
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-amber-500/30 resize-none"
                        autoFocus
                      />
                      <button
                        onClick={() => setStep('release')}
                        className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-slate-600 transition-colors"
                      >
                        {releaseNote.trim() ? 'I\'ve said what I need to say' : 'I\'ll release in silence'}
                      </button>
                    </motion.div>
                  )}

                  {step === 'release' && (
                    <motion.div
                      key="release"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5 text-center"
                    >
                      <p className="text-slate-300 text-sm leading-relaxed">{prompts[1]}</p>
                      <div className="py-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleRelease}
                          className="px-8 py-4 bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 rounded-2xl text-sm font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all"
                        >
                          Release {meta.emoji}
                        </motion.button>
                      </div>
                      <button
                        onClick={onClose}
                        className="text-xs text-slate-600 hover:text-slate-400"
                      >
                        I'm not ready yet
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step indicators */}
              <div className="px-5 pb-5">
                <div className="flex justify-center gap-2">
                  {(['acknowledge', 'speak', 'release'] as RitualStep[]).map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 rounded-full transition-colors ${
                        s === step
                          ? 'w-6 bg-amber-500'
                          : i < ['acknowledge', 'speak', 'release'].indexOf(step)
                            ? 'w-3 bg-amber-500/40'
                            : 'w-3 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
