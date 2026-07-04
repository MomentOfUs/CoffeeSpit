<template>
  <Transition name="ob-fade">
    <div v-if="show" class="ob-overlay">
      <div class="ob-scroll">
        <!-- 顶部：跳过 -->
        <div class="ob-topbar">
          <span class="ob-step">{{ step + 1 }} / {{ steps.length }}</span>
          <button v-if="step < steps.length - 1" class="ob-skip" @click="finish">跳过</button>
        </div>

        <!-- 进度点 -->
        <div class="ob-dots">
          <span
            v-for="(_, i) in steps"
            :key="i"
            class="ob-dot"
            :class="{ on: i === step, done: i < step }"
            @click="step = i"
          ></span>
        </div>

        <!-- 屏幕内容 -->
        <div class="ob-stage">
          <Transition :name="transName" mode="out-in">
            <!-- 1. 品牌故事 -->
            <section v-if="step === 0" key="brand" class="ob-screen ob-brand">
              <div class="ob-cup-wrap">
                <svg viewBox="0 0 80 80" class="ob-cup">
                  <defs>
                    <radialGradient id="ob-ceramic" cx="35%" cy="25%" r="75%">
                      <stop offset="0%" stop-color="#FFFFFF"/>
                      <stop offset="35%" stop-color="#FCFAF4"/>
                      <stop offset="75%" stop-color="#E2D7C2"/>
                      <stop offset="100%" stop-color="#C9B89E"/>
                    </radialGradient>
                    <radialGradient id="ob-crema" cx="40%" cy="30%" r="70%">
                      <stop offset="0%" stop-color="#5C4A3A"/>
                      <stop offset="60%" stop-color="#3D2A1A"/>
                      <stop offset="100%" stop-color="#2B1E14"/>
                    </radialGradient>
                  </defs>
                  <line x1="64" y1="40" x2="76" y2="40" stroke="#9A6238" stroke-width="4" stroke-linecap="round"/>
                  <circle cx="40" cy="40" r="26" fill="url(#ob-ceramic)" stroke="#7A4A24" stroke-width="1.2"/>
                  <circle cx="40" cy="40" r="20" fill="url(#ob-crema)"/>
                  <text x="40" y="48" text-anchor="middle" font-family="var(--serif)" font-size="24" font-weight="800" fill="rgba(255,255,255,0.9)">咖</text>
                  <path d="M20,30 Q28,18 40,18" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.4" stroke-linecap="round"/>
                </svg>
                <span class="ob-steam ob-steam-1"></span>
                <span class="ob-steam ob-steam-2"></span>
                <span class="ob-steam ob-steam-3"></span>
              </div>

              <div class="ob-eyebrow">COFFEESPIT</div>
              <h1 class="ob-h1">一杯大实话</h1>
              <p class="ob-lead">这里没有滤镜，只有成分表。<br/>每一杯都被拆开过，每一句都是真话。</p>

              <div class="ob-feats">
                <div class="ob-feat">
                  <Icon name="gauge" :size="18" />
                  <span>拆穿溢价</span>
                </div>
                <div class="ob-feat">
                  <Icon name="recipe" :size="18" />
                  <span>识破配方</span>
                </div>
                <div class="ob-feat">
                  <Icon name="pin" :size="18" />
                  <span>良心推荐</span>
                </div>
              </div>
            </section>

            <!-- 2. 扫描演示 -->
            <section v-else-if="step === 1" key="scan" class="ob-screen ob-scan">
              <div class="ob-eyebrow">STEP 02</div>
              <h2 class="ob-h2">四种方式，识破网红咖啡</h2>

              <!-- 模拟扫描器 -->
              <div class="ob-scanner">
                <div class="ob-scanner-corners">
                  <span class="c tl"></span><span class="c tr"></span>
                  <span class="c bl"></span><span class="c br"></span>
                </div>
                <div class="ob-scanline"></div>
                <div class="ob-scanner-cup">
                  <Icon name="cup" :size="40" />
                  <b>对准杯面</b>
                </div>
              </div>

              <div class="ob-methods">
                <div class="ob-method" v-for="m in methods" :key="m.label">
                  <span class="ob-method-ico"><Icon :name="m.icon" :size="20" /></span>
                  <div>
                    <div class="ob-method-label">{{ m.label }}</div>
                    <div class="ob-method-sub">{{ m.sub }}</div>
                  </div>
                </div>
              </div>
            </section>

            <!-- 3. 健康档案 -->
            <section v-else key="health" class="ob-screen ob-health">
              <div class="ob-eyebrow">STEP 03</div>
              <h2 class="ob-h2">告诉我们你的口味</h2>
              <p class="ob-sub">我们会为你标记不适合的咖啡，可稍后在「我的」中修改。</p>

              <div class="ob-toggles">
                <div v-for="opt in healthOpts" :key="opt.key" class="ob-toggle-row">
                  <div class="ob-toggle-left">
                    <Icon :name="healthIcon(opt.key)" :size="18" class="ob-toggle-ico" />
                    <div>
                      <div class="ob-toggle-name">{{ opt.name }}</div>
                      <div class="ob-toggle-code">{{ opt.code }}</div>
                    </div>
                  </div>
                  <button
                    class="ob-toggle"
                    :class="{ on: !!profile[opt.key] }"
                    :aria-pressed="!!profile[opt.key]"
                    :aria-label="opt.name"
                    @click="profile[opt.key] = !profile[opt.key]"
                  ></button>
                </div>
              </div>
            </section>
          </Transition>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="ob-foot">
        <button v-if="step > 0" class="btn ob-back" @click="prev">上一步</button>
        <button v-else class="btn ob-back ob-back-ghost" @click="finish">跳过</button>
        <button v-if="step < steps.length - 1" class="btn btn-primary ob-next" @click="next">
          下一步
          <Icon name="chevron-right" :size="14" />
        </button>
        <button v-else class="btn btn-accent ob-next" @click="finish">
          <Icon name="check" :size="14" />
          开始使用
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import Icon from "./Icon.vue";
import { useStore } from "../stores/app.js";

