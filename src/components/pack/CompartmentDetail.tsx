import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, Check, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, AGENTS, LIGHTENING_STRATEGIES, DIMENSION_LABELS } from '../../types';
import type { Compartment, PackItem, WeightDimensions } from '../../types';
import WeightUtilityBar from '../shared/WeightUtilityBar';
import { useDisplayMode } from '../shared/DisplayModeProvider';
import AddItemModal from '../items/AddItemModal';

type SortKey = 'weight' | 'utility' | 'delta' | 'updated';

export default function CompartmentDetail() {
  const { compartment } = useParams<{ compartment: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const highlightItemId = (location.state as { highlightItemId?: string })?.highlightItemId;
  const items = usePackStore(s => s.items);
  const getCompartmentStats = usePackStore(s => s.getCompartmentStats);
  const getChildItems = usePackStore(s => s.getChildItems);
  const getEffectiveWeight = usePackStore(s => s.getEffectiveWeight);
  const getEffectiveUtility = usePackStore(s => s.getEffectiveUtility);
  const setLighteningApproach = usePackStore(s => s.setLighteningApproach);
  const setNextStep = usePackStore(s => s.setNextStep);
  const completeNextStep = usePackStore(s => s.completeNextStep);
  const markAsContainer = usePackStore(s => s.markAsContainer);
  const activeContext = usePackStore(s => s.profile.activeContext);
  const displayConfig = useDisplayMode();

  const [sort, setSort] = useState<SortKey>('weight');
  const [deadWeightOnly, setDeadWeightOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(highlightItemId ?? null);
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addParent, setAddParent] = useState<{ id: string; name: string } | null>(null);
  const [editItem, setEditItem] = useState<PackItem | null>(null);
  const [nextStepInput, setNextStepInput] = useState<Record<string, string>>({});
  const [showStepHistory, setShowStepHistory] = useState<string | null>(null);

  if (!compartment || !(compartment in COMPARTMENT_META)) {
    return <div className="text-slate-500">Compartment not found.</div>;
  }

  const comp = compartment as Compartment;
  const meta = COMPARTMENT_META[comp];
  const stats = getCompartmentStats(comp);

  // Show root items for this compartment, filtered by active context
  let filtered = items.filter(i =>
    i.compartment === comp && !i.droppedAt && !i.parentId &&
    (activeContext === null || i.contexts.includes(activeContext) || i.contexts.length === 0)
  );
  if (deadWeightOnly) filtered = filtered.filter(i => {
    const ew = getEffectiveWeight(i.id);
    const eu = getEffectiveUtility(i.id);
    return ew > eu + 3;
  });

  const allSorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'weight': return getEffectiveWeight(b.id) - getEffectiveWeight(a.id);
      case 'utility': return getEffectiveUtility(b.id) - getEffectiveUtility(a.id);
      case 'delta': return (getEffectiveWeight(b.id) - getEffectiveUtility(b.id)) - (getEffectiveWeight(a.id) - getEffectiveUtility(a.id));
      case 'updated': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default: return 0;
    }
  });
  const sorted = displayConfig.maxVisibleItems
    ? allSorted.slice(0, displayConfig.maxVisibleItems)
    : allSorted;

  const toggleChildren = (id: string) => {
    setExpandedChildren(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleUnpack = (item: PackItem) => {
    markAsContainer(item.id);
    setAddParent({ id: item.id, name: item.name });
  };

  const renderItem = (item: PackItem, depth: number = 0) => {
    const children = getChildItems(item.id);
    const ew = getEffectiveWeight(item.id);
    const eu = getEffectiveUtility(item.id);
    const delta = ew - eu;
    const isExpanded = expandedId === item.id;
    const childrenVisible = expandedChildren.has(item.id);
    const bgTint = delta > 2 ? 'border-rose-500/20' : delta < -2 ? 'border-emerald-500/20' : 'border-slate-800';
    const showLawnMoment = item.isContainer && children.length > 0 && ew !== item.originalWeight;

    return (
      <div key={item.id} style={{ marginLeft: depth * 16 }}>
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-slate-900 border ${bgTint} rounded-xl overflow-hidden`}
        >
          <button
            onClick={() => setExpandedId(isExpanded ? null : item.id)}
            className="w-full p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {displayConfig.showFullTree && item.isContainer && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleChildren(item.id); }}
                    className="text-slate-600 hover:text-slate-400 shrink-0"
                  >
                    {childrenVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
                <span className="text-white font-medium text-sm truncate">{item.name}</span>
                {item.isContainer && (
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                    {children.length} inside
                  </span>
                )}
                {item.parentId && item.compartment !== comp && (
                  <span className="text-[10px]">{COMPARTMENT_META[item.compartment].emoji}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                <span className="text-rose-400">W:{ew}</span>
                <span className="text-emerald-400">U:{eu}</span>
                <span className={delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              </div>
            </div>

            {/* Lawn moment */}
            {showLawnMoment && (
              <div className="mt-1.5 text-[10px] text-amber-400">
                You estimated {item.originalWeight}. Unpacked: {ew} across {children.length} sub-items.
              </div>
            )}

            {/* Dimension breakdown for sub-items */}
            {displayConfig.showDimensions && item.weightDimensions && (
              <div className="flex gap-2 mt-1.5">
                {(Object.entries(item.weightDimensions) as [keyof WeightDimensions, number][]).map(([key, val]) => (
                  <span key={key} className={`text-[10px] ${val >= 4 ? 'text-rose-400' : 'text-slate-600'}`}>
                    {DIMENSION_LABELS[key].label}:{val}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2">
              <WeightUtilityBar weight={ew} utility={eu} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-600">
                Updated {new Date(item.updatedAt).toLocaleDateString()}
              </span>
              {item.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-800"
              >
                <div className="p-4 space-y-4">
                  {item.description && (
                    <p className="text-sm text-slate-400">{item.description}</p>
                  )}

                  {/* Sparklines */}
                  {item.weightHistory.length > 1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-rose-400 uppercase tracking-wider">Weight History</span>
                        <ResponsiveContainer width="100%" height={40}>
                          <LineChart data={item.weightHistory}>
                            <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Utility History</span>
                        <ResponsiveContainer width="100%" height={40}>
                          <LineChart data={item.utilityHistory}>
                            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Agent notes */}
                  {item.agentNotes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-violet-400 uppercase tracking-wider">Agent Notes</span>
                      {item.agentNotes.slice(0, 3).map(note => (
                        <div key={note.id} className="bg-slate-800/50 rounded-lg p-2.5 text-xs text-slate-400">
                          <span className="text-violet-300">{AGENTS[note.agentId].emoji} {AGENTS[note.agentId].name}:</span>{' '}
                          {note.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unpack action */}
                  {!item.isContainer && (
                    <button
                      onClick={() => handleUnpack(item)}
                      className="flex items-center gap-2 w-full py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors justify-center"
                    >
                      <Package size={14} /> Unpack this — what's inside?
                    </button>
                  )}

                  {/* Add sub-item button for containers */}
                  {item.isContainer && (
                    <button
                      onClick={() => setAddParent({ id: item.id, name: item.name })}
                      className="flex items-center gap-2 w-full py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition-colors justify-center"
                    >
                      <Plus size={12} /> Add sub-item
                    </button>
                  )}

                  {/* Lighten This */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider">Lighten This</span>

                    {!item.lighteningApproach ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">How do you want to approach this?</p>
                        <div className="flex flex-wrap gap-1.5">
                          {LIGHTENING_STRATEGIES[item.compartment].map(strategy => (
                            <button
                              key={strategy.key}
                              onClick={() => setLighteningApproach(item.id, strategy.key)}
                              className="group relative px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
                              title={strategy.description}
                            >
                              {strategy.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-amber-500/15 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            {LIGHTENING_STRATEGIES[item.compartment].find(s => s.key === item.lighteningApproach)?.label ?? item.lighteningApproach}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {LIGHTENING_STRATEGIES[item.compartment].find(s => s.key === item.lighteningApproach)?.description}
                          </span>
                          <button
                            onClick={() => setLighteningApproach(item.id, '')}
                            className="text-[10px] text-slate-600 hover:text-slate-400 ml-auto shrink-0"
                          >
                            change
                          </button>
                        </div>

                        {item.nextStep && !item.nextStep.completedAt ? (
                          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2.5">
                            <button
                              onClick={() => completeNextStep(item.id)}
                              className="shrink-0 w-5 h-5 rounded border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                            >
                              <Check size={10} className="text-emerald-400 opacity-0 hover:opacity-100" />
                            </button>
                            <span className="text-sm text-slate-300">{item.nextStep.text}</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={nextStepInput[item.id] ?? ''}
                              onChange={e => setNextStepInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="What's one concrete thing you could do?"
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                              onKeyDown={e => {
                                if (e.key === 'Enter' && nextStepInput[item.id]?.trim()) {
                                  setNextStep(item.id, nextStepInput[item.id].trim());
                                  setNextStepInput(prev => ({ ...prev, [item.id]: '' }));
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (nextStepInput[item.id]?.trim()) {
                                  setNextStep(item.id, nextStepInput[item.id].trim());
                                  setNextStepInput(prev => ({ ...prev, [item.id]: '' }));
                                }
                              }}
                              disabled={!nextStepInput[item.id]?.trim()}
                              className="px-3 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-medium hover:bg-amber-400 transition-colors disabled:opacity-40"
                            >
                              Set
                            </button>
                          </div>
                        )}

                        {(item.completedSteps?.length ?? 0) > 0 && (
                          <div>
                            <button
                              onClick={() => setShowStepHistory(showStepHistory === item.id ? null : item.id)}
                              className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300"
                            >
                              {item.completedSteps.length} step{item.completedSteps.length !== 1 ? 's' : ''} completed
                              {showStepHistory === item.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                            <AnimatePresence>
                              {showStepHistory === item.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 space-y-1">
                                    {item.completedSteps.map((step, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                                        <Check size={10} className="text-emerald-500 shrink-0" />
                                        <span className="line-through">{step.text}</span>
                                        <span className="text-[10px] text-slate-700 ml-auto shrink-0">
                                          {new Date(step.completedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEditItem(item)}
                    className="text-sm text-amber-400 hover:text-amber-300"
                  >
                    Edit item
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Render children inline when expanded */}
        {displayConfig.showFullTree && childrenVisible && children.length > 0 && (
          <div className="space-y-2 mt-2">
            {children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>{meta.emoji}</span> {meta.label}
          </h1>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="text-slate-500">{stats.count} items</span>
            <span className="text-rose-400">Weight: {stats.totalWeight}</span>
            <span className="text-emerald-400">Utility: {stats.totalUtility}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden text-xs">
          {(['weight', 'utility', 'delta', 'updated'] as SortKey[]).map(key => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                sort === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDeadWeightOnly(!deadWeightOnly)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
            deadWeightOnly ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-900 border border-slate-800 text-slate-500'
          }`}
        >
          <Filter size={12} /> Dead Weight
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        <AnimatePresence>
          {sorted.map(item => renderItem(item))}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm italic">
              {deadWeightOnly
                ? 'No dead weight here. Your pack is balanced.'
                : `No items in ${meta.label} yet. Add your first one.`}
            </p>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setAddParent(null); setShowAdd(true); }}
        className="fixed bottom-20 md:bottom-8 right-6 w-12 h-12 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20"
      >
        <Plus size={20} />
      </motion.button>

      {showAdd && !addParent && <AddItemModal onClose={() => setShowAdd(false)} defaultCompartment={comp} />}
      {addParent && (
        <AddItemModal
          onClose={() => setAddParent(null)}
          defaultCompartment={comp}
          parentId={addParent.id}
          parentName={addParent.name}
        />
      )}
      {editItem && <AddItemModal onClose={() => setEditItem(null)} editItem={editItem} />}
    </div>
  );
}
