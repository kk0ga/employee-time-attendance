# フロント データ契約（TanStack: Router / Query / Table）

このドキュメントは「画面が何のデータを読み、何を更新し、どの権限で動くか」を1枚で固定する。
実装は **TanStack Router の loader で prefetch**し、データは **TanStack Query 経由のみ**で扱う。

---

## 共通ルール

### 1. Query Key 命名
- ドメイン名を先頭に置く
- 引数は必ずオブジェクトで持つ（順序依存を避ける）
- 例
  - `['me']`
  - `['employees', { activeOnly: true }]`
  - `['timeEntries', { employeeId, yearMonth }]`
  - `['approvals', { approverId, yearMonth, status }]`

### 2. loader と Query の関係（Router）
- 画面表示に必須な Query は、ルートの loader で `ensureQueryData / prefetchQuery` 相当の形で warm up する
- loader は「必須データ」だけに限定し、重い集計は Query の `select` / API側に寄せる

### 3. Mutation 後の整合性
- 原則：**成功したら invalidate**
- ただし打刻のように UX が重要な操作は **setQueryData（楽観 or 即時反映）+ 背後で invalidate** を許可

### 4. エラーハンドリング
- UI表示：短いユーザー向けメッセージ（例「保存に失敗しました。再度お試しください」）
- ログ：HTTP status / requestId / 対象 employeeId/yearMonth を含める
- 429 はバックオフ/リトライ（上限回数）を共通設定

### 5. データスコープ（権限）
- 本人：自分のデータのみ（employeeId = me）
- 承認者：配下メンバーの approvals / timeEntries を閲覧・承認
- 管理者：全体（必要な範囲のみ）

---

## 画面別データ契約

> ここに書かれた「QueryKey / invalidate / 権限」が実装の正。
> 実装が先に変わる場合はこのドキュメントを更新する。

---

### 画面: `/` ダッシュボード（今日の状態）

**目的**
- 今日の出勤/退勤状態を表示し、打刻操作を提供する

**権限**
- 本人のみ（me）

**Router loader（必須）**
- `['me']`
- `['timeEntries', { employeeId: me.employeeId, yearMonth: currentYearMonth }]`（今日の行が含まれる前提）

**Query**
- me
  - QueryKey: `['me']`
  - API: `GET /api/me`
- timeEntries（月次）
  - QueryKey: `['timeEntries', { employeeId, yearMonth }]`
  - API: `GET /api/time-entries?employeeId=...&yearMonth=...`
  - select（任意）: 今日の行だけ抽出して表示用に整形

**Mutations**
- 出勤打刻
  - Mutation: `POST /api/time-entries/clock-in`
  - 入力: `{ employeeId, at }`
  - 成功時:
    - `setQueryData(['timeEntries', { employeeId, yearMonth }])` で今日の行を更新（即時反映）
    - その後 `invalidateQueries(['timeEntries', { employeeId, yearMonth }])`
- 退勤打刻
  - Mutation: `POST /api/time-entries/clock-out`
  - 成功時: 同上
- 休憩開始/終了（採用する場合）
  - Mutation: `POST /api/time-entries/break-start` / `break-end`
  - 成功時: 同上

**UI（Table不要）**
- カード表示（今日の出勤/退勤/休憩/実働）

---

### 画面: `/time-entries` 勤怠一覧（勤務表）

**目的**
- 月次の勤務表を一覧表示、必要なら備考編集（本人）を提供

**権限**
- 本人：自分の一覧
- 管理者：全社員（※検索で employeeId を指定できる）

**Router loader（必須）**
- `['me']`
- `['employees', { activeOnly: true }]`（管理者のみ必須。本人のみなら省略可）
- `['timeEntries', { employeeId, yearMonth }]`

**Query**
- employees（管理者向け）
  - QueryKey: `['employees', { activeOnly: true }]`
  - API: `GET /api/employees?activeOnly=true`
- timeEntries（月次）
  - QueryKey: `['timeEntries', { employeeId, yearMonth }]`
  - API: `GET /api/time-entries?employeeId=...&yearMonth=...`

**Search params（TanStack Router）**
- `yearMonth`（必須）: `YYYY-MM`
- `employeeId`（任意、管理者のみ）: 対象社員

