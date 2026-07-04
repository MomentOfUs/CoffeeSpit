<template>
  <div class="state-skel" :class="`st-${state}`" role="status" :aria-live="state === 'error' ? 'assertive' : 'polite'">
    <!-- 加载态：3 条骨架 + 旋转咖啡杯 -->
    <div v-if="state === 'loading'" class="sk-loading">
      <div class="sk-cup">
        <svg viewBox="0 0 48 56" class="sk-cup-svg">
          <path d="M6 11 L8.5 49 Q8.5 51 10.5 51 L31.5 51 Q33.5 51 33.5 49 L36 11 Z" fill="none" :stroke="cupStroke" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M34 20 Q42 20 42 28 Q42 36 34 36" fill="none" :stroke="cupStroke" stroke-width="1.6"/>
          <ellipse cx="21" cy="11" rx="15" ry="3.2" fill="none" :stroke="cupStroke" stroke-width="1.4"/>
          <path d="M8 4 Q12 1 16 4" fill="none" stroke="var(--roast)" stroke-width="1.4" stroke-linecap="round" class="sk-steam s1"/>
          <path d="M16 3 Q20 0 24 3" fill="none" stroke="var(--roast)" stroke-width="1.4" stroke-linecap="round" class="sk-steam s2"/>
          <path d="M24 4 Q28 1 32 4" fill="none" stroke="var(--roast)" stroke-width="1.4" stroke-linecap="round" class="sk-steam s3"/>
        </svg>
      </div>
      <div class="sk-title">{{ title || '正在冲泡…' }}</div>
      <div class="sk-bars">
        <span class="sk-bar" v-for="i in 3" :key="i" :style="{ '--i': i - 1 }"></span>
      </div>
      <div v-if="desc" class="sk-desc">{{ desc }}</div>
    </div>

    <!-- 空态：图标 + 文案 + CTA -->
    <div v-else-if="state === 'empty'" class="sk-empty">
      <div class="sk-ico">
        <Icon :name="icon || 'cup'" :size="40" />
      </div>
      <div class="sk-title">{{ title || '这里还空着' }}</div>
      <div v-if="desc" class="sk-desc">{{ desc }}</div>
      <button v-if="ctaText" class="btn btn-primary sk-cta" @click="onCta">
        <Icon v-if="ctaIcon" :name="ctaIcon" :size="14" />
        {{ ctaText }}
      </button>
    </div>

    <!-- 错误态：警示图标 + 重试 -->
    <div v-else-if="state === 'error'" class="sk-error">
      <div class="sk-ico sk-ico-err">
        <Icon name="alert" :size="40" />
      </div>
      <div class="sk-title">{{ title || '出错了' }}</div>
      <div v-if="desc" class="sk-desc">{{ desc }}</div>
      <button class="btn btn-accent sk-cta" @click="onCta">
        <Icon name="refresh" :size="14" />
        {{ ctaText || '重试' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Icon from "./Icon.vue";

const props = defineProps({
  /** 状态：loading | empty | error */
  state: { type: String, default: "loading" },
  /** 主标题（中文） */
  title: { type: String, default: "" },
  /** 描述文案（中文） */
  desc: { type: String, default: "" },
  /** 按钮文案；空态必填，错误态默认「重试」 */
  ctaText: { type: String, default: "" },
  /** 空态图标名（对应 Icon 组件 name） */
  icon: { type: String, default: "" },
  /** 空态按钮可选图标 */
  ctaIcon: { type: String, default: "" },
  /** 点击按钮回调 */
  ctaAction: { type: Function, default: null }
});

const emit = defineEmits(["cta"]);

const cupStroke = computed(() => "var(--latte)");

function onCta() {
  emit("cta");
  if (typeof props.ctaAction === "function") props.ctaAction();
}
</script>

<style scoped>
.state-skel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 22px;
  color: var(--latte);
  animation: skFade 0.3s ease both;
}
@keyframes skFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.sk-title {
  font-family: var(--serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--espresso);
  letter-spacing: 0.02em;
  margin-top: 10px;
}
.sk-desc {
  font-size: 12px;
  color: var(--mocha);
  line-height: 1.6;
  margin-top: 6px;
  max-width: 240px;
}
.sk-cta {
  margin-top: 16px;
  border-radius: 2px;
}

/* ---- 加载态 ---- */
.sk-loading { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.sk-cup {
  width: 56px;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: skCupSpin 1.4s cubic-bezier(.5,.1,.5,.9) infinite;
}
.sk-cup-svg { width: 48px; height: 56px; }
@keyframes skCupSpin {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-14deg); }
  50%  { transform: rotate(0deg); }
  75%  { transform: rotate(14deg); }
  100% { transform: rotate(0deg); }
}

.sk-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 220px;
  margin-top: 12px;
}
.sk-bar {
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--foam) 0%, var(--foam-2) 40%, var(--foam) 80%);
  background-size: 220% 100%;
  animation: skShimmer 1.3s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.18s);
}
.sk-bar:nth-child(1) { width: 88%; }
.sk-bar:nth-child(2) { width: 100%; }
.sk-bar:nth-child(3) { width: 64%; }
@keyframes skShimmer {
  0%   { background-position: 120% 0; opacity: 0.7; }
  50%  { background-position: -20% 0; opacity: 1; }
  100% { background-position: -20% 0; opacity: 0.7; }
}

/* 蒸汽（rotate 跟随杯子，再各自飘动） */
.sk-steam { opacity: 0; transform-origin: center; }
.sk-steam.s1 { animation: skSteam 1.8s ease-in-out infinite 0.1s; }
.sk-steam.s2 { animation: skSteam 1.8s ease-in-out infinite 0.4s; }
.sk-steam.s3 { animation: skSteam 1.8s ease-in-out infinite 0.7s; }
@keyframes skSteam {
  0%   { opacity: 0; transform: translateY(2px); }
  40%  { opacity: 0.8; }
  100% { opacity: 0; transform: translateY(-6px); }
}

/* ---- 空态 / 错误态 ---- */
.sk-empty, .sk-error { display: flex; flex-direction: column; align-items: center; }
.sk-ico {
  width: 72px;
  height: 72px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream);
  border: 1px solid var(--foam-2);
  color: var(--latte);
  box-shadow: 0 1px 3px rgba(43,30,20,0.05);
}
.sk-ico-err {
  color: var(--danger);
  background: rgba(178,58,46,0.06);
  border-color: rgba(178,58,46,0.25);
}
.sk-error .sk-title { color: var(--danger); }

/* ---- 按钮统一 2px 圆角 ---- */
.sk-cta { border-radius: 2px; }
</style>
