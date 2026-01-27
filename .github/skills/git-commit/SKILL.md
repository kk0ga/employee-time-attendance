---
name: git-commit
description: '変更内容から適切にファイルを分割ステージし、読みやすいコミットメッセージでコミットする。conventional commits風の粒度調整、コミット前チェック（lint/build）を伴う作業で使う。キーワード: git commit, commit message, staging, conventional'
license: MIT
---

# Git Commit Skill

## 目的
このリポジトリで「レビューしやすい差分」を作るために、
- 論理単位で staging
- 破壊的変更の混入を防ぐ
- メッセージを一貫させる
を徹底する。

## 推奨手順
1. 変更を把握
   - `git status` / `git diff`
2. 論理単位でステージ
   - 例: 先に docs、次に config、最後にコード
3. コミット前チェック
   - `npm run lint` / `npm run build`（可能なら）
4. コミット
   - 例: `feat: add login screen` / `fix: handle 401 on graph calls`

## メッセージ指針
- 先頭に種別: `feat|fix|docs|chore|refactor|test`
- 何を変えたかが1行で分かる
- “なぜ” が必要なら本文に書く

## 依頼例
- 「今の変更を2コミットに分けて（UIとデータ層）」
- 「コミットメッセージ案を作って」

## References
- [docs/README.md](../../../docs/README.md)
