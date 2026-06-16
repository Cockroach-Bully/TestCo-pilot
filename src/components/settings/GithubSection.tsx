/**
 * GithubSection 组件
 * 职责：GitHub 仓库配置和版本管理
 * 模块：components/settings
 */

import { GitBranch, ExternalLink } from "lucide-react";
import { SectionTitle, cardStyle, inputStyle, getButtonStyle } from "./SettingsUI";

interface GithubProps {
  repoUrl: string;
  onRepoUrlChange: (url: string) => void;
}

export function GithubSection(props: GithubProps) {
  const handleCopyCloneCommand = () => {
    if (props.repoUrl) {
      navigator.clipboard.writeText(`git clone ${props.repoUrl}`);
    }
  };

  return (
    <section>
      <SectionTitle icon={<GitBranch size={16} style={{ color: "var(--color-accent)" }} />} title="GitHub 配置" />
      <div style={cardStyle} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            仓库地址
          </label>
          <div className="flex gap-2">
            <input type="text" value={props.repoUrl} onChange={(e) => props.onRepoUrlChange(e.target.value)}
              placeholder="https://github.com/username/testco-pilot.git" style={{ ...inputStyle, flex: 1 }} />
            {props.repoUrl && (
              <a href={props.repoUrl} target="_blank" rel="noopener noreferrer"
                style={getButtonStyle("secondary")}
                className="inline-flex items-center gap-1">
                <ExternalLink size={14} /> 打开
              </a>
            )}
          </div>
        </div>

        {props.repoUrl && (
          <div className="p-3 rounded-[14px]" style={{ background: "var(--color-bg-tertiary)" }}>
            <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
              用户可通过以下命令拉取项目：
            </p>
            <code className="block text-xs p-2 rounded" style={{ background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}>
              git clone {props.repoUrl}
            </code>
            <button onClick={handleCopyCloneCommand}
              className="mt-2 text-xs px-3 py-1 rounded-full"
              style={{ background: "var(--color-accent-muted)", color: "var(--color-accent)" }}>
              复制命令
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <GitBranch size={14} style={{ color: "var(--color-text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            版本管理：语义化版本号 (主版本.次版本.修订号)
          </span>
        </div>
      </div>
    </section>
  );
}
