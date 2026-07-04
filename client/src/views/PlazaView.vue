<template>
  <div class="page" data-bg="避坑">
    <!-- 1. 顶部标题区 -->
    <div class="plaza-head">
      <div class="plaza-head-text">
        <div class="h-eyebrow">避坑广场</div>
        <h1 class="h-title">说真话的人<span class="accent">都在这</span></h1>
        <div class="h-sub">这里没有滤镜，只有成分表。每一杯都被拆开过，每一句都是真话。</div>
      </div>
      <button class="btn btn-primary btn-sm" @click="openDrawer">
        <Icon name="plus" :size="14" /> 发帖
      </button>
    </div>

    <!-- 2. 话题分类筛选条 -->
    <div class="picker mt-12">
      <button
        v-for="c in cats"
        :key="c"
        class="chip"
        :class="{ active: c === activeCat }"
        @click="activeCat = c"
      >{{ c }}</button>
    </div>

    <!-- 3. 动态流列表 -->
    <div class="section">
      <div class="section-head">
        <h3>动态流</h3>
        <span class="label"><span class="dot"></span>动态流 · {{ posts.length }} 条</span>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="loading">
        <span class="spinner"></span>
        <span>加载中…</span>
      </div>

      <!-- 空态 -->
      <div v-else-if="!posts.length" class="empty">
        <div class="ico"><Icon name="comment" :size="32" /></div>
        <div>这个分类还没有人发声</div>
        <div style="font-size:9px;letter-spacing:0.1em;margin-top:6px;">来发第一条避坑</div>
      </div>

      <!-- 卡片列表：reveal-group 做 staggered 入场 -->
      <div v-else class="reveal-group">
        <div
          v-for="(p, i) in posts"
          :key="p.id"
          class="feed-card paper-texture"
          :class="{ spotlight: p.spotlight }"
          :style="{ '--i': i }"
          @click="openPostDetail(p)"
        >
          <!-- 头部：用户 + 时间 + 验证印章 -->
          <div class="fc-head">
            <span class="fc-user">{{ p.user }}</span>
            <div class="fc-head-right">
              <Stamp v-if="p.verified" text="已验证" tone="ok" shape="oval" :rotate="-4" />
              <span class="fc-time">{{ p.time }}</span>
            </div>
          </div>

          <!-- 主体：咖啡名 + 聚光印章 + 真相框 -->
          <div class="fc-body">
            <div class="fc-orig-row">
              <div class="fc-orig">{{ p.original }}</div>
              <Stamp v-if="p.spotlight" text="精选" tone="roast" shape="oval" :rotate="3" />
            </div>
            <div class="fc-truth">{{ p.truth }}</div>
          </div>

          <!-- 底部：点赞 / 评论 / 分享 / 溢价率 -->
          <div class="fc-foot">
            <div class="row gap-10">
              <button
                class="fc-stat"
                :class="{ liked: p.liked }"
                @click.stop="like(p)"
                :aria-label="p.liked ? '取消点赞' : '点赞'"
              >
                <Icon
                  name="heart"
                  :size="14"
                  :solid="p.liked"
                  :style="p.liked ? { animation: 'heartPop 0.2s ease' } : null"
                />
                <span>{{ p.likes }}</span>
              </button>
              <span class="fc-stat">
                <Icon name="comment" :size="14" />
                <span>{{ p.comments }}</span>
              </span>
              <button class="fc-stat" @click.stop="share(p)" aria-label="分享">
                <Icon name="share" :size="14" />
              </button>
            </div>
            <span v-if="p.premium > 0" class="tag tag-up">
              <Icon name="gauge" :size="10" /> +{{ Math.round(p.premium) }}% 溢价
            </span>
            <span v-else class="tag tag-soft">
              <Icon name="gauge" :size="10" /> 平价
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 发帖抽屉 -->
    <template v-if="drawerOpen">
      <div class="drawer-mask" @click="closeDrawer"></div>
      <div class="drawer">
        <div class="drawer-head">
          <div>
            <div class="h-eyebrow">发布避坑</div>
            <h3>拆一杯，救一片</h3>
          </div>
          <button class="iconbtn" @click="closeDrawer" aria-label="关闭">
            <Icon name="close" :size="16" />
          </button>
        </div>

        <div class="drawer-body">
          <div class="field">
            <label>品类</label>
            <select v-model="form.cat">
              <option v-for="c in postCats" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="field">
            <label>咖啡名</label>
            <input v-model="form.original" placeholder="「东京雨夜」樱花苏打美式" maxlength="40" />
          </div>

          <div class="field">
            <label>真相拆解</label>
            <textarea v-model="form.truth" rows="3" maxlength="140"
              placeholder="苏打水 + 浓缩 + 草莓糖浆 + 樱花粉色素。"></textarea>
          </div>

          <div class="grid-2">
            <div class="field">
              <label>标价 ¥</label>
              <input v-model="form.price" type="number" min="0" step="1" placeholder="36" />
            </div>
            <div class="field">
              <label>实付 ¥</label>
              <input v-model="form.real" type="number" min="0" step="0.1" placeholder="5.2" />
            </div>
          </div>

          <div class="field">
            <label>溢价率 % <span class="muted">（留空自动计算）</span></label>
            <input v-model="form.premium" type="number" min="0" step="1" placeholder="自动计算" />
            <div v-if="form.premium === '' && previewPremium !== null" class="prem-preview">
              <Stamp
                :text="`预览 ${previewPremium}%`"
                :tone="previewPremium > 0 ? 'roast' : 'ok'"
                shape="oval"
                :rotate="-3"
              />
            </div>
          </div>

          <button
            class="btn btn-accent btn-block mt-16"
            :disabled="submitting"
            @click="submit"
          >{{ submitting ? '发布中…' : '提交质检报告' }}</button>
        </div>
      </div>
    </template>

    <!-- 5. 帖子详情抽屉 -->
    <div v-if="postDetail" class="drawer-mask" @click="closePostDetail"></div>
    <div v-if="postDetail" class="drawer">
      <div class="row-between" style="padding:14px 14px 0">
        <span class="h-eyebrow">详情</span>
        <button class="iconbtn" @click="closePostDetail"><Icon name="close" :size="14" /></button>
      </div>
      <div style="padding:12px 14px">
        <div class="pd-user">{{ postDetail.user }}</div>
        <div class="pd-cat chip soft">{{ postDetail.cat }}</div>
        <div class="pd-original serif" style="font-size:16px;font-weight:700;margin-top:8px">{{ postDetail.original }}</div>
        <div class="pd-truth" style="margin-top:12px;padding:10px;border-left:3px solid var(--roast);background:rgba(255,245,217,0.6);border-radius:0 var(--radius) var(--radius) 0;font-size:13px;line-height:1.6">{{ postDetail.truth }}</div>
        <div class="pd-stats row gap-12 mt-12">
          <span><Icon name="coins" :size="12" /> 标价 ¥{{ postDetail.price }}</span>
          <span><Icon name="gauge" :size="12" /> 溢价 {{ postDetail.premium }}%</span>
        </div>
        <div class="pd-actions row gap-8 mt-12">
          <button class="btn btn-sm" :class="{ 'btn-accent': postDetail.liked }" @click.stop="likePost(postDetail)">
            <Icon :name="postDetail.liked ? 'heart-solid' : 'heart'" :size="12" /> {{ postDetail.likes }}
          </button>
          <button class="btn btn-sm" @click="sharePost(postDetail)"><Icon name="share" :size="12" /> 分享</button>
        </div>

        <!-- 快捷评价 -->
        <div class="pd-rating mt-12">
          <div class="pd-rating-label">快捷评价</div>
          <div class="pd-rating-tags">
            <button v-for="r in quickRatings" :key="r.tag" class="chip" :class="{ active: myRating === r.tag }" @click="setRating(r.tag)">{{ r.icon }} {{ r.tag }}</button>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="pd-comments mt-12">
          <div class="pd-comments-head">评论 {{ comments.length }}</div>
          <div v-if="comments.length" class="pd-comments-list">
            <div v-for="c in comments" :key="c.id" class="pd-comment">
              <div class="pd-comment-user">{{ c.user }} <span v-if="c.rating" class="pd-comment-rating">{{ c.rating }}</span></div>
              <div class="pd-comment-text">{{ c.content }}</div>
              <div class="pd-comment-time">{{ formatTime(c.created_at) }}</div>
            </div>
          </div>
          <div v-else class="pd-comments-empty">还没有评论，来说点什么</div>
          <div class="pd-comment-input">
            <input v-model="commentText" placeholder="说点什么…" @keydown.enter="sendComment" />
            <button class="btn btn-sm btn-accent" @click="sendComment" :disabled="!commentText.trim()">发送</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { api } from "../api/index.js";
