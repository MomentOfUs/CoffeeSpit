<template>
  <div class="page" :data-bg="nickname" :class="{ 'has-personality': !!tasteProfile?.personality }">
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
      <!-- 咖啡人格（MBTI 16 型）-->
      <section v-if="tasteProfile?.personality" class="section sec-personality" style="--i: 0">
        <div class="section-head">
          <h3>咖啡人格</h3>
          <span class="label"><span class="dot"></span>MBTI 16 型</span>
        </div>
        <div class="panel panel-pad personality-card paper-texture">
          <!-- 头部：人物图 + 印章 + 名称 -->
          <div class="pcard-head">
            <div class="pframe ceramic">
              <img :src="tasteProfile.personality.illustration" :alt="tasteProfile.personality.name" loading="lazy" />
            </div>
            <div class="phead-meta">
              <Stamp :text="tasteProfile.personality.code" :tone="tasteProfile.personality.tone" shape="rect" :rotate="-3" />
              <div class="pname serif">{{ tasteProfile.personality.name }}</div>
              <div class="ptag">{{ tasteProfile.personality.tagline }}</div>
            </div>
          </div>

          <!-- 维度倾向条 -->
          <div class="pdim-wrap">
            <MbtiBar v-for="d in tasteProfile.personality.dimensions" :key="d.key" :dim="d" />
          </div>

          <!-- 毒舌描述 -->
          <p class="personality-desc">{{ tasteProfile.personality.desc }}</p>
          <div v-if="tasteProfile.personality.confidence === 'low'" class="pconf">数据不足，画像待完善</div>

          <!-- 统计 + 标签 -->
          <div class="personality-stats">
            <span><Icon name="scan" :size="11" /> {{ tasteProfile.scanCount }} 次扫描</span>
            <span><Icon name="coins" :size="11" /> 均价 ¥{{ tasteProfile.avgPrice }}</span>
          </div>
          <div v-if="tasteProfile.topTags?.length" class="personality-tags">
            <span v-for="t in tasteProfile.topTags.slice(0,3)" :key="t" class="chip soft">{{ t }}</span>
          </div>

          <button class="btn-mbti-almanac" @click="showAllTypes = true; loadAllTypes()">查看全部 16 型图鉴</button>
          <button class="btn btn-block mt-8" @click="generateImpression" :disabled="impressionLoading">
            <Icon name="sparkle" :size="14" /> {{ impressionLoading ? 'AI 撰写中…' : '生成我的咖啡画像' }}
          </button>
        </div>
      </section>

      <!-- AI 咖啡画像 -->
      <section v-if="state.impression" class="section sec-impression" style="--i:0.5">
        <div class="section-head">
          <h3>AI 咖啡画像</h3>
          <span class="label"><span class="dot"></span>印象手记</span>
        </div>
        <div class="panel panel-pad note-paper imp-card">
          <div class="imp-stamp">
            <Stamp :text="tasteProfile?.personality?.code || '画像'"
                   :tone="tasteProfile?.personality?.tone || 'roast'" shape="rect" :rotate="-4" />
          </div>
          <div class="imp-eyebrow mono">A NOTE ON YOUR TASTE</div>
          <p class="imp-text serif">{{ state.impression.impression }}</p>
          <div v-if="state.impression.keywords?.length" class="imp-kw-row">
            <span v-for="k in state.impression.keywords" :key="k" class="imp-kw">{{ k }}</span>
          </div>
          <div class="imp-foot row-between">
            <span class="mono" style="font-size:10px;color:var(--muted)">ID {{ String(deviceId).slice(-6) }}</span>
            <button class="btn btn-sm" @click="shareMyImpression"><Icon name="share" :size="12" /> 分享画像</button>
          </div>
        </div>
      </section>

      <!-- 咖啡周报 -->
      <section class="section sec-weekly" style="--i:0.6">
        <div class="section-head">
          <h3>咖啡周报</h3>
          <span class="label"><span class="dot"></span>本周小结</span>
        </div>
        <div v-if="weeklyLoading && !state.weeklyReport" class="loading"><span class="spinner"></span>AI 撰写中…</div>
        <div v-else-if="state.weeklyReport" class="panel panel-pad doc-paper">
          <div class="doc-header">
            <div class="doc-seal"><Stamp text="周报" tone="gold" shape="rect" :rotate="5" /></div>
            <div class="doc-title serif">咖啡周报</div>
            <div class="doc-meta mono">COFFEESPIT WEEKLY · {{ state.weeklyReport.weekStart || '' }}</div>
          </div>
          <div class="doc-body">
            <div class="doc-summary">{{ state.weeklyReport.summary }}</div>
            <ul v-if="state.weeklyReport.highlights?.length" class="doc-highlights">
              <li v-for="(h, i) in state.weeklyReport.highlights" :key="i">{{ h }}</li>
            </ul>
            <div v-if="state.weeklyReport.tags?.length" class="doc-tags">
              <span v-for="t in state.weeklyReport.tags" :key="t" class="wr-tag">{{ t }}</span>
            </div>
            <div class="doc-suggestion">
              <span class="doc-sug-label mono">NEXT WEEK</span>
              <p>{{ state.weeklyReport.suggestion }}</p>
            </div>
          </div>
          <div class="doc-foot row-between">
            <span class="mono" style="font-size:10px;color:var(--muted)">{{ state.weeklyReport.cached ? '已缓存' : '本周新生成' }}</span>
            <button class="btn btn-sm" @click="refreshWeekly" :disabled="weeklyLoading">
              <Icon name="refresh" :size="12" /> {{ weeklyLoading ? '生成中…' : '刷新周报' }}
            </button>
          </div>
        </div>
        <div v-else class="panel panel-pad" style="text-align:center;color:var(--muted)">
          <p>本周还没有周报</p>
          <button class="btn btn-sm mt-8" @click="refreshWeekly" :disabled="weeklyLoading">
            <Icon name="refresh" :size="12" /> 生成本周周报
          </button>
        </div>
      </section>

      <!-- 2. 统计网格 -->
      <section class="section sec-stats" :style="{ '--i': 0 }">
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
      <section class="section sec-today" :style="{ '--i': 1 }">
        <div class="section-head">
          <h3>今日摄入</h3>
          <span class="label"><span class="dot"></span>今日摄入</span>
        </div>
        <div class="panel panel-pad">
          <div class="grid-3">
            <CupLevel
              :value="todayVal.caffeineMg ?? 0"
              :limit="caffLimit"
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

      <!-- 咖啡因耐受 -->
      <section class="section sec-tolerance" style="--i:1.2">
        <div class="section-head">
          <h3>咖啡因耐受</h3>
          <span class="label"><span class="dot"></span>个性化上限</span>
        </div>
        <div class="panel panel-pad">
          <CupLevel :value="todayVal.caffeineMg ?? 0" :limit="caffLimit"
                    label="今日 / 上限" unit="mg" tone="roast" variant="caffeine" />
          <div class="tol-meta row-between">
            <span>你的上限 <b class="accent">{{ caffLimit }}mg</b></span>
            <span v-if="toleranceInfo">反馈记录 {{ toleranceInfo.feedbackCount ?? 0 }} 次</span>
          </div>
          <p class="tol-tip">在品鉴笔记里记录入睡延迟与心悸，系统会自动校准你的咖啡因耐受额度。</p>
        </div>
      </section>

      <!-- 摄入趋势：周/月/年统计 -->
      <section class="section sec-intake" :style="{ '--i': 1.5 }">
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
      <section class="section sec-achv" :style="{ '--i': 2 }">
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

      <!-- 品鉴日记时间线 -->
      <section class="section sec-notes" style="--i: 2.5">
        <div class="section-head">
          <h3>品鉴日记</h3>
          <span class="label"><span class="dot"></span>咖啡日记</span>
        </div>
        <div v-if="!notesLoaded" class="loading"><span class="spinner"></span>加载中…</div>
        <div v-else-if="notesGroups.length === 0" class="panel panel-pad empty-state">
          <div class="empty-ico"><Icon name="edit" :size="28" /></div>
          <div class="empty-title">还没有品鉴笔记</div>
          <div class="empty-desc">扫描后在报告中点击「记笔记」开始记录</div>
          <button class="btn btn-sm mt-8" @click="goScan">去扫描</button>
        </div>
        <div v-else>
          <div v-for="grp in notesGroups" :key="grp.label" class="notes-group">
            <div class="notes-month">{{ grp.label }}</div>
            <div v-for="n in grp.items" :key="n.id" class="note-item paper-texture">
              <div class="note-head">
                <div class="note-name">{{ n.coffeeName || n.originalName || '未命名' }}</div>
                <div class="note-date mono">{{ n.dateStr }}</div>
              </div>
              <div class="note-stars">
                <Icon v-for="s in 5" :key="s" name="star" :size="12" :class="{ 'star-on': s <= n.rating }" class="star-mini" />
              </div>
              <div v-if="n.flavorTags?.length" class="note-tags">
                <span v-for="t in n.flavorTags" :key="t" class="chip soft mini">{{ t }}</span>
              </div>
              <div v-if="n.notes" class="note-text">{{ n.notes }}</div>
              <div v-if="n.wouldReorder" class="note-reorder"><Icon name="check" :size="10" /> 会回购</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. 健康档案 + 数据导出（合并） -->
      <section class="section sec-health" :style="{ '--i': 3 }">
        <div class="section-head">
          <h3>健康档案</h3>
          <span class="label"><span class="dot"></span>档案·导出</span>
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
          <div class="perf-line" style="margin: 12px 0"></div>
          <button class="btn btn-block" :disabled="exporting" @click="onExport">
            <Icon name="download" :size="14" />
            {{ exporting ? '导出中…' : '导出我的数据 (JSON)' }}
          </button>
        </div>
      </section>
    </div>

    <!-- 16 型图鉴抽屉 -->
    <Teleport to="body">
      <div v-if="showAllTypes" class="mbti-drawer-mask" @click="showAllTypes = false">
        <div class="mbti-drawer" @click.stop>
          <div class="mbti-drawer-head">
            <h4>16 型咖啡人格图鉴</h4>
            <button class="mbti-drawer-close" @click="showAllTypes = false">✕</button>
          </div>
          <div class="mbti-drawer-body">
            <div class="mbti-almanac-grid">
              <div
                v-for="t in allTypes"
                :key="t.code"
                class="mbti-almanac-item"
                :class="{ current: t.code === tasteProfile?.personality?.code }"
              >
                <img :src="t.illustration" :alt="t.name" loading="lazy" />
                <div class="mbti-almanac-info">
                  <div class="mbti-almanac-code">{{ t.code }}</div>
                  <div class="mbti-almanac-name">{{ t.name }}</div>
                  <div class="mbti-almanac-drink">{{ t.drink }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore, LIMITS, defaultProfile } from "../stores/app.js";
