use tauri::{Emitter, RunEvent, WindowEvent, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {
            // Handle single instance
        }))
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|window, event| {
            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    println!("Window close requested for: {}", window.label());
                    
                    // For main window, close the entire app
                    if window.label() == "main" {
                        println!("Closing main window and exiting app");
                        let app = window.app_handle();
                        app.exit(0);
                    } else {
                        // For other windows, just hide them
                        let _ = window.hide();
                    }
                    // Prevent the default close behavior since we're handling it
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            RunEvent::Reopen { .. } => {
                app_handle.emit("reopen", ()).expect("failed to emit event");
            }
            _ => (),
        });
}
