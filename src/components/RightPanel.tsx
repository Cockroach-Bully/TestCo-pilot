/**
 * RightPanel 组件
 * 职责：右侧状态面板，显示知识库状态和快捷操作
 * 模块：components
 */

import { useState } from "react";
import { Database, Clock, Zap, ChevronLeft, ChevronRight } from "lucide-react";

export function RightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className="w-10 flex flex-col items-center py-4"
        style={{ background: "var(--color-bg-sidebar)", borderLeft: "1px solid var(--color-border)" }}>
        <button onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 rounded-[12px] flex items-center justify-center"
          style={{ color: "var(--color-text-muted)" }} title="展开面板">
          <ChevronLeft size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-56 flex flex-col overflow-hidden"
      style={{ background: "var(--color-bg-sidebar)", borderLeft: "1px solid var(--color-border)" }}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <span className="text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>状态面板</span>
        <button onClick={() => setIsCollapsed(true)}
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{ color: "var(--color-text-muted)" }}>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* 知识库状态 */}
        <div className="rounded-[14px] p-3" style={{ background: "var(--visual-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-[11px] font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
            <Database size={12} style={{ color: "var(--color-accent)" }} /> 知识库
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-secondary)" }}>文档</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>0</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-secondary)" }}>向量</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>0</span>
            </div>
          </div>
        </div>

        {/* 最近分析 */}
        <div className="rounded-[14px] p-3" style={{ background: "var(--visual-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-[11px] font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
            <Clock size={12} style={{ color: "var(--color-accent)" }} /> 最近分析
          </h3>
          <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>暂无记录</div>
        </div>

        {/* 快捷操作 */}
        <div className="rounded-[14px] p-3" style={{ background: "var(--visual-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-[11px] font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
            <Zap size={12} style={{ color: "var(--color-accent)" }} /> 快捷操作
          </h3>
          <div className="space-y-1">
            {["上传测试报告", "导入知识文档", "截图分析"].map((action) => (
              <button key={action} className="w-full text-left text-xs px-2.5 py-1.5 rounded-[10px]"
                style={{ color: "var(--color-text-secondary)", background: "transparent" }}>
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部版本 */}
      <div className="p-2.5 text-[10px] text-center" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-disabled)" }}>
        TestCo-pilot v0.1.0
      </div>
    </aside>
  );
}
