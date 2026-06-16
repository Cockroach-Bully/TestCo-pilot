/**
 * 日志工具模块
 * 职责：统一管理前端日志输出，支持分级日志和模块标识
 * 模块：utils
 */

/** 日志级别 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/** 日志级别颜色配置 */
const LOG_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "#6B7280",
  [LogLevel.INFO]: "#3B82F6",
  [LogLevel.WARN]: "#F59E0B",
  [LogLevel.ERROR]: "#EF4444",
};

/** 日志级别标签 */
const LOG_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

/** 当前最低日志级别（可通过配置调整） */
let currentLevel: LogLevel = LogLevel.DEBUG;

/**
 * 设置最低日志级别
 * @param level 最低日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * 生成带时间戳和模块标识的日志前缀
 * @param module 模块名称
 * @param level 日志级别
 * @returns 格式化的前缀字符串
 */
function formatPrefix(module: string, level: LogLevel): string {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  return `[${timestamp}] [${LOG_LABELS[level]}] [${module}]`;
}

/**
 * 输出日志
 * @param module 模块名称
 * @param level 日志级别
 * @param message 日志消息
 * @param data 附加数据
 */
function log(module: string, level: LogLevel, message: string, data?: unknown): void {
  if (level < currentLevel) return;

  const prefix = formatPrefix(module, level);
  const style = `color: ${LOG_COLORS[level]}; font-weight: bold;`;

  if (data !== undefined) {
    console.log(`%c${prefix} ${message}`, style, data);
  } else {
    console.log(`%c${prefix} ${message}`, style);
  }
}

/**
 * 创建模块日志器
 * @param module 模块名称
 * @returns 模块日志器对象
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, data?: unknown) => log(module, LogLevel.DEBUG, message, data),
    info: (message: string, data?: unknown) => log(module, LogLevel.INFO, message, data),
    warn: (message: string, data?: unknown) => log(module, LogLevel.WARN, message, data),
    error: (message: string, data?: unknown) => log(module, LogLevel.ERROR, message, data),
  };
}

/** 预定义模块日志器 */
export const loggers = {
  chat: createLogger("Chat"),
  knowledge: createLogger("Knowledge"),
  reports: createLogger("Reports"),
  settings: createLogger("Settings"),
  api: createLogger("API"),
  db: createLogger("Database"),
};
