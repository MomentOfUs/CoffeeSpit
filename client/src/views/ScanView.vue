<template>
  <div class="page" data-bg="识破">
    <!-- 精简数据条 -->
    <div class="mini-stats reveal-group mt-8">
      <span class="ms-item" style="--i:0"><Icon name="scan" :size="12" /> 扫描 {{ stats?.scanCount ?? '—' }} 次</span>
      <span class="ms-sep"></span>
      <span class="ms-item" style="--i:1"><Icon name="coins" :size="12" /> 已省 ¥{{ stats?.savedMoney ?? '—' }}</span>
      <span class="ms-sep"></span>
      <span class="ms-item" style="--i:2"><span class="ms-dot" :class="{ on: ready }"></span> {{ ready ? '在线' : '连接中' }}</span>
    </div>

    <!-- Hero -->
    <div class="hero mt-8 reveal-group">
      <div class="hero-eyebrow" style="--i:0">识破真相</div>
      <div class="hero-title" style="--i:1">扫描<em>一杯</em>，拆穿滤镜</div>
      <div style="--i:2;font-size:12px;opacity:0.8;margin-top:4px">拍照 · 上传 · 搜索 · 手动填，四种方式识破网红咖啡</div>
    </div>

    <!-- 搜索优先入口 -->
    <div class="search-box mt-12">
      <Icon name="search" :size="18" class="search-icon" />
      <input v-model="searchQuery" @input="onSearch" placeholder="搜咖啡名 / 品牌 / 城市…" />
    </div>

    <!-- 搜索结果下拉 -->
    <div v-if="searchQuery.length >= 1" class="search-results mt-8">
      <div v-if="searchResults.length" class="reveal-group">
        <div v-for="(r, i) in searchResults" :key="r.id" class="sr-item" style="--i:i" @click="onSelectResult(r)">
          <div>
            <div class="sr-name">{{ r.originalName.replace(/「|」/g, '') }}</div>
            <div class="sr-brand">{{ r.brand }} · {{ r.city }}</div>
          </div>
          <span class="chip soft">+{{ r.premiumRate }}%</span>
        </div>
      </div>
      <div v-else-if="searchQuery.length >= 2" class="sr-empty">
        <Icon name="cup" :size="32" style="opacity:0.3" />
        <div style="margin-top:8px">咖啡库里没有这杯</div>
        <button class="btn btn-sm btn-primary mt-8" @click="openManualForm">
          <Icon name="edit" :size="12" /> 手动填参数生成报告
        </button>
      </div>
    </div>

    <!-- 拍照 + 相册 -->
    <div class="row gap-8 mt-8">
      <button class="btn btn-accent btn-block" @click="openCamera" :disabled="scanning">
        <Icon name="camera" :size="16" /> 拍照识破
      </button>
      <button class="btn btn-block" @click="pickFile" :disabled="scanning">
        <Icon name="gallery" :size="16" /> 相册上传
      </button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
    </div>

    <!-- 自然语言录入 -->
    <div v-if="showManualForm" class="panel panel-pad mt-12" style="animation: reportIn .3s ease">
      <div class="row-between" style="margin-bottom:10px">
        <span class="mono" style="font-size:11px;letter-spacing:.12em;color:var(--caramel)"><Icon name="edit" :size="12" /> 自然语言录入</span>
        <button class="iconbtn" @click="showManualForm = false"><Icon name="close" :size="14" /></button>
      </div>
      <div class="field">
        <label>描述这杯咖啡</label>
        <textarea v-model="naturalText" rows="4" placeholder="如：在星巴克买了一杯焦糖玛奇朵，35块，据说成本也就6块5，糖挺多糖浆味重，有焦糖纹…"></textarea>
      </div>
      <button class="btn btn-primary btn-block mt-12" @click="submitNatural" :disabled="!naturalText.trim() || parsing">
        <Icon name="stamp" :size="14" /> {{ parsing ? 'AI 解析中…' : 'AI 解析并生成报告' }}
      </button>
    </div>

    <!-- 热门选品 -->
    <div class="section">
      <div class="section-head">
        <h3>或从热榜选一杯</h3>
        <span class="label"><span class="dot"></span>热榜 · 直接试毒</span>
      </div>
      <div class="picker">
        <div v-for="(c, i) in coffees" :key="c.id" class="picker-card" :class="{ active: selectedId === c.id }" @click="selectManual(c)">
          <div class="top-row">
            <span class="idx">No.{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="prem">+{{ c.premiumRate }}%</span>
          </div>
          <div class="name"><span class="em">{{ c.originalName.replace(/「|」/g, '') }}</span></div>
          <div class="meta">
            <span class="price">¥{{ c.reportedPrice }}</span>
            <span class="idx">实付 ¥{{ c.realCost }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日摄入 -->
    <div class="section">
      <div class="section-head">
        <h3>今日累计摄入</h3>
        <span class="label"><span class="dot"></span>今日 · 实时同步</span>
      </div>
      <div class="panel panel-pad intake-compact">
        <CupLevel :value="today.caffeineMg" :limit="LIMITS.caffeine" label="咖啡因" unit="mg" tone="roast" variant="caffeine" size="sm" />
        <CupLevel :value="today.sugarG" :limit="LIMITS.sugar" label="糖" unit="g" tone="gold" variant="sugar" size="sm" />
        <CupLevel :value="today.kcal" :limit="LIMITS.kcal" label="热量" unit="kcal" tone="mocha" variant="calories" size="sm" />
      </div>
    </div>

    <!-- 质检报告 -->
    <div v-if="report" class="section" ref="reportRef">
      <div class="section-head">
        <h3>质检报告</h3>
        <span class="label"><span class="dot"></span>报告编号 {{ reportNo }}</span>
      </div>

      <div class="report reveal-group" :class="'lv-' + report.verdictLevel">
        <!-- 公文红头 -->
        <div class="rp-doc-header" style="--i:0">
          <div class="doc-title">一杯大实话 · 质检报告</div>
          <div class="doc-sub">咖啡品质检测与溢价分析</div>
          <div class="doc-no">编号：{{ reportNo }} · 日期：{{ reportDate }}</div>
        </div>

        <!-- 水印 -->
        <div class="watermark"></div>

        <!-- 封面（主信息层） -->
        <div class="rp-cover" style="--i:1">
          <div class="rp-corner"></div>
          <!-- 顶部：印章 + 品牌 -->
          <div class="rp-cover-top">
            <Stamp :text="report.verdict" :tone="verdictTone" shape="rect" :rotate="-3" />
            <span class="rp-brand">{{ report.brand }}</span>
          </div>
          <!-- 主标题：咖啡名 + 城市 -->
          <div class="rp-cover-main">
            <div class="rp-name serif">{{ report.originalName }}</div>
            <div class="rp-city"><Icon name="location" :size="9" /> {{ report.city }}</div>
          </div>
          <!-- 溢价率 + 价格并排 -->
          <div class="rp-hero-row">
            <div class="rp-hero-premium">
              <span class="rp-hp-value">+{{ report.premiumRate }}</span><span class="rp-hp-pct">%</span>
              <span class="rp-hp-label">溢价率</span>
            </div>
            <div class="rp-price-col">
              <div class="rp-price-tag">标价 ¥{{ report.reportedPrice }}</div>
              <div class="rp-price-real">实付 ¥{{ report.realCost }}</div>
            </div>
          </div>
        </div>

        <hr class="stitch-line" />

        <!-- 溢价率（多形态分级） -->
        <div class="rp-premium panel-pad" style="--i:2">
          <div class="rp-sec-title">溢价分析</div>

          <!-- Tier 1: OK 平价 — 印章 + 数值 -->
          <div v-if="report.verdictLevel === 'OK'" class="premium-tier premium-ok">
            <Stamp :text="report.verdict" tone="ok" shape="oval" :rotate="-3" />
            <span class="premium-num ok">+{{ displayPremium }}%</span>
            <span class="premium-hint">合理区间</span>
          </div>

          <!-- Tier 2: WARN 溢价警告 — 仪表盘（档内归一） -->
          <div v-else-if="report.verdictLevel === 'WARN'" class="premium-tier premium-warn">
            <div class="gauge-wrap">
              <svg viewBox="0 0 120 70" class="gauge-svg">
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--foam-2)" stroke-width="8" stroke-linecap="round" />
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" :stroke="gaugeColor" stroke-width="8" stroke-linecap="round" :stroke-dasharray="gaugeDash" class="gauge-arc" />
              </svg>
              <div class="gauge-center">
                <div class="mono premium-num warn">+{{ displayPremium }}%</div>
                <div class="gauge-label">溢价率</div>
              </div>
            </div>
          </div>

          <!-- Tier 3: HIGH 溢价严重 — 双柱对比 -->
          <div v-else-if="report.verdictLevel === 'HIGH'" class="premium-tier premium-high">
            <div class="dual-bar">
              <div class="dual-bar-col">
                <div class="dual-bar-bar real" :style="{ width: realBarPct + '%' }">
                  <span class="dual-bar-label">实付 ¥{{ report.realCost }}</span>
                </div>
              </div>
              <div class="dual-bar-col">
                <div class="dual-bar-bar reported" style="width:100%">
                  <span class="dual-bar-label">标价 ¥{{ report.reportedPrice }}</span>
                </div>
              </div>
            </div>
            <div class="dual-bar-diff">
              <Icon name="alert" :size="12" /> 多付 ¥{{ (report.reportedPrice - report.realCost).toFixed(1) }} · +{{ displayPremium }}%
            </div>
          </div>

          <!-- Tier 4: EXTREME 智商核弹 -->
          <div v-else class="premium-tier premium-extreme">
            <div class="extreme-stamp-row">
              <Stamp text="智商核弹" tone="danger" shape="rect" :rotate="-2" />
            </div>
            <div class="gauge-wrap extreme-gauge">
              <svg viewBox="0 0 120 70" class="gauge-svg">
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" opacity="0.2"/>
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--danger)" stroke-width="8" stroke-linecap="round" stroke-dasharray="157 157" class="gauge-arc"/>
              </svg>
              <div class="gauge-below">
                <div class="mono premium-num danger">+{{ displayPremium }}%</div>
                <div class="gauge-label extreme-label">爆表</div>
              </div>
            </div>
            <div class="extreme-prices">
              <span class="ep-tag">标价 <b>¥{{ report.reportedPrice }}</b></span>
              <span class="ep-arrow">→</span>
              <span class="ep-real">实付 <b>¥{{ report.realCost }}</b></span>
            </div>
            <div class="extreme-diff">多付 ¥{{ (report.reportedPrice - report.realCost).toFixed(1) }}</div>
          </div>
        </div>

        <hr class="stitch-line" />

        <!-- 成分透视（融合成本拆解 + 营养 + 配方） -->
        <div class="panel-pad" style="--i:3">
          <div class="rp-sec-title"><Icon name="coins" :size="11" /> 成分透视</div>

          <!-- 杯子 + 引导线 SVG -->
          <div class="cost-anatomy">
            <svg viewBox="0 0 200 140" class="anatomy-svg">
              <defs>
                <radialGradient id="cup-ceramic" cx="35%" cy="20%" r="80%">
                  <stop offset="0%" stop-color="rgba(255,255,255,0.5)"/>
                  <stop offset="40%" stop-color="rgba(252,250,244,0.15)"/>
                  <stop offset="100%" stop-color="rgba(43,30,20,0.18)"/>
                </radialGradient>
                <linearGradient id="cup-body-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#FCFAF4"/>
                  <stop offset="50%" stop-color="#F5EFE3"/>
                  <stop offset="100%" stop-color="#E2D7C2"/>
                </linearGradient>
                <linearGradient id="cup-rim-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#EDE4D3"/>
                  <stop offset="100%" stop-color="#E2D7C2"/>
                </linearGradient>
                <radialGradient id="cup-inner" cx="50%" cy="15%" r="70%">
                  <stop offset="0%" stop-color="rgba(43,30,20,0.35)"/>
                  <stop offset="60%" stop-color="rgba(43,30,20,0.12)"/>
                  <stop offset="100%" stop-color="rgba(43,30,20,0.05)"/>
                </radialGradient>
                <linearGradient id="cup-lid-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#FCFAF4"/>
                  <stop offset="60%" stop-color="#F0E9D8"/>
                  <stop offset="100%" stop-color="#E2D7C2"/>
                </linearGradient>
                <linearGradient id="cup-sleeve-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#E2D7C2"/>
                  <stop offset="50%" stop-color="#D4C5A8"/>
                  <stop offset="100%" stop-color="#C9B89E"/>
                </linearGradient>
              </defs>

              <!-- 地面投影 -->
              <ellipse cx="100" cy="126" rx="30" ry="3" fill="rgba(43,30,20,0.12)"/>

              <!-- 杯体底（陶瓷渐变） -->
              <path d="M72,24 L76,118 L124,118 L128,24 Z"
                    fill="url(#cup-body-grad)" stroke="var(--mocha)" stroke-width="1"/>

              <!-- 成分层（梯形 path，无 clipPath） -->
              <g v-for="(row, i) in report.costBreakdown" :key="i">
                <path :d="cupLayerPath(i)" :fill="layerColor(i)" opacity="0.85"
                      :style="{ animationDelay: (i * 80) + 'ms' }" class="anatomy-layer"/>
              </g>

              <!-- 液面表面高光线 -->
              <line :x1="leftX(cupLayerTop(0))" :y1="cupLayerTop(0)"
                    :x2="rightX(cupLayerTop(0))" :y2="cupLayerTop(0)"
                    stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>

              <!-- 杯套（瓦楞纸带，半透明可见成分色） -->
              <path d="M72,60 L128,60 L127,86 L73,86 Z" fill="url(#cup-sleeve-grad)" opacity="0.5" stroke="none"/>
              <line v-for="cx in [76,82,88,94,106,112,118,124]" :key="'corr-'+cx"
                    :x1="cx" y1="60.5" :x2="cx" y2="85.5" stroke="rgba(92,74,58,0.28)" stroke-width="0.5"/>
              <line x1="72" y1="60" x2="128" y2="60" stroke="var(--caramel)" stroke-width="0.9" opacity="0.55"/>
              <line x1="73" y1="86" x2="127" y2="86" stroke="var(--caramel)" stroke-width="0.9" opacity="0.55"/>
              <line x1="100" y1="60.5" x2="100" y2="85.5" stroke="var(--mocha)" stroke-width="0.6" opacity="0.3" stroke-dasharray="1.5,1"/>

              <!-- 杯盖（拱顶 + 饮口） -->
              <path d="M71,24 L129,24 L127,20 L73,20 Z" fill="url(#cup-lid-grad)" stroke="var(--mocha)" stroke-width="0.8"/>
              <path d="M73,20 Q73,11 100,11 Q127,11 127,20 Z" fill="url(#cup-lid-grad)" stroke="var(--mocha)" stroke-width="0.8"/>
              <ellipse cx="100" cy="13" rx="6" ry="1.6" fill="var(--espresso)" opacity="0.65"/>
              <path d="M78,15 Q88,12 99,12" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1" stroke-linecap="round"/>

              <!-- 引导线（每个成分一条） -->
              <g v-for="(row, i) in report.costBreakdown" :key="'line-'+i">
                <circle :cx="leaderStart(i).x" :cy="leaderStart(i).y" r="2" :fill="layerColor(i)" />
                <polyline :points="leaderPath(i)" fill="none" stroke="var(--mocha)" stroke-width="0.6" stroke-dasharray="2,1.5" opacity="0.5" />
                <rect :x="labelBox(i).x" :y="labelBox(i).y" :width="labelBox(i).w" :height="labelBox(i).h" rx="3" fill="var(--cream)" stroke="var(--foam-2)" stroke-width="0.5" />
                <text :x="labelText(i).x" :y="labelText(i).y" font-size="7" font-weight="700" :fill="layerColor(i)">{{ row[0] }}</text>
                <text :x="labelText(i).x" :y="labelText(i).y + 9" font-size="8" font-weight="800" fill="var(--espresso)">¥{{ row[1] }}</text>
              </g>
            </svg>

            <!-- 营养数据（融入下方） -->
            <div class="anatomy-nutrition">
              <CupLevel :value="report.caffeineMg" :limit="200" label="咖啡因" unit="mg" tone="roast" variant="caffeine" size="sm" />
              <CupLevel :value="report.sugarG" :limit="50" label="糖" unit="g" tone="gold" variant="sugar" size="sm" />
              <CupLevel :value="report.kcal" :limit="500" label="热量" unit="kcal" tone="mocha" variant="calories" size="sm" />
            </div>

            <!-- 配方清单（融入侧栏） -->
            <div class="anatomy-recipe">
              <div class="anatomy-recipe-title"><Icon name="recipe" :size="10" /> 真实配方</div>
              <div v-for="(r, i) in report.recipe" :key="i" class="anatomy-recipe-item">{{ r }}</div>
            </div>

            <!-- 标签 -->
            <div class="rp-tags mt-8">
              <span v-for="t in report.tags" :key="t" class="chip soft">{{ t }}</span>
            </div>
          </div>
        </div>

        <!-- 健康警告 -->
        <div v-if="warnings.length" class="rp-warn panel-pad" style="--i:5">
          <div class="rp-sec-title rp-sec-danger"><Icon name="alert" :size="12" /> 健康警告</div>
          <div v-for="(w, i) in warnings" :key="i" class="warn-line">{{ w }}</div>
        </div>

        <hr class="stitch-line" />

        <!-- 历史对比 -->
        <div v-if="prevCompare" class="panel-pad" style="--i:6">
          <div class="rp-sec-title"><Icon name="gauge" :size="11" /> 历史对比</div>
          <div class="compare">
            <div class="col">
              <div class="k">本次</div>
              <div class="v">¥{{ report.reportedPrice }}<small>/ {{ report.caffeineMg }}mg</small></div>
            </div>
            <div class="vs"></div>
            <div class="col">
              <div class="k">{{ prevCompare.label }}</div>
              <div class="v">¥{{ prevCompare.price }}<small>/ {{ prevCompare.caffeine }}mg</small></div>
            </div>
            <div class="delta" :class="prevCompare.deltaClass">
              {{ prevCompare.sign }}{{ Math.abs(prevCompare.diff) }}
              <span class="pct">{{ prevCompare.pct }}</span>
            </div>
          </div>
        </div>

        <hr class="stitch-line" />

        <!-- AI 毒舌 -->
        <div class="rp-roast panel-pad" :class="{ read: roastRead }" @click="readRoast" style="--i:8">
          <div class="rp-roast-head"><Icon name="flame" :size="12" /> 毒舌锐评 {{ roastRead ? '' : '（点击揭幕）' }}</div>
          <div v-if="roastRead && Array.isArray(report.roast)" class="rp-roast-sections">
            <div v-for="(sec, i) in report.roast" :key="i" class="roast-sec" :style="{ '--i': i }">
              <div class="roast-sec-head">
                <Icon :name="sec.icon" :size="13" class="roast-sec-icon" />
                <span>{{ sec.title }}</span>
              </div>
              <div class="roast-sec-text">{{ sec.text }}</div>
            </div>
          </div>
          <div v-else-if="roastRead" class="rp-roast-text" style="animation: clipReveal .6s ease both">{{ report.roast }}</div>
          <div v-else class="rp-roast-blur">
            <div class="rp-roast-teaser">
              <span v-for="(sec, i) in (Array.isArray(report.roast) ? report.roast : [])" :key="i" class="roast-teaser-tag">{{ sec.title }}</span>
            </div>
            <div class="rp-roast-teaser-hint">点击揭幕 · {{ Array.isArray(report.roast) ? report.roast.length : 0 }} 段深度分析</div>
          </div>
        </div>

        <hr class="stitch-line" />

        <!-- 内联推荐 -->
        <div class="panel-pad" style="--i:9">
          <div class="rp-sec-title"><Icon name="pin" :size="11" /> 附近推荐 · 不如去这些店</div>
          <div class="rp-rec-hint">省下的钱够喝 {{ recs[0]?.saved }} 杯良心美式</div>
          <div v-for="s in recs" :key="s.id" class="rec-card" @click="$router.push('/radar')">
            <div>
              <div class="name">{{ s.name }}</div>
              <div class="desc">{{ s.signature }}</div>
            </div>
            <div class="tac">
              <div class="price">¥{{ s.price }}</div>
              <div class="saved">省 ¥{{ s.saved }}</div>
            </div>
          </div>
        </div>

        <hr class="stitch-line" />

        <div class="rp-foot panel-pad" style="--i:10">
          <button class="btn btn-sm" @click="shareReport"><Icon name="share" :size="12" /> 分享</button>
          <button class="btn btn-sm btn-accent" @click="resetReport"><Icon name="refresh" :size="12" /> 再扫一杯</button>
        </div>
      </div>
    </div>

    <!-- 拍照抽屉 -->
    <div v-if="cameraOpen" class="drawer-mask" @click="closeCamera"></div>
    <div v-if="cameraOpen" class="drawer">
      <div class="cam-head row-between" style="padding:14px 14px 0">
        <span class="mono" style="font-size:11px;letter-spacing:.14em"><Icon name="camera" :size="14" /> 实时拍照</span>
        <button class="iconbtn" @click="closeCamera"><Icon name="close" :size="14" /></button>
      </div>
      <div style="padding:12px 14px">
        <div class="cam-video-wrap">
          <video ref="videoEl" autoplay playsinline muted></video>
          <div v-if="cameraError" class="cam-err">{{ cameraError }}</div>
        </div>
        <div class="cam-actions mt-12">
          <button class="btn btn-block btn-accent" @click="capture" :disabled="!streamReady"><Icon name="camera" :size="16" /> 拍照识别</button>
          <button v-if="!streamReady" class="btn btn-block mt-8" @click="startCamera">重新授权摄像头</button>
        </div>
      </div>
      <canvas ref="canvasEl" hidden></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { api } from "../api/index.js";
