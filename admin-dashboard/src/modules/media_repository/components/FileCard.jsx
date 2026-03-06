import { FileImage } from "lucide-react";

export default function FileCard({ name, size, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white/60 backdrop-blur-xl 
                 border border-white/40 rounded-2xl p-5 
                 hover:shadow-xl transition"
    >
      <div className="flex flex-col items-center gap-3">

        <div className="bg-indigo-100 p-4 rounded-2xl">
          <FileImage className="text-indigo-600" size={36} />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium truncate w-40">
            {name}
          </p>
          <p className="text-xs text-slate-500">
            {(size / 1024).toFixed(1)} KB
          </p>
        </div>

      </div>
    </div>
  );
}