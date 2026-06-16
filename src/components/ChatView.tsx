/**
 * ChatView 组件
 * 职责：对话界面渲染
 * 模块：components
 */

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Plus, Trash2, Search, Image, ChevronDown, Wifi, Cpu, X, Edit3, Pin } from "lucide-react";
import { useChat, type ModelType } from "../hooks/useChat";

const MODEL_OPTIONS = [
  { id: "online" as ModelType, name: "MiMo V2.5-Pro", description: "在线模型，需要 API Key" },
  { id: "local" as ModelType, name: "本地模型", description: "CPU 推理，需要 GGUF 文件" },
];

interface ContextMenu {
  x: number;
  y: number;
  convId: string;
  convTitle: string;
}

export function ChatView() {
  const chat = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    window.addEventListener("click", handleClose);
    window.addEventListener("keydown", handleEscape);
    return () => { window.removeEventListener("click", handleClose); window.removeEventListener("keydown", handleEscape); };
  }, []);

  const s = {
    bgSidebar: "var(--color-bg-sidebar)", bgSurface: "var(--visual-surface, rgba(255, 253, 246, 0.86))",
    bgInput: "var(--color-bg-input)", bgTitlebar: "var(--color-bg-titlebar, rgba(250, 247, 235, 0.88))",
    accent: "var(--color-accent)", textPrimary: "var(--color-text-primary)", textSecondary: "var(--color-text-secondary)",
    textMuted: "var(--color-text-muted)", textInverse: "var(--color-text-inverse)", border: "var(--color-border)",
    shadowCard: "var(--shadow-card)", shadowButton: "var(--shadow-button)", shadowButtonActive: "var(--shadow-button-active)",
    shadowInput: "var(--shadow-input)", shadowFloat: "var(--shadow-float)", radiusPill: "var(--radius-pill)",
  };
  const currentModelName = chat.selectedModel === "online" ? "MiMo V2.5-Pro"
    : chat.localModelStatus.path ? `本地 (${chat.localModelStatus.path.split(/[/\\]/).pop()})` : "本地模型 (未配置)";

  const filteredConvs = chat.conversations
    .filter((c) => c.title.toLowerCase().includes(chat.searchQuery.toLowerCase()))
    .sort((a, b) => {
      const ap = pinnedIds.has(a.id) ? 0 : 1;
      const bp = pinnedIds.has(b.id) ? 0 : 1;
      return ap - bp;
    });

  const handleContextMenu = (e: React.MouseEvent, convId: string, convTitle: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, convId, convTitle });
  };

  const handlePin = (convId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId); else next.add(convId);
      return next;
    });
    setContextMenu(null);
  };

  const handleRenameFromMenu = (convId: string, convTitle: string) => {
    chat.handleStartRename(convId, convTitle);
    setContextMenu(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧对话列表 */}
      <div className="w-56 flex flex-col" style={{ background: s.bgSidebar, borderRight: `1px solid ${s.border}` }}>
        {/* 新建对话按钮 */}
        <div className="px-3 pt-3 pb-2">
          <button onClick={chat.handleNewConversation} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm"
            style={{ background: s.accent, color: s.textInverse, borderRadius: s.radiusPill, boxShadow: s.shadowButton }}>
            <Plus size={16} /> 新建对话
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2" style={{ background: s.bgInput, borderRadius: s.radiusPill, border: `1px solid ${s.border}`, boxShadow: s.shadowInput }}>
            <Search size={14} style={{ color: s.textMuted, flexShrink: 0 }} />
            <input type="text" placeholder="搜索对话..." value={chat.searchQuery} onChange={(e) => chat.setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none" style={{ color: s.textPrimary }} />
          </div>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-auto px-2 space-y-0.5">
          {filteredConvs.map((conv) => (
            <div key={conv.id} className="group flex items-center justify-between px-3 py-2 text-xs cursor-pointer"
              style={{
                borderRadius: "10px", minHeight: "34px",
                background: chat.activeConvId === conv.id ? "var(--color-bg-active)" : "transparent",
                color: chat.activeConvId === conv.id ? s.accent : s.textSecondary,
              }}
              onClick={() => chat.setActiveConvId(conv.id)}
              onContextMenu={(e) => handleContextMenu(e, conv.id, conv.title)}>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {pinnedIds.has(conv.id) && <Pin size={10} style={{ color: s.accent, flexShrink: 0 }} />}
                {chat.renamingId === conv.id ? (
                  <input type="text" value={chat.renameValue} onChange={(e) => chat.setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") chat.handleConfirmRename(); if (e.key === "Escape") chat.handleCancelRename(); }}
                    onBlur={chat.handleConfirmRename} autoFocus
                    className="flex-1 bg-transparent outline-none text-xs" style={{ color: s.textPrimary }} />
                ) : (
                  <span className="truncate">{conv.title}</span>
                )}
              </div>
              <button className="opacity-0 group-hover:opacity-100" style={{ color: s.textMuted }}
                onClick={(e) => { e.stopPropagation(); chat.handleDeleteConversation(conv.id); }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div className="fixed z-50 py-1" style={{ left: contextMenu.x, top: contextMenu.y, background: "#fffdf6", borderRadius: "12px", border: `1px solid ${s.border}`, boxShadow: s.shadowFloat, minWidth: "140px" }}
          onClick={(e) => e.stopPropagation()}>
          <button className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
            style={{ color: s.textPrimary }} onClick={() => handleRenameFromMenu(contextMenu.convId, contextMenu.convTitle)}>
            <Edit3 size={12} /> 重命名
          </button>
          <button className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
            style={{ color: s.textPrimary }} onClick={() => handlePin(contextMenu.convId)}>
            <Pin size={12} /> {pinnedIds.has(contextMenu.convId) ? "取消置顶" : "置顶"}
          </button>
          <div style={{ borderTop: `1px solid ${s.border}`, margin: "4px 8px" }} />
          <button className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
            style={{ color: "#E53935" }} onClick={() => { chat.handleDeleteConversation(contextMenu.convId); setContextMenu(null); }}>
            <Trash2 size={12} /> 删除
          </button>
        </div>
      )}

      {/* 中间对话区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部模型选择 */}
        <div className="flex items-center px-5" style={{ height: "80px", background: s.bgTitlebar, borderBottom: `1px solid ${s.border}` }}>
          <div className="relative ml-3">
            <button onClick={() => chat.setShowModelMenu(!chat.showModelMenu)}
              className="flex items-center gap-2 px-4 py-2 text-sm" style={{ background: "var(--visual-surface)", borderRadius: s.radiusPill, color: s.textSecondary, border: `1px solid ${s.border}` }}>
              {chat.selectedModel === "online" ? <Wifi size={14} style={{ color: "#4CAF50" }} /> : <Cpu size={14} style={{ color: s.accent }} />}
              <span className="font-medium">{currentModelName}</span>
              <ChevronDown size={14} style={{ marginLeft: "4px" }} />
            </button>
            {chat.showModelMenu && (
              <div className="absolute top-full left-0 mt-1 w-60 z-10 overflow-hidden" style={{ background: "#fffdf6", borderRadius: "16px", border: `1px solid ${s.border}`, boxShadow: s.shadowFloat }}>
                {MODEL_OPTIONS.map((opt) => (
                  <button key={opt.id} onClick={() => chat.handleModelChange(opt.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ background: chat.selectedModel === opt.id ? "var(--color-bg-active)" : "transparent", color: chat.selectedModel === opt.id ? s.accent : s.textPrimary }}>
                    {opt.id === "online" ? <Wifi size={15} style={{ color: "#4CAF50" }} /> : <Cpu size={15} style={{ color: s.accent }} />}
                    <div><div className="text-sm font-medium">{opt.name}</div><div className="text-xs" style={{ color: s.textSecondary }}>{opt.description}</div></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 消息列表 */}
        <div ref={chat.messagesEndRef} className={`flex-1 overflow-auto p-6 space-y-5 ${chat.isDragging ? "bg-orange-50" : ""}`}
          onDragOver={chat.handleDragOver} onDragLeave={chat.handleDragLeave} onDrop={chat.handleDrop}>
          {chat.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-[22px] overflow-hidden mb-4" style={{ boxShadow: s.shadowButton }}>
                <img src="/logo.svg" alt="TestCo-pilot" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-lg font-medium mb-1" style={{ color: s.textPrimary }}>TestCo-pilot</h2>
              <p className="text-sm" style={{ color: s.textSecondary }}>智能测试助手</p>
              <p className="text-xs mt-2" style={{ color: s.textMuted }}>支持 Ctrl+V 粘贴图片 | Shift+Enter 换行 | 右键管理对话</p>
            </div>
          )}
          {chat.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-message-in`}>
              {msg.role === "assistant" ? (
                <div className="max-w-[80%] rounded-[18px] px-5 py-4" style={{ background: s.bgSurface, border: `1px solid ${s.border}`, boxShadow: s.shadowCard }}>
                  <div className="markdown-body text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                </div>
              ) : (
                <div className="max-w-[70%]">
                  <div className="rounded-[18px] px-5 py-3 text-sm" style={{ background: "rgba(136, 157, 240, 0.15)", color: s.textPrimary }}>
                    {msg.content.split("\n").map((line, i) => <span key={i}>{line}{i < msg.content.split("\n").length - 1 && <br />}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chat.messagesEndRef} />
        </div>

        {/* 输入区域 - 可拖拽调整高度 */}
        <div className="px-6 py-4" style={{ borderTop: `1px solid ${s.border}` }}>
          {chat.pendingImages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {chat.pendingImages.map((img, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img src={img.preview} alt="" className="h-14 w-14 object-cover rounded-xl" style={{ border: `1px solid ${s.border}` }} />
                  <button onClick={() => chat.removeImage(index)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]" style={{ background: "#E53935", color: "#fff" }}><X size={8} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="relative" style={{ height: `${chat.inputHeight}px` }}>
            {/* 拖拽调整条 */}
            <div className="resize-handle" onMouseDown={chat.handleResizeStart} title="拖拽调整高度" />
            <div className="flex items-end gap-3 px-5 py-3 h-full" style={{ background: "var(--visual-surface)", borderRadius: "22px", border: `2px solid rgba(196, 184, 158, 0.5)`, boxShadow: "0 3px 0 0 rgba(212, 201, 180, 0.8), 0 8px 20px rgba(107, 92, 67, 0.06)" }}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/bmp" multiple onChange={chat.handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()} className="p-2" style={{ color: s.textMuted }} title="上传图片"><Image size={20} /></button>
              <textarea value={chat.input} onChange={(e) => chat.setInput(e.target.value)} onKeyDown={chat.handleKeyDown} onPaste={chat.handlePaste}
                placeholder="输入消息... (Enter 发送, Shift+Enter 换行, Ctrl+V 粘贴图片)"
                className="flex-1 bg-transparent text-sm outline-none resize-none py-1" style={{ color: s.textPrimary, height: "100%" }} />
              <button onClick={chat.handleSend} disabled={(!chat.input.trim() && chat.pendingImages.length === 0) || chat.isStreaming || !chat.activeConvId}
                className="p-2 rounded-xl" style={{ background: (chat.input.trim() || chat.pendingImages.length > 0) && !chat.isStreaming && chat.activeConvId ? s.accent : "transparent", color: (chat.input.trim() || chat.pendingImages.length > 0) && !chat.isStreaming && chat.activeConvId ? s.textInverse : s.textMuted }}>
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
