// src/modules/data-management/DataManagementPage.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import DangerousActionModal from "./components/DangerousActionModal";
import {
  fetchArchived,
  restoreEntity,
  forceDeleteEntity,
} from "./services";

const tabs = ["projects", "sites", "workers"];

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: archived = [], isLoading } = useQuery({
    queryKey: ["archived", activeTab],
    queryFn: () => fetchArchived(activeTab),
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id }) => restoreEntity(activeTab, id),
    onSuccess: () => {
      queryClient.invalidateQueries(["archived", activeTab]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      forceDeleteEntity(activeTab, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["archived", activeTab]);
    },
    onError: (err) => {
      console.error("Force delete failed:", err);
    },
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 min-h-screen space-y-6 md:space-y-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <PageHeader
          title="Data Management"
          subtitle="Archive recovery and permanent deletion control"
        />

        {/* Tabs */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-4 md:gap-6 border-b border-slate-200 dark:border-slate-700 pb-2 whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize pb-1 transition-colors text-sm md:text-base ${
                  activeTab === tab
                    ? "border-b-2 border-black dark:border-white font-medium text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-slate-500 dark:text-slate-400">Loading...</div>
        ) : archived.length === 0 ? (
          <div className="text-slate-400 dark:text-slate-500 py-10 text-center">
            No archived records.
          </div>
        ) : (
          <div className="space-y-2">
            {archived.map((item) => (
              <div
                key={item.id}
                className="glass-row flex flex-wrap sm:flex-nowrap justify-between items-center gap-3"
              >
                <div className="min-w-0">
                  <p className="row-title truncate">
                    {item.name || item.full_name}
                  </p>
                  <p className="row-meta mt-0.5 text-xs">
                    Deleted at: {item.deleted_at}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0 ml-auto">
                  <button
                    onClick={() => restoreMutation.mutate({ id: item.id })}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                  >
                    Restore
                  </button>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setModalOpen(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        <DangerousActionModal
          open={modalOpen}
          entityName={selectedItem?.name || selectedItem?.full_name}
          onClose={() => {
            setModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={async (payload) => {
            try {
              await deleteMutation.mutateAsync({
                id: selectedItem.id,
                payload,
              });
            } catch (err) {
              // error is logged in onError; still close the modal so it doesn't freeze
            }
            setModalOpen(false);
            setSelectedItem(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}