---
name: webapp-testing
description: 'ローカルで動くWebアプリ（React SPA）をテスト/検証する。PlaywrightによるE2E、主要導線（ログイン→打刻→申請→承認→PDF）確認、スクリーンショット、コンソール/ネットワーク確認、CI組込みを行う時に使う。キーワード: Playwright, E2E, webapp testing, screenshot, console, network'
license: MIT
---

# Webapp Testing (Playwright)

## 目的
小規模運用でも壊れやすい“主要導線”を自動で守る。

## 対象導線（最小）
1. ログイン（SSO後の到達確認）
2. 出勤打刻 → 退勤打刻
3. 月次申請
4. 承認
5. PDF出力

## 安定化のコツ
- 待機は「表示されるべき要素」を基準にする
- テストデータは作って消す（隔離）
- 認証が重い場合は stg 限定の迂回策を検討（ただし安全に）

## 成果物
- テストケース一覧（Given/When/Then）
- CI実行タイミング（PR / nightly）

## 依頼例
- 「打刻～申請～承認をE2Eで最低限固めたい」

## 関連スキル
- [entra-msal-auth-spa](../entra-msal-auth-spa/SKILL.md)
- [static-hosting-ci-cd](../static-hosting-ci-cd/SKILL.md)