import { useStore, LIMITS } from "../stores/app.js";
import Icon from "../components/Icon.vue";
import Stamp from "../components/Stamp.vue";
import CupLevel from "../components/CupLevel.vue";
import { useCountUp } from "../composables/useCountUp.js";

const { state, today, toast, refreshProfile, refreshToday, stats } = useStore();

const ready = computed(() => state.deviceReady);

const coffees = ref([]);
const selectedId = ref(null);
const scanning = ref(false);
const previewUrl = ref("");
const report = ref(null);
const roastRead = ref(false);
const recs = ref([]);
const history = ref([]);
const reportRef = ref(null);
const reportNo = computed(() => report.value ? `CS-${Date.now().toString(36).slice(-5).toUpperCase()}` : "");
const reportDate = computed(() => {
  if (!report.value) return "";
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
});

// 搜索
const searchQuery = ref("");
const searchResults = ref([]);
let searchTimer = null;

// 自然语言录入
const showManualForm = ref(false);
const naturalText = ref("");
const parsing = ref(false);

// 数字滚动
const premiumTarget = computed(() => report.value?.premiumRate || 0);
const displayPremium = useCountUp(premiumTarget, 800);

// 摄像头
const cameraOpen = ref(false);
const videoEl = ref(null);
const canvasEl = ref(null);
const streamReady = ref(false);
const cameraError = ref("");
let stream = null;
const fileInput = ref(null);

