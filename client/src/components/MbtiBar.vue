<template>
  <div class="mbti-bar">
    <span class="pole" :class="{ on: dim.letter === dim.left }">{{ dim.left }}</span>
    <div class="track-wrap">
      <div class="track">
        <span class="mid-line"></span>
        <i class="fill" :style="{ width: dim.pct + '%' }"></i>
        <span class="thumb" :style="{ left: dim.pct + '%' }"></span>
      </div>
      <div class="labels">
        <span class="lbl">{{ dim.leftLabel }}</span>
        <span class="lbl">{{ dim.rightLabel }}</span>
      </div>
    </div>
    <span class="pole" :class="{ on: dim.letter === dim.right }">{{ dim.right }}</span>
  </div>
</template>

<script setup>
defineProps({
  dim: { type: Object, required: true }
});
</script>

<style scoped>
.mbti-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 字母胶囊 — 证件锐利感 */
.pole {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs, 2px);
  background: var(--foam, #EDE6D6);
  color: var(--latte, #9A7B5A);
  font-family: var(--mono, monospace);
  font-size: 12px;
  font-weight: 800;
  border: 1px solid rgba(43, 30, 20, 0.1);
  box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.4), inset -1px -1px 2px rgba(43, 30, 20, 0.06);
  transition: all 0.3s;
}

.pole.on {
  background: var(--roast, #D2702B);
  color: #fff;
  border-color: var(--roast, #D2702B);
  box-shadow: 0 2px 4px rgba(210, 112, 43, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.2);
}

/* 轨道区域 */
.track-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.track {
  position: relative;
  height: 8px;
  background: rgba(43, 30, 20, 0.08);
  border-radius: 999px;
  overflow: visible;
}

/* 中线刻度 */
.mid-line {
  position: absolute;
  left: 50%;
  top: -2px;
  bottom: -2px;
  width: 1px;
  background: rgba(43, 30, 20, 0.18);
  transform: translateX(-0.5px);
}

/* 填充条 — 从左到右，宽度 = 右侧字母百分比 */
.fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--roast, #D2702B);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(210, 112, 43, 0.25);
}

/* 滑块指示器 */
.thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--espresso, #2B1E14);
  border: 2px solid var(--oat, #F6F1E7);
  transform: translate(-50%, -50%);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(43, 30, 20, 0.25);
}

/* 标签 */
.labels {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.lbl {
  font-size: 9px;
  color: var(--latte, #9A7B5A);
  line-height: 1.2;
  white-space: nowrap;
}

.labels .lbl:last-child {
  text-align: right;
}
</style>
