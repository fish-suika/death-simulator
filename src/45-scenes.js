// ===== 死亡演出の背景（動画は使わず、全部コードで描く）=====
// どの場面も Scenes.<id>(ctx, t, p)：ctx は世界座標（幅100×高さ177.8）の変換つき、t は経過秒、p は直撃までの進み(0〜1)。
// ピクトグラムはこの上に 70-cine.js が重ねる。寄り・揺れも 70-cine.js が全体にかける
const Scenes = {};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const rgbMix = (c1, c2, t) => 'rgb(' + Math.round(lerp(c1[0], c2[0], t)) + ',' + Math.round(lerp(c1[1], c2[1], t)) + ',' + Math.round(lerp(c1[2], c2[2], t)) + ')';

// ぎざぎざの稲妻（中点をずらして分けていく）。枝つき
function boltPath(rnd, x0, y0, x1, y1, spread, depth) {
  let pts = [[x0, y0], [x1, y1]];
  for (let d = 0; d < 5; d++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      next.push([(a[0] + b[0]) / 2 + (rnd() - 0.5) * spread / (d + 1), (a[1] + b[1]) / 2 + (rnd() - 0.5) * spread * 0.25 / (d + 1)], b);
    }
    pts = next;
  }
  const out = [pts];
  if (depth > 0) {
    for (let i = 3; i < pts.length - 3; i += 6) {
      if (rnd() < 0.55) {
        const p = pts[i], dir = rnd() < 0.5 ? -1 : 1;
        out.push(...boltPath(rnd, p[0], p[1], p[0] + dir * (6 + rnd() * 12), p[1] + 14 + rnd() * 18, 5, depth - 1));
      }
    }
  }
  return out;
}
function strokeBolt(ctx, paths, a) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  [[3.2, 0.16, '#9cc8ff'], [1.4, 0.5 * a, '#cfe6ff'], [0.55, a, '#ffffff']].forEach(([w, al, col]) => {
    ctx.strokeStyle = col; ctx.globalAlpha = al; ctx.lineWidth = w;
    paths.forEach((pts, k) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    });
  });
  ctx.globalAlpha = 1;
}