onMounted(async () => {
  try { coffees.value = await api.getCoffees(); } catch (e) { toast("咖啡库加载失败", "err"); }
  try { history.value = await api.history(); } catch (e) { /* ignore */ }
});
onBeforeUnmount(() => { stopCamera(); });

// ---- 搜索 ----
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) { searchResults.value = []; return; }
    const results = coffees.value
      .map(c => {
        const haystack = (c.originalName + c.alias + c.brand + c.city + c.tags.join("")).toLowerCase();
        let score = 0;
        if (c.originalName.toLowerCase().includes(q)) score += 100;
        if (c.brand.toLowerCase().includes(q)) score += 60;
        if (c.tags.some(t => t.toLowerCase().includes(q))) score += 40;
        if (c.alias.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)) score += 20;
        return { ...c, score, matched: haystack.includes(q) };
      })
      .filter(c => c.matched)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    searchResults.value = results;
  }, 120);
}

function onSelectResult(c) {
  searchQuery.value = "";
  searchResults.value = [];
  selectManual(c);
}

function openManualForm() {
  showManualForm.value = true;
  if (searchQuery.value) naturalText.value = searchQuery.value;
  searchQuery.value = "";
  searchResults.value = [];
}

async function submitNatural() {
  if (!naturalText.value.trim() || parsing.value) return;
  parsing.value = true;
  showManualForm.value = false;
  try {
    const r = await api.analyzeNatural(naturalText.value);
    applyReport(r);
  } catch (e) {
    toast(e.message || "AI 解析失败", "err");
    showManualForm.value = true;
  }
  finally { parsing.value = false; }
}

