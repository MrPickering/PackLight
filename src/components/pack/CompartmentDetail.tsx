import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, AGENTS } from '../../types';
import type { Compartment, PackItem } from '../../types';
import WeightUtilityBar from '../shared/WeightUtilityBar';
import AddItemModal from '../items/AddItemModal';

type SortKey = 'weight' | 'utility' | 'delta' | 'updated';

export default function CompartmentDetail() {
  const { compartment } = useParams<{ compartment: string }>();
  const navigate = useNavigate();
  const items = usePackStore(s => s.items);
  const getCompartmentStats = usePackStore(s => s.getCompartmentStats);

  const [sort, setSort] = useState<SortKey>('weight');
  const [deadWeightOnly, setDeadWeightOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PackItem | null>(null);

  if (!compartment || !(compartment in COMPARTMENT_META)) {
    return <div className="text-slate-500">Compartment not found.</div>;
  }

  const comp = compartment as Compartment;
  const meta = COMPARTMENT_META[comp];
  const stats = getCompartmentStats(comp);

  let filtered = items.filter(i => i.compartment === comp && !i.droppedAt);
  if (deadWeightOnly) filtered = filtered.filter(i => i.weight > i.utility + 3);

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'weight': return b.weight - a.weight;
      case 'utility': return b.utility - a.utility;
      case 'delta': return (b.weight - b.utility) - (a.weight - a.utility);
      case 'updated': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default: return 0;
    }
  });

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
          {sorted.map(item => {
            const delta = item.weight - item.utility;
            const isExpanded = expandedId === item.id;
            const bgTint = delta > 2 ? 'border-rose-500/20' : delta < -2 ? 'border-emerald-500/20' : 'border-slate-800';

            return (
              <motion.div
                key={item.id}
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
                    <span className="text-white font-medium text-sm">{item.name}</span>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-rose-400">W:{item.weight}</span>
                      <span className="text-emerald-400">U:{item.utility}</span>
                      <span className={delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <WeightUtilityBar weight={item.weight} utility={item.utility} />
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
            );
          })}
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
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 md:bottom-8 right-6 w-12 h-12 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20"
      >
        <Plus size={20} />
      </motion.button>

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} defaultCompartment={comp} />}
      {editItem && <AddItemModal onClose={() => setEditItem(null)} editItem={editItem} />}
    </div>
  );
}
