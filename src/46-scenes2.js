// ===== 死亡演出の背景（残りの 12 場面）。どれも Scenes.<id>(ctx, t, p)：t=経過秒、p=直撃までの進み(0〜1) =====
// 部品：塗りつぶし・雲のかたまり・霧・四隅の暗さ・粒（雪・胞子・ハチなど）。どの場面も全面を塗る
const SW = CFG.worldW, SH = CFG.worldH;
const rgb = (r, g, b) => 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
function vgrad(ctx, y0, y1, c0, c1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fillRect(0, y0, SW, y1 - y0 + 1);
}
function dark(ctx, a) { if (a > 0) { ctx.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, SW, SH); } }
function vig(ctx, a) {
  const g = ctx.createRadialGradient(50, 95, 30, 50, 95, 105);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + a.toFixed(3) + ')');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
}
function disc(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function fog(ctx, a, y0, y1, col) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.5, 'rgba(' + col + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
  ctx.fillStyle = g; ctx.fillRect(0, y0, SW, y1 - y0);
}
// 乱数で作った粒の配列
function seeded(seed, n, f) { const r = mulberry32(seed), a = []; for (let i = 0; i < n; i++) a.push(f(r, i)); return a; }

// ---- 家 ----
// 餅：こたつの部屋。お雑煮の餅がどんどん伸びて大きくなる。部屋が暗くなる
const mochiSteam = seeded(21, 14, r => ({ x: 36 + r() * 28, s: r(), w: r() * TAU }));
Scenes.mochi = function (ctx, t, p) {
  vgrad(ctx, 0, 112, rgb(238, 212, 170), rgb(205, 160, 110));
  ctx.fillStyle = rgb(170, 110, 70); ctx.fillRect(0, 112, SW, SH - 112);            // 床
  ctx.fillStyle = rgb(150, 92, 56); for (let i = 0; i < 9; i++) ctx.fillRect(0, 118 + i * 9, SW, 0.6);
  ctx.fillStyle = rgb(205, 110, 60); ctx.fillRect(10, 96, 80, 40);                   // こたつ布団
  ctx.fillStyle = rgb(160, 100, 60); ctx.fillRect(7, 88, 86, 9);                     // 天板
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(50, 88, 14, 5, 0, 0, TAU); ctx.fill();   // 椀
  ctx.fillStyle = rgb(190, 40, 40); ctx.beginPath(); ctx.ellipse(50, 87, 11, 3.2, 0, 0, TAU); ctx.fill();
  // 湯気
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.8;
  mochiSteam.forEach(s => { const ph = (t * 0.5 + s.s) % 1; ctx.beginPath(); ctx.moveTo(s.x, 84 - ph * 6); ctx.bezierCurveTo(s.x + 3, 76 - ph * 20, s.x - 3, 64 - ph * 24, s.x + Math.sin(t + s.w) * 3, 56 - ph * 30); ctx.stroke(); });
  // 伸びる餅
  const g = smooth(p), top = 84 - 66 * g, sway = Math.sin(t * 2.4) * 3 * g;
  ctx.strokeStyle = '#fffdf2'; ctx.lineCap = 'round';
  ctx.lineWidth = lerp(7, 3.5, g); ctx.beginPath(); ctx.moveTo(50, 87); ctx.quadraticCurveTo(50 + sway * 2, (87 + top) / 2, 50 + sway, top); ctx.stroke();
  disc(ctx, 50 + sway, top, lerp(7, 15, g), '#fffdf2');
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(50 + sway, top, lerp(7, 15, g) - 0.5, 0.4, 2.2); ctx.stroke();
  vig(ctx, 0.15 + 0.55 * p); dark(ctx, 0.25 * smooth(p * 1.3 - 0.3));
};

