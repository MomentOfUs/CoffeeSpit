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
import { parseCoffeeFromText, parseCoffeeFromImage, hasLLM, recommendCoffeeByText, generateImpression, generateWeeklyReport } from "./llm.js";
import { computeMbti, MBTI_TYPES } from "./data/mbti.js";

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
  return { scanCount: 0, savedMoney: 0, blockedSpoons: 0, roastRead: 0, monthSaved: 0, monthScans: 0, streak: 0 };
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

// 图片识别扫描（AI 视觉解析）
app.post("/api/scan/analyze-image", upload.single("image"), async (req, res) => {
  const deviceId = getDevice(req);
  if (!req.file) return res.status(400).json({ error: "未收到图片" });

  if (!hasLLM()) {
    return res.status(503).json({ error: "AI 服务未配置，请在 .env 设置 LLM API Key" });
  }

  try {
    // 1. 读取图片并转为 base64 Data URL
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64 = imageBuffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 2. 调用视觉模型解析
    const parsed = await parseCoffeeFromImage(dataUrl);
    if (!parsed) return res.status(503).json({ error: "AI 视觉模型调用失败" });

    // 3. 若未识别到菜单
    if (!parsed.detected) {
      return res.json({ ok: true, detected: false, reason: parsed.reason || "未能识别图片中的菜单或咖啡信息" });
    }

    // 4. 补全缺失字段
    const input = {
      originalName: parsed.originalName || "未命名咖啡",
      brand: parsed.brand || "未知品牌",
      city: parsed.city || "未知城市",
      reportedPrice: parsed.reportedPrice || 0,
      realCost: parsed.realCost || 6.0,
      caffeineMg: parsed.caffeineMg || 0,
      sugarG: parsed.sugarG || 0,
      kcal: parsed.kcal || 0,
      tags: parsed.tags || [],
      recipe: parsed.recipe || ["AI 识别，配方估算"],
      costBreakdown: parsed.costBreakdown || [["合计", parsed.realCost || 6.0]],
      shopName: parsed.shopName || "",
      shopAddress: parsed.shopAddress || ""
    };

    // 5. 复用 analyze-custom 的 verdict / premiumRate 逻辑
    const premiumRate = input.reportedPrice && input.realCost
      ? Math.round((Number(input.reportedPrice) - Number(input.realCost)) / Number(input.realCost) * 100)
      : 0;
    let verdict = "平价", verdictLevel = "OK";
    if (premiumRate >= 500) { verdict = "智商核弹"; verdictLevel = "EXTREME"; }
    else if (premiumRate >= 300) { verdict = "溢价严重"; verdictLevel = "HIGH"; }
    else if (premiumRate >= 150) { verdict = "溢价警告"; verdictLevel = "WARN"; }

    // 6. 若识别到店铺地址，调用地理编码补全经纬度
    let shopGeo = null;
    if (input.shopAddress) {
      shopGeo = await geocodeAddress(input.shopAddress);
    }

    const coffee = {
      id: `IMG-${Date.now()}`,
      originalName: input.originalName,
      alias: "AI 图像识别",
      brand: input.brand,
      city: input.city,
      reportedPrice: Number(input.reportedPrice),
      realCost: Number(input.realCost),
      premiumRate,
      caffeineMg: Number(input.caffeineMg),
      sugarG: Number(input.sugarG),
      kcal: Number(input.kcal),
      tags: input.tags,
      recipe: input.recipe,
      costBreakdown: input.costBreakdown,
      verdict,
      verdictLevel,
      roast: generateRoast({ ...input, premiumRate }),
      shopGeo
    };

    const saved = Math.max(0, coffee.reportedPrice - Math.min(...SHOPS.map(s => s.price)));
    const ts = Date.now();
    const imageUrl = `/uploads/${req.file.filename}`;
    const info = db.prepare("INSERT INTO scans (device_id, coffee_id, image_url, price, saved, created_at, custom_coffee_json) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(deviceId, coffee.id, imageUrl, coffee.reportedPrice, saved, ts, JSON.stringify(coffee));
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
  } catch (e) {
    console.error("analyze-image error:", e);
    res.status(500).json({ ok: false, error: "图像识别失败：" + (e.message || "未知错误") });
  }
});

// 高德地理编码（服务端调用，避免暴露 Key）
async function geocodeAddress(address) {
  const key = process.env.AMAP_SERVER_KEY;
  if (!key || !address) return null;
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "1" && data.geocodes?.length) {
      const [lng, lat] = data.geocodes[0].location.split(",");
      return { lng: parseFloat(lng), lat: parseFloat(lat), address };
    }
  } catch (e) { console.error("geocode error:", e); }
  return null;
}

