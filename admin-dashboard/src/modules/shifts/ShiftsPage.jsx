import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/Card";
import DataTable from "@/shared/components/DataTable";

import { useShifts } from "./hooks";
import ShiftFormDialog from "./components/ShiftFormDialog";

import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export default function ShiftsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const {
    shiftsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useShifts();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () =>
      (await api.get("/projects/")).data,
  });

  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.name])
  );

  const columns = [
    { key: "name", label: "Shift" },
    {
      key: "start_time",
      label: "Start",
    },
    {
      key: "end_time",
      label: "End",
    },
    {
      key: "grace_period_minutes",
      label: "Grace (min)",
    },
    {
      key: "overtime_threshold_hours",
      label: "OT After (hrs)",
    },
    {
      key: "project_id",
      label: "Project",
      render: (r) =>
        projectMap[r.project_id] || "—",
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              setEditing(r);
              setDialogOpen(true);
            }}
          >
            <Pencil className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={() => {
              if (confirm("Delete this shift?")) {
                deleteMutation.mutate(r.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Shifts"
        subtitle="Manage shifts, grace periods and overtime"
        onAdd={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        addLabel="New Shift"
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={shiftsQuery.data || []}
            isLoading={shiftsQuery.isLoading}
          />
        </CardContent>
      </Card>

      <ShiftFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projects={projects}
        initialData={editing}
        isSubmitting={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onSubmit={(data) => {
          if (editing) {
            updateMutation.mutate({
              id: editing.id,
              data,
            });
          } else {
            createMutation.mutate(data);
          }
          setDialogOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
