import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { COMPARTMENT_META, TERRAIN_META } from '../../types';
import type { Compartment } from '../../types';
import WeightUtilityBar from '../shared/WeightUtilityBar';
import { useState } from 'react';
import AddItemModal from '../items/AddItemModal';

const COMPARTMENTS: Compartment[] = ['stones', 'chains', 'tools', 'provisions', 'maps', 'souvenirs'];

export default function PackView() {
  const navigate = useNavigate();
  const profile = usePackStore(s => s.profile);
  const getPaceScore = usePackStore(s => s.getPaceScore);
  const getCompartmentStats = usePackStore(s => s.getCompartmentStats);
  const getCompartmentItems = usePackStore(s => s.getCompartmentItems);
  const agentNotes = usePackStore(s => s.agentNotes);
  const [showAdd, setShowAdd] = useState(false);

  const paceScore = getPaceScore();
  const terrain = TERRAIN_META[profile.currentTerrain];
  const recentNotes = agentNotes.filter(n => n.status === 'pending').slice(0, 3);

  const prevScore = profile.paceScoreHistory.length > 1
    ? profile.paceScoreHistory[profile.paceScoreHistory.length - 2]?.value
    : null;
  const trend = prevScore !== null ? paceScore - prevScore : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {profile.name ? `${profile.name}'s Pack` : 'My Pack'}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
            <span>{terrain.emoji} {terrain.label}</span>
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
          <span className="text-xs text-slate-500">Pace Score</span>
        </div>
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
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="font-medium text-white text-sm">{meta.label}</span>
                </div>
                <span className="text-xs text-slate-500">{stats.count} items</span>
              </div>

              <WeightUtilityBar weight={stats.totalWeight} utility={stats.totalUtility} />

              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-rose-400">W: {stats.totalWeight}</span>
                <span className="text-emerald-400">U: {stats.totalUtility}</span>
              </div>

              {top3.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
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
                <p className="text-xs text-slate-600 mt-3 italic">
                  {comp === 'stones' && 'Nothing weighing you down here. That\'s strength, not emptiness.'}
                  {comp === 'chains' && 'No obligations tracked. Freedom looks good on you.'}
                  {comp === 'tools' && 'Add your skills and capabilities to start tracking.'}
                  {comp === 'provisions' && 'Track your resources and safety nets here.'}
                  {comp === 'maps' && 'Chart your goals and aspirations.'}
                  {comp === 'souvenirs' && 'Collect what gives your life meaning.'}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
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
          <RefreshCw size={16} /> Repack
        </button>
      </div>

      {/* Agent feed preview */}
      {recentNotes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-slate-400">Recent Agent Observations</h2>
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