const STORAGE_KEY = "cs_onboarded";

const emit = defineEmits(["done"]);

const { updateProfile, state } = useStore();

const show = ref(false);
const step = ref(0);
const transName = ref("ob-slide-next");
const steps = [0, 1, 2];

const methods = [
  { icon: "camera", label: "拍照识破", sub: "对准杯面即拍即拆" },
  { icon: "gallery", label: "相册上传", sub: "选已有照片分析" },
  { icon: "search", label: "搜索咖啡", sub: "按名 / 品牌 / 城市查" },
  { icon: "edit", label: "手动填参数", sub: "自然语言生成报告" }
];

const healthOpts = [
  { key: "lactoseIntolerant", name: "乳糖不耐", code: "乳糖不耐" },
  { key: "caffeineSensitive", name: "咖啡因敏感", code: "咖啡因敏感" },
  { key: "sugarFree", name: "戒糖", code: "控糖" },
  { key: "pregnant", name: "孕期/备孕", code: "孕期" },
  { key: "vegan", name: "植物基", code: "植物奶" },
  { key: "lowBudget", name: "平价优先", code: "低预算" },
  { key: "nightOwl", name: "夜猫子", code: "熬夜党" }
];

const HEALTH_ICO = {
  lactoseIntolerant: "droplet",
  caffeineSensitive: "gauge",
  sugarFree: "droplet",
  pregnant: "heart",
  vegan: "cup",
  lowBudget: "coins",
  nightOwl: "clock"
};
function healthIcon(key) { return HEALTH_ICO[key] || "stamp"; }

// 本地健康档案（默认开启平价优先，与 defaultProfile 一致）
const profile = reactive({
  lactoseIntolerant: false,
  caffeineSensitive: false,
  sugarFree: false,
  pregnant: false,
  vegan: false,
  lowBudget: true,
  nightOwl: false
});

