---
name: microsoft-docs
description: 'Microsoft Learn 公式ドキュメントを検索・取得して、Entra/MSAL/Graph/SharePoint/Pages運用の設計判断を裏付ける。検索→必要ページを全文fetch→要点と手順に落とす作業で使う。キーワード: Microsoft Learn, docs, Entra ID, MSAL, Graph, SharePoint'
license: MIT
---

# Microsoft Docs Skill

## 目的
設計・実装上の判断を Microsoft公式ドキュメントで確認し、
仕様の思い込みや古い情報を避ける。

## 進め方
1. `docs_search` で該当ページ候補を探す
2. 必要なら `docs_fetch` で全文を読み、前提・制約・手順を抽出
3. このリポジトリ向けに短い手順にまとめる

## 注意
- “便利そうだから権限を増やす” をしない（Graph権限は最小化）
- 変更提案は「手順 + コード例 + 注意点」をセットで

## 依頼例
- 「SharePoint Lists を Graph で扱う手順を公式から確認して」
- 「MSALのキャッシュ設定の推奨を確認して」
