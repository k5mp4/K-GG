#!/usr/bin/env bash
set -euo pipefail

target_root="${1:?usage: verify-macos-signing.sh <target-root>}"
bundle_root="$target_root/release/bundle"
app_path="$(find "$bundle_root/macos" -maxdepth 1 -type d -name '*.app' -print -quit)"
dmg_path="$(find "$bundle_root/dmg" -maxdepth 1 -type f -name '*.dmg' -print -quit)"

verify_adhoc_app() {
  local path="$1"
  local details

  echo "Verifying ad-hoc signature: $path"
  codesign --verify --deep --strict --verbose=2 "$path"
  details="$(codesign -dv --verbose=4 "$path" 2>&1)"
  printf '%s\n' "$details"

  if [[ "$details" != *"Signature=adhoc"* ]]; then
    echo "Expected an ad-hoc signature on $path" >&2
    exit 1
  fi
}

if [[ -z "$app_path" ]]; then
  echo "No macOS .app bundle found under $bundle_root/macos" >&2
  exit 1
fi

if [[ -z "$dmg_path" ]]; then
  echo "No macOS .dmg found under $bundle_root/dmg" >&2
  exit 1
fi

verify_adhoc_app "$app_path"

mount_point="$(mktemp -d "${TMPDIR:-/tmp}/kgg-dmg.XXXXXX")"
mounted=false

cleanup() {
  if [[ "$mounted" == true ]]; then
    hdiutil detach "$mount_point" >/dev/null 2>&1 || true
  fi
  rmdir "$mount_point" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Mounting DMG for embedded app verification: $dmg_path"
hdiutil attach "$dmg_path" -nobrowse -readonly -mountpoint "$mount_point" >/dev/null
mounted=true

dmg_app_path="$(find "$mount_point" -maxdepth 1 -type d -name '*.app' -print -quit)"
if [[ -z "$dmg_app_path" ]]; then
  echo "No .app bundle found inside $dmg_path" >&2
  exit 1
fi

verify_adhoc_app "$dmg_app_path"
echo "Ad-hoc signature verified for the built .app and the .app embedded in the DMG."
