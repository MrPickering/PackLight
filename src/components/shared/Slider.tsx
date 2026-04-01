interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  labels?: Record<number, string>;
  color?: 'rose' | 'emerald' | 'amber';
}

const colorMap = {
  rose: 'accent-rose-500',
  emerald: 'accent-emerald-500',
  amber: 'accent-amber-500',
};

export default function Slider({ value, onChange, min = 1, max = 10, labels, color = 'amber' }: SliderProps) {
  return (
    <div className="space-y-1">
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer ${colorMap[color]}`}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{value}</span>
        {labels?.[value] && <span className="text-slate-400">{labels[value]}</span>}
      </div>
    </div>
  );
}
