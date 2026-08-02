# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | component / manual | `src/components/PostprocessPanel.tsx`、ブラウザーDOM確認 | pass: GLASS V2では4項目、GLASSでは0項目 |
| AC-002 | shader parity / pixel | `src/lib/effectShaderParity.test.ts`、実機GLASS V2既定値 | pass: identity分岐で既存式を保持、既定値へ復帰可能 |
| AC-003 | unit / pixel | 色収差残差のsource parity、実機Hue=`90°` | pass: `spectralColor - baseTransmission`だけを回転 |
| AC-004 | unit / pixel | saturation clamp、shader clamp、実機`180%` | pass: `0..2`へ正規化し有限な`0..1`へ収束 |
| AC-005 | unit / pixel | shader parity、実機2色入力 | pass: TransmissionとHighlightを別uniformで反映、白はidentity |
| AC-006 | unit | `src/store/gradientStore.glass.test.ts`、`src/lib/glass.test.ts` | pass: round-trip、欠落、非有限、範囲外、無効HEXを確認 |
| AC-007 | shader parity / manual | GLASS専用source guard、GLASS編集UI、実機compile | pass: V2 uniformはlegacy specializationから除外、GLASSに新UIなし |
| AC-008 | integration / manual | 共通`PostprocessConfig`正規化・WebGL upload、Preview、PNG連番 | pass: 各形式は共通render bridgeを使用。V2単独72フレームを2回出力 |
| AC-009 | commands | 下記Commands、ブラウザーGPU確認 | pass |

## Commands

- `npm test`: pass（50 files、255 tests）
- `npm run lint`: pass（0 errors、24 warnings）
- `npm run build`: pass
- `npm run docs:check`: pass（41 legacy specs、5 current specs、4 changes、14 ADRs）
- `npm run docs:build`: pass

## 実機確認

- Windows 11、Chrome内蔵WebGL、ANGLE / NVIDIA GeForce RTX 3060 TiでGLASS V2が`APPLIED`となり、console warning/errorが0件であることを確認した。
- Hue=`90°`、Saturation=`180%`、Transmission Tint=`#80D8FF`、Highlight Tint=`#FFD080`へ変更し、プレビューと色入力表示が変化することを確認した。続けて既定値`0°`、`100%`、`#FFFFFF`、`#FFFFFF`へ復帰した。
- GLASS編集時は4つのV2専用入力がDOMに存在せず、GLASSとGLASS V2の両shaderが同じ実機で`APPLIED`となることを確認した。
- 400×400、3秒、24fps、GLASS V2単独・既定色で`CHANGE012_v2_default_A_frames.zip`と`CHANGE012_v2_default_B_frames.zip`を書き出した。両方72 PNGで、対応する全72フレームのSHA-256が一致した。
- Thumbnail、MOV、MP4を個別には生成していない。これらはPNG／PNG連番と同じ正規化済みstate、scene evaluation、WebGL render bridgeを通ることをsourceと自動テストで確認した。

## 残存警告・未確認事項

- lintの24件は既存ファイルのReact Hook依存、`any`、未使用catch変数、Fast Refreshに関するwarningで、errorは0件。今回変更したファイルに新しいlint warningはない。
- production buildには既存の500kB超chunk warningが残るが、build errorではない。
- MOV／MP4の実ファイル生成と異なるGPUでの画素比較は未実施。共通描画経路の契約と今回の変更範囲には差異を確認していない。
