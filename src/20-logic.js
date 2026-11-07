// ===== ゲームの中身（画面を使わない。verify.html でもそのまま動く）=====
const TAU = Math.PI * 2;
const mod = (a, m) => ((a % m) + m) % m;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const destOf = id => DESTS.find(d => d.id === id) || DESTS[0];

// その日・その行き先の「無事」の幅（円盤の何割か）
function safeFrac(day, dest) {
  const base = Math.max(CFG.safeMin, CFG.safeStart - CFG.safeStep * (day - 1));
  return Math.max(CFG.safeMin, Math.min(CFG.safeMax, base + destOf(dest).safeBonus));
}

// 図鑑まわり（画面側 65-dex.js が差し替える）。隠し枠（隕石）は、図鑑が 12 種そろうと円盤に出る
let HIDDEN_ON = false;
let DEX_HAS = () => false;                       // その死に方が図鑑に載っているか
const dexOpen = () => DEATHS.filter(d => !d.hidden && !DEX_HAS(d.id)).length;   // 図鑑の空き
const dexRegular = () => DEATHS.filter(d => !d.hidden).length;                  // 隠し枠をのぞく種類数

// 円盤のマスの重み。図鑑の空きが半分以下になったら、まだ載っていない死に方を少し太くする（最大 3 倍）
// （まれな死に方ほど出ないので、図鑑の最後が埋まらなくなるのを防ぐ）
function wheelWeight(i) {
  const d = DEATHS[i];
  if (d.hidden || DEX_HAS(d.id)) return d.weight;
  const got = dexRegular() - dexOpen(), half = dexRegular() / 2;
  return d.weight * (1 + 2 * Math.max(0, Math.min(1, (got - half) / half)));
}

// その行き先で出る死に方（番号）。どこでも出る物（any）は どの行き先にも入る
function destDeaths(dest) {
  const id = destOf(dest).id, out = [];
  DEATHS.forEach((d, i) => {
    if (d.hidden && !HIDDEN_ON) return;
    if (d.dest === id || d.dest === 'any') out.push(i);
  });
  return out;
}

// その日の円盤。円盤の上の角度 a(0〜TAU) で、[0, 無事) のあとに死に方のマスが並ぶ
function buildWheel(day, dest) {
  const p = safeFrac(day, dest);
  const wedges = [{ kind: 'safe', a0: 0, a1: TAU * p }];
  const list = destDeaths(dest);
  const total = list.reduce((s, i) => s + wheelWeight(i), 0);
  let a = TAU * p;
  list.forEach(i => {
    const w = TAU * (1 - p) * wheelWeight(i) / total;
    wedges.push({ kind: 'death', idx: i, a0: a, a1: a + w });
    a += w;
  });
  wedges[wedges.length - 1].a1 = TAU;
  return wedges;
}

function wedgeIndexAt(wedges, a) {
  a = mod(a, TAU);
  for (let i = 0; i < wedges.length; i++) if (a >= wedges[i].a0 && a < wedges[i].a1) return i;
  return wedges.length - 1;
}

// 円盤が rot だけ回っているとき、上の針の下にある円盤上の角度
const pointerLocal = rot => mod(-Math.PI / 2 - rot, TAU);

// 止まる位置を決める（境目から離す）
function pickStopAngle(rng) {
  let a = rng() * TAU;
  const m = CFG.edgeMargin;
  if (a < m) a = m;
  if (TAU - a < m) a = TAU - m;
  return a;
}
function nudgeFromEdges(wedges, a) {
  const m = CFG.edgeMargin;
  for (const w of wedges) {
    const d = a - w.a0;
    if (w.a0 > 0 && Math.abs(d) < m) a = w.a0 + (d < 0 ? -m : m);
  }
  return a;
}

// 無事で止まったときの、死のマス(= TAU*p 以降)までの近さ[度]と、近い側の死に方
function nearestDeath(wedges, a) {
  const edge = wedges[0].a1;                 // 無事の終わり = 最初の死のマスの始まり
  const toFirst = edge - a, toLast = a;      // 最初の死のマスまで / 最後の死のマス(=TAUの手前)まで
  if (toFirst <= toLast) return { deg: toFirst * 180 / Math.PI, idx: wedges[1].idx };
  return { deg: toLast * 180 / Math.PI, idx: wedges[wedges.length - 1].idx };
}

const Game = {
  reset(seed) {
    this.rng = mulberry32(seed == null ? (Math.random() * 2147483647) | 0 : seed);
    this.day = 1;
    this.dest = 'home';        // 今日の行き先
    this.phase = 'ready';      // ready → spin → safe → (next) ready … / spin → dead
    this.rot = 0;
    this.wedges = buildWheel(1, 'home');
    this.plan = null;
    this.stopA = 0;
    this.deathIdx = -1;
    this.near = null;          // 無事で止まったときのニアミス情報
    this.tPhase = 0;
    this.spinT = 0;
  },

  // 回す（行き先を選んで）。結果は先に乱数で決め、そこへ止まるように減速の曲線を逆算する
  spin(dest) {
    if (this.phase !== 'ready') return false;
    if (dest) { this.dest = destOf(dest).id; this.wedges = buildWheel(this.day, this.dest); }
    let a = pickStopAngle(this.rng);
    a = nudgeFromEdges(this.wedges, a);
    const target = this.wedges[wedgeIndexAt(this.wedges, a)];
    const phi0 = pointerLocal(this.rot);
    const turns = CFG.turnsMin + Math.floor(this.rng() * 2);
    const delta = mod(phi0 - a, TAU) + TAU * turns;      // 回転は時計回り(rot が増える)＝針の下の角度は減っていく
    this.plan = { rot0: this.rot, delta, a, target };
    this.stopA = a;
    this.spinT = 0;
    this.phase = 'spin';
    this.tPhase = 0;
    return true;
  },

  step(dt) {
    this.tPhase += dt;
    if (this.phase !== 'spin') return;
    this.spinT += dt;
    const u = Math.min(1, this.spinT / CFG.spinSecs);
    this.rot = this.plan.rot0 + this.plan.delta * (1 - Math.pow(1 - u, CFG.easePow));
    if (u >= 1) this.finishSpin();
  },

  finishSpin() {
    this.rot = this.plan.rot0 + this.plan.delta;
    const w = this.plan.target;
    this.tPhase = 0;
    if (w.kind === 'safe') {
      this.near = nearestDeath(this.wedges, this.plan.a);
      this.phase = 'safe';
    } else {
      this.deathIdx = w.idx;
      this.phase = 'dead';
    }
  },

  // 無事の翌日へ
  next() {
    if (this.phase !== 'safe') return false;
    this.day++;
    this.wedges = buildWheel(this.day, this.dest);
    this.plan = null;
    this.near = null;
    this.phase = 'ready';
    this.tPhase = 0;
    return true;
  },

  // いま針の下にあるマスの番号
  wedgeUnderPointer() {
    return wedgeIndexAt(this.wedges, pointerLocal(this.rot));
  },
};
