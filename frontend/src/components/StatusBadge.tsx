type StatusBadgeProps = {
  value: unknown;
};

export default function StatusBadge({ value }: StatusBadgeProps) {
  const status = String(value || "unknown").toLowerCase();

  const colorClasses =
    status === "active"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : status === "idle"
        ? "bg-amber-100 text-amber-900 ring-amber-200"
        : status === "error"
          ? "bg-rose-100 text-rose-800 ring-rose-200"
          : "bg-slate-200 text-slate-700 ring-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colorClasses}`}
    >
      {status}
    </span>
  );
}
