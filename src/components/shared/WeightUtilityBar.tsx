interface Props {
  weight: number;
  utility: number;
}

export default function WeightUtilityBar({ weight, utility }: Props) {
  const total = weight + utility || 1;
  const wPct = (weight / total) * 100;
  const uPct = (utility / total) * 100;

  return (
    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
      <div className="bg-rose-500/70 transition-all duration-500" style={{ width: `${wPct}%` }} />
      <div className="bg-emerald-500/70 transition-all duration-500" style={{ width: `${uPct}%` }} />
    </div>
  );
}
