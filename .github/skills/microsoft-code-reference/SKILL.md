---
name: microsoft-code-reference
description: 'Microsoft Learn のコードサンプルを検索して、Microsoft/Graph/Azure等の実装を一次情報で補強する。SDK名やAPI名からサンプルを引き、最小構成でこのリポジトリに適用する時に使う。キーワード: Microsoft Learn, code sample, Graph, MSAL, snippet'
license: MIT
---

# Microsoft Code Reference Skill

## 目的
MSAL/Graph など Microsoft系実装を、推測ではなく **公式サンプル** で裏取りしながら進める。

## 進め方
1. 探したい対象を明確化
   - SDK / クラス / メソッド / 目的
2. Microsoft Learn の code sample search を使う
3. このリポジトリの制約に合わせて最小導入
   - トークンをlocalStorageに保存しない
   - ログに個人情報/トークンを出さない

## 依頼例
- 「GraphでSharePoint Listを読む公式サンプルを探して適用方針を出して」
- 「MSALのredirect処理の推奨例を探して」
