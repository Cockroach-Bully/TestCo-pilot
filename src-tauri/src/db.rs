use crate::{ChatMessage, Conversation};
use rusqlite::{Connection, Result};
use uuid::Uuid;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = dirs::data_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("testco-pilot")
            .join("data.db");

        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(db_path)?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );",
        )?;

        Ok(Self { conn })
    }

    pub fn create_conversation(&self, title: &str) -> Result<String> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        self.conn.execute(
            "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            (&id, title, now, now),
        )?;
        Ok(id)
    }

    pub fn get_conversations(&self) -> Result<Vec<Conversation>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC",
        )?;

        let conversations = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let created_at: i64 = row.get(2)?;
                let updated_at: i64 = row.get(3)?;
                Ok(Conversation {
                    id,
                    title,
                    messages: Vec::new(),
                    created_at,
                    updated_at,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(conversations)
    }

    pub fn delete_conversation(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM messages WHERE conversation_id = ?1", (&id,))?;
        self.conn
            .execute("DELETE FROM conversations WHERE id = ?1", (&id,))?;
        Ok(())
    }

    pub fn save_message(&self, conversation_id: &str, role: &str, content: &str) -> Result<()> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        self.conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            (&id, conversation_id, role, content, now),
        )?;
        self.conn.execute(
            "UPDATE conversations SET updated_at = ?1 WHERE id = ?2",
            (now, conversation_id),
        )?;
        Ok(())
    }

    pub fn get_messages(&self, conversation_id: &str) -> Result<Vec<ChatMessage>> {
        let mut stmt = self.conn.prepare(
            "SELECT role, content FROM messages WHERE conversation_id = ?1 ORDER BY created_at",
        )?;

        let messages = stmt
            .query_map((&conversation_id,), |row| {
                let role: String = row.get(0)?;
                let content: String = row.get(1)?;
                Ok(ChatMessage { role, content })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(messages)
    }
}
