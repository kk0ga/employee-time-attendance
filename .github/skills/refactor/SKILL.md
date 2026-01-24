---
name: refactor
description: '既存コードを壊さずに段階的にリファクタする。責務分離、命名、境界（UI/ドメイン/データ層）整理、型の強化、重複排除、動作確認（lint/build/e2e）を伴う改善で使う。キーワード: refactor, cleanup, architecture, types'
license: MIT
---

# Refactor Skill

## 目的
機能追加の前後で増えがちな複雑さを抑え、
- 保守しやすさ
- 変更の安全性
を上げる。

## 進め方（安全優先）
1. 変更範囲を最小化（まず移動/整理だけ）
2. 型で境界を固定（domain/lib/ui）
3. lint/build を通す
4. 重要導線はE2E/手動で確認

## 注意
- ついで修正をしすぎない（レビュー負荷が上がる）

## 依頼例
- 「Graph呼び出しを `src/lib/graph` に集約したい。手順を出して」