// 高德天气（服务端串联 regeo + weather，复用 AMAP_SERVER_KEY）
async function getWeatherByLatLng(lat, lng) {
  const key = process.env.AMAP_SERVER_KEY;
  if (!key || lat == null || lng == null) return null;
  try {
    // 1. 逆地理：经纬度 → adcode
    const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${key}`;
    const r1 = await fetch(regeoUrl);
    const d1 = await r1.json();
    if (d1.status !== "1" || !d1.regeocode?.address?.adcode) return null;
    const adcode = d1.regeocode.address.adcode;
    const city = d1.regeocode.address.city || d1.regeocode.address.province || "";
    // 2. 天气：adcode → 实况
    const wUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&key=${key}&extensions=base`;
    const r2 = await fetch(wUrl);
    const d2 = await r2.json();
    if (d2.status === "1" && d2.lives?.length) {
      const l = d2.lives[0];
      return {
        ok: true,
        temperature: parseFloat(l.temperature) || 0,
        humidity: parseFloat(l.humidity) || 0,
        weather: l.weather || "",
        city: city || "",
        reporttime: l.reporttime || ""
      };
    }
  } catch (e) { console.error("weather error:", e); }
  return null;
}

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
    scanCount,
    savedMoney: totalSaved,
    blockedSpoons: scanCount * 3,
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
  const caffeineFeedback = db.prepare("SELECT * FROM caffeine_feedback WHERE device_id = ?").all(deviceId);
  const impressions = db.prepare("SELECT * FROM ai_impressions WHERE device_id = ? ORDER BY created_at DESC").all(deviceId);
  const weeklyReports = db.prepare("SELECT * FROM weekly_reports WHERE device_id = ? ORDER BY created_at DESC").all(deviceId);
  res.json({
    deviceId,
    exportedAt: new Date().toISOString(),
    profile: prefs ? JSON.parse(prefs.prefs_json) : null,
    scans,
    favourites: favs,
    achievements: achv,
    intake,
    caffeineFeedback,
    impressions,
    weeklyReports
  });
});

// ============ AI 生活品味：场景建议 / 口味画像 / 品鉴笔记 ============

