/**
 * 模型提供商数据
 * 职责：定义支持的大模型服务商配置
 * 模块：constants
 */

export interface ModelProvider {
  id: string;
  name: string;
  icon: string;
  baseUrl: string;
  models: { id: string; name: string }[];
  requiresKey: boolean;
  keyPlaceholder?: string;
  keyUrl?: string;
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: "mimo",
    name: "小米 MiMo",
    icon: "🟠",
    baseUrl: "https://api.mimo.ai/v1",
    models: [
      { id: "mimo-v2.5", name: "MiMo V2.5" },
      { id: "mimo-v2.5-pro", name: "MiMo V2.5-Pro" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入 MiMo API Key",
    keyUrl: "https://mimo.xiaomi.com",
  },
  {
    id: "qwen",
    name: "阿里 通义千问",
    icon: "🔵",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: [
      { id: "qwen-turbo", name: "Qwen-Turbo" },
      { id: "qwen-plus", name: "Qwen-Plus" },
      { id: "qwen-max", name: "Qwen-Max" },
      { id: "qwen-long", name: "Qwen-Long" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入 DashScope API Key",
    keyUrl: "https://dashscope.console.aliyun.com/",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🟢",
    baseUrl: "https://api.deepseek.com/v1",
    models: [
      { id: "deepseek-chat", name: "DeepSeek-V3" },
      { id: "deepseek-reasoner", name: "DeepSeek-R1" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入 DeepSeek API Key",
    keyUrl: "https://platform.deepseek.com/",
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    icon: "🟣",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    models: [
      { id: "glm-4-flash", name: "GLM-4-Flash" },
      { id: "glm-4", name: "GLM-4" },
      { id: "glm-4-plus", name: "GLM-4-Plus" },
      { id: "glm-4-long", name: "GLM-4-Long" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入智谱 API Key",
    keyUrl: "https://open.bigmodel.cn/",
  },
  {
    id: "baidu",
    name: "百度 文心一言",
    icon: "🔴",
    baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop",
    models: [
      { id: "ernie-speed-128k", name: "ERNIE-Speed-128K" },
      { id: "ernie-lite-8k", name: "ERNIE-Lite-8K" },
      { id: "ernie-4.0-8k", name: "ERNIE-4.0" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入百度 API Key",
    keyUrl: "https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application",
  },
  {
    id: "bytedance",
    name: "字节 豆包",
    icon: "🟡",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    models: [
      { id: "doubao-lite-4k", name: "豆包-Lite-4K" },
      { id: "doubao-pro-4k", name: "豆包-Pro-4K" },
      { id: "doubao-pro-32k", name: "豆包-Pro-32K" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入火山引擎 API Key",
    keyUrl: "https://console.volcengine.com/ark",
  },
  {
    id: "moonshot",
    name: "月之暗面 Kimi",
    icon: "⚫",
    baseUrl: "https://api.moonshot.cn/v1",
    models: [
      { id: "moonshot-v1-8k", name: "Moonshot V1 8K" },
      { id: "moonshot-v1-32k", name: "Moonshot V1 32K" },
      { id: "moonshot-v1-128k", name: "Moonshot V1 128K" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入 Moonshot API Key",
    keyUrl: "https://platform.moonshot.cn/",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "⚪",
    baseUrl: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    ],
    requiresKey: true,
    keyPlaceholder: "输入 OpenAI API Key",
    keyUrl: "https://platform.openai.com/",
  },
  {
    id: "custom",
    name: "其他大模型",
    icon: "⚙️",
    baseUrl: "",
    models: [],
    requiresKey: true,
    keyPlaceholder: "输入 API Key",
  },
];
