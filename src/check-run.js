// 開発用：全場面を、進み 0.15 / 0.55 / 0.97 で並べて確認する（?from=0&to=6 で行を絞る）
(function () {
  const q = new URLSearchParams(location.search), from = +(q.get('from') || 0), to = +(q.get('to') || 99);
  const g = document.getElementById('g'), list = DEATHS.filter(d => d.cine && Scenes[d.cine.scene]).slice(from, to);
  list.forEach(d => {
    [0.15, 0.55, 0.97].forEach(p => {
      const w = document.createElement('div'); w.className = 'c';
      const c = document.createElement('canvas'); c.width = 150; c.height = Math.round(150 * 16 / 9);
      const x = c.getContext('2d'); x.setTransform(1.5, 0, 0, 1.5, 0, 0);
      try { Scenes[d.cine.scene](x, p * d.cine.impactT, p); } catch (e) { x.fillStyle = '#f00'; x.fillRect(0, 0, 100, 178); console.error(d.id, e); }
      x.fillStyle = '#1a1a1a'; x.strokeStyle = '#fff'; x.lineWidth = 0.8;
      x.beginPath(); x.arc(d.cine.feet[0], d.cine.feet[1] - 24 * d.cine.scale, 3, 0, TAU); x.fill(); x.stroke();      // 頭の位置の目印
      x.fillRect(d.cine.feet[0] - 2, d.cine.feet[1] - 20 * d.cine.scale, 4, 20 * d.cine.scale);
      const s = document.createElement('span'); s.textContent = d.id + ' ' + p; w.appendChild(c); w.appendChild(s); g.appendChild(w);
    });
  });
})();
