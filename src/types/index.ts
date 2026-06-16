/**
 * 共享类型定义
 * 职责：定义项目中共享的 TypeScript 类型
 * 模块：types
 */

/** 对话消息 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/** 对话会话 */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/** 知识库文档 */
export interface KnowledgeDocument {
  id: string;
  name: string;
  doc_type: string;
  file_path: string;
  size: number;
  chunks: number;
  category: string;
  keywords: string[];
  indexed_at: number;
}

/** 分类信息 */
export interface CategoryInfo {
  name: string;
  count: number;
  keywords: string[];
}

/** 失败用例 */
export interface FailCase {
  id: string;
  name: string;
  test_id: string;
  result: string;
  timestamp: string | null;
  request: string | null;
  expected_response: string | null;
  actual_response: string | null;
  error_message: string | null;
}

/** 测试报告 */
export interface TestReport {
  id: string;
  name: string;
  file_path: string;
  total_cases: number;
  passed: number;
  failed: number;
  skipped: number;
  fail_cases: FailCase[];
  analyzed_at: number;
}

/** 页面类型 */
export type PageType = "chat" | "knowledge" | "reports" | "settings";

/** API 配置 */
export interface ModelConfig {
  use_local_model: boolean;
  local_model_path: string;
  local_model_loaded: boolean;
  api_key: string;
  api_base_url: string;
  model: string;
}

/** 本地模型状态 */
export interface LocalModelStatus {
  is_loaded: boolean;
  path: string | null;
  use_local: boolean;
}
