use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KnowledgeDocument {
    pub id: String,
    pub name: String,
    pub doc_type: String,
    pub file_path: String,
    pub size: u64,
    pub chunks: usize,
    pub category: String,
    pub keywords: Vec<String>,
    pub indexed_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentChunk {
    pub id: String,
    pub document_id: String,
    pub chunk_index: usize,
    pub content: String,
    pub embedding: Vec<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryInfo {
    pub name: String,
    pub count: usize,
    pub keywords: Vec<String>,
}

pub struct KnowledgeBase {
    storage_path: PathBuf,
}

impl KnowledgeBase {
    pub fn new(storage_path: &str) -> Self {
        let path = PathBuf::from(storage_path);
        std::fs::create_dir_all(&path).ok();
        Self { storage_path: path }
    }

    pub fn import_document(&self, file_path: &str) -> Result<KnowledgeDocument, String> {
        let path = PathBuf::from(file_path);
        if !path.exists() {
            return Err(format!("文件不存在: {}", file_path));
        }

        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let content = self.extract_text(&path, &extension)?;
        let category = self.detect_category(&path, &content);
        let keywords = self.extract_keywords(&path, &content, &category);

        let chunks = self.chunk_text(&content, 500, 50);
        let doc_id = Uuid::new_v4().to_string();
        let doc_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let doc = KnowledgeDocument {
            id: doc_id.clone(),
            name: doc_name,
            doc_type: extension,
            file_path: file_path.to_string(),
            size: content.len() as u64,
            chunks: chunks.len(),
            category,
            keywords,
            indexed_at: chrono::Utc::now().timestamp(),
        };

        self.save_document(&doc)?;
        for (i, chunk_content) in chunks.iter().enumerate() {
            let chunk = DocumentChunk {
                id: Uuid::new_v4().to_string(),
                document_id: doc_id.clone(),
                chunk_index: i,
                content: chunk_content.clone(),
                embedding: self.simple_embed(chunk_content),
            };
            self.save_chunk(&chunk)?;
        }

        Ok(doc)
    }

    fn extract_text(&self, path: &PathBuf, extension: &str) -> Result<String, String> {
        match extension {
            "txt" | "md" | "markdown" => {
                std::fs::read_to_string(path).map_err(|e| format!("读取文件失败: {}", e))
            }
            "pdf" => self.extract_pdf_text(path),
            "docx" => self.extract_docx_text(path),
            "xlsx" | "xls" => self.extract_xlsx_text(path),
            _ => Err(format!("不支持的文件格式: {}", extension)),
        }
    }

    fn extract_pdf_text(&self, path: &PathBuf) -> Result<String, String> {
        let data = std::fs::read(path).map_err(|e| format!("读取PDF文件失败: {}", e))?;

        let mut text = String::new();
        let mut i = 0;
        let bytes = data.as_slice();

        while i < bytes.len() {
            if i + 5 < bytes.len()
                && bytes[i] == b's'
                && bytes[i + 1] == b't'
                && bytes[i + 2] == b'r'
                && bytes[i + 3] == b'e'
                && bytes[i + 4] == b'a'
                && bytes[i + 5] == b'm'
            {
                if let Some(end) = find_stream_end(&bytes[i..]) {
                    let stream_data = &bytes[i + 7..i + end];
                    if let Ok(s) = std::str::from_utf8(stream_data) {
                        for line in s.lines() {
                            let cleaned = line.trim();
                            if !cleaned.is_empty()
                                && !cleaned.starts_with('/')
                                && !cleaned.starts_with('[')
                                && !cleaned.starts_with('<')
                                && cleaned.len() > 2
                            {
                                let decoded = cleaned
                                    .replace("\\(", "(")
                                    .replace("\\)", ")")
                                    .replace("\\n", "\n");
                                text.push_str(&decoded);
                                text.push(' ');
                            }
                        }
                    }
                }
            }
            i += 1;
        }

        if text.trim().is_empty() {
            text = format!("PDF文档: {}", path.file_name().unwrap_or_default().to_string_lossy());
        }

        Ok(text)
    }

    fn extract_docx_text(&self, path: &PathBuf) -> Result<String, String> {
        let file = std::fs::File::open(path).map_err(|e| format!("打开DOCX文件失败: {}", e))?;
        let mut archive =
            zip::ZipArchive::new(file).map_err(|e| format!("读取DOCX文件失败: {}", e))?;

        let mut text = String::new();

        if let Ok(mut xml_file) = archive.by_name("word/document.xml") {
            let mut contents = String::new();
            std::io::Read::read_to_string(&mut xml_file, &mut contents)
                .map_err(|e| format!("读取document.xml失败: {}", e))?;

            let doc = roxmltree::Document::parse(&contents)
                .map_err(|e| format!("解析XML失败: {}", e))?;

            for node in doc.descendants() {
                if node.tag_name().name() == "t" {
                    if let Some(t) = node.text() {
                        text.push_str(t);
                    }
                }
                if node.tag_name().name() == "tab" {
                    text.push('\t');
                }
                if node.tag_name().name() == "br" {
                    text.push('\n');
                }
            }
        }

        if text.trim().is_empty() {
            text = format!(
                "DOCX文档: {}",
                path.file_name().unwrap_or_default().to_string_lossy()
            );
        }

        Ok(text)
    }

    fn extract_xlsx_text(&self, path: &PathBuf) -> Result<String, String> {
        use calamine::{open_workbook, Reader, Xlsx};

        let mut workbook: Xlsx<_> =
            open_workbook(path).map_err(|e| format!("打开XLSX文件失败: {}", e))?;

        let mut text = String::new();

        for sheet_name in workbook.sheet_names().to_owned() {
            if let Ok(range) = workbook.worksheet_range(&sheet_name) {
                text.push_str(&format!("=== Sheet: {} ===\n", sheet_name));
                for row in range.rows() {
                    for cell in row {
                        let cell_text = match cell {
                            calamine::Data::String(s) => s.clone(),
                            calamine::Data::Float(f) => format!("{}", f),
                            calamine::Data::Int(i) => format!("{}", i),
                            calamine::Data::Bool(b) => format!("{}", b),
                            calamine::Data::Error(_) => String::new(),
                            calamine::Data::Empty => String::new(),
                            _ => String::new(),
                        };
                        if !cell_text.is_empty() {
                            text.push_str(&cell_text);
                            text.push('\t');
                        }
                    }
                    text.push('\n');
                }
            }
        }

        if text.trim().is_empty() {
            text = format!(
                "XLSX文档: {}",
                path.file_name().unwrap_or_default().to_string_lossy()
            );
        }

        Ok(text)
    }

    fn detect_category(&self, path: &PathBuf, content: &str) -> String {
        let path_str = path.to_string_lossy().to_lowercase();
        let content_lower = content.to_lowercase();

        let categories = vec![
            ("刷写", vec!["刷写", "flash", "reprogram", "ota", "升级", "firmware", "编程"]),
            ("诊断", vec!["诊断", "diagnostic", "uds", "dtc", "故障", "错误码", "nrc", "obd"]),
            ("通讯", vec!["通讯", "can", "lin", "ethernet", "someip", "doip", "报文", "信号", "message"]),
            ("网络管理", vec!["网络管理", "network", "nm", "唤醒", "休眠", "autosar", "模式"]),
            ("路由", vec!["路由", "routing", "网关", "gateway", "转发", "路由表"]),
            ("标定", vec!["标定", "calibration", "参数", "parameter", "配置", "config"]),
            ("测试", vec!["测试", "test", "验证", "validation", "用例", "case"]),
            ("规范", vec!["规范", "specification", "标准", "standard", "iso", "协议"]),
        ];

        for (category, keywords) in &categories {
            for keyword in keywords {
                if path_str.contains(keyword) || content_lower.contains(keyword) {
                    return category.to_string();
                }
            }
        }

        if let Some(parent) = path.parent() {
            let parent_name = parent
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_lowercase();
            for (category, keywords) in &categories {
                for keyword in keywords {
                    if parent_name.contains(keyword) {
                        return category.to_string();
                    }
                }
            }
        }

        "其他".to_string()
    }

    fn extract_keywords(&self, path: &PathBuf, content: &str, category: &str) -> Vec<String> {
        let mut keywords = Vec::new();
        let path_str = path.to_string_lossy().to_lowercase();
        let content_lower = content.to_lowercase();

        keywords.push(category.to_string());

        let keyword_patterns = vec![
            "uds", "can", "lin", "ethernet", "someip", "doip", "autosar",
            "flash", "ota", "dtc", "nm", "obd", "iso", "diag",
            "刷写", "诊断", "通讯", "路由", "网络管理", "标定", "测试",
        ];

        for pattern in &keyword_patterns {
            if path_str.contains(pattern) || content_lower.contains(pattern) {
                if !keywords.contains(&pattern.to_string()) {
                    keywords.push(pattern.to_string());
                }
            }
        }

        if let Some(file_stem) = path.file_stem() {
            let name = file_stem.to_string_lossy().to_lowercase();
            for part in name.split(|c: char| !c.is_alphanumeric()) {
                if part.len() >= 3 && !keywords.contains(&part.to_string()) {
                    keywords.push(part.to_string());
                }
            }
        }

        keywords.truncate(10);
        keywords
    }

    fn chunk_text(&self, text: &str, chunk_size: usize, overlap: usize) -> Vec<String> {
        let mut chunks = Vec::new();
        let chars: Vec<char> = text.chars().collect();
        let mut start = 0;

        while start < chars.len() {
            let end = std::cmp::min(start + chunk_size, chars.len());
            let chunk: String = chars[start..end].iter().collect();
            chunks.push(chunk);

            if end == chars.len() {
                break;
            }
            start += chunk_size - overlap;
        }

        chunks
    }

    fn simple_embed(&self, text: &str) -> Vec<f32> {
        let mut embedding = vec![0.0f32; 128];
        let bytes = text.as_bytes();

        for (i, &byte) in bytes.iter().enumerate() {
            embedding[i % 128] += byte as f32;
        }

        let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if norm > 0.0 {
            for x in embedding.iter_mut() {
                *x /= norm;
            }
        }

        embedding
    }

    fn save_document(&self, doc: &KnowledgeDocument) -> Result<(), String> {
        let docs_path = self.storage_path.join("documents.json");
        let mut docs: Vec<KnowledgeDocument> = if docs_path.exists() {
            let content = std::fs::read_to_string(&docs_path)
                .map_err(|e| format!("读取文档列表失败: {}", e))?;
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            Vec::new()
        };

        docs.push(doc.clone());
        let json =
            serde_json::to_string_pretty(&docs).map_err(|e| format!("序列化失败: {}", e))?;
        std::fs::write(&docs_path, json).map_err(|e| format!("保存文档列表失败: {}", e))?;

        Ok(())
    }

    fn save_chunk(&self, chunk: &DocumentChunk) -> Result<(), String> {
        let chunks_dir = self.storage_path.join("chunks");
        std::fs::create_dir_all(&chunks_dir).ok();

        let chunk_file = chunks_dir.join(format!("{}.json", chunk.id));
        let json = serde_json::to_string(chunk).map_err(|e| format!("序列化失败: {}", e))?;
        std::fs::write(&chunk_file, json).map_err(|e| format!("保存分块失败: {}", e))?;

        Ok(())
    }

    pub fn get_documents(&self) -> Result<Vec<KnowledgeDocument>, String> {
        let docs_path = self.storage_path.join("documents.json");
        if !docs_path.exists() {
            return Ok(Vec::new());
        }

        let content = std::fs::read_to_string(&docs_path)
            .map_err(|e| format!("读取文档列表失败: {}", e))?;
        let docs: Vec<KnowledgeDocument> = serde_json::from_str(&content).unwrap_or_default();

        Ok(docs)
    }

    pub fn get_categories(&self) -> Result<Vec<CategoryInfo>, String> {
        let docs = self.get_documents()?;
        let mut category_map: HashMap<String, (usize, Vec<String>)> = HashMap::new();

        for doc in &docs {
            let entry = category_map
                .entry(doc.category.clone())
                .or_insert((0, Vec::new()));
            entry.0 += 1;
            for kw in &doc.keywords {
                if !entry.1.contains(kw) {
                    entry.1.push(kw.clone());
                }
            }
        }

        let mut categories: Vec<CategoryInfo> = category_map
            .into_iter()
            .map(|(name, (count, keywords))| CategoryInfo {
                name,
                count,
                keywords,
            })
            .collect();

        categories.sort_by(|a, b| b.count.cmp(&a.count));
        Ok(categories)
    }

    pub fn delete_document(&self, doc_id: &str) -> Result<(), String> {
        let docs_path = self.storage_path.join("documents.json");
        if !docs_path.exists() {
            return Ok(());
        }

        let content = std::fs::read_to_string(&docs_path)
            .map_err(|e| format!("读取文档列表失败: {}", e))?;
        let mut docs: Vec<KnowledgeDocument> = serde_json::from_str(&content).unwrap_or_default();

        docs.retain(|d| d.id != doc_id);

        let json =
            serde_json::to_string_pretty(&docs).map_err(|e| format!("序列化失败: {}", e))?;
        std::fs::write(&docs_path, json).map_err(|e| format!("保存文档列表失败: {}", e))?;

        let chunks_dir = self.storage_path.join("chunks");
        if chunks_dir.exists() {
            for entry in
                std::fs::read_dir(&chunks_dir).map_err(|e| format!("读取分块目录失败: {}", e))?
            {
                let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("json") {
                    let chunk_content = std::fs::read_to_string(&path)
                        .map_err(|e| format!("读取分块失败: {}", e))?;
                    if let Ok(chunk) = serde_json::from_str::<DocumentChunk>(&chunk_content) {
                        if chunk.document_id == doc_id {
                            std::fs::remove_file(&path).ok();
                        }
                    }
                }
            }
        }

        Ok(())
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<(DocumentChunk, f32)>, String> {
        let query_embedding = self.simple_embed(query);
        let chunks_dir = self.storage_path.join("chunks");

        if !chunks_dir.exists() {
            return Ok(Vec::new());
        }

        let mut results: Vec<(DocumentChunk, f32)> = Vec::new();

        for entry in
            std::fs::read_dir(&chunks_dir).map_err(|e| format!("读取分块目录失败: {}", e))?
        {
            let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                let content = std::fs::read_to_string(&path)
                    .map_err(|e| format!("读取分块失败: {}", e))?;
                if let Ok(chunk) = serde_json::from_str::<DocumentChunk>(&content) {
                    let similarity = cosine_similarity(&query_embedding, &chunk.embedding);
                    results.push((chunk, similarity));
                }
            }
        }

        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(limit);

        Ok(results)
    }

    pub fn search_by_category(
        &self,
        query: &str,
        category: &str,
        limit: usize,
    ) -> Result<Vec<(DocumentChunk, f32)>, String> {
        let docs = self.get_documents()?;
        let category_doc_ids: Vec<String> = docs
            .iter()
            .filter(|d| d.category == category)
            .map(|d| d.id.clone())
            .collect();

        let query_embedding = self.simple_embed(query);
        let chunks_dir = self.storage_path.join("chunks");

        if !chunks_dir.exists() {
            return Ok(Vec::new());
        }

        let mut results: Vec<(DocumentChunk, f32)> = Vec::new();

        for entry in
            std::fs::read_dir(&chunks_dir).map_err(|e| format!("读取分块目录失败: {}", e))?
        {
            let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                let content = std::fs::read_to_string(&path)
                    .map_err(|e| format!("读取分块失败: {}", e))?;
                if let Ok(chunk) = serde_json::from_str::<DocumentChunk>(&content) {
                    if category_doc_ids.contains(&chunk.document_id) {
                        let similarity = cosine_similarity(&query_embedding, &chunk.embedding);
                        results.push((chunk, similarity));
                    }
                }
            }
        }

        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(limit);

        Ok(results)
    }

    pub fn scan_directory(&self, dir_path: &str) -> Result<Vec<KnowledgeDocument>, String> {
        let root = PathBuf::from(dir_path);
        if !root.exists() || !root.is_dir() {
            return Err(format!("目录不存在: {}", dir_path));
        }

        let existing_docs = self.get_documents().unwrap_or_default();
        let existing_paths: std::collections::HashSet<String> =
            existing_docs.iter().map(|d| d.file_path.clone()).collect();

        let mut new_docs = Vec::new();
        let supported_extensions: std::collections::HashSet<&str> =
            ["txt", "md", "markdown", "pdf", "docx", "xlsx", "xls"]
                .iter()
                .cloned()
                .collect();

        for entry in WalkDir::new(&root)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let file_path = entry.path();
            let extension = file_path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();

            if !supported_extensions.contains(extension.as_str()) {
                continue;
            }

            let path_str = file_path.to_string_lossy().to_string();
            if existing_paths.contains(&path_str) {
                continue;
            }

            match self.import_document(&path_str) {
                Ok(doc) => new_docs.push(doc),
                Err(e) => eprintln!("跳过文件 {}: {}", path_str, e),
            }
        }

        Ok(new_docs)
    }

    pub fn rescan_directory(&self, dir_path: &str) -> Result<Vec<KnowledgeDocument>, String> {
        self.clear_all()?;
        self.scan_directory(dir_path)
    }

    fn clear_all(&self) -> Result<(), String> {
        let docs_path = self.storage_path.join("documents.json");
        if docs_path.exists() {
            std::fs::remove_file(&docs_path).map_err(|e| format!("删除文档列表失败: {}", e))?;
        }

        let chunks_dir = self.storage_path.join("chunks");
        if chunks_dir.exists() {
            std::fs::remove_dir_all(&chunks_dir)
                .map_err(|e| format!("删除分块目录失败: {}", e))?;
        }

        Ok(())
    }
}

fn find_stream_end(data: &[u8]) -> Option<usize> {
    let end_marker = b"endstream";
    for i in 0..data.len().saturating_sub(end_marker.len()) {
        if &data[i..i + end_marker.len()] == end_marker {
            return Some(i);
        }
    }
    None
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot_product / (norm_a * norm_b)
}
