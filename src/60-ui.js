// ===== 操作・ループ・結果 =====
let uiPhase = '', cardShown = false, last = 0, cardTimer = 0;

function bindUI() {
  // 「死ぬ」を押す＝死に方がひとつ決まって、その場面がすぐ流れる
  $('goDie').addEventListener('click', () => {
    Snd.init(); Snd.press();
    if (Game.phase === 'ready' && Game.die()) cinePrepare(Game.deathIdx);
  });
  // 「もう一度」＝すぐ次の死に方（ホームに戻って選び直す手間はなし）
  $('retry').addEventListener('click', () => {
    Snd.init(); Snd.press();
    $('result').classList.remove('show');
    cardShown = false; cardTimer = 0;
    cineReset();
    uiPhase = 'ready';
    if (Game.again()) cinePrepare(Game.deathIdx);
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
  $('dayNo').textContent = '死亡 ' + deathCount() + '回';
  $('dexBtn').textContent = '図鑑 ' + dexGot() + '/' + dexTotal();
}

// 局面が変わった瞬間の処理
function onPhase(p) {
  uiPhase = p;
  const go = $('goDie');
  if (p === 'ready') {
    updateHeader();
    setMsg(HIDDEN_ON ? '空に ふしぎな 光が 見える…' : 'あなたは 今日、何で 死ぬ？');
    go.classList.remove('hide');
  } else if (p === 'dead') {
    go.classList.add('hide');
    setMsg('');
    if (!cineEnter()) fallbackDead();   // 全画面の場面があればそれで。なければ簡易演出
  }
}

// 簡易演出：寝たひと＋死因の一言 → 少しして死因カード（場面が用意されていない死に方のための予備）
function fallbackDead() {
  setMsg('死因：' + DEATHS[Game.deathIdx].name, 'dead');
  Snd.dead();
  cardTimer = CFG.deathCardDelay;
}

function showCard() {
  cardShown = true;
  const D = DEATHS[Game.deathIdx];
  const r = dexRecord(Game.deathIdx);          // 図鑑に記録（初めてなら NEW）
  $('rNew').style.display = r.isNew ? 'block' : 'none';
  const od = $('rOdds');
  od.className = r.isNew ? 'new' : '';
  if (r.isNew) {
    const odds = D.n > 0 ? '年間 ' + oddsText(D) + 'の 死に方' : '日本では 記録のない 死に方';
    od.innerHTML = '<span class="nb">おめでとうございます！</span><br><span class="nb">' + odds + '</span> <span class="nb">' + starsText(D) + '</span>';
  } else {
    od.textContent = starsText(D) + '  ・  この死に方は ' + r.count + '回目';
  }
  const bn = $('rBanner');
  if (r.complete) { bn.textContent = '図鑑コンプリート！'; bn.style.display = 'block'; }
  else if (r.unlocked) { bn.textContent = 'あと 1枚！ 空に 光が…'; bn.style.display = 'block'; }
  else bn.style.display = 'none';
  $('rGame').style.display = (r.complete || r.unlocked) ? 'none' : '';   // カードが長くなるので断り書きは省く（図鑑の下には常にある）
  if (r.complete || r.unlocked) { Snd.grand(); confetti(r.complete ? 170 : 100, true); }
  else if (r.isNew) { Snd.fanfare(); confetti(45, true); }
  $('rCause').textContent = D.name;
  $('rStatN').textContent = D.stat;
  $('rStatNote').textContent = D.note;
  $('rPrev').innerHTML = '<i>防ぐには</i>' + D.prevent;
  $('rDays').innerHTML = '<span class="nb">' + deathCount() + '回目の</span> <span class="nb">死亡</span>';
  $('rBest').textContent = '図鑑 ' + r.got + '/' + r.total;
  $('msg').style.visibility = 'hidden';
  cv.style.filter = '';
  $('result').classList.add('show');
  Snd.card();
  shareBlob = null; makeShareImage(b => { shareBlob = b; });   // 共有用の画像を先に作っておく（タップの直後に共有できるように）
}

function frame(ts) {
  const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
  last = ts;
  Game.step(dt);
  if (Game.phase !== uiPhase) onPhase(Game.phase);
  if (cardTimer > 0) { cardTimer -= dt; if (cardTimer <= 0 && !cardShown) showCard(); }
  cineFrame(dt);
  confettiFrame(dt);
  updateHeader();
  render(dt);
  requestAnimationFrame(frame);
}
