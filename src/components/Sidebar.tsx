import { MessageSquare, FileText, BarChart3, Settings } from "lucide-react";
import type { PageType } from "../types";

interface SidebarProps {
  activePage: PageType;
  onPageChange: (page: PageType) => void;
}

const navItems = [
  { id: "chat" as PageType, icon: MessageSquare, label: "对话" },
  { id: "knowledge" as PageType, icon: FileText, label: "知识库" },
  { id: "reports" as PageType, icon: BarChart3, label: "分析" },
  { id: "settings" as PageType, icon: Settings, label: "设置" },
];

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-[72px] flex flex-col items-center py-4"
      style={{
        background: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className="w-12 h-12 rounded-[16px] mb-8 overflow-hidden"
        style={{
          boxShadow: '0 5px 0 0 #bdaea0, 0 8px 20px rgba(107, 92, 67, 0.12)',
        }}
      >
        <img src="/logo.svg" alt="TestCo-pilot" className="w-full h-full object-cover" />
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onPageChange(id)}
            className="w-14 h-14 rounded-[18px] flex flex-col items-center justify-center gap-1"
            style={{
              background: activePage === id ? 'var(--color-bg-active)' : 'transparent',
              color: activePage === id ? 'var(--color-accent)' : 'var(--color-text-muted)',
              boxShadow: activePage === id ? 'var(--shadow-button-active)' : 'none',
              transform: activePage === id ? 'translateY(2px)' : 'none',
            }}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