import { useStore } from "../stores/app.js";
import Icon from "../components/Icon.vue";
import Stamp from "../components/Stamp.vue";

const { toast, meta: storeMeta } = useStore();

// ---- 分类 ----
const DEFAULT_CATS = ["全部", "美式", "拿铁", "特调", "抹茶", "果咖"];
const cats = computed(() =>
  storeMeta.value && storeMeta.value.cats && storeMeta.value.cats.length
    ? storeMeta.value.cats
    : DEFAULT_CATS
);
const postCats = computed(() => cats.value.filter(c => c !== "全部"));
const activeCat = ref("全部");

// ---- 列表 ----
const posts = ref([]);
const loading = ref(false);

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const hm = `${hh}:${mm}`;
  if (d.toDateString() === now.toDateString()) return `今天 ${hm}`;
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `昨天 ${hm}`;
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return `${diffDays}天前 ${hm}`;
  if (diffDays < 14) return `1周前 ${hm}`;
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, "0")} ${hm}`;
}

// 归一化后端字段：DB 列 real_cost/created_at -> 组件期望 real/time
function normalize(p) {
  return {
    ...p,
    real: p.real != null ? p.real : (p.real_cost != null ? p.real_cost : 0),
    time: p.time || formatTime(p.created_at),
    premium: p.premium != null ? Number(p.premium) : 0,
    likes: p.likes != null ? Number(p.likes) : 0,
    comments: p.comments != null ? Number(p.comments) : 0,
    price: p.price != null ? Number(p.price) : 0,
    verified: !!p.verified,
    spotlight: !!p.spotlight,
    liked: !!p.liked
  };
}

async function loadPosts() {
  loading.value = true;
  try {
    const cat = activeCat.value === "全部" ? "" : activeCat.value;
    const list = await api.plaza(cat);
    posts.value = (list || []).map(normalize);
  } catch (e) {
    toast(e.message || "动态流加载失败", "err");
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

// ---- 筛选切换 ----
watch(activeCat, () => loadPosts());
onMounted(loadPosts);

// ---- 点赞（乐观更新）----
async function like(p) {
  const wasLiked = p.liked;
  // 乐观更新本地状态
  p.liked = !wasLiked;
  p.likes += wasLiked ? -1 : 1;
  if (p.likes < 0) p.likes = 0;
  try {
    const res = await api.likePost(p.id);
    p.liked = !!res.liked;
    p.likes = Number(res.likes) || 0;
  } catch (e) {
    // 回滚
    p.liked = wasLiked;
    p.likes += wasLiked ? 1 : -1;
    if (p.likes < 0) p.likes = 0;
    toast("点赞操作失败", "err");
  }
}

// ---- 分享（轻量 UI 行为，无后端调用）----
async function share(p) {
  const text = `${p.original} · ${p.truth}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: p.original, text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast("已复制到剪贴板", "ok");
    } else {
      toast("当前环境不支持分享", "err");
    }
  } catch (e) {
    if (e && e.name !== "AbortError") toast("分享失败", "err");
  }
}