**Table（TanStack Table）**
- Columns（例）
  - date, weekday, clockIn, clockOut, breakTotal, workTotal, note
- Sort
  - date asc（固定でOK）
- Filter
  - yearMonth（必須）
  - employeeId（管理者のみ）

**Mutations（任意）**
- 備考更新（本人/管理者）
  - Mutation: `PATCH /api/time-entries/note`
  - 入力: `{ employeeId, date, note }`
  - 成功時:
    - `setQueryData(['timeEntries', { employeeId, yearMonth }])` で該当行の note を更新
    - その後 `invalidateQueries(['timeEntries', { employeeId, yearMonth }])`

---

### 画面: `/approvals` 承認一覧

**目的**
- 承認者が、申請された月次を一覧し、承認/差戻しする

**権限**
- 承認者のみ（approver）

**Router loader（必須）**
- `['me']`
- `['approvals', { approverId: me.employeeId, yearMonth, status }]`

**Search params**
- `yearMonth`（必須）: `YYYY-MM`
- `status`（任意）: submitted / approved / rejected（デフォルト submitted）

**Query**
- approvals
  - QueryKey: `['approvals', { approverId, yearMonth, status }]`
  - API: `GET /api/approvals?approverId=...&yearMonth=...&status=...`

**Table**
- Columns（例）
  - employeeName, yearMonth, status, submittedAt, lastComment
- Filter
  - status, yearMonth

**Mutations**
- 承認
  - Mutation: `POST /api/approvals/approve`
  - 入力: `{ employeeId, yearMonth, comment? }`
  - 成功時:
    - `invalidateQueries(['approvals', { approverId, yearMonth, status }])`
    - `invalidateQueries(['approvals', { approverId, yearMonth, status: 'submitted' }])`（一覧から消える想定）
    - `invalidateQueries(['timeEntries', { employeeId, yearMonth }])`（必要なら）
- 差戻し/却下
  - Mutation: `POST /api/approvals/reject`
  - 入力: `{ employeeId, yearMonth, comment }`（comment 必須にするなら docs に明記）
  - 成功時: 上に同じ

---

### 画面: `/reports/:yearMonth` レポート（PDF/集計）

**目的**
- 月次の勤務表を PDF で出力（縦型・ロゴ入り）

**権限**
- 本人：自分のPDF
- 管理者：任意社員のPDF

**Router loader（必須）**
- `['me']`
- `['timeEntries', { employeeId, yearMonth }]`
- （必要なら）`['employees', { activeOnly: true }]`（管理者用）

**Query**
- timeEntries（月次）
  - QueryKey: `['timeEntries', { employeeId, yearMonth }]`
  - API: `GET /api/time-entries?employeeId=...&yearMonth=...`

**PDF生成方針（どちらかを選ぶ）**
- A: ブラウザ生成（CSR）
  - 取得した timeEntries を整形してクライアント側でPDF生成
  - 日本語フォント・ロゴ埋め込み要件を満たすこと
- B: サーバー生成（API）
  - `GET /api/reports/timesheet.pdf?employeeId=...&yearMonth=...`
  - 生成はバックエンドで行い、PDFを返す

**Mutations**
- なし（生成のみ）

---

## API 一覧（エンドポイントの最小セット案）

- `GET /api/me`
- `GET /api/employees`
- `GET /api/time-entries`
- `POST /api/time-entries/clock-in`
- `POST /api/time-entries/clock-out`
- `PATCH /api/time-entries/note`
- `GET /api/approvals`
- `POST /api/approvals/submit`（本人の申請を入れるなら）
- `POST /api/approvals/approve`
- `POST /api/approvals/reject`
- `GET /api/reports/timesheet.pdf`（サーバー生成の場合）

---

## 未確定論点（決めないと実装がブレる）
- 休憩の扱い（別リスト/複数列/JSON）
- 端数処理（打刻丸め or 実働丸め、単位）
- 日またぎ勤務の扱い（どこで分割するか）
- 承認の単位（社員×月）とステータスの意味（reject が差戻しを含むか）
- PDF生成（ブラウザ生成かサーバー生成か）