// ---- 拍照 ----
async function openCamera() { cameraOpen.value = true; await nextTick(); await startCamera(); }
async function startCamera() {
  cameraError.value = "";
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    if (videoEl.value) { videoEl.value.srcObject = stream; streamReady.value = true; }
  } catch (e) { cameraError.value = "无法访问摄像头：" + (e.message || "请检查权限设置"); streamReady.value = false; }
}
function stopCamera() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } streamReady.value = false; }
function closeCamera() { stopCamera(); cameraOpen.value = false; }
async function capture() {
  if (!videoEl.value || !streamReady.value) return;
  const v = videoEl.value, c = canvasEl.value;
  c.width = v.videoWidth || 720; c.height = v.videoHeight || 540;
  c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  closeCamera();
  c.toBlob(async (blob) => { const file = new File([blob], "capture.jpg", { type: "image/jpeg" }); await runScan(file, true); }, "image/jpeg", 0.9);
}

// ---- 相册 ----
function pickFile() { fileInput.value?.click(); }
async function onFile(e) { const file = e.target.files?.[0]; if (!file) return; e.target.value = ""; await runScan(file, true); }

// ---- 手动选品 ----
async function selectManual(c) {
  selectedId.value = c.id;
  scanning.value = true;
  previewUrl.value = "";
  try { const r = await api.analyze({ coffeeId: c.id }); applyReport(r); }
  catch (e) { toast("识别失败：" + e.message, "err"); }
  finally { scanning.value = false; }
}

