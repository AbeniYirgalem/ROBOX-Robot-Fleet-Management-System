type BatteryBarProps = {
  value: unknown;
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

export default function BatteryBar({ value }: BatteryBarProps) {
  const percentage = toNumber(value);

  if (percentage === null) {
    return <span className="text-sm text-slate-500">n/a</span>;
  }

  const colorClass =
    percentage > 60
      ? "bg-emerald-500"
      : percentage > 25
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="flex min-w-[130px] items-center gap-2">
      <div className="h-2.5 flex-1 rounded-full bg-slate-200">
        <div
          className={`h-2.5 rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}
