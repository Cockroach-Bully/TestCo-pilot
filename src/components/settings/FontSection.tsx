/**
 * FontSection 组件
 * 职责：字体设置区域
 * 模块：components/settings
 */

import { Type, Palette } from "lucide-react";
import { SectionTitle, cardStyle, inputStyle } from "./SettingsUI";
import { FONT_FAMILIES, FONT_SIZES } from "../../constants";

interface FontProps {
  fontFamily: string;
  fontSize: string;
  onFontFamilyChange: (family: string) => void;
  onFontSizeChange: (size: string) => void;
}

export function FontSection(props: FontProps) {
  return (
    <section>
      <SectionTitle icon={<Type size={16} style={{ color: "var(--color-accent)" }} />} title="字体设置" />
      <div style={cardStyle} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
              <Palette size={14} className="inline mr-1" style={{ verticalAlign: "text-bottom" }} />
              字体样式
            </label>
            <select value={props.fontFamily} onChange={(e) => props.onFontFamilyChange(e.target.value)}
              style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}>
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)", fontFamily: props.fontFamily }}>
              预览：这是当前字体的显示效果
            </p>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
              <Type size={14} className="inline mr-1" style={{ verticalAlign: "text-bottom" }} />
              字体大小
            </label>
            <select value={props.fontSize} onChange={(e) => props.onFontSizeChange(e.target.value)}
              style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}>
              {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)", fontSize: props.fontSize + "px" }}>
              预览：当前 {props.fontSize}px 大小
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
