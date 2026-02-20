export function Badge({ children, variant = "default" }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    on_hold: "bg-amber-100 text-amber-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-slate-100 text-slate-600",
    default: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-md ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}
