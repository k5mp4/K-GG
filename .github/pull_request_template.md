## Request source

- 種別: <!-- Issue / Direct request / AI request / CLI-MCP request / External request -->
- Issue / Request link: <!-- ない場合は「なし」 -->

## 変更分類

- [ ] Quick Change（Issue/Change Capsuleなし可）
- [ ] Tracked Change（Issueで継続追跡）
- [ ] Designed Change（必要なSpec Delta / Capsule / ADRあり）

補助分類: <!-- S / B / F / A / X -->

## 変更理由

<!-- 解決する問題と、この変更が必要な理由。 -->

## 変更内容

<!-- 実装した内容と対象外。 -->

## Source of Truth同期

- Current Spec: <!-- CURRENT-* または「なし / 変更不要」 -->
- Requirement IDs: <!-- 例: GRAD-* / EFFECT-*。なければ「なし」 -->
- 関連ADR: <!-- ADR-NNNN または「なし」 -->
- Change Capsule: <!-- docs/changes/archive/... / PR内active path / 「なし」 -->
- 同期メモ: <!-- Current Spec/ADR/利用者文書を更新したか、不要な理由 -->

## Validation

### Merge Gate

- [ ] `npm run change:check`
- [ ] `npm run check:merge`
- [ ] 変更範囲に応じた`npm run check:render` / `npm run check:native`

### Release Gate / Observation

<!--
実GPU、Tauri、FFmpeg、After Effects、installer/updater、特殊環境などを記録する。
固定GPUを実施した場合は runner/GPU adapter/driver/Windows、Chromium binary/version、Playwright、
WebGL renderer、Canvas/Effect Stack、commit SHA の証跡を添付する。Tauri UI WebDriver、実FFmpeg、
または固定GPUを実施していない場合は not-run / manual release gate と明記し、Browser/Rust/buildの
成功からpassを推測しない。
-->

## 実行したコマンドと結果

<!-- CIが実行する機械的検証の全文ではなく、コマンド・結果・警告の要約を記載。 -->

## 未確認事項 / Follow-up

<!-- 手動確認、環境依存の失敗、残る作業。必要ならIssue化する。 -->

## 影響とロールバック

- 利用者への影響:
- 互換性への影響:
- ロールバック方法:
