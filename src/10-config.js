// ===== 調整用の数値（ここだけ触れば遊びが変わる）=====
// 世界の大きさは 幅100 × 高さ177.8（縦9:16）。長さの単位はすべてこの世界の単位
const CFG = {
  worldW: 100,
  worldH: 100 * 16 / 9,
  shareUrl: 'https://fish-suika.github.io/death-simulator/',

  // 図鑑のおまけ：まだ載っていない死に方が出やすくなる（図鑑の最後が埋まらないのを防ぐ。目安：通しで 20〜25 回で 12 種そろう）
  boostFrom: 3,         // 図鑑に載っている数がこれを超えたら太くなり始める
  boostMax: 5,          // 12 種のうち最後の 1 つが載っていないとき、重みが 1+この値 倍
  minWeight: 0.9,       // 重みの下限（まれな死に方も細くなりすぎないように）
};

// 死に方（実データ。出典と計算は docs/データ出典.md）。
// n：年間の死者数（円盤のマス幅の元。weight = 1 + log10(n) で縮める）。stat/note：死因カードに出す数字と出どころ。prevent：防ぐには。
// dest：出る行き先（any は どの行き先でも出る）。cine：全画面の場面（無い物は簡易演出）
const DEATHS = [
  { id: 'mochi', dest: 'home', name: 'もちを のどに つまらせる', n: 330,
    stat: '年間 約330人', note: '65歳以上・2018〜2019年の平均（消費者庁）',
    prevent: 'もちは 小さく切って、よくかんでから 飲みこむ',
    near: 'もちが のどの おくを かすめた',
    cine: { scene: 'mochi', impactT: 3.2, flash: '#000000', feet: [50, 152], scale: 1.25, sound: 'room' } },
  { id: 'yuki', dest: 'home', name: '雪下ろしで 屋根から 落ちる', n: 80,
    stat: '年間 約80人', note: '雪害の死者・2010〜2019年冬の平均。大半が除雪中（消防庁）',
    prevent: '雪下ろしは ひとりでやらず、命綱と ヘルメットを つける',
    near: '屋根の雪が ずるっと 動いた',
    cine: { scene: 'yuki', impactT: 3, flash: '#ffffff', feet: [50, 152], scale: 1.3, sound: 'rumble' } },
  { id: 'fugu', dest: 'home', name: 'フグの毒に あたる', n: 1.5,
    stat: '10年で 約15人', note: '2003〜2012年（神奈川県衛生研究所の集計）',
    prevent: 'フグは 免許のある店で。釣ったフグを 家でさばかない',
    near: 'フグの 肝が ちらっと 見えた',
    cine: { scene: 'fugu', impactT: 3, flash: '#000000', feet: [50, 152], scale: 1.25, sound: 'room' } },
  { id: 'kinoko', dest: 'home', name: '毒キノコを 食べる', n: 0.3,
    stat: '10年で 3人', note: '2012〜2021年（厚生労働省）',
    prevent: '知らない キノコは 食べない・人にも あげない。迷ったら 捨てる',
    near: 'あやしい キノコと めが あった',
    cine: { scene: 'kinoko', impactT: 3.2, flash: '#000000', feet: [50, 152], scale: 1.25, sound: 'room' } },
  { id: 'furo', dest: 'home', name: 'お風呂で おぼれる', n: 5000,
    stat: '年間 約5,000人', note: '家庭の浴槽・2015〜2019年（人口動態統計）。交通事故より多い',
    prevent: 'お湯は 41度以下・10分まで。入る前に 脱衣所と 浴室を あたためる。家族に ひと声かける',
    near: 'お湯が ちょっと 熱かった',
    cine: { scene: 'furo', impactT: 3.2, flash: '#000000', feet: [50, 150], scale: 1.25, sound: 'room' } },
  { id: 'hachi', dest: 'mountain', name: 'ハチに さされる', n: 18,
    stat: '年間 約18人', note: '2021〜2024年の平均（人口動態統計）',
    prevent: '黒い服を 避け、巣を見つけたら そっと はなれる。さされたら すぐ病院へ',
    near: 'ハチが みみもとを とおりすぎた',
    cine: { scene: 'hachi', impactT: 3.2, flash: '#000000', feet: [50, 150], scale: 1.3, sound: 'buzz' } },
  { id: 'hebi', dest: 'mountain', name: '毒ヘビに かまれる', n: 3.5,
    stat: '年間 約3〜4人', note: '2018〜2019年（人口動態統計）',
    prevent: '草むらに 手や足を つっこまない。かまれたら 動かず 救急車を',
    near: '足もとの 落ち葉が がさっと 動いた',
    cine: { scene: 'hebi', impactT: 3, flash: '#000000', feet: [30, 152], scale: 1.3, sound: 'room' } },
  { id: 'nadare', dest: 'mountain', name: '雪崩に のまれる', n: 9,
    stat: '年間 約9人', note: '1991〜2020年の30年で274人（日本雪崩ネットワーク）',
    prevent: '雪崩の危険が高い日は 斜面に入らない。入るなら 装備と講習を',
    near: '山の上で 雪けむりが 上がった',
    cine: { scene: 'nadare', impactT: 3.2, flash: '#ffffff', feet: [50, 150], scale: 1.3, sound: 'rumble' } },
  { id: 'sangaku', dest: 'mountain', name: '山で 遭難する', n: 300,
    stat: '年間 約300人', note: '死者・行方不明者・2024年（警察庁）。原因は道迷い・転倒・滑落など',
    prevent: '登山計画書を出し、ヘッドライトと 防寒着を持つ。道に迷ったら 沢には おりない',
    near: '道が 二つに 分かれていた',
    cine: { scene: 'sangaku', impactT: 3.4, flash: '#000000', feet: [50, 152], scale: 1.3, sound: 'wind' } },
  { id: 'tsuri', dest: 'sea', name: '釣りで 海に 落ちる', n: 90,
    stat: '年間 約90人', note: '釣り中の海中転落・2004〜2013年の平均（海上保安庁）',
    prevent: 'ライフジャケットを着る。ひとりで行かず、荒れた日の 岩場や防波堤には 行かない',
    near: '足もとの 岩が ぬるっと した',
    cine: { scene: 'tsuri', impactT: 3.2, flash: '#000000', feet: [38, 152], scale: 1.3, sound: 'water' } },
  { id: 'umi', dest: 'sea', name: '海で おぼれる', n: 372,
    stat: '年間 約370人', note: '海の死者・行方不明者・2024年（警察庁）',
    prevent: '流されたら 岸と平行に およぐ。ライフジャケットを着て、監視員のいる浜で',
    near: 'あしが ふっと うきそうになった',
    cine: { scene: 'umi', impactT: 3.2, flash: '#000000', feet: [50, 150], scale: 1.3, sound: 'water' } },
  { id: 'rakurai', dest: 'any', name: '落雷に うたれる', n: 10,
    stat: '年間 10人未満', note: '近年の日本（藤部 2017）',
    prevent: '空が 暗くなったら 建物か 車の中へ。木の下には にげない',
    near: 'とおくで ゴロゴロと なった',
    // 全画面の場面（背景は 45-scenes.js がコードで描く）。impactT：この秒で直撃（白く暗転）。feet：ピクトグラムの足もと（世界の座標）。scale：大きさ
    cine: { scene: 'rakurai', impactT: 3.3, flash: '#ffffff', feet: [50, 152], scale: 1.3, sound: 'storm' } },
  // 隠し枠：図鑑が 12 種そろったときだけ円盤に出る。日本での死亡の記録が見つからない（数字は「記録 0 人」）
  { id: 'inseki', dest: 'any', hidden: true, name: '隕石に あたる', n: 0,
    stat: '記録 0人', note: '日本で死亡した記録は 見つからない（調べた範囲）',
    prevent: '心配は いらない。それより お風呂に 気をつけて',
    near: '空に 光る点が ひとつ 見えた',
    cine: { scene: 'inseki', impactT: 3.6, flash: '#ffffff', feet: [50, 152], scale: 1.3, sound: 'space' } },
];
DEATHS.forEach(d => { d.weight = d.hidden ? CFG.minWeight : Math.max(CFG.minWeight, 1 + Math.log10(d.n)); });

// 映像の試しプレイ用（rakurai-test.html だけで有効）。落雷だけが出る
if (typeof TEST_RAKURAI !== 'undefined' && TEST_RAKURAI) {
  DEATHS.forEach(d => { d.weight = d.id === 'rakurai' ? 10 : 0.0001; });

}

// 無事の日の一言
const SAFE_LINES = ['ふつうの 一日だった', 'なにも 起きなかった', 'ぶじに 夜をむかえた', 'いい 天気だった', 'ごはんが おいしかった'];
const CLOSE_LINES = ['あぶなかった…', 'いま なにか すれちがった', '心臓が ドキッとした'];
