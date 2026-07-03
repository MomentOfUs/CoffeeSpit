<template>
  <div class="page" data-bg="良心">
    <!-- 1. 顶部标题区 -->
    <div class="section">
      <div class="h-eyebrow">良心雷达</div>
      <h1 class="h-title">附近<span class="accent">不卷滤镜</span>的店</h1>
      <p class="h-sub">只收录不堆特调、不加奶油顶、老老实实做基础款的实在咖啡店。坐标基于实地走访与社区提名，每周复核。</p>
    </div>

    <!-- 2. 地图 -->
    <div class="section">
      <div class="section-head">
        <h3>雷达扫描</h3>
        <span class="label"><span class="dot"></span>扫描到 {{ shops.length }} 家</span>
      </div>
      <div class="map-wrap">
        <div id="amap-container" class="amap-box"></div>
        <div class="map-sweep-overlay"></div>
      </div>
    </div>

    <!-- 3. 筛选条 -->
    <div class="section">
      <div class="section-head">
        <h3>筛选 / 排序</h3>
        <span class="label">筛选</span>
      </div>
      <div class="row-between">
        <span class="h-eyebrow">标签</span>
        <span class="h-eyebrow">排序</span>
      </div>
      <div class="row wrap gap-6 mt-8">
        <button
          v-for="t in shopTags"
          :key="t"
          class="chip"
          :class="{ active: t === tag }"
          @click="setTag(t)"
        >{{ t }}</button>
      </div>
      <div class="row wrap gap-6 mt-8">
        <button
          v-for="o in sortOptions"
          :key="o.v"
          class="chip"
          :class="{ active: o.v === sort }"
          @click="setSort(o.v)"
        >{{ o.label }}</button>
      </div>
    </div>

    <!-- 4. 店铺列表 -->
    <div class="section">
      <div class="section-head">
        <h3>良心店清单</h3>
        <span class="label">清单 · {{ shops.length }} · 收藏 {{ favCount }}</span>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>扫描中…</span>
      </div>

      <div v-else-if="!shops.length" class="empty">
        <Icon name="radar" :size="32" class="empty-ico" />
        <div>该筛选条件下暂无良心店</div>
      </div>

      <div class="reveal-group" v-else>
        <div
          v-for="(s, idx) in shops"
          :key="s.id"
          :ref="el => setCardRef(el, s.id)"
          class="shop-card paper-texture"
          :class="{ 'sc-active': s.id === activeId }"
          :style="{ '--i': idx }"
          :data-id="s.id"
          @click="openDrawer(s)"
        >
          <Stamp
            v-if="s.rating >= 4.8"
            text="良心店"
            tone="gold"
            shape="oval"
            :rotate="3"
            class="sc-stamp"
          />
          <div class="sc-head">
            <div>
              <div class="sc-name">{{ s.name }}</div>
              <div class="sc-district">{{ s.district }}</div>
            </div>
            <div class="row gap-6">
              <span class="sc-dist"><Icon name="pin" :size="10" /> {{ s.dist }}</span>
              <button
                class="fav-btn"
                :class="{ on: s.fav }"
                :style="s.fav ? { animation: 'heartPop 0.3s ease' } : null"
                :title="s.fav ? '取消收藏' : '收藏'"
                @click.stop="toggleFav(s)"
              >
                <Icon name="star" :size="16" :solid="s.fav" />
              </button>
            </div>
          </div>
          <div class="sc-desc">{{ s.desc }}</div>
          <div class="row wrap gap-6 mt-8">
            <span v-for="t in s.tags" :key="t" class="chip soft">{{ t }}</span>
            <span v-if="s.fav" class="badge b-gold">已收藏</span>
          </div>
          <div class="sc-foot">
            <span class="sc-price">美式 ¥{{ s.price }} 起</span>
            <span class="sc-rating">
              <Icon name="star" :size="10" :solid="true" />
              {{ s.rating }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. 详情抽屉 -->
    <div v-if="drawerShop" class="drawer-mask" @click="closeDrawer"></div>
    <div v-if="drawerShop" class="drawer">
      <div class="drawer-pad">
        <div class="row-between">
          <div>
            <div class="h-eyebrow">店铺 · {{ drawerShop.id }}</div>
            <h2 class="d-name">{{ drawerShop.name }}</h2>
            <div class="sc-district">{{ drawerShop.district }} · {{ drawerShop.dist }}</div>
          </div>
          <button class="iconbtn d-close" title="关闭" @click="closeDrawer">
            <Icon name="close" :size="16" />
          </button>
        </div>

        <div class="sc-desc mt-12">{{ drawerShop.desc }}</div>

        <div class="row wrap gap-6 mt-8">
          <span v-for="t in drawerShop.tags" :key="t" class="chip soft">{{ t }}</span>
          <span class="badge b-accent">
            <Icon name="star" :size="10" :solid="true" /> {{ drawerShop.rating }}
          </span>
          <span v-if="drawerShop.fav" class="badge b-gold">已收藏</span>
        </div>

        <div class="d-block mt-12">
          <div class="d-label"><Icon name="cup" :size="12" /> 招牌</div>
          <div class="d-sig">{{ drawerShop.signature }}</div>
        </div>

        <div class="d-block mt-12">
          <div class="d-label">为什么推荐</div>
          <div class="d-why">{{ drawerShop.why }}</div>
        </div>

        <div class="d-block mt-12">
          <div class="d-label">菜单</div>
          <div class="menu-list">
            <div class="menu-row" v-for="(item, i) in drawerShop.menu" :key="i">
              <span class="m-dot"></span>
              <span class="m-name">{{ item[0] }}</span>
              <span class="m-price">{{ item[1] }}</span>
            </div>
          </div>
        </div>

        <div class="grid-2 mt-12">
          <button
            class="btn btn-block"
            :class="{ 'btn-accent': drawerShop.fav }"
            @click="toggleFav(drawerShop)"
          >
            <Icon name="star" :size="14" :solid="drawerShop.fav" />
            {{ drawerShop.fav ? '已收藏' : '收藏' }}
          </button>
          <button class="btn btn-primary btn-block" @click="navToast">
            <Icon name="location" :size="14" />
            导航
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { api } from "../api/index.js";
import { useStore } from "../stores/app.js";
import Icon from "../components/Icon.vue";
import Stamp from "../components/Stamp.vue";

const { meta: storeMeta, toast } = useStore();

// 筛选选项
const shopTags = ref(["全部"]);
const sortOptions = [
  { v: "dist", label: "距离" },
  { v: "price", label: "价格" },
  { v: "rating", label: "评分" }
];

// 状态
const tag = ref("全部");
const sort = ref("dist");
const shops = ref([]);
const loading = ref(false);
const activeId = ref(null);
const drawerShop = ref(null);

// 卡片 DOM 引用（用于地图 pin 点击后滚动定位）
const cardRefs = {};
function setCardRef(el, id) {
  if (el) cardRefs[id] = el;
  else delete cardRefs[id];
}

const favCount = computed(() => shops.value.filter(s => s.fav).length);

// 拉取店铺列表
async function loadShops() {
  loading.value = true;
  try {
    const params = {};
    if (tag.value && tag.value !== "全部") params.tag = tag.value;
    if (sort.value) params.sort = sort.value;
    shops.value = await api.shops(params);
  } catch (e) {
    toast("店铺加载失败", "err");
    shops.value = [];
  } finally {
    loading.value = false;
  }
}

function setTag(t) {
  tag.value = t;
}
function setSort(v) {
  sort.value = v;
}

// 点击地图 pin：选中并滚动到对应卡片
function selectFromMap(id) {
  activeId.value = id;
  nextTick(() => {
    const el = cardRefs[id];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

// 打开 / 关闭详情抽屉
function openDrawer(s) {
  activeId.value = s.id;
  drawerShop.value = s;
}
function closeDrawer() {
  drawerShop.value = null;
}

// 收藏切换（乐观更新）
async function toggleFav(s) {
  if (!s) return;
  const prev = !!s.fav;
  s.fav = !prev;
  try {
    const r = await api.favShop(s.id);
    s.fav = !!r.fav;
    toast(
      s.fav ? `已收藏「${s.name}」` : `已取消收藏「${s.name}」`,
      s.fav ? "ok" : ""
    );
  } catch (e) {
    s.fav = prev;
    toast("收藏操作失败", "err");
  }
}

// 导航占位
function navToast() {
  toast("导航功能开发中");
}

// ---- 高德地图 ----
let map = null;
let markers = [];
let mapRetry = 0;

function initMap() {
  if (typeof AMap === "undefined") {
    // AMap 脚本可能仍在加载，稍后重试
    if (mapRetry++ < 30) setTimeout(initMap, 300);
    return;
  }
  map = new AMap.Map("amap-container", {
    zoom: 12,
    center: [121.4500, 31.2250], // 上海中心
    mapStyle: "amap://styles/whitesmoke" // 暖色主题用浅色底图
  });
  drawMarkers();
}

function drawMarkers() {
  if (!map || typeof AMap === "undefined") return;
  // 清除旧标记
  markers.forEach(m => map.remove(m));
  markers = [];
  shops.value.forEach(shop => {
    if (shop.lng == null || shop.lat == null) return;
    const marker = new AMap.Marker({
      position: [shop.lng, shop.lat],
      content: `<div class="map-marker-pin${shop.id === activeId.value ? " active" : ""}"><div class="pin-cup">☕</div><div class="pin-price">¥${shop.price}</div></div>`,
      offset: new AMap.Pixel(-20, -30)
    });
    marker.on("click", () => {
      openDrawer(shop);
    });
    map.add(marker);
    markers.push(marker);
  });
}

onMounted(async () => {
  // 标签来自 api.meta().shopTags（优先复用 store 缓存）
  try {
    const m = storeMeta.value || (await api.meta());
    if (m && m.shopTags && m.shopTags.length) {
      shopTags.value = m.shopTags;
    }
  } catch (e) {
    /* 保留默认标签 */
  }
  await loadShops();
  initMap();
});

// 筛选 / 排序变化时重新拉取
watch([tag, sort], () => {
  loadShops();
});

// 店铺数据变化时重绘地图标记
watch(shops, () => {
  drawMarkers();
});

// 选中状态变化时更新标记高亮
watch(activeId, () => {
  drawMarkers();
});
</script>

<style scoped>
/* ---- 高德地图容器 ---- */
.map-wrap { position: relative; }
.amap-box { width: 100%; height: 320px; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-soft); position: relative; }
/* 修复高德 logo/copyright 悬浮在弹窗上的问题 */
.amap-box :deep(.amap-logo) { z-index: 1 !important; }
.amap-box :deep(.amap-copyright) { z-index: 1 !important; }

/* ---- 地图扫描扇形覆盖层 ---- */
.map-sweep-overlay { position: absolute; top: 0; left: 0; right: 0; height: 320px; pointer-events: none; border-radius: var(--radius); overflow: hidden; z-index: 5; }
.map-sweep-overlay::before { content: ""; position: absolute; top: 50%; left: 50%; width: 200%; height: 200%; transform: translate(-50%, -50%); background: conic-gradient(from 0deg, transparent 0deg, rgba(210,112,43,0.1) 30deg, transparent 60deg); animation: sweep 4s linear infinite; }

/* ---- 地图标记（AMap 动态创建，需用 :deep 穿透 scoped 样式） ---- */
.map-wrap :deep(.map-marker-pin) { background: linear-gradient(180deg, #FCFAF4, #F5EFE3); border: 1.5px solid var(--caramel); border-radius: var(--radius) var(--radius) var(--radius) 0; padding: 4px 8px; box-shadow: 0 2px 6px rgba(43,30,20,0.15); display: flex; flex-direction: column; align-items: center; gap: 2px; }
.map-wrap :deep(.map-marker-pin.active) { border-color: var(--roast); background: linear-gradient(180deg, #FFF, #FFF5E6); box-shadow: 0 0 0 2px var(--roast), 0 4px 12px rgba(210,112,43,0.3); }
.map-wrap :deep(.pin-cup) { font-size: 14px; line-height: 1; }
.map-wrap :deep(.pin-price) { font-size: 10px; font-weight: 800; color: var(--caramel); font-family: var(--mono); }

/* ---- 中文标签改用正文字体（等宽仅留给数字 / 数据值） ---- */
.h-eyebrow { font-family: var(--font); }
.section-head .label { font-family: var(--font); }

/* ---- 店铺卡 ---- */
.shop-card {
  position: relative;
}
.shop-card.sc-active {
  border-color: var(--roast);
  box-shadow: 3px 3px 0 var(--roast);
}

/* 良心店印章 */
.sc-stamp {
  position: absolute;
  top: -10px;
  right: 12px;
  z-index: 3;
}

/* 距离 / 评分行内图标对齐 */
.sc-dist {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.sc-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--roast);
}

/* 收藏按钮 */
.fav-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--foam-2);
  background: var(--cream);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--latte);
  transition: all .2s ease;
  flex-shrink: 0;
}
.fav-btn:hover {
  background: var(--foam);
  color: var(--caramel);
}
.fav-btn.on {
  background: var(--gold);
  color: var(--cream);
  border-color: var(--gold);
}

/* 空状态图标 */
.empty-ico {
  display: block;
  margin: 0 auto 8px;
  color: var(--latte);
}

/* ---- 抽屉内容 ---- */
.drawer-pad {
  padding: 16px 18px 22px;
}
.d-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin-top: 4px;
}
.d-close {
  flex-shrink: 0;
}
.d-block {
  margin-top: 4px;
}
.d-label {
  font-family: var(--font);
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--latte);
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.d-sig {
  font-family: var(--serif);
  font-size: 15px;
  font-weight: 700;
  padding: 8px 10px;
  background: var(--foam);
  border-left: 3px solid var(--roast);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.d-why {
  font-size: 13px;
  line-height: 1.7;
  color: var(--mocha);
}

/* 菜单列表 */
.menu-list {
  border: 1px solid var(--foam-2);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--cream);
}
.menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--rule-soft);
}
.menu-row:last-child {
  border-bottom: none;
}
.m-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--roast);
  flex-shrink: 0;
}
.m-name {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
}
.m-price {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 800;
  color: var(--caramel);
}
</style>
