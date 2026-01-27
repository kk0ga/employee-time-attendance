---
name: image-manipulation-image-magick
description: 'ImageMagickで画像（会社ロゴ等）を変換・リサイズ・トリミングし、PDF/画面表示に最適化する。PNG/SVG変換、解像度調整、透過、余白削除などの作業で使う。キーワード: ImageMagick, convert, magick, logo, png, svg, resize'
license: MIT
---

# Image Manipulation with ImageMagick

## 目的
会社ロゴなどの画像を、
- PDF出力（勤務表）
- Web UI
で扱いやすい形に整える。

## 前提
- Debian系なら: `sudo apt-get update && sudo apt-get install -y imagemagick`
- コマンドは環境により `magick` または `convert` を使用

## よくある作業
1. **サイズ調整（リサイズ）**
2. **余白の削除（トリミング）**
3. **透過背景の確認**
4. **形式変換（SVG→PNG など）**

## 注意
- 元データは残す（上書きしない）
- 生成物は `public/` 配下など参照しやすい場所に置く

## 依頼例
- 「ロゴをA4 PDF用に横200px相当に整えて」
- 「SVGロゴを透過PNGに変換して」

## References
- [docs/README.md](../../../docs/README.md)