// ---- 扫描主流程 ----
async function runScan(file, withImage) {
  scanning.value = true;
  roastRead.value = false;
  try {
    let imageUrl = "";
    if (withImage) { previewUrl.value = URL.createObjectURL(file); const up = await api.uploadImage(file); imageUrl = up.url; }
    const r = await api.analyze({ imageUrl });
    applyReport(r);
  } catch (e) { toast("识别失败：" + e.message, "err"); }
  finally { scanning.value = false; }
}

function applyReport(r) {
  report.value = r.coffee;
  recs.value = r.recommendations || [];
  refreshToday(); refreshProfile();
  api.history().then(h => { history.value = h; }).catch(() => {});
  toast("识破成功！溢价 " + r.coffee.premiumRate + "%", "ok");
  nextTick(() => { reportRef.value?.scrollIntoView({ behavior: "smooth", block: "start" }); });
}

// ---- 报告 computed ----
const verdictTone = computed(() => {
  const m = { EXTREME: "danger", HIGH: "roast", WARN: "warn", OK: "ok" };
  return m[report.value?.verdictLevel] || "roast";
});

const gaugeColor = computed(() => {
  const r = report.value?.premiumRate || 0;
  if (r >= 500) return "var(--danger)";
  if (r >= 300) return "var(--roast)";
  if (r >= 150) return "var(--warn)";
  return "var(--ok)";
});

const gaugeDash = computed(() => {
  const r = report.value?.premiumRate || 0;
  const level = report.value?.verdictLevel;
  let pct;
  if (level === 'WARN') pct = Math.min(100, Math.max(0, (r - 150) / 150 * 100));
  else pct = Math.min(100, r / 8);
  const circumference = Math.PI * 50;
  return `${circumference * pct / 100} ${circumference}`;
});

