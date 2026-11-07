// ===== 図鑑とご褒美：注意標識のカード・NEW の判子・レア度・紙ふぶき =====
const DEX_KEY = 'death-simulator-dex';
const POP_JP = 124350000;          // 日本の人口（約 1 億 2,435 万人・2023 年）。「○人に 1 人」の計算に使う
let dexData = {};                  // { 死に方の id: 死んだ回数 }

function dexLoad() {
  try { dexData = JSON.parse(localStorage.getItem(DEX_KEY)) || {}; } catch (_) { dexData = {}; }
}
function dexSave() { try { localStorage.setItem(DEX_KEY, JSON.stringify(dexData)); } catch (_) {} }
function dexTotal() { return DEATHS.length; }                          // 13（隠し枠の隕石をふくむ）
function dexGot() { return DEATHS.filter(d => dexData[d.id] > 0).length; }
function dexSync() {               // 図鑑の中身から、円盤に関わる状態を決める
  DEX_HAS = id => dexData[id] > 0;
  HIDDEN_ON = dexRegular() - dexOpen() >= dexRegular();   // 12 種そろったら隕石が円盤に出る
}
function dexInit() {
  dexLoad(); dexSync();
  window.addEventListener('resize', cv3Resize);
  cv3Resize();
  $('dexBtn').addEventListener('click', () => { Snd.init(); Snd.press(); dexShow(); });
  $('dexOpen2').addEventListener('click', () => { Snd.init(); Snd.press(); dexShow(); });
  $('dexClose').addEventListener('click', () => { Snd.press(); dexHide(); });
  $('ddClose').addEventListener('click', () => { Snd.press(); $('dexDetail').classList.remove('show'); });
  $('dexDetail').addEventListener('click', e => { if (e.target === $('dexDetail')) $('dexDetail').classList.remove('show'); });
}

// レア度（★ 1〜5）：年間の死者が少ないほど高い。隠し枠は 5
function starCount(d) {
  if (d.hidden || !(d.n > 0)) return 5;
  return Math.max(1, Math.min(5, Math.round(5 - Math.log10(d.n) * 1.2)));
}
const starsText = d => '★'.repeat(starCount(d)) + '☆'.repeat(5 - starCount(d));

// 「年間 ○人に 1 人」
function oddsText(d) {
  if (!(d.n > 0)) return '記録なし';
  const p = POP_JP / d.n;
  if (p >= 1e8) return '約' + (p / 1e8).toFixed(1).replace(/\.0$/, '') + '億人に 1 人';
  if (p >= 1e4) return '約' + Math.round(p / 1e4) + '万人に 1 人';
  return '約' + Math.round(p) + '人に 1 人';
}

// 死んだことを図鑑に記録する。画面に出すための情報を返す
function dexRecord(idx) {
  const d = DEATHS[idx];
  const regBefore = dexRegular() - dexOpen();
  const prev = dexData[d.id] || 0;
  dexData[d.id] = prev + 1;
  dexSave();
  dexSync();
  const regAfter = dexRegular() - dexOpen();
  return {
    isNew: prev === 0, count: dexData[d.id], got: dexGot(), total: dexTotal(),
    unlocked: regBefore < dexRegular() && regAfter === dexRegular(),     // 今ちょうど 12 種そろった
    complete: dexGot() === dexTotal() && prev === 0,                     // 今ちょうど 13 枚そろった
  };
}

