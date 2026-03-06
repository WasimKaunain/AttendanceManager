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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl
                      w-[750px] h-[550px]
                      flex flex-col">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white 
                     rounded-full p-2 shadow-md 
                     hover:bg-slate-100 z-20"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-semibold truncate">
            {fileName}
          </h3>
        </div>

        {/* Image Area */}
        <div
          className="flex-1 bg-slate-50 overflow-hidden 
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
        <div className="px-6 py-4 border-t flex justify-between items-center">

          {/* Zoom */}
          <div className="flex gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
              className="bg-slate-200 px-3 py-2 rounded-lg hover:bg-slate-300"
            >
              <ZoomOut size={16} />
            </button>

            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
              className="bg-slate-200 px-3 py-2 rounded-lg hover:bg-slate-300"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <a
              href={file.download_url}
              download
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700"
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
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}