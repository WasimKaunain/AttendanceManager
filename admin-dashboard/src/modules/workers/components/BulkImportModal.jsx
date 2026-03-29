import { useState, useEffect } from "react";
import { X, FilePlus } from "lucide-react";
import { bulkValidate, bulkCreate, getSitesByProject } from "../services";
import { useQuery } from "@tanstack/react-query";
import { useWorkers } from "../hooks";

const MAX_ROWS = 100;

export default function BulkImportModal({ open, onClose, onImported }) {

  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [validateResult, setValidateResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const { projectsQuery } = useWorkers(selectedProject);
  const projects = projectsQuery.data || [];
  const [editableRows, setEditableRows] = useState([]);

  const { data: sites = [] } = useQuery({
  queryKey: ["sites", selectedProject],
  queryFn: () => getSitesByProject(selectedProject),
  enabled: !!selectedProject
  });

  useEffect(() => {
    if (!open) {
      setRows([]);
      setHeaders([]);
      setValidateResult(null);
      setCreating(false);
      setError(null);
      setParsing(false);
      setSelectedProject("");
      setSelectedSite("");
    }
  }, [open]);

  const handleFileChange = async (e) => {
      
      const f = e.target.files?.[0];
      if (!f) return;
      
      setParsing(true);
      setError(null);
      setValidateResult(null);
      
      try {
      
        const name = f.name.toLowerCase();
      
        if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
          throw new Error("Only Excel files supported");
        }
      
        const XLSX = await import("xlsx");
      
        const buffer = await f.arrayBuffer();
        const wb = XLSX.read(buffer);
      
        const ws =
          wb.Sheets["workers"] ||
          wb.Sheets[wb.SheetNames[0]];
      
        if (!ws) throw new Error("Workers sheet not found");
      
        let parsed = XLSX.utils.sheet_to_json(ws, {
          defval: "",
          raw: true
        });
      
        if (!parsed.length) {
          throw new Error("Excel file is empty");
        }
      
        parsed = parsed.map(row => {
        
          let mobile = row.mobile;
          let idNumber = row.id_number;
        
          if (mobile !== undefined && mobile !== null) {
            mobile = String(mobile);
            if (mobile.includes("e") || mobile.includes("E")) {
              mobile = Number(mobile).toFixed(0);
            }
            mobile = mobile.replace(/\.0$/, "").trim();
          }
        
          if (idNumber !== undefined && idNumber !== null) {
            idNumber = String(idNumber);
            if (idNumber.includes("e") || idNumber.includes("E")) {
              idNumber = Number(idNumber).toFixed(0);
            }
            idNumber = idNumber.replace(/\.0$/, "").trim();
          }
        
          return {
            ...row,
            mobile: mobile || "",
            id_number: idNumber || ""
          };
        });
      
        parsed = parsed.filter(r =>
          Object.values(r).some(v => String(v).trim() !== "")
        );
      
        if (parsed.length > MAX_ROWS) {
          throw new Error(`Maximum ${MAX_ROWS} rows allowed`);
        }
      
        setRows(parsed);
        setEditableRows(parsed);   // ✅ FIXED (correct place)
        setHeaders(Object.keys(parsed[0]));
      
      } catch (err) {
      
        console.error(err);
        setError(err.message || "Excel parsing failed");
      
      } finally {
      
        setParsing(false);
      
      }
    };


  const handleValidate = async () => {
    
      if (!editableRows.length) {
        setError("No rows to validate");
        return;
      }
    
      if ((selectedProject && !selectedSite) || (!selectedProject && selectedSite)) {
        setError("Both project and site must be selected together");
        return;
      }
    
      setError(null);
    
      const processedRows = editableRows.map(row => {
      
        if (selectedProject && selectedSite) {
          return {
            ...row,
            project: projects.find(p => p.id == selectedProject)?.name || null,
            site: sites.find(s => s.id == selectedSite)?.name || null
          };
        }
      
        return row;
      });
    
      try {
      
        const res = await bulkValidate({
          rows: processedRows,
          projectId: selectedProject || null,
          siteId: selectedSite || null
        });
      
        setValidateResult(res);
      
      } catch (err) {
      
        console.error(err);
        setError(err.message || "Validation failed");
      
      }
    };

    const handleCellChange = (rowIndex, col, value) => {
        setEditableRows(prev => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            [col]: value
          };
          return updated;
        });
      };

    const handleCreate = async () => {
    
      if (!validateResult) {
        setError("Please Validate first");
        return;
      }
  
      if (!validateResult.valid.length) {
        setError("No valid rows to create");
        return;
      }
  
      setCreating(true);
  
      try {
    
        const rowsToCreate =
          validateResult.valid.map(v => v.data);
    
        const res = await bulkCreate({rows : rowsToCreate, projectId: selectedProject || null, siteId: selectedSite || null});
    
        if (onImported) onImported(res);
        // close modal
        onClose();
    
      } catch (err) {
    
        console.error(err);
        setError(err.message || "Creation failed");
    
      } finally {
    
        setCreating(false);
    
      }
    };

  const invalidMap = {};
  if (validateResult?.invalid) {
    validateResult.invalid.forEach(i => {
      invalidMap[i.index] = i.errors;
    });
  }

  const validSet = new Set();

  if (validateResult?.valid) {
    validateResult.valid.forEach(v => {
      validSet.add(v.index);
    });
  }

  if (!open) return null;
  

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div className="fixed inset-0 bg-black/40" onClick={onClose}/>

      <div
        className={`relative w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-auto max-h-[90vh] ${
        validateResult ? "max-w-[95vw]" : "max-w-5xl"}`}>

        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Import Workers</h3>

          <button onClick={onClose} className="p-2">
            <X size={18}/>
          </button>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Project (optional)</option>
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Site (optional)</option>
            {sites?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
          
        <div className="p-4 space-y-4">

          <div className="flex items-center gap-3">

            <label className="flex items-center gap-2 cursor-pointer">

              <div className="p-2 bg-slate-100 rounded-md">
                <FilePlus size={18}/>
              </div>

              <span className="text-sm">
                Upload Excel (max {MAX_ROWS} rows)
              </span>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

            </label>

            <button
              onClick={handleValidate}
              disabled={parsing || !rows.length}
              className="ml-auto px-3 py-1 bg-blue-600 text-white rounded"
            >
              Validate
            </button>

          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {validateResult && (
              <div className="text-xs text-slate-500">
                ✏️ Edit highlighted cells and click "Validate" again
              </div>
            )}

          {validateResult?.invalid?.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
              <strong>{validateResult.invalid.length} rows have errors.</strong>
              <p>Hover on highlighted cells to see details.</p>
            </div>
          )}

          {rows.length > 0 && (

            <div className="overflow-auto border rounded">

              <table className="w-full text-xs text-auto">

                <thead className="bg-slate-100">

                  <tr>
                    {headers.map(h => (
                      <th key={h} className="p-2 text-left">{h}</th>
                    ))}
                  </tr>

                </thead>

                <tbody>

                  {editableRows.slice(0,100).map((row, idx) => {
                    const displayRow = {
                      ...row,
                      project: selectedProject
                        ? projects.find(p => p.id == selectedProject)?.name || row.project
                        : row.project,

                      site: selectedSite
                        ? sites.find(s => s.id == selectedSite)?.name || row.site
                        : row.site
                    };
                    const invalid = validateResult ? invalidMap[idx] : null;

                    return (

                      <tr key={idx} className={!validateResult ? ""  : invalid ? "bg-red-50" : validSet.has(idx) ? "bg-green-50" : ""}>

                        {headers.map(col => {

                          const cellErrors = invalid?.filter(e => e.field === col) || [];
                          const hasError = cellErrors.length > 0;
                          const isValidRow = validateResult && validSet.has(idx);

                          return (
                            <td
                              key={col}
                              className={
                                "p-2 border whitespace-nowrap relative " +
                                (hasError ? "bg-red-100 text-red-800" : isValidRow ? "bg-green-100 text-green-800" : "") }>
                              <div className="flex items-center gap-1">
                                {hasError ? (
                                    <input
                                      value={displayRow[col] ?? ""}
                                      onChange={(e) =>
                                        handleCellChange(idx, col, e.target.value)
                                      }
                                      className="border px-1 text-xs w-full"
                                    />
                                  ) : (
                                    <span>{String(displayRow[col] ?? "")}</span>
                                  )}
                            
                                {cellErrors.length > 0 && (
                                  <span title={cellErrors.map(e => e.message).join(", ")}>
                                    ⚠️
                                  </span>
                                )}
                                
                              </div>
                            </td>

                          );

                        })}

                        {/* Row level error column */}
                          {invalid?.some(e => !e.field) && (
                            <td className="text-red-600 text-xs">
                              {invalid
                                .filter(e => !e.field)
                                .map(e => e.message)
                                .join(", ")}
                            </td>
                          )}
                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

          {validateResult && (

            <div className="flex items-center gap-4">

              <div className="px-2 py-1 bg-green-100 text-green-800 rounded">
                Valid {validateResult.valid.length}
              </div>

              <div className="px-2 py-1 bg-red-100 text-red-800 rounded">
                Invalid {validateResult.invalid.length}
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || !validateResult.valid.length}
                className="ml-auto px-3 py-1 bg-emerald-600 text-white rounded"
              >
                {creating
                  ? "Creating..."
                  : `Create ${validateResult.valid.length} Workers`}
              </button>
              <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded"> Cancel </button>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}