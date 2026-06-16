/**
 * AboutSection 组件
 * 职责：关于页面和检查更新
 * 模块：components/settings
 */

import { useState } from "react";
import { Info, RefreshCw, ExternalLink } from "lucide-react";
import { APP_NAME, APP_VERSION } from "../../constants";
import { SectionTitle, cardStyle, getButtonStyle, handleButtonHover, handleButtonLeave } from "./SettingsUI";

export function AboutSection() {
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "up-to-date" | "error">("idle");
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    try {
      const response = await fetch("https://api.github.com/repos/user/testco-pilot/releases/latest");
      if (!response.ok) { setUpdateStatus("up-to-date"); return; }
      const data = await response.json();
      const latestVersion = data.tag_name?.replace("v", "") || "";
      if (latestVersion !== APP_VERSION) {
        setUpdateStatus("available");
        setUpdateInfo({ version: latestVersion, url: data.html_url });
      } else {
        setUpdateStatus("up-to-date");
      }
    } catch { setUpdateStatus("error"); }
  };

  return (
    <section>
      <SectionTitle icon={<Info size={16} style={{ color: "var(--color-accent)" }} />} title="关于" />
      <div style={cardStyle} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span style={{ color: "var(--color-text-secondary)" }}>应用名称</span><p style={{ color: "var(--color-text-primary)" }}>{APP_NAME}</p></div>
          <div><span style={{ color: "var(--color-text-secondary)" }}>版本号</span><p style={{ color: "var(--color-text-primary)" }}>v{APP_VERSION}</p></div>
          <div><span style={{ color: "var(--color-text-secondary)" }}>AI 引擎</span><p style={{ color: "var(--color-text-primary)" }}>多模型支持 + 本地 GGUF</p></div>
          <div><span style={{ color: "var(--color-text-secondary)" }}>技术栈</span><p style={{ color: "var(--color-text-primary)" }}>Tauri 2.0 + React + TypeScript</p></div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleCheckUpdate} disabled={updateStatus === "checking"}
            style={getButtonStyle("secondary")}
            onMouseEnter={(e) => handleButtonHover(e)} onMouseLeave={(e) => handleButtonLeave(e)}>
            <RefreshCw size={14} className={updateStatus === "checking" ? "animate-spin" : ""} />
            {updateStatus === "checking" ? "检查中..." : "检查更新"}
          </button>
          {updateStatus === "up-to-date" && <span className="text-xs" style={{ color: "var(--color-success)" }}>已是最新版本</span>}
          {updateStatus === "error" && <span className="text-xs" style={{ color: "var(--color-error)" }}>检查失败</span>}
        </div>

        {updateStatus === "available" && updateInfo && (
          <div className="p-4 rounded-[16px]" style={{ background: "rgba(255, 106, 0, 0.08)", border: "1px solid rgba(255, 106, 0, 0.2)" }}>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>发现新版本 v{updateInfo.version}</p>
            <div className="flex gap-2">
              <a href={updateInfo.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm"
                style={{ background: "var(--color-accent)", color: "#fff" }}>
                <ExternalLink size={14} /> 前往下载
              </a>
              <button onClick={() => setUpdateStatus("idle")} style={getButtonStyle("secondary")}
                onMouseEnter={(e) => handleButtonHover(e)} onMouseLeave={(e) => handleButtonLeave(e)}>稍后再说</button>
            </div>
          </div>
        )}

        <div className="pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>致谢与声明</h3>
          <div className="space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <div className="p-3 rounded-[14px]" style={{ background: "var(--color-bg-tertiary)" }}>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>UI 设计参考</p>
              <p className="mt-1">参考了 <a href="https://github.com/nicepkg" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>MiModex</a> 项目的暖色奶油风设计风格。</p>
            </div>
            <div className="p-3 rounded-[14px]" style={{ background: "var(--color-bg-tertiary)" }}>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>本地推理</p>
              <p className="mt-1">基于 <a href="https://github.com/ggerganov/llama.cpp" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>llama.cpp</a> 项目。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
