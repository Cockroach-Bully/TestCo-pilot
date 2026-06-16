/**
 * StoragePathSection 组件
 * 职责：存储路径配置区域
 * 模块：components/settings
 */

import { FolderOpen, FolderSearch } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { SectionTitle, cardStyle, Tooltip, getButtonStyle, handleButtonHover, handleButtonLeave } from "./SettingsUI";

interface StoragePathProps {
  kbPath: string;
  kbScanPath: string;
  reportPath: string;
  onKbPathChange: (path: string) => void;
  onKbScanPathChange: (path: string) => void;
  onReportPathChange: (path: string) => void;
  onSaveKbPath: () => void;
  onSaveKbScanPath: () => void;
  onSaveReportPath: () => void;
}

interface PathItem {
  label: string;
  value: string;
  setter: (path: string) => void;
  onSave: () => void;
  tooltip: string;
}

export function StoragePathSection(props: StoragePathProps) {
  const pathItems: PathItem[] = [
    { label: "知识库存储路径", value: props.kbPath, setter: props.onKbPathChange, onSave: props.onSaveKbPath, tooltip: "存储知识库的索引数据和向量分块文件" },
    { label: "知识库扫描目录", value: props.kbScanPath, setter: props.onKbScanPathChange, onSave: props.onSaveKbScanPath, tooltip: "递归扫描此目录下的所有支持格式文件" },
    { label: "分析报告输出路径", value: props.reportPath, setter: props.onReportPathChange, onSave: props.onSaveReportPath, tooltip: "分析报告保存位置" },
  ];

  const handleSelectDir = async (label: string, setter: (path: string) => void, currentPath: string) => {
    try {
      const selected = await open({ directory: true, multiple: false, title: `选择${label}`, defaultPath: currentPath || undefined });
      if (selected) setter(selected as string);
    } catch (err) { console.error(err); }
  };

  return (
    <section>
      <SectionTitle icon={<FolderOpen size={16} style={{ color: "var(--color-accent)" }} />} title="存储路径" />
      <div style={cardStyle} className="space-y-4">
        {pathItems.map(({ label, value, setter, onSave, tooltip }) => (
          <div key={label}>
            <Tooltip text={tooltip}>
              <label className="block text-sm mb-1.5 cursor-help"
                style={{ color: "var(--color-text-secondary)", borderBottom: "1px dashed var(--color-border)", display: "inline-block" }}>
                {label}
              </label>
            </Tooltip>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-[18px] cursor-pointer"
                style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-input)", minHeight: "44px" }}
                onClick={() => handleSelectDir(label, setter, value)}
              >
                <FolderSearch size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                <span className="flex-1 text-sm truncate" style={{ color: value ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  {value || "点击选择目录..."}
                </span>
              </div>
              <button onClick={onSave} style={getButtonStyle("primary")}
                onMouseEnter={(e) => handleButtonHover(e, "primary")} onMouseLeave={(e) => handleButtonLeave(e, "primary")}>保存</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
