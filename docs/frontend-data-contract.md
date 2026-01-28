# フロント データ契約（TanStack Router / Query）

このドキュメントは「画面が何のデータを読み、何を更新し、どの権限で動くか」を固定します。
実装は **TanStack Query 経由のみ** でデータを扱う前提です。

---

## 共通ルール

### 1. Query Key 命名
- ドメイン名を先頭に置く
- 画面単位のキーは現在の実装に合わせる（配列 + 引数）
- 例
  - `['attendance', 2026, 1]`
  - `['holidays', 2026, 1]`
  - `['work-rule', 'me']`
  - `['punches', '2026-01-27']`

### 2. Mutation 後の整合性
- 原則：**成功したら invalidate**
- 打刻や修正打刻は **invalidate → 最新取得** を優先

### 3. エラーハンドリング
- UI表示：短いユーザー向けメッセージ（例「保存に失敗しました。再度お試しください」）
- ログ：HTTP status / requestId を含める
- 429 はバックオフ/リトライ（上限回数）を共通設定

### 4. データスコープ（権限）
- 本人：自分のデータのみ（基本）
- 管理者：SharePoint の権限に依存（必要最小限）

---

## Query Key 一覧（現行）
- `['attendance', year, month]`
- `['holidays', year, month]`
- `['work-rule', 'me']`
- `['work-rule', 'columns']`
- `['punches', date]`
- `['work-categories']`
- `['sharepoint-sites-search', keyword]`
- `['sharepoint-lists', siteId]`

---

## 画面別データ契約

> ここに書かれた QueryKey / invalidate / 権限 が実装の正。
> 実装が先に変わる場合はこのドキュメントを更新する。

### 画面: `/dashboard`

**目的**
- 今日の状態と今月サマリを表示

**Query**
- attendance（当月）: `['attendance', year, month]`
- holidays（当月）: `['holidays', year, month]`
- work-rule（本人）: `['work-rule', 'me']`

**挙動**
- 監視更新はユーザー操作（再読み込み）で実施
- 祝日取得失敗時は警告表示し、土日判定のみで集計

---

### 画面: `/punch`

**目的**
- 当日の出勤/退勤打刻と履歴表示

**Query**
- punches（当日）: `['punches', date]`

**Mutation**
- createPunch（出勤/退勤）
  - 成功時: `invalidateQueries(['punches', date])`

---

### 画面: `/attendance`

**目的**
- 当月の勤怠一覧（修正打刻含む）

**Query**
- attendance（当月）: `['attendance', year, month]`
- holidays（当月）: `['holidays', year, month]`
- work-categories: `['work-categories']`

**Mutation**
- 修正打刻（createPunch）
  - 成功時: `invalidateQueries(['attendance', year, month])`
- 勤務区分更新（updateAttendanceCategory）
  - 成功時: `invalidateQueries(['attendance', year, month])`

---

### 画面: `/settings/sharepoint`

**目的**
- siteId / listId の確認とコピー

**Query**
- site 検索: `['sharepoint-sites-search', keyword]`
- list 一覧: `['sharepoint-lists', siteId]`

**Mutation**
- resolveSiteByUrl（URLから siteId を取得）

---

### 画面: `/settings/work-rule`

**目的**
- 勤務ルール（本人）の参照/更新

**Query**
- work-rule（本人）: `['work-rule', 'me']`
- work-rule 列情報: `['work-rule', 'columns']`

**Mutation**
- saveMyWorkRule
  - 成功時: `invalidateQueries(['work-rule', 'me'])`

---

### 画面: `/login`, `/about`

**目的**
- ログイン/説明表示のみ（データ取得なし）

---

## 将来拡張（未実装）
- 承認フロー（申請/承認/差戻し）
- 勤務表PDFの出力

## 関連ドキュメント
- [attendance-summary.md](attendance-summary.md)
- [holiday-calendar-google.md](holiday-calendar-google.md)
