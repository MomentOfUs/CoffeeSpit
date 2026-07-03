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
