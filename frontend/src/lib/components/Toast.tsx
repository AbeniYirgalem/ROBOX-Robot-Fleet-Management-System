type ToastProps = {
  message: string;
  tone?: "success" | "error";
};

export default function Toast({ message, tone = "success" }: ToastProps) {
  const classes =
    tone === "success"
      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
      : "border-rose-400 bg-rose-50 text-rose-900";

  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${classes}`}
    >
      {message}
    </div>
  );
}
