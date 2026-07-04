// MBTI 16 咖啡人格 · 规则引擎
// 将咖啡消费历史映射到 MBTI 4 维度，组合出 16 种咖啡人格
// 纯规则计算，零 LLM 成本，结果可解释

// 创新标签正则：糖浆/色素/粉/酱/蝶豆花/苏打/樱花/紫薯/辣椒/抹茶/奶油/焦糖/海盐/可可/巧克力/草莓
const INNOVATIVE_RE = /糖浆|色素|粉|酱|蝶豆花|苏打|樱花|紫薯|辣椒|抹茶|奶油|焦糖|海盐|可可|巧克力|草莓/;

/**
 * 16 种咖啡人格定义
 * 按 MBTI 四气质分组，每组对应 Stamp 一种 tone
 * desc 为函数，注入上下文 ctx 动态生成毒舌文案
 */
export const MBTI_TYPES = {
  // ---- NT 理性分析家（roast 烘焙橙）----
  INTJ: {
    code: "INTJ", name: "冷萃建筑师", group: "NT", groupLabel: "理性分析家",
    tone: "roast", tagline: "精准·长远·不妥协", drink: "冷萃",
    illustration: "/mbti/intj.png",
    desc: c => `${c.m}杯里${c.morningCount}杯晨间定调，${c.innovativeCount}杯猎奇特调全被你拆穿。你不追品牌只追最优解——咖啡是燃料不是滤镜。`
  },
  INTP: {
    code: "INTP", name: "手冲理论家", group: "NT", groupLabel: "理性分析家",
    tone: "roast", tagline: "钻研·思辨·纸上萃取", drink: "手冲单品",
    illustration: "/mbti/intp.png",
    desc: c => `萃取曲线研究${c.m}次，${c.innovativeCount}杯特调是你在做实验，${c.extremeCount}杯智商核弹被提前预判。理论满分，下单犹豫。`
  },
  ENTJ: {
    code: "ENTJ", name: "浓缩指挥官", group: "NT", groupLabel: "理性分析家",
    tone: "roast", tagline: "高效·强势·双份起步", drink: "双份浓缩",
    illustration: "/mbti/entj.png",
    desc: c => `${c.morningCount}次晨间双份起步，${c.topBrand ? c.topBrand + '你说了算' : '品牌随你调'}。${c.m}杯均价¥${c.avgPrice}，效率优先，花哨退散。`
  },
  ENTP: {
    code: "ENTP", name: "特调配毒师", group: "NT", groupLabel: "理性分析家",
    tone: "roast", tagline: "猎奇·辩论·什么都试", drink: "实验特调",
    illustration: "/mbti/entp.png",
    desc: c => `${c.innovativeCount}杯猎奇里${c.extremeCount}杯智商核弹——你不是被坑，是在收集素材。${c.m}次扫描，每次都在论证这杯凭什么贵。`
  },

  // ---- NF 外交理想家（caramel 焦糖棕）----
  INFJ: {
    code: "INFJ", name: "单品预言家", group: "NF", groupLabel: "外交理想家",
    tone: "caramel", tagline: "原则·洞察·识破营销", drink: "SOE 单品",
    illustration: "/mbti/infj.png",
    desc: c => `${c.m}杯中你识破${c.extremeCount}杯营销话术。${c.topBrand ? c.topBrand + '出现' + Math.round(c.topBrandRatio * c.m) + '次' : '品牌忠诚度高'}，你喝的是原则不是跟风。`
  },
  INFP: {
    code: "INFP", name: "桂花梦想家", group: "NF", groupLabel: "外交理想家",
    tone: "caramel", tagline: "浪漫·理想·为氛围买单", drink: "桂花拿铁",
    illustration: "/mbti/infp.png",
    desc: c => `${c.innovativeCount}杯为氛围买单，${c.morningCount}杯为理想续命。${c.m}次扫描均价¥${c.avgPrice}，你在咖啡里找诗意，账单里找现实。`
  },
  ENFJ: {
    code: "ENFJ", name: "燕麦奶外交官", group: "NF", groupLabel: "外交理想家",
    tone: "caramel", tagline: "社交·引领·请客达人", drink: "燕麦拿铁",
    illustration: "/mbti/enfj.png",
    desc: c => `${c.morningCount}次晨间社交，${c.topBrand ? c.topBrand + '是你的请客默认' : '换着品牌请客'}。${c.m}杯大半是帮朋友点的，你是咖啡桌的主理人。`
  },
  ENFP: {
    code: "ENFP", name: "樱花探险家", group: "NF", groupLabel: "外交理想家",
    tone: "caramel", tagline: "热情·好奇·为颜值下单", drink: "樱花苏打",
    illustration: "/mbti/enfp.png",
    desc: c => `${c.innovativeCount}杯颜值特调，${c.extremeCount}杯核弹级踩雷——但你乐在其中。${c.m}次扫描横跨多品牌，好奇心是你最贵的配料。`
  },

  // ---- SJ 守护传统家（gold 印章金）----
  ISTJ: {
    code: "ISTJ", name: "美式审计员", group: "SJ", groupLabel: "守护传统家",
    tone: "gold", tagline: "严谨·固定·账本式品鉴", drink: "美式",
    illustration: "/mbti/istj.png",
    desc: c => `${c.m}杯，规律度${Math.round(c.jScore * 100)}%。${c.morningCount}次固定晨间，账本式品鉴，均价¥${c.avgPrice}。你喝的不是咖啡，是计划。`
  },
  ISFJ: {
    code: "ISFJ", name: "拿铁守护者", group: "SJ", groupLabel: "守护传统家",
    tone: "gold", tagline: "温暖·忠诚·记得每杯", drink: "鲜奶拿铁",
    illustration: "/mbti/isfj.png",
    desc: c => `${c.topBrand ? c.topBrand + ' ' + Math.round(c.topBrandRatio * c.m) + '次' : '固定品牌'}，${c.morningCount}次晨间温暖。${c.m}杯均价¥${c.avgPrice}，你记得每杯口味，也记得每笔省下的钱。`
  },
  ESTJ: {
    code: "ESTJ", name: "澳白执行官", group: "SJ", groupLabel: "守护传统家",
    tone: "gold", tagline: "高效·标准·不容花哨", drink: "澳白",
    illustration: "/mbti/estj.png",
    desc: c => `${c.morningCount}次晨间高效启动，规律度${Math.round(c.jScore * 100)}%。${c.m}杯均价¥${c.avgPrice}，标准明确，容不得${c.extremeCount}杯花哨核弹。`
  },
  ESFJ: {
    code: "ESFJ", name: "焦糖主人翁", group: "SJ", groupLabel: "守护传统家",
    tone: "gold", tagline: "热情·周到·社交桌主", drink: "焦糖玛奇朵",
    illustration: "/mbti/esfj.png",
    desc: c => `${c.topBrand ? c.topBrand + '是你的社交标配' : '品牌稳定'}，${c.m}杯大半分享出去。${c.morningCount}次晨间聚会，你是朋友圈的咖啡中转站。`
  },

  // ---- SP 探索随性家（warn 琥珀）----
  ISTP: {
    code: "ISTP", name: "冰滴工匠", group: "SP", groupLabel: "探索随性家",
    tone: "warn", tagline: "冷静·手巧·拆解配方", drink: "冰滴",
    illustration: "/mbti/istp.png",
    desc: c => `${c.m}杯配方你拆解过${c.innovativeCount}杯特调。规律度${Math.round(c.jScore * 100)}%，不固定时段不固定品牌，只固定这杯值不值。`
  },
  ISFP: {
    code: "ISFP", name: "抹茶美学师", group: "SP", groupLabel: "探索随性家",
    tone: "warn", tagline: "感性·审美·为色香停留", drink: "抹茶拿铁",
    illustration: "/mbti/isfp.png",
    desc: c => `${c.innovativeCount}杯为色香味停留，${c.extremeCount}杯核弹你照喝不误——颜值即正义。${c.m}次均价¥${c.avgPrice}，你为瞬间买单。`
  },
  ESTP: {
    code: "ESTP", name: "冰美式突击队", group: "SP", groupLabel: "探索随性家",
    tone: "warn", tagline: "行动·即兴·快节奏续命", drink: "冰美式",
    illustration: "/mbti/estp.png",
    desc: c => `${c.morningCount}次晨间快攻，规律度仅${Math.round(c.jScore * 100)}%。${c.m}杯即兴下单，均价¥${c.avgPrice}，快、准、不纠结。`
  },
  ESFP: {
    code: "ESFP", name: "脏脏摩卡派对咖", group: "SP", groupLabel: "探索随性家",
    tone: "warn", tagline: "热闹·甜腻·全场焦点", drink: "脏脏摩卡",
    illustration: "/mbti/esfp.png",
    desc: c => `${c.innovativeCount}杯甜腻特调，${c.extremeCount}杯核弹级快乐。${c.m}次扫描横跨多品牌，你是全场最甜的焦点，账单也最热闹。`
  }
};

