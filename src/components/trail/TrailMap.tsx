import { useState } from 'react';
import { Target, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { usePackStore } from '../../store';
import { TERRAIN_META, COMPARTMENT_META } from '../../types';
import type { TerrainType } from '../../types';
import WeightUtilityBar from '../shared/WeightUtilityBar';

const TERRAINS: TerrainType[] = ['summit', 'downhill', 'camp', 'uphill', 'ridge', 'swamp'];
const RANGE_OPTIONS = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
];

export default function TrailMap() {
  const profile = usePackStore(s => s.profile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const items = usePackStore(s => s.items);
  const getCompartmentItems = usePackStore(s => s.getCompartmentItems);
  const [range, setRange] = useState(30);

  const maps = getCompartmentItems('maps');
  const droppedItems = items.filter(i => !!i.droppedAt).sort((a, b) =>
    new Date(b.droppedAt!).getTime() - new Date(a.droppedAt!).getTime(),
  );

  const totalDroppedWeight = droppedItems.reduce((s, i) => s + i.weight, 0);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const paceHistory = profile.paceScoreHistory
    .filter(p => new Date(p.date) >= cutoff)
    .map(p => ({ ...p, date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));

  // Find tools and provisions that support each map item
  const tools = getCompartmentItems('tools');
  const provisions = getCompartmentItems('provisions');

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <h1 className="text-xl font-semibold text-white">Trail Map</h1>

      {/* Goals */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Target size={14} /> Goals & Waypoints
        </h2>
        {maps.length > 0 ? (
          maps.map(goal => {
            const daysSinceCreated = Math.floor((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const progress = Math.min(100, Math.round((goal.utility / 10) * 100));
            const connectedTools = tools.filter(t =>
              t.tags.some(tag => goal.tags.includes(tag)) || goal.description.toLowerCase().includes(t.name.toLowerCase()),
            );
            const connectedProvisions = provisions.filter(p =>
              p.tags.some(tag => goal.tags.includes(tag)) || goal.description.toLowerCase().includes(p.name.toLowerCase()),
            );

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{goal.name}</span>
                  <span className="font-mono text-xs text-violet-400">{progress}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-500">{daysSinceCreated}d active</span>
                  <WeightUtilityBar weight={goal.weight} utility={goal.utility} />
                </div>
                {(connectedTools.length > 0 || connectedProvisions.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {connectedTools.map(t => (
                      <span key={t.id} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                        🔧 {t.name}
                      </span>
                    ))}
                    {connectedProvisions.map(p => (
                      <span key={p.id} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                        📦 {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-600 text-sm italic">No goals mapped yet. Add items to your Maps compartment to chart your course.</p>
          </div>
        )}
      </div>

      {/* Terrain selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-400">Current Terrain</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TERRAINS.map(t => {
            const meta = TERRAIN_META[t];
            return (
              <button
                key={t}
                onClick={() => setTerrain(t)}
                className={`p-3 rounded-xl text-left transition-colors ${
                  profile.currentTerrain === t
                    ? 'bg-amber-500/20 border border-amber-500/30'
                    : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-lg mb-1">{meta.emoji}</div>
                <div className="text-sm font-medium text-white">{meta.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{meta.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pace Score chart */}
      {paceHistory.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-400">Pace Score Trend</h2>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setRange(opt.days)}
                  className={`px-2.5 py-1 rounded text-xs ${
                    range === opt.days ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={paceHistory}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 2]} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Dropped weight history */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <TrendingDown size={14} /> Dropped Weight
          {totalDroppedWeight > 0 && (
            <span className="font-mono text-emerald-400 text-xs">-{totalDroppedWeight} total</span>
          )}
        </h2>
        {droppedItems.length > 0 ? (
          <div className="space-y-1">
            {droppedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{COMPARTMENT_META[item.compartment].emoji}</span>
                  <span className="text-sm text-slate-400">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400 font-mono">-{item.weight}</span>
                  <span className="text-slate-600">{new Date(item.droppedAt!).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-slate-600 text-sm italic">Nothing dropped yet. When you're ready to let go, your freed weight shows up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
