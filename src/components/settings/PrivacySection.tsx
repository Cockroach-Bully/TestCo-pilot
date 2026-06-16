/**
 * PrivacySection 组件
 * 职责：隐私与数据管理区域
 * 模块：components/settings
 */

import { Shield, Trash2, AlertTriangle } from "lucide-react";
import { SectionTitle, cardStyle, getButtonStyle, handleButtonHover, handleButtonLeave } from "./SettingsUI";

interface PrivacyProps {
  showClearConfirm: string | null;
  onSetClearConfirm: (type: string | null) => void;
  onClearData: (type: string) => void;
}

export function PrivacySection(props: PrivacyProps) {
  const clearButtons = [
    { type: "conversations", label: "清除对话记录" },
    { type: "knowledge", label: "清除知识库" },
    { type: "reports", label: "清除分析报告" },
    { type: "all", label: "清除全部数据" },
  ];

  const getConfirmText = (type: string) => {
    const map: Record<string, string> = { conversations: "对话记录", knowledge: "知识库", reports: "分析报告", all: "所有数据" };
    return map[type] || "数据";
  };

  return (
    <section>
      <SectionTitle icon={<Shield size={16} style={{ color: "var(--color-accent)" }} />} title="隐私与数据" />
      <div style={cardStyle}>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
          所有数据存储在本地，不会上传到云端。本地模型推理完全在本机运行。
        </p>
        {props.showClearConfirm && (
          <div className="mb-4 p-4 rounded-[18px]"
            style={{ background: "rgba(255, 152, 0, 0.06)", border: "1px solid rgba(255, 152, 0, 0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} style={{ color: "var(--color-warning)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>确认清除</span>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
              此操作不可撤销，确定要清除{getConfirmText(props.showClearConfirm)}吗？
            </p>
            <div className="flex gap-2">
              <button onClick={() => props.onClearData(props.showClearConfirm!)} style={getButtonStyle("danger")}
                onMouseEnter={(e) => handleButtonHover(e, "danger")} onMouseLeave={(e) => handleButtonLeave(e, "danger")}>确认清除</button>
              <button onClick={() => props.onSetClearConfirm(null)} style={getButtonStyle("secondary")}
                onMouseEnter={(e) => handleButtonHover(e)} onMouseLeave={(e) => handleButtonLeave(e)}>取消</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {clearButtons.map(({ type, label }) => (
            <button key={type} onClick={() => props.onSetClearConfirm(type)} style={getButtonStyle("danger")}
              onMouseEnter={(e) => handleButtonHover(e, "danger")} onMouseLeave={(e) => handleButtonLeave(e, "danger")}>
              <Trash2 size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