onMounted(() => {
  // 仅在未完成引导时显示
  show.value = localStorage.getItem(STORAGE_KEY) !== "1";
});

function next() {
  if (step.value >= steps.length - 1) return;
  transName.value = "ob-slide-next";
  step.value++;
}
function prev() {
  if (step.value <= 0) return;
  transName.value = "ob-slide-prev";
  step.value--;
}

async function finish() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
  // 持久化健康档案到后端（合并已有字段，失败不阻塞）
  try {
    await updateProfile({ ...(state.profile || {}), ...profile });
  } catch (e) { /* ignore */ }
  show.value = false;
  emit("done");
}
</script>

<style scoped>
.ob-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--oat);
  background-image:
    repeating-linear-gradient(43deg, rgba(92,74,58,0.015) 0 1px, transparent 1px 4px),
    repeating-linear-gradient(-47deg, rgba(92,74,58,0.012) 0 1px, transparent 1px 5px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ob-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 6vw 8px;
  padding-top: calc(12px + constant(safe-area-inset-top));
  padding-top: calc(12px + env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
}

/* 顶部条 */
.ob-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ob-step {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--latte);
}
.ob-skip {
  font-size: 12px;
  color: var(--mocha);
  padding: 4px 10px;
  border: 1px solid var(--foam-2);
  border-radius: 2px;
  background: var(--cream);
}
.ob-skip:active { background: var(--foam); }

/* 进度点 */
.ob-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 18px 0 10px;
}
.ob-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--foam-2);
  transition: all 0.25s ease;
}
.ob-dot.on { width: 24px; background: var(--roast); }
.ob-dot.done { background: var(--caramel); }

/* 舞台 */
.ob-stage {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6px;
}
.ob-screen {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ob-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--latte);
  margin-bottom: 6px;
}
.ob-h1 {
  font-family: var(--serif);
  font-size: 34px;
  font-weight: 800;
  color: var(--espresso);
  letter-spacing: 0.02em;
  margin: 4px 0 14px;
}
.ob-h2 {
  font-family: var(--serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--espresso);
  line-height: 1.3;
  margin: 4px 0 12px;
}
.ob-lead {
  font-size: 14px;
  color: var(--mocha);
  line-height: 1.7;
  margin: 0 0 24px;
}
.ob-sub {
  font-size: 12.5px;
  color: var(--mocha);
  line-height: 1.6;
  margin: 0 0 18px;
  max-width: 320px;
}

/* ---- 屏幕 1：品牌杯 ---- */
.ob-cup-wrap {
  position: relative;
  width: 96px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.ob-cup { width: 84px; height: 84px; filter: drop-shadow(0 6px 10px rgba(43,30,20,0.15)); }
.ob-steam {
  position: absolute;
  top: 6px;
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(210,112,43,0.5), transparent);
  opacity: 0;
  animation: obSteam 2.4s ease-in-out infinite;
}
.ob-steam-1 { left: 38%; animation-delay: 0.1s; }
.ob-steam-2 { left: 50%; animation-delay: 0.7s; }
.ob-steam-3 { left: 62%; animation-delay: 1.3s; }
@keyframes obSteam {
  0% { opacity: 0; transform: translateY(4px) scaleY(0.6); }
  40% { opacity: 0.7; }
  100% { opacity: 0; transform: translateY(-12px) scaleY(1.2); }
}

.ob-feats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.ob-feat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--foam-2);
  border-radius: 2px;
  background: var(--cream);
  color: var(--caramel);
  font-size: 12.5px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(43,30,20,0.04);
}

