// ===== ゲームの中身（画面を使わない。verify.html でもそのまま動く）=====
// ルーレットと行き先選びはやめた（テストプレイで「毎回選ぶのが面倒」と言われたため）。
// タップすると、実データの比にそった重みで死に方がひとつ決まり、すぐその場面が流れる
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

// 図鑑まわり（画面側 65-dex.js が差し替える）。隠し枠（隕石）は、図鑑が 12 種そろうと出る
let HIDDEN_ON = false;
let DEX_HAS = () => false;                       // その死に方が図鑑に載っているか
const dexOpen = () => DEATHS.filter(d => !d.hidden && !DEX_HAS(d.id)).length;   // 図鑑の空き
const dexRegular = () => DEATHS.filter(d => !d.hidden).length;                  // 隠し枠をのぞく種類数

// 死に方の重み。図鑑にまだ載っていない死に方は、載っている数が増えるほど太くなる（最大 1+CFG.boostMax 倍）。
// まれな死に方ほど出ないので、そのままだと図鑑の最後が埋まらなくなるのを防ぐ（設定資料 5.10）
function wheelWeight(i) {
  const d = DEATHS[i];
  if (DEX_HAS(d.id)) return d.weight;      // 隠し枠（隕石）も、出られるようになったあとはまだ載っていなければ最大まで太くなる（約 15%）
  const got = dexRegular() - dexOpen();
  return d.weight * (1 + CFG.boostMax * Math.max(0, Math.min(1, (got - CFG.boostFrom) / (dexRegular() - 1 - CFG.boostFrom))));
}

// 出る可能性のある死に方（番号）。隠し枠は図鑑がそろうまで出ない
function candidates() {
  const out = [];
  DEATHS.forEach((d, i) => { if (!d.hidden || HIDDEN_ON) out.push(i); });
  return out;
}

// 死に方をひとつ決める
function pickDeath(rng) {
  const list = candidates();
  const total = list.reduce((s, i) => s + wheelWeight(i), 0);
  let r = rng() * total;
  for (const i of list) { r -= wheelWeight(i); if (r < 0) return i; }
  return list[list.length - 1];
}

const Game = {
  reset(seed) {
    this.rng = mulberry32(seed == null ? (Math.random() * 2147483647) | 0 : seed);
    this.phase = 'ready';      // ready → dead（もう一度は ready に戻して die）
    this.deathIdx = -1;
    this.tPhase = 0;
  },
  // 死ぬ（死に方が決まる）
  die() {
    if (this.phase !== 'ready') return false;
    this.deathIdx = pickDeath(this.rng);
    this.phase = 'dead';
    this.tPhase = 0;
    return true;
  },
  // もう一度（すぐ次の死に方）
  again() {
    this.phase = 'ready';
    return this.die();
  },
  step(dt) { this.tPhase += dt; },
};
