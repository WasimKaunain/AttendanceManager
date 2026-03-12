import { FileImage } from "lucide-react";

export default function FileCard({ name, size, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl 
                 border border-white/40 dark:border-slate-700/40 rounded-2xl p-3 md:p-5 
                 hover:shadow-xl transition"
    >
      <div className="flex flex-col items-center gap-2 md:gap-3">

        <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 md:p-4 rounded-2xl">
          <FileImage className="text-indigo-600 dark:text-indigo-400" size={28} />
        </div>

        <div className="text-center w-full">
          <p className="text-xs md:text-sm font-medium truncate w-full">
            {name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {(size / 1024).toFixed(1)} KB
          </p>
        </div>

      </div>
    </div>
  );
}