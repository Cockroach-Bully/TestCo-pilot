/**
 * useReports Hook
 * 职责：分析报告页面的业务逻辑
 * 模块：hooks
 */

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TestReport } from "../types";

export function useReports() {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try { setReports(await invoke<TestReport[]>("get_analysis_reports")); } catch (err) { console.error(err); }
  };

  const handleUpload = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file"; input.accept = ".xml,.zip"; input.multiple = true;
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) return;
        setIsUploading(true);
        for (const file of Array.from(files)) {
          const filePath = (file as any).path || file.name;
          try {
            if (file.name.endsWith(".zip")) {
              const extracted = await invoke<string[]>("extract_zip_file", { zipPath: filePath });
              for (const f of extracted) { if (f.endsWith(".xml")) await invoke("analyze_xml_report", { filePath: f }); }
            } else { await invoke("analyze_xml_report", { filePath }); }
          } catch (err) { console.error(err); }
        }
        setIsUploading(false);
        await loadReports();
      };
      input.click();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (reportId: string) => {
    try { await invoke("delete_analysis_report", { reportId }); await loadReports(); } catch (err) { console.error(err); }
  };

  const toggleExpand = (reportId: string) => setExpandedReport(expandedReport === reportId ? null : reportId);

  return { reports, expandedReport, isUploading, handleUpload, handleDelete, toggleExpand };
}
