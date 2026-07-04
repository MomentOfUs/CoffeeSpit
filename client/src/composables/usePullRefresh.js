import { ref, onMounted, onBeforeUnmount } from "vue";

/**
 * 下拉刷新 composable（原生 touch 事件，无外部依赖）
 *
 * 仅当滚动容器 scrollTop === 0 时才触发下拉；手指下拉超过阈值（默认 70px）
 * 后松手，调用传入的异步 refreshFn；刷新期间锁定手势。
 *
 * 用法：
 *   const { pullDistance, isRefreshing, pullRefreshRef } = usePullRefresh(async () => {
 *     await loadData();
 *   });
 *   // 模板：<div ref="pullRefreshRef" style="overflow:auto;height:100%">...</div>
 *   //      下拉指示器可用 pullDistance / isRefreshing 控制位移与文案
 *
 * @param {() => (Promise<any>|void)} refreshFn - 松手超过阈值时执行的异步刷新函数
 * @param {{ threshold?: number, maxPull?: number, damping?: number }} [options]
 * @returns {{ pullDistance: import('vue').Ref<number>, isRefreshing: import('vue').Ref<boolean>, pullRefreshRef: import('vue').Ref<HTMLElement|null> }}
 */
export function usePullRefresh(refreshFn, options = {}) {
  const threshold = options.threshold ?? 70;
  const maxPull = options.maxPull ?? 120;
  const damping = options.damping ?? 0.5;

  /** 当前下拉距离（已阻尼，px） */
  const pullDistance = ref(0);
  /** 是否正在执行刷新 */
  const isRefreshing = ref(false);
  /** 绑定到可滚动容器的模板 ref */
  const pullRefreshRef = ref(null);

  let startY = 0;
  let pulling = false;
  let crossed = false; // 本次下拉是否已越过阈值

  function scrollTop(el) {
    return el.scrollTop ?? 0;
  }

  function onTouchStart(e) {
    if (isRefreshing.value) return;
    const el = pullRefreshRef.value;
    if (!el) return;
    // 仅在容器顶部时启动下拉判定
    if (scrollTop(el) > 0) {
      pulling = false;
      return;
    }
    if (!e.touches || !e.touches.length) return;
    startY = e.touches[0].clientY;
    pulling = true;
    crossed = false;
  }

  function onTouchMove(e) {
    if (!pulling || isRefreshing.value) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) {
      pullDistance.value = 0;
      crossed = false;
      return;
    }
    // 阻尼：越往下越费力，maxPull 封顶
    const damped = Math.min(maxPull, dy * damping);
    pullDistance.value = damped;
    crossed = damped >= threshold;
    // 越过阈值后阻止默认滚动 / 回弹，避免与浏览器下拉冲突
    if (crossed && e.cancelable) e.preventDefault();
  }

  async function onTouchEnd() {
    if (!pulling) return;
    pulling = false;
    if (crossed && !isRefreshing.value) {
      isRefreshing.value = true;
      // 刷新中保持指示器停在阈值高度
      pullDistance.value = threshold;
      try {
        await refreshFn();
      } finally {
        isRefreshing.value = false;
        pullDistance.value = 0;
      }
    } else {
      // 未过阈值：回弹归零
      pullDistance.value = 0;
    }
    crossed = false;
  }

  onMounted(() => {
    const el = pullRefreshRef.value;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
  });

  onBeforeUnmount(() => {
    const el = pullRefreshRef.value;
    if (!el) return;
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
    el.removeEventListener("touchcancel", onTouchEnd);
  });

  return { pullDistance, isRefreshing, pullRefreshRef };
}
