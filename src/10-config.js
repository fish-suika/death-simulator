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

  // 円盤
  wheel: { cx: 50, cy: 104, R: 35 },
  spinSecs: 2.8,        // 回り始めから止まるまで（4.6秒だと長いと言われた）
  easePow: 3.2,         // 大きいほど最後がじわじわ遅くなる（ドキドキの主な調整）
  turnsMin: 2,          // 最低でも何周するか（2〜3周）
  autoNextSecs: 1.0,    // 無事で止まってから自動で翌日へ進むまで（「あしたへ」を押す手間をなくす）
  edgeMargin: 0.004,    // 止まる位置を境目からこれ(rad)以上離す（境目での判定ぶれを防ぐ）

  // 演出
  nearDeg: 6,           // 死のマスからこの角度以内で止まったら「ニアミス」
  closeDeg: 22,         // この角度以内なら「あぶなかった」
  deathCardDelay: 1.5,  // 死んでから死因カードが出るまで(秒)
  needleKick: 0.55,     // 針が境目で弾かれる大きさ(rad)
};

// 死に方（Phase 1 は仮。数字 n は仮の年間死者数。Phase 2 で実データに入れ替える）
// weight = 1 + log10(n)：死者数の比を対数で縮めて、まれな物も細すぎないようにする
const DEATHS = [
  { id: 'mochi',    name: 'もちを のどに つまらせる', n: 1500, near: 'もちが のどの おくを かすめた' },
  { id: 'riganryu', name: '離岸流に ながされる',       n: 300,  near: 'あしが ふっと うきそうになった' },
  { id: 'hachi',    name: 'ハチに さされる',           n: 20,   near: 'ハチが みみもとを とおりすぎた' },
  { id: 'rakuseki', name: '落石に あたる',             n: 5,    near: 'ちいさな いしが ころがってきた' },
  { id: 'kinoko',   name: '毒キノコを たべる',         n: 4,    near: 'あやしい キノコと めが あった' },
  { id: 'rakurai',  name: '落雷に うたれる',           n: 3,    near: 'とおくで ゴロゴロと なった',
    // 全画面の映像（Phase 2 の試作）。impactT：映像のこの秒で直撃（白く暗転）。feet：ピクトグラムの足もと（世界の座標）。scale：大きさ
    cine: { src: 'media/rakurai.mp4', impactT: 3.3, flash: '#ffffff', feet: [50, 152], scale: 1.3 } },
];
DEATHS.forEach(d => { d.weight = 1 + Math.log10(d.n); });

// 映像の試しプレイ用（rakurai-test.html だけで有効）。落雷だけが死のマスになり、1日目から死にやすい
if (typeof TEST_RAKURAI !== 'undefined' && TEST_RAKURAI) {
  DEATHS.forEach(d => { d.weight = d.id === 'rakurai' ? 10 : 0.0001; });
  CFG.safeStart = 0.6; CFG.safeStep = 0.1;
}

// 無事の日の一言
const SAFE_LINES = ['ふつうの 一日だった', 'なにも 起きなかった', 'ぶじに 夜をむかえた', 'いい 天気だった', 'ごはんが おいしかった'];
const CLOSE_LINES = ['あぶなかった…', 'いま なにか すれちがった', '心臓が ドキッとした'];
