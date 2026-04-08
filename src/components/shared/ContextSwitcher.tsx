import { usePackStore } from '../../store';

export default function ContextSwitcher() {
  const contexts = usePackStore(s => s.profile.contexts);
  const activeContext = usePackStore(s => s.profile.activeContext);
  const setActiveContext = usePackStore(s => s.setActiveContext);

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      <button
        onClick={() => setActiveContext(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
          activeContext === null
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-slate-800 text-slate-500 hover:text-slate-300'
        }`}
      >
        All
      </button>
      {contexts.map(ctx => (
        <button
          key={ctx.id}
          onClick={() => setActiveContext(ctx.id === activeContext ? null : ctx.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeContext === ctx.id
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {ctx.emoji} {ctx.name}
        </button>
      ))}
    </div>
  );
}
