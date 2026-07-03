<template>
  <div class="page" :data-bg="nickname">
    <!-- 1. 品鉴官证件（集章卡 hero） -->
    <div class="hero profile-hero paper-texture">
      <div class="hero-row">
        <div class="profile-mark"><span>C</span></div>
        <Stamp text="LV.老用户" tone="gold" shape="oval" :rotate="-4" />
      </div>
      <div class="hero-eyebrow">品鉴官证件</div>
      <div class="hero-title">{{ nickname }}</div>
      <div class="hero-device mono">设备编号 · {{ deviceId }}</div>
      <div class="stamp-slots" aria-label="集章槽">
        <span
          v-for="i in 10"
          :key="i"
          class="slot"
          :class="{ filled: i <= scanSlots }"
        ></span>
      </div>
      <div class="slots-meta mono">集章槽 {{ scanSlots }}/10 · 已扫描 {{ displayScan }} 次</div>
    </div>

    <!-- 以下 section 套 reveal-group staggered 入场 -->
    <div class="reveal-group">
      <!-- 2. 统计网格 -->
      <section class="section" :style="{ '--i': 0 }">
        <div class="section-head">
          <h3>数据概览</h3>
          <span class="label"><span class="dot"></span>数据概览</span>
        </div>
        <div v-if="!stats" class="loading"><span class="spinner"></span>加载中…</div>
        <div v-else class="stat-grid paper-texture">
          <div v-for="c in statCells" :key="c.k" class="scell">
            <div class="scell-top">
              <Icon :name="c.ico" :size="14" class="scell-ico" />
              <span class="k">{{ c.k }}</span>
            </div>
            <div class="v accent">{{ c.prefix }}{{ c.v }}</div>
            <div class="sub">{{ c.sub }}</div>
          </div>
        </div>
      </section>

      <!-- 3. 今日摄入：3 个 CupLevel 横向排列 -->
      <section class="section" :style="{ '--i': 1 }">
        <div class="section-head">
          <h3>今日摄入</h3>
          <span class="label"><span class="dot"></span>今日摄入</span>
        </div>
        <div class="panel panel-pad">
          <div class="grid-3">
            <CupLevel
              :value="todayVal.caffeineMg ?? 0"
              :limit="LIMITS.caffeine"
              label="咖啡因"
              unit="mg"
              tone="roast"
              variant="caffeine"
            />
            <CupLevel
              :value="todayVal.sugarG ?? 0"
              :limit="LIMITS.sugar"
              label="糖"
              unit="g"
              tone="gold"
              variant="sugar"
            />
            <CupLevel
              :value="todayVal.kcal ?? 0"
              :limit="LIMITS.kcal"
              label="热量"
              unit="kcal"
              tone="mocha"
              variant="calories"
            />
          </div>
        </div>
      </section>

      <!-- 摄入趋势：周/月/年统计 -->
      <section class="section" :style="{ '--i': 1.5 }">
        <div class="section-head">
          <h3>摄入趋势</h3>
          <span class="label"><span class="dot"></span>周期统计</span>
        </div>
        <div class="panel panel-pad">
          <div class="period-tabs">
            <button v-for="p in periods" :key="p.key" class="chip" :class="{ active: curPeriod === p.key }" @click="switchPeriod(p.key)">{{ p.label }}</button>
          </div>
          <div v-if="!intakeStats" class="loading"><span class="spinner"></span>加载中…</div>
          <template v-else>
            <div class="grid-3 mt-8">
              <div class="intake-stat-cell">
                <div class="k">咖啡因</div>
                <div class="v" style="color:var(--roast)">{{ intakeStats.totals.caffeineMg }}<small>mg</small></div>
                <div class="sub">日均 {{ intakeStats.averages.caffeineMg }}mg</div>
              </div>
              <div class="intake-stat-cell">
                <div class="k">糖</div>
                <div class="v" style="color:var(--gold)">{{ intakeStats.totals.sugarG }}<small>g</small></div>
                <div class="sub">日均 {{ intakeStats.averages.sugarG }}g</div>
              </div>
              <div class="intake-stat-cell">
                <div class="k">热量</div>
                <div class="v" style="color:var(--mocha)">{{ intakeStats.totals.kcal }}<small>kcal</small></div>
                <div class="sub">日均 {{ intakeStats.averages.kcal }}kcal</div>
              </div>
            </div>
            <div class="intake-chart mt-12">
              <div v-for="(p, i) in intakeStats.points" :key="i" class="ic-bar-col">
                <div class="ic-bar" :style="{ height: barHeight(p.caffeineMg) + 'px' }" :class="{ zero: !p.caffeineMg }"></div>
                <div class="ic-label">{{ p.label }}</div>
              </div>
            </div>
            <div v-if="!intakeStats.totals.caffeineMg && !intakeStats.totals.sugarG && !intakeStats.totals.kcal" class="empty" style="padding:20px">
              <div class="ico"><Icon name="cup" :size="28" /></div>
              <div>本周期暂无摄入记录</div>
            </div>
          </template>
        </div>
      </section>

      <!-- 4. 成就墙：圆形印章网格 -->
      <section class="section" :style="{ '--i': 2 }">
        <div class="section-head">
          <h3>成就墙</h3>
          <span class="label mono"><span class="dot"></span>{{ unlockedCount }}/{{ achievementsMeta.length }}</span>
        </div>
        <div v-if="!achievementsMeta.length" class="loading"><span class="spinner"></span>加载中…</div>
        <div v-else class="achv-grid">
          <div
            v-for="(a, idx) in achievementsMeta"
            :key="a.key"
            class="achv-cell"
            :class="{ got: isUnlocked(a.key) }"
            :style="isUnlocked(a.key) ? { '--rot': (idx % 2 === 0 ? -3 : 3) + 'deg' } : null"
            @click="onAchvClick(a)"
          >
            <div class="ico"><Icon :name="a.ico || 'medal'" :size="20" /></div>
            <div class="nm">{{ a.name }}</div>
            <div class="sub">{{ a.sub }}</div>
          </div>
        </div>
      </section>

      <!-- 5. 健康档案：开关前加 Icon -->
      <section class="section" :style="{ '--i': 3 }">
        <div class="section-head">
          <h3>健康档案</h3>
          <span class="label"><span class="dot"></span>健康档案</span>
        </div>
        <div class="panel">
          <div v-for="opt in healthOpts" :key="opt.key" class="switch">
            <div class="sw-left">
              <Icon :name="healthIcon(opt.key)" :size="16" class="sw-ico" />
              <div>
                <div class="sw-name">{{ opt.name }}</div>
                <div class="sw-code">{{ opt.code }}</div>
              </div>
            </div>
            <button
              class="toggle"
              :class="{ on: !!localProfile[opt.key] }"
              :aria-pressed="!!localProfile[opt.key]"
              :aria-label="opt.name"
              @click="toggleOpt(opt.key)"
            ></button>
          </div>
        </div>
      </section>

      <!-- 6. 数据导出 -->
      <section class="section" :style="{ '--i': 4 }">
        <div class="section-head">
          <h3>数据管理</h3>
          <span class="label"><span class="dot"></span>导出报告</span>
        </div>
        <button class="btn btn-block" :disabled="exporting" @click="onExport">
          <Icon name="download" :size="14" />
          {{ exporting ? '导出中…' : '导出我的数据 (JSON)' }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from "vue";
import { useStore, LIMITS, defaultProfile } from "../stores/app.js";
import { api } from "../api/index.js";
import Icon from "../components/Icon.vue";
import Stamp from "../components/Stamp.vue";
import CupLevel from "../components/CupLevel.vue";
import { useCountUp } from "../composables/useCountUp.js";

const {
  state,
  stats,
  today,
  refreshProfile,
  refreshToday,
  updateProfile,
  toast
} = useStore();

// ---- 设备 ID ----
const deviceId = computed(() => {
  try {
    return (api.getDeviceId() || "—").toUpperCase();
  } catch (_) {
    return "—";
  }
});

// ---- 昵称 ----
const nickname = computed(() => state.profile?.nickname || "匿名品鉴官");

// ---- 今日摄入（computed 从 store 读）----
const todayVal = computed(() => today.value || {});

// ---- 统计数字滚动（传入 computed ref，stats 加载后才触发）----
const scanCountC = computed(() => stats.value?.scanCount ?? 0);
const savedMoneyC = computed(() => stats.value?.savedMoney ?? 0);
const blockedSpoonsC = computed(() => stats.value?.blockedSpoons ?? 0);
const streakC = computed(() => stats.value?.streak ?? 0);
const monthScansC = computed(() => stats.value?.monthScans ?? 0);
const monthSavedC = computed(() => stats.value?.monthSaved ?? 0);

const displayScan = useCountUp(scanCountC, 700);
const displaySaved = useCountUp(savedMoneyC, 700);
const displayBlocked = useCountUp(blockedSpoonsC, 700);
const displayStreak = useCountUp(streakC, 700);
const displayMonthScans = useCountUp(monthScansC, 700);
const displayMonthSaved = useCountUp(monthSavedC, 700);

// 统计网格配置：图标 / 标签 / 显示值 / 副标题 / 前缀
const statCells = computed(() => [
  { ico: "scan",    k: "扫描次数",     v: displayScan.value,        sub: "累计扫描次数", prefix: "" },
  { ico: "coins",   k: "累计省下",     v: displaySaved.value,       sub: "累计省下",     prefix: "¥" },
  { ico: "droplet", k: "拦截糖勺",     v: displayBlocked.value,     sub: "拦截糖勺数",   prefix: "" },
  { ico: "fire",    k: "连续打卡",     v: displayStreak.value,      sub: "连续打卡天数", prefix: "" },
  { ico: "camera",  k: "本月扫描",     v: displayMonthScans.value,  sub: "本月扫描",     prefix: "" },
  { ico: "coins",   k: "本月省下",     v: displayMonthSaved.value,  sub: "本月省下",     prefix: "¥" }
]);

// 集章槽：已扫描次数（最多 10 个槽）
const scanSlots = computed(() => Math.min(10, stats.value?.scanCount ?? 0));

// ---- 成就墙 ----
const achievementsMeta = computed(() => state.achievementsMeta || []);
const unlockedCount = computed(() => {
  const got = state.achievements || [];
  return achievementsMeta.value.filter(a => got.includes(a.key)).length;
});
function isUnlocked(key) {
  return (state.achievements || []).includes(key);
}
function onAchvClick(a) {
  // 点击未解锁成就：toast 显示 desc（作为解锁目标提示）
  if (!isUnlocked(a.key)) {
    toast(a.desc || a.name, "");
  }
}

// 成就 ico 已在 mock.js 中直接使用 Icon 组件 name，模板内 a.ico 直传即可

// ---- 健康档案开关 ----
const FALLBACK_HEALTH_OPTS = [
  { key: "lactoseIntolerant", name: "乳糖不耐", code: "乳糖不耐" },
  { key: "caffeineSensitive", name: "咖啡因敏感", code: "咖啡因敏感" },
  { key: "sugarFree", name: "戒糖", code: "控糖" },
  { key: "pregnant", name: "孕期/备孕", code: "孕期" },
  { key: "vegan", name: "植物基", code: "植物奶" },
  { key: "lowBudget", name: "平价优先", code: "低预算" },
  { key: "nightOwl", name: "夜猫子", code: "熬夜党" }
];
const healthOpts = computed(() => state.meta?.HEALTH_OPTS || FALLBACK_HEALTH_OPTS);

// 健康档案图标映射
const HEALTH_ICO = {
  lactoseIntolerant: "droplet",
  caffeineSensitive: "gauge",
  sugarFree: "droplet",
  pregnant: "heart",
  vegan: "cup",
  lowBudget: "coins",
  nightOwl: "clock"
};
function healthIcon(key) {
  return HEALTH_ICO[key] || "stamp";
}

// 本地 profile 副本，绑定开关
const localProfile = reactive({ ...defaultProfile });

// 同步 store.profile -> localProfile（仅同步 defaultProfile 中的 7 个布尔键）
watch(
  () => state.profile,
  (p) => {
    if (!p) return;
    Object.keys(defaultProfile).forEach(k => {
      localProfile[k] = !!p[k];
    });
  },
  { immediate: true }
);

async function toggleOpt(key) {
  localProfile[key] = !localProfile[key];
  // 合并已有 profile 字段后提交，避免覆盖服务端其他字段
  await updateProfile({ ...(state.profile || {}), ...localProfile });
}

// ---- 数据导出 ----
const exporting = ref(false);
async function onExport() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coffeespit-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("数据已导出", "ok");
  } catch (e) {
    toast("导出失败", "err");
  } finally {
    exporting.value = false;
  }
}

