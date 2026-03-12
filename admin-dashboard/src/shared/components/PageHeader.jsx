import { Plus } from "lucide-react";

export default function PageHeader({title,subtitle,onAdd,addLabel = "New",}) {
  return (
    <div className="flex justify-between items-start mb-6 md:mb-8 gap-3">

      {/* LEFT SECTION */}
      <div className="min-w-0">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* RIGHT SECTION BUTTON */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2
                     px-4 py-2 md:px-5 md:py-2.5
                     text-sm md:text-base
                     bg-green-600 text-white
                     rounded-2xl
                     shadow-lg
                     hover:bg-green-700
                     hover:scale-105
                     transition duration-300
                     shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{addLabel}</span>
          <span className="sm:hidden">New</span>
        </button>
      )}

    </div>
  );
}
