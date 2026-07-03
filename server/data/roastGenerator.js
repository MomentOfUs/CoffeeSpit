// ============================================================
// 毒舌锐评生成器 · Roast Generator
// 从有限数据（手动填参数）生成结构化、多维度的专家级锐评
// 六大维度：命名解构 / 配料真相 / 身体代价 / 营销噱头 / 店铺风格 / 专家总评
// ============================================================

// ---- 命名模式识别 ----
const NAME_PATTERNS = [
  { keys: ["海", "洋", "深海", "海湾", "海峡"], theme: "海洋", irony: "一杯蓝色色素兑水，跟海洋的关系大概是——海里也有水。" },
  { keys: ["樱", "花", "玫瑰", "桃", "梅", "菊"], theme: "花卉", irony: "花是盐渍的、色素调的、或者根本不存在的。你喝的是花的概念，不是花本身。" },
  { keys: ["森林", "极光", "北欧", "挪威", "冰川"], theme: "北欧自然", irony: "北欧人均咖啡消费量全球第一，但人家喝的是浅烘手冲，不是色素燕麦奶。" },
  { keys: ["京都", "禅", "抹茶", "和风", "岚山"], theme: "日式禅意", irony: "禅意不值 32 块。真正的京都和尚喝抹茶，不往里面加燕麦奶和糖浆。" },
  { keys: ["巴黎", "午后", "塞纳", "香榭"], theme: "法式浪漫", irony: "巴黎人喝 espresso 站着喝完就走，不会点一杯 32 克糖的焦糖玛奇朵坐一下午。" },
  { keys: ["撒哈拉", "沙漠", "落日", "骆驼"], theme: "异域沙漠", irony: "撒哈拉没有落日摩卡。沙漠里最珍贵的是水，而你花 39 块买了一杯水加糖浆。" },
  { keys: ["辣", "辣椒", "麻辣", "湘"], theme: "地方辛辣", irony: "0.3 克辣椒粉价值 25 块，折合每克 83 元，比松露还贵。" },
  { keys: ["西西里", "柠檬", "黑手党", "狂徒"], theme: "意式硬汉", irony: "西西里的柠檬是树上摘的，你杯子里的柠檬味是糖浆调的。" },
  { keys: ["东京", "雨夜", "涩谷", "新宿"], theme: "都市夜色", irony: "东京雨夜的美式 280 日元，约合 14 元人民币。你的 36 块够东京喝两杯半。" },
  { keys: ["紫", "紫薯", "蝶豆", "星空", "银河"], theme: "梦幻色彩", irony: "颜色越梦幻，色素越多。蝶豆花茶的成本是 0.3 元，紫色是你的 34 元里最贵的部分——讽刺的是它也最便宜。" },
  { keys: ["脏脏", "泥石流", "瀑布"], theme: "视觉冲击", irony: "「脏」是巧克力酱的可接受代名词。你花钱买「脏」，巧克力酱厂商很感动。" },
  { keys: ["桂花", "乌龙", "龙井", "茶"], theme: "茶咖混搭", irony: "茶和咖啡混在一起，就像穿西装配拖鞋——有人觉得是混搭，有人觉得是糊涂。" },
];

// ---- 城市消费水平 ----
const CITY_TIERS = {
  "上海": "上海", "北京": "北京", "广州": "广州", "深圳": "深圳",
  "杭州": "杭州", "成都": "成都", "南京": "南京", "武汉": "武汉",
  "西安": "西安", "长沙": "长沙", "重庆": "重庆", "苏州": "苏州",
  "哈尔滨": "哈尔滨", "青岛": "青岛", "沈阳": "沈阳", "昆明": "昆明",
};