// ---- 帖子详情抽屉 ----
const postDetail = ref(null);
const comments = ref([]);
const commentText = ref("");
const myRating = ref("");
const quickRatings = [
  { tag: "避坑推荐", icon: "🔥" },
  { tag: "溢价离谱", icon: "💰" },
  { tag: "口感不错", icon: "👍" },
  { tag: "名不副实", icon: "👎" },
  { tag: "智商税", icon: "⚠️" }
];

async function openPostDetail(p) {
  postDetail.value = p;
  comments.value = [];
  commentText.value = "";
  myRating.value = "";
  try {
    comments.value = await api.getComments(p.id);
  } catch (e) { /* 静默失败 */ }
}
function closePostDetail() { postDetail.value = null; }
// 复用 like / share，给详情抽屉使用统一命名
const likePost = like;
const sharePost = share;

function setRating(tag) {
  myRating.value = myRating.value === tag ? "" : tag;
}

async function sendComment() {
  if (!commentText.value.trim() || !postDetail.value) return;
  const content = commentText.value.trim();
  const rating = myRating.value;
  commentText.value = "";
  try {
    const c = await api.addComment(postDetail.value.id, { content, rating });
    comments.value = [c, ...comments.value];
    if (postDetail.value.comments != null) postDetail.value.comments++;
    toast("评论成功", "ok");
  } catch (e) {
    toast(e.message || "评论失败", "err");
    commentText.value = content;
  }
}

