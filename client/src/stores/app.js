// 全局响应式 store：设备 / 档案 / 统计 / 今日摄入 / toast
import { reactive, computed, watch } from "vue";
import { api } from "../api/index.js";

const state = reactive({
  deviceReady: false,
  profile: null,
  stats: null,
  achievements: [],
  achievementsMeta: [],
  todayIntake: { caffeineMg: 0, sugarG: 0, kcal: 0, ts: Date.now() },
  meta: null,
  toasts: [],
  healthAlert: null,
  // 新增：AI 印象 / 周报 / 耐受阈值 / 天气（低频高成本，持久化）
  impression: null,
  weeklyReport: null,
  caffeineThreshold: null,
  weather: null
});

// ---- localStorage 持久化（key: coffeespit_state_v1）----
const PERSIST_KEY = "coffeespit_state_v1";
const PERSIST_FIELDS = ["impression", "weeklyReport", "caffeineThreshold"];
function loadPersisted() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    PERSIST_FIELDS.forEach(k => { if (obj[k] !== undefined) state[k] = obj[k]; });
  } catch (_) {}
}
function savePersisted() {
  try {
    const obj = {};
    PERSIST_FIELDS.forEach(k => obj[k] = state[k]);
    localStorage.setItem(PERSIST_KEY, JSON.stringify(obj));
  } catch (_) {}
}
watch(() => [state.impression, state.weeklyReport, state.caffeineThreshold], savePersisted, { deep: true });

// ---- Toast ----
function toast(msg, type = "") {
  const id = Date.now() + Math.random();
  state.toasts.push({ id, msg, type });
  setTimeout(() => {
    const i = state.toasts.findIndex(t => t.id === id);
    if (i >= 0) state.toasts.splice(i, 1);
  }, 2200);
}

// ---- 初始化 ----
async function init() {
  loadPersisted();
  try {
    await api.registerDevice("匿名品鉴官");
    const meta = await api.meta();
    state.meta = meta;
    await refreshProfile();
    await refreshToday();
    state.deviceReady = true;
  } catch (e) {
    toast("后端连接失败，使用本地模式", "err");
    console.error(e);
    state.deviceReady = true;
  }
}

async function refreshProfile() {
  try {
    const p = await api.profile();
    state.profile = p.profile;
    state.stats = p.stats;
    state.achievements = p.achievements;
    state.achievementsMeta = p.achievementsMeta;
  } catch (e) { console.error(e); }
}

// ---- 健康预警 ----
function computeHealthAlert() {
  const t = state.todayIntake;
  if (!t) { state.healthAlert = null; return; }
  const alerts = [];
  const caffLimit = state.caffeineThreshold || 400;
  if (t.caffeineMg >= caffLimit) {
    alerts.push({ level: "danger", icon: "alert", msg: `今日咖啡因 ${t.caffeineMg}mg，已达你的上限 ${caffLimit}mg` });
  } else if (t.caffeineMg >= caffLimit * 0.75) {
    alerts.push({ level: "warn", icon: "gauge", msg: `今日咖啡因 ${t.caffeineMg}mg，接近上限 ${caffLimit}mg` });
  }
  if (t.sugarG >= 50) {
    alerts.push({ level: "danger", icon: "alert", msg: `今日糖摄入 ${t.sugarG}g，已超 WHO 建议 25g` });
  } else if (t.sugarG >= 25) {
    alerts.push({ level: "warn", icon: "gauge", msg: `今日糖摄入 ${t.sugarG}g，达 WHO 建议上限` });
  }
  state.healthAlert = alerts.length ? alerts[0] : null;
}

async function refreshToday() {
  try {
    state.todayIntake = await api.todayIntake();
    computeHealthAlert();
  } catch (e) { console.error(e); }
}

async function updateProfile(prefs) {
  try {
    await api.updateProfile(prefs);
    state.profile = prefs;
    toast("健康档案已更新", "ok");
  } catch (e) { toast("保存失败", "err"); }
}

// ---- AI 印象 / 周报 / 耐受阈值 / 天气 ----
async function loadImpression() {
  try {
    const r = await api.generateImpression();
    state.impression = { impression: r.impression, keywords: r.keywords || [], cached: r.cached, ts: Date.now() };
    return r;
  } catch (e) { toast(e.message || "AI 印象生成失败", "err"); throw e; }
}

async function loadWeeklyReport(force = false) {
  try {
    const r = await api.getWeeklyReport(force);
    state.weeklyReport = { ...r, ts: Date.now() };
    return r;
  } catch (e) { toast(e.message || "周报生成失败", "err"); throw e; }
}

async function loadCaffeineThreshold() {
  try {
    const r = await api.getCaffeineThreshold();
    state.caffeineThreshold = r.threshold || 400;
    return r;
  } catch (e) { console.error(e); }
}

async function submitFeedback(scanId, payload) {
  try {
    const r = await api.submitCaffeineFeedback(scanId, payload);
    if (r.threshold) state.caffeineThreshold = r.threshold;
    toast("已记录，耐受额度已更新", "ok");
    return r;
  } catch (e) { toast("反馈保存失败", "err"); throw e; }
}

async function loadWeather(lat, lng) {
  try {
    const w = await api.getWeather(lat, lng);
    if (w?.ok) { state.weather = w; }
    return w;
  } catch (e) { console.error(e); return null; }
}

export function useStore() {
  return {
    state,
    profile: computed(() => state.profile),
    stats: computed(() => state.stats),
    today: computed(() => state.todayIntake),
    meta: computed(() => state.meta),
    healthAlert: computed(() => state.healthAlert),
    impression: computed(() => state.impression),
    weeklyReport: computed(() => state.weeklyReport),
    caffeineThreshold: computed(() => state.caffeineThreshold),
    weather: computed(() => state.weather),
    init, refreshProfile, refreshToday, updateProfile, toast,
    loadImpression, loadWeeklyReport, loadCaffeineThreshold, submitFeedback, loadWeather
  };
}

// 阈值
export const LIMITS = { caffeine: 400, sugar: 50, kcal: 800 };
export const defaultProfile = {
  lactoseIntolerant: false, caffeineSensitive: false, sugarFree: false,
  pregnant: false, vegan: false, lowBudget: true, nightOwl: false
};
