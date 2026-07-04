// 大模型 LLM 客户端（OpenAI 兼容协议，支持通义千问/豆包/DeepSeek 三家切换）
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

const PROVIDER = process.env.LLM_PROVIDER || 'qwen';

const CONFIGS = {
  qwen: {
    apiKey: process.env.QWEN_API_KEY,
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.QWEN_MODEL || 'qwen-plus',
  },
  doubao: {
    apiKey: process.env.DOUBAO_API_KEY,
    baseURL: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.DOUBAO_MODEL || 'doubao-seed-1-6-flash-250615',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  },
};

export function hasLLM() {
  return !!CONFIGS[PROVIDER]?.apiKey;
}

export function getProvider() {
  return PROVIDER;
}

/**
 * 从自然语言描述中提取咖啡结构化数据
 * @param {string} text 用户自然语言描述
 * @returns {Promise<object|null>} 解析后的咖啡数据对象
 */
export async function parseCoffeeFromText(text) {
  if (!hasLLM()) return null;
  const { apiKey, baseURL, model } = CONFIGS[PROVIDER];
  const client = new OpenAI({ apiKey, baseURL });

  const systemPrompt = `你是咖啡数据提取助手。用户会用自然语言描述一杯咖啡，请提取结构化数据，返回 JSON（不要 markdown 代码块）。
字段说明：
- originalName: 咖啡名（字符串）
- brand: 品牌（字符串，如星巴克/瑞幸/Manner）
- city: 城市（字符串）
- reportedPrice: 标价（数字，元）
- realCost: 实付成本（数字，元，用户未提及则根据常见咖啡成本估算，如意式浓缩约3-5元，拿铁约5-8元）
- caffeineMg: 咖啡因毫克（数字，用户未提及则按咖啡类型估算）
- sugarG: 糖克数（数字，用户未提及则按类型估算）
- kcal: 热量千卡（数字，用户未提及则按类型估算）
- tags: 标签数组（如["糖浆","燕麦奶","含糖高"]）
- recipe: 配方数组（如["浓缩咖啡30ml","燕麦奶200ml","焦糖糖浆15ml"]）
- costBreakdown: 成本拆解数组，每项为[名称, 价格]，如[["咖啡豆",3.5],["燕麦奶",2.0],["糖浆",0.5],["杯材",0.5]]
- alias: 别名（字符串，可选）

无法提取的字段：reportedPrice/realCost 填 null，其他填默认值（0/空数组/空字符串）。
realCost 未知时根据咖啡类型合理估算。costBreakdown 未知时根据 realCost 合理拆分。`;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(resp.choices[0].message.content);
}

/**
 * 从图片中识别咖啡菜单信息（视觉理解）
 * @param {string} base64DataUrl 图片的 base64 Data URL
 * @returns {Promise<object|null>} 解析后的咖啡数据对象
 */
export async function parseCoffeeFromImage(base64DataUrl) {
  if (!hasLLM()) return null;
  const visionModel = process.env.VISION_MODEL || CONFIGS[PROVIDER]?.visionModel || CONFIGS[PROVIDER]?.model;
  const { apiKey, baseURL } = CONFIGS[PROVIDER];
  const client = new OpenAI({ apiKey, baseURL });

  const prompt = `你是一位咖啡菜单识别专家。请从图片中提取以下信息，并以纯 JSON 返回（不要 markdown 代码块）：
{
  "detected": true/false,
  "reason": "若未识别到菜单/杯身文字，说明原因",
  "originalName": "咖啡商品全称",
  "brand": "品牌名",
  "city": "城市（若有）",
  "reportedPrice": 标价数字（元）,
  "realCost": 若图片有成本信息则填，否则根据咖啡类型合理估算（如意式浓缩3-5元，拿铁5-8元）,
  "caffeineMg": 咖啡因毫克数（根据咖啡类型估算）,
  "sugarG": 糖克数（根据咖啡类型估算）,
  "kcal": 热量千卡（根据咖啡类型估算）,
  "tags": ["配料标签1", "配料标签2"],
  "recipe": ["配料描述1", "配料描述2"],
  "costBreakdown": [["名称", 价格], ...],
  "shopName": "店铺名（若有）",
  "shopAddress": "店铺地址（若有）"
}
注意：
- 只返回 JSON，不要任何解释文字
- 若图片中没有价签或菜单，detected 设为 false
- 价格只返回数字，不要带 ¥ 符号
- 无法提取的字段填 null 或空数组`;

  const resp = await client.chat.completions.create({
    model: visionModel,
    messages: [
      { role: 'system', content: '你是一个精准的咖啡菜单 OCR 与信息提取助手。' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64DataUrl } }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1024
  });

  const text = resp.choices[0].message.content.trim();
  const clean = text.replace(/```json\s*|\s*```/g, '').trim();
  return JSON.parse(clean);
}

/**
 * 根据用户状态描述 + 菜单数据，AI 推荐咖啡
 * @param {string} userDesc 用户的状态/喜好描述
 * @param {Array} menuContext 扁平化的菜单数据 [{shop, item, price, shopTags, signature, desc}]
 * @returns {Promise<object>} { recommendations: [{shop, item, price, reason, matchScore}], summary }
 */
