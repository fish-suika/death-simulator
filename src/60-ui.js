// ===== 操作・ループ・結果 =====
const BEST_KEY = 'death-simulator-best';
function loadBest() { try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (_) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (_) {} }

let uiPhase = '', cardShown = false, last = 0;
const pick = a => a[Math.floor(Math.random() * a.length)];

function bindUI() {
  document.querySelectorAll('.dest').forEach(b => b.addEventListener('click', () => {
    Snd.init();
    if (Game.phase === 'ready') Game.spin(b.dataset.d);
  }));
  $('retry').addEventListener('click', () => {
    Snd.init(); Snd.press();
    Game.reset();
    cardShown = false; cardTimer = 0;
    cineReset();
    $('result').classList.remove('show');
  });
  window.addEventListener('resize', resize);
}

function setMsg(text, cls) {
  const m = $('msg');
  m.textContent = text;
  m.className = cls || '';
  m.style.visibility = '';
}

function updateHeader() {
  $('dayNo').textContent = Game.day + '日目';
  $('dexBtn').textContent = '図鑑 ' + dexGot() + '/' + dexTotal();
  const b = loadBest();
  $('best').textContent = b > 0 ? 'ベスト ' + b + '日目' : '';
}

// 局面が変わった瞬間の処理
function onPhase(p) {
  uiPhase = p;
  const go = $('dests');
  if (p === 'ready') {
    updateHeader();
    if (Game.day === 1) setMsg(HIDDEN_ON ? '空に ふしぎな 光が 見える… どこへ 行く？' : 'きょうは どこへ 行く？');   // 2日目以降は前の日の一言を残す
    go.classList.remove('hide');
  } else if (p === 'spin') {
    setMsg('');
    go.classList.add('hide');
    Snd.start();
    cinePrepare();   // 死に方が決まっていれば映像を先に読み込む
  } else if (p === 'safe') {
    const n = Game.near;
    let line, close = false;
    if (n && n.deg < CFG.nearDeg) { line = DEATHS[n.idx].near; close = true; }
    else if (n && n.deg < CFG.closeDeg) { line = pick(CLOSE_LINES); close = true; }
    else line = pick(SAFE_LINES);
    setMsg(line);
    Snd.safe(); if (close) Snd.relief();
    go.classList.add('hide');   // 少し見せてから自動で翌日へ（frame で next）
  } else if (p === 'dead') {
    go.classList.add('hide');
    if (!cineEnter()) fallbackDead();   // 全画面の映像があればそれで。なければ（読めなければ）簡易演出
  }
}

// Phase 1 の簡易演出：寝たひと＋死因の一言 → 少しして死因カード
let cardTimer = 0;
function fallbackDead() {
  setMsg('死因：' + DEATHS[Game.deathIdx].name, 'dead');
  Snd.dead();
  cardTimer = CFG.deathCardDelay;
}

function showCard() {
  cardShown = true;
  const best = loadBest();
  const isBest = Game.day > best;
  if (isBest) saveBest(Game.day);
  const D = DEATHS[Game.deathIdx];
  const r = dexRecord(Game.deathIdx);          // 図鑑に記録（初めてなら NEW）
  $('rNew').style.display = r.isNew ? 'block' : 'none';
  const od = $('rOdds');
  od.className = r.isNew ? 'new' : '';
  if (r.isNew) {
    const odds = D.n > 0 ? '年間 ' + oddsText(D) + 'の 死に方' : '日本では 記録のない 死に方';
    od.innerHTML = '<span class="nb">おめでとうございます！</span><br><span class="nb">' + odds + '</span> <span class="nb">' + starsText(D) + '</span>';
  } else {
    od.textContent = starsText(D) + '  ・  ' + r.count + '回目';
  }
  const bn = $('rBanner');
  if (r.complete) { bn.textContent = '図鑑コンプリート！'; bn.style.display = 'block'; }
  else if (r.unlocked) { bn.textContent = '12種 そろった！ 空に 光が…'; bn.style.display = 'block'; }
  else bn.style.display = 'none';
  $('rGame').style.display = (r.complete || r.unlocked) ? 'none' : '';   // カードが長くなるので断り書きは省く（図鑑の下には常にある）
  if (r.complete || r.unlocked) { Snd.grand(); confetti(r.complete ? 170 : 100, true); }
  else if (r.isNew) { Snd.fanfare(); confetti(45, true); }
  $('rCause').textContent = D.name;
  $('rStatN').textContent = D.stat;
  $('rStatNote').textContent = D.note;
  $('rPrev').innerHTML = '<i>防ぐには</i>' + D.prevent;
  $('rDays').innerHTML = '<span class="nb">' + Game.day + '日目に</span> <span class="nb">死亡</span>';
  $('rBest').textContent = (isBest && best > 0 ? 'きろく こうしん！' : (best > 0 ? 'ベスト ' + Math.max(best, Game.day) + '日目' : '')) + (best > 0 ? '  ・  ' : '') + '図鑑 ' + r.got + '/' + r.total;
  $('msg').style.visibility = 'hidden';
  cv.style.filter = '';
  $('result').classList.add('show');
  Snd.card();
}

function frame(ts) {
  const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
  last = ts;
  const prevIdx = Game.wedgeUnderPointer(), prevRot = Game.rot, prevPhase = Game.phase;
  Game.step(dt);
  if (prevPhase === 'spin') {
    const idx = Game.wedgeUnderPointer();
    if (idx !== prevIdx) {
      const slow = Math.abs(Game.rot - prevRot) / dt < 3.2;   // 遅いほど重くはじかれる
      Fx.needle = -CFG.needleKick * (slow ? 1 : 0.5); Fx.needleV = 0;
      Snd.tick(Game.wedges[idx].kind === 'death', slow);
    }
  }
  if (Game.phase === 'safe' && Game.tPhase > CFG.autoNextSecs) Game.next();
  if (Game.phase !== uiPhase) onPhase(Game.phase);
  if (cardTimer > 0) { cardTimer -= dt; if (cardTimer <= 0 && !cardShown) showCard(); }
  cineFrame(dt);
  confettiFrame(dt);
  updateHeader();
  render(dt);
  requestAnimationFrame(frame);
}
