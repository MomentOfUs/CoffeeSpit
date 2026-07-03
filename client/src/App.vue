<template>
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
          <path d="M31,13 Q47,20 31,27" fill="none" stroke="#9A6238" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M31,16 Q35,20 31,24" fill="none" stroke="#7A4A24" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
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

  <router-view />

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
import { useRoute } from "vue-router";
import { useStore } from "./stores/app.js";
import Icon from "./components/Icon.vue";

const route = useRoute();
const { state, init, refreshProfile, refreshToday, toast } = useStore();

const tabs = [
  { path: "/scan", label: "识破", icon: "scan" },
  { path: "/plaza", label: "避坑", icon: "plaza" },
  { path: "/radar", label: "良心", icon: "radar" },
  { path: "/profile", label: "我的", icon: "profile" }
];

const tab = computed(() => route.meta.tab ?? 0);

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

onMounted(() => { init(); });
</script>
