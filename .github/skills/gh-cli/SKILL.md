---
name: gh-cli
description: 'GitHub CLI（gh）でリポジトリ/Issue/PR/Actions を操作する。issue作成・PR作成・チェック確認・ログ収集・Pages設定確認など、CLIでGitHub作業を進めたい時に使う。キーワード: gh, GitHub CLI, issue, pr, actions, workflow, release, pages'
license: MIT
---

# GitHub CLI (gh)

## 目的
このリポジトリの運用（Issue/PR/Actions/Pages）を **ブラウザに依存しすぎず** 進められるようにする。

## 前提
- `gh` がインストール済みであること
- GitHub への認証が済んでいること（`gh auth status`）

## よく使うワークフロー
1. **Issue を作る**
   - 目的: 要件/バグ/タスクを先にテキスト化
   - 例: `gh issue create`（テンプレを使う）

2. **PR を確認する**
   - 例: `gh pr list` / `gh pr view <num>`
   - CI: `gh pr checks <num>`

3. **Actions の失敗を調べる**
   - 例: `gh run list` / `gh run view <id> --log`

4. **Pages を確認する**
   - 目的: GitHub Pages の設定やデプロイ状況を確認

## 注意
- 個人情報やトークンをログに貼らない
- 変更が大きい場合は、Issue→PRの順で分割する

## 依頼例
- 「ghでPRのチェック結果を確認して、失敗ログを取って」
- 「Issueをテンプレで作って、タスク分割して」

## References
- [docs/README.md](../../../docs/README.md)