const realBarPct = computed(() => {
  if (!report.value) return 50;
  return Math.max(8, Math.min(100, report.value.realCost / report.value.reportedPrice * 100));
});

function layerColor(i) {
  const colors = ["var(--espresso)", "var(--caramel)", "var(--roast)", "var(--foam-2)", "var(--mocha)", "var(--gold)"];
  return colors[i % colors.length];
}

// ---- 成本透视引导线计算 ----
const CUP_TOP = 24, FILL_TOP = 38, CUP_BOTTOM = 118;
const FILL_HEIGHT = CUP_BOTTOM - FILL_TOP;
function leftX(y) {
  return 72 + (y - 24) * (76 - 72) / (118 - 24);
}
function rightX(y) {
  return 128 - (y - 24) * (128 - 124) / (118 - 24);
}
function cupLayerHeight(i) {
  if (!report.value) return 10;
  return (report.value.costBreakdown[i][1] / (report.value.realCost || 1)) * FILL_HEIGHT;
}
function cupLayerTop(i) {
  if (!report.value) return CUP_BOTTOM;
  const items = report.value.costBreakdown;
  const total = report.value.realCost || 1;
  let acc = 0;
  for (let j = items.length - 1; j > i; j--) acc += items[j][1] / total;
  return CUP_BOTTOM - acc * FILL_HEIGHT - cupLayerHeight(i);
}
function cupLayerY(i) { return cupLayerTop(i) + cupLayerHeight(i) / 2; }

// ---- 标签防重叠布局 ----
const LABEL_H = 20;
const LABEL_GAP = 4;
const LABEL_STEP = LABEL_H + LABEL_GAP;
const labelLayout = computed(() => {
  if (!report.value) return {};
  const items = report.value.costBreakdown;
  const sides = { left: [], right: [] };
  items.forEach((_, i) => {
    (i % 2 === 0 ? sides.left : sides.right).push({ i, y: cupLayerY(i) });
  });
  for (const k of ['left', 'right']) {
    const arr = sides[k].sort((a, b) => a.y - b.y);
    for (let j = 1; j < arr.length; j++) {
      const minCy = arr[j - 1].y + LABEL_STEP;
      if (arr[j].y < minCy) arr[j].y = minCy;
    }
    const last = arr[arr.length - 1];
    if (last && last.y > 128) {
      const shift = last.y - 128;
      arr.forEach(o => (o.y -= shift));
    }
  }
  const map = {};
  [...sides.left, ...sides.right].forEach(o => (map[o.i] = o.y));
  return map;
});
function labelCenterY(i) {
  return labelLayout.value[i] ?? cupLayerY(i);
}
function cupLayerPath(i) {
  const topY = cupLayerTop(i);
  const botY = topY + cupLayerHeight(i);
  const xLT = leftX(topY), xRT = rightX(topY);
  const xLB = leftX(botY), xRB = rightX(botY);
  return `M${xLT.toFixed(2)},${topY.toFixed(2)} L${xRT.toFixed(2)},${topY.toFixed(2)} L${xRB.toFixed(2)},${botY.toFixed(2)} L${xLB.toFixed(2)},${botY.toFixed(2)} Z`;
}
function leaderStart(i) {
  const y = cupLayerY(i);
  const isLeft = i % 2 === 0;
  return { x: isLeft ? leftX(y) : rightX(y), y };
}
function leaderPath(i) {
  const start = leaderStart(i);
  const isLeft = i % 2 === 0;
  const elbowX = isLeft ? start.x - 35 : start.x + 35;
  const endX = isLeft ? 8 : 152;
  const cy = labelCenterY(i);
  return `${start.x},${start.y} ${elbowX},${start.y} ${elbowX},${cy} ${endX},${cy}`;
}
function labelBox(i) {
  const cy = labelCenterY(i);
  const isLeft = i % 2 === 0;
  return { x: isLeft ? 2 : 152, y: cy - 10, w: 44, h: 20 };
}
function labelText(i) {
  const b = labelBox(i);
  return { x: b.x + 3, y: b.y + 8 };
}

// ---- 健康警告 ----
const warnings = computed(() => {
  if (!report.value || !state.profile) return [];
  const p = state.profile, c = report.value, w = [];
  if (p.caffeineSensitive && c.caffeineMg > 100) w.push(`咖啡因敏感：本杯 ${c.caffeineMg}mg，建议选低因。`);
  if (p.sugarFree && c.sugarG > 10) w.push(`戒糖中：本杯含糖 ${c.sugarG}g（约 ${Math.round(c.sugarG/4)} 块方糖）。`);
  if (p.pregnant && c.caffeineMg > 80) w.push(`孕期/备孕：咖啡因 ${c.caffeineMg}mg 偏高，每日建议 < 200mg。`);
  if (p.lactoseIntolerant && c.tags.includes("鲜奶")) w.push(`乳糖不耐：本杯含鲜奶，可能引起不适。`);
  if (p.nightOwl) { const hour = new Date().getHours(); if (hour >= 20 && c.caffeineMg > 80) w.push(`夜猫子提醒：晚间摄入 ${c.caffeineMg}mg 咖啡因，可能影响入睡。`); }
  if (today.value.caffeineMg + c.caffeineMg > LIMITS.caffeine) w.push(`今日累计将超 ${LIMITS.caffeine}mg 上限。`);
  if (today.value.sugarG + c.sugarG > LIMITS.sugar) w.push(`今日糖摄入将超 ${LIMITS.sugar}g 上限。`);
  return w;
});

