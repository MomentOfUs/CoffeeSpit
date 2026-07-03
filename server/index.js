// 一杯大实话 · CoffeeSpit 后端服务
// Express + SQLite + Multer 图片上传
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db, COFFEES, SHOPS, ACHIEVEMENTS, HEALTH_OPTS, MOCK_STATES } from "./db.js";
import { mockRecognize, recommendShops } from "./data/mock.js";
import { generateRoast } from "./data/roastGenerator.js";
import { parseCoffeeFromText, hasLLM } from "./llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
const PORT = 5174;

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

// ---- Multer：图片上传 ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `scan_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("仅支持图片文件"));
  }
});

// ============ 工具函数 ============
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function isSameDay(a, b) {
  const da = new Date(a), db2 = new Date(b);
  return da.getFullYear() === db2.getFullYear() && da.getMonth() === db2.getMonth() && da.getDate() === db2.getDate();
}
function getDevice(req) {
  return req.headers["x-device-id"] || req.body.deviceId || "anon";
}
function defaultStats() {
  return { scanCount: 12, savedMoney: 450, blockedSpoons: 38, roastRead: 7, monthSaved: 184, monthScans: 5, streak: 6 };
}

// ============ 路由 ============

// 设备注册
app.post("/api/devices", (req, res) => {
  const id = req.body.deviceId || `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  db.prepare("INSERT OR IGNORE INTO devices (id, nickname, created_at) VALUES (?, ?, ?)").run(id, req.body.nickname || "匿名品鉴官", Date.now());
  const row = db.prepare("SELECT * FROM devices WHERE id = ?").get(id);
  res.json(row);
});

// 咖啡库
app.get("/api/coffees", (req, res) => res.json(COFFEES));
app.get("/api/coffees/:id", (req, res) => {
  const c = COFFEES.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "未找到" });
  res.json(c);
});

// 图片上传
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "未收到图片" });
  res.json({ id: req.file.filename, url: `/uploads/${req.file.filename}`, size: req.file.size });
});

// 扫描识别（mock）+ 写入历史 + 累计今日摄入
app.post("/api/scan/analyze", (req, res) => {
  const deviceId = getDevice(req);
  const { imageUrl, coffeeId } = req.body || {};
  // 若前端指定 coffeeId（手动选品）则用之，否则随机命中
  let coffee = coffeeId ? COFFEES.find(c => c.id === coffeeId) : mockRecognize();
  if (!coffee) coffee = mockRecognize();

  const saved = Math.max(0, coffee.reportedPrice - Math.min(...SHOPS.map(s => s.price)));
  const ts = Date.now();

  // 写入历史
  const info = db.prepare("INSERT INTO scans (device_id, coffee_id, image_url, price, saved, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(deviceId, coffee.id, imageUrl || "", coffee.reportedPrice, saved, ts);
  // 累计今日摄入
  const tStr = todayStr();
  const exist = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  if (exist) {
    db.prepare("UPDATE today_intake SET caffeine = caffeine + ?, sugar = sugar + ?, kcal = kcal + ? WHERE id = ?")
      .run(coffee.caffeineMg, coffee.sugarG, coffee.kcal, exist.id);
  } else {
    db.prepare("INSERT INTO today_intake (device_id, caffeine, sugar, kcal, date) VALUES (?, ?, ?, ?, ?)")
      .run(deviceId, coffee.caffeineMg, coffee.sugarG, coffee.kcal, tStr);
  }

  // 成就判定
  unlockAchievement(deviceId, "first-scan");
  if (coffee.caffeineMg <= 50) unlockAchievement(deviceId, "low-caff");
  if (coffee.sugarG <= 5) unlockAchievement(deviceId, "no-sugar");

  res.json({
    scanId: info.lastInsertRowid,
    coffee,
    saved,
    imageUrl,
    recommendations: recommendShops(coffee),
    ts
  });
});

function unlockAchievement(deviceId, key) {
  db.prepare("INSERT OR IGNORE INTO achievements_unlocked (device_id, achievement_key, unlocked_at) VALUES (?, ?, ?)")
    .run(deviceId, key, Date.now());
}

// 手动填参数扫描（自定义咖啡）
app.post("/api/scan/analyze-custom", (req, res) => {
  const deviceId = getDevice(req);
  const { coffee: input, imageUrl } = req.body || {};
  if (!input || !input.originalName || !input.reportedPrice || !input.realCost) {
    return res.status(400).json({ error: "咖啡名、标价、实付成本为必填" });
  }
  // 补算 premiumRate
  const premiumRate = input.premiumRate ?? Math.round((input.reportedPrice - input.realCost) / input.realCost * 100);
  // verdict 阈值判定
  let verdict = "平价", verdictLevel = "OK";
  if (premiumRate >= 500) { verdict = "智商核弹"; verdictLevel = "EXTREME"; }
  else if (premiumRate >= 300) { verdict = "溢价严重"; verdictLevel = "HIGH"; }
  else if (premiumRate >= 150) { verdict = "溢价警告"; verdictLevel = "WARN"; }
  const coffee = {
    id: `CUSTOM-${Date.now()}`,
    originalName: input.originalName,
    alias: input.alias || "CUSTOM BLEND",
    brand: input.brand || "手动录入",
    city: input.city || "未知城市",
    reportedPrice: Number(input.reportedPrice),
    realCost: Number(input.realCost),
    premiumRate,
    caffeineMg: Number(input.caffeineMg) || 0,
    sugarG: Number(input.sugarG) || 0,
    kcal: Number(input.kcal) || 0,
    tags: input.tags || [],
    recipe: input.recipe || ["手动录入，配方未知"],
    costBreakdown: input.costBreakdown || [["合计", Number(input.realCost)]],
    verdict,
    verdictLevel,
    roast: generateRoast({ ...input, premiumRate })
  };
  const saved = Math.max(0, coffee.reportedPrice - Math.min(...SHOPS.map(s => s.price)));
  const ts = Date.now();
  const info = db.prepare("INSERT INTO scans (device_id, coffee_id, image_url, price, saved, created_at, custom_coffee_json) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(deviceId, coffee.id, imageUrl || "", coffee.reportedPrice, saved, ts, JSON.stringify(coffee));
  // 累计今日摄入
  const tStr = todayStr();
  const exist = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  if (exist) {
    db.prepare("UPDATE today_intake SET caffeine = caffeine + ?, sugar = sugar + ?, kcal = kcal + ? WHERE id = ?")
      .run(coffee.caffeineMg, coffee.sugarG, coffee.kcal, exist.id);
  } else {
    db.prepare("INSERT INTO today_intake (device_id, caffeine, sugar, kcal, date) VALUES (?, ?, ?, ?, ?)")
      .run(deviceId, coffee.caffeineMg, coffee.sugarG, coffee.kcal, tStr);
  }
  unlockAchievement(deviceId, "first-scan");
  if (coffee.caffeineMg <= 50) unlockAchievement(deviceId, "low-caff");
  if (coffee.sugarG <= 5) unlockAchievement(deviceId, "no-sugar");
  res.json({ scanId: info.lastInsertRowid, coffee, saved, imageUrl, recommendations: recommendShops(coffee), ts });
});

// 自然语言录入（AI 解析）
app.post("/api/scan/analyze-natural", async (req, res) => {
  const deviceId = getDevice(req);
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "请输入描述" });

  let input;
  if (hasLLM()) {
    try { input = await parseCoffeeFromText(text); }
    catch (e) { return res.status(500).json({ error: "AI 解析失败：" + e.message }); }
  } else {
    return res.status(503).json({ error: "AI 服务未配置，请在 .env 设置 LLM API Key" });
  }
  if (!input?.originalName) return res.status(400).json({ error: "无法从描述中提取咖啡信息" });
  if (!input.reportedPrice || !input.realCost) return res.status(400).json({ error: "AI 未能提取价格信息，请补充描述" });

  // 补算 premiumRate + verdict（复用 analyze-custom 逻辑）
  const premiumRate = Math.round((Number(input.reportedPrice) - Number(input.realCost)) / Number(input.realCost) * 100);
  let verdict = "平价", verdictLevel = "OK";
  if (premiumRate >= 500) { verdict = "智商核弹"; verdictLevel = "EXTREME"; }
  else if (premiumRate >= 300) { verdict = "溢价严重"; verdictLevel = "HIGH"; }
  else if (premiumRate >= 150) { verdict = "溢价警告"; verdictLevel = "WARN"; }

  const coffee = {
    id: `AI-${Date.now()}`,
    originalName: input.originalName,
    alias: input.alias || "AI 解析",
    brand: input.brand || "未知品牌",
    city: input.city || "未知城市",
    reportedPrice: Number(input.reportedPrice),
    realCost: Number(input.realCost),
    premiumRate,
    caffeineMg: Number(input.caffeineMg) || 0,
    sugarG: Number(input.sugarG) || 0,
    kcal: Number(input.kcal) || 0,
    tags: input.tags || [],
    recipe: input.recipe || ["AI 解析，配方估算"],
    costBreakdown: input.costBreakdown || [["合计", Number(input.realCost)]],
    verdict,
    verdictLevel,
    roast: generateRoast({ ...input, premiumRate, originalName: input.originalName })
  };

  const saved = Math.max(0, coffee.reportedPrice - Math.min(...SHOPS.map(s => s.price)));
  const ts = Date.now();
  const info = db.prepare("INSERT INTO scans (device_id, coffee_id, image_url, price, saved, created_at, custom_coffee_json) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(deviceId, coffee.id, "", coffee.reportedPrice, saved, ts, JSON.stringify(coffee));
  // 累计今日摄入
  const tStr = todayStr();
  const exist = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  if (exist) {
    db.prepare("UPDATE today_intake SET caffeine = caffeine + ?, sugar = sugar + ?, kcal = kcal + ? WHERE id = ?")
      .run(coffee.caffeineMg, coffee.sugarG, coffee.kcal, exist.id);
  } else {
    db.prepare("INSERT INTO today_intake (device_id, caffeine, sugar, kcal, date) VALUES (?, ?, ?, ?, ?)")
      .run(deviceId, coffee.caffeineMg, coffee.sugarG, coffee.kcal, tStr);
  }
  unlockAchievement(deviceId, "first-scan");
  if (coffee.caffeineMg <= 50) unlockAchievement(deviceId, "low-caff");
  if (coffee.sugarG <= 5) unlockAchievement(deviceId, "no-sugar");
  res.json({ scanId: info.lastInsertRowid, coffee, saved, imageUrl: "", recommendations: recommendShops(coffee), ts });
});

// 历史记录
app.get("/api/scan/history/:deviceId", (req, res) => {
  const rows = db.prepare("SELECT * FROM scans WHERE device_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.deviceId);
  const enriched = rows.map(r => {
    const coffee = COFFEES.find(c => c.id === r.coffee_id);
    return { ...r, coffee };
  });
  res.json(enriched);
});

// 广场
app.get("/api/plaza", (req, res) => {
  const cat = req.query.cat;
  let rows = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
  if (cat && cat !== "全部") rows = rows.filter(r => r.cat === cat);
  // 标记当前设备是否点过赞
  const deviceId = getDevice(req);
  const liked = db.prepare("SELECT post_id FROM post_likes WHERE device_id = ?").all(deviceId).map(x => x.post_id);
  rows = rows.map(r => ({ ...r, verified: !!r.verified, spotlight: !!r.spotlight, liked: liked.includes(r.id) }));
  res.json(rows);
});

app.post("/api/plaza", (req, res) => {
  const deviceId = getDevice(req);
  const { cat, original, truth, price, real, premium, imageUrl } = req.body || {};
  if (!original || !truth) return res.status(400).json({ error: "内容不完整" });
  const id = `U-${Date.now().toString(36)}`;
  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId);
  const user = device?.nickname ? `@${device.nickname}` : "@匿名品鉴官";
  db.prepare(`INSERT INTO posts (id, device_id, user, cat, original, truth, price, real_cost, premium, image_url, likes, comments, verified, spotlight, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`)
    .run(id, deviceId, user, cat || "特调", original, truth, price || 0, real || 0, premium || 0, imageUrl || "", Date.now());
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  res.json({ ...row, verified: false, spotlight: false, liked: false });
});

app.post("/api/plaza/:id/like", (req, res) => {
  const deviceId = getDevice(req);
  const postId = req.params.id;
  const exist = db.prepare("SELECT * FROM post_likes WHERE post_id = ? AND device_id = ?").get(postId, deviceId);
  if (exist) {
    db.prepare("DELETE FROM post_likes WHERE post_id = ? AND device_id = ?").run(postId, deviceId);
    db.prepare("UPDATE posts SET likes = likes - 1 WHERE id = ? AND likes > 0").run(postId);
    return res.json({ liked: false, likes: db.prepare("SELECT likes FROM posts WHERE id = ?").get(postId).likes });
  }
  db.prepare("INSERT OR IGNORE INTO post_likes (post_id, device_id) VALUES (?, ?)").run(postId, deviceId);
  db.prepare("UPDATE posts SET likes = likes + 1 WHERE id = ?").run(postId);
  res.json({ liked: true, likes: db.prepare("SELECT likes FROM posts WHERE id = ?").get(postId).likes });
});

// 帖子评论
app.get("/api/plaza/:id/comments", (req, res) => {
  const rows = db.prepare("SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.id);
  res.json(rows);
});

app.post("/api/plaza/:id/comments", (req, res) => {
  const deviceId = getDevice(req);
  const { content, rating } = req.body || {};
  if (!content?.trim()) return res.status(400).json({ error: "评论内容不能为空" });
  const id = `C-${Date.now().toString(36)}`;
  const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId);
  const user = device?.nickname ? `@${device.nickname}` : "@匿名品鉴官";
  db.prepare("INSERT INTO post_comments (id, post_id, device_id, user, content, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, req.params.id, deviceId, user, content.trim(), rating || "", Date.now());
  db.prepare("UPDATE posts SET comments = comments + 1 WHERE id = ?").run(req.params.id);
  res.json({ id, post_id: req.params.id, user, content: content.trim(), rating: rating || "", created_at: Date.now() });
});

// 良心店
app.get("/api/shops", (req, res) => {
  const { tag, sort, q } = req.query;
  let rows = [...SHOPS];
  if (tag && tag !== "全部") rows = rows.filter(s => s.tags.includes(tag));
  if (q) rows = rows.filter(s => (s.name + s.district + s.desc).includes(q));
  if (sort === "price") rows.sort((a, b) => a.price - b.price);
  else if (sort === "rating") rows.sort((a, b) => b.rating - a.rating);
  else if (sort === "dist") rows.sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
  const deviceId = getDevice(req);
  const favs = db.prepare("SELECT shop_id FROM favourites WHERE device_id = ?").all(deviceId).map(x => x.shop_id);
  rows = rows.map(s => ({ ...s, fav: favs.includes(s.id) }));
  res.json(rows);
});

app.get("/api/shops/:id", (req, res) => {
  const s = SHOPS.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: "未找到" });
  res.json(s);
});

// 收藏店铺
app.post("/api/shops/:id/fav", (req, res) => {
  const deviceId = getDevice(req);
  const shopId = req.params.id;
  const exist = db.prepare("SELECT * FROM favourites WHERE device_id = ? AND shop_id = ?").get(deviceId, shopId);
  if (exist) {
    db.prepare("DELETE FROM favourites WHERE device_id = ? AND shop_id = ?").run(deviceId, shopId);
    return res.json({ fav: false });
  }
  db.prepare("INSERT OR IGNORE INTO favourites (device_id, shop_id, created_at) VALUES (?, ?, ?)").run(deviceId, shopId, Date.now());
  // 成就：收藏 3 家
  const cnt = db.prepare("SELECT COUNT(*) as c FROM favourites WHERE device_id = ?").get(deviceId).c;
  if (cnt >= 3) unlockAchievement(deviceId, "fav-3");
  res.json({ fav: true });
});

// 档案
app.get("/api/profile/:deviceId", (req, res) => {
  const deviceId = req.params.deviceId;
  const dev = db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId);
  let prefs = db.prepare("SELECT * FROM profile_prefs WHERE device_id = ?").get(deviceId);
  const prefsObj = prefs ? JSON.parse(prefs.prefs_json) : {
    lactoseIntolerant: false, caffeineSensitive: false, sugarFree: false,
    pregnant: false, vegan: false, lowBudget: true, nightOwl: false
  };
  const scanCount = db.prepare("SELECT COUNT(*) as c FROM scans WHERE device_id = ?").get(deviceId).c;
  const totalSaved = db.prepare("SELECT COALESCE(SUM(saved),0) as s FROM scans WHERE device_id = ?").get(deviceId).s;
  const favCount = db.prepare("SELECT COUNT(*) as c FROM favourites WHERE device_id = ?").get(deviceId).c;
  const achv = db.prepare("SELECT achievement_key FROM achievements_unlocked WHERE device_id = ?").all(deviceId).map(x => x.achievement_key);
  // 合并默认成就（首次使用也展示初始两个）
  const merged = Array.from(new Set([...achv, "first-scan", "streak-7"]));

  const stats = {
    ...defaultStats(),
    scanCount: Math.max(scanCount, defaultStats().scanCount),
    savedMoney: Math.max(totalSaved, defaultStats().savedMoney),
    blockedSpoons: scanCount * 3 + 2,
    roastRead: Math.min(scanCount, 7),
    favCount
  };
  res.json({
    device: dev || { id: deviceId, nickname: "匿名品鉴官" },
    profile: prefsObj,
    stats,
    achievements: merged,
    achievementsMeta: ACHIEVEMENTS
  });
});

app.put("/api/profile/:deviceId", (req, res) => {
  const deviceId = req.params.deviceId;
  const prefs = req.body.profile || req.body;
  db.prepare("INSERT INTO profile_prefs (device_id, prefs_json, updated_at) VALUES (?, ?, ?)")
    .run(deviceId, JSON.stringify(prefs), Date.now());
  res.json({ ok: true, profile: prefs });
});

// 今日摄入
app.get("/api/profile/:deviceId/today", (req, res) => {
  const deviceId = req.params.deviceId;
  const tStr = todayStr();
  const row = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  res.json({
    caffeineMg: row?.caffeine || 0,
    sugarG: row?.sugar || 0,
    kcal: row?.kcal || 0,
    ts: Date.now()
  });
});

// 周期摄入统计（周/月/年）
app.get("/api/profile/:deviceId/intake-stats", (req, res) => {
  const deviceId = req.params.deviceId;
  const period = req.query.period || "weekly";
  const rows = db.prepare("SELECT * FROM today_intake WHERE device_id = ?").all(deviceId);
  const parsed = rows.map(r => {
    const [y, m, d] = r.date.split("-").map(Number);
    return { ...r, year: y, month: m, day: d };
  });
  const now = new Date();
  let points = [];

  if (period === "weekly") {
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(now); dt.setDate(now.getDate() - i);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
      const r = parsed.find(p => p.date === key) || { caffeine: 0, sugar: 0, kcal: 0 };
      points.push({ label: dayNames[dt.getDay()], caffeineMg: r.caffeine || 0, sugarG: r.sugar || 0, kcal: r.kcal || 0 });
    }
  } else if (period === "monthly") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const r = parsed.find(p => p.year === now.getFullYear() && p.month === now.getMonth() + 1 && p.day === d) || { caffeine: 0, sugar: 0, kcal: 0 };
      points.push({ label: String(d), caffeineMg: r.caffeine || 0, sugarG: r.sugar || 0, kcal: r.kcal || 0 });
    }
  } else {
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    for (let m = 1; m <= 12; m++) {
      const monthRows = parsed.filter(p => p.year === now.getFullYear() && p.month === m);
      points.push({
        label: monthNames[m - 1],
        caffeineMg: monthRows.reduce((s, r) => s + (r.caffeine || 0), 0),
        sugarG: monthRows.reduce((s, r) => s + (r.sugar || 0), 0),
        kcal: monthRows.reduce((s, r) => s + (r.kcal || 0), 0)
      });
    }
  }

  const totals = points.reduce((acc, p) => ({
    caffeineMg: acc.caffeineMg + p.caffeineMg, sugarG: acc.sugarG + p.sugarG, kcal: acc.kcal + p.kcal
  }), { caffeineMg: 0, sugarG: 0, kcal: 0 });
  const validDays = period === "yearly" ? 12 : (points.filter(p => p.caffeineMg || p.sugarG || p.kcal).length || 1);
  const averages = {
    caffeineMg: Math.round(totals.caffeineMg / validDays),
    sugarG: Math.round(totals.sugarG / validDays),
    kcal: Math.round(totals.kcal / validDays)
  };
  res.json({ period, totals, averages, points });
});

app.post("/api/profile/:deviceId/intake", (req, res) => {
  const deviceId = req.params.deviceId;
  const { caffeineMg, sugarG, kcal } = req.body || {};
  const tStr = todayStr();
  const exist = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  if (exist) {
    db.prepare("UPDATE today_intake SET caffeine = caffeine + ?, sugar = sugar + ?, kcal = kcal + ? WHERE id = ?")
      .run(caffeineMg || 0, sugarG || 0, kcal || 0, exist.id);
  } else {
    db.prepare("INSERT INTO today_intake (device_id, caffeine, sugar, kcal, date) VALUES (?, ?, ?, ?, ?)")
      .run(deviceId, caffeineMg || 0, sugarG || 0, kcal || 0, tStr);
  }
  const row = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  res.json({ caffeineMg: row.caffeine, sugarG: row.sugar, kcal: row.kcal, ts: Date.now() });
});

// 常量
app.get("/api/meta", (req, res) => res.json({ HEALTH_OPTS, MOCK_STATES, ACHIEVEMENTS, cats: ["全部", "美式", "拿铁", "特调", "抹茶", "果咖"], shopTags: ["全部", "自烘", "平价", "无糖", "鲜奶", "社区", "安静", "熟客店"] }));

// 导出数据
app.get("/api/profile/:deviceId/export", (req, res) => {
  const deviceId = req.params.deviceId;
  const scans = db.prepare("SELECT * FROM scans WHERE device_id = ?").all(deviceId);
  const favs = db.prepare("SELECT shop_id FROM favourites WHERE device_id = ?").all(deviceId).map(x => x.shop_id);
  const intake = db.prepare("SELECT * FROM today_intake WHERE device_id = ?").all(deviceId);
  const achv = db.prepare("SELECT achievement_key FROM achievements_unlocked WHERE device_id = ?").all(deviceId).map(x => x.achievement_key);
  const prefs = db.prepare("SELECT * FROM profile_prefs WHERE device_id = ?").get(deviceId);
  res.json({
    deviceId,
    exportedAt: new Date().toISOString(),
    profile: prefs ? JSON.parse(prefs.prefs_json) : null,
    scans,
    favourites: favs,
    achievements: achv,
    intake
  });
});

app.listen(PORT, () => {
  console.log(`☕ CoffeeSpit 后端已启动: http://localhost:${PORT}`);
  console.log(`   上传目录: ${UPLOAD_DIR}`);
});
