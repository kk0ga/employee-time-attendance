---
applyTo: "src/**/*.{ts,tsx}"
---

# Entra ID (OIDC + PKCE) / MSAL 指針

## 認証フロー
- Authorization Code + PKCE を前提にMSALを使用
- acquireTokenSilent を第一選択、失敗時のみインタラクティブにフォールバック

## ルーティング注意
- GitHub Pages の Hash ルーティングを前提にする（redirectUri は `#` を含めない）

## トークン取り扱い
- localStorage 永続化は禁止（memory / sessionStorage を優先）
- トークン・個人情報のconsole出力禁止

## XSS対策
- dangerouslySetInnerHTML 原則禁止
- SharePoint由来の文字列を表示する場合は「意図せぬHTML解釈」を絶対にしない

## 関連ドキュメント
- [docs/README.md](../../docs/README.md)
