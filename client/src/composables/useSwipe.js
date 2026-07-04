/**
 * 横向滑动手势 composable（用于 Tab 切换，无外部依赖）
 *
 * 仅在松手时判定：水平位移 > 阈值（默认 50px）且垂直位移 < 上限（默认 30px）
 * 时触发回调，回调接收 "left" / "right" 方向。遵守 prefers-reduced-motion：
 * 用户启用减弱动画时不触发，避免 Tab 切换的滑动动画造成不适。
 *
 * 用法：
 *   const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe((dir) => {
 *     if (dir === "left") nextTab();
 *     if (dir === "right") prevTab();
 *   });
 *   // 模板：<div @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
 *
 * @param {(dir: "left"|"right") => void} onSwipe - 命中横向滑动时回调
 * @param {{ threshold?: number, maxVertical?: number }} [options]
 * @returns {{ onTouchStart: (e: TouchEvent)=>void, onTouchMove: (e: TouchEvent)=>void, onTouchEnd: (e: TouchEvent)=>void }}
 */
export function useSwipe(onSwipe, options = {}) {
  const threshold = options.threshold ?? 50;
  const maxVertical = options.maxVertical ?? 30;

  // 遵守系统「减弱动态效果」偏好
  const prefersReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  function onTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) {
      tracking = false;
      return;
    }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }

  function onTouchMove() {
    // 占位：保持 API 对称，便于后续扩展（如跟手位移）
  }

  function onTouchEnd(e) {
    if (!tracking) return;
    tracking = false;
    // 减弱动画偏好下不触发切换
    if (prefersReduced) return;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // 水平为主、垂直很小时才算横向滑动
    if (Math.abs(dx) > threshold && Math.abs(dy) < maxVertical) {
      onSwipe(dx > 0 ? "right" : "left");
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}
