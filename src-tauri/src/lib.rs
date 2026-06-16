use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

mod analysis;
mod db;
mod knowledge;
mod local_model;
mod mimo_api;

macro_rules! lock_or_err {
    ($mutex:expr) => {
        $mutex.lock().map_err(|e| format!("内部错误: {}", e))?
    };
}

pub struct AppState {
    pub db: Mutex<db::Database>,
    pub api_key: Mutex<String>,
    pub api_base_url: Mutex<String>,
    pub model: Mutex<String>,
    pub use_local_model: Mutex<bool>,
    pub local_model_path: Mutex<String>,
    pub local_model: Mutex<local_model::LocalModel>,
    pub knowledge_base: Mutex<knowledge::KnowledgeBase>,
    pub kb_storage_path: Mutex<String>,
    pub kb_scan_path: Mutex<String>,
    pub analyzer: Mutex<analysis::Analyzer>,
    pub report_storage_path: Mutex<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<ChatMessage>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[tauri::command]
async fn send_message(
    state: State<'_, AppState>,
    conversation_id: String,
    message: String,
) -> Result<String, String> {
    let use_local = *lock_or_err!(state.use_local_model);

    if use_local {
        send_message_local(state, conversation_id, message).await
    } else {
        send_message_online(state, conversation_id, message).await
    }
}

async fn send_message_online(
    state: State<'_, AppState>,
    conversation_id: String,
    message: String,
) -> Result<String, String> {
    let (api_key, api_base_url, model, messages) = {
        let api_key = lock_or_err!(state.api_key).clone();
        let api_base_url = lock_or_err!(state.api_base_url).clone();
        let model = lock_or_err!(state.model).clone();

        if api_key.is_empty() {
            return Err("API Key 未配置".to_string());
        }

        let db = lock_or_err!(state.db);
        let mut messages = db.get_messages(&conversation_id).unwrap_or_default();
        messages.push(ChatMessage {
            role: "user".to_string(),
            content: message.clone(),
        });

        (api_key, api_base_url, model, messages)
    };

    let response = mimo_api::chat_completion(&api_key, &api_base_url, &model, &messages)
        .await
        .map_err(|e| e.to_string())?;

    {
        let db = lock_or_err!(state.db);
        db.save_message(&conversation_id, "user", &message)
            .map_err(|e| e.to_string())?;
        db.save_message(&conversation_id, "assistant", &response)
            .map_err(|e| e.to_string())?;
    }

    Ok(response)
}

async fn send_message_local(
    state: State<'_, AppState>,
    conversation_id: String,
    message: String,
) -> Result<String, String> {
    let messages = {
        let db = lock_or_err!(state.db);
        let mut messages = db.get_messages(&conversation_id).unwrap_or_default();
        messages.push(ChatMessage {
            role: "user".to_string(),
            content: message.clone(),
        });
        messages
    };

    let model = lock_or_err!(state.local_model);
    if !model.is_loaded() {
        return Err("本地模型未加载".to_string());
    }

    let msg_tuples: Vec<(String, String)> = messages
        .iter()
        .map(|m| (m.role.clone(), m.content.clone()))
        .collect();

    let response = model.chat_completion(&msg_tuples, 2048)?;

    {
        let db = lock_or_err!(state.db);
        db.save_message(&conversation_id, "user", &message)
            .map_err(|e| e.to_string())?;
        db.save_message(&conversation_id, "assistant", &response)
            .map_err(|e| e.to_string())?;
    }

    Ok(response)
}

#[tauri::command]
fn get_conversations(state: State<'_, AppState>) -> Result<Vec<Conversation>, String> {
    let db = lock_or_err!(state.db);
    db.get_conversations().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_conversation(state: State<'_, AppState>, title: String) -> Result<String, String> {
    let db = lock_or_err!(state.db);
    db.create_conversation(&title).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_conversation(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let db = lock_or_err!(state.db);
    db.delete_conversation(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_api_config(
    state: State<'_, AppState>,
    api_key: String,
    api_base_url: String,
    model: String,
) -> Result<(), String> {
    *lock_or_err!(state.api_key) = api_key;
    *lock_or_err!(state.api_base_url) = api_base_url;
    *lock_or_err!(state.model) = model;
    Ok(())
}

#[tauri::command]
fn get_api_config(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let api_key = lock_or_err!(state.api_key).clone();
    let api_base_url = lock_or_err!(state.api_base_url).clone();
    let model = lock_or_err!(state.model).clone();
    let use_local = *lock_or_err!(state.use_local_model);
    let local_model_path = lock_or_err!(state.local_model_path).clone();
    let local_model_loaded = lock_or_err!(state.local_model).is_loaded();

    Ok(serde_json::json!({
        "api_key": api_key,
        "api_base_url": api_base_url,
        "model": model,
        "use_local_model": use_local,
        "local_model_path": local_model_path,
        "local_model_loaded": local_model_loaded,
    }))
}

#[tauri::command]
async fn test_api_connection(state: State<'_, AppState>) -> Result<bool, String> {
    let (api_key, api_base_url) = {
        let api_key = lock_or_err!(state.api_key).clone();
        let api_base_url = lock_or_err!(state.api_base_url).clone();

        if api_key.is_empty() {
            return Err("API Key 未配置".to_string());
        }

        (api_key, api_base_url)
    };

    mimo_api::test_connection(&api_key, &api_base_url)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_local_model_config(
    state: State<'_, AppState>,
    use_local: bool,
    model_path: String,
) -> Result<(), String> {
    *lock_or_err!(state.use_local_model) = use_local;
    *lock_or_err!(state.local_model_path) = model_path;
    Ok(())
}

#[tauri::command]
fn load_local_model(state: State<'_, AppState>, path: String) -> Result<bool, String> {
    let mut model = lock_or_err!(state.local_model);
    model.load_model(&path)?;
    drop(model);
    *lock_or_err!(state.local_model_path) = path;
    *lock_or_err!(state.use_local_model) = true;
    Ok(true)
}

#[tauri::command]
fn unload_local_model(state: State<'_, AppState>) -> Result<(), String> {
    let mut model = lock_or_err!(state.local_model);
    model.unload_model();
    drop(model);
    *lock_or_err!(state.use_local_model) = false;
    Ok(())
}

#[tauri::command]
fn get_local_model_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let model = lock_or_err!(state.local_model);
    let is_loaded = model.is_loaded();
    let path = model.get_model_path().map(|p| p.to_string_lossy().to_string());
    drop(model);
    let use_local = *lock_or_err!(state.use_local_model);

    Ok(serde_json::json!({
        "is_loaded": is_loaded,
        "path": path,
        "use_local": use_local,
    }))
}

#[tauri::command]
fn import_knowledge_document(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<knowledge::KnowledgeDocument, String> {
    let kb = lock_or_err!(state.knowledge_base);
    kb.import_document(&file_path)
}

#[tauri::command]
fn get_knowledge_documents(
    state: State<'_, AppState>,
) -> Result<Vec<knowledge::KnowledgeDocument>, String> {
    let kb = lock_or_err!(state.knowledge_base);
    kb.get_documents()
}

#[tauri::command]
fn delete_knowledge_document(
    state: State<'_, AppState>,
    doc_id: String,
) -> Result<(), String> {
    let kb = lock_or_err!(state.knowledge_base);
    kb.delete_document(&doc_id)
}

#[tauri::command]
fn search_knowledge(
    state: State<'_, AppState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<serde_json::Value>, String> {
    let kb = lock_or_err!(state.knowledge_base);
    let results = kb.search(&query, limit.unwrap_or(5))?;

    let json_results: Vec<serde_json::Value> = results
        .into_iter()
        .map(|(chunk, score)| {
            serde_json::json!({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "content": chunk.content,
                "score": score,
            })
        })
        .collect();

    Ok(json_results)
}

#[tauri::command]
fn set_kb_storage_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    *lock_or_err!(state.kb_storage_path) = path.clone();
    *lock_or_err!(state.knowledge_base) = knowledge::KnowledgeBase::new(&path);
    Ok(())
}

#[tauri::command]
fn get_kb_storage_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(lock_or_err!(state.kb_storage_path).clone())
}

#[tauri::command]
fn set_kb_scan_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    *lock_or_err!(state.kb_scan_path) = path;
    Ok(())
}

#[tauri::command]
fn get_kb_scan_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(lock_or_err!(state.kb_scan_path).clone())
}

#[tauri::command]
fn scan_knowledge_directory(
    state: State<'_, AppState>,
    dir_path: String,
) -> Result<Vec<knowledge::KnowledgeDocument>, String> {
    let kb = lock_or_err!(state.knowledge_base);
    kb.scan_directory(&dir_path)
}

#[tauri::command]
fn rescan_knowledge_directory(
    state: State<'_, AppState>,
    dir_path: String,
) -> Result<Vec<knowledge::KnowledgeDocument>, String> {
    let kb = lock_or_err!(state.knowledge_base);
    kb.rescan_directory(&dir_path)
}

#[tauri::command]
fn get_knowledge_categories(
    state: State<'_, AppState>,
) -> Result<Vec<knowledge::CategoryInfo>, String> {
    let kb = lock_or_err!(state.knowledge_base);
    kb.get_categories()
}

#[tauri::command]
fn search_knowledge_by_category(
    state: State<'_, AppState>,
    query: String,
    category: String,
    limit: Option<usize>,
) -> Result<Vec<serde_json::Value>, String> {
    let kb = lock_or_err!(state.knowledge_base);
    let results = kb.search_by_category(&query, &category, limit.unwrap_or(5))?;

    let json_results: Vec<serde_json::Value> = results
        .into_iter()
        .map(|(chunk, score)| {
            serde_json::json!({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "content": chunk.content,
                "score": score,
            })
        })
        .collect();

    Ok(json_results)
}

#[tauri::command]
fn analyze_xml_report(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<analysis::TestReport, String> {
    let analyzer = lock_or_err!(state.analyzer);
    analyzer.analyze_xml_report(&file_path)
}

#[tauri::command]
fn extract_zip_file(
    state: State<'_, AppState>,
    zip_path: String,
) -> Result<Vec<String>, String> {
    let analyzer = lock_or_err!(state.analyzer);
    analyzer.extract_zip(&zip_path)
}

#[tauri::command]
fn get_analysis_reports(
    state: State<'_, AppState>,
) -> Result<Vec<analysis::TestReport>, String> {
    let analyzer = lock_or_err!(state.analyzer);
    analyzer.get_reports()
}

#[tauri::command]
fn delete_analysis_report(
    state: State<'_, AppState>,
    report_id: String,
) -> Result<(), String> {
    let analyzer = lock_or_err!(state.analyzer);
    analyzer.delete_report(&report_id)
}

#[tauri::command]
fn set_report_storage_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    *lock_or_err!(state.report_storage_path) = path.clone();
    *lock_or_err!(state.analyzer) = analysis::Analyzer::new(&path);
    Ok(())
}

#[tauri::command]
fn get_report_storage_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(lock_or_err!(state.report_storage_path).clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = match db::Database::new() {
        Ok(db) => db,
        Err(e) => {
            eprintln!("数据库初始化失败: {}", e);
            std::process::exit(1);
        }
    };

    let kb_path = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("testco-pilot")
        .join("knowledge-base")
        .to_string_lossy()
        .to_string();
    let kb = knowledge::KnowledgeBase::new(&kb_path);

    let kb_scan_path = dirs::document_dir()
        .unwrap_or_else(|| dirs::data_dir().unwrap_or_else(|| std::path::PathBuf::from(".")))
        .join("TestCo-Knowledge-Base")
        .to_string_lossy()
        .to_string();

    let report_path = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("testco-pilot")
        .join("reports")
        .to_string_lossy()
        .to_string();
    let analyzer = analysis::Analyzer::new(&report_path);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            db: Mutex::new(db),
            api_key: Mutex::new(String::new()),
            api_base_url: Mutex::new("https://api.mimo.ai/v1".to_string()),
            model: Mutex::new("mimo-v2.5".to_string()),
            use_local_model: Mutex::new(false),
            local_model_path: Mutex::new(String::new()),
            local_model: Mutex::new(local_model::LocalModel::new()),
            knowledge_base: Mutex::new(kb),
            kb_storage_path: Mutex::new(kb_path),
            kb_scan_path: Mutex::new(kb_scan_path),
            analyzer: Mutex::new(analyzer),
            report_storage_path: Mutex::new(report_path),
        })
        .invoke_handler(tauri::generate_handler![
            send_message,
            get_conversations,
            create_conversation,
            delete_conversation,
            set_api_config,
            get_api_config,
            test_api_connection,
            set_local_model_config,
            load_local_model,
            unload_local_model,
            get_local_model_status,
            import_knowledge_document,
            get_knowledge_documents,
            delete_knowledge_document,
            search_knowledge,
            set_kb_storage_path,
            get_kb_storage_path,
            set_kb_scan_path,
            get_kb_scan_path,
            scan_knowledge_directory,
            rescan_knowledge_directory,
            get_knowledge_categories,
            search_knowledge_by_category,
            analyze_xml_report,
            extract_zip_file,
            get_analysis_reports,
            delete_analysis_report,
            set_report_storage_path,
            get_report_storage_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
