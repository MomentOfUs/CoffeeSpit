<template>
  <div class="cup-level" :class="{ over: isOver, [`size-${size}`]: true }" @click="toggleTip">
    <!-- 咖啡因：咖啡杯造型（带杯耳） -->
    <svg v-if="variant === 'caffeine'" viewBox="0 0 48 56" class="cup-svg">
      <defs>
        <radialGradient :id="gid + '-body'" cx="35%" cy="20%" r="80%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.5)"/>
          <stop offset="40%" stop-color="rgba(252,250,244,0.15)"/>
          <stop offset="100%" stop-color="rgba(43,30,20,0.18)"/>
        </radialGradient>
        <radialGradient :id="gid + '-inner'" cx="50%" cy="15%" r="70%">
          <stop offset="0%" stop-color="rgba(43,30,20,0.35)"/>
          <stop offset="60%" stop-color="rgba(43,30,20,0.12)"/>
          <stop offset="100%" stop-color="rgba(43,30,20,0.05)"/>
        </radialGradient>
        <linearGradient :id="gid + '-liquid'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="liquidColor" stop-opacity="0.85"/>
          <stop offset="100%" :stop-color="liquidColor" stop-opacity="1"/>
        </linearGradient>
        <radialGradient :id="gid + '-shadow'" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(43,30,20,0.2)"/>
          <stop offset="100%" stop-color="rgba(43,30,20,0)"/>
        </radialGradient>
      </defs>
      <ellipse cx="22" cy="52" rx="14" ry="2.5" :fill="`url(#${gid}-shadow)`"/>
      <!-- 杯耳 -->
      <path d="M34 20 Q42 20 42 28 Q42 36 34 36" fill="none" :stroke="cupStroke" stroke-width="1.5" opacity="0.9"/>
      <path d="M34 23 Q39 23 39 28 Q39 33 34 33" fill="none" :stroke="cupStroke" stroke-width="0.8" opacity="0.7"/>
      <!-- 杯身 -->
      <path d="M6 11 L8.5 49 Q8.5 51 10.5 51 L31.5 51 Q33.5 51 33.5 49 L36 11 Z" :fill="cupFill" stroke="none"/>
      <clipPath :id="gid + '-clip'">
        <path d="M7.5 12 L9.5 48.5 Q9.5 49.5 10.5 49.5 L31.5 49.5 Q32.5 49.5 32.5 48.5 L34.5 12 Z"/>
      </clipPath>
      <g :clip-path="`url(#${gid}-clip)`">
        <rect x="5" :y="liquidY" width="34" :height="52 - liquidY" :fill="`url(#${gid}-liquid)`" class="liquid"/>
        <ellipse cx="22" :cy="liquidY + 1" rx="13" ry="1.8" fill="rgba(255,255,255,0.25)" v-if="!isOver"/>
        <g v-if="isOver"><path d="M4 9 Q12 6 22 9 T40 9 L40 13 L4 13 Z" :fill="liquidColor" opacity="0.4" class="overflow-wave"/></g>
      </g>
      <ellipse cx="21" cy="11" rx="15" ry="3.2" :fill="`url(#${gid}-inner)`" stroke="none"/>
      <ellipse cx="21" cy="10.5" rx="15" ry="3.2" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/>
      <ellipse cx="16" cy="10" rx="4" ry="1" fill="rgba(255,255,255,0.4)" stroke="none"/>
      <path d="M6 11 L8.5 49 Q8.5 51 10.5 51 L31.5 51 Q33.5 51 33.5 49 L36 11" fill="none" :stroke="cupStroke" stroke-width="1.2" stroke-linejoin="round" opacity="0.95"/>
      <path d="M6 11 L8.5 49 Q8.5 51 10.5 51 L31.5 51 Q33.5 51 33.5 49 L36 11 Z" :fill="`url(#${gid}-body)`" stroke="none" pointer-events="none"/>
      <line x1="35" y1="11" x2="38" y2="11" :stroke="cupStroke" stroke-width="0.8" opacity="0.4"/>
      <text x="39" y="13" font-family="var(--font)" font-size="3.5" :fill="cupStroke" opacity="0.55">上限</text>
    </svg>

    <!-- 糖：方糖块造型（3×3 网格） -->
    <svg v-else-if="variant === 'sugar'" viewBox="0 0 48 56" class="cup-svg">
      <defs>
        <linearGradient :id="gid + '-cube'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="liquidColor" stop-opacity="0.9"/>
          <stop offset="100%" :stop-color="liquidColor" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <!-- 方糖块 3×3 网格，已摄入的填充颜色 -->
      <g v-for="(cell, i) in sugarCells" :key="i">
        <rect
          :x="6 + (i % 3) * 12" :y="8 + Math.floor(i / 3) * 12"
          width="10" height="10" rx="1.5"
          :fill="cell.filled ? `url(#${gid}-cube)` : cupFill"
          :stroke="cupStroke" :stroke-width="cell.filled ? '0.5' : '0.9'"
          :opacity="cell.filled ? 1 : 0.95"
          class="sugar-cell"
          :style="{ '--i': i }"
        />
        <!-- 方糖高光 -->
        <rect v-if="cell.filled"
          :x="7 + (i % 3) * 12" :y="9 + Math.floor(i / 3) * 12"
          width="4" height="3" rx="0.5"
          fill="rgba(255,255,255,0.3)"
        />
      </g>
      <!-- 上限标记线 -->
      <line x1="4" y1="44" x2="44" y2="44" :stroke="cupStroke" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>
      <text x="36" y="48" font-family="var(--font)" font-size="3.5" :fill="cupStroke" opacity="0.55">上限</text>
    </svg>

    <!-- 热量：温度计造型 -->
    <svg v-else-if="variant === 'calories'" viewBox="0 0 48 56" class="cup-svg">
      <defs>
        <linearGradient :id="gid + '-thermo'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="liquidColor" stop-opacity="0.9"/>
          <stop offset="100%" :stop-color="liquidColor" stop-opacity="1"/>
        </linearGradient>
        <radialGradient :id="gid + '-bulb'" cx="40%" cy="35%" r="60%">
          <stop offset="0%" :stop-color="liquidColor" stop-opacity="1"/>
          <stop offset="100%" :stop-color="liquidColor" stop-opacity="0.8"/>
        </radialGradient>
      </defs>
      <!-- 温度计外管 -->
      <rect x="19" y="6" width="10" height="36" rx="5" :fill="cupFill" :stroke="cupStroke" stroke-width="1" opacity="0.95"/>
      <!-- 球部 -->
      <circle cx="24" cy="46" r="7" :fill="cupFill" :stroke="cupStroke" stroke-width="1" opacity="0.95"/>
      <!-- 液柱（从底部往上填） -->
      <circle cx="24" cy="46" r="5.5" :fill="`url(#${gid}-bulb)`" class="liquid"/>
      <rect x="21" :y="thermoY" width="6" :height="42 - thermoY" :fill="`url(#${gid}-thermo)`" class="liquid"/>
      <!-- 超标溢出 -->
      <circle v-if="isOver" cx="24" cy="6" r="2" :fill="liquidColor" opacity="0.5" class="overflow-wave"/>
      <!-- 刻度线 -->
      <line x1="30" y1="12" x2="34" y2="12" :stroke="cupStroke" stroke-width="0.6" opacity="0.4"/>
      <line x1="30" y1="22" x2="33" y2="22" :stroke="cupStroke" stroke-width="0.5" opacity="0.3"/>
      <line x1="30" y1="32" x2="33" y2="32" :stroke="cupStroke" stroke-width="0.5" opacity="0.3"/>
      <line x1="30" y1="42" x2="34" y2="42" :stroke="cupStroke" stroke-width="0.6" opacity="0.4"/>
      <text x="35" y="14" font-family="var(--font)" font-size="3.5" :fill="cupStroke" opacity="0.55">上限</text>
      <!-- 高光 -->
      <rect x="21" y="8" width="2" height="30" rx="1" fill="rgba(255,255,255,0.3)"/>
    </svg>

    <div class="cup-label">
      <div class="cup-k">{{ label }}</div>
      <div class="cup-v">{{ value }}<small>{{ unit }}</small></div>
      <div class="cup-lim">/ {{ limit }}{{ unit }}</div>
    </div>

    <div v-if="showTip" class="cup-tip" @click.stop>
      <div class="cup-tip-header">
        <span class="cup-tip-dot" :style="{ background: liquidColor }"></span>
        <span class="cup-tip-title">{{ tipMeta.title }}</span>
      </div>
      <div class="cup-tip-body">
        <div v-for="(item, i) in tipMeta.items" :key="i" class="cup-tip-item">
          <span class="cup-tip-bullet"></span>
          <span>{{ item }}</span>
        </div>
      </div>
      <div class="cup-tip-footer">{{ tipMeta.footer }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  value: { type: Number, default: 0 },
  limit: { type: Number, required: true },
  label: { type: String, default: "" },
  unit: { type: String, default: "" },
  tone: { type: String, default: "roast" },
  variant: { type: String, default: "caffeine" }, // caffeine / sugar / calories
  size: { type: String, default: "md" } // sm / md
});

