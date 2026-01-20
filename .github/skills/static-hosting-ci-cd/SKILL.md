---
name: static-hosting-ci-cd
description: CSR前提のフロントを静的ホスティングで配信する。GitHub Pages と Cloudflare Pages の比較、環境変数、ビルド/デプロイ、プレビュー運用を整備する時に使う。
license: MIT
---

# Static Hosting & CI/CD Skill

## 目的
勤怠システムのフロント（CSR）を、静的ホスティングで安全に運用するためのCI/CDと運用ルールを整える。

## 進め方
1. どこに置くか（候補比較の観点）
   - 認証連携（SSOリダイレクト、ドメイン）
   - プレビュー（PRごとのPreview環境）
   - キャッシュ/配信（CDN）
   - Secrets/環境変数管理
2. デプロイ方式
   - main へのマージで staging
   - tag で production（リリース管理）
3. 失敗時の切り戻し
   - 前のタグに戻す運用
4. セキュリティ
   - CSP、X-Frame-Options相当、APIのCORS、トークン保護

## 成果物
- GitHub Pages / Cloudflare Pages のメリデメ比較（箇条書き）
- 推奨構成（dev/stg/prodの出し分け）
- CI/CDワークフロー案（どのイベントで何をするか）

## 依頼例
- 「GitHub PagesとCloudflare Pagesのメリデメを、勤怠システム前提で整理して」
- 「タグで本番リリースするCI/CD案を作って」
