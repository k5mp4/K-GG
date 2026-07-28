# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 InputAngle | browser manual / build | `src/App.css`, `src/components/SliderField.tsx`, `src/components/TimelineBar.tsx` | pass |
| AC-002 Seed alignment | browser manual / build | `src/components/NoiseDistortionPanel.tsx`, `src/components/SlitScanPanel.tsx`, `src/components/StretchPanel.tsx` | pass |
| AC-003 Slit controls | browser DOM and interaction / build | `src/components/SlitScanPanel.tsx` | pass |
| AC-004 Japanese name | browser manual / test | `src/i18n/messages.ts` | pass |
| AC-005 compatibility | unit / build | existing gradient store, effect, animation tests | pass |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## Browser manual

- Vite開発サーバーを`http://127.0.0.1:5173/`で起動し、Noise、Slit、Stretchを有効化して各Seed行を確認した。
- SlitのModeにLinear / Circular / Polygon / Wave、Auto ModifierにLoop / PingPongが表示され、DOM上のTweeqコンポーネント種別を確認した。
- 日本語表示でAnimationを開き、名称が`ANIMATION`であること、方向Angleの実測サイズが112×26pxでタイムライン行の中央に揃うことを確認した。
- 通常パネルのInputAngleは幅245pxで数値欄を表示し、Noise／Slit／StretchのInputShuffleは各Seed入力欄の下端へ揃っていることを確認した。

## Command results

- `npm run docs:check` — pass（41 legacy specs、4 current specs、2 changes、13 ADRs）
- `npm run docs:build` — pass
- `npm test` — pass（44 test files、225 tests）
- `npm run lint` — pass（0 errors、既存warning 24件）
- `npm run build` — pass（既存のchunk size warning 1件）

既存warningはReact Hook依存関係・`any`・未使用catch等のlint warning、およびViteの大きなchunkに関する警告で、本変更によるエラーではない。
