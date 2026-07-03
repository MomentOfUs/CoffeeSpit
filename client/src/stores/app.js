// 全局响应式 store：设备 / 档案 / 统计 / 今日摄入 / toast
import { reactive, computed } from "vue";
import { api } from "../api/index.js";

const state = reactive({
  deviceReady: false,
  profile: null,
  stats: null,
  achievements: [],
  achievementsMeta: [],
  todayIntake: { caffeineMg: 0, sugarG: 0, kcal: 0, ts: Date.now() },
  meta: null,
  toasts: []
});

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

async function refreshToday() {
  try {
    state.todayIntake = await api.todayIntake();
  } catch (e) { console.error(e); }
}

async function updateProfile(prefs) {
  try {
    await api.updateProfile(prefs);
    state.profile = prefs;
    toast("健康档案已更新", "ok");
  } catch (e) { toast("保存失败", "err"); }
}

export function useStore() {
  return {
    state,
    profile: computed(() => state.profile),
    stats: computed(() => state.stats),
    today: computed(() => state.todayIntake),
    meta: computed(() => state.meta),
    init, refreshProfile, refreshToday, updateProfile, toast
  };
}

// 阈值
export const LIMITS = { caffeine: 400, sugar: 50, kcal: 800 };
export const defaultProfile = {
  lactoseIntolerant: false, caffeineSensitive: false, sugarFree: false,
  pregnant: false, vegan: false, lowBudget: true, nightOwl: false
};
