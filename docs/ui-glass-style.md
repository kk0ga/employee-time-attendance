# UI スタイルガイド（iOS風 Glass UI）

このプロジェクトのUIは「ニュートラル + 単一primary」かつ、iOSっぽい *Glass UI*（半透明/ぼかし/柔らかい影）で統一する。

## 目的
- 業務UIとして読みやすく、疲れにくい
- 画面間で“質感”と“密度”が揃って見える
- 小規模運用（15名）前提で、過剰なアニメーション/描画コストを避ける

## デザイン原則
- **primary は 1色だけ**（強調・アクション・アクティブ状態に限定）
- **面（surface）で整理**：カード/パネル/テーブルなど、背景の“面”で情報を分ける
- **影は控えめ**：強いドロップシャドウではなく、薄い境界線 + 柔らかい影
- **余白をデフォルトで大きめ**：`p-6` / `gap-6` を基本
- **タイポ階層**：タイトル（太め）/本文/補助（小さめ&薄い）を必ず作る

## 実装ガイド（Tailwind + shadcn/ui）
- コンポーネントは `src/components/ui/*`（shadcn/ui）を優先
- “ガラス面”は次の要素を組み合わせる
  - 半透明背景（例：`bg-card/60` や `bg-white/55`）
  - ぼかし（例：`backdrop-blur-xl`）
  - 薄い境界線（例：`border border-border/60`）
  - 控えめ影（例：`shadow-sm` 〜 `shadow-md`）

## リンク/visited の扱い
- “メニュー項目”など、UIとしてボタン/タブ的に使うリンクは **下線/visitedの紫を出さない**。
  - `no-underline` と `visited:` を明示して、ブラウザ既定の見た目を避ける

## 注意点
- SPAのため、XSS対策を最優先（`dangerouslySetInnerHTML` 原則禁止）
- アクセストークンを localStorage に永続保存しない（memory/sessionStorage優先）

## 関連ドキュメント
- [layout-app-shell.md](layout-app-shell.md)
- [docs/README.md](README.md)

## 参考
- ルートレイアウト（サイドメニュー/トップバー）は `RootLayout` を参照
  - 実装: `src/routes/RootLayout.tsx`
