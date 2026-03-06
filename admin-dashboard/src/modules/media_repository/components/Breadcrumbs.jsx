export default function Breadcrumbs({ prefix, onNavigate }) {
  const parts = prefix.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span
        onClick={() => onNavigate("")}
        className="cursor-pointer hover:text-indigo-600"
      >
        Root
      </span>

      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join("/") + "/";
        return (
          <span key={path}>
            /{" "}
            <span
              onClick={() => onNavigate(path)}
              className="cursor-pointer hover:text-indigo-600"
            >
              {part}
            </span>
          </span>
        );
      })}
    </div>
  );
}