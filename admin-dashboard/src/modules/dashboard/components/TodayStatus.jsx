export default function TodayStatus({ data = [] }) {
  return (
    <div className="h-[420px] overflow-y-auto pr-2 custom-scrollbar">

      <h2 className="text-md font-semibold mb-4">
        Today's Status
      </h2>

      <div className="space-y-4">

        {data.map((site) => (
          <div
            key={site.site_id}
            className="relative p-5 rounded-2xl
                       bg-white/70 backdrop-blur-lg
                       border border-white/40
                       shadow-lg
                       hover:shadow-2xl hover:-translate-y-1
                       transition-all duration-300"
          >

            {/* Subtle 3D Gradient Glow */}
            <div className="absolute inset-0 rounded-2xl
                            bg-gradient-to-br
                            from-white/40 to-transparent
                            pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">

              {/* Site Name */}
              <h3 className="font-semibold text-slate-800 mb-3">
                {site.site_name}
              </h3>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">

                {/* Present */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-slate-600">Present</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {site.present}
                  </span>
                </div>

                {/* Absent */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-slate-600">Absent</span>
                  </div>
                  <span className="font-bold text-red-500">
                    {site.absent}
                  </span>
                </div>

                {/* Late */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-slate-600">Late</span>
                  </div>
                  <span className="font-bold text-yellow-600">
                    {site.late}
                  </span>
                </div>

                {/* Leave */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600">On Leave</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {site.leave}
                  </span>
                </div>

              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}