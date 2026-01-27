# 祝日カレンダー（Google Calendar）オンデマンド取得

## 目的
- 「平日（土日祝を除く）」の判定に祝日を含める。
- ビルド成果物へ祝日データを同梱せず、当月分をオンデマンドでロードする。

## 方式
- Google Calendar API（Events: list）で、指定した祝日カレンダーから当月イベントを取得する。
- 取得結果（イベント）から日付（YYYY-MM-DD）→祝日名のMapを作り、UI側の判定に使う。

## キャッシュ/頻度
- 月次集計に使うため、**同月の再取得は抑える**（例: 12時間キャッシュ）
- 失敗時はリトライせず、ユーザーに短い警告を出す

## 必要な環境変数
- `VITE_GCAL_API_KEY`
  - **クライアントに埋め込まれる**ため、必ず Google Cloud 側で制限する。
- `VITE_GCAL_HOLIDAY_CALENDAR_ID`
  - 祝日カレンダーの Calendar ID。

`.env.example` も参照。

## API キーの推奨設定（重要）
- Application restrictions:
  - **HTTP referrers（ウェブサイト）**
  - 許可する参照元に GitHub Pages のURLを登録（例: `https://<owner>.github.io/<repo>/*`）
- API restrictions:
  - **Google Calendar API** のみに制限

これにより、キー流出時の悪用リスクを大幅に下げる。

## Calendar ID の確認
- Google Calendar を開く
- 対象カレンダー（祝日）を選択
- 設定（Settings and sharing）から **Calendar ID** を確認

環境によってIDが異なる場合があるため、上記手順で取得した値を使う。

## 実装位置
- 取得ロジック: [src/lib/googleCalendar/holidayCalendar.ts](../src/lib/googleCalendar/holidayCalendar.ts)
- 設定: [src/lib/googleCalendar/config.ts](../src/lib/googleCalendar/config.ts)
- 利用箇所:
  - ダッシュボード: [src/routes/Dashboard.tsx](../src/routes/Dashboard.tsx)
  - 勤怠一覧: [src/routes/Attendance.tsx](../src/routes/Attendance.tsx)

## 失敗時の扱い
- 祝日取得に失敗した場合、画面上に「祝日カレンダーの読み込みに失敗しました」を表示する。
- （現状）集計自体は表示し、祝日判定が効かない可能性がある。

## セキュリティ/コスト
- APIキーはクライアントに埋め込まれるため、必ず **HTTP referrer 制限** を設定する
- 低トラフィック前提だが、意図しないアクセス増加に備え上限を設定する

## iCal（ICS）について
- Googleカレンダーは公開ICS URLを持つが、ブラウザからの直接 fetch は **CORS で失敗**することが多い。
- バックエンドや Cloudflare Workers 等でプロキシする前提なら採用可能。
- 本リポジトリは GitHub Pages（静的）前提のため、まずは Calendar API を採用する。

## 関連ドキュメント
- [attendance-summary.md](attendance-summary.md)
