use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestReport {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub total_cases: usize,
    pub passed: usize,
    pub failed: usize,
    pub skipped: usize,
    pub fail_cases: Vec<FailCase>,
    pub analyzed_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FailCase {
    pub id: String,
    pub name: String,
    pub test_id: String,
    pub result: String,
    pub timestamp: Option<String>,
    pub request: Option<String>,
    pub expected_response: Option<String>,
    pub actual_response: Option<String>,
    pub error_message: Option<String>,
}

pub struct Analyzer {
    storage_path: PathBuf,
}

impl Analyzer {
    pub fn new(storage_path: &str) -> Self {
        let path = PathBuf::from(storage_path);
        std::fs::create_dir_all(&path).ok();
        Self { storage_path: path }
    }

    pub fn analyze_xml_report(&self, file_path: &str) -> Result<TestReport, String> {
        let path = PathBuf::from(file_path);
        if !path.exists() {
            return Err(format!("文件不存在: {}", file_path));
        }

        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("读取文件失败: {}", e))?;

        let doc = roxmltree::Document::parse(&content)
            .map_err(|e| format!("解析XML失败: {}", e))?;

        let mut fail_cases = Vec::new();
        let mut total = 0;
        let mut passed = 0;
        let mut failed = 0;
        let mut skipped = 0;

        for node in doc.descendants() {
            let tag_name = node.tag_name().name();
            if tag_name == "testcase" || tag_name == "test" || tag_name == "case" {
                total += 1;
                let result = node.attribute("result")
                    .or(node.attribute("status"))
                    .unwrap_or("unknown")
                    .to_lowercase();

                match result.as_str() {
                    "pass" | "passed" => passed += 1,
                    "fail" | "failed" => {
                        failed += 1;
                        let fail_case = FailCase {
                            id: Uuid::new_v4().to_string(),
                            name: node.attribute("name")
                                .or(node.attribute("classname"))
                                .unwrap_or("unknown")
                                .to_string(),
                            test_id: node.attribute("id")
                                .or(node.attribute("testid"))
                                .unwrap_or("")
                                .to_string(),
                            result: "fail".to_string(),
                            timestamp: node.attribute("timestamp").map(|s| s.to_string()),
                            request: self.find_child_text(&node, "request")
                                .or_else(|| self.find_child_text(&node, "input")),
                            expected_response: self.find_child_text(&node, "expected")
                                .or_else(|| self.find_child_text(&node, "expected_response")),
                            actual_response: self.find_child_text(&node, "actual")
                                .or_else(|| self.find_child_text(&node, "actual_response")),
                            error_message: self.find_child_text(&node, "error")
                                .or_else(|| self.find_child_text(&node, "message")),
                        };
                        fail_cases.push(fail_case);
                    }
                    "skip" | "skipped" => skipped += 1,
                    _ => {
                        if result.contains("fail") {
                            failed += 1;
                        } else {
                            passed += 1;
                        }
                    }
                }
            }
        }

        let report = TestReport {
            id: Uuid::new_v4().to_string(),
            name: path.file_stem()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string(),
            file_path: file_path.to_string(),
            total_cases: total,
            passed,
            failed,
            skipped,
            fail_cases,
            analyzed_at: chrono::Utc::now().timestamp(),
        };

        self.save_report(&report)?;
        Ok(report)
    }

    fn find_child_text(&self, node: &roxmltree::Node, child_name: &str) -> Option<String> {
        for child in node.children() {
            if child.tag_name().name() == child_name {
                return child.text().map(|s| s.to_string());
            }
        }
        None
    }

    pub fn extract_zip(&self, zip_path: &str) -> Result<Vec<String>, String> {
        let path = PathBuf::from(zip_path);
        if !path.exists() {
            return Err(format!("ZIP文件不存在: {}", zip_path));
        }

        let extract_dir = self.storage_path.join("extracted");
        std::fs::create_dir_all(&extract_dir).ok();

        let file = std::fs::File::open(&path)
            .map_err(|e| format!("打开ZIP文件失败: {}", e))?;
        let mut archive = zip::ZipArchive::new(file)
            .map_err(|e| format!("读取ZIP文件失败: {}", e))?;

        let mut extracted_files = Vec::new();

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)
                .map_err(|e| format!("读取ZIP条目失败: {}", e))?;

            let outpath = extract_dir.join(file.mangled_name());

            // Zip Slip 防护：确保解压路径在目标目录内
            if !outpath.starts_with(&extract_dir) {
                return Err("ZIP文件包含不安全的路径".to_string());
            }

            if file.name().ends_with('/') {
                std::fs::create_dir_all(&outpath).ok();
            } else {
                if let Some(p) = outpath.parent() {
                    std::fs::create_dir_all(p).ok();
                }
                let mut outfile = std::fs::File::create(&outpath)
                    .map_err(|e| format!("创建文件失败: {}", e))?;
                std::io::copy(&mut file, &mut outfile)
                    .map_err(|e| format!("解压文件失败: {}", e))?;

                extracted_files.push(outpath.to_string_lossy().to_string());
            }
        }

        Ok(extracted_files)
    }

    pub fn parse_blf_log(&self, file_path: &str) -> Result<Vec<CanMessage>, String> {
        let path = PathBuf::from(file_path);
        if !path.exists() {
            return Err(format!("BLF文件不存在: {}", file_path));
        }

        let content = std::fs::read(&path)
            .map_err(|e| format!("读取BLF文件失败: {}", e))?;

        let mut messages = Vec::new();
        let mut i = 0;

        while i + 20 <= content.len() {
            if content[i] == 0x42 && content[i + 1] == 0x4C {
                if i + 24 <= content.len() {
                    let timestamp = u64::from_le_bytes([
                        content[i + 8], content[i + 9], content[i + 10], content[i + 11],
                        content[i + 12], content[i + 13], content[i + 14], content[i + 15],
                    ]);

                    let can_id = u32::from_le_bytes([
                        content[i + 16], content[i + 17], content[i + 18], content[i + 19],
                    ]);

                    let dlc = content[i + 20] as usize;
                    let data_start = i + 24;
                    let data_end = data_start + dlc.min(8);

                    if data_end <= content.len() {
                        let data = content[data_start..data_end].to_vec();
                        messages.push(CanMessage {
                            timestamp,
                            can_id,
                            dlc,
                            data,
                        });
                    }
                }
                i += 24;
            } else {
                i += 1;
            }
        }

        Ok(messages)
    }

    fn save_report(&self, report: &TestReport) -> Result<(), String> {
        let reports_path = self.storage_path.join("reports.json");
        let mut reports: Vec<TestReport> = if reports_path.exists() {
            let content = std::fs::read_to_string(&reports_path)
                .map_err(|e| format!("读取报告列表失败: {}", e))?;
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            Vec::new()
        };

        reports.push(report.clone());
        let json = serde_json::to_string_pretty(&reports)
            .map_err(|e| format!("序列化失败: {}", e))?;
        std::fs::write(&reports_path, json)
            .map_err(|e| format!("保存报告列表失败: {}", e))?;

        Ok(())
    }

    pub fn get_reports(&self) -> Result<Vec<TestReport>, String> {
        let reports_path = self.storage_path.join("reports.json");
        if !reports_path.exists() {
            return Ok(Vec::new());
        }

        let content = std::fs::read_to_string(&reports_path)
            .map_err(|e| format!("读取报告列表失败: {}", e))?;
        let reports: Vec<TestReport> =
            serde_json::from_str(&content).unwrap_or_default();

        Ok(reports)
    }

    pub fn delete_report(&self, report_id: &str) -> Result<(), String> {
        let reports_path = self.storage_path.join("reports.json");
        if !reports_path.exists() {
            return Ok(());
        }

        let content = std::fs::read_to_string(&reports_path)
            .map_err(|e| format!("读取报告列表失败: {}", e))?;
        let mut reports: Vec<TestReport> =
            serde_json::from_str(&content).unwrap_or_default();

        reports.retain(|r| r.id != report_id);

        let json = serde_json::to_string_pretty(&reports)
            .map_err(|e| format!("序列化失败: {}", e))?;
        std::fs::write(&reports_path, json)
            .map_err(|e| format!("保存报告列表失败: {}", e))?;

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CanMessage {
    pub timestamp: u64,
    pub can_id: u32,
    pub dlc: usize,
    pub data: Vec<u8>,
}
