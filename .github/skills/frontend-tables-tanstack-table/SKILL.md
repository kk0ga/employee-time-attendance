---
name: frontend-tables-tanstack-table
description: 'TanStack Table で勤怠一覧/勤務表を作る。列定義、ソート/フィルタ、ページング、集計行、アクセシビリティ、CSV出力の型を固定する。キーワード: TanStack Table, table, columns, sorting, filtering, CSV'
license: MIT
---

# TanStack Table Skill

## 目的
勤怠の一覧UI（勤務表、承認一覧）を“同じ操作感”で提供する。

## 標準機能（まずはこれだけ）
- 列：日付/曜日/出勤/退勤/休憩/実働/備考
- ソート：日付
- フィルタ：yearMonth（必須）、status（承認一覧）
- 行：空値の表示ルール（-- など）

## 実装ルール
- 列定義は feature 配下に置き、再利用する
- 表示用フォーマット（時刻/分→時間）を共通化
- 大量行は仮想化を検討（必要になってから）

## 成果物
- 列定義（TS）
- フィルタUI仕様
- CSV出力のカラム対応表

## 依頼例
- 「勤務表の列定義と表示フォーマットを統一したい」
- 「承認一覧に status フィルタを付けたい」

## References
- [docs/frontend-data-contract.md](../../../docs/frontend-data-contract.md)
