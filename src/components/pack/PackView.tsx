import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, TERRAIN_META } from '../../types';
import type { Compartment } from '../../types';
import WeightUtilityBar from '../shared/WeightUtilityBar';
import { useState } from 'react';
import AddItemModal from '../items/AddItemModal';

const COMPARTMENTS: Compartment[] = ['stones', 'chains', 'tools', 'provisions', 'maps', 'souvenirs'];

const COMPARTMENT_ACTIONS: Record<Compartment, string> = {
  stones: 'Reduce weight through processing, therapy, or letting go',
  chains: 'Renegotiate, automate, or drop obligations that drain you',
  tools: 'Sharpen skills that serve your goals, retire what\'s rusted',
  provisions: 'Strengthen your safety nets and close resource gaps',
  maps: 'Clarify direction, set milestones, and track progress',
  souvenirs: 'Protect what gives you meaning — tend what matters',
};

const EMPTY_STATES: Record<Compartment, string> = {
  stones: 'No emotional burdens tracked. Add stressors, worries, or grief to start managing them.',
  chains: 'No obligations tracked. Add debts, commitments, or draining duties here.',
  tools: 'No skills tracked. Add your capabilities so you can see what serves your goals.',
  provisions: 'No resources tracked. Add savings, insurance, support networks, etc.',
  maps: 'No goals tracked. Add what you\'re working toward — career, health, relationships.',
  souvenirs: 'No meaning items tracked. Add passions, values, and what defines you.',
};

