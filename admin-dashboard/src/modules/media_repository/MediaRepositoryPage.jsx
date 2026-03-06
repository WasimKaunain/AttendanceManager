import { useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import FolderCard from "./components/FolderCard";
import FileCard from "./components/FileCard";
import Breadcrumbs from "./components/Breadcrumbs";
import ImagePreviewModal from "./components/ImagePreviewModal"
import { useMedia } from "./hooks";
import { deleteMedia } from "./services";   

export default function MediaRepositoryPage() {
  const [prefix, setPrefix] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { data, loading, loadMore } = useMedia(prefix,search);

  const handleFolderClick = (folderPrefix) => {
    setPrefix(folderPrefix);
  };

  return (
    <DashboardLayout theme="administration">
      <div className="p-8 min-h-screen space-y-6">

        <PageHeader
          title="Media Repository"
          subtitle="Browse attendance images and worker assets"
        />

        <Breadcrumbs
          prefix={prefix}
          onNavigate={setPrefix}
        />

        <ImagePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={async (key) => {
            await deleteMedia(key);
            setSelectedFile(null);
            setPrefix(prefix); // triggers reload via hook
          }}
        />

        <input
          type="text"
          placeholder="Search by Worker ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-xl px-4 py-2 w-72"
        />

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
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

                <ImagePreviewModal
                  file={selectedFile}
                  onClose={() => setSelectedFile(null)}
                  onDelete={async (key) => {
                    await deleteMedia(key);
                    setSelectedFile(null);
                  }}
                />
            </div>
          
            {data.next_token && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  className="bg-indigo-500 text-white px-6 py-2 rounded-xl"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
    </div>
    </DashboardLayout>
  );
}