// ===== 調整用の数値（ここだけ触れば遊びが変わる）=====
// 世界の大きさは 幅100 × 高さ177.8（縦9:16）。長さの単位はすべてこの世界の単位
const CFG = {
  worldW: 100,
  worldH: 100 * 16 / 9,
  shareUrl: 'https://fish-suika.github.io/death-simulator/',

  // 「無事」の幅（円盤全体に対する割合）。1日目が一番太く、毎日細くなる。平均 3〜4 日で死ぬ目安
  // （Phase 1 のテストプレイで「死ぬまで何回も回すので飽きる」と言われ、6.9日→3.6日に短くした）
  safeStart: 0.85,
  safeStep: 0.07,
  safeMin: 0.2,
  safeMax: 0.97,

  // 円盤
  wheel: { cx: 50, cy: 104, R: 35 },
  spinSecs: 2.8,        // 回り始めから止まるまで（4.6秒だと長いと言われた）
  easePow: 3.2,         // 大きいほど最後がじわじわ遅くなる（ドキドキの主な調整）
  turnsMin: 2,          // 最低でも何周するか（2〜3周）
  autoNextSecs: 1.0,    // 無事で止まってから自動で翌日へ進むまで（「あしたへ」を押す手間をなくす）
  edgeMargin: 0.004,    // 止まる位置を境目からこれ(rad)以上離す（境目での判定ぶれを防ぐ）
  minWeight: 0.6,       // マスの重みの下限（まれな死に方も細くなりすぎないように）

  // 演出
  nearDeg: 6,           // 死のマスからこの角度以内で止まったら「ニアミス」
  closeDeg: 22,         // この角度以内なら「あぶなかった」
  deathCardDelay: 1.5,  // 死んでから死因カードが出るまで(秒)
  needleKick: 0.55,     // 針が境目で弾かれる大きさ(rad)
};

// 行き先。safeBonus：その日の「無事」の幅に足す（家は安全寄り、山・海は危険寄り）
const DESTS = [
  { id: 'home',     name: '家', safeBonus: 0.05 },
  { id: 'mountain', name: '山', safeBonus: -0.02 },
  { id: 'sea',      name: '海', safeBonus: -0.03 },
];

// 死に方（実データ。出典と計算は docs/データ出典.md）。
// n：年間の死者数（円盤のマス幅の元。weight = 1 + log10(n) で縮める）。stat/note：死因カードに出す数字と出どころ。prevent：防ぐには。
// dest：出る行き先（any は どの行き先でも出る）。cine：全画面の場面（無い物は簡易演出）
const DEATHS = [
  { id: 'mochi', dest: 'home', name: 'もちを のどに つまらせる', n: 330,
    stat: '年間 約330人', note: '65歳以上・2018〜2019年の平均（消費者庁）',
    prevent: 'もちは 小さく切って、よくかんでから 飲みこむ',
    near: 'もちが のどの おくを かすめた' },
  { id: 'yuki', dest: 'home', name: '雪下ろしで 屋根から 落ちる', n: 80,
    stat: '年間 約80人', note: '雪害の死者・2010〜2019年冬の平均。大半が除雪中（消防庁）',
    prevent: '雪下ろしは ひとりでやらず、命綱と ヘルメットを つける',
    near: '屋根の雪が ずるっと 動いた' },
  { id: 'fugu', dest: 'home', name: 'フグの毒に あたる', n: 1.5,
    stat: '10年で 約15人', note: '2003〜2012年（神奈川県衛生研究所の集計）',
    prevent: 'フグは 免許のある店で。釣ったフグを 家でさばかない',
    near: 'フグの 肝が ちらっと 見えた' },
  { id: 'kinoko', dest: 'home', name: '毒キノコを 食べる', n: 0.3,
    stat: '10年で 3人', note: '2012〜2021年（厚生労働省）',
    prevent: '知らない キノコは 食べない・人にも あげない。迷ったら 捨てる',
    near: 'あやしい キノコと めが あった' },
  { id: 'hachi', dest: 'mountain', name: 'ハチに さされる', n: 18,
    stat: '年間 約18人', note: '2021〜2024年の平均（人口動態統計）',
    prevent: '黒い服を 避け、巣を見つけたら そっと はなれる。さされたら すぐ病院へ',
    near: 'ハチが みみもとを とおりすぎた' },
  { id: 'hebi', dest: 'mountain', name: '毒ヘビに かまれる', n: 3.5,
    stat: '年間 約3〜4人', note: '2018〜2019年（人口動態統計）',
    prevent: '草むらに 手や足を つっこまない。かまれたら 動かず 救急車を',
    near: '足もとの 落ち葉が がさっと 動いた' },
  { id: 'nadare', dest: 'mountain', name: '雪崩に のまれる', n: 9,
    stat: '年間 約9人', note: '1991〜2020年の30年で274人（日本雪崩ネットワーク）',
    prevent: '雪崩の危険が高い日は 斜面に入らない。入るなら 装備と講習を',
    near: '山の上で 雪けむりが 上がった' },
  { id: 'umi', dest: 'sea', name: '海で おぼれる', n: 372,
    stat: '年間 約370人', note: '海の死者・行方不明者・2024年（警察庁）',
    prevent: '流されたら 岸と平行に およぐ。ライフジャケットを着て、監視員のいる浜で',
    near: 'あしが ふっと うきそうになった' },
  { id: 'rakurai', dest: 'any', name: '落雷に うたれる', n: 10,
    stat: '年間 10人未満', note: '近年の日本（藤部 2017）',
    prevent: '空が 暗くなったら 建物か 車の中へ。木の下には にげない',
    near: 'とおくで ゴロゴロと なった',
    // 全画面の場面（背景は 45-scenes.js がコードで描く）。impactT：この秒で直撃（白く暗転）。feet：ピクトグラムの足もと（世界の座標）。scale：大きさ
    cine: { scene: 'rakurai', impactT: 3.3, flash: '#ffffff', feet: [50, 152], scale: 1.3 } },
];
DEATHS.forEach(d => { d.weight = Math.max(CFG.minWeight, 1 + Math.log10(d.n)); });

// 映像の試しプレイ用（rakurai-test.html だけで有効）。落雷だけが死のマスになり、1日目から死にやすい
if (typeof TEST_RAKURAI !== 'undefined' && TEST_RAKURAI) {
  DEATHS.forEach(d => { d.weight = d.id === 'rakurai' ? 10 : 0.0001; });
  CFG.safeStart = 0.6; CFG.safeStep = 0.1;
}

// 無事の日の一言
const SAFE_LINES = ['ふつうの 一日だった', 'なにも 起きなかった', 'ぶじに 夜をむかえた', 'いい 天気だった', 'ごはんが おいしかった'];
const CLOSE_LINES = ['あぶなかった…', 'いま なにか すれちがった', '心臓が ドキッとした'];
