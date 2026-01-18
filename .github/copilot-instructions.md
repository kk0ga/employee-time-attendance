---
applyTo: '**'
---

# 基本方針
- 常に日本語で応答・出力を行うこと（UIテキスト、ログ、エラー含む）。
- 用語（OIDC, JWT, etc.）は英語併記可。ただし全体の説明は日本語を主とすること。

# Tech Stack / 制約
- フロントエンドは **React + Vite + TypeScript** の SPA（CSR）とする。
- バックエンドは **Cloudflare Workers（TypeScript）** に REST API を実装。
- データベースは **Cloudflare D1（SQLite）** を使用し、永続化・変更履歴を追記型で管理。
- ユーザー認証は **Microsoft Entra ID（OIDC + Authorization Code + PKCE）** を使用する。
- JWTの検証は Workers 上で実施し、フロントからは `Authorization: Bearer` ヘッダで送信。

# フロントエンドルール
- UIは **Tailwind CSS** と **shadcn/ui** で構築し、レスポンシブ対応を基本とする。
- 認証は **MSAL.js** を用いて SPA 内でログインフローを完結。
- 認証後は取得した ID トークンを API に付与して送信。
- ページは `/pages` ディレクトリに配置。状態管理には Context API を基本とし、Redux は不要。

# Workers / API 実装ルール
- API は `src/api/*.ts` に実装し、各関数は `(req: Request, env: Env, ctx: ExecutionContext) => Response` の形式。
- データベース操作関数は `src/lib/db.ts` に集約する。
- `jose` を用いて JWT を検証（Entra の JWKS を使う）。パースとスコープチェックを必ず行うこと。
- 全ての API 応答は JSON（`{ status, data, error }`）形式に統一。
- POST/PUT系APIでは CSRF・XSSを防止し、必ずサーバー側でユーザー検証・バリデーションを行う。

# D1データ構造と改ざん耐性
- 勤怠レコードは `punch_logs` テーブルに追記のみとする。論理削除・上書き不可。
- 月次承認状態・締め処理は `monthly_statuses` テーブルで管理。
- ログの変更・承認には `approval_logs` を設け、操作履歴を記録。
- SQLファイルは `migrations/schema.sql` に定義し、`wrangler d1 execute` で適用。

# 開発環境と運用方針
- Cloudflare Pages に SPA をホストし、Workers をバックエンドAPIとして紐付ける。
- GitHub Actions で wrangler を使った CI/CD 自動デプロイを行う。
- Secrets / 環境変数は `wrangler.toml` および GitHub のリポジトリSecretsで管理。
- PDF/CSVはクライアントで `jsPDF` や `PapaParse` を使用してローカル生成。Functions や R2 は使わない。

# 命名規則・構造
- APIルート: `/api/clockin`, `/api/status`, `/api/export`
- テーブル名: スネークケース（`daily_logs`, `approval_logs`）
- 型定義は `types/*.ts` に配置（例: `AttendanceRecord`, `UserClaims`）

# セキュリティと認証
- 全APIにJWT検証ミドルウェアを通すこと（`src/middleware/auth.ts`）
- JWTのaud/iss/subを正確に検証。トークン期限もチェックすること。
- API経由でユーザーIDを信用せず、常にトークンから取得すること。

# コーディングスタイルとコメント
- TypeScriptの型定義は必須。`any` の使用は禁止。
- 関数にはJSDocコメントで目的・引数・戻り値を説明。
- `console.log` の残置は禁止。本番用には `console.warn` や `console.error` の最小限使用。

# コミットメッセージルール
- 日本語で記述。形式は以下のいずれか：
  - `機能: 勤怠打刻APIを追加`
  - `修正: JWT検証ロジックを修正`
  - `整理: 不要なコメントを削除`

# テスト・検証
- `wrangler dev` でローカル開発が可能であること。
- 最低限以下の確認を行うこと：
  - `npm run lint`
  - `npm run typecheck`
  - 認証→出退勤→データ確認の一連の手動確認
