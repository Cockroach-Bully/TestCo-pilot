use std::path::PathBuf;

pub struct LocalModel {
    model_path: Option<PathBuf>,
    is_loaded: bool,
}

impl LocalModel {
    pub fn new() -> Self {
        Self {
            model_path: None,
            is_loaded: false,
        }
    }

    pub fn load_model(&mut self, path: &str) -> Result<(), String> {
        let model_path = PathBuf::from(path);

        if !model_path.exists() {
            return Err(format!("模型文件不存在: {}", path));
        }

        #[cfg(feature = "local-model")]
        {
            use llama_cpp::{LlamaModel, LlamaParams};
            let params = LlamaParams::default();
            let _model = LlamaModel::load_from_file(&model_path, params)
                .map_err(|e| format!("加载模型失败: {}", e))?;
        }

        self.model_path = Some(model_path);
        self.is_loaded = true;

        Ok(())
    }

    pub fn unload_model(&mut self) {
        self.model_path = None;
        self.is_loaded = false;
    }

    pub fn is_loaded(&self) -> bool {
        self.is_loaded
    }

    pub fn get_model_path(&self) -> Option<&PathBuf> {
        self.model_path.as_ref()
    }

    pub fn chat_completion(
        &self,
        _messages: &[(String, String)],
        _max_tokens: i32,
    ) -> Result<String, String> {
        if !self.is_loaded {
            return Err("模型未加载".to_string());
        }

        #[cfg(feature = "local-model")]
        {
            use llama_cpp::{LlamaModel, LlamaParams, SamplingParams};

            let model_path = self.model_path.as_ref()
                .ok_or("模型路径为空")?;
            let params = LlamaParams::default();
            let model = LlamaModel::load_from_file(model_path, params)
                .map_err(|e| format!("加载模型失败: {}", e))?;

            let mut prompt = String::new();
            for (role, content) in _messages {
                match role.as_str() {
                    "system" => prompt.push_str(&format!("### System:\n{}\n\n", content)),
                    "user" => prompt.push_str(&format!("### User:\n{}\n\n", content)),
                    "assistant" => prompt.push_str(&format!("### Assistant:\n{}\n\n", content)),
                    _ => {}
                }
            }
            prompt.push_str("### Assistant:\n");

            let sampling = SamplingParams::default();
            let mut ctx = model
                .create_context(sampling)
                .map_err(|e| format!("创建上下文失败: {}", e))?;

            let response = ctx
                .generate(&prompt, _max_tokens as usize)
                .map_err(|e| format!("生成失败: {}", e))?;

            Ok(response)
        }

        #[cfg(not(feature = "local-model"))]
        {
            Err("本地模型功能未启用。请安装 LLVM 并使用 --features local-model 编译。".to_string())
        }
    }
}
