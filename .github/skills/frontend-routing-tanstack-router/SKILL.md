---
name: frontend-routing-tanstack-router
description: TanStack Router を使って画面遷移とデータロードを設計する。認証導線、ルート設計、loader、search params、エラーバウンダリの型を固定する。
license: MIT
---

# TanStack Router Skill

## 目的
画面追加時のルーティング設計を統一し、認証/権限/データロードをブレなく実装する。

## 標準ルート（例）
- `/`：ダッシュボード（今日の打刻状態）
- `/time-entries`：一覧（社員本人は自分、管理者は全体）
- `/approvals`：承認者向け（差戻し含む）
- `/reports/:yearMonth`：PDF/集計ビュー

## 設計ルール
- loaderでprefetchするQuery一覧はこのdocsに従う
- search params は型付きで扱う（年月、社員、状態フィルタ）
- 認証/権限が必要なルートは共通ガードに寄せる

## 必須アウトプット
- ルートマップ
- search param 定義（yearMonth 等）
- 画面ごとの loader で読む Query 一覧

## 依頼例
- 「承認画面のルート設計と search param を決めたい」
- 「loader で prefetch する Query 設計を提案して」
