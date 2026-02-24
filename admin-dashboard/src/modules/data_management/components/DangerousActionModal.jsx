// src/modules/data-management/components/DangerousActionModal.jsx

import { useState } from "react";

export default function DangerousActionModal({
  open,
  onClose,
  entityName,
  onConfirm,
}) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  const isValid =
    confirmation === entityName && reason.trim().length >= 5;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 w-[420px] shadow-2xl border border-red-400/40">

        <h2 className="text-lg font-bold text-red-600 mb-4">
          Permanent Delete
        </h2>

        <p className="text-sm text-slate-600 mb-3">
          This action cannot be undone.
        </p>

        <p className="text-sm mb-2">
          Type <span className="font-bold">{entityName}</span> to confirm:
        </p>

        <input
          className="w-full border rounded p-2 mb-3"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />

        <textarea
          placeholder="Reason for deletion..."
          className="w-full border rounded p-2 mb-4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-slate-600">
            Cancel
          </button>

          <button
            disabled={!isValid}
            onClick={() => onConfirm({ reason, confirmation })}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}