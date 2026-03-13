import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export default function FilterPanel({ reportType, filters, onChange }) {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => (await api.get("/workers/")).data,
  });

  const handleChange = (key, value) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key, id) => {
    onChange((prev) => {
      const arr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      const idx = arr.indexOf(id);
      if (idx === -1) arr.push(id);
      else arr.splice(idx, 1);
      return { ...prev, [key]: arr };
    });
  };

  // single open selector key so only one dropdown is shown at a time
  const [openSelector, setOpenSelector] = useState(null);

  // clear unrelated selections when reportType changes (only update if something actually changes)
  useEffect(() => {
    onChange((prev) => {
      const next = { ...(prev || {}) };
      if (reportType !== "projects") next.project_ids = [];
      if (!["sites", "attendance_sitewise"].includes(reportType)) next.site_ids = [];
      if (!["workers", "attendance_workerwise"].includes(reportType)) next.worker_ids = [];

      // shallow compare arrays and keys to avoid unnecessary setState
      const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next)]);
      let changed = false;
      for (const k of keys) {
        const a = (prev || {})[k];
        const b = next[k];
        const aStr = Array.isArray(a) ? a.join(",") : a;
        const bStr = Array.isArray(b) ? b.join(",") : b;
        if (aStr !== bStr) {
          changed = true;
          break;
        }
      }

      if (!changed) return prev; // no change -> avoid re-render
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  // Collapsible selector renders panel into a portal to avoid stacking context problems
  function CollapsibleSelector({ keyName, label, items, selectedIds = [], onToggleItem, itemLabel, isOpen, onToggleOpen }) {
    const selectedCount = Array.isArray(selectedIds) ? selectedIds.length : 0;
    const buttonRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    useLayoutEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
      }
    }, [isOpen]);

    return (
      <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
        <button
          ref={buttonRef}
          data-report-toggle
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleOpen(keyName);
          }}
          aria-expanded={!!isOpen}
          className="w-full flex items-center justify-between p-3 border rounded-xl bg-white dark:bg-slate-700 dark:border-slate-600"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
            {selectedCount > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 px-2 py-0.5 rounded-full">{selectedCount}</span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-slate-500 transform transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {isOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              data-report-panel
              onClick={(e) => e.stopPropagation()}
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className="fixed z-50 border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 max-h-56 overflow-y-auto shadow-lg pointer-events-auto"
            >
              <div className="space-y-2">
                {items && items.length > 0 ? (
                  items.map((it) => (
                    <label key={it.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedIds) && selectedIds.includes(it.id)}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onToggleItem(it.id); }}
                        className="form-checkbox h-4 w-4 text-indigo-600"
                      />
                      <span className="text-sm truncate">{itemLabel ? itemLabel(it) : (it.name || it.full_name)}</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No items available</div>
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  // close open selector when clicking outside
  useEffect(() => {
    const handler = (e) => {
      // if click originated inside a report panel or toggle button, ignore
      const target = e.target;
      try {
        if (target.closest('[data-report-panel]') || target.closest('[data-report-toggle]')) return;
      } catch (err) {
        // ignore
      }
      setOpenSelector(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="relative">
      {/* backdrop when any selector is open to block interactions */}
      {openSelector && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpenSelector(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">

        {/* PROJECT REPORT */}
        {reportType === "projects" && (
          <div className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full">
            <div className="text-sm font-medium mb-2">Select Projects</div>
            <CollapsibleSelector
              keyName="projects"
              label="Projects"
              items={projects}
              selectedIds={filters?.project_ids}
              onToggleItem={(id) => handleToggle('project_ids', id)}
              itemLabel={(item) => item.name}
              isOpen={openSelector === 'projects'}
              onToggleOpen={(k) => setOpenSelector((prev) => (prev === k ? null : k))}
            />
          </div>
        )}

        {/* SITE REPORT */}
        {reportType === "sites" && (
          <div className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full">
            <div className="text-sm font-medium mb-2">Select Sites</div>
            <CollapsibleSelector
              keyName="sites"
              label="Sites"
              items={sites}
              selectedIds={filters?.site_ids}
              onToggleItem={(id) => handleToggle('site_ids', id)}
              itemLabel={(item) => item.name}
              isOpen={openSelector === 'sites'}
              onToggleOpen={(k) => setOpenSelector((prev) => (prev === k ? null : k))}
            />
          </div>
        )}

        {/* WORKER REPORT */}
        {reportType === "workers" && (
          <div className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full">
            <div className="text-sm font-medium mb-2">Select Workers</div>
            <CollapsibleSelector
              keyName="workers"
              label="Workers"
              items={workers}
              selectedIds={filters?.worker_ids}
              onToggleItem={(id) => handleToggle('worker_ids', id)}
              itemLabel={(item) => item.full_name}
              isOpen={openSelector === 'workers'}
              onToggleOpen={(k) => setOpenSelector((prev) => (prev === k ? null : k))}
            />
          </div>
        )}

        {/* ATTENDANCE SITEWISE */}
        {reportType === "attendance_sitewise" && (
          <>
            <div className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full">
              <div className="text-sm font-medium mb-2">Select Sites</div>
              <CollapsibleSelector
                keyName="sites_att"
                label="Sites"
                items={sites}
                selectedIds={filters?.site_ids}
                onToggleItem={(id) => handleToggle('site_ids', id)}
                itemLabel={(item) => item.name}
                isOpen={openSelector === 'sites_att'}
                onToggleOpen={(k) => setOpenSelector((prev) => (prev === k ? null : k))}
              />
            </div>

            <input
              type="date"
              value={filters?.from_date || ""}
              onChange={(e) => handleChange("from_date", e.target.value)}
              className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full"
            />

            <input
              type="date"
              value={filters?.to_date || ""}
              min={filters?.from_date || undefined}
              onChange={(e) => handleChange("to_date", e.target.value)}
              className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full"
            />
          </>
        )}

        {/* ATTENDANCE WORKERWISE */}
        {reportType === "attendance_workerwise" && (
          <>
            <div className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full">
              <div className="text-sm font-medium mb-2">Select Workers</div>
              <CollapsibleSelector
                keyName="workers_att"
                label="Workers"
                items={workers}
                selectedIds={filters?.worker_ids}
                onToggleItem={(id) => handleToggle('worker_ids', id)}
                itemLabel={(item) => item.full_name}
                isOpen={openSelector === 'workers_att'}
                onToggleOpen={(k) => setOpenSelector((prev) => (prev === k ? null : k))}
              />
            </div>

            <input
              type="date"
              value={filters?.from_date || ""}
              onChange={(e) => handleChange("from_date", e.target.value)}
              className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full"
            />

            <input
              type="date"
              value={filters?.to_date || ""}
              min={filters?.from_date || undefined}
              onChange={(e) => handleChange("to_date", e.target.value)}
              className="border dark:border-slate-600 p-3 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-full"
            />
          </>
        )}

      </div>
    </div>
  );
}