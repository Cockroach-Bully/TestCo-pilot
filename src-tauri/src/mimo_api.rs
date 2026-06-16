/**
 * mimo_api 模块
 * 职责：与大模型 API 进行交互，包括聊天完成和连接测试
 * 模块：mimo_api
 */

use crate::ChatMessage;
use reqwest::Client;
use serde_json::{json, Value};

/// 全局 HTTP 客户端（复用连接池）
static CLIENT: std::sync::OnceLock<Client> = std::sync::OnceLock::new();

/// 系统提示词：定义 AI 对话原则
const SYSTEM_PROMPT: &str = r#"你是 TestCo-pilot 智能测试助手，专注于测试报告分析和知识库问答。

你必须严格遵循以下原则：

1. **知之为知之，不知为不知**：不允许自行编造回答。如果不确定或不知道答案，必须明确告知用户。

2. **有据可依**：所有回答必须有事实依据或资料支撑。每次给出结论时，需要告知相对应的支持来源（如：知识库文档名称、规范条款、标准编号等）。

3. **主动求助**：如果无法给出相应的回答，必须反问提出需求，告知用户需要提供什么信息来帮助进行问题分析。例如：
   - "我需要查看更多相关的测试日志才能分析这个问题"
   - "请提供对应的规范文档，以便我给出准确的结论"
   - "这个问题需要结合具体的 CAN 报文数据来判断"

4. **专业严谨**：作为测试助手，回答必须专业、准确、严谨，避免模糊或不确定的表述。

5. **结构清晰**：回答使用 Markdown 格式，便于阅读和理解。"#;

/// 获取全局 HTTP 客户端实例
fn get_client() -> &'static Client {
    CLIENT.get_or_init(|| Client::new())
}

/**
 * 调用大模型聊天完成接口
 *
 * @param api_key     API 密钥
 * @param api_base_url API 基础地址
 * @param model       模型名称
 * @param messages    对话历史消息
 * @return 模型回复内容，或错误信息
 */
pub async fn chat_completion(
    api_key: &str,
    api_base_url: &str,
    model: &str,
    messages: &[ChatMessage],
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let client = get_client();
    let url = format!("{}/chat/completions", api_base_url);

    // 构建消息列表，注入系统提示词
    let mut messages_json: Vec<Value> = vec![
        json!({
            "role": "system",
            "content": SYSTEM_PROMPT
        })
    ];

    // 添加用户对话历史
    for m in messages {
        messages_json.push(json!({
            "role": m.role,
            "content": m.content
        }));
    }

    let body = json!({
        "model": model,
        "messages": messages_json,
        "temperature": 0.7,
        "max_tokens": 2048,
    });

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API 请求失败 ({}): {}", status, error_text).into());
    }

    let result: Value = response.json().await?;

    let content = result
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or("API 返回格式异常：无法解析响应内容")?
        .to_string();

    Ok(content)
}

/**
 * 测试 API 连接是否可用
 *
 * @param api_key      API 密钥
 * @param api_base_url API 基础地址
 * @return 连接是否成功
 */
pub async fn test_connection(
    api_key: &str,
    api_base_url: &str,
) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let client = get_client();
    let url = format!("{}/models", api_base_url);

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await?;

    Ok(response.status().is_success())
}
