# Delta

## ADDED Requirements

### DOC-001 07-28履歴bundle

2026-07-28の変更履歴は`docs/changes/archive/2026-07-28-day-bundle/`へ格納する。bundle直下の`proposal.md`を正規のCHANGE-010として扱い、元のCHANGE-002〜009は接頭辞付きの履歴スナップショットとして保持する。

### DOC-002 変更パッケージの将来運用

今後の実装は、会話ターンや日付ごとではなく、同じWhy／What／対象外／受け入れ条件に収まる依頼を1つのactive changeとして扱う。追加指示が既存changeの範囲に収まる場合は同じchangeへ追記し、独立した目的・影響・契約を持つ場合だけ新しいchangeへ分離する。

## MODIFIED Requirements

### DOC-003 変更履歴の参照

Archive indexとcurrent specの関連変更は、07-28の統合履歴をCHANGE-010として参照する。元のCHANGE-002〜009の番号は履歴スナップショット内で維持し、当時の検証単位を失わせない。

## REMOVED Requirements

なし。
