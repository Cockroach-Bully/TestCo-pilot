/**
 * ApiConfigSection 组件
 * 职责：API 配置区域，包含服务商选择、API Key、模型选择
 * 模块：components/settings
 */

import { useState } from "react";
import { Key, TestTube, ChevronDown, CheckCircle } from "lucide-react";
import { MODEL_PROVIDERS } from "../../constants/models";
import { SectionTitle, cardStyle, inputStyle, getButtonStyle, handleButtonHover, handleButtonLeave } from "./SettingsUI";

interface ApiConfigProps {
  selectedProvider: string;
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  customProviderName: string;
  customModelName: string;
  testStatus: "idle" | "testing" | "success" | "error";
  onProviderChange: (id: string) => void;
  onApiKeyChange: (key: string) => void;
  onBaseUrlChange: (url: string) => void;
  onModelChange: (model: string) => void;
  onCustomProviderChange: (name: string) => void;
  onCustomModelChange: (name: string) => void;
  onSave: () => void;
  onTest: () => void;
}

export function ApiConfigSection(props: ApiConfigProps) {
  const [showProviderList, setShowProviderList] = useState(false);
  const currentProvider = MODEL_PROVIDERS.find(p => p.id === props.selectedProvider) || MODEL_PROVIDERS[0];

  const handleProviderSelect = (providerId: string) => {
    props.onProviderChange(providerId);
    setShowProviderList(false);
    const provider = MODEL_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      props.onBaseUrlChange(provider.baseUrl);
      if (provider.models.length > 0) {
        props.onModelChange(provider.models[0].id);
      }
    }
  };

  return (
    <section>
      <SectionTitle icon={<Key size={16} style={{ color: "var(--color-accent)" }} />} title="API 配置" />
      <div style={cardStyle} className="space-y-4">
        {/* 服务商选择 */}
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            选择大模型服务商
          </label>
          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              style={{ background: "var(--color-bg-input)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-input)" }}
              onClick={() => setShowProviderList(!showProviderList)}
            >
              <span className="text-lg">{currentProvider.icon}</span>
              <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{currentProvider.name}</span>
              <ChevronDown size={16} style={{ color: "var(--color-text-muted)", transform: showProviderList ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            </div>
            {showProviderList && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto"
                style={{ background: "var(--visual-surface-solid)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-float)" }}
              >
                {MODEL_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                    style={{ background: props.selectedProvider === provider.id ? "var(--color-bg-active)" : "transparent", borderBottom: "1px solid var(--color-border)" }}
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <span className="text-lg">{provider.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{provider.name}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {provider.models.length > 0 ? `${provider.models.length} 个模型可选` : "自定义配置"}
                      </div>
                    </div>
                    {props.selectedProvider === provider.id && <CheckCircle size={16} style={{ color: "var(--color-accent)" }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
          {currentProvider.keyUrl && (
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
              获取 API Key: <a href={currentProvider.keyUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>{currentProvider.keyUrl}</a>
            </p>
          )}
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>API Key</label>
          <input type="password" value={props.apiKey} onChange={(e) => props.onApiKeyChange(e.target.value)}
            placeholder={currentProvider.keyPlaceholder || "输入 API Key..."} style={inputStyle} />
        </div>

        {/* 模型选择 */}
        {props.selectedProvider !== "custom" && currentProvider.models.length > 0 && (
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>模型选择</label>
            <select value={props.model} onChange={(e) => props.onModelChange(e.target.value)}
              style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}>
              {currentProvider.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

        {/* 自定义模式 */}
        {props.selectedProvider === "custom" && (
          <>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>服务商名称</label>
              <input type="text" value={props.customProviderName} onChange={(e) => props.onCustomProviderChange(e.target.value)}
                placeholder="例如: 我的自定义模型" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>API Base URL</label>
                <input type="text" value={props.apiBaseUrl} onChange={(e) => props.onBaseUrlChange(e.target.value)}
                  placeholder="https://api.example.com/v1" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>模型名称</label>
                <input type="text" value={props.customModelName || props.model}
                  onChange={(e) => { props.onCustomModelChange(e.target.value); props.onModelChange(e.target.value); }}
                  placeholder="例如: gpt-4o" style={inputStyle} />
              </div>
            </div>
          </>
        )}

        {/* API URL */}
        {props.selectedProvider !== "custom" && (
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>API Base URL</label>
            <input type="text" value={props.apiBaseUrl} onChange={(e) => props.onBaseUrlChange(e.target.value)} style={inputStyle} />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={props.onSave} style={getButtonStyle("primary")}
            onMouseEnter={(e) => handleButtonHover(e, "primary")} onMouseLeave={(e) => handleButtonLeave(e, "primary")}>
            保存配置
          </button>
          <button onClick={props.onTest} disabled={props.testStatus === "testing"}
            style={getButtonStyle(props.testStatus === "success" ? "primary" : props.testStatus === "error" ? "danger" : "secondary")}
            onMouseEnter={(e) => handleButtonHover(e)} onMouseLeave={(e) => handleButtonLeave(e)}>
            <TestTube size={14} />
            {props.testStatus === "testing" ? "测试中..." : props.testStatus === "success" ? "连接成功" : props.testStatus === "error" ? "连接失败" : "测试连接"}
          </button>
        </div>
      </div>
    </section>
  );
}
