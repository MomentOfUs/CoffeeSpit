import { ref, watch, onUnmounted } from "vue";

/**
 * 数字滚动 composable
 * @param {import('vue').Ref<number>|number} target - 目标值（响应式或静态）
 * @param {number} duration - 持续时间 ms
 * @returns {import('vue').Ref<number>} 滚动中的显示值
 */
export function useCountUp(target, duration = 600) {
  const display = ref(0);
  let raf = null;
  let start = null;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function getTarget() {
    return typeof target === "number" ? target : (target.value ?? 0);
  }

  function run(from, to) {
    if (raf) cancelAnimationFrame(raf);
    start = null;
    const diff = to - from;
    if (diff === 0) { display.value = to; return; }
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      display.value = Math.round(from + diff * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function trigger() { run(0, getTarget()); }

  if (typeof target !== "number") {
    watch(target, (nv, ov) => { run(ov || 0, nv || 0); }, { immediate: true });
  } else {
    trigger();
  }

  onUnmounted(() => { if (raf) cancelAnimationFrame(raf); });

  return display;
}
