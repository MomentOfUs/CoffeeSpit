<template>
  <!-- ===== 桌面端侧边栏（1024px+ 显示） ===== -->
  <aside class="dk-sidebar">
    <div class="dk-brand">
      <div class="dk-brand-logo">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <path d="M6 10h18v12a4 4 0 01-4 4H10a4 4 0 01-4-4V10z" fill="none" stroke="#D2702B" stroke-width="1.5"/>
          <path d="M24 13h3a3 3 0 010 6h-3" fill="none" stroke="#D2702B" stroke-width="1.5"/>
          <ellipse cx="15" cy="11" rx="8" ry="2" fill="#5C4A3A" opacity="0.3"/>
        </svg>
      </div>
      <div class="dk-brand-text">
        <div class="dk-brand-name">一杯大实话</div>
        <div class="dk-brand-sub mono">CoffeeSpit · 质检情报站</div>
      </div>
    </div>

    <nav class="dk-nav">
      <router-link v-for="(t, i) in tabs" :key="t.path" :to="t.path"
        class="dk-nav-item" :class="{ active: tab === i }">
        <Icon :name="t.icon" :size="18" class="dk-nav-ico" />
        <span class="dk-nav-label">{{ t.label }}</span>
        <span v-if="i === 0" class="dk-nav-badge">核心</span>
      </router-link>
    </nav>

    <div class="dk-sidebar-foot">
      <button class="dk-fab" @click="goScan">
        <Icon name="scan" :size="16" />
        <span>快速识破</span>
      </button>
      <div v-if="healthAlert" class="dk-health" :class="healthAlert.level">
        <Icon :name="healthAlert.icon || 'alert'" :size="12" />
        <span>{{ healthAlert.msg }}</span>
      </div>
      <div class="dk-version mono">v1.0 · 数据本地存储</div>
    </div>
  </aside>

  <!-- ===== 主内容区包裹 ===== -->
  <div class="dk-main-wrap">
    <!-- 桌面端顶栏 -->
    <header class="dk-topbar">
      <div class="dk-topbar-title">{{ pageTitle }}</div>
      <div class="dk-topbar-stats">
        <span class="dk-stat"><Icon name="cup" :size="12" /> 咖啡因 {{ today?.caffeineMg || 0 }}mg</span>
        <span class="dk-stat"><Icon name="gauge" :size="12" /> 糖 {{ today?.sugarG || 0 }}g</span>
        <span class="dk-stat"><Icon name="coins" :size="12" /> 省下 ¥{{ stats?.savedMoney || 0 }}</span>
      </div>
    </header>

    <!-- 移动端品牌条（桌面端 CSS 隐藏） -->
    <header class="brand-bar">
      <div class="brand-capsule">
        <span class="brand-seal" aria-label="一杯大实话">
          <svg viewBox="0 0 40 40" class="brand-cup-icon">
            <defs>
              <radialGradient id="brand-ceramic" cx="35%" cy="25%" r="75%">
                <stop offset="0%" stop-color="#FFFFFF"/>
                <stop offset="35%" stop-color="#FCFAF4"/>
                <stop offset="75%" stop-color="#E2D7C2"/>
                <stop offset="100%" stop-color="#C9B89E"/>
              </radialGradient>
              <radialGradient id="brand-crema" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stop-color="#5C4A3A"/>
                <stop offset="55%" stop-color="#3D2A1A"/>
                <stop offset="85%" stop-color="#2B1E14"/>
                <stop offset="100%" stop-color="#7A4A24"/>
              </radialGradient>
              <radialGradient id="brand-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(43,30,20,0.18)"/>
                <stop offset="100%" stop-color="rgba(43,30,20,0)"/>
              </radialGradient>
            </defs>
            <ellipse cx="20" cy="35" rx="13" ry="2" fill="url(#brand-shadow)"/>
            <line x1="34" y1="20" x2="40" y2="20" stroke="#9A6238" stroke-width="2.8" stroke-linecap="round"/>
            <line x1="34" y1="20" x2="38" y2="20" stroke="#B88A5E" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
            <circle cx="20" cy="20" r="14" fill="url(#brand-ceramic)" stroke="#7A4A24" stroke-width="0.8"/>
            <circle cx="20" cy="20" r="11" fill="url(#brand-crema)"/>
            <ellipse cx="16" cy="16" rx="4.5" ry="2.2" fill="rgba(255,255,255,0.18)" transform="rotate(-30 16 16)"/>
            <circle cx="20" cy="20" r="11" fill="none" stroke="rgba(43,30,20,0.35)" stroke-width="1"/>
            <text x="20.5" y="25" text-anchor="middle" font-family="var(--serif)" font-size="13" font-weight="800" fill="rgba(0,0,0,0.4)">咖</text>
            <text x="19.5" y="24" text-anchor="middle" font-family="var(--serif)" font-size="13" font-weight="800" fill="rgba(255,255,255,0.85)">咖</text>
            <path d="M9,16 Q14,9 20,9" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="brand-name">一杯大实话</span>
        <button class="brand-refresh iconbtn" @click="onRefresh" :disabled="refreshing">
          <Icon name="refresh" :size="16" />
        </button>
      </div>
    </header>

    <!-- 移动端健康预警条（桌面端 CSS 隐藏） -->
    <div v-if="healthAlert" class="health-alert" :class="healthAlert.level" @click="dismissAlert">
      <Icon :name="healthAlert.icon || 'alert'" :size="14" />
      <span>{{ healthAlert.msg }}</span>
      <Icon name="close" :size="12" class="ha-close" />
    </div>

    <!-- 路由内容 -->
    <div @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <router-view />
    </div>

    <!-- 移动端 FAB（桌面端 CSS 隐藏） -->
    <button v-if="tab !== 0" class="fab" @click="goScan" aria-label="快速识破">
      <Icon name="scan" :size="22" />
    </button>
  </div>

  <!-- 冷启动引导 -->
  <Onboarding @done="onOnboardingDone" />

  <!-- 移动端底栏（桌面端 CSS 隐藏） -->
  <nav class="bottomnav">
    <router-link v-for="(t, i) in tabs" :key="t.path" :to="t.path" class="nav-item" :class="{ active: tab === i }">
      <Icon :name="t.icon" :size="20" class="ico" />
      <span>{{ t.label }}</span>
    </router-link>
  </nav>

  <div class="toast-wrap">
    <div v-for="t in state.toasts" :key="t.id" class="toast" :class="t.type">{{ t.msg }}</div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "./stores/app.js";