const gid = `cl${Math.random().toString(36).slice(2, 7)}`;

const isOver = computed(() => props.value > props.limit);
const ratio = computed(() => Math.min(1, props.value / props.limit));

// 咖啡杯液面高度
const liquidY = computed(() => 49 - (49 - 12) * ratio.value);

// 温度计液柱高度（管底 y=42, 管顶 y=8）
const thermoY = computed(() => 42 - (42 - 8) * ratio.value);

// 方糖块 3×3 网格
const sugarCells = computed(() => {
  const cells = [];
  const total = 9;
  const filledCount = Math.round(ratio.value * total);
  for (let i = 0; i < total; i++) {
    cells.push({ filled: i < filledCount });
  }
  return cells;
});

const liquidColor = computed(() => {
    const tones = {
      roast: "#D2702B",   /* 烘焙橙，高饱和醒目 */
      caramel: "#7A4A24", ok: "#5B7A3D", warn: "#C8841F",
      mocha: "#7A5E48",   /* 中度暖棕，较原色提升明度 */
      gold: "#C9A435"     /* 明黄金，与 roast 拉开差距 */
    };
    const darkTones = {
      roast: "#B85A1A",   /* 超标深橙 */
      mocha: "#5C4A3A",   /* 超标深棕 */
      gold: "#A08020"     /* 超标深金 */
    };
    if (isOver.value) return darkTones[props.tone] || "#B85A1A";
    return tones[props.tone] || "#D2702B";
  });
