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
      setModalOpen(false);
    },
  });

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 space-y-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <PageHeader
          title="Data Management"
          subtitle="Archive recovery and permanent deletion control"
        />

        {/* Tabs */}
        <div className="flex gap-6 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize pb-1 ${
                activeTab === tab
                  ? "border-b-2 border-black font-medium"
                  : "text-slate-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div>Loading...</div>
        ) : archived.length === 0 ? (
          <div className="text-slate-400 py-10 text-center">
            No archived records.
          </div>
        ) : (
          <div className="space-y-4">
            {archived.map((item) => (
              <div
                key={item.id}
                className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl rounded-3xl p-6 flex justify-between items-center"
              >
                <div>
                  <h2 className="font-semibold text-lg">
                    {item.name || item.full_name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Deleted at: {item.deleted_at}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => restoreMutation.mutate({ id: item.id })}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Restore
                  </button>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setModalOpen(true);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded"
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
          onClose={() => setModalOpen(false)}
          onConfirm={(payload) =>
            deleteMutation.mutate({
              id: selectedItem.id,
              payload,
            })
          }
        />
      </div>
    </DashboardLayout>
  );
}