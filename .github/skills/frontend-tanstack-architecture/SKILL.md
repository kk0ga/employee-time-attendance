---
name: frontend-tanstack-architecture
description: '勤怠システムのフロントを TanStack（Query/Router/Table）中心に設計・実装するための基本方針。データ取得、ルーティング、テーブル表示、エラーハンドリングの“型”を固定する。キーワード: TanStack, React, Query, Router, Table, SPA'
license: MIT
---

# Frontend TanStack Architecture Skill

## 目的
フロント実装のブレをなくし、画面追加を高速化するために、TanStackを中心に「いつも同じ作り」に揃える。

## 採用コンポーネント
- TanStack Query：サーバーステート管理（取得/更新/キャッシュ/再試行）
- TanStack Router：ルーティング（ルートローダー、検索パラメータ、認証導線）
- TanStack Table：勤怠一覧・月次集計テーブル

## 基本ルール
- サーバーデータは **必ず Query を経由**（直fetch禁止）
- 画面の入力状態はローカル or フォームで管理（Queryに混ぜない）
- 一覧は Table を正とし、ソート/フィルタ/ページングを統一
- エラーは「ユーザー向け表示」と「ログ」を分離する

## フォルダ方針（例）
- `src/api/`：fetch/Graph呼び出しなど低レベル
- `src/features/<domain>/`：time_entries / approvals など
- `src/routes/`：TanStack Router 定義
- `src/components/`：共通UI

## 依頼例
- 「打刻画面を追加したい。TanStack流の構成で最小実装の型を作って」
- 「time_entries の一覧を Table で作りたい。列定義とフィルタ方針を整理して」

## 関連スキル
- [web-design-reviewer](../web-design-reviewer/SKILL.md)
- [refactor](../refactor/SKILL.md)

## References
- [docs/frontend-data-contract.md](../../../docs/frontend-data-contract.md)
