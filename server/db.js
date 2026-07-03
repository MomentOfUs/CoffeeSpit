// SQLite 数据库：建表 + 种子数据
// 使用 Node 22 内置 node:sqlite（免安装原生模块）
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";
import path from "path";
import { COFFEES, PLAZA, SHOPS, ACHIEVEMENTS, HEALTH_OPTS, MOCK_STATES } from "./data/mock.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "coffeespit.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// ---- 建表 ----
db.exec(`
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS profile_prefs (
  device_id TEXT PRIMARY KEY,
  prefs_json TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  coffee_id TEXT,
  image_url TEXT,
  price INTEGER,
  saved INTEGER,
  created_at INTEGER,
  custom_coffee_json TEXT
);

CREATE TABLE IF NOT EXISTS favourites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  shop_id TEXT,
  created_at INTEGER,
  UNIQUE(device_id, shop_id)
);

CREATE TABLE IF NOT EXISTS today_intake (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  caffeine INTEGER,
  sugar INTEGER,
  kcal INTEGER,
  date TEXT
);

CREATE TABLE IF NOT EXISTS achievements_unlocked (
  device_id TEXT,
  achievement_key TEXT,
  unlocked_at INTEGER,
  PRIMARY KEY(device_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  device_id TEXT,
  user TEXT,
  cat TEXT,
  original TEXT,
  truth TEXT,
  price INTEGER,
  real_cost REAL,
  premium INTEGER,
  image_url TEXT,
  likes INTEGER,
  comments INTEGER,
  verified INTEGER,
  spotlight INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT,
  device_id TEXT,
  PRIMARY KEY(post_id, device_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  user TEXT NOT NULL,
  content TEXT NOT NULL,
  rating TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);
`);

// ---- 幂等迁移：为旧库补 custom_coffee_json 列 ----
try { db.exec("ALTER TABLE scans ADD COLUMN custom_coffee_json TEXT"); } catch (_) { /* 列已存在 */ }

// ---- 种子数据：只在表为空时插入 ----
const countPosts = db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
if (countPosts === 0) {
  const ins = db.prepare(`INSERT INTO posts
    (id, device_id, user, cat, original, truth, price, real_cost, premium, image_url, likes, comments, verified, spotlight, created_at)
    VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)`);
  const now = Date.now();
  db.exec("BEGIN");
  PLAZA.forEach((r, i) => ins.run(r.id, r.user, r.cat, r.original, r.truth, r.price, r.real, r.premium, r.likes, r.comments, r.verified ? 1 : 0, r.spotlight ? 1 : 0, now - i * 3600000));
  db.exec("COMMIT");
}

// 暴露常量给路由
export { db, COFFEES, PLAZA, SHOPS, ACHIEVEMENTS, HEALTH_OPTS, MOCK_STATES };
