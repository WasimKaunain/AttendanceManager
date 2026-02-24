import Sidebar from "./Sidebar";
import { pageThemes } from "@/core/theme/theme";
import { useTheme } from "@/core/theme/ThemeContext";

export default function DashboardLayout({ children, theme = "operational" }) {
  const { mode } = useTheme();
  const backgroundClass = pageThemes[theme][mode];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 p-6 transition-all duration-500 ${backgroundClass}`}
      >
        {children}
      </div>
    </div>
  );
}