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

  // 1 回まわして結果まで進める
  function spinToEnd(dt) {
    Game.spin();
    let n = 0;
    while (Game.phase === 'spin' && n++ < 100000) Game.step(dt);
  }

  // --- 円盤の作り ---
  for (const day of [1, 5, 12]) {
    const ws = buildWheel(day);
    let ok = Math.abs(ws[0].a0) < 1e-9 && Math.abs(ws[ws.length - 1].a1 - TAU) < 1e-9;
    for (let i = 1; i < ws.length; i++) if (Math.abs(ws[i].a0 - ws[i - 1].a1) > 1e-9) ok = false;
    check(day + '日目：マスが隙間なく円盤を一周する', ok);
    check(day + '日目：無事の幅が safeFrac と一致', Math.abs((ws[0].a1 - ws[0].a0) / TAU - safeFrac(day)) < 1e-9);
  }
  {
    let dec = true, prev = 2;
    for (let d = 1; d <= 40; d++) { const s = safeFrac(d); if (s > prev + 1e-12) dec = false; prev = s; }
    check('「無事」は日がたつほど細くなる（下限あり）', dec && safeFrac(40) >= CFG.safeMin - 1e-12 && safeFrac(1) === CFG.safeStart);
  }
  {
    // 死に方のマス幅は weight の比。まれな物も細すぎない（最小マスが死のマス全体の 5% 以上）
    const ws = buildWheel(1), dws = ws.slice(1);
    const tot = dws.reduce((s, w) => s + (w.a1 - w.a0), 0);
    const mn = Math.min(...dws.map(w => (w.a1 - w.a0) / tot));
    check('一番細い死のマスでも死のマス全体の 5% 以上', mn > 0.05, (mn * 100).toFixed(1) + '%');
  }

  // --- 止まる位置 ---
  {
    let miss = 0, edge = 0, spins = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      Game.reset(seed);
      Game.day = 1 + (seed % 12); Game.wedges = buildWheel(Game.day);
      Game.spin();
      const target = Game.wedges.indexOf(Game.plan.target);
      const deltaOK = Game.plan.delta >= TAU * CFG.turnsMin;
      spinToEnd(1 / 60);
      spins++;
      if (Game.wedgeUnderPointer() !== target || !deltaOK) miss++;
      // 境目から離れているか
      const phi = pointerLocal(Game.rot);
      for (const w of Game.wedges) {
        const d = Math.min(Math.abs(phi - w.a0), Math.abs(phi - w.a1), Math.abs(phi - w.a0 - TAU), Math.abs(phi - w.a1 + TAU));
        if (w.a0 > 0 && d < CFG.edgeMargin * 0.9) edge++;
      }
      if (Math.min(phi, TAU - phi) < CFG.edgeMargin * 0.9) edge++;
    }
    check('決めた結果のマスにちゃんと止まる（3000回）', miss === 0, 'ずれ ' + miss);
    check('境目すれすれには止まらない', edge === 0, edge + ' 件');
  }
  {
    // 刻み幅がちがっても同じ結果
    let diff = 0;
    for (let seed = 1; seed <= 200; seed++) {
      Game.reset(seed); spinToEnd(1 / 30); const a = Game.phase + ':' + Game.deathIdx + ':' + Game.rot.toFixed(6);
      Game.reset(seed); spinToEnd(1 / 144); const b = Game.phase + ':' + Game.deathIdx + ':' + Game.rot.toFixed(6);
      if (a !== b) diff++;
    }
    check('フレームレートがちがっても結果が同じ', diff === 0, 'ちがい ' + diff);
  }

  // --- 確率と平均の生存日数 ---
  {
    let death = 0, N = 30000;
    for (let i = 0; i < N; i++) {
      Game.reset(1000 + i); spinToEnd(0.5);
      if (Game.phase === 'dead') death++;
    }
    const exp = 1 - safeFrac(1), got = death / N;
    check('1日目の死亡率が円盤の幅どおり', Math.abs(got - exp) < 0.006, '期待 ' + (exp * 100).toFixed(1) + '% / 実測 ' + (got * 100).toFixed(1) + '%');
  }
  {
    let sum = 0, N = 6000, longest = 0;
    for (let i = 0; i < N; i++) {
      Game.reset(50000 + i);
      let guard = 0;
      while (guard++ < 200) {
        spinToEnd(0.5);
        if (Game.phase === 'dead') break;
        Game.next();
      }
      sum += Game.day; longest = Math.max(longest, Game.day);
    }
    const mean = sum / N;
    check('平均 3〜4.5 日で死ぬ（飽きないよう短め）', mean >= 3 && mean <= 4.5, '平均 ' + mean.toFixed(2) + ' 日目 / 最長 ' + longest + ' 日目');
  }
  {
    // 深い日なら、どの死に方も出る
    const seen = new Set();
    for (let i = 0; i < 20000; i++) {
      Game.reset(900000 + i); Game.day = 10; Game.wedges = buildWheel(10);
      spinToEnd(0.5);
      if (Game.phase === 'dead') seen.add(Game.deathIdx);
    }
    check('10日目なら全部の死に方が出る', seen.size === DEATHS.length, seen.size + ' / ' + DEATHS.length);
  }

  // --- ニアミス ---
  {
    const ws = buildWheel(1);
    const a = nearestDeath(ws, ws[0].a1 - 0.05);
    const b = nearestDeath(ws, 0.05);
    check('無事の端に止まると近い側の死に方を返す', a.idx === ws[1].idx && b.idx === ws[ws.length - 1].idx && a.deg > 0 && a.deg < 4 && b.deg > 0 && b.deg < 4);
  }
  {
    // 無事で止まるたびに phase=safe、next で翌日の円盤になる
    Game.reset(7);
    let moved = false;
    for (let g = 0; g < 50; g++) {
      spinToEnd(0.5);
      if (Game.phase === 'safe') { const d0 = Game.day; Game.next(); moved = Game.day === d0 + 1 && Game.phase === 'ready'; break; }
      break;
    }
    check('無事のあと next で翌日・ready に戻る（または初回で死亡）', moved || Game.phase === 'dead');
  }

  const s = document.createElement('h2');
  s.textContent = fail === 0 ? '全部OK' : fail + ' 件NG';
  s.className = fail === 0 ? 'ok' : 'ng';
  out.appendChild(s);
  document.title = fail === 0 ? 'ALL OK' : 'FAIL ' + fail;
})();