/* ---- 屏幕 2：扫描演示 ---- */
.ob-scanner {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 4 / 3;
  border-radius: 2px;
  background:
    radial-gradient(circle at 30% 20%, rgba(210,112,43,0.15), transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(122,74,36,0.2), transparent 50%),
    linear-gradient(180deg, #2B1E14 0%, #3D2A1A 100%);
  overflow: hidden;
  margin: 6px 0 22px;
  box-shadow: var(--shadow-soft);
}
.ob-scanner-corners .c {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--roast);
  border-radius: 2px;
}
.ob-scanner-corners .tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
.ob-scanner-corners .tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
.ob-scanner-corners .bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
.ob-scanner-corners .br { bottom: 10px; right: 10px; border-left: none; border-top: none; }
.ob-scanline {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: var(--roast);
  box-shadow: 0 0 16px var(--roast);
  animation: obScan 2.6s ease-in-out infinite;
}
@keyframes obScan {
  0% { top: 12%; opacity: 0.2; }
  50% { top: 86%; opacity: 0.9; }
  100% { top: 12%; opacity: 0.2; }
}
.ob-scanner-cup {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #fff;
}
.ob-scanner-cup b {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--roast);
}

.ob-methods {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ob-method {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--foam-2);
  border-radius: 2px;
  background: var(--cream);
  text-align: left;
  box-shadow: var(--shadow-card);
}
.ob-method-ico {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  background: var(--foam);
  color: var(--caramel);
}
.ob-method-label { font-size: 13px; font-weight: 700; color: var(--espresso); }
.ob-method-sub { font-family: var(--mono); font-size: 9px; color: var(--latte); margin-top: 2px; letter-spacing: 0.04em; }

/* ---- 屏幕 3：健康档案 ---- */
.ob-toggles {
  width: 100%;
  border: 1px solid var(--foam-2);
  border-radius: 2px;
  background: var(--cream);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.ob-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--foam-2);
}
.ob-toggle-row:last-child { border-bottom: none; }
.ob-toggle-left { display: flex; align-items: center; gap: 10px; }
.ob-toggle-ico { color: var(--caramel); }
.ob-toggle-name { font-size: 13.5px; font-weight: 600; color: var(--espresso); }
.ob-toggle-code { font-family: var(--mono); font-size: 8.5px; color: var(--latte); letter-spacing: 0.1em; margin-top: 2px; }
.ob-toggle {
  width: 42px;
  height: 24px;
  border: 1px solid var(--foam-2);
  border-radius: 999px;
  background: var(--foam);
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}
.ob-toggle::after {
  content: "";
  position: absolute;
  left: 2px; top: 2px;
  width: 18px; height: 18px;
  background: var(--cream);
  border: 1px solid var(--foam-2);
  border-radius: 50%;
  transition: left 0.2s ease;
  box-shadow: var(--shadow-card);
}
.ob-toggle.on { background: var(--caramel); border-color: var(--caramel); }
.ob-toggle.on::after { left: 20px; background: var(--cream); border-color: var(--cream); }

/* ---- 底部导航 ---- */
.ob-foot {
  display: flex;
  gap: 10px;
  padding: 12px 6vw;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--foam-2);
  background: var(--cream);
  box-shadow: 0 -2px 12px rgba(43,30,20,0.04);
}
.ob-foot .btn { flex: 1; border-radius: 2px; }
.ob-back { background: var(--cream); }
.ob-back-ghost { opacity: 0.7; }
.ob-next { flex: 1.4; }

/* ---- 过渡 ---- */
.ob-slide-next-enter-active, .ob-slide-next-leave-active,
.ob-slide-prev-enter-active, .ob-slide-prev-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.ob-slide-next-enter-from { opacity: 0; transform: translateX(24px); }
.ob-slide-next-leave-to { opacity: 0; transform: translateX(-24px); }
.ob-slide-prev-enter-from { opacity: 0; transform: translateX(-24px); }
.ob-slide-prev-leave-to { opacity: 0; transform: translateX(24px); }

.ob-fade-enter-active, .ob-fade-leave-active { transition: opacity 0.25s ease; }
.ob-fade-enter-from, .ob-fade-leave-to { opacity: 0; }

/* ---- 减弱动画 ---- */
@media (prefers-reduced-motion: reduce) {
  .ob-scanline, .ob-steam, .ob-cup { animation: none !important; }
  .ob-dot { transition: none !important; }
}
</style>