// 雪下ろし：軒下に立つ。屋根の雪がずるずる動き、大きなかたまりが落ちてくる
const snowFall = seeded(22, 90, r => ({ x: r() * SW, y: r() * SH, v: 8 + r() * 14, s: 0.4 + r() * 0.8 }));
Scenes.yuki = function (ctx, t, p) {
  vgrad(ctx, 0, SH, rgb(190, 202, 216), rgb(235, 240, 246));
  ctx.fillStyle = rgb(214, 196, 168); ctx.fillRect(0, 62, SW, 90);                    // 家の壁
  ctx.fillStyle = rgb(120, 100, 80); for (let i = 0; i < 8; i++) ctx.fillRect(i * 13 + 3, 78, 8, 16);  // 窓がわり
  ctx.fillStyle = rgb(70, 70, 80); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(SW, 0); ctx.lineTo(SW, 52); ctx.lineTo(0, 64); ctx.closePath(); ctx.fill();   // 屋根
  ctx.fillStyle = '#f7fafc'; ctx.fillRect(0, 150, SW, SH - 150);                      // 雪の地面
  const g = smooth(p);
  // 屋根の雪（ずり落ちる）
  const slide = g * g * 78, rot = g * 0.35;
  ctx.save(); ctx.translate(50, 30 + slide); ctx.rotate(-rot * 0.25);
  ctx.fillStyle = '#fbfdff'; ctx.beginPath(); ctx.moveTo(-50 - 6, -22); ctx.lineTo(56, -22); ctx.lineTo(56 + g * 5, 22 + g * 22); ctx.quadraticCurveTo(0, 30 + g * 22, -56, 18 + g * 14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,150,190,0.5)'; ctx.lineWidth = 0.7; ctx.stroke(); ctx.restore();
  // つらら
  ctx.fillStyle = 'rgba(230,245,255,0.9)'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(i * 9 + 2, 58 + slide * 0.2); ctx.lineTo(i * 9 + 5, 58 + slide * 0.2); ctx.lineTo(i * 9 + 3.5, 66 + (i % 3) * 3 + slide * 0.2); ctx.fill(); }
  // 雪
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  snowFall.forEach(s => { const y = (s.y + t * s.v) % SH, x = s.x + Math.sin(t + s.s * 9) * 2; ctx.beginPath(); ctx.arc(x, y, s.s, 0, TAU); ctx.fill(); });
  vig(ctx, 0.12 + 0.4 * p);
};

