---
name: entra-msal-auth-spa
description: 'Entra ID（Microsoft Entra ID）+ MSAL（PKCE）でReact SPAの認証を実装・運用する。login/logout、redirectハンドリング、ルートガード、sessionStorageキャッシュ、acquireTokenSilent優先、401/403/interaction_required対応、GitHub Pages（Hashルーティング）考慮のタスクで使う。キーワード: Entra ID, MSAL, PKCE, OIDC, login, logout, redirect'
license: MIT
---

# Entra ID + MSAL Auth (SPA) Skill

## 目的
勤怠システムの認証を **Entra ID（OIDC Authorization Code + PKCE）** で実装し、
「動く」だけでなく **運用・失敗時UX・セキュリティ** まで含めて整える。

## 最重要ルール（このリポジトリ方針）
- SPAなので XSS 対策を最優先（`dangerouslySetInnerHTML` は原則禁止）
- アクセストークンを localStorage に永続保存しない（memory / sessionStorage）
- トークン・個人情報（mail, oid 等）を console に出さない

## 進め方（推奨手順）
1. **環境変数の整理（秘密情報は置かない）**
   - `VITE_ENTRA_CLIENT_ID`
   - `VITE_ENTRA_TENANT_ID`
   - `VITE_ENTRA_REDIRECT_URI`（GitHub Pages の basePath を含める）

2. **MSAL の初期化（起動時に必ず実行）**
   - `PublicClientApplication.initialize()`
   - `handleRedirectPromise()`
   - これを「アプリ描画より前」に行い、ログイン状態を一貫させる

3. **ログイン/ログアウト導線**
   - ログイン: `loginRedirect()`（必要なら `prompt` 指定）
   - ログアウト: `logoutRedirect()`
   - ログイン済みで `/login` に来たら、通常はダッシュボードへ誘導

4. **ルートガード（未ログインは /login）**
   - ルーティング層で「保護ルート」を定義し、未ログインは `redirect()`
   - “一部だけ公開” の画面（/about など）を明確に分ける

5. **トークン取得方針**
   - 第一選択: `acquireTokenSilent()`
   - 失敗時のみ: `acquireTokenRedirect()`（ユーザー操作が必要なケースのフォールバック）
   - scope は最小化（必要なGraph権限のみ）

## 失敗時のUX（必須）
- **401/403**
  - 再ログイン導線 or 権限不足の案内（管理者へ連絡導線）
- **interaction_required / login_required**
  - UIで「再ログインが必要」と明示し、インタラクティブに誘導
- **429/503**
  - すぐにログインし直させず、Graph呼び出し側でリトライを検討

## GitHub Pages（Hashルーティング）注意
- SPAルーティングはHashを使うと Pages 側の404問題を避けやすい
- ただし **redirectUri は `#` を含めない**（IdPの戻り先は通常パス部分）
- Pagesの basePath（`/repo-name/`）を使う構成なら redirectUri にも反映する

## 成果物（このスキルで必ず出す）
- `.env.example` に必要なキー（値はダミー）
- ルートガード仕様（公開/保護ルート一覧）
- 主要エラーのユーザー表示文言（日本語）

## 依頼例
- 「Entra ID + MSAL のログインを導入して、未ログイン時は /login に飛ばしたい」
- 「acquireTokenSilent を優先して、失敗時だけredirectフォールバックしたい」
- 「GitHub Pages（Hashルーティング）でMSALのredirectUriをどうするべき？」
