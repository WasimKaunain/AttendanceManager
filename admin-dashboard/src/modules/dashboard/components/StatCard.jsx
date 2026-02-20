export default function StatCard({ title, value, icon: Icon }) {
  return (
    <div
      className="backdrop-blur-xl bg-white/60
                 border border-white/40
                 shadow-xl rounded-3xl p-6
                 hover:scale-[1.02] hover:shadow-2xl
                 transition duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{title}</p>
        <Icon className="w-5 h-5 text-slate-500" />
      </div>

      <p className="text-3xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}