// 落雷：のどかな野原 → 積乱雲がわき上がる → 雨と風 → 雲の中で雷が光る → 稲妻が地面に届く
Scenes.rakurai = (() => {
  const W = CFG.worldW, H = CFG.worldH, HZ = 128;
  const r0 = mulberry32(7);
  const blobs = [];
  for (let i = 0; i < 110; i++) {
    blobs.push({ x: 50 + (r0() - 0.5) * 120 * (0.35 + 0.65 * r0()), y: lerp(HZ - 6, 8, Math.pow(r0(), 0.85)), r: 9 + r0() * 17, d: r0() * TAU });
  }
  blobs.sort((a, b) => a.y - b.y);
  const small = [[18, 30, 12], [70, 20, 9], [46, 52, 14], [84, 62, 10], [26, 78, 11]];
  const blades = [];
  for (let i = 0; i < 320; i++) blades.push({ x: r0() * W, y: HZ + 1 + Math.pow(r0(), 0.7) * (H - HZ), s: r0() * TAU });
  const flashes = [[0.9, 0.14, 30], [1.55, 0.12, 66], [2.05, 0.12, 42], [2.5, 0.16, 56]];

  return function (ctx, t, p) {
    const g = smooth(p * 1.1);                    // 雲のわき上がり
    // 空
    const sky = ctx.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, rgbMix([64, 148, 226], [18, 24, 36], Math.pow(p, 1.1)));
    sky.addColorStop(1, rgbMix([205, 230, 250], [98, 110, 128], p));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 1);
    // のどかな小さい雲（嵐が来ると消える）
    ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * (1 - smooth(p * 1.6))).toFixed(3) + ')';
    small.forEach(([x, y, r], i) => {
      const dx = (x + t * 1.6 * (0.5 + i * 0.2)) % 130 - 15;
      ctx.beginPath(); ctx.ellipse(dx, y, r * 1.4, r * 0.5, 0, 0, TAU); ctx.ellipse(dx + r * 0.6, y - r * 0.2, r * 0.8, r * 0.5, 0, 0, TAU); ctx.fill();
    });
    // 積乱雲：地平線から立ち上がる。上は明るく、底は暗い
    const base = [150, 165, 185], top = [245, 248, 255], baseS = [20, 26, 38], topS = [92, 104, 124];
    const cb = base.map((v, i) => lerp(v, baseS[i], p)), ct = top.map((v, i) => lerp(v, topS[i], p));
    blobs.forEach(b => {
      const h = (HZ - b.y) / (HZ - 8);
      const yy = HZ - (HZ - b.y) * (0.1 + 0.9 * g);
      const rr = b.r * (0.45 + 0.75 * g);
      const w = Math.sin(t * 0.5 + b.d) * 1.2;
      ctx.fillStyle = rgbMix(cb, ct, Math.min(1, h * 0.75));
      ctx.beginPath(); ctx.arc(b.x + w, yy, rr, 0, TAU); ctx.fill();
    });
    // 雨のカーテン
    const rain = ctx.createLinearGradient(0, 60, 0, HZ);
    rain.addColorStop(0, 'rgba(60,70,86,0)'); rain.addColorStop(1, 'rgba(70,82,100,' + (0.55 * g).toFixed(3) + ')');
    ctx.fillStyle = rain; ctx.fillRect(14, 60, 72, HZ - 60);
    // 地面と草
    const gr = ctx.createLinearGradient(0, HZ, 0, H);
    gr.addColorStop(0, rgbMix([128, 156, 78], [58, 74, 52], p)); gr.addColorStop(1, rgbMix([70, 104, 48], [22, 34, 26], p));
    ctx.fillStyle = gr; ctx.fillRect(0, HZ, W, H - HZ);
    const wind = 0.25 + 1.7 * p;
    ctx.lineCap = 'round';
    blades.forEach(b => {
      const len = 2.2 + (b.y - HZ) / (H - HZ) * 7;
      const sw = Math.sin(t * (3 + wind) + b.x * 0.4 + b.s) * wind * len * 0.35 + wind * len * 0.25;
      ctx.strokeStyle = rgbMix([118, 150, 64], [34, 48, 34], p * 0.8 + (b.y - HZ) / (H - HZ) * 0.2);
      ctx.lineWidth = 0.5 + (b.y - HZ) / (H - HZ) * 0.7;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + sw, b.y - len); ctx.stroke();
    });
    // 雨すじ（後半）
    if (p > 0.45) {
      const n = Math.floor(70 * clamp01((p - 0.45) / 0.55));
      ctx.strokeStyle = 'rgba(210,225,245,0.35)'; ctx.lineWidth = 0.25;
      const rr = mulberry32(Math.floor(t * 30) + 11);
      for (let i = 0; i < n; i++) {
        const x = rr() * W, y = rr() * H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2.5, y + 9); ctx.stroke();
      }
    }
    // 雲の中の雷（ぱっと光る）
    let glow = 0;
    flashes.forEach(([t0, dur, fx]) => {
      const u = (t - t0) / dur;
      if (u >= 0 && u < 1) {
        const a = 1 - u;
        glow = Math.max(glow, a * 0.5);
        const rg = ctx.createRadialGradient(fx, 46, 2, fx, 46, 36);
        rg.addColorStop(0, 'rgba(230,240,255,' + (0.85 * a).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(230,240,255,0)');
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, HZ);
        strokeBolt(ctx, boltPath(mulberry32(Math.floor(t0 * 100)), fx, 30, fx + 10, 70, 10, 1), 0.7 * a);
      }
    });
    // 稲妻が地面まで届く：だんだん太く・チカチカ
    if (t > 2.7) {
      const rr = mulberry32(Math.floor(t * 11) + 3);
      const gp = clamp01((t - 2.7) / 0.6);
      const flick = 0.55 + 0.45 * ((Math.floor(t * 22) % 2) ? 1 : 0.6);
      strokeBolt(ctx, boltPath(rr, 55, 18, 52, HZ + 6, 12, 2), flick * (0.6 + 0.4 * gp));
      glow = Math.max(glow, 0.3 + 0.4 * gp);
      const gg = ctx.createRadialGradient(52, HZ + 4, 1, 52, HZ + 4, 30);
      gg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * gp).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(200,225,255,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, HZ - 30, W, 60);
    }
    if (glow > 0) { ctx.fillStyle = 'rgba(220,235,255,' + (glow * 0.35).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    // 四隅を暗く（映画のように）
    const vg = ctx.createRadialGradient(50, 95, 30, 50, 95, 105);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (0.15 + 0.5 * p).toFixed(3) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  };
})();