export async function recommendCoffeeByText(userDesc, menuContext) {
  if (!hasLLM()) return null;
  const { apiKey, baseURL, model } = CONFIGS[PROVIDER];
  const client = new OpenAI({ apiKey, baseURL });

  // 将菜单数据格式化为 LLM 易读的文本
  const menuText = menuContext.map((m, i) =>
    `${i + 1}. ${m.shop} - ${m.item} (${m.price}) [${m.shopTags.join('/')}]`
  ).join('\n');

  const systemPrompt = `你是咖啡推荐助手。用户会描述自己当前的状态和喜好，你需要从以下良心店菜单中推荐 1-3 杯最合适的咖啡。

可用菜单：
${menuText}

请返回 JSON（不要 markdown 代码块）：
{
  "recommendations": [
    {
      "shop": "店铺名",
      "item": "咖啡名",
      "price": "价格（含¥）",
      "reason": "推荐理由（结合用户描述，15-40字）",
      "matchScore": 1-100 的匹配度
    }
  ],
  "summary": "一句话总结（10-25字，如'为你推荐3杯清爽低糖的选择'）"
}

要求：
- 最多推荐 3 杯，按匹配度从高到低排列
- 推荐理由必须紧扣用户描述的关键词（如"运动后""清爽""低糖""预算"）
- 若用户提及预算，只推荐预算内的选项
- 若用户提及健康偏好（低因/无糖/燕麦奶），优先匹配对应标签的店
- 若无合适选项，recommendations 返回空数组，summary 说明原因`;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userDesc }
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(resp.choices[0].message.content);
}

/**
 * AI 喜好印象：读取用户全部品鉴笔记 + 规则画像，生成一段印象文字 + 关键词标签
 * @param {Array} notes 品鉴笔记列表 [{coffee, rating, flavorTags, body, notes, wouldReorder}]
 * @param {object} tasteProfile 规则画像 {personality:{tag,desc}, avgPrice, topTags}
 * @returns {Promise<{impression:string, keywords:string[]}>}
 */
export async function generateImpression(notes, tasteProfile) {
  if (!hasLLM()) return null;
  const { apiKey, baseURL, model } = CONFIGS[PROVIDER];
  const client = new OpenAI({ apiKey, baseURL });

  const notesText = notes.map((n, i) => {
    const name = n.coffee?.name || '未知咖啡';
    return `${i + 1}. ${name}｜评分${n.rating || 0}｜风味[${(n.flavor_tags || []).join('/')}]｜醇度${n.body || 3}｜${n.would_reorder ? '会回购' : '不回购'}｜笔记:${n.notes || '无'}`;
  }).join('\n');

  const profileText = tasteProfile?.personality
    ? `规则画像：人格「${tasteProfile.personality.tag}」(${tasteProfile.personality.desc})；均价¥${tasteProfile.avgPrice}；高频标签[${(tasteProfile.topTags || []).join('/')}]`
    : '暂无规则画像';

  const systemPrompt = `你是咖啡口味分析师。基于用户的全部品鉴笔记和规则画像，用第二人称写一段 80-150 字的「咖啡喜好印象」，总结这个人的口味偏好与消费习惯（如"你偏爱……你正在识破……你对……情有独钟"），语气亲切有洞察力。再提炼 3-6 个中文关键词标签（如"果酸控""平价党""夜班续命""燕麦奶爱好者"）。
禁止任何英文术语。返回 JSON（不要 markdown 代码块）：
{"impression":"第二人称印象文字","keywords":["关键词1","关键词2"]}`;

  const userContent = `${profileText}\n\n品鉴笔记：\n${notesText}`;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(resp.choices[0].message.content);
}

/**
 * 咖啡周报：总结一周口味轨迹
 * @param {Array} notes 本周品鉴笔记
 * @param {Array} scans 本周扫描记录 [{coffee, price, caffeineMg, sugarG, created_at}]
 * @param {object} weekRange {start, end}
 * @returns {Promise<{summary:string, highlights:string[], tags:string[], suggestion:string}>}
 */
export async function generateWeeklyReport(notes, scans, weekRange) {
  if (!hasLLM()) return null;
  const { apiKey, baseURL, model } = CONFIGS[PROVIDER];
  const client = new OpenAI({ apiKey, baseURL });

  const scansText = scans.map((s, i) => {
    const c = s.coffee || {};
    return `${i + 1}. ${c.originalName || '未知'}｜¥${c.reportedPrice || s.price || 0}｜咖啡因${c.caffeineMg || 0}mg｜糖${c.sugarG || 0}g`;
  }).join('\n');

  const notesText = notes.map((n, i) => {
    const name = n.coffee?.name || '未知咖啡';
    return `${i + 1}. ${name}｜评分${n.rating || 0}｜[${(n.flavor_tags || []).join('/')}]｜${n.notes || ''}`;
  }).join('\n');

  const systemPrompt = `你是咖啡周报撰写员。基于用户本周的咖啡扫描与品鉴笔记，写一份简短周报。
返回 JSON（不要 markdown 代码块）：
{
  "summary": "一句话本周总评（15-30字，如'本周喝了5杯，偏爱国产平价连锁'）",
  "highlights": ["2-4条亮点，如'本周最贵一杯¥48''3次选了低因''连续3天喝燕麦拿铁'"],
  "tags": ["本周口味关键词2-4个"],
  "suggestion": "下周建议（15-30字，如'可尝试深烘手冲，平衡当前偏浅酸口味'）"
}
禁止任何英文术语。若无数据则 summary 写"本周暂无记录"。`;

  const userContent = `周期：${weekRange.start} 至 ${weekRange.end}\n\n本周扫描：\n${scansText || '无'}\n\n本周笔记：\n${notesText || '无'}`;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(resp.choices[0].message.content);
}
