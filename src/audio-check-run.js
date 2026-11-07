// 開発用：各効果音をオフラインで鳴らして、ピーク・実効値(dBFS)を測る。耳で確認できない代わりの目安
// 目安：環境音（場面の間）はピーク −16 dBFS 以下・実効値 −30 dBFS 以下、直撃の音はピーク −9 dBFS 以下、そのほかは −14 dBFS 以下
(async function () {
  const SR = 44100;
  const db = v => v > 1e-6 ? 20 * Math.log10(v) : -120;
  async function measure(label, dur, fn, limits) {
    const off = new OfflineAudioContext(1, Math.round(SR * dur), SR);
    window.AudioContext = function () { return off; };
    Snd.reset(); Snd.init(); fn();
    const buf = await off.startRendering();
    const d = buf.getChannelData(0);
    let peak = 0, sum = 0, bestWin = 0;
    const win = Math.round(SR * 0.5);
    for (let i = 0; i < d.length; i += win) {
      let s = 0, n = 0;
      for (let k = i; k < Math.min(d.length, i + win); k++) { const a = Math.abs(d[k]); if (a > peak) peak = a; s += d[k] * d[k]; n++; }
      bestWin = Math.max(bestWin, Math.sqrt(s / n)); sum += s;
    }
    return { label, peak: db(peak), rms: db(Math.sqrt(sum / d.length)), loud: db(bestWin), limits };
  }
  const amb = { p: -16, r: -30 }, hit = { p: -9, r: 0 }, ui = { p: -14, r: 0 };
  const T = { storm: 3.3, room: 3.2, buzz: 3.2, rumble: 3.2, wind: 3.4, water: 3.2, space: 3.6 };
  const rows = [];
  for (const k of Object.keys(T)) rows.push(await measure('場面の音：' + k, T[k] + 0.2, () => Snd.cineStart(T[k], k), amb));
  rows.push(await measure('直撃（白）', 2.0, () => Snd.impact('#ffffff'), hit));
  rows.push(await measure('直撃（黒）', 1.0, () => Snd.impact('#000000'), hit));
  rows.push(await measure('ファンファーレ', 1.6, () => Snd.fanfare(), ui));
  rows.push(await measure('大ファンファーレ', 2.6, () => Snd.grand(), ui));
  rows.push(await measure('死因カードのブザー', 1.0, () => Snd.card(), ui));
  rows.push(await measure('ボタン', 0.4, () => Snd.press(), ui));
  rows.push(await measure('簡易演出の死亡音', 1.2, () => Snd.dead(), hit));
  let h = '<table><tr><th>音</th><th>ピーク</th><th>実効値(全体)</th><th>いちばん大きい 0.5 秒</th></tr>';
  rows.forEach(r => {
    const bad = r.peak > r.limits.p || r.rms > r.limits.r;
    h += '<tr class="' + (bad ? 'hi' : 'ok') + '"><td>' + r.label + '</td><td>' + r.peak.toFixed(1) + '</td><td>' + r.rms.toFixed(1) + '</td><td>' + r.loud.toFixed(1) + '</td></tr>';
  });
  document.getElementById('out').innerHTML = h + '</table>';
  document.title = rows.some(r => r.peak > r.limits.p || r.rms > r.limits.r) ? 'LOUD' : 'ALL QUIET';
})();
