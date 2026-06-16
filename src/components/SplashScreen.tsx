import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("初始化中...");

  useEffect(() => {
    const steps = [
      { progress: 20, status: "加载配置..." },
      { progress: 40, status: "初始化数据库..." },
      { progress: 60, status: "加载知识库..." },
      { progress: 80, status: "准备就绪..." },
      { progress: 100, status: "启动完成" },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress);
        setStatus(steps[currentStep].status);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 300);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "var(--color-bg-primary, #fbfaf2)" }}
    >
      <div className="text-center">
        <div className="w-20 h-20 rounded-[22px] mx-auto mb-6 overflow-hidden animate-pulse"
          style={{
            boxShadow: "0 5px 0 0 #bdaea0, 0 12px 40px rgba(107, 92, 67, 0.18)",
          }}
        >
          <img src="/logo.svg" alt="TestCo-pilot" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary, #68451f)" }}>
          TestCo-pilot
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary, #6f634e)" }}>
          智能测试助手
        </p>

        <div className="w-64 mx-auto">
          <div className="h-1.5 rounded-full overflow-hidden mb-3"
            style={{ background: "var(--color-border, #a9987d)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--color-accent, #FF6A00), var(--color-accent-hover, #E55E00))",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted, #81735d)" }}>{status}</p>
        </div>
      </div>
    </div>
  );
}