import Icon from "./components/Icon.vue";
import Onboarding from "./components/Onboarding.vue";
import { useSwipe } from "./composables/useSwipe.js";

const route = useRoute();
const router = useRouter();
const { state, init, refreshProfile, refreshToday, toast, healthAlert, today, stats } = useStore();

const tabs = [
  { path: "/scan", label: "识破", icon: "scan" },
  { path: "/plaza", label: "避坑", icon: "plaza" },
  { path: "/radar", label: "良心", icon: "radar" },
  { path: "/profile", label: "我的", icon: "profile" }
];

const tab = computed(() => route.meta.tab ?? 0);

const pageTitle = computed(() => {
  const titles = {
    "/scan": "识破真相 · 质检报告",
    "/plaza": "避坑广场 · 真话社区",
    "/radar": "良心雷达 · 附近好店",
    "/profile": "我的 · 品鉴官档案"
  };
  return titles[route.path] || "一杯大实话";
});

const refreshing = ref(false);
async function onRefresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await Promise.all([refreshProfile(), refreshToday()]);
    toast("已刷新", "ok");
  } catch (e) { toast("刷新失败", "err"); }
  finally { refreshing.value = false; }
}

// 健康预警关闭
function dismissAlert() {
  state.healthAlert = null;
}

// FAB 快速扫描
function goScan() {
  router.push("/scan");
}

// 手势切页
const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe((dir) => {
  const order = ["/scan", "/plaza", "/radar", "/profile"];
  const idx = order.indexOf(route.path);
  if (dir === "left" && idx < order.length - 1) router.push(order[idx + 1]);
  if (dir === "right" && idx > 0) router.push(order[idx - 1]);
});

// Onboarding 完成
function onOnboardingDone() {
  toast("欢迎加入一杯大实话", "ok");
}

onMounted(() => { init(); });
</script>
