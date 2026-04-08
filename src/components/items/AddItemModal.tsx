import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, WEIGHT_LABELS, UTILITY_LABELS, DIMENSION_LABELS } from '../../types';
import type { Compartment, PackItem, WeightDimensions } from '../../types';
import { TOP_LEVEL_CATEGORIES, WEIGHT_PRESETS, dimensionsToWeight } from '../../types/suggestions';
import type { TopLevelCategory, SubItemSuggestion } from '../../types/suggestions';
import Slider from '../shared/Slider';
import ReleaseRitualModal from './ReleaseRitualModal';

interface Props {
  onClose: () => void;
  editItem?: PackItem;
  defaultCompartment?: Compartment;
  parentId?: string;
  parentName?: string;
}

const DIMENSION_KEYS: (keyof WeightDimensions)[] = ['stress', 'worry', 'cognitive', 'urgency', 'emotional'];

// ─── Edit form (existing items) ───
function EditForm({ editItem, onClose }: { editItem: PackItem; onClose: () => void }) {
  const updateItem = usePackStore(s => s.updateItem);
  const availableContexts = usePackStore(s => s.profile.contexts);

  const [name, setName] = useState(editItem.name);
  const [compartment, setCompartment] = useState<Compartment>(editItem.compartment);
  const [weight, setWeight] = useState(editItem.weight);
  const [utility, setUtility] = useState(editItem.utility);
  const [description, setDescription] = useState(editItem.description);
  const [tags, setTags] = useState(editItem.tags.join(', '));
  const [selectedContexts, setSelectedContexts] = useState<string[]>(editItem.contexts);
  const [showReleaseRitual, setShowReleaseRitual] = useState(false);
  const [dimensions, setDimensions] = useState<WeightDimensions>(
    editItem.weightDimensions ?? { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 3 },
  );

  const computedWeight = dimensionsToWeight(dimensions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editItem.weightDimensions) {
      updateItem(editItem.id, { name, compartment, utility, description, tags: parsedTags, weightDimensions: dimensions, contexts: selectedContexts });
    } else {
      updateItem(editItem.id, { name, compartment, weight, utility, description, tags: parsedTags, contexts: selectedContexts });
    }
    onClose();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50" autoFocus />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {(['stones', 'chains', 'tools', 'provisions', 'maps', 'souvenirs'] as Compartment[]).map(c => (
              <button key={c} type="button" onClick={() => setCompartment(c)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${compartment === c ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
                <span>{COMPARTMENT_META[c].emoji}</span><span>{COMPARTMENT_META[c].label}</span>
              </button>
            ))}
          </div>
        </div>
        {editItem.weightDimensions ? (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Weight dimensions <span className="text-amber-400 font-mono">= {computedWeight}/10</span></label>
            <div className="space-y-2">
              {DIMENSION_KEYS.map(key => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white w-24">{DIMENSION_LABELS[key].label}</span>
                  <div className="flex gap-1">{[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" onClick={() => setDimensions(prev => ({ ...prev, [key]: v }))}
                      className={`w-7 h-7 rounded text-[11px] font-medium ${dimensions[key] === v ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{v}</button>
                  ))}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Weight</label>
            <Slider value={weight} onChange={setWeight} labels={WEIGHT_LABELS} color="rose" />
          </div>
        )}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Utility</label>
          <Slider value={utility} onChange={setUtility} labels={UTILITY_LABELS} color="emerald" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Tags</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="comma-separated..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50" />
        </div>
        {availableContexts.length > 0 && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Contexts</label>
            <div className="flex flex-wrap gap-1.5">
              {availableContexts.map(ctx => (
                <button key={ctx.id} type="button"
                  onClick={() => setSelectedContexts(prev => prev.includes(ctx.id) ? prev.filter(c => c !== ctx.id) : [...prev, ctx.id])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedContexts.includes(ctx.id) ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                  {ctx.emoji} {ctx.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={!name.trim()}
            className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-40">Save Changes</button>
          {!editItem.droppedAt && (
            <button type="button" onClick={() => setShowReleaseRitual(true)}
              className="px-4 py-2.5 bg-slate-800 text-amber-400 rounded-lg text-sm hover:bg-slate-700">Release</button>
          )}
        </div>
      </form>
      {showReleaseRitual && (
        <ReleaseRitualModal item={editItem} onClose={() => setShowReleaseRitual(false)} onComplete={onClose} />
      )}
    </>
  );
}

// ─── Guided add flow ───
type AddStep = 'what' | 'inside' | 'weight' | 'custom';

function GuidedAddFlow({ onClose, parentId, parentName, defaultCompartment }: {
  onClose: () => void;
  parentId?: string;
  parentName?: string;
  defaultCompartment?: Compartment;
}) {
  const addItem = usePackStore(s => s.addItem);

  // For top-level: pick a category, then how heavy
  // For sub-item: pick what's inside, then done (dimensions precomputed)
  const isSubItem = !!parentId;

  const [step, setStep] = useState<AddStep>(isSubItem ? 'inside' : 'what');
  const [selectedCategory, setSelectedCategory] = useState<TopLevelCategory | null>(null);
  const [customText, setCustomText] = useState('');

  // Find parent category for sub-item suggestions
  const parentItems = usePackStore(s => s.items);
  const parentItem = parentId ? parentItems.find(i => i.id === parentId) : null;
  const parentCategory = parentItem
    ? TOP_LEVEL_CATEGORIES.find(c => c.label.toLowerCase().includes(parentItem.name.toLowerCase()) || parentItem.name.toLowerCase().includes(c.id))
    : null;

  // ── Step: What's on your mind? (top-level) ──
  const handlePickCategory = (cat: TopLevelCategory) => {
    setSelectedCategory(cat);
    setStep('weight');
  };

  const handleGoCustom = () => {
    setStep('custom');
  };

  // ── Step: How heavy? (top-level) ──
  const handlePickWeight = (weightValue: number) => {
    if (!selectedCategory) return;
    addItem({
      name: selectedCategory.label,
      compartment: selectedCategory.compartment,
      weight: weightValue,
      utility: selectedCategory.utility,
      description: '',
      tags: [],
      contexts: selectedCategory.contexts,
    });
    onClose();
  };

  // ── Step: What's inside? (sub-item) ──
  const handlePickSubItem = (sub: SubItemSuggestion) => {
    const weight = dimensionsToWeight(sub.dimensions);
    addItem({
      name: sub.name,
      compartment: sub.compartment ?? parentItem?.compartment ?? defaultCompartment ?? 'stones',
      weight,
      utility: sub.utility,
      description: '',
      tags: [],
      parentId: parentId,
      weightDimensions: sub.dimensions,
    });
    onClose();
  };

  // ── Step: Custom free text ──
  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    if (isSubItem) {
      addItem({
        name: customText.trim(),
        compartment: parentItem?.compartment ?? defaultCompartment ?? 'stones',
        weight: 5,
        utility: 5,
        description: '',
        tags: [],
        parentId,
      });
    } else {
      addItem({
        name: customText.trim(),
        compartment: defaultCompartment ?? 'stones',
        weight: 5,
        utility: 5,
        description: '',
        tags: [],
      });
    }
    onClose();
  };

  // Sub-item suggestions: use parent category if found, otherwise show generic
  const subSuggestions = parentCategory?.subItems ?? [];

  return (
    <div className="p-4 space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* ── What's on your mind? ── */}
          {step === 'what' && (
            <>
              <p className="text-sm text-slate-400">What's on your mind?</p>
              <div className="grid grid-cols-2 gap-2">
                {TOP_LEVEL_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handlePickCategory(cat)}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-left hover:border-amber-500/30 transition-colors"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <div className="text-sm text-white mt-1">{cat.label}</div>
                  </button>
                ))}
                <button
                  onClick={handleGoCustom}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-left hover:border-amber-500/30 transition-colors"
                >
                  <span className="text-lg">✏️</span>
                  <div className="text-sm text-white mt-1">Something else</div>
                </button>
              </div>
            </>
          )}

          {/* ── How heavy? (top-level) ── */}
          {step === 'weight' && selectedCategory && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('what')} className="text-slate-500 hover:text-slate-300">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-sm text-slate-400">
                  <span className="text-lg mr-1">{selectedCategory.emoji}</span>
                  {selectedCategory.label} — how heavy?
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {WEIGHT_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => handlePickWeight(preset.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center hover:border-amber-500/30 transition-colors"
                  >
                    <div className="text-white font-medium text-sm">{preset.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── What's inside? (sub-item) ── */}
          {step === 'inside' && (
            <>
              <p className="text-sm text-slate-400">
                What makes <span className="text-white">{parentName ?? 'this'}</span> heavy?
              </p>
              {subSuggestions.length > 0 ? (
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                  {subSuggestions.map(sub => {
                    const w = dimensionsToWeight(sub.dimensions);
                    return (
                      <button
                        key={sub.name}
                        onClick={() => handlePickSubItem(sub)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-left hover:border-amber-500/30 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm text-white">{sub.name}</span>
                        <span className="text-xs text-slate-500 font-mono shrink-0 ml-2">{w}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-600">No suggestions for this item. Type your own below.</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                  placeholder="Or type something specific..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim()}
                  className="px-4 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </>
          )}

          {/* ── Custom free text ── */}
          {step === 'custom' && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(isSubItem ? 'inside' : 'what')} className="text-slate-500 hover:text-slate-300">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-sm text-slate-400">What's on your mind?</p>
              </div>
              <input
                type="text"
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                placeholder="Type what you're carrying..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                autoFocus
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customText.trim()}
                className="w-full py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-40"
              >
                Add to Pack
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main modal wrapper ───
export default function AddItemModal({ onClose, editItem, defaultCompartment, parentId, parentName }: Props) {
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
            <h2 className="text-lg font-semibold text-white">
              {editItem ? 'Edit Item' : parentId ? 'Unpack: What\'s Inside?' : 'Add to Pack'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X size={20} />
            </button>
          </div>

          {editItem ? (
            <EditForm editItem={editItem} onClose={onClose} />
          ) : (
            <GuidedAddFlow
              onClose={onClose}
              parentId={parentId}
              parentName={parentName}
              defaultCompartment={defaultCompartment}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
