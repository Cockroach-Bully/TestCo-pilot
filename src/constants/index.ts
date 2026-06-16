/**
 * 常量定义文件
 * 职责：集中管理应用中的魔法数字、固定字符串和配置常量
 * 模块：constants
 */

/** 应用信息 */
export const APP_NAME = "TestCo-pilot";
export const APP_VERSION = "0.1.0";
export const APP_DESCRIPTION = "智能测试助手";

/** 存储键名 */
export const STORAGE_KEYS = {
  DISCLAIMER_ACCEPTED: "testco-pilot-disclaimer-accepted",
  DISCLAIMER_VERSION: "1.0.0",
  FONT_FAMILY: "testco-pilot-font-family",
  FONT_SIZE: "testco-pilot-font-size",
  PET_VISIBLE: "testco-pilot-pet-visible",
  PET_CONFIG: "testco-pilot-pet",
  PET_STATE: "testco-pilot-pet-state",
} as const;

/** 默认值 */
export const DEFAULTS = {
  FONT_FAMILY: "system-ui, -apple-system, sans-serif",
  FONT_SIZE: "15",
  API_BASE_URL: "https://api.mimo.ai/v1",
  MODEL: "mimo-v2.5",
  KB_SCAN_PATH: "",
} as const;

/** 消息配置 */
export const MESSAGE_CONFIG = {
  MAX_CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 50,
  EMBEDDING_DIMENSIONS: 128,
  DEFAULT_SEARCH_LIMIT: 5,
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
} as const;

/** 文件格式 */
export const SUPPORTED_FILE_TYPES = {
  KNOWLEDGE: [".txt", ".md", ".markdown", ".pdf", ".docx", ".xlsx", ".xls"],
  IMAGE: ["image/png", "image/jpeg", "image/bmp"],
  REPORT: [".xml"],
  ARCHIVE: [".zip"],
  MODEL: [".gguf"],
} as const;

/** 分类关键词映射 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  刷写: ["刷写", "flash", "reprogram", "ota", "升级", "firmware", "编程"],
  诊断: ["诊断", "diagnostic", "uds", "dtc", "故障", "错误码", "nrc", "obd"],
  通讯: ["通讯", "can", "lin", "ethernet", "someip", "doip", "报文", "信号", "message"],
  网络管理: ["网络管理", "network", "nm", "唤醒", "休眠", "autosar", "模式"],
  路由: ["路由", "routing", "网关", "gateway", "转发", "路由表"],
  标定: ["标定", "calibration", "参数", "parameter", "配置", "config"],
  测试: ["测试", "test", "验证", "validation", "用例", "case"],
  规范: ["规范", "specification", "标准", "standard", "iso", "协议"],
} as const;

export { MODEL_PROVIDERS } from "./models";
export type { ModelProvider } from "./models";

/** 字体选项 */
export const FONT_FAMILIES = [
  { value: "system-ui, -apple-system, sans-serif", label: "系统默认" },
  { value: "'Noto Sans SC', 'Source Han Sans SC', sans-serif", label: "思源黑体" },
  { value: "'Noto Serif SC', 'Source Han Serif SC', serif", label: "思源宋体" },
  { value: "'Microsoft YaHei', 'PingFang SC', sans-serif", label: "微软雅黑" },
  { value: "'SimSun', 'Songti SC', serif", label: "宋体" },
  { value: "'SimHei', 'Heiti SC', sans-serif", label: "黑体" },
  { value: "'KaiTi', 'Kaiti SC', serif", label: "楷体" },
  { value: "'DM Sans', 'Nunito', sans-serif", label: "DM Sans" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'JetBrains Mono', 'Fira Code', monospace", label: "JetBrains Mono" },
] as const;

/** 字体大小选项 */
export const FONT_SIZES = [
  { value: "12", label: "12px - 小" },
  { value: "13", label: "13px - 较小" },
  { value: "14", label: "14px - 默认" },
  { value: "15", label: "15px - 适中" },
  { value: "16", label: "16px - 较大" },
  { value: "18", label: "18px - 大" },
  { value: "20", label: "20px - 特大" },
] as const;