// ---- 健康分析 ----
function analyzeHealth(caffeineMg, sugarG, kcal) {
  const issues = [];
  // 咖啡因
  if (caffeineMg >= 200) issues.push({ level: "高", text: `咖啡因 ${caffeineMg}mg 已超单次建议上限（200mg），敏感人群可能出现心悸、手抖、焦虑。这杯喝完，下午三点前别再碰任何含咖啡因的东西。` });
  else if (caffeineMg >= 100) issues.push({ level: "中", text: `咖啡因 ${caffeineMg}mg 处于中等偏高水平，相当于 1-2 杯速溶咖啡的量。下午三点后饮用可能影响入睡。` });
  else if (caffeineMg > 0) issues.push({ level: "低", text: `咖啡因仅 ${caffeineMg}mg，几乎可以忽略。讽刺的是，你买的是「咖啡」，咖啡因含量却像在喝奶茶。` });
  else issues.push({ level: "无", text: `咖啡因为 0——恭喜，这杯「咖啡」里可能根本没有咖啡。` });
  // 糖
  if (sugarG >= 30) issues.push({ level: "爆表", text: `含糖 ${sugarG}g，约等于 ${Math.round(sugarG / 5)} 块方糖直接倒进嘴里。WHO 建议每日添加糖不超过 25g——这一杯就超标了。胰岛素正在写辞职信。` });
  else if (sugarG >= 20) issues.push({ level: "高", text: `含糖 ${sugarG}g，约占每日建议摄入量的 ${Math.round(sugarG / 25 * 100)}%。喝完这杯，今天的奶茶甜品就别想了。` });
  else if (sugarG >= 10) issues.push({ level: "中", text: `含糖 ${sugarG}g，不算夸张但也不少。相当于往咖啡里加了 2-3 勺糖，如果你自己在家加这么多，可能会被妈嫌弃。` });
  else if (sugarG > 0 && sugarG < 5) issues.push({ level: "低", text: `含糖仅 ${sugarG}g，值得肯定。但请注意——这可能是「低糖」而非「无糖」，糖浆的影子还在配方里。` });
  else issues.push({ level: "无", text: `无糖记录。如果属实，这杯在健康维度上是全场最佳——但请不要因此就觉得它值这个价。` });
  // 热量
  if (kcal >= 300) issues.push({ level: "高", text: `${kcal} kcal 相当于一碗半米饭。你以为是喝咖啡，其实在吃主食。` });
  else if (kcal >= 200) issues.push({ level: "中", text: `${kcal} kcal 相当于一个馒头的热量。不算多，但也不少——毕竟你只是「喝」了一杯。` });
  else if (kcal > 0) issues.push({ level: "低", text: `${kcal} kcal 热量较低，但这往往意味着它更可能是一杯「水 + 糖浆 + 色素」的组合，营养密度极低。` });
  return issues;
}

// ---- 溢价率评价 ----
function premiumCommentary(rate, price, cost) {
  const overpay = (price - cost).toFixed(1);
  if (rate >= 500) return `溢价 ${rate}%，你每花 1 元买咖啡本身，就有 ${Math.round(rate / (rate + 100) * 100)} 毛分给了房租、包装和「品牌故事」。多付的 ${overpay} 元，够在便利店买 ${Math.floor(overpay / 3)} 瓶矿泉水——至少水不会骗你。`;
  if (rate >= 300) return `溢价 ${rate}%，实付 ${cost} 元的东西卖你 ${price} 元。多付的 ${overpay} 元，相当于你在为一杯咖啡支付了另一杯半的价格——作为「品牌体验费」。`;
  if (rate >= 150) return `溢价 ${rate}%，不算最离谱，但 ${overpay} 元的差价仍然意味着你为「氛围」付了不少学费。`;
  return `溢价 ${rate}%，在网红咖啡界算良心了。但请注意——「没那么贵」不等于「值得」。`;
}