// フグ：夜の台所。ライトがちらつき、フグがふくらんで目が光る
Scenes.fugu = function (ctx, t, p) {
  vgrad(ctx, 0, SH, rgb(14, 18, 28), rgb(30, 26, 30));
  ctx.fillStyle = rgb(56, 48, 44); ctx.fillRect(0, 108, SW, 70);                     // カウンター
  ctx.fillStyle = rgb(210, 180, 130); ctx.fillRect(14, 104, 72, 6);                   // まな板
  const fl = 0.55 + 0.45 * (Math.sin(t * 37) * Math.sin(t * 23) > 0.2 ? 1 : 0.35) * (p > 0.5 ? 1 : 0.9 + 0.1 * Math.sin(t * 5));
  // ライトの光
  const lg = ctx.createRadialGradient(50, 98, 2, 50, 98, 55);
  lg.addColorStop(0, 'rgba(255,240,200,' + (0.55 * fl).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = lg; ctx.fillRect(0, 40, SW, 110);
  // フグ
  const s = 1 + 0.5 * smooth(p);
  ctx.save(); ctx.translate(50, 94); ctx.scale(s, s);
  ctx.fillStyle = rgb(226, 214, 176); ctx.beginPath(); ctx.ellipse(0, 0, 17, 12, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(27, -7); ctx.lineTo(27, 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgb(120, 110, 92); [[-6, -6, 2.4], [2, -8, 2], [8, -3, 2.2], [-1, -3, 1.6]].forEach(([x, y, r]) => disc(ctx, x, y, r, rgb(120, 110, 92)));
  ctx.fillStyle = rgb(236, 226, 200); ctx.beginPath(); ctx.ellipse(-2, 7, 11, 4, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgb(120, 110, 92); ctx.lineWidth = 0.8; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + i * 0.1) * 1.6 + 3.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 11); ctx.lineTo(Math.cos(a) * (19 + 3 * p), Math.sin(a) * (14 + 3 * p)); ctx.stroke(); }
  disc(ctx, -10, -3, 3.2, '#fff'); disc(ctx, -10, -3, 1.6, '#111');
  const eg = clamp01((p - 0.5) / 0.5); if (eg > 0) { disc(ctx, -10, -3, 3.6, 'rgba(255,60,40,' + (0.8 * eg).toFixed(3) + ')'); disc(ctx, -10, -3, 1.6, '#111'); }
  ctx.restore();
  vig(ctx, 0.35 + 0.5 * p);
};

// 毒キノコ：うす暗い森。きれいなキノコがほのかに光り、胞子が漂い、霧が濃くなる
const sporeP = seeded(24, 50, r => ({ x: r() * SW, y: r() * SH, s: 0.3 + r() * 0.7, w: r() * TAU }));
Scenes.kinoko = function (ctx, t, p) {
  vgrad(ctx, 0, 130, rgb(20, 34, 30), rgb(44, 70, 56));
  const tr = seeded(25, 9, r => ({ x: r() * SW, w: 4 + r() * 6, c: 20 + r() * 20 }));
  tr.forEach(o => { ctx.fillStyle = rgb(o.c, o.c + 16, o.c + 8); ctx.fillRect(o.x, 0, o.w, 135); });
  vgrad(ctx, 128, SH, rgb(46, 62, 36), rgb(24, 34, 22));
  fog(ctx, 0.25 + 0.4 * p, 70, 150, '170,200,180');
  const g = smooth(p), gl = 0.35 + 0.35 * Math.sin(t * 3) * 0.3 + 0.5 * g;
  const cg = ctx.createRadialGradient(50, 140, 2, 50, 140, 38 + 20 * g);
  cg.addColorStop(0, 'rgba(255,150,210,' + gl.toFixed(3) + ')'); cg.addColorStop(1, 'rgba(255,150,210,0)');
  ctx.fillStyle = cg; ctx.fillRect(0, 90, SW, 80);
  [[40, 142, 0.9], [50, 138, 1.3], [61, 143, 0.8], [33, 146, 0.6], [68, 147, 0.55]].forEach(([x, y, k]) => {
    const sc = k * (1 + 0.5 * g);
    ctx.fillStyle = rgb(230, 225, 205); ctx.fillRect(x - 1.6 * sc, y - 4 * sc, 3.2 * sc, 8 * sc);
    ctx.fillStyle = rgb(210, 60, 120); ctx.beginPath(); ctx.ellipse(x, y - 4 * sc, 8 * sc, 5 * sc, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff'; [[-3, -6], [2, -7], [5, -5]].forEach(([dx, dy]) => disc(ctx, x + dx * sc, y + dy * sc, 0.9 * sc, '#fff'));
  });
  ctx.fillStyle = 'rgba(255,200,240,0.7)';
  sporeP.forEach(s => { const y = (s.y - t * 3 * s.s + SH) % SH, x = s.x + Math.sin(t * 0.8 + s.w) * 4; ctx.beginPath(); ctx.arc(x, y, 0.5 * s.s + 0.3, 0, TAU); ctx.fill(); });
  vig(ctx, 0.3 + 0.5 * p);
};

// お風呂：湯気で画面が真っ白になっていく。のぼせて赤くなる
const bathSteam = seeded(26, 26, r => ({ x: r() * SW, y: 40 + r() * 120, r: 8 + r() * 16, s: r(), w: r() * TAU }));
Scenes.furo = function (ctx, t, p) {
  vgrad(ctx, 0, 120, rgb(176, 208, 218), rgb(150, 188, 200));
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= SW; x += 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 120); ctx.stroke(); }
  for (let y = 0; y <= 120; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SW, y); ctx.stroke(); }
  ctx.fillStyle = rgb(236, 240, 242); ctx.beginPath(); ctx.moveTo(0, 118); ctx.lineTo(SW, 118); ctx.lineTo(SW, SH); ctx.lineTo(0, SH); ctx.closePath(); ctx.fill();  // 浴槽
  vgrad(ctx, 128, SH, rgb(120, 190, 220), rgb(80, 160, 200));                        // お湯
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); for (let x = 0; x <= SW; x += 4) ctx.lineTo(x, 134 + i * 7 + Math.sin(x * 0.2 + t * 2 + i) * 1); ctx.stroke(); }
  const g = smooth(p);
  bathSteam.forEach(s => {
    const ph = (t * 0.25 + s.s) % 1, y = s.y - ph * 40 * (0.5 + g), x = s.x + Math.sin(t * 0.7 + s.w) * 6;
    const gr = ctx.createRadialGradient(x, y, 1, x, y, s.r * (1 + g));
    gr.addColorStop(0, 'rgba(255,255,255,' + (0.18 + 0.4 * g).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - s.r * 2, y - s.r * 2, s.r * 4, s.r * 4);
  });
  ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * g).toFixed(3) + ')'; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = 'rgba(255,90,70,' + (0.3 * g * g).toFixed(3) + ')'; ctx.fillRect(0, 0, SW, SH);   // のぼせ
  vig(ctx, 0.15 + 0.5 * p);
};

