import { useState, useMemo } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import FolderCard from "./components/FolderCard";
import FileCard from "./components/FileCard";
import Breadcrumbs from "./components/Breadcrumbs";
import ImagePreviewModal from "./components/ImagePreviewModal";
import { useMedia } from "./hooks";
import { deleteMedia } from "./services";
import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";
import { Search, ChevronDown, X } from "lucide-react";

export default function MediaRepositoryPage() {
  const [prefix, setPrefix] = useState("");
  const [search, setSearch] = useState("");          // actual search sent to API (worker ID)
  const [workerSearch, setWorkerSearch] = useState(""); // dropdown filter input
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data, loading, loadMore, reload } = useMedia(prefix, search);

  // Fetch all workers for the dropdown
  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => (await api.get("/workers/")).data,
  });

  // Filter dropdown workers by typed name
  const filteredWorkers = useMemo(() => {
    if (!workerSearch.trim()) return workers;
    return workers.filter((w) =>
      w.full_name.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.id.toLowerCase().includes(workerSearch.toLowerCase())
    );
  }, [workers, workerSearch]);

  // Find selected worker label
  const selectedWorker = workers.find((w) => w.id === search);

  const handleSelectWorker = (worker) => {
    setSearch(worker.id);       // send worker ID as search filter to backend
    setWorkerSearch("");
    setDropdownOpen(false);
  };

  const handleClearWorker = () => {
    setSearch("");
    setWorkerSearch("");
    setDropdownOpen(false);
  };

  const handleFolderClick = (folderPrefix) => {
    setPrefix(folderPrefix);
    setSearch("");              // clear search when navigating into folder
  };

  return (
    <DashboardLayout theme="administration">
      <div className="p-6 space-y-5">

        <PageHeader
          title="Media Repository"
          subtitle="Browse attendance images and worker assets"
        />

        <ImagePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={async (key) => {
            await deleteMedia(key);
            setSelectedFile(null);
            reload();
          }}
        />

        {/* TOOLBAR */}
        <div className="flex items-center gap-4 flex-wrap">
          <Breadcrumbs prefix={prefix} onNavigate={(p) => { setPrefix(p); setSearch(""); }} />

          {/* Worker dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm shadow-sm hover:border-indigo-400 transition min-w-[220px]"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className={`flex-1 text-left truncate ${selectedWorker ? "text-slate-800" : "text-slate-400"}`}>
                {selectedWorker ? `${selectedWorker.full_name} (${selectedWorker.id})` : "Filter by Worker…"}
              </span>
              {selectedWorker ? (
                <X
                  className="w-4 h-4 text-slate-400 hover:text-red-500 transition"
                  onClick={(e) => { e.stopPropagation(); handleClearWorker(); }}
                />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Search inside dropdown */}
                <div className="p-2 border-b">
                  <input
                    autoFocus
                    placeholder="Search by name or ID…"
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                  {filteredWorkers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No workers found</p>
                  ) : (
                    filteredWorkers.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => handleSelectWorker(w)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm"
                      >
                        <span className="font-medium text-slate-700">{w.full_name}</span>
                        <span className="text-xs text-slate-400 font-mono">{w.id}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-slate-500 text-sm py-8 text-center">Loading…</div>
        ) : (
          <div className="space-y-6">

            {/* FOLDERS */}
            {data.folders.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">
                  Folders ({data.folders.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {data.folders.map((folder) => {
                    const name = folder.split("/").filter(Boolean).pop();
                    return (
                      <FolderCard
                        key={folder}
                        name={name}
                        onClick={() => handleFolderClick(folder)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* FILES */}
            {data.files.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">
                  Files ({data.files.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  {data.files.map((file) => {
                    const name = file.key.split("/").pop();
                    return (
                      <FileCard
                        key={file.key}
                        name={name}
                        size={file.size}
                        onClick={() => setSelectedFile(file)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {data.folders.length === 0 && data.files.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <p className="text-sm font-medium">No files or folders found</p>
                <p className="text-xs">
                  {prefix ? "This folder is empty." : "No media has been uploaded yet."}
                </p>
              </div>
            )}

            {/* LOAD MORE */}
            {data.next_token && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  className="bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm hover:bg-indigo-600 transition"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
