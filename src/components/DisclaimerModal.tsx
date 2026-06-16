/**
 * DisclaimerModal 组件
 * 职责：启动时显示免责声明弹窗，用户确认后进入主界面
 * 模块：components
 */

import { useState } from "react";
import { Shield } from "lucide-react";

interface DisclaimerModalProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(74, 55, 40, 0.6)", backdropFilter: "blur(8px)" }}
    >
      <div className="w-full max-w-lg mx-4 animate-fade-in-up"
        style={{
          background: "var(--visual-surface-solid, #fffdf6)",
          borderRadius: "var(--radius-modal, 24px)",
          boxShadow: "0 20px 60px rgba(74, 55, 40, 0.3)",
          padding: "36px",
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
            style={{ background: "rgba(255, 106, 0, 0.12)" }}
          >
            <Shield size={28} style={{ color: "var(--color-accent, #FF6A00)" }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary, #68451f)" }}>
              使用声明
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted, #81735d)" }}>
              请仔细阅读以下内容
            </p>
          </div>
        </div>

        <div className="p-5 rounded-[18px] mb-6"
          style={{ background: "var(--color-bg-tertiary, rgba(247, 243, 223, 0.64))" }}
        >
          <p className="text-base leading-relaxed" style={{ color: "var(--color-text-body, #58452f)" }}>
            本软件目前处于<strong style={{ color: "var(--color-accent, #FF6A00)" }}>测试阶段</strong>，
            仅供测试人员使用。
          </p>
          <p className="text-base leading-relaxed mt-3" style={{ color: "var(--color-text-body, #58452f)" }}>
            所有产出结果，是否使用由用户自行决定，软件仅提供<strong>参考建议</strong>。
          </p>
          <p className="text-base leading-relaxed mt-3" style={{ color: "var(--color-text-body, #58452f)" }}>
            对于基于大模型生成的分析结论，请结合实际情况进行判断。
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "var(--color-accent, #FF6A00)",
            color: "#fff",
            borderRadius: "var(--radius-pill, 50px)",
            boxShadow: "0 6px 0 0 #bdaea0, 0 10px 30px rgba(255, 106, 0, 0.3)",
            border: "none",
            cursor: "pointer",
          }}
        >
          好的呢，同意了
        </button>
      </div>
    </div>
  );
}
