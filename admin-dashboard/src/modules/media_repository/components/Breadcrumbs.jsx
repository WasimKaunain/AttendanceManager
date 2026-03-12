export default function Breadcrumbs({ prefix, onNavigate }) {
  const parts = prefix.split("/").filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <span
        onClick={() => onNavigate("")}
        className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        Root
      </span>

      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join("/") + "/";
        return (
          <span key={path} className="flex items-center gap-1.5">
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span
              onClick={() => onNavigate(path)}
              className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {part}
            </span>
          </span>
        );
      })}
    </div>
  );
}