// ---- 发帖抽屉 ----
const drawerOpen = ref(false);
const submitting = ref(false);
const form = reactive({
  cat: "特调",
  original: "",
  truth: "",
  price: "",
  real: "",
  premium: ""
});

// 实时溢价率预览：填了标价 + 实付且未手填溢价率时计算
const previewPremium = computed(() => {
  if (form.price === "" || form.real === "") return null;
  const price = Number(form.price);
  const real = Number(form.real);
  if (!price || !real || isNaN(price) || isNaN(real)) return null;
  return Math.round(((price - real) / real) * 100);
});

function openDrawer() {
  drawerOpen.value = true;
}
function closeDrawer() {
  drawerOpen.value = false;
}
function resetForm() {
  form.cat = postCats.value[0] || "特调";
  form.original = "";
  form.truth = "";
  form.price = "";
  form.real = "";
  form.premium = "";
}

async function submit() {
  if (!form.original.trim() || !form.truth.trim()) {
    toast("请填写咖啡名与真相拆解", "err");
    return;
  }
  const price = Number(form.price) || 0;
  const real = Number(form.real) || 0;
  // 溢价率留空则前端计算
  let premium = form.premium === "" ? null : Number(form.premium);
  if (premium === null && price > 0 && real > 0) {
    premium = Math.round(((price - real) / real) * 100);
  }

  submitting.value = true;
  try {
    await api.createPost({
      cat: form.cat,
      original: form.original.trim(),
      truth: form.truth.trim(),
      price,
      real,
      premium: premium != null ? premium : 0
    });
    toast("已发布到避坑广场", "ok");
    closeDrawer();
    resetForm();
    await loadPosts();
  } catch (e) {
    toast(e.message || "发布失败", "err");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
/* tokens.css 已提供 .field / .feed-card / .chip / .btn / .drawer 等样式，
   此处仅补充本页布局微调，不再覆盖表单圆角（交由 tokens.css 统一圆角化）。 */
.plaza-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.plaza-head-text { flex: 1; min-width: 0; }

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--rule-soft);
}
.drawer-head h3 { font-size: 15px; margin-top: 4px; }
.drawer-body { padding: 14px 16px 18px; }

/* 验证印章 + 时间 右侧组合 */
.fc-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 聚光印章贴在咖啡名旁 */
.fc-orig-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.fc-orig-row .fc-orig { flex: 1; min-width: 0; }

/* 溢价率预览印章 */
.prem-preview { margin-top: 8px; }

