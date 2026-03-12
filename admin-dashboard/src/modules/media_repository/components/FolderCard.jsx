import { Folder } from "lucide-react";

export default function FolderCard({ name, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl 
                 border border-white/40 dark:border-slate-700/40 rounded-2xl p-4 md:p-5 
                 hover:scale-[1.02] hover:shadow-xl 
                 transition duration-200"
    >
      <div className="flex items-center gap-3">
        <Folder className="text-indigo-500 dark:text-indigo-400 shrink-0" size={24} />
        <span className="text-slate-700 dark:text-slate-200 font-medium truncate text-sm md:text-base">
          {name}
        </span>
      </div>
    </div>
  );
}