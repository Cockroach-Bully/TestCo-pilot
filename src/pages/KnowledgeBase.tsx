/**
 * KnowledgeBase 页面
 * 职责：知识库管理界面
 * 模块：pages
 */

import { Upload, Trash2, Search, FolderOpen, FileText, RefreshCw, Loader2, Tag } from "lucide-react";
import { useKnowledgeBase } from "../hooks/useKnowledgeBase";

export function KnowledgeBase() {
  const kb = useKnowledgeBase();
  const getCategoryIcon = (name: string) => {
    const map: Record<string, string> = { 刷写: "🔄", 诊断: "🔍", 通讯: "📡", 网络管理: "🌐", 路由: "🔀", 标定: "⚙️", 测试: "🧪", 规范: "📋" };
    return map[name] || "📄";
  };
  const filteredDocuments = kb.selectedCategory ? kb.documents.filter((d) => d.category === kb.selectedCategory) : kb.documents;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-5 bg-white/80">
        <h1 className="text-base font-medium text-text-primary">知识库</h1>
        <div className="flex items-center gap-2">
          {kb.scanMessage && <span className="text-xs text-accent animate-fade-in">{kb.scanMessage}</span>}
          <div className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-xl">
            <Search size={14} className="text-text-muted" />
            <input type="text" placeholder={kb.selectedCategory ? `${kb.selectedCategory}...` : "搜索知识库..."}
              value={kb.searchQuery} onChange={(e) => kb.setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && kb.handleSearch()}
              className="bg-transparent text-sm outline-none w-40" style={{ color: "var(--color-text-primary)" }} />
          </div>
          <button onClick={() => kb.handleRefresh(false)} disabled={kb.isScanning}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-tertiary rounded-xl text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {kb.isScanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 扫描
          </button>
          <button onClick={() => kb.handleRefresh(true)} disabled={kb.isScanning}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-tertiary rounded-xl text-sm" style={{ color: "var(--color-text-muted)" }}>
            <RefreshCw size={14} /> 重扫
          </button>
          <button onClick={kb.handleImport} className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-xl text-sm">
            <Upload size={14} /> 导入
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类 */}
        <aside className="w-52 border-r border-border-subtle bg-white overflow-auto p-4">
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Tag size={11} /> 分类
          </h3>
          <div className="space-y-0.5">
            <button onClick={() => kb.setSelectedCategory(null)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs"
              style={{ background: kb.selectedCategory === null ? "var(--color-bg-active)" : "transparent", color: kb.selectedCategory === null ? "var(--color-accent)" : "var(--color-text-primary)" }}>
              <span>全部文档</span><span className="text-xs opacity-70">{kb.documents.length}</span>
            </button>
            {kb.categories.map((cat) => (
              <button key={cat.name} onClick={() => kb.setSelectedCategory(cat.name)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs"
                style={{ background: kb.selectedCategory === cat.name ? "var(--color-bg-active)" : "transparent", color: kb.selectedCategory === cat.name ? "var(--color-accent)" : "var(--color-text-primary)" }}>
                <span className="flex items-center gap-2"><span>{getCategoryIcon(cat.name)}</span><span>{cat.name}</span></span>
                <span className="text-xs opacity-70">{cat.count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* 右侧文档列表 */}
        <main className="flex-1 overflow-auto p-6">
          {kb.searchResults.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-text-primary">搜索结果</h2>
                <button onClick={() => kb.setSearchResults([])} className="text-xs text-text-secondary hover:text-accent">清除</button>
              </div>
              <div className="space-y-3">
                {kb.searchResults.map((r, i) => (
                  <div key={i} className="bg-bg-secondary rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-accent">相似度: {(r.score * 100).toFixed(1)}%</span>
                      <span className="text-xs text-text-secondary">文档: {r.document_id.slice(0, 8)}...</span>
                    </div>
                    <p className="text-sm text-text-primary">{r.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <FolderOpen size={40} className="mb-3 opacity-30" />
              <h2 className="text-base font-medium text-text-primary mb-1.5">
                {kb.selectedCategory ? `"${kb.selectedCategory}"分类下暂无文档` : "知识库为空"}
              </h2>
              <p className="text-xs text-text-muted">{kb.scanPath ? `扫描目录: ${kb.scanPath}` : "请先在设置中配置扫描目录"}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-text-primary">
                  {kb.selectedCategory ? `${getCategoryIcon(kb.selectedCategory)} ${kb.selectedCategory} (${filteredDocuments.length})` : `全部文档 (${filteredDocuments.length})`}
                </h2>
                {kb.scanPath && <span className="text-xs text-text-secondary">{kb.scanPath}</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="bg-bg-secondary rounded-lg border border-border p-4 card-hover">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText size={20} className="text-accent flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-primary truncate">{doc.name}</p>
                          <p className="text-xs text-text-secondary">{doc.chunks} 分块 | {(doc.size / 1024).toFixed(1)} KB</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-bg-primary rounded text-[10px] text-accent">{doc.category}</span>
                            {doc.keywords.slice(0, 2).map((kw) => <span key={kw} className="px-1.5 py-0.5 bg-bg-primary rounded text-[10px] text-text-secondary">{kw}</span>)}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => kb.handleDelete(doc.id)} className="text-text-secondary hover:text-error"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