// ---- 历史对比 ----
const prevCompare = computed(() => {
  if (!report.value || history.value.length < 2) return null;
  const cur = report.value;
  const sameId = history.value.find(h => h.coffee_id === cur.id && h.coffee);
  if (sameId && sameId.coffee) { const diff = cur.reportedPrice - sameId.coffee.reportedPrice; return buildCompare("上次同款", sameId.coffee.reportedPrice, sameId.coffee.caffeineMg, diff); }
  const sameBrand = history.value.find(h => h.coffee && h.coffee.brand === cur.brand && h.coffee_id !== cur.id);
  if (sameBrand && sameBrand.coffee) { const diff = cur.reportedPrice - sameBrand.coffee.reportedPrice; return buildCompare("上次同品牌", sameBrand.coffee.reportedPrice, sameBrand.coffee.caffeineMg, diff); }
  return null;
});
function buildCompare(label, price, caffeine, diff) {
  const cls = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const sign = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  const pct = diff !== 0 ? `${Math.abs(Math.round(diff / price * 100))}%` : "持平";
  return { label, price, caffeine, diff, deltaClass: cls, sign, pct };
}

// ---- 毒舌 / 分享 / 重置 ----
function readRoast() { if (!roastRead.value) { roastRead.value = true; refreshProfile(); toast("已解锁毒舌锐评", "ok"); } }
function shareReport() {
  if (navigator.share && report.value) navigator.share({ title: "一杯大实话", text: `${report.value.originalName} · 溢价 ${report.value.premiumRate}%` }).catch(() => {});
  else toast("报告链接已复制（mock）");
}
function resetReport() { report.value = null; roastRead.value = false; previewUrl.value = ""; selectedId.value = null; recs.value = []; }
</script>

<style scoped>
/* ---- 精简数据条 ---- */
.mini-stats { display: flex; align-items: center; gap: 8px; padding: 8px 4vw; background: linear-gradient(180deg, #FCFAF4, #F5EFE3); border: 1px solid var(--foam-2); border-radius: var(--radius); box-shadow: var(--shadow-card); }
.ms-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--caramel); font-weight: 600; }
.ms-sep { width: 1px; height: 12px; background: var(--foam-2); }
.ms-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--latte); }
.ms-dot.on { background: var(--ok); box-shadow: 0 0 4px var(--ok); }

/* ---- 紧凑摄入区 ---- */
.intake-compact { display: flex; justify-content: space-around; align-items: center; padding: 10px 8px; }

/* ---- 质检报告信息分层 ---- */
.report { border: 1px solid var(--foam-2); border-radius: var(--radius-lg); background: linear-gradient(180deg, #FCFAF4 0%, #F8F3E8 100%); box-shadow: var(--shadow-soft), 0 4px 16px rgba(43,30,20,0.06); overflow: hidden; animation: reportIn .4s ease; position: relative; }
.report::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: var(--paper-fiber); opacity: 0.3; border-radius: inherit; }
.report.lv-EXTREME { box-shadow: 0 0 0 2px var(--danger), var(--shadow-soft); }
.report.lv-HIGH { box-shadow: 0 0 0 2px var(--roast), var(--shadow-soft); }
.rp-doc-header { text-align: center; padding: 14px 14px 12px; border-top: 3px solid var(--doc-red); border-bottom: 1px solid var(--doc-red); margin-bottom: 2px; position: relative; z-index: 1; }
.rp-doc-header::after { content: ""; position: absolute; left: 0; right: 0; bottom: 3px; height: 1px; background: var(--doc-red); }
.rp-sec-title { font-family: var(--font); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: var(--caramel); margin-bottom: 10px; display: flex; align-items: center; gap: 5px; position: relative; z-index: 1; }
.rp-sec-danger { color: var(--danger); font-size: 12px; }
/* 次要信息区标题更小更淡 */
.rp-premium .rp-sec-title, .panel-pad:nth-child(n+6) .rp-sec-title { font-size: 10px; color: var(--latte); font-weight: 600; }
.gauge-label { font-family: var(--font); font-size: 9px; color: var(--latte); margin-top: 2px; }
.rp-cover { padding: 16px 14px; position: relative; z-index: 1; }
.rp-corner { position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 24px 24px 0; border-color: transparent var(--foam) transparent transparent; }
.rp-cover-top { display: flex; align-items: center; justify-content: space-between; }
.rp-brand { font-family: var(--mono); font-size: 9px; color: var(--latte); letter-spacing: 0.12em; }
.rp-cover-main { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 10px; }
.rp-name { font-size: 18px; font-size: clamp(16px, 5vw, 22px); font-weight: 800; line-height: 1.25; }
.rp-city { font-family: var(--mono); font-size: 9px; color: var(--mocha); display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.rp-hero-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; padding: 10px 0; border-top: 1px solid var(--foam-2); border-bottom: 1px solid var(--foam-2); }
.rp-hero-premium { display: flex; align-items: baseline; gap: 2px; }
.rp-hp-value { font-family: var(--mono); font-size: 30px; font-size: clamp(26px, 9vw, 36px); font-weight: 900; color: var(--roast); line-height: 1; }
.rp-hp-pct { font-family: var(--mono); font-size: 16px; font-weight: 800; color: var(--roast); }
.rp-hp-label { font-size: 10px; color: var(--latte); margin-left: 8px; font-weight: 600; }
.rp-price-col { text-align: right; }
.rp-price-tag { font-size: 11px; color: var(--mocha); text-decoration: line-through; opacity: 0.7; }
.rp-price-real { font-size: 14px; color: var(--caramel); font-weight: 700; margin-top: 2px; }
.rp-premium { background: var(--cream); }
.gauge-wrap { position: relative; display: flex; justify-content: center; }
.gauge-svg { width: 160px; height: 90px; }
.gauge-arc { transition: stroke-dasharray 0.8s cubic-bezier(.2,.8,.2,1); }
.gauge-center { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); text-align: center; }

