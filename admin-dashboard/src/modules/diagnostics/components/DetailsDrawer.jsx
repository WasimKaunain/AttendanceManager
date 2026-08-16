import { X } from "lucide-react";

export default function DetailsDrawer({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full
                   w-full sm:w-[500px] lg:w-[560px]
                   bg-white dark:bg-slate-900
                   shadow-2xl z-50
                   flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between
                        px-6 py-5
                        border-b border-slate-200
                        dark:border-slate-700">

          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg
                       hover:bg-slate-100
                       dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}

        <div className="flex-1 overflow-y-auto p-6">

          {children}

        </div>

      </div>
    </>
  );
}