import { useState } from "react";
import { generateReport } from "./services";

export const useReports = () => {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (payload) => {
    try {
      setLoading(true);

      const blob = await generateReport(payload);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");

      // 🔥 Detect format dynamically
      const extension = payload.format === "pdf" ? "pdf" : "xlsx";

      link.href = url;
      link.setAttribute(
        "download",
        `${payload.report_type}_report.${extension}`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

    } finally {
      setLoading(false);
    }
  };

  return { downloadReport, loading };
};
