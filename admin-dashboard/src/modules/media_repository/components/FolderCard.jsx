import { Folder } from "lucide-react";

export default function FolderCard({ name, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white/60 backdrop-blur-xl 
                 border border-white/40 rounded-2xl p-5 
                 hover:scale-[1.02] hover:shadow-xl 
                 transition duration-200"
    >
      <div className="flex items-center gap-3">
        <Folder className="text-indigo-500" size={28} />
        <span className="text-slate-700 font-medium truncate">
          {name}
        </span>
      </div>
    </div>
  );
}