// ---- 山 ----
// ハチ：夏の山道。ハチの群れが寄ってきて、画面をうめる
const bees = seeded(31, 70, r => ({ sx: 70 + r() * 60, sy: -10 + r() * 90, d: r() * 1.6, w: r() * TAU, k: 0.6 + r() * 0.8 }));
Scenes.hachi = function (ctx, t, p) {
  vgrad(ctx, 0, 100, rgb(96, 176, 232), rgb(200, 232, 248));
  [[rgb(120, 168, 120), 88, 16], [rgb(86, 140, 90), 100, 22], [rgb(60, 112, 66), 112, 20]].forEach(([c, y, h], i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= SW; x += 10) ctx.lineTo(x, y - Math.sin(x * 0.07 + i * 2) * h * 0.5); ctx.lineTo(SW, SH); ctx.lineTo(0, SH); ctx.fill(); });
  vgrad(ctx, 122, SH, rgb(168, 130, 88), rgb(120, 90, 60));                           // 道
  ctx.fillStyle = rgb(70, 130, 60); for (let i = 0; i < 40; i++) { const x = (i * 37) % SW; ctx.fillRect(x, 122 + (i * 13) % 6, 0.8, 5); }
  const tx = 50, ty = 120;
  bees.forEach(b => {
    const u = clamp01((p * 1.15 - b.d * 0.35) / 0.65), e = u * u * (3 - 2 * u);
    const x = lerp(b.sx, tx + Math.sin(b.w + t * 6) * 10 * b.k, e) + Math.sin(t * 9 + b.w) * 1.2, y = lerp(b.sy, ty + Math.cos(b.w * 2 + t * 7) * 14 * b.k, e) + Math.cos(t * 11 + b.w) * 1.2;
    const s = 0.8 + 1.6 * e * b.k;
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(x, y, 1.6 * s, 1.1 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(x - 0.4 * s, y - 1 * s, 0.7 * s, 2 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - 0.2 * s, y - 1.3 * s, 1 * s, 0.6 * s, Math.sin(t * 60 + b.w) * 0.5, 0, TAU); ctx.fill();
  });
  dark(ctx, 0.5 * smooth((p - 0.55) / 0.45)); vig(ctx, 0.1 + 0.4 * p);
};

