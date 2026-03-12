export default function StatCard({ title, value, icon: Icon }) {
  return (
    <div
      className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                 border border-white/40 dark:border-slate-700/40
                 shadow-xl rounded-3xl p-4 md:p-6
                 hover:scale-[1.02] hover:shadow-2xl
                 transition duration-300"
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-tight">{title}</p>
        <Icon className="w-4 h-4 md:w-5 md:h-5 text-slate-500 dark:text-slate-400 shrink-0" />
      </div>

      <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