// ---- 摄入趋势：周/月/年统计 ----
const periods = [
  { key: "weekly", label: "周" },
  { key: "monthly", label: "月" },
  { key: "yearly", label: "年" }
];
const curPeriod = ref("weekly");
const intakeStats = ref(null);

async function switchPeriod(p) {
  curPeriod.value = p;
  intakeStats.value = null;
  try {
    intakeStats.value = await api.intakeStats(p);
  } catch (e) {
    toast("摄入统计加载失败", "err");
  }
}
function barHeight(v) {
  const max = Math.max(1, ...(intakeStats.value?.points.map(p => p.caffeineMg) || [1]));
  return Math.max(2, (v / max) * 48);
}

// ---- 初始化：若 store 未初始化则拉取数据 ----
onMounted(() => {
  if (!state.profile) refreshProfile();
  if (!state.deviceReady) refreshToday();
  switchPeriod("weekly");
});
</script>

<style scoped>
/* ---- 品鉴官证件 hero ---- */
.profile-hero { padding: 18px 16px; }
.hero-row { display: flex; align-items: center; justify-content: space-between; }
.profile-mark {
  width: 40px; height: 40px;
  border: 2px solid rgba(252,250,244,0.55);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.12);
  font-family: var(--serif); font-size: 18px; font-weight: 800;
  color: var(--cream);
}
.hero-device { font-size: 9.5px; letter-spacing: 0.14em; opacity: 0.75; margin-top: 4px; }

