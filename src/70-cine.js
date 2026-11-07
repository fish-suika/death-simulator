// ===== 死亡演出：全画面の場面（背景は 45-scenes.js がコードで描く）=====
// 流れ：止まる(0.3秒・色が抜ける) → 全画面の場面に切り替わる → 迫る(ピクトグラムが気づいて慌てる・寄りと揺れ) → 直撃で白く暗転 → 死因カード
// 場面が用意されていない死に方は Phase 1 の簡易演出（寝たひと）で続ける
const cineEl = $('cine'), cv2 = $('cv2'), ctx2 = cv2.getContext('2d');
const cineInner = $('cineInner'), cineFlash = $('cineFlash');

const Cine = {
  def: null,          // いまの死に方の場面の設定（死に方が決まったとき）
  pending: false,     // 止まってから場面が始まるまで（色が抜ける間）
  pendT: 0,
  on: false,          // 映像の再生中
  t: 0,               // 映像の経過秒
  impacted: false,
  afterT: 0,          // 直撃してからの経過秒
  holdMain: false,    // 下の円盤の画面を「立ったまま」にしておく
  k: 1,
};

// 見たことのある映像は飛ばせる（2回目から）
const SEEN_KEY = 'death-simulator-seen';
const seenMem = new Set();
function wasSeen(id) {
  if (seenMem.has(id)) return true;
  try { return (JSON.parse(localStorage.getItem(SEEN_KEY)) || []).indexOf(id) >= 0; } catch (_) { return false; }
}
function markSeen(id) {
  seenMem.add(id);
  try {
    const a = JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
    if (a.indexOf(id) < 0) { a.push(id); localStorage.setItem(SEEN_KEY, JSON.stringify(a)); }
  } catch (_) {}
}

function cineResize() {
  const r = $('stage').getBoundingClientRect();
  const d = Math.min(window.devicePixelRatio || 1, 2);
  cv2.width = Math.round(r.width * d); cv2.height = Math.round(r.height * d);
  Cine.k = r.width / CFG.worldW * d;
}

// 死に方が決まったとき、その死に方に場面があるかを決めておく
function cinePrepare(idx) {
  Cine.def = null;
  const def = DEATHS[idx] && DEATHS[idx].cine;
  if (def && Scenes[def.scene]) Cine.def = def;
}

// 死亡が決まった瞬間。全画面の場面で見せられるなら true
function cineEnter() {
  if (!Cine.def) return false;
  Cine.pending = true; Cine.pendT = 0; Cine.holdMain = true;
  cv.style.transition = 'filter .3s'; cv.style.filter = 'grayscale(1) brightness(.8)';
  $('msg').style.visibility = 'hidden';
  return true;
}

function cineBegin() {
  Cine.pending = false; Cine.on = true; Cine.t = 0; Cine.impacted = false; Cine.afterT = 0;
  cineResize();
  cineFlash.style.opacity = '0';
  cineEl.classList.remove('out'); cineEl.classList.add('show');
  Snd.cineStart(Cine.def.impactT, Cine.def.sound);
}

function cineImpact() {
  Cine.impacted = true; Cine.afterT = 0;
  cineFlash.style.background = Cine.def.flash || '#fff';     // 暗転の色は死に方ごと（白＝雷・雪・隕石／黒＝ほか）
  cineFlash.style.opacity = '1';
  ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, cv2.width, cv2.height);   // 当たった瞬間、ピクトグラムは見せない
  Snd.impact(Cine.def.flash);
  markSeen(Cine.def.id || DEATHS[Game.deathIdx].id);
}

// タップで飛ばす（2回目から）。直撃の直前までスキップ
function cineSkip() {
  if (!Cine.on || Cine.impacted) return;
  if (!wasSeen(DEATHS[Game.deathIdx].id)) return;
  Cine.t = Cine.def.impactT;
  Snd.cineCut();
}

function cineEnd() {
  Cine.on = false; Cine.holdMain = false;
  cineEl.classList.add('out');
  setTimeout(() => { if (!Cine.on) cineEl.classList.remove('show', 'out'); }, 450);
  cv.style.transition = ''; cv.style.filter = '';
  cineInner.style.transform = '';
  showCard();
}

function cineReset() {
  Cine.def = null; Cine.pending = false; Cine.on = false; Cine.holdMain = false; Cine.impacted = false;
  cineEl.classList.remove('show', 'out');
  cineFlash.style.opacity = '0';
  cineInner.style.transform = '';
  cv.style.transition = ''; cv.style.filter = '';
  Snd.cineCut();
}

function cineFrame(dt) {
  if (Cine.pending) {
    Cine.pendT += dt;
    if (Cine.pendT >= 0.3) cineBegin();
    return;
  }
  if (!Cine.on) return;
  const D = Cine.def;
  if (!Cine.impacted) {
    Cine.t += dt;
    const p = Math.min(1, Cine.t / D.impactT);
    // 寄り：だんだん速く。揺れ：後半から強く
    const zoom = 1 + 0.42 * p * p;
    const amp = Math.max(0, (p - 0.4) / 0.6);
    const W = cv2.getBoundingClientRect().width || 360;
    const dx = (Math.random() - 0.5) * 2 * W * 0.014 * amp * amp;
    const dy = (Math.random() - 0.5) * 2 * W * 0.014 * amp * amp;
    cineInner.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + zoom.toFixed(4) + ')';
    // ピクトグラム：のんびり立つ → 気づく → 慌てる
    const pose = Cine.t < 0.7 ? 'stand' : (Cine.t < 1.4 ? 'startle' : 'panic');
    const tp = pose === 'stand' ? Cine.t : (pose === 'startle' ? Cine.t - 0.7 : Cine.t - 1.4);
    ctx2.setTransform(Cine.k, 0, 0, Cine.k, 0, 0);
    Scenes[D.scene](ctx2, Math.min(Cine.t, D.impactT), p);   // 背景（全面を塗る）
    const saved = ctx; ctx = ctx2;
    ctx.save();
    ctx.translate(D.feet[0], D.feet[1]); ctx.scale(D.scale, D.scale);
    drawPerson(0, 0, pose, tp);
    ctx.restore();
    ctx = saved;
    if (Cine.t >= D.impactT) cineImpact();
  } else {
    Cine.afterT += dt;
    if (Cine.afterT >= 0.55) cineEnd();      // 白のまま一拍おいて、死因カードへ
  }
}

cineEl.addEventListener('pointerdown', e => { e.preventDefault(); cineSkip(); });
window.addEventListener('resize', () => { if (Cine.on) cineResize(); });
