/**
 * useKnowledgeBase Hook
 * 职责：知识库页面的业务逻辑
 * 模块：hooks
 */

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { KnowledgeDocument, CategoryInfo } from "../types";

export function useKnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scanPath, setScanPath] = useState("");

  useEffect(() => { loadData(); loadScanPath(); }, []);

  const loadData = async () => { await Promise.all([loadDocuments(), loadCategories()]); };

  const loadDocuments = async () => {
    try { setDocuments(await invoke<KnowledgeDocument[]>("get_knowledge_documents")); } catch (err) { console.error(err); }
  };

  const loadCategories = async () => {
    try { setCategories(await invoke<CategoryInfo[]>("get_knowledge_categories")); } catch (err) { console.error(err); }
  };

  const loadScanPath = async () => {
    try { setScanPath(await invoke<string>("get_kb_scan_path")); } catch (err) { console.error(err); }
  };

  const handleImport = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file"; input.accept = ".txt,.md,.markdown,.pdf,.docx,.xlsx,.xls"; input.multiple = true;
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) return;
        for (const file of Array.from(files)) {
          try { await invoke("import_knowledge_document", { filePath: (file as any).path || file.name }); } catch (err) { console.error(err); }
        }
        await loadData();
      };
      input.click();
    } catch (err) { console.error(err); }
  };

  const handleRefresh = async (fullRescan: boolean = false) => {
    if (!scanPath) return;
    setIsScanning(true); setScanMessage("");
    try {
      const command = fullRescan ? "rescan_knowledge_directory" : "scan_knowledge_directory";
      const newDocs = await invoke<KnowledgeDocument[]>(command, { dirPath: scanPath });
      await loadData();
      setScanMessage(newDocs.length > 0 ? `新增 ${newDocs.length} 个文档` : "没有发现新文档");
    } catch (err) { setScanMessage(`扫描失败: ${err}`); }
    finally { setIsScanning(false); setTimeout(() => setScanMessage(""), 3000); }
  };

  const handleDelete = async (docId: string) => {
    try { await invoke("delete_knowledge_document", { docId }); await loadData(); } catch (err) { console.error(err); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = selectedCategory
        ? await invoke<any[]>("search_knowledge_by_category", { query: searchQuery, category: selectedCategory, limit: 5 })
        : await invoke<any[]>("search_knowledge", { query: searchQuery, limit: 5 });
      setSearchResults(results);
    } catch (err) { console.error(err); }
    finally { setIsSearching(false); }
  };

  return {
    documents, categories, searchQuery, setSearchQuery, searchResults, setSearchResults,
    isSearching, isScanning, scanMessage, selectedCategory, setSelectedCategory, scanPath,
    handleImport, handleRefresh, handleDelete, handleSearch,
  };
}