// 毒ヘビ：足もとの落ち葉。ヘビが横からすべってくる
const leaves = seeded(32, 60, r => ({ x: r() * SW, y: 100 + r() * 78, a: r() * TAU, k: 2 + r() * 3, c: r() }));
Scenes.hebi = function (ctx, t, p) {
  vgrad(ctx, 0, 100, rgb(40, 64, 40), rgb(74, 102, 60));
  ctx.fillStyle = rgb(30, 50, 32); for (let i = 0; i < 6; i++) ctx.fillRect(i * 19 + 4, 0, 7, 105);
  vgrad(ctx, 100, SH, rgb(96, 70, 40), rgb(60, 44, 28));
  leaves.forEach(l => { ctx.fillStyle = l.c < 0.4 ? rgb(150, 90, 40) : (l.c < 0.7 ? rgb(176, 130, 50) : rgb(110, 70, 36)); ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a); ctx.beginPath(); ctx.ellipse(0, 0, l.k, l.k * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); });
  // ヘビ：右から体をくねらせて進む
  const head = lerp(128, 50, smooth(Math.min(1, p * 1.15))), N = 60, wid = 5.2 + 2.4 * p;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? '#2a2f1c' : rgb(110, 120, 56); ctx.lineWidth = pass === 0 ? wid + 1.2 : wid;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const x = head + i * 2.2, y = 150 + Math.sin(i * 0.28 - t * 5) * 6 * (0.4 + i / N * 0.6); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  ctx.strokeStyle = rgb(70, 60, 30); ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 4; i <= N; i += 6) { const x = head + i * 2.2, y = 150 + Math.sin(i * 0.28 - t * 5) * 6 * (0.4 + i / N * 0.6); ctx.moveTo(x, y - wid / 2); ctx.lineTo(x, y + wid / 2); } ctx.stroke();
  const hy = 150 + Math.sin(-t * 5) * 2.4;
  ctx.fillStyle = rgb(120, 130, 60); ctx.beginPath(); ctx.ellipse(head - 1, hy, 4.6, 3.4, 0, 0, TAU); ctx.fill();
  disc(ctx, head - 1.5, hy - 1.2, 0.9, '#ffd700'); disc(ctx, head - 1.5, hy - 1.2, 0.4, '#111');
  if (Math.sin(t * 12) > 0) { ctx.strokeStyle = '#d02020'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(head - 5, hy); ctx.lineTo(head - 9, hy); ctx.lineTo(head - 10.5, hy - 1.2); ctx.moveTo(head - 9, hy); ctx.lineTo(head - 10.5, hy + 1.2); ctx.stroke(); }
  vig(ctx, 0.25 + 0.45 * p);
};

// 雪崩：雪山の斜面。上から白い雪煙のかたまりが、どんどん大きくなって降りてくる
const sn = seeded(33, 80, r => ({ x: r() * 120 - 10, y: r(), r: 6 + r() * 14, w: r() * TAU, v: 0.6 + r() * 0.8 }));
Scenes.nadare = function (ctx, t, p) {
  vgrad(ctx, 0, 90, rgb(92, 150, 220), rgb(190, 222, 246));
  ctx.fillStyle = rgb(245, 248, 252); ctx.beginPath(); ctx.moveTo(-5, 100); ctx.lineTo(40, 14); ctx.lineTo(70, 54); ctx.lineTo(105, 8); ctx.lineTo(105, 120); ctx.closePath(); ctx.fill();   // 山
  ctx.fillStyle = rgb(196, 214, 236); ctx.beginPath(); ctx.moveTo(40, 14); ctx.lineTo(70, 54); ctx.lineTo(56, 110); ctx.lineTo(30, 60); ctx.closePath(); ctx.fill();   // 山の影
  vgrad(ctx, 100, SH, rgb(236, 242, 250), rgb(206, 220, 238));                         // 雪の斜面
  ctx.strokeStyle = 'rgba(150,170,200,0.5)'; ctx.lineWidth = 0.5; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 14, 178); ctx.lineTo(30 + i * 9, 110); ctx.stroke(); }
  const g = smooth(p), front = lerp(-20, 118, g * g);
  sn.forEach(b => {
    const y = front - b.y * 70 * (0.4 + g) + Math.sin(t * 3 + b.w) * 2, r = b.r * (0.8 + 1.4 * g);
    if (y < -r) return;
    const gr = ctx.createRadialGradient(b.x, y, r * 0.1, b.x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.97)'); gr.addColorStop(1, 'rgba(235,242,252,0.0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, y, r, 0, TAU); ctx.fill();
  });
  const mass = ctx.createLinearGradient(0, front - 40, 0, front + 30); mass.addColorStop(0, 'rgba(255,255,255,0)'); mass.addColorStop(1, 'rgba(255,255,255,' + (0.85 * g).toFixed(3) + ')');
  ctx.fillStyle = mass; ctx.fillRect(0, 0, SW, SH);
  vig(ctx, 0.1 + 0.3 * p);
};

