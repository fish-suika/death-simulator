// ===== 描画（Canvas 2D。画像素材なし）=====
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx1 = cv.getContext('2d');
let ctx = ctx1;   // 映像の上のキャンバスに描くときだけ一時的に差し替える（70-cine.js）
let DPR = 1, VW = 0, VH = 0, S = 1, OX = 0, OY = 0, stripePat = null;

// 見た目だけの状態（人の動き）
const Fx = { time: 0 };

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  const sw = Math.min(VW, VH * 9 / 16);
  S = sw / CFG.worldW;
  OX = (VW - sw) / 2; OY = (VH - sw * 16 / 9) / 2;
  // 外側（PCの横長など）に敷く黄黒のしま
  const p = document.createElement('canvas'); p.width = p.height = 64;
  const g = p.getContext('2d');
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#4a3f12';
  g.beginPath(); g.moveTo(0, 32); g.lineTo(32, 0); g.lineTo(64, 0); g.lineTo(0, 64); g.fill();
  g.beginPath(); g.moveTo(64, 32); g.lineTo(32, 64); g.lineTo(64, 64); g.fill();
  stripePat = ctx.createPattern(p, 'repeat');
}

function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }

// ひと（非常口マークのようなピクトグラム）。足もとが原点、上が -y。pose: stand | cheer | down
function drawPerson(x, y, pose, t) {
  ctx.save();
  ctx.translate(x, y);
  let ang = 0, bob = 0;
  if (pose === 'stand') bob = Math.sin(Fx.time * 2.2) * 0.5;
  if (pose === 'cheer') bob = -Math.abs(Math.sin(t * 9)) * 2.2 * Math.max(0, 1 - t / 1.2);
  if (pose === 'down') {
    const u = Math.min(1, t / 0.5);
    ang = (Math.PI / 2) * (1 - Math.pow(1 - u, 2));
    bob = -Math.sin(u * Math.PI) * 3;
  }
  // 映像の上では、背景が暗くても見えるように白いふちを付ける
  if (pose === 'startle' || pose === 'panic' || ctx !== ctx1) {
    ctx.shadowColor = 'rgba(255,255,255,.95)'; ctx.shadowBlur = 10;
    if (pose === 'panic') ctx.translate(Math.sin(t * 61) * 0.9, 0);   // 震え
  }
  ctx.translate(0, bob);
  ctx.rotate(ang);
  ctx.strokeStyle = ctx.fillStyle = '#1a1a1a';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  circle(0, -19.5, 3.3); ctx.fill();                       // 頭
  ctx.lineWidth = 6.4;                                     // 胴
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, -6); ctx.stroke();
  ctx.lineWidth = 2.6;                                     // 腕
  ctx.beginPath();
  if (pose === 'cheer') { ctx.moveTo(-3, -13); ctx.lineTo(-7.5, -21); ctx.moveTo(3, -13); ctx.lineTo(7.5, -21); }
  else if (pose === 'down') { ctx.moveTo(-3, -12); ctx.lineTo(-8, -13); ctx.moveTo(3, -12); ctx.lineTo(8, -14); }
  else if (pose === 'startle') { ctx.moveTo(-3.4, -12.5); ctx.lineTo(-8.5, -9); ctx.moveTo(3.4, -12.5); ctx.lineTo(8.5, -9); }
  else if (pose === 'panic') {                              // 両手をバタバタ
    const w = Math.sin(t * 24) * 3;
    ctx.moveTo(-3.2, -13); ctx.lineTo(-8 - w * 0.3, -21 + w); ctx.moveTo(3.2, -13); ctx.lineTo(8 + w * 0.3, -21 - w);
  }
  else { ctx.moveTo(-3.4, -12.5); ctx.lineTo(-6.8, -6); ctx.moveTo(3.4, -12.5); ctx.lineTo(6.8, -6); }
  ctx.stroke();
  ctx.lineWidth = 3;                                       // 脚
  ctx.beginPath();
  if (pose === 'panic') {
    const s = Math.sin(t * 20) * 1.6;
    ctx.moveTo(-1.6, -6); ctx.lineTo(-4.6 + s, 3); ctx.moveTo(1.6, -6); ctx.lineTo(4.6 - s, 3);
  } else {
    ctx.moveTo(-1.6, -6); ctx.lineTo(-3.8, 3); ctx.moveTo(1.6, -6); ctx.lineTo(3.8, 3);
  }
  ctx.stroke();
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  if (pose === 'startle') {                                // 頭の上に注意標識の「！」
    ctx.fillStyle = '#ffcc00'; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(5, -26.5); ctx.lineTo(-5, -26.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-0.55, -33, 1.1, 3.6); circle(0, -27.9, 0.7); ctx.fill();
  }
  if (pose === 'panic') {                                  // 汗のしずく
    ctx.fillStyle = '#bfe6ff'; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const ph = (t * 3 + i / 3) % 1, side = i % 2 ? 1 : -1;
      circle(side * (5 + ph * 7), -24 + ph * 9, 1.1 * (1 - ph * 0.4)); ctx.fill(); ctx.stroke();
    }
  }
  if (pose === 'down') {                                   // 天使の輪
    ctx.strokeStyle = '#e0a800'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, -27 + Math.sin(Fx.time * 4) * 0.5, 4.2, 1.5, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

// ホーム画面：おおきなピクトグラムが立っている（死ぬと、ここに倒れる）
function render(dt) {
  Fx.time += dt;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = stripePat || '#2a2a2a';
  ctx.fillRect(0, 0, VW, VH);
  ctx.setTransform(DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY);
  ctx.fillStyle = '#fbf8ee'; ctx.fillRect(0, 0, CFG.worldW, CFG.worldH);

  // 背景：ひし形の注意標識（大）
  ctx.save(); ctx.translate(50, 82); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ffcc00'; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-34, -34, 68, 68, 6) : ctx.rect(-34, -34, 68, 68);
  ctx.fill(); ctx.stroke(); ctx.restore();

  const dead = Game.phase === 'dead' && !Cine.holdMain;
  ctx.save(); ctx.translate(dead ? 40 : 50, 98); ctx.scale(1.9, 1.9);
  drawPerson(0, 0, dead ? 'down' : 'stand', dead ? Game.tPhase : 0);
  ctx.restore();

  // 死亡の瞬間だけ赤
  if (dead && Game.tPhase < 0.6) {
    ctx.fillStyle = 'rgba(224,48,30,' + (0.5 * (1 - Game.tPhase / 0.6)).toFixed(3) + ')';
    ctx.fillRect(0, 0, CFG.worldW, CFG.worldH);
  }
}
