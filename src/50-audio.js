// ===== 効果音（WebAudio で合成。音声ファイルなし・BGMなし）=====
const Snd = (() => {
  let ac = null, master = null, noiseBuf = null;

  function init() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (_) { ac = null; return; }
    }
    if (ac.state === 'suspended') ac.resume();
  }
  const now = () => ac.currentTime;

  // f→f2 へ動く1音
  function tone(f, t0, dur, o) {
    if (!ac) return;
    o = o || {};
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    const a = o.attack || 0.004, v = o.gain == null ? 0.3 : o.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, o) {
    if (!ac) return;
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = o.type || 'bandpass';
    fl.frequency.setValueAtTime(o.f, t0); fl.Q.value = o.q || 1;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain == null ? 0.3 : o.gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(master);
    src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
  }

  return {
    init,
    // 針が境目を越えるカチッ。speed が遅いほど重く強く、死のマスに入る音は高い
    tick(intoDeath, slow) {
      if (!ac) return;
      const t = now();
      const f = intoDeath ? 2300 : 1500;
      tone(f, t, 0.05, { type: 'square', gain: slow ? 0.16 : 0.07, f2: f * 0.7 });
      if (slow) noise(t, 0.04, { f: 3000, q: 2, gain: 0.08 });
    },
    start() { if (ac) noise(now(), 0.5, { f: 400, f2: 2200, q: 1.2, gain: 0.12 }); },
    // 無事：明るい2音
    safe() {
      if (!ac) return;
      const t = now();
      tone(784, t, 0.18, { type: 'triangle', gain: 0.22 });
      tone(1175, t + 0.12, 0.3, { type: 'triangle', gain: 0.22 });
    },
    // かすめて無事：ほっとする息
    relief() { if (ac) noise(now(), 0.35, { f: 1200, f2: 500, q: 0.7, gain: 0.1 }); },
    // 死亡：下がる音
    dead() {
      if (!ac) return;
      const t = now();
      tone(520, t, 0.7, { type: 'sawtooth', gain: 0.22, f2: 70 });
      tone(260, t + 0.05, 0.7, { type: 'square', gain: 0.1, f2: 55 });
      noise(t, 0.25, { f: 900, f2: 200, q: 0.8, gain: 0.18 });
    },
    // 死因カードが出る：ブザー
    card() {
      if (!ac) return;
      const t = now();
      tone(190, t, 0.22, { type: 'square', gain: 0.14 });
      tone(190, t + 0.28, 0.22, { type: 'square', gain: 0.14 });
    },
    press() { if (ac) tone(660, now(), 0.06, { type: 'triangle', gain: 0.15 }); },
  };
})();