const cupStroke = computed(() => liquidColor.value);

// 容器背景色：带 tone 色调的浅色，空杯/超标时也能区分三种指标
const cupFill = computed(() => {
  const hex = liquidColor.value;
  if (hex.startsWith("#")) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.18)`;
  }
  return "rgba(210,112,43,0.18)";
});

// ---- 营养指南弹窗 ----
const showTip = ref(false);
function toggleTip() { showTip.value = !showTip.value; }

function onDocClick(e) {
  if (!e.target.closest('.cup-level')) showTip.value = false;
}
onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));

const tipMeta = computed(() => {
  const map = {
    caffeine: {
      title: "咖啡因摄入指南",
      items: [
        "健康成人每日建议上限：≤ 400 mg（约 2-3 杯美式）",
        "孕妇 / 哺乳期：≤ 200 mg，过量可能影响胎儿发育",
        "咖啡因敏感人群（焦虑/失眠/心悸）：建议 ≤ 100 mg",
        "体内半衰期约 3-5 小时，下午 2 点后摄入易影响睡眠",
        "长期过量（> 600 mg/天）可能导致依赖、胃肠刺激、血压波动"
      ],
      footer: "数据来源：FDA、EFSA 膳食指南"
    },
    sugar: {
      title: "添加糖摄入指南",
      items: [
        "WHO 强烈建议：每日添加糖 ≤ 25 g（约 6 茶匙）",
        "《中国居民膳食指南》：每日添加糖 ≤ 50 g，最好 ≤ 25 g",
        "1 块标准方糖 ≈ 4 g；1 泵糖浆 ≈ 5-7 g",
        "过量添加糖与肥胖、2 型糖尿病、龋齿、皮肤糖化正相关",
        "果葡糖浆升糖指数高，代谢负担大于蔗糖"
      ],
      footer: "数据来源：WHO、中国营养学会"
    },
    calories: {
      title: "热量摄入指南",
      items: [
        "成年女性日均建议：1800 kcal；成年男性：2250 kcal",
        "减脂期建议：女性 1200-1500 kcal，男性 1500-1800 kcal",
        "一杯拿铁（中杯）约 150-190 kcal；摩卡可达 300-400 kcal",
        "选择脱脂奶可减少 50-80 kcal；去奶油顶可减少 80-120 kcal",
        "基础代谢率（BMR）占总消耗的 60-75%，因年龄/体重/肌肉量差异大"
      ],
      footer: "数据来源：《中国居民膳食营养素参考摄入量》"
    }
  };
  return map[props.variant] || map.caffeine;
});
</script>

<style scoped>
.cup-level { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cup-svg { box-shadow: 0 2px 4px rgba(43,30,20,0.08); border-radius: var(--radius-xs); }
.size-md .cup-svg { width: 44px; height: 56px; }
.size-sm .cup-svg { width: 32px; height: 40px; }

.cup-label { text-align: center; }
.cup-k { font-size: 8px; letter-spacing: 0.1em; color: var(--latte); font-weight: 600; }
.size-sm .cup-k { font-size: 7px; }
.cup-v { font-size: 14px; font-weight: 800; color: var(--espresso); font-family: var(--mono); }
.size-sm .cup-v { font-size: 11px; }
.cup-v small { font-size: 8px; color: var(--latte); font-weight: 500; }
.size-sm .cup-v small { font-size: 7px; }
.cup-lim { font-size: 7px; color: var(--latte); font-family: var(--mono); }
.size-sm .cup-lim { font-size: 6px; }
.cup-level.over .cup-v { color: var(--danger); }
.cup-level.over .cup-k { color: var(--danger); }

.liquid { animation: liquidFill 0.8s cubic-bezier(.2,.8,.2,1) both; }
@keyframes liquidFill { from { transform: translateY(20px); opacity: 0; } to { opacity: 1; } }

.sugar-cell { animation: sugarPop 0.4s ease both; }
@keyframes sugarPop { from { transform: scale(0.5); opacity: 0; } to { opacity: 1; } }

.overflow-wave { animation: overflowWave 1.5s ease-in-out infinite; }
@keyframes overflowWave { 0%,100% { transform: translateY(0); } 50% { transform: translateY(1.5px); } }

/* ---- 营养指南弹窗 ---- */
.cup-level { position: relative; cursor: pointer; }

.cup-tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 220px;
  min-width: 160px;
  background: var(--oat-white);
  border: 1px solid var(--foam-2);
  border-radius: var(--radius-xs);
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(43,30,20,0.08);
  z-index: 20;
  text-align: left;
  animation: tipIn 0.2s ease both;
}
@keyframes tipIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.cup-tip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--foam-2);
}
.cup-tip-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cup-tip-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--caramel);
  letter-spacing: 0.04em;
}

.cup-tip-body { display: flex; flex-direction: column; gap: 5px; }
.cup-tip-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 10.5px;
  color: var(--espresso);
  line-height: 1.6;
}
.cup-tip-bullet {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--latte);
  margin-top: 5px;
  flex-shrink: 0;
}

.cup-tip-footer {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--foam-2);
  font-size: 9px;
  color: var(--latte);
  text-align: right;
}
</style>
