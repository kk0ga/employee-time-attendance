# 勤怠管理システム - Copilot Repository Instructions

## ゴール
社内15名規模の勤怠管理（打刻・日次/月次・承認・監査）を、低トラフィック前提で低コスト運用する。

## 固定アーキ（変更しない）
- フロント: React SPA（CSRのみ、SSR不要）
- ホスティング: GitHub Pages（静的配信）
- 認証: Microsoft Entra ID（OIDC Authorization Code + PKCE）
- API: Microsoft Graph
- データ: SharePoint Online List（Microsoft 365 Business Basic 前提）
- UI言語: 日本語のみ

## 最重要ルール（セキュリティ）
- SPAなので XSS 対策を最優先（dangerouslySetInnerHTML 原則禁止）
- アクセストークンを localStorage に永続保存しない（memory / sessionStorage を優先）
- Graph権限は最小化。個人情報やトークンをログ出力しない

## 実装姿勢
- 追加ライブラリは最小限。入れる場合は「理由・代替・影響」を明記
- 例外/失敗時のUXを重視（401/403/429、ネットワーク断）
- Asia/Tokyo を前提に日付境界を扱う（勤怠の計算に直結）

## 期待する出力
- 変更提案は「手順 + コード例 + 注意点」をセットで出す
- 推測で断定しない。前提が必要なら“仮定”として明示する
