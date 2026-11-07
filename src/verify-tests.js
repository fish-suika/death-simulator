// ===== 自動テスト =====
(function () {
  const out = document.getElementById('out');
  let fail = 0;
  function check(name, cond, note) {
    if (!cond) fail++;
    const p = document.createElement('div');
    p.className = cond ? 'ok' : 'ng';
    p.textContent = (cond ? 'OK  ' : 'NG  ') + name + (note ? '  [' + note + ']' : '');
    out.appendChild(p);
  }
  const reg = DEATHS.map((d, i) => i).filter(i => !DEATHS[i].hidden);

  // --- データ ---
  {
    const miss = DEATHS.filter(d => !((d.n > 0 || d.hidden) && d.stat && d.note && d.prevent && d.name && d.cine && d.cine.scene && d.cine.impactT > 0)).map(d => d.id);
    check('死に方 13 種（隠し枠をふくむ）に、数字・出どころ・防ぐには・名前・場面の設定がそろっている', DEATHS.length === 13 && dexRegular() === 12 && miss.length === 0, miss.join(','));
    check('重みは下限以上で、数字が大きい死に方ほど重い', DEATHS.every(d => d.weight >= CFG.minWeight - 1e-9) && DEATHS.find(d => d.id === 'furo').weight > DEATHS.find(d => d.id === 'mochi').weight && DEATHS.find(d => d.id === 'mochi').weight > DEATHS.find(d => d.id === 'kinoko').weight);
  }

  // --- 死に方の決まり方 ---
  {
    // 図鑑が空のとき、出る割合は重みの比どおり
    DEX_HAS = () => false; HIDDEN_ON = false;
    const rng = mulberry32(12345), N = 120000, cnt = DEATHS.map(() => 0);
    for (let i = 0; i < N; i++) cnt[pickDeath(rng)]++;
    const total = reg.reduce((s, i) => s + wheelWeight(i), 0);
    const worst = Math.max(...reg.map(i => Math.abs(cnt[i] / N - wheelWeight(i) / total)));
    check('死に方の出る割合が、重みの比どおり（12 万回）', worst < 0.006, '最大のずれ ' + (worst * 100).toFixed(2) + ' ポイント');
    check('隠し枠（隕石）は、図鑑がそろうまで一度も出ない', cnt[DEATHS.findIndex(d => d.hidden)] === 0);
    check('12 種ぜんぶが出る', reg.every(i => cnt[i] > 0));
  }
  {
    // 隕石：12 種そろったら出る。重みの比どおり
    DEX_HAS = () => true; HIDDEN_ON = true;
    const hid = DEATHS.findIndex(d => d.hidden), rng = mulberry32(777), N = 60000; let c = 0;
    for (let i = 0; i < N; i++) if (pickDeath(rng) === hid) c++;
    const total = candidates().reduce((s, i) => s + wheelWeight(i), 0), exp = wheelWeight(hid) / total;
    check('隕石は 12 種そろうと出るようになる（重みの比どおり）', c > 0 && Math.abs(c / N - exp) < 0.006, (c / N * 100).toFixed(2) + '% / 期待 ' + (exp * 100).toFixed(2) + '%');
    DEX_HAS = () => false; HIDDEN_ON = false;
  }
  {
    // 図鑑の空きが少ないと、まだ載っていない死に方が出やすくなる（最大 1+boostMax 倍）。載っている物は変わらない
    const ids = reg.map(i => DEATHS[i].id);
    DEX_HAS = () => false; const none = wheelWeight(reg[0]) === DEATHS[reg[0]].weight;
    DEX_HAS = id => ids.indexOf(id) < CFG.boostFrom; const few = wheelWeight(reg[11]) === DEATHS[reg[11]].weight;     // 数が少ないうちは変わらない
    DEX_HAS = id => ids.indexOf(id) < 11;
    const last = reg[11], max = wheelWeight(last) / DEATHS[last].weight;
    const owned = wheelWeight(reg[0]) === DEATHS[reg[0]].weight;
    DEX_HAS = () => false;
    check('図鑑の空きが少ないと、まだ載っていない死に方が最大 ' + (1 + CFG.boostMax) + ' 倍出やすくなる', none && few && owned && Math.abs(max - (1 + CFG.boostMax)) < 1e-9, '最後の 1 つは ' + max.toFixed(2) + ' 倍');
  }
  {
    // 12 種そろうまでの回数（目安：20〜25 回）
    let sum = 0, mx = 0; const N = 3000;
    for (let k = 0; k < N; k++) {
      const seen = new Set(), rng = mulberry32(k + 1);
      DEX_HAS = id => seen.has(id); HIDDEN_ON = false;
      let n = 0;
      while (n < 3000) { n++; seen.add(DEATHS[pickDeath(rng)].id); if (dexOpen() === 0) break; }
      sum += n; mx = Math.max(mx, n);
    }
    DEX_HAS = () => false;
    const mean = sum / N;
    check('12 種そろうまでの回数が平均 15〜30 回', mean >= 15 && mean <= 30, '平均 ' + mean.toFixed(1) + ' 回 / 最長 ' + mx + ' 回');
  }

  // --- 進み方 ---
  {
    Game.reset(5);
    const a = Game.phase === 'ready' && Game.die() && Game.phase === 'dead' && Game.deathIdx >= 0;
    const b = Game.die() === false;                              // 死んでいる間は、もう一度死ねない
    const c = Game.again() && Game.phase === 'dead';
    Game.reset(9); const x = (Game.die(), Game.deathIdx); Game.reset(9); const y = (Game.die(), Game.deathIdx);
    check('死ぬ → もう一度、の流れが正しい', a && b && c);
    check('同じシードなら同じ死に方になる', x === y);
  }

  const s = document.createElement('h2');
  s.textContent = fail === 0 ? '全部OK' : fail + ' 件NG';
  s.className = fail === 0 ? 'ok' : 'ng';
  out.appendChild(s);
  document.title = fail === 0 ? 'ALL OK' : 'FAIL ' + fail;
})();
