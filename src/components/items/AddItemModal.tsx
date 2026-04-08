import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, WEIGHT_LABELS, UTILITY_LABELS, DIMENSION_LABELS } from '../../types';
import type { Compartment, PackItem, WeightDimensions } from '../../types';
import Slider from '../shared/Slider';
import ReleaseRitualModal from './ReleaseRitualModal';

interface Props {
  onClose: () => void;
  editItem?: PackItem;
  defaultCompartment?: Compartment;
  parentId?: string;
  parentName?: string;
}

const COMPARTMENTS: Compartment[] = ['stones', 'chains', 'tools', 'provisions', 'maps', 'souvenirs'];
const DIMENSION_KEYS: (keyof WeightDimensions)[] = ['stress', 'worry', 'cognitive', 'urgency', 'emotional'];

export default function AddItemModal({ onClose, editItem, defaultCompartment, parentId, parentName }: Props) {
  const addItem = usePackStore(s => s.addItem);
  const updateItem = usePackStore(s => s.updateItem);

  const isSubItem = !!parentId;

  const [name, setName] = useState(editItem?.name ?? '');
  const [compartment, setCompartment] = useState<Compartment>(editItem?.compartment ?? defaultCompartment ?? 'stones');
  const [weight, setWeight] = useState(editItem?.weight ?? 5);
  const [utility, setUtility] = useState(editItem?.utility ?? 5);
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [tags, setTags] = useState(editItem?.tags.join(', ') ?? '');
  const [showReleaseRitual, setShowReleaseRitual] = useState(false);
  const [showCompartmentOverride, setShowCompartmentOverride] = useState(false);

  // Dimensional weight for sub-items
  const [dimensions, setDimensions] = useState<WeightDimensions>(
    editItem?.weightDimensions ?? { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 3 },
  );

  const computedWeight = Math.round(
    (dimensions.stress + dimensions.worry + dimensions.cognitive + dimensions.urgency + dimensions.emotional) / 2.5,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editItem) {
      if (isSubItem || editItem.weightDimensions) {
        updateItem(editItem.id, { name, compartment, utility, description, tags: parsedTags, weightDimensions: dimensions });
      } else {
        updateItem(editItem.id, { name, compartment, weight, utility, description, tags: parsedTags });
      }
    } else if (isSubItem) {
      addItem({
        name, compartment, weight: computedWeight, utility, description,
        tags: parsedTags, parentId, weightDimensions: dimensions,
      });
    } else {
      addItem({ name, compartment, weight, utility, description, tags: parsedTags });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editItem ? 'Edit Item' : isSubItem ? 'Unpack: What\'s Inside?' : 'Add to Pack'}
              </h2>
              {parentName && (
                <p className="text-xs text-slate-500 mt-0.5">Adding inside: {parentName}</p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                {isSubItem ? 'What\'s one thing inside this?' : 'Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isSubItem ? 'e.g. The commute, that one coworker...' : 'What are you carrying?'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                autoFocus
              />
            </div>

            {/* Compartment — hidden behind toggle for sub-items */}
            {!isSubItem && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPARTMENTS.map(c => {
                    const meta = COMPARTMENT_META[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCompartment(c)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          compartment === c
                            ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isSubItem && (
              <div>
                {!showCompartmentOverride ? (
                  <button
                    type="button"
                    onClick={() => setShowCompartmentOverride(true)}
                    className="text-xs text-slate-600 hover:text-slate-400"
                  >
                    Override category ({COMPARTMENT_META[compartment].label})
                  </button>
                ) : (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {COMPARTMENTS.map(c => {
                        const meta = COMPARTMENT_META[c];
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCompartment(c)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              compartment === c
                                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weight — single slider for top-level, dimensions for sub-items */}
            {isSubItem || editItem?.weightDimensions ? (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  How does this weigh on you? <span className="text-amber-400 font-mono">= {computedWeight}/10</span>
                </label>
                <div className="space-y-2">
                  {DIMENSION_KEYS.map(key => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 w-28">
                        <div className="text-xs text-white">{DIMENSION_LABELS[key].label}</div>
                        <div className="text-[10px] text-slate-600">{DIMENSION_LABELS[key].description}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setDimensions(prev => ({ ...prev, [key]: v }))}
                            className={`w-7 h-7 rounded text-[11px] font-medium transition-colors ${
                              dimensions[key] === v
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Weight (energy/attention cost)</label>
                <Slider value={weight} onChange={setWeight} labels={WEIGHT_LABELS} color="rose" />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Utility (how much it serves you)</label>
              <Slider value={utility} onChange={setUtility} labels={UTILITY_LABELS} color="emerald" />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell the story of this item..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="work, personal, health..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editItem ? 'Save Changes' : isSubItem ? 'Add Sub-item' : 'Add to Pack'}
              </button>

              {editItem && !editItem.droppedAt && (
                <button
                  type="button"
                  onClick={() => setShowReleaseRitual(true)}
                  className="px-4 py-2.5 bg-slate-800 text-amber-400 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  Release
                </button>
              )}
            </div>
          </form>

          {showReleaseRitual && editItem && (
            <ReleaseRitualModal
              item={editItem}
              onClose={() => setShowReleaseRitual(false)}
              onComplete={onClose}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