// 山の遭難：夕ぐれの尾根。霧が出て、道が二つに分かれ、暗くなる
Scenes.sangaku = function (ctx, t, p) {
  vgrad(ctx, 0, 110, rgb(lerp(110, 22, p), lerp(160, 18, p), lerp(210, 40, p)), rgb(lerp(250, 70, p), lerp(190, 40, p), lerp(120, 60, p)));
  [[rgb(86, 100, 120), 70, 30], [rgb(58, 72, 92), 88, 26], [rgb(34, 46, 62), 104, 22]].forEach(([c, y, h], i) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, SH); ctx.lineTo(0, y);
    for (let x = 0; x <= SW; x += 6) ctx.lineTo(x, y - Math.abs(Math.sin(x * 0.045 + i * 1.7)) * h);
    ctx.lineTo(SW, SH); ctx.fill();
  });
  vgrad(ctx, 112, SH, rgb(70, 78, 56), rgb(36, 40, 30));
  ctx.strokeStyle = rgb(206, 190, 150); ctx.lineCap = 'round'; ctx.lineWidth = 5;                         // 道（二手に分かれる）
  ctx.beginPath(); ctx.moveTo(50, 178); ctx.lineTo(50, 150); ctx.stroke();
  ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(50, 150); ctx.quadraticCurveTo(36, 134, 22, 116); ctx.moveTo(50, 150); ctx.quadraticCurveTo(64, 134, 84, 118); ctx.stroke();
  fog(ctx, 0.3 + 0.5 * p, 60, 150, '210,218,226');
  fog(ctx, 0.2 + 0.45 * p, 110, 178, '210,218,226');
  if (p > 0.6) { ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * (p - 0.6)).toFixed(3) + ')'; [[18, 14], [60, 22], [80, 10], [35, 30], [90, 36]].forEach(([x, y]) => ctx.fillRect(x, y, 0.8, 0.8)); }
  dark(ctx, 0.5 * smooth((p - 0.3) / 0.7)); vig(ctx, 0.2 + 0.4 * p);
};

// ---- 海 ----
// 釣り：夕ぐれの防波堤。大きな波がせり上がってくる
const spray = seeded(41, 40, r => ({ x: r() * SW, s: r(), v: 10 + r() * 18 }));
Scenes.tsuri = function (ctx, t, p) {
  vgrad(ctx, 0, 96, rgb(lerp(250, 30, p * 0.8), lerp(170, 24, p * 0.8), lerp(120, 50, p * 0.8)), rgb(lerp(255, 120, p * 0.8), lerp(214, 70, p * 0.8), lerp(150, 90, p * 0.8)));
  disc(ctx, 78, 84, 9, 'rgba(255,230,170,' + (0.9 * (1 - p)).toFixed(3) + ')');
  vgrad(ctx, 90, 140, rgb(40, 96, 120), rgb(14, 40, 64));                             // 海
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.5; for (let i = 0; i < 8; i++) { ctx.beginPath(); for (let x = 0; x <= SW; x += 5) ctx.lineTo(x, 96 + i * 5 + Math.sin(x * 0.15 + t * 1.5 + i) * 1.2); ctx.stroke(); }
  const g = smooth(p), wy = lerp(140, 24, g);                                          // 波
  ctx.fillStyle = rgb(18, 64, 96); ctx.beginPath(); ctx.moveTo(-5, 150); ctx.lineTo(-5, wy + 18);
  for (let x = -5; x <= 105; x += 5) ctx.lineTo(x, wy + Math.sin(x * 0.12 + t * 2) * 3 + Math.max(0, (x - 40) * 0.25) * g);
  ctx.lineTo(105, 150); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let x = -5; x <= 105; x += 5) { ctx.beginPath(); ctx.arc(x, wy + Math.sin(x * 0.12 + t * 2) * 3 + Math.max(0, (x - 40) * 0.25) * g, 2.8, 0, TAU); ctx.fill(); }
  ctx.fillStyle = rgb(120, 124, 130); ctx.fillRect(0, 138, SW, SH - 138);              // 防波堤
  ctx.fillStyle = rgb(150, 154, 160); ctx.fillRect(0, 138, SW, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; spray.forEach(s => { const y = 138 - ((t * s.v + s.s * 60) % 60) * g, x = s.x; if (g > 0.15) ctx.fillRect(x, y, 0.7, 0.7); });
  dark(ctx, 0.35 * g); vig(ctx, 0.15 + 0.4 * p);
};