export default function PackView() {
  const navigate = useNavigate();
  const profile = usePackStore(s => s.profile);
  const getPaceScore = usePackStore(s => s.getPaceScore);
  const getCompartmentStats = usePackStore(s => s.getCompartmentStats);
  const getCompartmentItems = usePackStore(s => s.getCompartmentItems);
  const getActiveItems = usePackStore(s => s.getActiveItems);
  const agentNotes = usePackStore(s => s.agentNotes);
  const [showAdd, setShowAdd] = useState(false);

  const paceScore = getPaceScore();
  const terrain = TERRAIN_META[profile.currentTerrain];
  const recentNotes = agentNotes.filter(n => n.status === 'pending').slice(0, 3);
  const activeItems = getActiveItems();

  const totalWeight = activeItems.reduce((s, i) => s + i.weight, 0);
  const totalUtility = activeItems.reduce((s, i) => s + i.utility, 0);

  const prevScore = profile.paceScoreHistory.length > 1
    ? profile.paceScoreHistory[profile.paceScoreHistory.length - 2]?.value
    : null;
  const trend = prevScore !== null ? paceScore - prevScore : 0;

  // Find heaviest burdens and strongest assets for the summary
  const heaviest = [...activeItems].filter(i => i.weight > i.utility).sort((a, b) => (b.weight - b.utility) - (a.weight - a.utility)).slice(0, 3);
  const strongest = [...activeItems].filter(i => i.utility > i.weight).sort((a, b) => (b.utility - b.weight) - (a.utility - a.weight)).slice(0, 3);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header with summary */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {profile.name ? `${profile.name}'s Pack` : 'My Pack'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
            <span>{terrain.emoji} {terrain.label}</span>
            <span className="text-slate-700">|</span>
            <span>{activeItems.length} items</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <motion.span
              key={paceScore}
              initial={{ scale: 1.3, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="font-mono text-3xl font-bold text-white"
            >
              {paceScore.toFixed(2)}
            </motion.span>
            {trend > 0 && <TrendingUp size={16} className="text-emerald-400" />}
            {trend < 0 && <TrendingDown size={16} className="text-rose-400" />}
            {trend === 0 && <Minus size={16} className="text-slate-500" />}
          </div>
          <span className="text-xs text-slate-500">Pace Score (utility / weight)</span>
        </div>
      </div>

      {/* Quick insight bar */}
      {activeItems.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Load</span>
            <div className="flex gap-4">
              <span className="text-rose-400 font-mono">Weight: {totalWeight}</span>
              <span className="text-emerald-400 font-mono">Utility: {totalUtility}</span>
            </div>
          </div>
          <WeightUtilityBar weight={totalWeight} utility={totalUtility} />

          <div className="grid grid-cols-2 gap-3 pt-1">
            {heaviest.length > 0 && (
              <div>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider">Heaviest Burdens</span>
                <div className="mt-1 space-y-0.5">
                  {heaviest.map(item => (
                    <div key={item.id} className="text-xs text-slate-400 flex justify-between">
                      <span className="truncate">{item.name}</span>
                      <span className="text-rose-400 font-mono ml-2 shrink-0">+{item.weight - item.utility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {strongest.length > 0 && (
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Strongest Assets</span>
                <div className="mt-1 space-y-0.5">
                  {strongest.map(item => (
                    <div key={item.id} className="text-xs text-slate-400 flex justify-between">
                      <span className="truncate">{item.name}</span>
                      <span className="text-emerald-400 font-mono ml-2 shrink-0">+{item.utility - item.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state guidance */}
      {activeItems.length === 0 && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-6 text-center space-y-3">
          <h2 className="text-lg font-medium text-white">Your pack is empty</h2>
          <p className="text-sm text-slate-400">
            Start by adding what you're carrying — stressors, obligations, skills, goals, and resources.
            Tap a category below to see it in detail, or add an item directly.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            <Plus size={16} /> Add Your First Item
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} /> Add Item
        </button>
        <button
          onClick={() => navigate('/journal')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          <BookOpen size={16} /> Journal
        </button>
        <button
          onClick={() => navigate('/repack')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={16} /> Weekly Repack
        </button>
      </div>

      {/* Compartment grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COMPARTMENTS.map(comp => {
          const meta = COMPARTMENT_META[comp];
          const stats = getCompartmentStats(comp);
          const items = getCompartmentItems(comp);
          const top3 = [...items].sort((a, b) => b.weight - a.weight).slice(0, 3);

          return (
            <motion.button
              key={comp}
              onClick={() => navigate(`/pack/${comp}`)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="font-medium text-white text-sm">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{stats.count}</span>
                  <ArrowRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>

              <p className="text-[11px] text-slate-600 mb-2">{COMPARTMENT_ACTIONS[comp]}</p>

              {stats.count > 0 && (
                <>
                  <WeightUtilityBar weight={stats.totalWeight} utility={stats.totalUtility} />
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className="text-rose-400 font-mono">W:{stats.totalWeight}</span>
                    <span className="text-emerald-400 font-mono">U:{stats.totalUtility}</span>
                  </div>
                </>
              )}

              {top3.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {top3.map(item => {
                    const delta = item.weight - item.utility;
                    const pillColor = delta > 2 ? 'bg-rose-500/20 text-rose-300' : delta < -2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400';
                    return (
                      <span key={item.id} className={`text-[11px] px-2 py-0.5 rounded-full ${pillColor}`}>
                        {item.name} <span className="font-mono">{item.weight}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {stats.count === 0 && (
                <p className="text-xs text-slate-600 mt-2 italic">{EMPTY_STATES[comp]}</p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Agent feed preview */}
      {recentNotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-400">Agent Observations</h2>
            <button onClick={() => navigate('/agents')} className="text-xs text-amber-400 hover:text-amber-300">
              View all
            </button>
          </div>
          <AnimatePresence>
            {recentNotes.map(note => {
              const agent = { geologist: '🪨', locksmith: '🔓', blacksmith: '⚒️', quartermaster: '📦', navigator: '🧭', archivist: '📜' }[note.agentId];
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex gap-3"
                >
                  <span className="text-lg shrink-0">{agent}</span>
                  <p className="text-sm text-slate-400 line-clamp-2">{note.content}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
