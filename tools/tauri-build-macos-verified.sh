#!/usr/bin/env bash
set -euo pipefail

target="${TAURI_TARGET:?TAURI_TARGET must identify the Rust target directory}"

npm run tauri -- "$@"
bash tools/verify-macos-signing.sh "src-tauri/target/$target"
