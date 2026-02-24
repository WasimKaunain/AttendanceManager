import { Plus } from "lucide-react";

export default function PageHeader({title,subtitle,onAdd,addLabel = "New",}) {
  return (
    <div className="flex justify-between items-start mb-8">

      {/* LEFT SECTION */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* RIGHT SECTION BUTTON */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2
                     px-5 py-2.5
                     bg-green-600 text-white
                     rounded-2xl
                     shadow-lg
                     hover:bg-green-700
                     hover:scale-105
                     transition duration-300"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}

    </div>
  );
}
