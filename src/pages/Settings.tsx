/**
 * Settings 页面
 * 职责：应用设置主页面，组合各设置子组件
 * 模块：pages
 */

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CheckCircle } from "lucide-react";
import type { ModelConfig, LocalModelStatus } from "../types";
import { DEFAULTS } from "../constants";
import { MODEL_PROVIDERS } from "../constants/models";
import { ApiConfigSection } from "../components/settings/ApiConfigSection";
import { LocalModelSection } from "../components/settings/LocalModelSection";
import { StoragePathSection } from "../components/settings/StoragePathSection";
import { FontSection } from "../components/settings/FontSection";
import { PrivacySection } from "../components/settings/PrivacySection";
import { AboutSection } from "../components/settings/AboutSection";
import { GithubSection } from "../components/settings/GithubSection";

export function Settings() {
  const [selectedProvider, setSelectedProvider] = useState("mimo");
  const [apiKey, setApiKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULTS.API_BASE_URL);
  const [model, setModel] = useState<string>(DEFAULTS.MODEL);
  const [customProviderName, setCustomProviderName] = useState("");
  const [customModelName, setCustomModelName] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [localModelPath, setLocalModelPath] = useState("");
  const [localModelStatus, setLocalModelStatus] = useState<LocalModelStatus>({ is_loaded: false, path: null, use_local: false });
  const [modelLoadStatus, setModelLoadStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<string>(DEFAULTS.FONT_FAMILY);
  const [fontSize, setFontSize] = useState<string>(DEFAULTS.FONT_SIZE);
  const [kbPath, setKbPath] = useState("");
  const [kbScanPath, setKbScanPath] = useState("");
  const [reportPath, setReportPath] = useState("");
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem("testco-pilot-repo-url") || "");

  useEffect(() => {
    loadConfig(); loadLocalModelStatus(); loadStoragePaths(); loadFontSettings();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await invoke<ModelConfig>("get_api_config");
      setApiKey(config.api_key); setApiBaseUrl(config.api_base_url); setModel(config.model);
      if (config.local_model_path) setLocalModelPath(config.local_model_path);
      const provider = MODEL_PROVIDERS.find(p => p.baseUrl === config.api_base_url);
      if (provider) setSelectedProvider(provider.id); else setSelectedProvider("custom");
    } catch (err) { console.error(err); }
  };

  const loadLocalModelStatus = async () => {
    try {
      const status = await invoke<LocalModelStatus>("get_local_model_status");
      setLocalModelStatus(status);
      if (status.is_loaded) setModelLoadStatus("loaded");
      if (status.path) setLocalModelPath(status.path);
    } catch (err) { console.error(err); }
  };

  const loadStoragePaths = async () => {
    try {
      setKbPath(await invoke<string>("get_kb_storage_path"));
      setKbScanPath(await invoke<string>("get_kb_scan_path"));
      setReportPath(await invoke<string>("get_report_storage_path"));
    } catch (err) { console.error(err); }
  };

  const loadFontSettings = () => {
    const savedFont = localStorage.getItem("testco-pilot-font-family");
    const savedSize = localStorage.getItem("testco-pilot-font-size");
    if (savedFont) setFontFamily(savedFont);
    if (savedSize) setFontSize(savedSize);
  };

  const showSaveMessage = (msg: string) => { setSaveMessage(msg); setTimeout(() => setSaveMessage(""), 2000); };

  const handleSaveConfig = async () => {
    try { await invoke("set_api_config", { apiKey, apiBaseUrl, model }); showSaveMessage("API 配置已保存"); } catch (err) { console.error(err); }
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    try { await handleSaveConfig(); const success = await invoke<boolean>("test_api_connection"); setTestStatus(success ? "success" : "error"); } catch { setTestStatus("error"); }
  };

  const handleLoadLocalModel = async () => {
    if (!localModelPath) return;
    setModelLoadStatus("loading");
    try { await invoke("load_local_model", { path: localModelPath }); await loadLocalModelStatus(); setModelLoadStatus("loaded"); } catch { setModelLoadStatus("error"); }
  };

  const handleUnloadLocalModel = async () => {
    try { await invoke("unload_local_model"); await loadLocalModelStatus(); setModelLoadStatus("idle"); } catch (err) { console.error(err); }
  };

  const handleSaveLocalModelPath = async () => {
    try { await invoke("set_local_model_config", { useLocal: false, modelPath: localModelPath }); showSaveMessage("本地模型路径已保存"); } catch (err) { console.error(err); }
  };

  const handleSaveKbPath = async () => { try { await invoke("set_kb_storage_path", { path: kbPath }); showSaveMessage("知识库存储路径已保存"); } catch (err) { console.error(err); } };
  const handleSaveKbScanPath = async () => { try { await invoke("set_kb_scan_path", { path: kbScanPath }); showSaveMessage("知识库扫描目录已保存"); } catch (err) { console.error(err); } };
  const handleSaveReportPath = async () => { try { await invoke("set_report_storage_path", { path: reportPath }); showSaveMessage("报告输出路径已保存"); } catch (err) { console.error(err); } };

  const handleClearData = async (type: string) => {
    try {
      if (type === "conversations" || type === "all") { const c = await invoke<any[]>("get_conversations"); for (const x of c) await invoke("delete_conversation", { id: x.id }); }
      if (type === "knowledge" || type === "all") { const d = await invoke<any[]>("get_knowledge_documents"); for (const x of d) await invoke("delete_knowledge_document", { docId: x.id }); }
      if (type === "reports" || type === "all") { const r = await invoke<any[]>("get_analysis_reports"); for (const x of r) await invoke("delete_analysis_report", { reportId: x.id }); }
      setShowClearConfirm(null); showSaveMessage("数据已清除");
    } catch (err) { console.error(err); }
  };

  const applyFontSettings = (family: string, size: string) => {
    document.body.style.fontFamily = family;
    document.body.style.fontSize = size + "px";
    localStorage.setItem("testco-pilot-font-family", family);
    localStorage.setItem("testco-pilot-font-size", size);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-12 flex items-center justify-between px-5"
        style={{ background: "var(--color-bg-titlebar)", borderBottom: "1px solid var(--color-border)" }}>
        <h1 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>设置</h1>
        {saveMessage && (
          <div className="flex items-center gap-1.5 text-sm animate-fade-in" style={{ color: "var(--color-success)" }}>
            <CheckCircle size={14} /> {saveMessage}
          </div>
        )}
      </header>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          <ApiConfigSection
            selectedProvider={selectedProvider} apiKey={apiKey} apiBaseUrl={apiBaseUrl} model={model}
            customProviderName={customProviderName} customModelName={customModelName} testStatus={testStatus}
            onProviderChange={setSelectedProvider} onApiKeyChange={setApiKey} onBaseUrlChange={setApiBaseUrl}
            onModelChange={setModel} onCustomProviderChange={setCustomProviderName} onCustomModelChange={setCustomModelName}
            onSave={handleSaveConfig} onTest={handleTestConnection}
          />
          <LocalModelSection
            localModelPath={localModelPath} localModelStatus={localModelStatus} modelLoadStatus={modelLoadStatus}
            onPathChange={setLocalModelPath} onSavePath={handleSaveLocalModelPath}
            onLoad={handleLoadLocalModel} onUnload={handleUnloadLocalModel}
          />
          <StoragePathSection
            kbPath={kbPath} kbScanPath={kbScanPath} reportPath={reportPath}
            onKbPathChange={setKbPath} onKbScanPathChange={setKbScanPath} onReportPathChange={setReportPath}
            onSaveKbPath={handleSaveKbPath} onSaveKbScanPath={handleSaveKbScanPath} onSaveReportPath={handleSaveReportPath}
          />
          <GithubSection repoUrl={repoUrl} onRepoUrlChange={(url) => { setRepoUrl(url); localStorage.setItem("testco-pilot-repo-url", url); }} />
          <FontSection fontFamily={fontFamily} fontSize={fontSize}
            onFontFamilyChange={(f) => { setFontFamily(f); applyFontSettings(f, fontSize); }}
            onFontSizeChange={(s) => { setFontSize(s); applyFontSettings(fontFamily, s); }}
          />
          <PrivacySection showClearConfirm={showClearConfirm} onSetClearConfirm={setShowClearConfirm} onClearData={handleClearData} />
          <AboutSection />
        </div>
      </div>
    </div>
  );
}