// 海で溺れる：晴れた浜。波打ち際の波が沖へ引いていく（離岸流）。海の色が濃くなる
Scenes.umi = function (ctx, t, p) {
  vgrad(ctx, 0, 70, rgb(86, 170, 236), rgb(190, 228, 250));
  const g = smooth(p);
  vgrad(ctx, 70, 128, rgb(lerp(60, 14, g), lerp(190, 74, g), lerp(210, 120, g)), rgb(lerp(30, 8, g), lerp(130, 50, g), lerp(180, 90, g)));
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.5;
  for (let i = 0; i < 12; i++) { const y = 74 + i * 4.5, x0 = ((t * (6 + g * 24) + i * 23) % 120) - 10; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 8, y); ctx.stroke(); }
  ctx.fillStyle = rgb(160, 120, 90); ctx.fillRect(0, 122, 6, 2);
  vgrad(ctx, 124, SH, rgb(236, 214, 170), rgb(206, 178, 130));                         // 砂浜
  // 引いていく波（岸から沖へ）
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 4; k++) { const ph = (t * (0.5 + g * 1.1) + k / 4) % 1, y = 128 - ph * 52; ctx.beginPath(); for (let x = 0; x <= SW; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.2 + k) * 1.4); ctx.lineTo(SW, y + 2.4); ctx.lineTo(0, y + 2.4); ctx.fill(); }
  // 沖へのびる暗い筋（離岸流）
  const rip = ctx.createLinearGradient(0, 70, 0, 130); rip.addColorStop(0, 'rgba(10,40,70,0)'); rip.addColorStop(1, 'rgba(10,40,70,' + (0.5 * g).toFixed(3) + ')');
  ctx.fillStyle = rip; ctx.beginPath(); ctx.moveTo(36, 130); ctx.lineTo(64, 130); ctx.lineTo(54, 70); ctx.lineTo(46, 70); ctx.fill();
  dark(ctx, 0.3 * g); vig(ctx, 0.12 + 0.4 * p);
};

// ---- 空 ----
// 隕石（隠し枠）：夜空の星。光る点がみるみる大きくなり、火の玉になる。一番派手
const stars = seeded(51, 110, r => ({ x: r() * SW, y: r() * 130, s: 0.3 + r() * 0.8, w: r() * TAU }));
Scenes.inseki = function (ctx, t, p) {
  vgrad(ctx, 0, SH, rgb(6, 8, 24), rgb(22, 24, 52));
  stars.forEach(s => { ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + 0.4 * Math.sin(t * 2 + s.w)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 0.6, 0, TAU); ctx.fill(); });
  ctx.fillStyle = rgb(10, 12, 20); ctx.beginPath(); ctx.moveTo(0, 150); for (let x = 0; x <= SW; x += 8) ctx.lineTo(x, 142 - Math.abs(Math.sin(x * 0.06)) * 18); ctx.lineTo(SW, SH); ctx.lineTo(0, SH); ctx.fill();
  const g = p * p, x = lerp(80, 52, p), y = lerp(8, 118, g), r = lerp(0.8, 20, g);
  // 尾
  const tg = ctx.createLinearGradient(x + 34 * (1 - p) + 8, y - 70 * (1 - p) - 10, x, y);
  tg.addColorStop(0, 'rgba(255,170,60,0)'); tg.addColorStop(1, 'rgba(255,200,120,' + (0.9 * Math.min(1, p * 1.5)).toFixed(3) + ')');
  ctx.strokeStyle = tg; ctx.lineCap = 'round'; ctx.lineWidth = r * 1.6;
  ctx.beginPath(); ctx.moveTo(x + 60 * (1 - p) + 10, y - 100 * (1 - p) - 12); ctx.lineTo(x, y); ctx.stroke();
  const gl = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2);
  gl.addColorStop(0, 'rgba(255,250,220,1)'); gl.addColorStop(0.35, 'rgba(255,170,60,0.6)'); gl.addColorStop(1, 'rgba(255,100,20,0)');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, SW, SH);
  disc(ctx, x, y, r, rgb(255, 244, 200));
  ctx.fillStyle = 'rgba(255,230,190,' + (0.35 * g).toFixed(3) + ')'; ctx.fillRect(0, 0, SW, SH);   // 空全体が明るくなる
  vig(ctx, 0.25 * (1 - p));
};