// ---- 品牌名分析 ----
function brandAnalysis(brand) {
  if (!brand || brand === "手动录入") return { text: "品牌信息缺失，但缺信息不代表缺溢价——没有名字的咖啡反而最值得警惕。" };
  const isEnglish = /[A-Z]{3,}/.test(brand);
  const isMixed = /[\u4e00-\u9fa5].*[A-Z]|[A-Z].*[\u4e00-\u9fa5]/.test(brand);
  if (isEnglish) return { text: `「${brand}」——全英文命名，走的是「假装进口」路线。在国内咖啡圈，名字越洋气，越说明它在试图用文字弥补味道的不足。` };
  if (isMixed) return { text: `「${brand}」中英混搭，是当下网红店的标配命名法。一半接地气一半装高级，精准命中「想尝鲜又怕太装」的消费心理。` };
  return { text: `「${brand}」用纯中文命名，走的是本土情怀路线。在咖啡这件事上，情怀和品质之间没有必然联系——但情怀确实能卖得更贵。` };
}

// ---- 城市分析 ----
function cityAnalysis(city) {
  if (!city || city === "未知城市") return "坐标未知，但无论你在哪，被收智商税的概率是差不多的。";
  const base = city.split("·")[0].trim() || city;
  if (["上海", "北京"].includes(base)) return `坐标${base}，一线城市的咖啡消费已卷到极致。在这里，38 元一杯不算贵——但「不算贵」本身就是问题，因为你已经被市场教育得认为这是正常价格了。`;
  if (["杭州", "成都", "南京", "武汉", "长沙", "西安", "重庆"].includes(base)) return `坐标${base}，新一线城市的网红咖啡正在复制北上广的定价策略。问题是，这里的平均收入还没追上一线，但咖啡价格已经先到了。`;
  return `坐标${base}，这座城市的咖啡市场还在成长期。在这里花 30+ 元买一杯色素燕麦奶，与其说是消费升级，不如说是被小红书种草后的冲动。`;
}

// ---- 标签分析 ----
function tagsAnalysis(tags) {
  if (!tags || !tags.length) return "无标签信息。没有标签的咖啡像没有简历的求职者——你不知道它到底会什么，但它要价不低。";
  const real = tags.filter(t => !["糖浆", "色素", "糖"].includes(t));
  const fake = tags.filter(t => ["糖浆", "色素", "糖", "草莓糖浆", "樱花粉", "蓝色素"].includes(t));
  if (fake.length >= 2) return `标签里${fake.join("、")}赫然在列。当一杯咖啡的配料表前三名都是糖浆和色素时，它更接近一杯「咖啡味的糖水」而非「加了糖的咖啡」。`;
  if (real.length >= 3) return `标签涵盖${tags.join("、")}，配料看起来还算丰富。但请注意，配料种类多不等于品质高——速溶粉、罐装奶、食用色素组合在一起，种类确实多，品质确实低。`;
  return `标签：${tags.join("、")}。这些信息能帮你判断这杯咖啡到底「值不值」，但答案大概率是——不值。`;
}

