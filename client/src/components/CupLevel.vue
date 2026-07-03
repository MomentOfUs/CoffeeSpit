<template>
  <div class="cup-level" :class="{ over: isOver, [`size-${size}`]: true }">
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
      <path d="M34 20 Q42 20 42 28 Q42 36 34 36" fill="none" :stroke="cupStroke" stroke-width="1.5" opacity="0.5"/>
      <path d="M34 23 Q39 23 39 28 Q39 33 34 33" fill="none" :stroke="cupStroke" stroke-width="0.8" opacity="0.3"/>
      <!-- 杯身 -->
      <path d="M6 11 L8.5 49 Q8.5 51 10.5 51 L31.5 51 Q33.5 51 33.5 49 L36 11 Z" fill="rgba(252,250,244,0.6)" stroke="none"/>
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
      <path d="M6 11 L8.5 49 Q8.5 51 10.5 51 L31.5 51 Q33.5 51 33.5 49 L36 11" fill="none" :stroke="cupStroke" stroke-width="1.2" stroke-linejoin="round" opacity="0.4"/>
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
          :fill="cell.filled ? `url(#${gid}-cube)` : 'rgba(252,250,244,0.5)'"
          :stroke="cupStroke" :stroke-width="cell.filled ? '0.5' : '0.8'"
          :opacity="cell.filled ? 1 : 0.4"
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
      <line x1="4" y1="44" x2="44" y2="44" :stroke="cupStroke" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.3"/>
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
      <rect x="19" y="6" width="10" height="36" rx="5" fill="rgba(252,250,244,0.6)" :stroke="cupStroke" stroke-width="1" opacity="0.5"/>
      <!-- 球部 -->
      <circle cx="24" cy="46" r="7" fill="rgba(252,250,244,0.6)" :stroke="cupStroke" stroke-width="1" opacity="0.5"/>
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
  </div>
</template>

<script setup>
import { computed } from "vue";

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
    if (isOver.value) return "var(--danger)";
    const tones = {
      roast: "#D2702B", caramel: "#7A4A24", ok: "#5B7A3D", warn: "#C8841F",
      mocha: "#5C4A3A", gold: "#B8902E"
    };
    return tones[props.tone] || "#D2702B";
  });
const cupStroke = computed(() => liquidColor.value);
</script>

<style scoped>
.cup-level { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cup-svg { box-shadow: 0 2px 4px rgba(43,30,20,0.08); border-radius: 4px; }
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
</style>
