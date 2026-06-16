/**
 * LocalModelSection 组件
 * 职责：本地模型配置区域
 * 模块：components/settings
 */

import { Cpu, CheckCircle, Upload, Power, Trash2, FolderSearch, HardDrive } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { SectionTitle, cardStyle, getButtonStyle, handleButtonHover, handleButtonLeave } from "./SettingsUI";
import type { LocalModelStatus } from "../../types";

interface LocalModelProps {
  localModelPath: string;
  localModelStatus: LocalModelStatus;
  modelLoadStatus: "idle" | "loading" | "loaded" | "error";
  onPathChange: (path: string) => void;
  onSavePath: () => void;
  onLoad: () => void;
  onUnload: () => void;
}

export function LocalModelSection(props: LocalModelProps) {
  const handleSelectFile = async () => {
    try {
      const selected = await open({
        directory: false, multiple: false, title: "选择 GGUF 模型文件",
        filters: [{ name: "GGUF 模型", extensions: ["gguf"] }],
        defaultPath: props.localModelPath ? props.localModelPath.substring(0, props.localModelPath.lastIndexOf("\\")) : undefined,
      });
      if (selected) props.onPathChange(selected as string);
    } catch (err) { console.error(err); }
  };

  return (
    <section>
      <SectionTitle icon={<Cpu size={16} style={{ color: "var(--color-accent)" }} />} title="本地模型" />
      <div style={cardStyle} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>GGUF 模型文件</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-[18px] cursor-pointer"
              style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-input)", minHeight: "44px" }}
              onClick={handleSelectFile}
            >
              <FolderSearch size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              <span className="flex-1 text-sm truncate" style={{ color: props.localModelPath ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                {props.localModelPath || "点击选择 GGUF 模型文件..."}
              </span>
            </div>
            <button onClick={props.onSavePath} style={getButtonStyle("secondary")}
              onMouseEnter={(e) => handleButtonHover(e)} onMouseLeave={(e) => handleButtonLeave(e)}>保存路径</button>
            <button onClick={props.onLoad} disabled={!props.localModelPath || props.modelLoadStatus === "loading"}
              style={{ ...getButtonStyle(props.modelLoadStatus === "loaded" ? "primary" : "secondary"), opacity: !props.localModelPath || props.modelLoadStatus === "loading" ? 0.6 : 1 }}
              onMouseEnter={(e) => handleButtonHover(e)} onMouseLeave={(e) => handleButtonLeave(e)}>
              {props.modelLoadStatus === "loading" ? <><Power size={14} className="animate-spin" /> 加载中</>
                : props.modelLoadStatus === "loaded" ? <><CheckCircle size={14} /> 已加载</>
                : <><Upload size={14} /> 加载模型</>}
            </button>
          </div>
        </div>
        {props.localModelStatus.is_loaded && (
          <div className="flex items-center justify-between p-3 rounded-[18px]"
            style={{ background: "rgba(76, 175, 80, 0.06)", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
            <div className="flex items-center gap-2">
              <HardDrive size={16} style={{ color: "var(--color-success)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                {props.localModelStatus.path?.split(/[/\\]/).pop()}
              </p>
            </div>
            <button onClick={props.onUnload} style={getButtonStyle("danger")}
              onMouseEnter={(e) => handleButtonHover(e, "danger")} onMouseLeave={(e) => handleButtonLeave(e, "danger")}>
              <Trash2 size={12} /> 卸载
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {["Qwen2.5", "DeepSeek", "LLaMA 3", "Mistral", "Phi-3"].map((name) => (
            <span key={name} className="px-3 py-1 text-xs rounded-full"
              style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
