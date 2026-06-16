/**
 * SettingsUI 模块
 * 职责：设置页面复用的 UI 组件和样式工具
 * 模块：components/settings
 */

import { useState } from "react";
import type { ReactNode } from "react";

/** 卡片容器样式 */
export const cardStyle = {
  background: "var(--visual-surface, rgba(255, 253, 246, 0.86))",
  borderRadius: "var(--radius-card, 20px)",
  border: "1px solid var(--color-border)",
  boxShadow: "var(--shadow-card)",
  padding: "20px",
};

/** 输入框样式 */
export const inputStyle = {
  width: "100%",
  padding: "10px 16px",
  background: "var(--color-bg-input, #fff)",
  borderRadius: "var(--radius-lg, 18px)",
  border: "1px solid var(--color-border)",
  fontSize: "14px",
  color: "var(--color-text-primary, #68451f)",
  outline: "none",
  boxShadow: "var(--shadow-input, 0 3px 0 0 #d4c9b4)",
  transition: "all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)",
};

/** 按钮变体类型 */
type ButtonVariant = "primary" | "secondary" | "danger";

/** 获取按钮样式 */
export function getButtonStyle(variant: ButtonVariant = "secondary") {
  const base = {
    padding: "8px 16px",
    borderRadius: "var(--radius-pill, 50px)",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "none",
    outline: "none",
  };
  if (variant === "primary") {
    return { ...base, background: "var(--color-accent, #FF6A00)", color: "#fff", boxShadow: "0 4px 0 0 #bdaea0" };
  }
  if (variant === "danger") {
    return { ...base, background: "rgba(229, 57, 53, 0.08)", color: "#E53935", boxShadow: "0 4px 0 0 rgba(229, 57, 53, 0.15)" };
  }
  return { ...base, background: "rgba(247, 243, 223, 0.64)", color: "var(--color-text-primary, #68451f)", boxShadow: "0 4px 0 0 #d4c9b4" };
}

/** 按钮悬停处理 */
export function handleButtonHover(e: React.MouseEvent<HTMLButtonElement>, variant: ButtonVariant = "secondary") {
  const el = e.currentTarget;
  el.style.transform = "translateY(-2px)";
  if (variant === "primary") el.style.boxShadow = "0 6px 0 0 #bdaea0";
  else if (variant === "danger") el.style.boxShadow = "0 6px 0 0 rgba(229, 57, 53, 0.2)";
  else el.style.boxShadow = "0 6px 0 0 #d4c9b4";
}

/** 按钮离开处理 */
export function handleButtonLeave(e: React.MouseEvent<HTMLButtonElement>, variant: ButtonVariant = "secondary") {
  const el = e.currentTarget;
  el.style.transform = "translateY(0)";
  if (variant === "primary") el.style.boxShadow = "0 4px 0 0 #bdaea0";
  else if (variant === "danger") el.style.boxShadow = "0 4px 0 0 rgba(229, 57, 53, 0.15)";
  else el.style.boxShadow = "0 4px 0 0 #d4c9b4";
}

/** 标题组件 */
export function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"
      style={{ color: "var(--color-text-primary, #68451f)" }}>
      {icon} {title}
    </h2>
  );
}

/** 提示框组件 */
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 text-xs z-50"
          style={{
            background: "var(--color-text-primary, #68451f)",
            color: "var(--color-text-inverse, #fffdf6)",
            borderRadius: "var(--radius-md, 12px)",
            boxShadow: "var(--shadow-float)",
            maxWidth: "320px",
            lineHeight: "1.5",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {text}
          <div className="absolute top-full left-4 -mt-1 w-2 h-2 rotate-45"
            style={{ background: "var(--color-text-primary, #68451f)" }} />
        </div>
      )}
    </div>
  );
}
