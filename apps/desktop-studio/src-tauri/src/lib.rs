use std::{env, fs, path::PathBuf};

use tauri::Manager;

fn adapter_token_path() -> Result<PathBuf, String> {
    let home = env::var_os("HOME")
        .or_else(|| env::var_os("USERPROFILE"))
        .ok_or_else(|| "Home directory is unavailable; cannot locate adapter auth token".to_string())?;

    Ok(PathBuf::from(home)
        .join(".hermes-local-shell")
        .join("runtime")
        .join("token"))
}

#[tauri::command]
fn get_adapter_auth_token() -> Result<String, String> {
    for key in ["HERMES_STUDIO_ADAPTER_TOKEN", "HERMES_STUDIO_TOKEN"] {
        if let Ok(token) = env::var(key) {
            let trimmed = token.trim();
            if !trimmed.is_empty() {
                return Ok(trimmed.to_string());
            }
        }
    }

    let path = adapter_token_path()?;
    let token = fs::read_to_string(&path)
        .map_err(|err| format!("Adapter auth token unavailable at {}: {err}", path.display()))?;
    let trimmed = token.trim();
    if trimmed.is_empty() {
        return Err(format!("Adapter auth token file is empty: {}", path.display()));
    }

    Ok(trimmed.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_adapter_auth_token])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
