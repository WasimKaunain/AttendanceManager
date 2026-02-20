export default function DataTable({ columns, data, isLoading, onRowClick }) {
  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  if (!data.length) {
    return <div className="p-6 text-sm text-slate-400">No data found.</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="text-left px-4 py-3 font-medium text-slate-600">
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
            className={`border-b border-slate-100 transition ${
              onRowClick ? "hover:bg-slate-50 cursor-pointer" : ""
            }`}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className="px-4 py-3"
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