/* ---- 溢价率多形态分级 ---- */
.premium-tier { padding: 8px 0; }
.premium-ok { display: flex; align-items: center; gap: 10px; }
.premium-num { font-family: var(--mono); font-size: 28px; font-weight: 900; }
.premium-num.ok { color: var(--ok); }
.premium-num.warn { font-size: 22px; color: var(--warn); }
.premium-num.danger { color: var(--danger); }
.premium-hint { font-size: 10px; color: var(--latte); }
.dual-bar { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; }
.dual-bar-col { height: 28px; background: var(--foam); border-radius: 2px; overflow: hidden; position: relative; }
.dual-bar-bar { height: 100%; display: flex; align-items: center; padding: 0 8px; border-radius: 2px; animation: liquidFill 0.6s ease both; }
.dual-bar-bar.real { background: var(--mocha); color: var(--cream); }
.dual-bar-bar.reported { background: linear-gradient(90deg, var(--roast), var(--danger)); color: #fff; }
.dual-bar-label { font-size: 10px; font-weight: 700; white-space: nowrap; }
.dual-bar-diff { font-size: 12px; color: var(--danger); font-weight: 700; text-align: center; padding: 4px; }
.extreme-stamp-row { display: flex; justify-content: center; margin-bottom: 10px; }
.extreme-gauge {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.gauge-below {
  text-align: center;
  line-height: 1.15;
}
.gauge-below .premium-num { font-size: 26px; }
.extreme-label { color: var(--danger); font-weight: 800; }
.extreme-prices {
  display: flex; justify-content: center; align-items: center; gap: 10px;
  margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--foam-2);
  font-size: 11px; color: var(--mocha);
}
.extreme-prices b { font-family: var(--mono); font-weight: 800; }
.extreme-prices .ep-tag b { color: var(--mocha); }
.extreme-prices .ep-arrow { color: var(--latte); font-size: 10px; }
.extreme-prices .ep-real b { color: var(--danger); }
.extreme-diff {
  text-align: center; font-size: 12px; font-weight: 700; color: var(--danger);
  margin-top: 6px;
}

/* ---- 成分透视 ---- */
.cost-anatomy { display: flex; flex-direction: column; gap: 12px; }
.anatomy-svg { width: 100%; max-width: 280px; margin: 0 auto; display: block; }
.anatomy-layer { animation: liquidFill 0.6s cubic-bezier(.2,.8,.2,1) both; }
.anatomy-nutrition { display: flex; justify-content: space-around; padding: 8px 0; border-top: 1px solid var(--foam-2); border-bottom: 1px solid var(--foam-2); }
.anatomy-recipe { background: var(--foam); border-radius: var(--radius-sm); padding: 8px 10px; counter-reset: recipe-counter; }
.anatomy-recipe-title { font-size: 10px; font-weight: 700; color: var(--caramel); margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
.anatomy-recipe-item { font-size: 11px; color: var(--mocha); line-height: 1.8; padding-left: 22px; position: relative; }
.anatomy-recipe-item::before {
  content: counter(recipe-counter, decimal-leading-zero);
  counter-increment: recipe-counter;
  position: absolute; left: 0; top: 1px;
  font-family: var(--mono); font-size: 8px; font-weight: 700;
  color: var(--caramel); background: var(--cream);
  border: 1px solid var(--foam-2); border-radius: 2px;
  padding: 1px 4px; line-height: 1.3;
}

.rp-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.warn-line { font-size: 12px; color: var(--danger); line-height: 1.5; margin-bottom: 4px; padding-left: 14px; position: relative; }
.warn-line::before { content: "▸"; position: absolute; left: 0; color: var(--danger); }
.rp-roast { cursor: pointer; margin-top: 4px; }
.rp-roast-head { font-family: var(--font); font-size: 12px; font-weight: 700; color: var(--roast); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.rp-roast-sections { }
.roast-sec { margin-bottom: 14px; opacity: 0; animation: revealIn .4s ease forwards; animation-delay: calc(var(--i, 0) * 80ms); }
.roast-sec:last-child { margin-bottom: 0; }
.roast-sec-head { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; letter-spacing: .12em; color: var(--caramel); margin-bottom: 5px; text-transform: uppercase; }
.roast-sec-icon { flex-shrink: 0; }
.roast-sec-text { font-family: var(--serif); font-size: 13px; line-height: 1.75; color: var(--espresso); }
.rp-roast-text { font-family: var(--serif); font-size: 13.5px; line-height: 1.7; color: var(--espresso); }
.rp-roast-blur { user-select: none; }
.rp-roast-teaser { display: flex; flex-wrap: wrap; gap: 6px; }
.roast-teaser-tag { font-family: var(--mono); font-size: 10px; letter-spacing: .1em; padding: 4px 10px; border: 1px solid var(--foam-2); border-radius: var(--radius-pill); color: transparent; text-shadow: 0 0 8px rgba(43,30,20,0.3); }
.rp-roast-teaser-hint { font-family: var(--mono); font-size: 10px; color: transparent; text-shadow: 0 0 8px rgba(43,30,20,0.3); margin-top: 12px; text-align: center; letter-spacing: .1em; }
.rp-rec-hint { font-size: 11px; color: var(--mocha); margin-bottom: 4px; }
.rp-foot { display: flex; gap: 8px; justify-content: flex-end; }

.cam-video-wrap { position: relative; aspect-ratio: 4/3; background: var(--espresso); border-radius: var(--radius); overflow: hidden; }
.cam-video-wrap video { width: 100%; height: 100%; object-fit: cover; }
.cam-err { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #fff; font-size: 12px; }
</style>
