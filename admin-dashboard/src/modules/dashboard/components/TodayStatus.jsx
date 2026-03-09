export default function TodayStatus({ data = [] }) {
  return (
    <div className="h-[420px] overflow-y-auto pr-2 custom-scrollbar">

      <h2 className="text-md font-semibold mb-4">
        Today's Status
      </h2>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <p className="text-sm font-medium">No active sites</p>
          <p className="text-xs text-center">Site status will appear once workers are assigned.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((site) => {
            const attendanceRate = site.total_workers > 0
              ? Math.round((site.present / site.total_workers) * 100)
              : 0;

            return (
              <div
                key={site.site_id}
                className="relative p-4 rounded-2xl
                           bg-white/70 backdrop-blur-lg
                           border border-white/40
                           shadow-lg
                           hover:shadow-2xl hover:-translate-y-1
                           transition-all duration-300"
              >
                {/* Subtle gradient glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  {/* Site Name + Total Workers */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">
                      {site.site_name}
                    </h3>
                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      Total Workers: {site.total_workers}
                    </span>
                  </div>

                  {/* Present / Absent */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-slate-600 text-xs">Present</span>
                      </div>
                      <span className="font-bold text-green-600">{site.present}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-slate-600 text-xs">Absent</span>
                      </div>
                      <span className="font-bold text-red-500">{site.absent}</span>
                    </div>
                  </div>

                  {/* Attendance rate progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Attendance rate</span>
                      <span className={`font-semibold ${attendanceRate >= 75 ? "text-green-600" : attendanceRate >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500
                          ${attendanceRate >= 75 ? "bg-green-500" : attendanceRate >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