// ---- ピクトグラム風のアイコン（黒・単純な形。[-1,1] の箱の中に描く）----
const ICON_INK = '#1a1a1a', ICON_BG = '#ffcc00';
const ICONS = {
  mochi(c) {
    c.beginPath(); c.ellipse(-0.1, 0.35, 0.65, 0.4, 0, 0, TAU); c.fill();
    c.lineWidth = 0.22; c.beginPath(); c.moveTo(0.25, 0.1); c.quadraticCurveTo(0.7, -0.4, 0.15, -0.8); c.stroke();
  },
  yuki(c) {
    c.beginPath(); c.moveTo(-0.9, 0.55); c.lineTo(0, -0.45); c.lineTo(0.9, 0.55); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.lineWidth = 0.08;
    [[-0.25, -0.1, 0.2], [0.2, 0.05, 0.22], [-0.05, 0.3, 0.2]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke(); });
  },
  fugu(c) {
    c.beginPath(); c.ellipse(-0.1, 0.05, 0.6, 0.5, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(0.45, 0.05); c.lineTo(0.9, -0.3); c.lineTo(0.9, 0.4); c.closePath(); c.fill();
    c.lineWidth = 0.1; c.beginPath();
    for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.85, x = -0.1 + Math.cos(a) * 0.55, y = 0.05 + Math.sin(a) * 0.45; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 0.22, y + Math.sin(a) * 0.22); }
    c.stroke(); c.fillStyle = ICON_BG; c.beginPath(); c.arc(-0.4, -0.05, 0.1, 0, TAU); c.fill();
  },
  kinoko(c) {
    c.beginPath(); c.arc(0, 0.05, 0.85, Math.PI, 0); c.closePath(); c.fill();
    c.fillRect(-0.25, 0.05, 0.5, 0.7);
    c.fillStyle = ICON_BG; [[-0.4, -0.3, 0.14], [0.15, -0.5, 0.12], [0.45, -0.15, 0.1]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
  },
  furo(c) {
    c.beginPath(); c.moveTo(-0.9, 0); c.lineTo(0.9, 0); c.lineTo(0.7, 0.65); c.lineTo(-0.7, 0.65); c.closePath(); c.fill();
    c.lineWidth = 0.1; c.beginPath();
    [-0.4, 0, 0.4].forEach(x => { c.moveTo(x, -0.1); c.bezierCurveTo(x - 0.2, -0.3, x + 0.2, -0.5, x, -0.75); });
    c.stroke();
  },
  hachi(c) {
    c.beginPath(); c.ellipse(0, 0.15, 0.5, 0.38, 0, 0, TAU); c.fill();
    c.fillStyle = ICON_BG; [-0.15, 0.1].forEach(x => c.fillRect(x, -0.2, 0.1, 0.7));
    c.fillStyle = ICON_INK; c.beginPath(); c.moveTo(-0.5, 0.15); c.lineTo(-0.95, 0.2); c.lineTo(-0.5, 0.3); c.fill();
    c.lineWidth = 0.09; c.beginPath(); c.ellipse(0.05, -0.4, 0.3, 0.17, -0.5, 0, TAU); c.ellipse(0.35, -0.35, 0.25, 0.15, 0.3, 0, TAU); c.stroke();
  },
  hebi(c) {
    c.lineWidth = 0.3; c.lineCap = 'round'; c.beginPath();
    c.moveTo(-0.7, 0.65); c.bezierCurveTo(-0.9, 0.1, 0.2, 0.4, 0.3, 0); c.bezierCurveTo(0.4, -0.35, -0.5, -0.1, -0.1, -0.6); c.stroke();
    c.beginPath(); c.arc(-0.05, -0.65, 0.2, 0, TAU); c.fill();
  },
  nadare(c) {
    c.beginPath(); c.moveTo(-0.95, 0.7); c.lineTo(-0.1, -0.75); c.lineTo(0.55, 0.7); c.closePath(); c.fill();
    c.strokeStyle = ICON_BG; c.lineWidth = 0.1; c.beginPath();
    [[-0.2, -0.3, 0.1, 0.3], [-0.05, -0.1, 0.3, 0.45], [-0.25, 0.1, 0.0, 0.55]].forEach(([x, y, x2, y2]) => { c.moveTo(x, y); c.lineTo(x2, y2); });
    c.stroke(); c.fillStyle = ICON_INK; c.beginPath(); c.moveTo(0.5, 0.7); c.lineTo(0.75, 0.2); c.lineTo(0.95, 0.7); c.closePath(); c.fill();
  },
  sangaku(c) {
    c.beginPath(); c.moveTo(-0.95, 0.7); c.lineTo(-0.35, -0.5); c.lineTo(0.05, 0.1); c.lineTo(0.4, -0.3); c.lineTo(0.95, 0.7); c.closePath(); c.fill();
    c.strokeStyle = ICON_BG; c.lineWidth = 0.09; c.setLineDash([0.12, 0.12]); c.beginPath(); c.moveTo(0.5, 0.65); c.bezierCurveTo(-0.1, 0.5, 0.5, 0.2, -0.1, 0.1); c.stroke(); c.setLineDash([]);
  },
  umi(c) {
    c.lineWidth = 0.14; c.lineCap = 'round'; c.beginPath();
    [0.15, 0.5, 0.85].forEach((y, i) => { c.moveTo(-0.9, y); for (let k = 0; k < 4; k++) c.quadraticCurveTo(-0.9 + k * 0.45 + 0.22, y - 0.28, -0.9 + (k + 1) * 0.45, y); });
    c.stroke(); c.beginPath(); c.arc(0.1, -0.35, 0.17, 0, TAU); c.fill();
    c.lineWidth = 0.1; c.beginPath(); c.moveTo(0.1, -0.15); c.lineTo(-0.15, -0.55); c.moveTo(0.1, -0.15); c.lineTo(0.38, -0.55); c.stroke();
  },
  tsuri(c) {
    c.lineWidth = 0.1; c.lineCap = 'round'; c.beginPath();
    c.moveTo(-0.85, 0.7); c.lineTo(0.55, -0.75); c.moveTo(0.55, -0.75); c.lineTo(0.55, 0.15); c.stroke();
    c.beginPath(); c.arc(0.45, 0.28, 0.13, -0.5, 2.8); c.stroke();
    c.lineWidth = 0.12; c.beginPath(); c.moveTo(-0.2, 0.85); c.quadraticCurveTo(0, 0.65, 0.2, 0.85); c.quadraticCurveTo(0.4, 1.0, 0.6, 0.85); c.stroke();
  },
  rakurai(c) {
    c.beginPath(); [[-0.55, -0.35, 0.3], [-0.15, -0.55, 0.38], [0.35, -0.4, 0.3], [0.05, -0.28, 0.4]].forEach(([x, y, r]) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }); c.fill();
    c.fillStyle = ICON_BG; c.strokeStyle = ICON_INK; c.lineWidth = 0.07;
    c.beginPath(); c.moveTo(0.15, -0.3); c.lineTo(-0.3, 0.2); c.lineTo(0, 0.2); c.lineTo(-0.2, 0.85); c.lineTo(0.4, 0.05); c.lineTo(0.08, 0.05); c.lineTo(0.35, -0.3); c.closePath(); c.fill(); c.stroke();
  },
  inseki(c) {
    c.beginPath(); c.arc(0.2, 0.25, 0.42, 0, TAU); c.fill();
    c.lineWidth = 0.16; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.1, -0.05); c.lineTo(-0.85, -0.8); c.moveTo(-0.2, 0.2); c.lineTo(-0.95, -0.35); c.moveTo(0.1, -0.2); c.lineTo(-0.45, -0.85); c.stroke();
  },
};
function drawIcon(cnv, id, ink) {
  const c = cnv.getContext('2d'), s = cnv.width;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, s, s);
  c.setTransform(s / 2.2, 0, 0, s / 2.2, s / 2, s / 2);
  c.fillStyle = c.strokeStyle = ink || ICON_INK; c.lineJoin = 'round';
  (ICONS[id] || ICONS.inseki)(c);
}