/**
 * 从 scans 历史计算 MBTI 咖啡人格
 * @param {Array} scans 扫描记录数组（含 custom_coffee_json / coffee_id / created_at）
 * @param {Array} COFFEES 咖啡库（用于查找非自定义咖啡）
 * @returns {object|null} 人格对象，scans 为空时返回 null
 */
export function computeMbti(scans, COFFEES) {
  // 解析每条扫描记录的咖啡数据 + 消费时段
  const records = scans.map(s => {
    let coffee = null;
    try {
      coffee = s.custom_coffee_json
        ? JSON.parse(s.custom_coffee_json)
        : COFFEES.find(c => c.id === s.coffee_id);
    } catch (_) { /* 忽略解析失败 */ }
    if (!coffee) return null;
    return { coffee, hour: new Date(s.created_at).getHours() };
  }).filter(Boolean);

  const m = records.length;
  if (m === 0) return null;

  // ---- 维度 1 · E/I — 消费时段 ----
  // E = 白天社交时段（6:00-18:00），I = 傍晚/夜间独处时段
  const morningCount = records.filter(r => r.hour >= 6 && r.hour < 18).length;
  const eScore = morningCount / m;
  const ei = {
    key: "ei",
    letter: eScore >= 0.5 ? "E" : "I",
    pct: Math.round(eScore * 100),
    left: "I", leftLabel: "夜饮独处",
    right: "E", rightLabel: "晨间社交"
  };

  // ---- 维度 2 · S/N — 口味传统 vs 创新 ----
  // S = 传统本味，N = 猎奇特调（含智商核弹加权）
  const innovativeCount = records.filter(r =>
    (r.coffee.tags || []).some(t => INNOVATIVE_RE.test(t))
  ).length;
  const extremeCount = records.filter(r => r.coffee.verdictLevel === "EXTREME").length;
  let nScore = (innovativeCount + extremeCount * 0.5) / (m + extremeCount * 0.5);
  nScore = Math.max(0, Math.min(1, nScore));
  const sn = {
    key: "sn",
    letter: nScore >= 0.5 ? "N" : "S",
    pct: Math.round(nScore * 100),
    left: "S", leftLabel: "传统本味",
    right: "N", rightLabel: "猎奇特调"
  };

  // ---- 维度 3 · T/F — 比价 vs 品牌忠诚 ----
  // T = 理性比价（多品牌横跳、均价低），F = 品牌忠诚（高复购）
  const brandCount = {};
  records.forEach(r => {
    if (r.coffee.brand) brandCount[r.coffee.brand] = (brandCount[r.coffee.brand] || 0) + 1;
  });
  const top = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0];
  const topBrandRatio = top ? top[1] / m : 0;
  const totalPrice = records.reduce((s, r) => s + (r.coffee.reportedPrice || 0), 0);
  const avgPrice = m ? Math.round(totalPrice / m) : 0;
  let fScore = topBrandRatio;
  if (avgPrice < 18 && topBrandRatio < 0.5) fScore = Math.max(0, fScore - 0.1);
  const tf = {
    key: "tf",
    letter: fScore >= 0.5 ? "F" : "T",
    pct: Math.round(fScore * 100),
    left: "T", leftLabel: "理性比价",
    right: "F", rightLabel: "品牌忠诚"
  };

  // ---- 维度 4 · J/P — 消费规律性（圆周统计）----
  // J = 规律稳定（时段集中），P = 随性发散（时段分散）
  // 用圆周统计避免 23 点与 0 点被线性方差误判为相距甚远
  const hours = records.map(r => r.hour);
  const C = hours.reduce((s, h) => s + Math.cos(h * 2 * Math.PI / 24), 0) / m;
  const S = hours.reduce((s, h) => s + Math.sin(h * 2 * Math.PI / 24), 0) / m;
  const R = Math.sqrt(C * C + S * S); // 平均合向量长度，0=完全分散，1=高度集中
  const jp = {
    key: "jp",
    letter: R >= 0.5 ? "J" : "P",
    pct: Math.round(R * 100),
    left: "P", leftLabel: "随性发散",
    right: "J", rightLabel: "规律稳定"
  };

  // ---- 组合四字母 ----
  const code = ei.letter + sn.letter + tf.letter + jp.letter;
  const meta = MBTI_TYPES[code];

  // ---- 置信度 ----
  const confidence = m < 3 ? "low" : (m < 8 ? "mid" : "high");

  // ---- 描述文案上下文 ----
  const ctx = {
    n: scans.length, m, morningCount, innovativeCount, extremeCount,
    avgPrice, topBrand: top?.[0], topBrandRatio, jScore: R
  };

  return {
    code,
    name: meta.name,
    group: meta.group,
    groupLabel: meta.groupLabel,
    tone: meta.tone,
    tagline: meta.tagline,
    drink: meta.drink,
    illustration: `/mbti/${code.toLowerCase()}.jpg`,
    desc: meta.desc(ctx),
    confidence,
    dimensions: [ei, sn, tf, jp]
  };
}
