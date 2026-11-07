// ===== タイトルと X 共有 =====
// 共有：スマホは Web Share API で死因カードの画像つき。使えない環境（PC など）は X の投稿画面（文章＋URL。画像は自動では付けられない）
let shareBlob = null;

function shareText() {
  const D = DEATHS[Game.deathIdx];
  return '【死亡シミュレーター】' + deathCount() + '回目、「' + D.name.replace(/ /g, '') + '」で死亡（' + D.stat.replace(/ /g, '') + '）。図鑑 ' + dexGot() + '/' + dexTotal();
}

// 文字がはみ出さないように大きさを下げて 1 行に収める
function fitText(c, text, x, y, maxW, size, weight) {
  let s = size;
  c.font = (weight || 'bold') + ' ' + s + 'px "Yu Gothic UI","Hiragino Maru Gothic ProN","Meiryo",sans-serif';
  while (c.measureText(text).width > maxW && s > 14) { s -= 2; c.font = (weight || 'bold') + ' ' + s + 'px "Yu Gothic UI","Hiragino Maru Gothic ProN","Meiryo",sans-serif'; }
  c.fillText(text, x, y);
}

// 死因カードの画像（注意標識の見た目）を 720×720 で作る
function makeShareImage(done) {
  const D = DEATHS[Game.deathIdx];
  const c = document.createElement('canvas'); c.width = c.height = 720;
  const x = c.getContext('2d');
  x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, 720, 720);
  x.fillStyle = '#ffcc00'; x.fillRect(24, 24, 672, 672);
  // 上下の黄黒しま
  x.save(); x.beginPath(); x.rect(24, 24, 672, 40); x.rect(24, 656, 672, 40); x.clip();
  x.fillStyle = '#1a1a1a'; for (let i = -2; i < 24; i++) { x.beginPath(); x.moveTo(24 + i * 56, 700); x.lineTo(24 + i * 56 + 28, 700); x.lineTo(24 + i * 56 + 68, 20); x.lineTo(24 + i * 56 + 40, 20); x.fill(); }
  x.restore();
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1a1a1a';
  // アイコン（黒いひし形の中）
  x.save(); x.translate(360, 168); x.rotate(Math.PI / 4); x.fillStyle = '#ffcc00'; x.strokeStyle = '#1a1a1a'; x.lineWidth = 8; x.fillRect(-62, -62, 124, 124); x.strokeRect(-62, -62, 124, 124); x.restore();
  const ic = document.createElement('canvas'); ic.width = ic.height = 96; drawIcon(ic, D.id);
  x.drawImage(ic, 360 - 56, 168 - 56, 112, 112);
  x.fillStyle = '#1a1a1a';
  fitText(x, '死亡', 360, 292, 600, 54);
  fitText(x, D.name.replace(/ /g, ''), 360, 360, 600, 62);
  fitText(x, deathCount() + '回目の 死亡', 360, 424, 600, 40);
  x.fillStyle = '#1a1a1a'; x.fillRect(80, 468, 560, 96);
  x.fillStyle = '#ffcc00'; fitText(x, D.stat.replace(/ /g, ''), 360, 500, 520, 46);
  x.fillStyle = '#ffffff'; fitText(x, D.note, 360, 543, 520, 22, 'normal');
  x.fillStyle = '#1a1a1a'; fitText(x, starsText(D) + '   図鑑 ' + dexGot() + '/' + dexTotal(), 360, 600, 600, 34);
  x.fillStyle = '#5a4800'; fitText(x, 'death-simulator', 360, 636, 600, 22, 'normal');
  c.toBlob(b => done(b), 'image/png');
}

function shareX() {
  const text = shareText(), url = CFG.shareUrl;
  const web = () => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
  try {
    if (shareBlob && navigator.canShare && navigator.share) {
      const file = new File([shareBlob], 'shibou.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: text, url: url }).catch(() => {}); return; }
    }
  } catch (_) {}
  web();
}

function shareInit() {
  $('shareBtn').addEventListener('click', () => { Snd.init(); Snd.press(); shareX(); });
  // タイトル：どこをタップしても始まる（音の許可もここで取る）
  const t = $('title');
  const c = $('titleFig'), x = c.getContext('2d');
  const saved = ctx; ctx = x;
  x.setTransform(c.width / 31, 0, 0, c.width / 31, c.width / 2, c.height * 0.9);
  drawPerson(0, 0, 'stand', 0);
  ctx = saved;
  t.addEventListener('click', () => { Snd.init(); Snd.press(); t.classList.add('out'); setTimeout(() => { t.style.display = 'none'; }, 450); });
}
