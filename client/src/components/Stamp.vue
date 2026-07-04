<template>
  <span class="stamp" :class="[`tone-${tone}`, `shape-${shape}`]" :style="{ '--rot': rotate + 'deg', transform: `rotate(${rotate}deg)` }">
    <span class="stamp-text"><slot>{{ text }}</slot></span>
    <span class="stamp-noise"></span>
  </span>
</template>

<script setup>
defineProps({
  text: { type: String, default: "" },
  tone: { type: String, default: "roast" },
  rotate: { type: Number, default: -3 },
  shape: { type: String, default: "rect" }
});
</script>

<style scoped>
.stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 14px;
  border: 1.5px solid currentColor;
  border-radius: var(--radius-sm);
  position: relative;
  animation: stampPress 0.4s cubic-bezier(.2,1.4,.4,1) both;
  font-family: var(--serif);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

/* 蜡封材质：径向渐变模拟光照 + 多层 inset 阴影 */
.stamp.shape-circle {
  border-radius: 48% 52% 51% 49% / 50% 48% 52% 50%;
  padding: 10px 8px;
  min-width: 48px; min-height: 48px;
  text-align: center;
}
.stamp.shape-oval {
  border-radius: 999px;
}

/* 噪点纹理叠层（模拟蜡面不均匀） */
.stamp-noise {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 25%, transparent 20%, rgba(0,0,0,0.05) 50%, transparent 70%),
    radial-gradient(circle at 75% 70%, transparent 30%, rgba(0,0,0,0.04) 60%, transparent 80%),
    radial-gradient(circle at 50% 50%, transparent 40%, rgba(255,255,255,0.03) 80%);
  mix-blend-mode: multiply;
}

.stamp-text {
  position: relative;
  z-index: 1;
  text-shadow: 0.5px 0.5px 0 rgba(255,255,255,0.15), -0.5px -0.5px 0.5px rgba(0,0,0,0.2);
}

/* 色调 - 每种色调有蜡面渐变背景 + 浮雕阴影 */
.tone-danger {
  color: #fff;
  background: radial-gradient(circle at 35% 28%, #C84036 0%, #A02820 55%, #7A1A14 100%);
  border-color: #7A1A14;
  box-shadow:
    0 3px 6px rgba(43,30,20,0.25),
    inset 1.5px 1.5px 3px rgba(255,255,255,0.2),
    inset -2px -2px 4px rgba(0,0,0,0.3);
}
.tone-roast {
  color: #fff;
  background: radial-gradient(circle at 35% 28%, #E07B35 0%, #C46420 55%, #9A4810 100%);
  border-color: #9A4810;
  box-shadow:
    0 3px 6px rgba(43,30,20,0.22),
    inset 1.5px 1.5px 3px rgba(255,255,255,0.22),
    inset -2px -2px 4px rgba(0,0,0,0.25);
}
.tone-warn {
  color: #fff;
  background: radial-gradient(circle at 35% 28%, #D89628 0%, #B87818 55%, #8A5808 100%);
  border-color: #8A5808;
  box-shadow:
    0 3px 6px rgba(43,30,20,0.2),
    inset 1.5px 1.5px 3px rgba(255,255,255,0.2),
    inset -2px -2px 4px rgba(0,0,0,0.22);
}
.tone-ok {
  color: #fff;
  background: radial-gradient(circle at 35% 28%, #6B9048 0%, #4E7A30 55%, #345820 100%);
  border-color: #345820;
  box-shadow:
    0 3px 6px rgba(43,30,20,0.2),
    inset 1.5px 1.5px 3px rgba(255,255,255,0.2),
    inset -2px -2px 4px rgba(0,0,0,0.22);
}
.tone-gold {
  color: #fff;
  background: radial-gradient(circle at 35% 28%, #D4A838 0%, #B8902E 55%, #8A6810 100%);
  border-color: #8A6810;
  box-shadow:
    0 3px 6px rgba(43,30,20,0.22),
    inset 1.5px 1.5px 3px rgba(255,255,255,0.25),
    inset -2px -2px 4px rgba(0,0,0,0.2);
}
.tone-caramel {
  color: #fff;
  background: radial-gradient(circle at 35% 28%, #9A6238 0%, #7A4A24 55%, #5A3014 100%);
  border-color: #5A3014;
  box-shadow:
    0 3px 6px rgba(43,30,20,0.22),
    inset 1.5px 1.5px 3px rgba(255,255,255,0.18),
    inset -2px -2px 4px rgba(0,0,0,0.28);
}

/* 矩形印章用半透明底 + 深色字 */
.stamp.shape-rect.tone-danger { color: var(--danger); background: rgba(178,58,46,0.08); box-shadow: 0 2px 4px rgba(178,58,46,0.1); }
.stamp.shape-rect.tone-roast { color: var(--roast); background: rgba(210,112,43,0.08); box-shadow: 0 2px 4px rgba(210,112,43,0.1); }
.stamp.shape-rect.tone-warn { color: var(--warn); background: rgba(200,132,31,0.08); }
.stamp.shape-rect.tone-ok { color: var(--ok); background: rgba(91,122,61,0.08); }
.stamp.shape-rect.tone-gold { color: var(--gold); background: rgba(184,144,46,0.08); }
.stamp.shape-rect.tone-caramel { color: var(--caramel); background: rgba(122,74,36,0.08); }
.stamp.shape-rect { border-width: 2px; border-style: solid; }
.stamp.shape-rect .stamp-text { text-shadow: 0.5px 0.5px 0 rgba(255,255,255,0.3); }
</style>
