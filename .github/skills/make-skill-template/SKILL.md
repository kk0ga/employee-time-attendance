---
name: make-skill-template
description: '新しい Agent Skill をこのリポジトリに追加するためのテンプレ作成手順を提供する。SKILL.md の frontmatter（name/description）設計、トリガー語の入れ方、assets/references/templates の整理が必要な時に使う。キーワード: skill, SKILL.md, frontmatter, template'
license: MIT
---

# Make Skill Template

## 目的
このリポジトリの `.github/skills/<skill-name>/SKILL.md` を増やす際に、
品質（発見性/再利用性）を揃える。

## 最小構成
```
.github/skills/<skill-name>/
  SKILL.md
```

## frontmatter のルール
- `name`: フォルダ名と一致（小文字+ハイフン、64文字以内）
- `description`: **WHAT + WHEN + keywords** を入れる（発見性の要）

## ボディ推奨セクション
- When to Use
- Prerequisites
- Step-by-step
- Troubleshooting
- References

## 依頼例
- 「Graph関連のスキルを追加したい。テンプレから作って」

## References
- [skills/README.md](../README.md)
