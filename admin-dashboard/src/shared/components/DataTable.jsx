export default function DataTable({ columns, data, isLoading, onRowClick }) {
  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading...</div>;
  }

  if (!data.length) {
    return <div className="p-6 text-sm text-slate-400 dark:text-slate-500">No data found.</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-600">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowClick && onRowClick(row)}
            className={`border-b border-slate-100 dark:border-slate-700 transition ${
              onRowClick ? "hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer" : ""
            }`}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className="px-4 py-3 text-slate-700 dark:text-slate-200"
                onClick={(e) => {
                  if (col.key === "actions") e.stopPropagation();
                }}
              >
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
