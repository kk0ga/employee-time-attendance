# レイアウト（App Shell）

本プロジェクトは、全画面共通の「App Shell」を `RootLayout` で提供する。

## 目的
- 画面間の一貫性（ナビ/ヘッダー/余白）を保つ
- 最小限の導線で迷わないUIにする

## 概要
- **トップバー**：最小限（タイトル/メニューオープン）
- **サイドメニュー**：Figmaのサンプルに寄せた、白い丸角のフローティングパネル
  - アイコン付き
  - アクティブ行は `primary/10` の薄いハイライト
  - 右上の `X` で閉じる

## どこを直す？
- 実装: `src/routes/RootLayout.tsx`
  - `SidePanel`：パネルの角丸/影/ヘッダー（Attendance Sheet）
  - `SideNavLink`：リンクの見た目（下線/visited/hover/active）
  - `NavSection`：セクション分け（Settings など）

## ルール
- メニューは“UIコンポーネント”なので、リンクの下線や visited 色は出さない
- ルート追加時は `router.tsx` に route を追加し、必要なら `RootLayout` の nav に項目を追加

## モバイル
- オーバーレイ（背景クリックで閉じる）
- 小さめの画面でも、パネルが潰れない幅を優先

## 関連ドキュメント
- [ui-glass-style.md](ui-glass-style.md)
- [docs/README.md](README.md)
