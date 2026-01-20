---
name: frontend-server-state-tanstack-query
description: TanStack Query を使って勤怠データを扱う。queryKey設計、infinite/pagination、mutation、楽観更新、エラー/リトライ、キャッシュ無効化の運用を固定する。
license: MIT
---

# TanStack Query Skill

## 目的
「どこで取得して、どこで更新して、いつ再取得するか」を統一する。

## 標準パターン
- QueryKeyは docs/frontend-data-contract.md が正
- 一覧：ページング/無限スクロールのどちらかに統一（docsに明記）
- Mutation：成功時は invalidate か setQueryData で整合性を取る
- 失敗時：ユーザーに短いメッセージ＋詳細ログ

## 勤怠でよくある実装指針
- 打刻：mutation → 該当日の time_entries を即更新（setQueryData）→ 背後で invalidate
- 月次申請：status を更新 → approvals と time_entries（該当月）を invalidate
- 5分間隔反映が許容なら、refetchInterval は “必要な画面だけ” に限定

## 必須アウトプット
- queryKey一覧（timeEntries/approvals/employees）
- 主要mutation（clockIn/clockOut/submit/approve/reject）のinvalidate方針
- 429/一時失敗時のリトライ方針

## 依頼例
- 「time_entries の queryKey と invalidate 設計を決めたい」
- 「打刻は楽観更新したい。UI/データ整合性の設計を出して」
