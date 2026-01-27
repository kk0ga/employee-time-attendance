# 勤怠管理システム（React SPA + Entra ID + SharePoint）

社内15名規模を想定した、低トラフィック前提の勤怠管理アプリです。
GitHub Pages 上で動作する React SPA として、Entra ID（OIDC + PKCE）/ Microsoft Graph / SharePoint Lists を使って運用します。

## アーキテクチャ概要
- フロント: React SPA（Vite）
- 認証: Microsoft Entra ID（OIDC Authorization Code + PKCE, MSAL）
- API: Microsoft Graph
- データ: SharePoint Online Lists
- ホスティング: GitHub Pages（Hash Routing）
- 祝日: Google Calendar API（任意）

## セットアップ（devcontainer）
1. `npm ci`
2. `.env.example` を参考に `.env` を作成
3. `npm run dev`
4. VS Code Dev Containers 利用時は Ports の 5173 を開く

## 環境変数

### Entra ID / 認証
- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_TENANT_ID`
- `VITE_ENTRA_REDIRECT_URI`
- `VITE_GRAPH_SCOPES`（例: `User.Read,Sites.ReadWrite.All`）

### SharePoint / Graph
- `VITE_SP_SITE_ID`（Graph の siteId 文字列）
- `VITE_SP_PUNCH_LIST_ID`（打刻リストの listId GUID）
- `VITE_SP_ATTENDANCE_LIST_ID`（勤怠一覧リストの listId GUID）
- `VITE_SP_WORK_RULE_LIST_ID`（勤務ルールリストの listId GUID）

### 祝日（Google Calendar, 任意）
- `VITE_GCAL_API_KEY`
  - ブラウザから直接呼ぶため **必ず APIキーを HTTP referrer で制限**してください
- `VITE_GCAL_HOLIDAY_CALENDAR_ID`
  - 祝日カレンダーの Calendar ID

## 主要画面
- /login
- /dashboard
- /punch
- /attendance
- /settings/sharepoint
- /settings/work-rule
- /about

## SharePoint List 列（推奨）

### Punches（打刻）
- PunchType（1行テキスト or Choice: start/end）
- PunchDate（1行テキスト: YYYY-MM-DD）
- PunchTime（1行テキスト: HH:mm:ss）
- Note（複数行テキスト）
- UserObjectId（1行テキスト）
- UserPrincipalName（1行テキスト）

### Attendance（勤怠一覧）
- AttendanceDate（1行テキスト: YYYY-MM-DD）
- StartTime（1行テキスト: HH:mm）
- EndTime（1行テキスト: HH:mm）
- UserObjectId（1行テキスト）

### WorkRule（勤務ルール）
- UserObjectId（1行テキスト）
- UserPrincipalName（1行テキスト）
- ScheduledDailyMinutes（数値: 所定労働時間（分））
- BreakMinutes（数値: 休憩（分））
- RoundingUnitMinutes（数値: 丸め単位（分））
- RoundStart（1行テキスト or Choice: none/floor/ceil/nearest）
- RoundEnd（1行テキスト or Choice: none/floor/ceil/nearest）

## 仕様・設計ドキュメント
- [docs/README.md](docs/README.md)
- [docs/attendance-summary.md](docs/attendance-summary.md)
- [docs/frontend-data-contract.md](docs/frontend-data-contract.md)
- [docs/holiday-calendar-google.md](docs/holiday-calendar-google.md)

## 運用メモ
- SPA のため XSS 対策を最優先（危険なHTML挿入はしない）
- トークンは localStorage に永続保存しない（memory / sessionStorage を優先）
- Graph 429/503 は指数バックオフ + 上限付きリトライ
