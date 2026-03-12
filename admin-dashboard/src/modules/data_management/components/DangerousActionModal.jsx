// src/modules/data-management/components/DangerousActionModal.jsx

import { useState, useEffect } from "react";

export default function DangerousActionModal({
  open,
  onClose,
  entityName,
  onConfirm,
}) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset fields every time the modal opens
  useEffect(() => {
    if (open) {
      setConfirmation("");
      setReason("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const isValid = confirmation === entityName && reason.trim().length >= 5;

  const handleConfirm = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await onConfirm({ reason, confirmation });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 w-full sm:w-[420px] shadow-2xl border border-red-400/40 dark:border-red-500/30">

        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
          Permanent Delete
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          This action cannot be undone.
        </p>

        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          Type <span className="font-bold">{entityName}</span> to confirm:
        </p>

        <input
          className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          disabled={loading}
        />

        <textarea
          placeholder="Reason for deletion..."
          className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-2.5 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            disabled={!isValid || loading}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete Permanently"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}