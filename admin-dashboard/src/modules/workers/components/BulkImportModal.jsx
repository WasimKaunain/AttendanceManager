import { useState, useEffect } from "react";
import { X, FilePlus } from "lucide-react";
import { bulkValidate, bulkCreate } from "../services";

const MAX_ROWS = 100;

export default function BulkImportModal({ open, onClose, onImported }) {

  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [validateResult, setValidateResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setHeaders([]);
      setValidateResult(null);
      setCreating(false);
      setError(null);
      setParsing(false);
    }
  }, [open]);

  const handleFileChange = async (e) => {

    const f = e.target.files?.[0];
    if (!f) return;

    setParsing(true);
    setError(null);

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

      let parsed = XLSX.utils.sheet_to_json(ws, { defval: "",raw: false });

      parsed = parsed.filter(r =>
        Object.values(r).some(v => String(v).trim() !== "")
      );

      if (parsed.length > MAX_ROWS) {
        throw new Error(`Maximum ${MAX_ROWS} rows allowed`);
      }

      setRows(parsed);
      setHeaders(Object.keys(parsed[0] || {}));

    } catch (err) {

      console.error(err);
      setError(err.message || "Excel parsing failed");

    } finally {

      setParsing(false);

    }
  };

  const handleValidate = async () => {

    if (!rows.length) {
      setError("No rows to validate");
      return;
    }

    setError(null);

    try {

      const res = await bulkValidate(rows);
      setValidateResult(res);

    } catch (err) {

      console.error(err);
      setError(err.message || "Validation failed");

    }
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
    
        const res = await bulkCreate(rowsToCreate);
    
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

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      <div
        className={`relative w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-auto max-h-[90vh] ${
        validateResult ? "max-w-[95vw]" : "max-w-5xl"}`}>

        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Import Workers</h3>

          <button onClick={onClose} className="p-2">
            <X size={18}/>
          </button>
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

                  {rows.slice(0,100).map((row, idx) => {

                    const invalid = invalidMap[idx];

                    return (

                      <tr
                        key={idx}
                        className={invalid ? "bg-red-50" : ""}
                      >

                        {headers.map(col => {

                          const cellError =
                            invalid?.find(e => e.loc?.includes(col));

                          return (

                            <td
                              key={col}
                              className={"p-2 border whitespace-nowrap" +(cellError ? "bg-red-200" : "")}
                              title={cellError?.msg || ""}>
                              {String(row[col] ?? "")}
                            </td>

                          );

                        })}

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

              <button
                onClick={onClose}
                className="px-3 py-1 bg-gray-100 rounded"
              >
                Cancel
              </button>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}