import { api } from "../api/index.js";
import Icon from "../components/Icon.vue";
import Stamp from "../components/Stamp.vue";
import CupLevel from "../components/CupLevel.vue";
import MbtiBar from "../components/MbtiBar.vue";
import { useCountUp } from "../composables/useCountUp.js";
import { shareImpressionCard } from "../composables/useShareCard.js";

const router = useRouter();
const {
  state,
  stats,
  today,
  refreshProfile,
  refreshToday,
  updateProfile,
  toast,
  loadImpression,
  loadWeeklyReport,
  loadCaffeineThreshold
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

// ---- 咖啡人格 ----
const tasteProfile = ref(null);
async function loadTasteProfile() {
  try { tasteProfile.value = await api.tasteProfile(); }
  catch (e) { /* 静默失败 */ }
}

// ---- 16 型图鉴 ----
const showAllTypes = ref(false);
const allTypes = ref([]);
async function loadAllTypes() {
  if (allTypes.value.length) return;
  try { allTypes.value = await api.mbtiTypes(); }
  catch (e) { /* 静默失败 */ }
}

// ---- 品鉴日记 ----
const notesLoaded = ref(false);
const notesList = ref([]);
function goScan() { router.push("/scan"); }

const notesGroups = computed(() => {
  if (!notesList.value.length) return [];
  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthD.getFullYear()}-${String(lastMonthD.getMonth() + 1).padStart(2, "0")}`;
  const groups = {};
  notesList.value.forEach(n => {
    // 解析 flavor_tags JSON
    if (typeof n.flavor_tags === "string") {
      try { n.flavorTags = JSON.parse(n.flavor_tags); } catch (_) { n.flavorTags = []; }
    } else { n.flavorTags = n.flavor_tags || []; }
    n.wouldReorder = !!n.would_reorder;
    // 日期格式化
    const d = new Date(n.created_at);
    n.dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    let label;
    if (ym === curMonth) label = "本月";
    else if (ym === lastMonth) label = "上月";
    else label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    if (!groups[label]) groups[label] = { label, items: [] };
    groups[label].items.push(n);
  });
  return Object.values(groups);
});

async function loadNotes() {
  try {
    notesList.value = await api.getNotes();
  } catch (e) { /* 静默失败 */ }
  finally { notesLoaded.value = true; }
}

// ---- AI 画像 / 周报 / 耐受 ----
const impressionLoading = ref(false);
const weeklyLoading = ref(false);
const toleranceInfo = ref(null);
const caffLimit = computed(() => state.caffeineThreshold ?? LIMITS.caffeine);

async function generateImpression() {
  if (impressionLoading.value) return;
  impressionLoading.value = true;
  try { await loadImpression(); }
  catch (_) {}
  finally { impressionLoading.value = false; }
}

async function shareMyImpression() {
  if (!state.impression) return;
  try {
    await shareImpressionCard({
      impression: state.impression.impression,
      keywords: state.impression.keywords || [],
      nickname: state.profile?.nickname || state.profile?.name || "匿名品鉴官",
      deviceId: deviceId.value,
      personality: { tag: tasteProfile.value?.personality?.code || "品鉴官" }
    });
    toast("分享成功", "ok");
  } catch (e) { toast("分享失败", "err"); }
}

async function refreshWeekly() {
  if (weeklyLoading.value) return;
  weeklyLoading.value = true;
  try { await loadWeeklyReport(true); }
  catch (_) {}
  finally { weeklyLoading.value = false; }
}

// ---- 初始化：若 store 未初始化则拉取数据 ----
onMounted(() => {
  if (!state.profile) refreshProfile();
  if (!state.deviceReady) refreshToday();
  switchPeriod("weekly");
  loadTasteProfile();
  loadNotes();
  loadCaffeineThreshold().then(r => { if (r) toleranceInfo.value = r; }).catch(() => {});
  loadWeeklyReport().catch(() => {});
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
.ic-bar { width: 60%; max-width: 14px; background: var(--roast); border-radius: var(--radius-sm) var(--radius-sm) 0 0; min-height: 2px; transition: height .4s ease; }
.ic-bar.zero { background: var(--foam-2); }
.ic-label { font-family: var(--mono); font-size: 7px; color: var(--latte); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

/* ---- 咖啡人格 ---- */
.personality-card { text-align: left; }
.pcard-head { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
.pframe { width: 88px; height: 88px; flex-shrink: 0; border-radius: var(--radius, 12px); overflow: hidden; position: relative; border: 1px solid rgba(43,30,20,0.1); transform: rotate(-1deg); }
.pframe img { width: 100%; height: 100%; object-fit: cover; display: block; }
.phead-meta { flex: 1; min-width: 0; }
.pname { font-size: 17px; font-weight: 800; color: var(--espresso); margin: 6px 0 2px; line-height: 1.2; }
.ptag { font-size: 10px; color: var(--latte); }
.pdim-wrap { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 12px; }
.pconf { font-size: 10px; color: var(--warn); text-align: center; margin: -4px 0 8px; }
.personality-desc { font-size: 12px; color: var(--mocha); line-height: 1.6; margin: 0 0 10px; }
.personality-stats { display: flex; justify-content: center; gap: 16px; font-size: 11px; color: var(--caramel); font-weight: 600; }
.personality-stats span { display: flex; align-items: center; gap: 3px; }
.personality-tags { display: flex; justify-content: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.btn-mbti-almanac { display: block; width: 100%; margin-top: 12px; padding: 9px; font-size: 11px; color: var(--roast); background: rgba(210,112,43,0.06); border: 1px solid rgba(210,112,43,0.2); border-radius: var(--radius-xs, 2px); cursor: pointer; font-weight: 600; transition: background 0.2s; }
.btn-mbti-almanac:active { background: rgba(210,112,43,0.14); }

/* 16 型图鉴抽屉 */
.mbti-drawer-mask { position: fixed; inset: 0; background: rgba(28,26,23,0.5); z-index: 100; animation: fadeIn 0.25s; }
.mbti-drawer { position: fixed; left: 0; right: 0; bottom: 0; max-height: 80vh; background: var(--oat); border-radius: var(--radius-lg) var(--radius-lg) 0 0; z-index: 101; display: flex; flex-direction: column; animation: drawerUp 0.3s cubic-bezier(0.2,0.9,0.3,1); }
.mbti-drawer-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px 10px; border-bottom: 1px solid rgba(43,30,20,0.08); }
.mbti-drawer-head h4 { font-size: 14px; font-weight: 800; color: var(--espresso); }
.mbti-drawer-close { font-size: 18px; color: var(--latte); background: none; border: none; cursor: pointer; padding: 4px 8px; }
.mbti-drawer-body { overflow-y: auto; padding: 12px 16px 24px; }
.mbti-almanac-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.mbti-almanac-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: var(--radius-xs, 2px); background: rgba(43,30,20,0.03); border: 1px solid transparent; transition: border-color 0.2s; }
.mbti-almanac-item.current { border-color: var(--roast); background: rgba(210,112,43,0.06); }
.mbti-almanac-item img { width: 40px; height: 40px; border-radius: var(--radius-xs, 2px); object-fit: cover; flex-shrink: 0; }
.mbti-almanac-info { min-width: 0; }
.mbti-almanac-code { font-family: var(--mono); font-size: 10px; font-weight: 800; color: var(--roast); }
.mbti-almanac-name { font-size: 11px; font-weight: 700; color: var(--espresso); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mbti-almanac-drink { font-size: 9px; color: var(--latte); }
@keyframes drawerUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ---- 品鉴日记时间线 ---- */
.empty-state { text-align: center; padding: 24px 16px; }
.empty-ico { color: var(--latte); margin-bottom: 8px; }
.empty-title { font-size: 13px; font-weight: 700; color: var(--espresso); margin-bottom: 4px; }
.empty-desc { font-size: 11px; color: var(--mocha); }
.mt-8 { margin-top: 8px; }
.notes-group { margin-bottom: 16px; }
.notes-month { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; color: var(--latte); margin-bottom: 8px; padding-left: 4px; }
.note-item { padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--foam-2); margin-bottom: 8px; }
.note-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.note-name { font-size: 13px; font-weight: 700; color: var(--espresso); flex: 1; }
.note-date { font-size: 9px; color: var(--latte); white-space: nowrap; }
.note-stars { display: flex; gap: 2px; margin-bottom: 6px; }
.star-mini { opacity: 0.2; color: var(--roast); }
.star-mini.star-on { opacity: 1; }
.note-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.chip.mini { font-size: 9px; padding: 2px 6px; min-height: auto; }
.note-text { font-size: 12px; color: var(--mocha); line-height: 1.5; }
.note-reorder { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: var(--ok); font-weight: 600; margin-top: 6px; }

/* ===== 桌面端：显式 grid-column 分配 + dense 填补 ===== */
@media (min-width: 1024px) {
  .page {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
    row-gap: 24px;
    align-items: stretch;
    grid-auto-flow: dense;
  }
  .profile-hero { grid-column: 1 / -1; }
  .reveal-group { display: contents; }
  .reveal-group > .section { margin-top: 0; }

  /* 显式列分配：仅 weekly/notes 通栏，intake/achv 改并排 */
  .sec-personality { grid-column: 1; grid-row: span 2; }
  .sec-impression  { grid-column: 2; }
  .sec-stats       { grid-column: 2; }
  .sec-today       { grid-column: 1; }
  .sec-tolerance   { grid-column: 2; }
  .sec-weekly      { grid-column: 1 / -1; }
  .sec-intake      { grid-column: 1; }
  .sec-achv        { grid-column: 2; }
  .sec-notes       { grid-column: 1 / -1; }
  .sec-health      { grid-column: 1 / -1; }

  /* achv-grid 4 列（单列内每个≈130px） */
  .achv-grid { grid-template-columns: repeat(4, 1fr); }

  /* 统一卡片高度感 */
  .dk-main-wrap .page .section { display: flex; flex-direction: column; }
  .dk-main-wrap .page .section > :last-child { flex: 1; }
  .dk-main-wrap .page .panel-pad { padding: 16px; }
}

/* ---- AI 画像 / 周报 / 耐受（新功能） ---- */
.imp-card { position: relative; }
.imp-stamp { position: absolute; top: 12px; right: 14px; }
.imp-eyebrow { font-size: 10px; letter-spacing: .14em; color: var(--muted); }
.imp-text { font-size: 15px; line-height: 1.8; color: var(--ink-black); margin: 8px 0 12px; }
.imp-kw-row { display: flex; flex-wrap: wrap; gap: 6px; }
.imp-kw { min-height: 28px; padding: 4px 10px; border-radius: var(--radius-sm); border: 1px solid var(--ink-black);
  color: var(--ink-black); font-size: 12px; background: var(--oat); }
.imp-foot { margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--ink-black); }

.doc-paper { background: #fffdf6; border: 1px solid var(--ink-black); }
.doc-header { text-align: center; border-bottom: 3px double var(--ink-black); padding-bottom: 10px; position: relative; }
.doc-seal { position: absolute; top: -4px; right: 0; }
.doc-title { font-size: 20px; color: var(--ink-black); letter-spacing: .2em; }
.doc-meta { font-size: 10px; color: var(--muted); margin-top: 4px; }
.doc-body { padding: 12px 0; }
.doc-summary { font-size: 14px; color: var(--ink-black); line-height: 1.7; }
.doc-highlights { margin: 10px 0; padding-left: 18px; }
.doc-highlights li { font-size: 13px; color: var(--ink-black); line-height: 1.7; list-style: "· "; }
.doc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.wr-tag { min-height: 28px; padding: 4px 10px; border-radius: var(--radius-sm); background: var(--ink-black);
  color: var(--oat); font-size: 12px; }
.doc-suggestion { margin-top: 10px; padding: 10px; background: var(--oat); border-left: 3px solid var(--orange); }
.doc-sug-label { font-size: 10px; color: var(--orange); }
.doc-suggestion p { font-size: 13px; color: var(--ink-black); margin-top: 4px; }
.doc-foot { margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--ink-black); }

.tol-meta { margin-top: 10px; font-size: 12px; color: var(--ink-black); }
.tol-tip { margin-top: 8px; font-size: 11px; color: var(--muted); line-height: 1.6; }
</style>
