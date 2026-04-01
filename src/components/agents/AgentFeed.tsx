import { useState } from 'react';
import { Check, Clock, X, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePackStore } from '../../store';
import { AGENTS } from '../../types';
import type { AgentId, AgentNote } from '../../types';
import { callAgent } from '../../utils/api';

const ALL_AGENTS: (AgentId | 'all')[] = ['all', 'geologist', 'locksmith', 'blacksmith', 'quartermaster', 'navigator', 'archivist'];

export default function AgentFeed() {
  const agentNotes = usePackStore(s => s.agentNotes);
  const items = usePackStore(s => s.items);
  const updateNoteStatus = usePackStore(s => s.updateNoteStatus);
  const [filter, setFilter] = useState<AgentId | 'all'>('all');
  const [chatNoteId, setChatNoteId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const filtered = filter === 'all'
    ? agentNotes
    : agentNotes.filter(n => n.agentId === filter);

  const handleChat = async (note: AgentNote) => {
    const apiKey = localStorage.getItem('packlight-api-key');
    if (!apiKey) return;

    setChatNoteId(note.id);
    setChatMessages([{ role: 'assistant', content: note.content }]);
  };

  const sendChat = async (note: AgentNote) => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);

    try {
      const agent = AGENTS[note.agentId];
      const relatedItems = items.filter(i => note.relatedItemIds.includes(i.id));
      const response = await callAgent(agent, msg, relatedItems.length > 0 ? relatedItems : items);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Unable to reach agent. Check your API key in Settings.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <h1 className="text-xl font-semibold text-white">Agent Feed</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {ALL_AGENTS.map(id => {
          const isAll = id === 'all';
          const agent = isAll ? null : AGENTS[id];
          const count = isAll ? agentNotes.length : agentNotes.filter(n => n.agentId === id).length;
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                filter === id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {isAll ? 'All' : <><span>{agent!.emoji}</span> {agent!.name}</>}
              {count > 0 && <span className="font-mono text-[10px] ml-1">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map(note => {
            const agent = AGENTS[note.agentId];
            const isChat = chatNoteId === note.id;
            const relatedItems = items.filter(i => note.relatedItemIds.includes(i.id));

            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                          note.actionType === 'alert' ? 'bg-rose-500/20 text-rose-300' :
                          note.actionType === 'celebration' ? 'bg-emerald-500/20 text-emerald-300' :
                          note.actionType === 'recommendation' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {note.actionType}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{note.content}</p>

                      {relatedItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {relatedItems.map(item => (
                            <span key={item.id} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      {note.status === 'pending' && (
                        <div className="flex gap-1.5 mt-3">
                          <button
                            onClick={() => updateNoteStatus(note.id, 'accepted')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button
                            onClick={() => updateNoteStatus(note.id, 'snoozed')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-400 rounded text-xs hover:bg-slate-700"
                          >
                            <Clock size={12} /> Snooze
                          </button>
                          <button
                            onClick={() => updateNoteStatus(note.id, 'dismissed')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-500 rounded text-xs hover:bg-slate-700"
                          >
                            <X size={12} /> Dismiss
                          </button>
                          {localStorage.getItem('packlight-api-key') && (
                            <button
                              onClick={() => handleChat(note)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/20 text-violet-400 rounded text-xs hover:bg-violet-500/30"
                            >
                              <MessageCircle size={12} /> Discuss
                            </button>
                          )}
                        </div>
                      )}

                      {note.status !== 'pending' && (
                        <span className={`text-[10px] mt-2 inline-block capitalize ${
                          note.status === 'accepted' ? 'text-emerald-400' :
                          note.status === 'snoozed' ? 'text-amber-400' : 'text-slate-600'
                        }`}>
                          {note.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline chat */}
                {isChat && (
                  <div className="border-t border-slate-800 bg-slate-950/50 p-4 space-y-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-white' : 'text-violet-300'}`}>
                          <span className="text-[10px] text-slate-600 block mb-0.5">
                            {msg.role === 'user' ? 'You' : agent.name}
                          </span>
                          {msg.content}
                        </div>
                      ))}
                      {chatLoading && <Loader2 size={14} className="text-violet-400 animate-spin" />}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChat(note)}
                        placeholder={`Ask ${agent.name}...`}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                      />
                      <button
                        onClick={() => sendChat(note)}
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-3 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-400 disabled:opacity-40"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 text-sm italic">
              No agent observations yet. Add items to your pack and they'll start sharing insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
