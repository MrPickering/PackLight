import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GuidedPrompt } from '../../types';

const BORDER_COLORS: Record<GuidedPrompt['type'], string> = {
  milestone: 'border-emerald-500/20',
  pattern: 'border-amber-500/20',
  item: 'border-slate-700',
};

interface Props {
  prompt: GuidedPrompt;
  onDismiss: (dismissKey: string) => void;
  onAction?: (prompt: GuidedPrompt) => void;
}

export default function GuidedPromptCard({ prompt, onDismiss, onAction }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={`bg-slate-900 border ${BORDER_COLORS[prompt.type]} rounded-xl p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-300 flex-1">{prompt.message}</p>
        <button onClick={() => onDismiss(prompt.dismissKey)} className="text-slate-600 hover:text-slate-400 shrink-0 mt-0.5">
          <X size={14} />
        </button>
      </div>
      {prompt.action && onAction && (
        <button
          onClick={() => onAction(prompt)}
          className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-medium"
        >
          {prompt.action.label} →
        </button>
      )}
    </motion.div>
  );
}
