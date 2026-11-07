// ===== 操作・ループ・結果 =====
const BEST_KEY = 'death-simulator-best';
function loadBest() { try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (_) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (_) {} }

let uiPhase = '', cardShown = false, last = 0;
const pick = a => a[Math.floor(Math.random() * a.length)];

function bindUI() {
  $('go').addEventListener('click', () => {
    Snd.init();
    if (Game.phase === 'ready') Game.spin();
  });
  $('retry').addEventListener('click', () => {
    Snd.init(); Snd.press();
    Game.reset();
    cardShown = false;
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
  const b = loadBest();
  $('best').textContent = b > 0 ? 'ベスト ' + b + '日目' : '';
}

// 局面が変わった瞬間の処理
function onPhase(p) {
  uiPhase = p;
  const go = $('go');
  if (p === 'ready') {
    updateHeader();
    if (Game.day === 1) setMsg('さあ、今日の 運だめし');   // 2日目以降は前の日の一言を残す
    go.textContent = 'まわす'; go.classList.remove('hide');
  } else if (p === 'spin') {
    setMsg('');
    go.classList.add('hide');
    Snd.start();
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
    setMsg('死因：' + DEATHS[Game.deathIdx].name, 'dead');
    go.classList.add('hide');
    Snd.dead();
  }
}

function showCard() {
  cardShown = true;
  const best = loadBest();
  const isBest = Game.day > best;
  if (isBest) saveBest(Game.day);
  $('rCause').textContent = DEATHS[Game.deathIdx].name;
  $('rDays').innerHTML = '<span class="nb">' + Game.day + '日目に</span> <span class="nb">死亡</span>';
  $('rBest').textContent = isBest && best > 0 ? 'きろく こうしん！' : (best > 0 ? 'ベスト ' + Math.max(best, Game.day) + '日目' : '');
  $('msg').style.visibility = 'hidden';
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
  if (Game.phase === 'dead' && !cardShown && Game.tPhase > CFG.deathCardDelay) showCard();
  updateHeader();
  render(dt);
  requestAnimationFrame(frame);
}
