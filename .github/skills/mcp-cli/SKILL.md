---
name: mcp-cli
description: 'MCP（Model Context Protocol）サーバーの設定・起動・運用を整理する。VS Code の mcp.json / settings、autostart、devcontainer配布、ツールの前提（認証/環境変数）など、MCPを使った作業を安定させたい時に使う。キーワード: MCP, mcp.json, model context protocol, server, tools'
license: MIT
---

# MCP CLI / MCP Setup Skill

## 目的
このリポジトリで使う MCP サーバー（GitHub / Microsoft Learn / Playwright 等）の
- 設定
- 使い分け
- トラブルシュート
を共通化する。

## 原則
- 共有設定はワークスペース側（例: `.vscode/mcp.json`）に置く
- devcontainer は環境整備（port forward など）に寄せる

## よくある不具合
- MCPが起動しない（設定キー不整合）
- 認証が切れている（GitHub/Entra/Docs）

## 依頼例
- 「MCPの設定を見直して、必要なサーバーを追加して」
- 「起動しない原因を切り分けて」

## References
- [docs/README.md](../../../docs/README.md)