/* ============ 便签纸风格 feed-card ============ */
.feed-card {
  position: relative;
  overflow: visible; /* 让顶部胶带露出 */
  background: linear-gradient(180deg, #FFF9E6 0%, #FFF5D9 100%);
  border: 1px solid rgba(184,144,46,0.15);
  box-shadow: 0 2px 6px rgba(43,30,20,0.08), inset 0 1px 0 rgba(255,255,255,0.5);
  margin-top: 14px; /* 给顶部胶带留出呼吸空间 */
  cursor: pointer;
}
/* 轻微旋转：奇偶交错。
   用独立 rotate 属性而非 transform，避免被 .reveal-group 的入场动画
   （revealIn 终点 transform:none）覆盖。 */
.feed-card:nth-child(odd)  { rotate: -0.8deg; }
.feed-card:nth-child(even) { rotate: 0.8deg; }

/* 顶部胶带：半透明黄色矩形 */
.feed-card::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 14px;
  background: rgba(255,235,180,0.5);
  border: 1px solid rgba(184,144,46,0.18);
  border-radius: 1px;
  box-shadow: 0 1px 2px rgba(43,30,20,0.08);
  z-index: 2; /* 压在纸纹 ::after 之上 */
  pointer-events: none;
}

/* 聚光卡片：保留旋转，加强边框 */
.feed-card.spotlight {
  border-color: var(--roast);
  box-shadow: 0 0 0 1px var(--roast), 0 2px 6px rgba(43,30,20,0.10), inset 0 1px 0 rgba(255,255,255,0.5);
}

/* 真相框：保留左侧强调色，换更暖的背景 */
.feed-card .fc-truth {
  background: rgba(255,245,217,0.6);
  border-left: 3px solid var(--roast);
}

/* 中文标签可读性：eyebrow / section label 改用正文字体，字距收窄。
   var(--mono) 仅保留给数字/数据值（fc-time / fc-stat 等）。 */
.h-eyebrow { font-family: var(--font); letter-spacing: 0.1em; }
.section-head .label { font-family: var(--font); letter-spacing: 0.08em; }

/* ============ 帖子详情抽屉 ============ */
.pd-user { font-size: 13px; font-weight: 700; color: var(--espresso); }
.pd-cat { margin-top: 4px; }
.pd-original { color: var(--espresso); }

/* ============ 快捷评价 + 评论 ============ */
.pd-rating-label { font-size: 11px; font-weight: 700; color: var(--caramel); margin-bottom: 6px; }
.pd-rating-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pd-rating-tags .chip.active { background: linear-gradient(180deg, #8A5530, #7A4A24); color: var(--cream); border-color: var(--caramel); }

.pd-comments-head { font-size: 12px; font-weight: 700; color: var(--mocha); margin-bottom: 8px; }
.pd-comments-list { max-height: 240px; overflow-y: auto; }
.pd-comment { padding: 8px 0; border-bottom: 1px solid var(--foam-2); }
.pd-comment:last-child { border-bottom: none; }
.pd-comment-user { font-size: 11px; font-weight: 700; color: var(--espresso); display: flex; align-items: center; gap: 6px; }
.pd-comment-rating { font-size: 9px; color: var(--roast); background: var(--foam); padding: 1px 6px; border-radius: 2px; }
.pd-comment-text { font-size: 12px; color: var(--mocha); line-height: 1.5; margin-top: 3px; }
.pd-comment-time { font-size: 9px; color: var(--latte); margin-top: 3px; }
.pd-comments-empty { font-size: 12px; color: var(--latte); padding: 12px 0; text-align: center; }
.pd-comment-input { display: flex; gap: 6px; margin-top: 8px; }
.pd-comment-input input { flex: 1; padding: 8px 10px; border: 1px solid var(--foam-2); border-radius: var(--radius-sm); font-size: 12px; background: var(--cream); }
.pd-comment-input input:focus { outline: none; border-color: var(--caramel); }

/* ===== 桌面端：双列动态流 ===== */
@media (min-width: 1024px) {
  .plaza-head { align-items: center; }
  .reveal-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px 16px;
  }
  .reveal-group > .feed-card { margin-top: 0; }
  .reveal-group > .feed-card.spotlight { grid-column: 1 / -1; }
}
</style>
