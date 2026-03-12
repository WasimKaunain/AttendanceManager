import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useRef } from "react";

export default function ImagePreviewModal({ file, onClose, onDelete }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const startRef = useRef({ x: 0, y: 0 });

  if (!file) return null;

  const fileName = file.key.split("/").pop();

  const handleMouseDown = (e) => {
    setDragging(true);
    startRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl
                      w-full sm:w-[750px] h-[85vh] sm:h-[550px]
                      flex flex-col">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white dark:bg-slate-700 
                     rounded-full p-2 shadow-md 
                     hover:bg-slate-100 dark:hover:bg-slate-600 z-20"
        >
          <X size={18} className="dark:text-slate-200" />
        </button>

        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b dark:border-slate-700">
          <h3 className="text-sm font-semibold truncate pr-10 dark:text-slate-100">
            {fileName}
          </h3>
        </div>

        {/* Image Area */}
        <div
          className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-hidden 
                     relative cursor-grab"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={file.download_url}
            alt="Preview"
            onMouseDown={handleMouseDown}
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.2s"
            }}
            className="absolute top-1/2 left-1/2 
                       -translate-x-1/2 -translate-y-1/2
                       select-none max-w-none"
          />
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t dark:border-slate-700 flex justify-between items-center gap-3">

          {/* Zoom */}
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
              className="bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-2.5 md:px-3 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              <ZoomOut size={16} />
            </button>

            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
              className="bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-2.5 md:px-3 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 md:gap-4">
            <a
              href={file.download_url}
              download
              className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm hover:bg-indigo-700"
            >
              Download
            </a>

            <button
              onClick={() => {
                if (confirm("Delete this file?")) {
                  onDelete(file.key);
                  onClose();
                }
              }}
              className="bg-red-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}