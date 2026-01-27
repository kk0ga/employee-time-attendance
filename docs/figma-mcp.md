# Figma MCP（使い分けとレート制限）

FigmaのMCPサーバーは、設計情報の取得に便利だが、プラン/シート種別によりレート制限がある。

## 目的
- Figma から UI実装に必要な情報を効率的に引き出す
- レート制限や権限の制約を踏まえた運用にする

## サーバー種別
### Remote MCP server（ホスト型）
- URL: `https://mcp.figma.com/mcp`
- FigmaのOAuth認証が必要
- **リンク（node-id）ベース**で対象ノードを指定する

### Desktop MCP server（Figmaデスクトップ経由のローカル）
- URL: `http://127.0.0.1:3845/mcp`
- Figmaデスクトップアプリが必要
- 選択ノードを起点に扱いやすい

## 「v2」について
- 公式ドキュメント上は、Remote MCP の接続先として `https://mcp.figma.com/mcp` が案内されている。
- 「v2」という表現は、URLの `/v2` を意味しないケースが多く、クライアント側の対応やプロトコル表現の混同が起きやすい。

## レート制限の典型
- Starter / View / Collab などはツール呼び出し回数が少ない（月あたりの制限など）
- Dev/Full seat は別のレート制限（分あたり等）

制限に当たった場合は、次のどれかで回避する。
- **Desktop MCP を使う**（可能なら最優先）
- 取得回数を減らす（必要なノードだけに絞る）
- スクショ提供で補完（ノード取得の代替になる）

## このリポジトリでのおすすめ運用
- まずはスクショで「見た目/余白/アクティブ状態」を合わせる
- その後、MCPで「文言/構造/余白の意図」を確認して微調整

## 関連ドキュメント
- [docs/README.md](README.md)
- [layout-app-shell.md](layout-app-shell.md)
- [ui-glass-style.md](ui-glass-style.md)

## 参考
- Figma公式: MCP server / Remote / Desktop のガイド
  - https://developers.figma.com/docs/figma-mcp-server/