/* 集章槽 */
.stamp-slots { display: flex; gap: 7px; margin-top: 14px; }
.stamp-slots .slot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--foam); opacity: 0.45;
  transition: all .3s ease;
}
.stamp-slots .slot.filled {
  background: var(--caramel); opacity: 1;
  box-shadow: 0 0 0 2px rgba(252,250,244,0.25);
}
.slots-meta { font-size: 8.5px; letter-spacing: 0.12em; opacity: 0.7; margin-top: 8px; }

/* ---- 统计网格 scell 图标行 ---- */
.scell-top { display: flex; align-items: center; gap: 6px; }
.scell-ico { color: var(--caramel); }

/* ---- 成就墙 ---- */
.achv-cell { cursor: pointer; }
.achv-cell .ico { display: flex; align-items: center; justify-content: center; }
.achv-cell.got { animation: stampPress 0.5s cubic-bezier(.2,1.4,.4,1) both; }
.achv-cell.got:hover { box-shadow: 2px 2px 0 var(--caramel); }

/* ---- 健康开关图标 ---- */
.sw-left { display: flex; align-items: center; gap: 10px; }
.sw-ico { color: var(--caramel); flex-shrink: 0; }

/* ---- toggle 焦点 ---- */
.toggle { padding: 0; }
.toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ---- 区块标签改为中文字体（数字比例标签保留 mono） ---- */
.section-head .label { font-family: var(--font); }
.section-head .label.mono { font-family: var(--mono); }

/* ---- 摄入趋势 ---- */
.period-tabs { display: flex; gap: 6px; }
.intake-stat-cell { text-align: center; }
.intake-stat-cell .k { font-family: var(--mono); font-size: 8px; letter-spacing: 0.14em; color: var(--latte); }
.intake-stat-cell .v { font-family: var(--mono); font-size: 18px; font-weight: 800; margin-top: 3px; }
.intake-stat-cell .v small { font-size: 9px; color: var(--latte); font-weight: 500; }
.intake-stat-cell .sub { font-family: var(--mono); font-size: 8px; color: var(--latte); margin-top: 2px; }
.intake-chart { display: flex; align-items: flex-end; gap: 2px; height: 60px; }
.ic-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; }
.ic-bar { width: 60%; max-width: 14px; background: var(--roast); border-radius: 2px 2px 0 0; min-height: 2px; transition: height .4s ease; }
.ic-bar.zero { background: var(--foam-2); }
.ic-label { font-family: var(--mono); font-size: 7px; color: var(--latte); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
</style>
