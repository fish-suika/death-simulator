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
    src.connect(fl); fl.connect(g); g.connect(o.dest || master);
    src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
  }

  // 映像の間だけ鳴らす音をまとめる出口（飛ばすときに一気に切る）
  let bus = null;
  function cutBus() {
    if (bus && ac) { bus.gain.setTargetAtTime(0, now(), 0.02); }
    bus = null;
  }

  return {
    init,
    // 落雷の映像：風が強まり、遠くで雷鳴、放電の音が高まる。impactT 秒で止まる（直撃の音は impact() を別に鳴らす）
    cineStart(impactT) {
      if (!ac) return;
      cutBus();
      const t = now();
      bus = ac.createGain(); bus.gain.value = 1; bus.connect(master);
      // 風：だんだん強く
      const w = ac.createBufferSource(); w.buffer = noiseBuf; w.loop = true;
      const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.Q.value = 0.8;
      wf.frequency.setValueAtTime(260, t); wf.frequency.linearRampToValueAtTime(820, t + impactT);
      const wg = ac.createGain();
      wg.gain.setValueAtTime(0.02, t); wg.gain.linearRampToValueAtTime(0.2, t + impactT);
      w.connect(wf); wf.connect(wg); wg.connect(bus);
      w.start(t, Math.random()); w.stop(t + impactT + 0.1);
      // 遠雷：だんだん近く大きく
      [[0.9, 0.18], [1.7, 0.26], [2.4, 0.36]].forEach(([at, v]) => {
        if (at < impactT - 0.2) noise(t + at, 1.3, { type: 'lowpass', f: 140, f2: 60, q: 0.7, gain: v, dest: bus });
      });
      // 放電が高まる音（直撃の直前）
      const s0 = Math.max(0, impactT - 0.8);
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t + s0); o.frequency.exponentialRampToValueAtTime(2600, t + impactT);
      og.gain.setValueAtTime(0.0001, t + s0); og.gain.exponentialRampToValueAtTime(0.07, t + impactT - 0.02); og.gain.exponentialRampToValueAtTime(0.0001, t + impactT);
      o.connect(og); og.connect(bus); o.start(t + s0); o.stop(t + impactT + 0.05);
      noise(t + s0, 0.8, { type: 'highpass', f: 5000, q: 0.5, gain: 0.09, dest: bus });
    },
    cineCut() { cutBus(); },
    // 直撃：白い閃光の音。このあとの 0.5 秒は無音にする
    impact() {
      if (!ac) return;
      cutBus();
      const t = now();
      noise(t, 0.35, { type: 'highpass', f: 1800, q: 0.5, gain: 0.7 });
      noise(t, 1.6, { type: 'lowpass', f: 220, f2: 40, q: 0.7, gain: 0.9 });
      tone(70, t, 0.9, { type: 'sine', gain: 0.5, f2: 28 });
    },
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
    // 初めての死に方：ファンファーレ
    fanfare() {
      if (!ac) return;
      const t = now();
      [[523, 0], [659, 0.11], [784, 0.22], [1047, 0.36]].forEach(([f, d]) => tone(f, t + d, 0.28, { type: 'square', gain: 0.1 }));
      [[523, 0.36], [659, 0.36], [784, 0.36]].forEach(([f, d]) => tone(f, t + d, 0.7, { type: 'triangle', gain: 0.12 }));
    },
    // 図鑑コンプリート／隕石が現れる：長いファンファーレ
    grand() {
      if (!ac) return;
      const t = now();
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.13, 0.3, { type: 'square', gain: 0.1 }));
      [523, 659, 784, 1047].forEach(f => tone(f, t + 0.95, 1.1, { type: 'triangle', gain: 0.12 }));
    },
  };
})();
