/**
 * Reports 页面
 * 职责：分析报告管理界面
 * 模块：pages
 */

import { Upload, FileText, CheckCircle, AlertCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useReports } from "../hooks/useReports";

export function Reports() {
  const { reports, expandedReport, isUploading, handleUpload, handleDelete, toggleExpand } = useReports();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-5 bg-white/80">
        <h1 className="text-base font-medium text-text-primary">分析报告</h1>
        <button onClick={handleUpload} disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-xl text-sm">
          <Upload size={14} /> {isUploading ? "分析中..." : "上传报告"}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <FileText size={40} className="mb-3 opacity-30" />
            <h2 className="text-base font-medium text-text-primary mb-1.5">暂无分析报告</h2>
            <p className="text-sm text-text-secondary mb-4">上传 XML 测试报告或 ZIP 压缩包进行自动分析</p>
            <div className="flex gap-4 text-xs">
              <span className="px-2 py-1 bg-bg-secondary rounded">XML 报告</span>
              <span className="px-2 py-1 bg-bg-secondary rounded">ZIP 压缩包</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary" onClick={() => toggleExpand(report.id)}>
                  <div className="flex items-center gap-4">
                    {report.failed > 0 ? <AlertCircle size={20} className="text-error" /> : <CheckCircle size={20} className="text-success" />}
                    <div>
                      <h3 className="text-sm font-medium text-text-primary">{report.name}</h3>
                      <p className="text-xs text-text-secondary">{new Date(report.analyzed_at * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-xs">
                      <span className="text-success">通过: {report.passed}</span>
                      <span className="text-error">失败: {report.failed}</span>
                      <span className="text-text-secondary">跳过: {report.skipped}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }} className="text-text-secondary hover:text-error"><Trash2 size={16} /></button>
                    {expandedReport === report.id ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
                  </div>
                </div>
                {expandedReport === report.id && report.fail_cases.length > 0 && (
                  <div className="border-t border-border p-4">
                    <h4 className="text-sm font-medium text-text-primary mb-3">失败用例详情</h4>
                    <div className="space-y-3">
                      {report.fail_cases.map((fc) => (
                        <div key={fc.id} className="bg-bg-primary rounded-md p-3 border border-error/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-error">{fc.name}</span>
                            {fc.test_id && <span className="text-xs text-text-secondary">ID: {fc.test_id}</span>}
                          </div>
                          {fc.request && <div className="mb-2"><span className="text-xs text-text-secondary">请求:</span><p className="text-xs font-mono bg-bg-secondary p-1 rounded mt-1">{fc.request}</p></div>}
                          {fc.expected_response && <div className="mb-2"><span className="text-xs text-success">期望:</span><p className="text-xs font-mono bg-bg-secondary p-1 rounded mt-1">{fc.expected_response}</p></div>}
                          {fc.actual_response && <div className="mb-2"><span className="text-xs text-error">实际:</span><p className="text-xs font-mono bg-bg-secondary p-1 rounded mt-1">{fc.actual_response}</p></div>}
                          {fc.error_message && <div><span className="text-xs text-warning">错误:</span><p className="text-xs bg-bg-secondary p-1 rounded mt-1">{fc.error_message}</p></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
