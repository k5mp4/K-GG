---
title: README用ビジュアル素材仕様
description: READMEに掲載するオーナー提供ビジュアルの要件と承認チェックリスト
---

# README用ビジュアル素材仕様

この文書は、READMEの冒頭に掲載するプロジェクト公式ビジュアルの受け入れ条件を定義します。現時点では、オーナーから最終素材が提供・承認されていないため、READMEには画像リンクを置いていません。

This brief defines the requirements for the official project visual shown near the top of `README.md`. The asset is intentionally pending owner delivery and approval.

## Required asset / 必要素材

### README hero output

| Item | Requirement |
| --- | --- |
| Purpose | Show the kind of gradient, texture, or motion-ready output K-GG creates within a few seconds of opening the repository. |
| Content | A representative final output made with K-GG; a generated placeholder, stock image, or UI-only screenshot is not sufficient. |
| UI visibility | Prefer the rendered result without editor chrome. A small caption or credit can be added if the owner requests it. |
| Format | PNG or WebP. A still image is preferred for the first README version; avoid a large GIF or video. |
| Suggested size | 16:9, approximately 1920×1080 or larger, with enough contrast for both light and dark GitHub themes. |
| Repository path | `docs/assets/readme/` (create the directory when the approved file is supplied). Do not scatter README media in the repository root. |
| Approval | The project owner must confirm the exact file, crop, credit, and permission to publish it in the public repository. |

## Recommended registration / 推奨登録内容

The first README image should be one finished 16:9 still generated with K-GG: a Mesh or Bezier gradient with two or three restrained effect stages, such as Diffuse, Noise, Glass, or Slit. It should show the rendered output without editor chrome, imported third-party imagery, explanatory text, or a product comparison. This makes the image communicate the visual result immediately while remaining safe to publish as a project-owned example.

最初にREADMEへ登録する画像は、K-GGで実際に生成した16:9の完成静止画を推奨します。MeshまたはBezierのグラデーションに、Diffuse、Noise、Glass、Slitなどのエフェクトを2〜3個だけ重ね、編集画面ではなくレンダリング結果を見せます。第三者画像、説明用テキスト、製品比較の画面は含めません。プロジェクト所有の作例として公開しやすく、開いた直後にビジュアルの方向性が伝わる構成です。

Suggested registration details:

| Item | Recommendation |
| --- | --- |
| Candidate output | Blue-to-violet Mesh gradient with subtle Diffuse and Noise, optionally a restrained Glass or Slit treatment. |
| File | `docs/assets/readme/k-gg-hero.webp` |
| Canvas | 1920×1080 or larger, 16:9, optimized WebP or PNG. |
| Japanese alt text | `K-GGで生成した青紫のメッシュグラデーション` |
| English alt text | `Blue and violet mesh gradient generated with K-GG` |

登録時は、実際の出力の色・構成に合わせてalt textを調整し、オーナーがファイル、切り抜き、クレジット、公開許可を確認してから`README.md`と`README.en.md`の両方へ同じ画像を追加します。

## Placement / 配置

Place the approved visual below the opening description and primary project links, before **What can you make?**. Keep the existing text links usable when images are blocked or unavailable.

承認済みの画像は、README冒頭の説明と主要リンクの直後、**What can you make?** の前に配置します。画像が表示されない場合でも、テキストリンクだけで利用開始できる状態を維持します。

When the asset is supplied, update `README.md` and `README.en.md`, and add short alt text in each language that describes the output rather than the editor interface. Then run the README link and documentation checks before publishing.

素材が提供されたら、`README.md`と`README.en.md`を更新し、編集画面ではなく出力内容を説明する各言語の短いalt textを付けます。その後、READMEのリンク確認とドキュメント検証を実行してから公開します。

## Owner handoff checklist / オーナー引き継ぎチェックリスト

- [ ] The file is an actual K-GG output or an owner-approved capture of one.
- [ ] The crop and visual treatment represent the project accurately.
- [ ] Any creator, source, or third-party attribution is known and can be included.
- [ ] Public-repository redistribution is permitted.
- [ ] The file is optimized for repository size and GitHub rendering.
- [ ] The owner has approved the final README placement and alt text.