// ---- 図鑑の画面 ----
function dexRender() {
  const grid = $('dexGrid'); grid.innerHTML = '';
  DEATHS.forEach((d, i) => {
    const has = dexData[d.id] > 0;
    const card = document.createElement('div');
    card.className = 'dcard' + (has ? '' : ' empty');
    const sign = document.createElement('div'); sign.className = 'dsign';
    const cnv = document.createElement('canvas'); cnv.width = cnv.height = 96;
    sign.appendChild(cnv); card.appendChild(sign);
    if (has) drawIcon(cnv, d.id);
    const nm = document.createElement('div'); nm.className = 'dname';
    nm.textContent = has ? d.name.replace(/ /g, '') : '？？？';
    card.appendChild(nm);
    const st = document.createElement('div'); st.className = 'dstars';
    st.textContent = has ? starsText(d) + ' ×' + dexData[d.id] : '';
    card.appendChild(st);
    if (has) card.addEventListener('click', () => dexDetail(i));
    grid.appendChild(card);
  });
  $('dexTitle').textContent = '図鑑 ' + dexGot() + '/' + dexTotal();
}
function dexShow() { dexRender(); $('dex').classList.add('show'); }
function dexHide() { $('dex').classList.remove('show'); $('dexDetail').classList.remove('show'); }
function dexDetail(i) {
  const d = DEATHS[i];
  drawIcon($('ddIcon'), d.id);
  $('ddName').textContent = d.name;
  $('ddMeta').textContent = starsText(d) + '  ・  ' + (d.n > 0 ? '年間 ' + oddsText(d) : oddsText(d)) + '  ・  ' + dexData[d.id] + '回';
  $('ddStat').textContent = d.stat; $('ddNote').textContent = d.note;
  $('ddPrev').innerHTML = '<i style="font-style:normal;background:#1a1a1a;color:#ffcc00;border-radius:1cqw;padding:.3cqw 1.4cqw;margin-right:1.2cqw;font-size:3.2cqw">防ぐには</i>' + d.prevent;
  $('dexDetail').classList.add('show');
}

// ---- 紙ふぶき ----
const cv3 = $('cv3'), ctx3 = cv3.getContext('2d');
let conf = [], cv3K = 1;
function cv3Resize() {
  const r = $('stage').getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  cv3.width = Math.round(r.width * d); cv3.height = Math.round(r.height * d);
  cv3K = r.width / CFG.worldW * d;
}
function confetti(n, fromTop) {
  const cols = ['#ffcc00', '#1a1a1a', '#ffffff', '#d9291c', '#4aa3ff'];
  for (let i = 0; i < n; i++) {
    conf.push({
      x: Math.random() * CFG.worldW, y: fromTop ? -5 - Math.random() * 30 : 40 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 30, vy: fromTop ? 10 + Math.random() * 25 : -50 - Math.random() * 60,
      w: 1.2 + Math.random() * 1.8, h: 0.8 + Math.random() * 1.2, a: Math.random() * TAU, va: (Math.random() - 0.5) * 12,
      col: cols[i % cols.length], life: 2.6 + Math.random() * 1.6,
    });
  }
}
function confettiFrame(dt) {
  ctx3.setTransform(1, 0, 0, 1, 0, 0); ctx3.clearRect(0, 0, cv3.width, cv3.height);
  if (!conf.length) return;
  ctx3.setTransform(cv3K, 0, 0, cv3K, 0, 0);
  conf = conf.filter(p => (p.life -= dt) > 0 && p.y < CFG.worldH + 5);
  conf.forEach(p => {
    p.vy += 70 * dt; p.vx *= 0.995; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
    ctx3.save(); ctx3.translate(p.x, p.y); ctx3.rotate(p.a);
    ctx3.globalAlpha = Math.min(1, p.life);
    ctx3.fillStyle = p.col; ctx3.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx3.restore();
  });
}
