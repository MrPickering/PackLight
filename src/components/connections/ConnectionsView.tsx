import { useState, useMemo } from 'react';
import { Link2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META } from '../../types';
import type { ItemRelationship } from '../../utils/relationships';
import { getItemConnections } from '../../utils/relationships';

type FilterType = 'all' | ItemRelationship['type'];

const TYPE_LABELS: Record<ItemRelationship['type'], { label: string; color: string }> = {
  tag: { label: 'Tag', color: 'bg-blue-500/20 text-blue-300' },
  context: { label: 'Context', color: 'bg-violet-500/20 text-violet-300' },
  'cross-compartment': { label: 'Cross-ref', color: 'bg-amber-500/20 text-amber-300' },
  hierarchy: { label: 'Contains', color: 'bg-slate-700 text-slate-300' },
  'dimension-similarity': { label: 'Similar pattern', color: 'bg-rose-500/20 text-rose-300' },
};

export default function ConnectionsView() {
  const items = usePackStore(s => s.items);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const itemConnections = useMemo(() => getItemConnections(items), [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return itemConnections;
    return itemConnections
      .map(ic => ({
        ...ic,
        connections: ic.connections.filter(c => c.relationship.type === filter),
      }))
      .filter(ic => ic.connections.length > 0);
  }, [itemConnections, filter]);

  const types: FilterType[] = ['all', 'tag', 'context', 'cross-compartment', 'dimension-similarity', 'hierarchy'];

  if (itemConnections.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-900 border border-slate-800 rounded-xl">
        <Link2 size={24} className="text-slate-600 mx-auto mb-2" />
        <p className="text-slate-600 text-sm italic">
          No connections found yet. Add tags, contexts, or more items to surface relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
              filter === t
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'all' ? 'All' : TYPE_LABELS[t].label}
          </button>
        ))}
      </div>

      {/* Connection cards */}
      <AnimatePresence>
        {filtered.map(({ item, connections }) => {
          const isExpanded = expandedId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{COMPARTMENT_META[item.compartment].emoji}</span>
                    <span className="text-sm text-white font-medium">{item.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {connections.length} connection{connections.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-slate-800 pt-3">
                      {connections.map(({ relatedItem, relationship }, idx) => (
                        <div
                          key={`${relatedItem.id}-${idx}`}
                          className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm shrink-0">{COMPARTMENT_META[relatedItem.compartment].emoji}</span>
                            <span className="text-xs text-slate-300 truncate">{relatedItem.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_LABELS[relationship.type].color}`}>
                              {TYPE_LABELS[relationship.type].label}
                            </span>
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-600 pt-1">
                        {connections.length} relationship{connections.length !== 1 ? 's' : ''} — items that share tags, contexts, or patterns
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