// ============================================================
// 主生成函数
// ============================================================
export function generateRoast(input) {
  const {
    originalName = "未知咖啡",
    brand = "手动录入",
    city = "未知城市",
    reportedPrice = 0,
    realCost = 0,
    premiumRate = 0,
    caffeineMg = 0,
    sugarG = 0,
    kcal = 0,
    tags = [],
  } = input;

  const cleanName = originalName.replace(/「|」/g, "");
  const overpay = (reportedPrice - realCost).toFixed(1);

  // ---- 1. 命名解构 ----
  let namePattern = NAME_PATTERNS.find(p => p.keys.some(k => originalName.includes(k)));
  const nameText = namePattern
    ? `「${cleanName}」这个名字选得很讲究——用「${namePattern.theme}」意象来包装一杯成本 ${realCost} 元的饮品，是网红咖啡的经典操作。${namePattern.irony} 名字越有画面感，你越容易忽略杯子里实际装了什么。本质上，你为这个意象支付了至少 ${overpay} 元的「想象力授权费」。`
    : `「${cleanName}」——这个名字本身就是一个营销设计。在网红咖啡的世界里，名字不是用来描述味道的，而是用来制造画面感的。当你被名字吸引并点单的那一刻，溢价的陷阱就已经合上了。你多付的 ${overpay} 元，有一部分就是为这个名字买单。`;

  // ---- 2. 配料真相 ----
  const tagsText = tagsAnalysis(tags);
  const ingredientText = `${tagsText} 从你提供的数据看，这杯的实付成本约 ${realCost} 元，而标价 ${reportedPrice} 元。成本和售价之间的 ${overpay} 元差距，主要流向了三个地方：门店房租（约占 30-40%）、包装和品牌营销（约占 20-30%）、以及利润（约占 20-30%）。真正花在咖啡豆和奶制品上的钱，可能不到你支付金额的五分之一。`;

  // ---- 3. 身体代价 ----
  const health = analyzeHealth(caffeineMg, sugarG, kcal);
  const healthText = health.map(h => h.text).join(" ");

  // ---- 4. 营销噱头 ----
  const premText = premiumCommentary(premiumRate, reportedPrice, realCost);
  const gimmickText = `${premText} 在当下的咖啡市场，商家擅长用三种话术让你觉得「值」：一是「限定款」制造稀缺感，二是「进口原料」暗示高品质，三是「特调工艺」增加神秘感。但拆开来看，所谓的限定可能只是换了个颜色的糖浆，进口原料可能只是 OATLY 燕麦奶（超市 38 元一升），特调工艺可能就是「浓缩 + 糖浆 + 冰块」的标准流程。你买的不是咖啡，是一个被精心包装的消费场景。`;

  // ---- 5. 店铺风格 ----
  const brandInfo = brandAnalysis(brand);
  const cityInfo = cityAnalysis(city);
  const shopText = `${brandInfo.text} ${cityInfo} 这类店铺通常选址在商圈核心位置或网红打卡街区，装修走极简或工业风，灯光偏暗适合拍照，背景音乐是低保真爵士。所有这些设计元素都在暗示「你来对了地方」——但请注意，装修预算最终会分摊到每一杯咖啡的价格里。你喝的不只是咖啡，还有那面网红墙的折旧费。`;

  // ---- 6. 专家总评 ----
  let verdictText;
  if (premiumRate >= 500) {
    verdictText = `综合判定：智商核弹级。这杯 ${cleanName} 的溢价率高达 ${premiumRate}%，在所有维度上都属于「严重过度定价」。作为专业人士，我的建议是：拍完照发完朋友圈，下次别再点了。同样的钱，足够在良心店喝 ${Math.floor(reportedPrice / 12)} 杯真正的手冲咖啡——那才是咖啡该有的样子。记住：一杯好咖啡不需要 6 个字的名字来证明自己。`;
  } else if (premiumRate >= 300) {
    verdictText = `综合判定：溢价严重。${cleanName} 的溢价率 ${premiumRate}% 属于「高但不至于离谱」的区间——在网红咖啡界甚至算「中等生」。但「比烂」不是消费的理由。${overpay} 元的差价，如果省下来，一周能多喝 ${Math.floor(overpay / 12)} 杯良心美式。作为专业建议：偶尔尝鲜无妨，但请把它当成「体验消费」而非「日常饮品」——就像偶尔看一场烂片，不代表你要办年卡。`;
  } else if (premiumRate >= 150) {
    verdictText = `综合判定：溢价警告。${premiumRate}% 的溢价率在网红咖啡中已属克制，值得给予有限的肯定。但「没那么贵」不等于「值得买」——${overpay} 元的差价仍然意味着你在为氛围和包装付费。如果你追求的是咖啡本身的味道而非打卡体验，同价位有更好的选择。`;
  } else {
    verdictText = `综合判定：相对平价。${premiumRate}% 的溢价率在当下市场环境中已算良心，说明商家在定价上有一定克制。但请注意，平价不等于优质——便宜可能只是因为用了更便宜的原料。建议关注配料表而非价格标签。`;
  }

  return [
    { title: "命名解构", icon: "tag", text: nameText },
    { title: "配料真相", icon: "droplet", text: ingredientText },
    { title: "身体代价", icon: "alert", text: healthText },
    { title: "营销噱头", icon: "flame", text: gimmickText },
    { title: "店铺风格", icon: "pin", text: shopText },
    { title: "专家总评", icon: "stamp", text: verdictText },
  ];
}
