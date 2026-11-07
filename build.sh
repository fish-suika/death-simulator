#!/bin/sh
# 分割ソースを1枚のHTMLに結合する
cd "$(dirname "$0")"

cat src/00-head.html \
    src/10-config.js \
    src/20-logic.js \
    src/40-render.js \
    src/45-scenes.js \
    src/46-scenes2.js \
    src/50-audio.js \
    src/60-ui.js \
    src/65-dex.js \
    src/66-share.js \
    src/70-cine.js \
    src/90-boot.js \
    src/99-tail.html > death-simulator.html
cp death-simulator.html index.html   # GitHub Pages はルートの index.html を配信する

# 映像の試しプレイ用（落雷だけが出る・死にやすい）
cat src/00-head.html \
    src/test-flag.js \
    src/10-config.js \
    src/20-logic.js \
    src/40-render.js \
    src/45-scenes.js \
    src/46-scenes2.js \
    src/50-audio.js \
    src/60-ui.js \
    src/65-dex.js \
    src/66-share.js \
    src/70-cine.js \
    src/90-boot.js \
    src/99-tail.html > rakurai-test.html

# 検証ページ（画面を使わないロジックだけ）
cat src/verify-head.html \
    src/10-config.js \
    src/20-logic.js \
    src/verify-tests.js \
    src/99-tail.html > verify.html

echo "built death-simulator.html + index.html ($(wc -c < death-simulator.html) bytes)"
echo "built rakurai-test.html, verify.html"

# 場面の一覧確認ページ（開発用）
cat src/check-head.html \
    src/10-config.js \
    src/20-logic.js \
    src/45-scenes.js \
    src/46-scenes2.js \
    src/check-run.js \
    src/99-tail.html > scene-check.html

# 音量の確認ページ（開発用。オフラインで鳴らして測る）
cat src/audio-check-head.html \
    src/50-audio.js \
    src/audio-check-run.js \
    src/99-tail.html > audio-check.html
