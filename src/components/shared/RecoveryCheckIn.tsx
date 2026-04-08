import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePackStore } from '../../store';
import { useDisplayMode } from './DisplayModeProvider';

const DIMENSIONS = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'activity', label: 'Activity' },
  { key: 'social', label: 'Social' },
  { key: 'downtime', label: 'Downtime' },
  { key: 'mindfulness', label: 'Reflection' },
] as const;

export default function RecoveryCheckIn() {
  const addRecoveryCheck = usePackStore(s => s.addRecoveryCheck);
  const recoveryHistory = usePackStore(s => s.profile.recoveryHistory);
  const displayConfig = useDisplayMode();

  const [dismissed, setDismissed] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({
    sleep: 3, activity: 3, social: 3, downtime: 3, mindfulness: 3,
  });
  const [saved, setSaved] = useState(false);

  // Don't show if already checked in today or in minimal display modes
  const today = new Date().toISOString().split('T')[0];
  const checkedInToday = recoveryHistory.some(c => c.date.split('T')[0] === today);

  if (dismissed || checkedInToday || saved || displayConfig.framingStyle === 'minimal') return null;

  const handleSave = () => {
    addRecoveryCheck({
      date: new Date().toISOString(),
      sleep: scores.sleep,
      activity: scores.activity,
      social: scores.social,
      downtime: scores.downtime,
      mindfulness: scores.mindfulness,
    });
    setSaved(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-900 border border-amber-500/20 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Quick Recovery Check</h3>
        <button onClick={() => setDismissed(true)} className="text-slate-600 hover:text-slate-400">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {DIMENSIONS.map(dim => (
          <div key={dim.key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 w-20">{dim.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={() => setScores(prev => ({ ...prev, [dim.key]: v }))}
                  className={`w-7 h-7 rounded text-[11px] font-medium transition-colors ${
                    scores[dim.key] === v
                      ? 'bg-amber-500 text-slate-950'
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

      <button
        onClick={handleSave}
        className="w-full py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors"
      >
        Save Check-in
      </button>
    </motion.div>
  );
}
