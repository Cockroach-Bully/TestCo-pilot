/**
 * useChat Hook
 * 职责：管理对话状态和业务逻辑
 * 模块：hooks
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Conversation, Message, LocalModelStatus } from "../types";

export type ModelType = "online" | "local";

export interface PendingImage {
  file: File;
  preview: string;
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelType>("online");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [localModelStatus, setLocalModelStatus] = useState<LocalModelStatus>({ is_loaded: false, path: null, use_local: false });
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [inputHeight, setInputHeight] = useState(() => {
    const saved = localStorage.getItem("testco-pilot-input-height");
    return saved ? parseInt(saved, 10) : 120;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { loadConversations(); loadLocalModelStatus(); }, []);

  const loadLocalModelStatus = async () => {
    try {
      const status = await invoke<LocalModelStatus>("get_local_model_status");
      setLocalModelStatus(status);
      if (status.use_local) setSelectedModel("local");
    } catch (err) { console.error(err); }
  };

  const loadConversations = async () => {
    try {
      const convs = await invoke<Conversation[]>("get_conversations");
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) setActiveConvId(convs[0].id);
    } catch (err) { console.error(err); }
  };

  const handleNewConversation = async () => {
    try {
      const id = await invoke<string>("create_conversation", { title: "新对话" });
      await loadConversations();
      setActiveConvId(id);
      setMessages([]);
    } catch (err) { console.error(err); }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await invoke("delete_conversation", { id });
      await loadConversations();
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
    } catch (err) { console.error(err); }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleConfirmRename = async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    try {
      // 更新本地状态，同时可以通过 API 保存
      setConversations((prev) => prev.map((c) => c.id === renamingId ? { ...c, title: renameValue.trim() } : c));
      setRenamingId(null);
    } catch (err) { console.error(err); }
  };

  const handleCancelRename = () => { setRenamingId(null); setRenameValue(""); };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = inputHeight;
    const minHeight = 100;
    const maxHeight = window.innerHeight * 0.6;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + delta));
      setInputHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // 保存高度到 localStorage
      setInputHeight((prev) => {
        localStorage.setItem("testco-pilot-input-height", String(Math.round(prev)));
        return prev;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, [inputHeight]);

  const handleModelChange = async (model: ModelType) => {
    setSelectedModel(model);
    setShowModelMenu(false);
    try {
      await invoke("set_local_model_config", { useLocal: model === "local", modelPath: model === "local" ? (localModelStatus.path || "") : "" });
    } catch (err) { console.error(err); }
  };

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPendingImages((prev) => [...prev, { file, preview: e.target?.result as string }]);
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) { e.preventDefault(); const file = item.getAsFile(); if (file) processImageFile(file); break; }
    }
  }, [processImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    for (const file of Array.from(e.dataTransfer.files)) { if (file.type.startsWith("image/")) processImageFile(file); }
  }, [processImageFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { for (const file of Array.from(e.target.files)) { if (file.type.startsWith("image/")) processImageFile(file); } }
  };

  const removeImage = (index: number) => setPendingImages((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if ((!input.trim() && pendingImages.length === 0) || isStreaming || !activeConvId) return;
    let messageContent = input.trim();
    if (pendingImages.length > 0) {
      messageContent += (messageContent ? "\n\n" : "") + pendingImages.map((_, i) => `[图片 ${i + 1}]`).join("\n");
      setPendingImages([]);
    }
    setInput("");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: messageContent, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    try {
      const response = await invoke<string>("send_message", { conversationId: activeConvId, message: messageContent });
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: `错误: ${err}`, timestamp: Date.now() }]);
    } finally { setIsStreaming(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return {
    conversations, activeConvId, setActiveConvId, messages, input, isStreaming, searchQuery,
    selectedModel, showModelMenu, localModelStatus, pendingImages, isDragging,
    renamingId, renameValue, inputHeight,
    messagesEndRef, setSearchQuery, setShowModelMenu, setInput, setRenameValue,
    handleNewConversation, handleDeleteConversation, handleModelChange,
    handlePaste, handleDragOver, handleDragLeave, handleDrop,
    handleFileSelect, removeImage, handleSend, handleKeyDown,
    handleStartRename, handleConfirmRename, handleCancelRename, handleResizeStart,
  };
}