// 场景化 AI 建议（规则引擎，零 LLM 成本）
app.get("/api/profile/:deviceId/scene-suggestion", (req, res) => {
  const deviceId = req.params.deviceId;
  const hour = new Date().getHours();
  const tStr = todayStr();
  const intake = db.prepare("SELECT * FROM today_intake WHERE device_id = ? AND date = ?").get(deviceId, tStr);
  const caffeineNow = intake?.caffeine || 0;
  const sugarNow = intake?.sugar || 0;

  let prefs = db.prepare("SELECT * FROM profile_prefs WHERE device_id = ?").get(deviceId);
  const prefsObj = prefs ? JSON.parse(prefs.prefs_json) : {};
  const caffeineLimit = prefsObj.caffeineThreshold || (prefsObj.caffeineSensitive ? 200 : 400);
  const caffeineBudget = Math.max(0, caffeineLimit - caffeineNow);

  let scene, headline, warning = null, tip = null;
  if (hour >= 6 && hour < 11) {
    scene = "morning";
    headline = "早上好，来一杯温和的拿铁开启一天";
    if (caffeineNow === 0) tip = "空腹时段避免高酸浅烘，可选燕麦奶拿铁";
  } else if (hour >= 11 && hour < 17) {
    scene = "afternoon";
    headline = caffeineNow > 0 ? "下午茶时间，注意咖啡因额度" : "午后提神，选一杯适合自己的";
    if (caffeineBudget < 100) tip = `今日剩余咖啡因额度仅 ${caffeineBudget}mg，建议选低因`;
  } else if (hour >= 17 && hour < 20) {
    scene = "evening";
    headline = "傍晚了，咖啡因选低一些";
    tip = "距睡眠时间渐近，建议咖啡因 ≤ 100mg";
  } else {
    scene = "late_night";
    if (prefsObj.nightOwl) {
      headline = "夜猫子时间，注意控制摄入";
      tip = "夜间代谢减缓，建议选无因或低因";
    } else {
      headline = "夜晚不建议再摄入咖啡因";
      tip = "咖啡因半衰期约 5 小时，现在摄入可能影响入睡";
    }
  }

  if (caffeineNow >= caffeineLimit) {
    warning = `今日咖啡因已 ${caffeineNow}mg，达上限${caffeineLimit}mg，建议到此为止`;
  } else if (caffeineNow >= caffeineLimit * 0.75) {
    warning = `今日咖啡因 ${caffeineNow}mg，接近上限${caffeineLimit}mg`;
  }
  if (sugarNow >= 40) {
    warning = (warning ? warning + "；" : "") + `今日糖摄入 ${sugarNow}g，已超 WHO 建议 25g`;
  }

  // 推荐店铺：基于场景选合适的
  const recs = [...SHOPS]
    .filter(s => {
      if (scene === "late_night" && !prefsObj.nightOwl) return s.tags?.includes("无糖") || s.price < 15;
      if (scene === "evening") return s.price < 20;
      return true;
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map(s => ({ ...s, saved: Math.max(0, 35 - s.price) }));

  res.json({ scene, headline, caffeineBudget, caffeineNow, caffeineLimit, recommendations: recs, warning, tip });
});

// 口味画像 + 咖啡人格（规则引擎）— 抽出为函数供 AI 印象复用
function computeTasteProfile(deviceId) {
  const scans = db.prepare("SELECT * FROM scans WHERE device_id = ? ORDER BY created_at DESC").all(deviceId);

  if (scans.length === 0) {
    return { scanCount: 0, topTags: [], avgPrice: 0, avgCaffeine: 0, avgSugar: 0, personality: null, priceHistory: {} };
  }

  // 聚合标签
  const tagCount = {};
  let totalPrice = 0, totalCaffeine = 0, totalSugar = 0;
  let extremeCount = 0, lowCaffCount = 0, nightCount = 0;
  const brandCount = {};
  const priceHistory = {};

  scans.forEach(s => {
    let coffee = null;
    try { coffee = s.custom_coffee_json ? JSON.parse(s.custom_coffee_json) : COFFEES.find(c => c.id === s.coffee_id); } catch (_) {}
    if (!coffee) return;

    (coffee.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
    totalPrice += coffee.reportedPrice || s.price || 0;
    totalCaffeine += coffee.caffeineMg || 0;
    totalSugar += coffee.sugarG || 0;
    if (coffee.verdictLevel === "EXTREME") extremeCount++;
    if (coffee.tags?.includes("低因") || coffee.tags?.includes("无因")) lowCaffCount++;
    if (coffee.brand) brandCount[coffee.brand] = (brandCount[coffee.brand] || 0) + 1;

    const hour = new Date(s.created_at).getHours();
    if (hour >= 20 || hour < 6) nightCount++;

    const name = coffee.originalName || coffee.id;
    if (!priceHistory[name]) priceHistory[name] = [];
    priceHistory[name].push({ ts: s.created_at, price: coffee.reportedPrice || s.price });
  });

  const n = scans.length;
  const avgPrice = Math.round(totalPrice / n);
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

  // 糖浆频次
  const syrupCount = Object.entries(tagCount).filter(([t]) => /糖浆|焦糖|海盐|榛果|香草/.test(t)).reduce((s, [, c]) => s + c, 0);
  const syrupRatio = syrupCount / n;

  // 人格判定（MBTI 16 型规则引擎）
  const personality = computeMbti(scans, COFFEES);

  return {
    scanCount: n,
    topTags,
    avgPrice,
    avgCaffeine: Math.round(totalCaffeine / n),
    avgSugar: Math.round(totalSugar / n * 10) / 10,
    personality,
    priceHistory
  };
}

app.get("/api/profile/:deviceId/taste-profile", (req, res) => {
  res.json(computeTasteProfile(req.params.deviceId));
});

// MBTI 16 型图鉴元数据
app.get("/api/mbti/types", (req, res) => {
  res.json(Object.values(MBTI_TYPES).map(t => ({
    code: t.code, name: t.name, group: t.group, groupLabel: t.groupLabel,
    tone: t.tone, tagline: t.tagline, drink: t.drink, illustration: `/mbti/${t.code.toLowerCase()}.jpg`
  })));
});

// 品鉴笔记：新增（可附带身体反馈）
app.post("/api/scan/:scanId/note", (req, res) => {
  const scanId = req.params.scanId;
  const deviceId = getDevice(req);
  const { rating, flavorTags, body, notes, wouldReorder, sleepLatency, palpitation, severity } = req.body;
  const info = db.prepare("INSERT INTO tasting_notes (device_id, scan_id, rating, flavor_tags, body, notes, would_reorder, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(deviceId, scanId, rating || 0, JSON.stringify(flavorTags || []), body || 3, notes || "", wouldReorder ? 1 : 0, Date.now());

  // 若附带身体反馈，同步写入 caffeine_feedback 并校准阈值
  let threshold = null;
  if (palpitation || (sleepLatency && sleepLatency > 0)) {
    const scan = db.prepare("SELECT * FROM scans WHERE id = ?").get(scanId);
    let caffeineMg = 0;
    if (scan) {
      try {
        const c = scan.custom_coffee_json ? JSON.parse(scan.custom_coffee_json) : COFFEES.find(x => x.id === scan.coffee_id);
        caffeineMg = c?.caffeineMg || 0;
      } catch (_) {}
    }
    db.prepare("INSERT INTO caffeine_feedback (device_id, scan_id, caffeine_mg, sleep_latency_min, palpitation, severity, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(deviceId, scanId, caffeineMg, sleepLatency || 0, palpitation ? 1 : 0, severity || 0, "", Date.now());
    threshold = calibrateCaffeineThreshold(deviceId);
  }

  res.json({ ok: true, noteId: info.lastInsertRowid, threshold });
});

// 品鉴笔记：列表
app.get("/api/profile/:deviceId/notes", (req, res) => {
  const deviceId = req.params.deviceId;
  const rows = db.prepare("SELECT * FROM tasting_notes WHERE device_id = ? ORDER BY created_at DESC").all(deviceId);
  const notes = rows.map(r => {
    let coffee = null;
    const scan = db.prepare("SELECT * FROM scans WHERE id = ?").get(r.scan_id);
    if (scan) {
      try { coffee = scan.custom_coffee_json ? JSON.parse(scan.custom_coffee_json) : COFFEES.find(c => c.id === scan.coffee_id); } catch (_) {}
    }
    return {
      ...r,
      flavor_tags: JSON.parse(r.flavor_tags || "[]"),
      coffee: coffee ? { name: coffee.originalName, brand: coffee.brand, price: coffee.reportedPrice } : null
    };
  });
  res.json(notes);
});

// ---- AI 咖啡推荐（基于用户状态描述 + 菜单） ----
function parsePrice(s) { return parseInt(String(s).replace(/[^\d]/g, '')) || 0; }

function ruleBasedRecommend(text, menuContext) {
  const t = text.toLowerCase();
  const rules = [
    { keys: ["低因", "无因", "晚上", "夜", "睡觉", "失眠"], filter: m => /低因|无因|decaf/.test(m.item) || m.shopTags.includes("无糖") },
    { keys: ["无糖", "控糖", "戒糖", "低糖"], filter: m => m.shopTags.includes("无糖") || /美式|黑/.test(m.item) },
    { keys: ["燕麦", "植物奶", "vegan", "素"], filter: m => /燕麦/.test(m.item) },
    { keys: ["便宜", "低价", "预算", "实惠", "平价"], sort: (a, b) => parsePrice(a.price) - parsePrice(b.price) },
    { keys: ["提神", "困", "累", "加班", "熬夜"], filter: m => /美式|澳白|手冲|浓缩/.test(m.item) },
    { keys: ["清爽", "冰", "夏天", "解渴"], filter: m => /冰|美式|苏打/.test(m.item) },
    { keys: ["热", "冬天", "暖"], filter: m => !/冰/.test(m.item) },
    { keys: ["闷", "高温", "湿热", "潮热", "气温"], filter: m => /冰|美式|苏打/.test(m.item) },
    { keys: ["疲惫", "没睡好", "睡眠不足", "焦虑", "心累", "犯困"], filter: m => /美式|澳白|手冲|浓缩/.test(m.item) },
  ];

  let matchedRule = null;
  for (const rule of rules) {
    if (rule.keys.some(k => t.includes(k))) { matchedRule = rule; break; }
  }

  let candidates = [...menuContext];
  if (matchedRule?.filter) candidates = candidates.filter(matchedRule.filter);
  if (matchedRule?.sort) candidates.sort(matchedRule.sort);
  else candidates.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));

  const top = candidates.slice(0, 3);
  return {
    recommendations: top.map(m => ({
      shop: m.shop,
      item: m.item,
      price: m.price,
      reason: matchedRule ? `匹配到你的「${matchedRule.keys.find(k => t.includes(k))}」需求` : "平价优选",
      matchScore: 70,
      shopInfo: { id: SHOPS.find(s => s.name === m.shop)?.id, district: SHOPS.find(s => s.name === m.shop)?.district }
    })),
    summary: matchedRule ? `根据你的描述推荐了 ${top.length} 杯` : "为你推荐几杯平价好咖啡"
  };
}

app.post("/api/recommend", async (req, res) => {
  const { text, lat, lng, mood, sleep } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "请描述你的状态和喜好" });

  // 情境注入：天气（服务端按经纬度取）+ 心情/睡眠（前端传入）
  let enhancedText = text;
  const ctxParts = [];
  if (lat != null && lng != null) {
    try {
      const w = await getWeatherByLatLng(lat, lng);
      if (w?.ok) ctxParts.push(`当前气温${w.temperature}度,湿度${w.humidity}%,天气${w.weather}`);
    } catch (e) { console.error("weather inject error:", e); }
  }
  if (mood) ctxParts.push(`心情${mood}`);
  if (sleep) ctxParts.push(`昨晚睡眠${sleep}`);
  if (ctxParts.length) enhancedText = ctxParts.join(",") + "。" + text;

  // 1. 扁平化菜单数据
  const menuContext = SHOPS.flatMap(s =>
    s.menu.map(([item, price]) => ({
      shop: s.name, item, price,
      shopTags: s.tags || [],
      signature: s.signature || "",
      desc: s.desc || ""
    }))
  );

  // 2. 优先用 LLM 推荐
  if (hasLLM()) {
    try {
      const result = await recommendCoffeeByText(enhancedText, menuContext);
      if (result && result.recommendations) {
        const enriched = result.recommendations.map(r => {
          const shop = SHOPS.find(s => s.name === r.shop);
          return { ...r, shopInfo: shop ? { id: shop.id, district: shop.district, dist: shop.dist, lng: shop.lng, lat: shop.lat } : null };
        });
        return res.json({ ok: true, recommendations: enriched, summary: result.summary, source: "ai" });
      }
    } catch (e) {
      console.error("AI recommend failed:", e.message);
    }
  }

  // 3. 规则引擎降级
  const recs = ruleBasedRecommend(enhancedText, menuContext);
  res.json({ ok: true, recommendations: recs.recommendations, summary: recs.summary, source: "rule" });
});

// ===== 天气（高德 regeo + weather，服务端串联）=====
app.get("/api/weather", async (req, res) => {
  const { lat, lng } = req.query;
  const w = await getWeatherByLatLng(parseFloat(lat), parseFloat(lng));
  if (!w) return res.json({ ok: false });
  res.json(w);
});

// ===== 咖啡因耐受阈值校准（规则：心悸取最近心悸剂量80%，否则取未影响入睡剂量中位数）=====
function calibrateCaffeineThreshold(deviceId) {
  const feedbacks = db.prepare("SELECT * FROM caffeine_feedback WHERE device_id = ? ORDER BY created_at ASC").all(deviceId);
  if (!feedbacks.length) return null;
  const prefs = db.prepare("SELECT * FROM profile_prefs WHERE device_id = ?").get(deviceId);
  let prefsObj = {};
  try { prefsObj = prefs ? JSON.parse(prefs.prefs_json) : {}; } catch (_) {}

  let threshold;
  const palpitations = feedbacks.filter(f => f.palpitation);
  if (palpitations.length) {
    const last = palpitations[palpitations.length - 1];
    threshold = Math.max(50, Math.round(last.caffeine_mg * 0.8));
  } else {
    const okDoses = feedbacks.filter(f => f.sleep_latency_min <= 30).map(f => f.caffeine_mg);
    if (okDoses.length) {
      okDoses.sort((a, b) => a - b);
      const mid = Math.floor(okDoses.length / 2);
      threshold = okDoses.length % 2 ? okDoses[mid] : Math.round((okDoses[mid - 1] + okDoses[mid]) / 2);
    } else {
      threshold = prefsObj.caffeineSensitive ? 200 : 400;
    }
  }

  prefsObj.caffeineThreshold = threshold;
  if (prefs) {
    db.prepare("UPDATE profile_prefs SET prefs_json = ? WHERE device_id = ?").run(JSON.stringify(prefsObj), deviceId);
  } else {
    db.prepare("INSERT INTO profile_prefs (device_id, prefs_json) VALUES (?, ?)").run(deviceId, JSON.stringify(prefsObj));
  }
  return threshold;
}

// 咖啡因耐受反馈：单独记录
app.post("/api/scan/:scanId/caffeine-feedback", (req, res) => {
  const scanId = req.params.scanId;
  const deviceId = getDevice(req);
  const { sleepLatency, palpitation, severity, note } = req.body;
  const scan = db.prepare("SELECT * FROM scans WHERE id = ?").get(scanId);
  let caffeineMg = 0;
  if (scan) {
    try {
      const c = scan.custom_coffee_json ? JSON.parse(scan.custom_coffee_json) : COFFEES.find(x => x.id === scan.coffee_id);
      caffeineMg = c?.caffeineMg || 0;
    } catch (_) {}
  }
  db.prepare("INSERT INTO caffeine_feedback (device_id, scan_id, caffeine_mg, sleep_latency_min, palpitation, severity, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(deviceId, scanId, caffeineMg, sleepLatency || 0, palpitation ? 1 : 0, severity || 0, note || "", Date.now());
  const threshold = calibrateCaffeineThreshold(deviceId);
  res.json({ ok: true, threshold });
});

// 咖啡因耐受阈值查询
app.get("/api/profile/:deviceId/caffeine-threshold", (req, res) => {
  const deviceId = req.params.deviceId;
  const feedbacks = db.prepare("SELECT * FROM caffeine_feedback WHERE device_id = ? ORDER BY created_at DESC").all(deviceId);
  const prefs = db.prepare("SELECT * FROM profile_prefs WHERE device_id = ?").get(deviceId);
  let prefsObj = {};
  try { prefsObj = prefs ? JSON.parse(prefs.prefs_json) : {}; } catch (_) {}
  res.json({
    threshold: prefsObj.caffeineThreshold || (prefsObj.caffeineSensitive ? 200 : 400),
    feedbackCount: feedbacks.length,
    recent: feedbacks.slice(0, 5)
  });
});

// AI 喜好印象：手动生成（缓存命中即返回）
app.post("/api/profile/:deviceId/impression", async (req, res) => {
  const deviceId = req.params.deviceId;
  if (!hasLLM()) return res.status(503).json({ error: "未配置 LLM Key，无法生成 AI 印象" });

  const notes = db.prepare(`
    SELECT tn.*, s.custom_coffee_json, s.coffee_id
    FROM tasting_notes tn LEFT JOIN scans s ON tn.scan_id = s.id
    WHERE tn.device_id = ? ORDER BY tn.created_at DESC LIMIT 50
  `).all(deviceId);

  if (!notes.length) return res.status(400).json({ error: "暂无品鉴笔记，先去记录几杯咖啡吧" });

  notes.forEach(n => {
    let coffee = null;
    try { coffee = n.custom_coffee_json ? JSON.parse(n.custom_coffee_json) : COFFEES.find(c => c.id === n.coffee_id); } catch (_) {}
    n.coffee = coffee || { name: "未知咖啡", originalName: "未知" };
  });

  const tasteProfile = computeTasteProfile(deviceId);

  // 缓存命中：笔记数未变则直接返回
  const cached = db.prepare("SELECT * FROM ai_impressions WHERE device_id = ? ORDER BY created_at DESC LIMIT 1").get(deviceId);
  if (cached && cached.notes_count === notes.length) {
    return res.json({
      impression: cached.impression_text,
      keywords: JSON.parse(cached.keywords_json || "[]"),
      cached: true,
      createdAt: cached.created_at
    });
  }

  try {
    const result = await generateImpression(notes, tasteProfile);
    if (!result) return res.status(500).json({ error: "AI 生成失败" });
    db.prepare("INSERT INTO ai_impressions (device_id, impression_text, keywords_json, notes_count, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(deviceId, result.impression, JSON.stringify(result.keywords || []), notes.length, Date.now());
    res.json({ impression: result.impression, keywords: result.keywords || [], cached: false });
  } catch (e) {
    console.error("generateImpression error:", e);
    res.status(500).json({ error: "AI 印象生成失败：" + e.message });
  }
});

// 咖啡周报：本周总结（缓存 + 强制刷新）
app.get("/api/profile/:deviceId/weekly-report", async (req, res) => {
  const deviceId = req.params.deviceId;
  const force = req.query.force === "1";

  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = now.toISOString().slice(0, 10);
  const weekStartTs = monday.getTime();

  if (!force) {
    const cached = db.prepare("SELECT * FROM weekly_reports WHERE device_id = ? AND week_start = ?").get(deviceId, weekStart);
    if (cached) {
      const content = JSON.parse(cached.content_json);
      return res.json({ ...content, weekStart: cached.week_start, cached: true });
    }
  }

  if (!hasLLM()) return res.status(503).json({ error: "未配置 LLM Key，无法生成周报" });

  const notes = db.prepare(`
    SELECT tn.*, s.custom_coffee_json, s.coffee_id
    FROM tasting_notes tn LEFT JOIN scans s ON tn.scan_id = s.id
    WHERE tn.device_id = ? AND tn.created_at >= ?
    ORDER BY tn.created_at DESC
  `).all(deviceId, weekStartTs);
  notes.forEach(n => {
    let coffee = null;
    try { coffee = n.custom_coffee_json ? JSON.parse(n.custom_coffee_json) : COFFEES.find(c => c.id === n.coffee_id); } catch (_) {}
    n.coffee = coffee || { name: "未知咖啡", originalName: "未知" };
  });

  const scans = db.prepare("SELECT * FROM scans WHERE device_id = ? AND created_at >= ? ORDER BY created_at DESC").all(deviceId, weekStartTs);
  scans.forEach(s => {
    let coffee = null;
    try { coffee = s.custom_coffee_json ? JSON.parse(s.custom_coffee_json) : COFFEES.find(c => c.id === s.coffee_id); } catch (_) {}
    s.coffee = coffee || { originalName: "未知", reportedPrice: s.price, caffeineMg: 0, sugarG: 0 };
  });

  try {
    const result = await generateWeeklyReport(notes, scans, { start: weekStart, end: weekEnd });
    if (!result) return res.status(500).json({ error: "AI 生成失败" });
    const contentJson = JSON.stringify(result);
    db.prepare("INSERT OR REPLACE INTO weekly_reports (device_id, week_start, content_json, created_at) VALUES (?, ?, ?, ?)")
      .run(deviceId, weekStart, contentJson, Date.now());
    res.json({ ...result, weekStart, cached: false });
  } catch (e) {
    console.error("generateWeeklyReport error:", e);
    res.status(500).json({ error: "周报生成失败：" + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`☕ CoffeeSpit 后端已启动: http://localhost:${PORT}`);
  console.log(`   上传目录: ${UPLOAD_DIR}`);
});
