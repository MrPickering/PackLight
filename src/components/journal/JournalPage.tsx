import { useState } from 'react';
import { Send, Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePackStore } from '../../store';
import { analyzeJournal } from '../../utils/api';
import type { DetectedItem } from '../../types';

const MOODS = ['😫', '😔', '😐', '🙂', '😊'];

export default function JournalPage() {
  const journal = usePackStore(s => s.journal);
  const addJournalEntry = usePackStore(s => s.addJournalEntry);
  const approveDetectedItem = usePackStore(s => s.approveDetectedItem);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const entry = {
      content: content.trim(),
      mood,
      detectedItems: [] as DetectedItem[],
    };

    addJournalEntry(entry);
    const latestEntry = usePackStore.getState().journal[0];
    setCurrentEntryId(latestEntry.id);

    // Try to analyze with API
    const apiKey = localStorage.getItem('packlight-api-key');
    if (apiKey) {
      setAnalyzing(true);
      try {
        const items = await analyzeJournal(content, mood);
        const detected = items.map(i => ({ ...i, approved: false } as DetectedItem));
        setDetectedItems(detected);

        // Update journal entry with detected items
        const store = usePackStore.getState();
        const updatedJournal = store.journal.map(e =>
          e.id === latestEntry.id ? { ...e, detectedItems: detected } : e,
        );
        usePackStore.setState({ journal: updatedJournal });
      } catch {
        // Silently fail - journal still saved
      } finally {
        setAnalyzing(false);
      }
    }

    setContent('');
    setMood(3);
  };

  const handleApprove = (index: number) => {
    if (!currentEntryId) return;
    approveDetectedItem(currentEntryId, index);
    setDetectedItems(prev => prev.map((d, i) => (i === index ? { ...d, approved: true } : d)));
  };

  const handleDismiss = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-xl font-semibold text-white">Journal</h1>

      {/* Writing area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind? What are you carrying today?"
          rows={6}
          className="w-full bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-2">Mood:</span>
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMood(i + 1)}
                className={`text-lg p-1 rounded transition-all ${
                  mood === i + 1 ? 'scale-125 bg-slate-800' : 'opacity-40 hover:opacity-70'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {localStorage.getItem('packlight-api-key') && (
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || analyzing}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-400 transition-colors disabled:opacity-40"
              >
                {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {analyzing ? 'Analyzing...' : 'Save & Analyze'}
              </button>
            )}
            {!localStorage.getItem('packlight-api-key') && (
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-40"
              >
                <Send size={14} /> Save Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detected items */}
      {detectedItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-violet-400">Detected Pack Items</h2>
          {detectedItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between ${
                item.approved ? 'opacity-50' : ''
              }`}
            >
              <div>
                <span className="text-white text-sm font-medium">{item.name}</span>
                <div className="flex gap-3 mt-1 text-xs">
                  <span className="text-slate-500 capitalize">{item.compartment}</span>
                  <span className="text-rose-400">W: {item.suggestedWeight}</span>
                  <span className="text-emerald-400">U: {item.suggestedUtility}</span>
                </div>
              </div>
              {!item.approved && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleApprove(i)}
                    className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleDismiss(i)}
                    className="p-1.5 bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {item.approved && (
                <span className="text-xs text-emerald-400">Added</span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!localStorage.getItem('packlight-api-key') && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-500">Configure your API key in Settings to enable AI-powered journal analysis.</p>
        </div>
      )}

      {/* Past entries */}
      {journal.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-400">Past Entries</h2>
          {journal.map(entry => (
            <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <span>{MOODS[entry.mood - 1]}</span>
                  {entry.detectedItems.length > 0 && (
                    <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                      {entry.detectedItems.filter(d => d.approved).length}/{entry.detectedItems.length} items
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-400 line-clamp-3">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
