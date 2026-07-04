/**
 * 质检报告分享卡 composable（Canvas 2D，无外部依赖）
 *
 * drawReportCard(canvas, report)  在传入 canvas 上绘制 1080×1920 报告卡，返回 PNG Blob
 * shareReportCard(report)         自动建 canvas 绘制，调用 navigator.share 分享图片文件，
 *                                  不支持时回退为下载。
 *
 * report 字段（与项目 mock 一致）：
 *   { originalName, brand, city, reportedPrice, realCost, premiumRate,
 *     caffeineMg, sugarG, kcal, verdict, verdictLevel, costBreakdown:[[name,cost]...], roast? }
 */

// ---- 字体栈（与 tokens.css 对齐） ----
const FONT_SANS = '"DM Sans","Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif';
const FONT_SERIF = '"Fraunces","Noto Serif SC","Source Han Serif","Songti SC",serif';
const FONT_MONO = '"JetBrains Mono","SF Mono","Menlo","Consolas",monospace';

// ---- 配色（取自 tokens.css） ----
const C = {
  oat: "#F4F2EC",      // 卡片底色 燕麦白（任务指定）
  cream: "#FCFAF4",
  foam: "#EDE4D3",
  foam2: "#E2D7C2",
  espresso: "#2B1E14",
  mocha: "#5C4A3A",
  latte: "#9A8B78",
  caramel: "#7A4A24",
  roast: "#D2702B",
  danger: "#B23A2E",
  docRed: "#A03028",
  gold: "#B8902E",
  ok: "#5B7A3D",
  warn: "#C8841F"
};

// 成本拆解配色循环
const COST_COLORS = [C.espresso, C.caramel, C.roast, C.gold, C.mocha, C.latte];

/** verdict 等级 -> 主色 */
function verdictColor(level) {
  return { EXTREME: C.danger, HIGH: C.roast, WARN: C.warn, OK: C.ok }[level] || C.roast;
}

// ---- Canvas 小工具 ----
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 中文/英文混排自动换行，返回行数组 */
function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const lines = [];
  let line = "";
  for (const ch of String(text)) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * 在 canvas 上绘制 1080×1920 质检报告卡
 * @param {HTMLCanvasElement} canvas
 * @param {object} report
 * @returns {Promise<Blob|null>} PNG blob
 */
export function drawReportCard(canvas, report) {
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1920;
  const PAD = 80;
  const CW = W - PAD * 2; // 内容宽

  // ===== 1. 底色 + 纸纹 =====
  ctx.fillStyle = C.oat;
  ctx.fillRect(0, 0, W, H);
  // 极淡斜向纸纹
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = C.mocha;
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
  // 散点噪点
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = C.mocha;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 700; i++) {
    ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  }
  ctx.restore();

  // ===== 2. 公文红头 =====
  ctx.fillStyle = C.docRed;
  ctx.fillRect(0, 0, W, 8);
  ctx.fillRect(PAD, 250, CW, 3);
  ctx.fillRect(PAD, 256, CW, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.font = `600 22px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText("COFFEESPIT · 一杯大实话", W / 2, 92);

  ctx.font = `800 76px ${FONT_SERIF}`;
  ctx.fillStyle = C.docRed;
  ctx.fillText("质检报告", W / 2, 172);

  ctx.font = `500 26px ${FONT_SANS}`;
  ctx.fillStyle = C.mocha;
  ctx.fillText("咖啡品质检测与溢价分析", W / 2, 210);

  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const noStr = `CS-${(Date.now().toString(36).slice(-5)).toUpperCase()}`;
  ctx.font = `500 20px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText(`编号 ${noStr} · 日期 ${dateStr}`, W / 2, 238);

  // ===== 3. 封面：印章 + 品牌 + 咖啡名 + 城市 =====
  // 印章（verdict）
  const vColor = verdictColor(report.verdictLevel);
  ctx.save();
  ctx.translate(PAD + 90, 320);
  ctx.rotate(-3 * Math.PI / 180);
  ctx.fillStyle = vColor;
  ctx.strokeStyle = vColor;
  ctx.lineWidth = 3;
  roundRect(ctx, -90, -34, 180, 68, 4);
  ctx.globalAlpha = 0.1;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.font = `800 30px ${FONT_SERIF}`;
  ctx.fillStyle = vColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(report.verdict || "溢价警告", 0, 2);
  ctx.restore();

  // 品牌（右上）
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 30px ${FONT_SANS}`;
  ctx.fillStyle = C.mocha;
  ctx.fillText(report.brand || "—", W - PAD, 326);

  // 咖啡名（衬体，居中，自动换行）
  ctx.textAlign = "center";
  ctx.font = `700 56px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  const nameLines = wrapText(ctx, (report.originalName || "").replace(/「|」/g, ""), CW - 80);
  let nameY = 440;
  for (const ln of nameLines.slice(0, 3)) {
    ctx.fillText(ln, W / 2, nameY);
    nameY += 72;
  }

  // 城市
  ctx.font = `500 28px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText(`📍 ${report.city || ""}`, W / 2, nameY + 24);

  // 分隔虚线
  ctx.save();
  ctx.strokeStyle = C.foam2;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(PAD, nameY + 64);
  ctx.lineTo(W - PAD, nameY + 64);
  ctx.stroke();
  ctx.restore();

  // ===== 4. 溢价率 Hero =====
  const heroY = nameY + 64 + 40;
  ctx.textAlign = "center";
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText("溢 价 率", W / 2, heroY);

  ctx.font = `800 200px ${FONT_SERIF}`;
  ctx.fillStyle = vColor;
  const premText = `+${report.premiumRate ?? 0}`;
  ctx.fillText(premText, W / 2, heroY + 170);

  ctx.font = `700 60px ${FONT_SERIF}`;
  ctx.fillStyle = vColor;
  // 百分号紧贴数字右侧
  const premW = ctx.measureText(premText).width;
  ctx.textAlign = "left";
  ctx.fillText("%", W / 2 + premW / 2 + 8, heroY + 170);

  // 价格两栏
  const priceY = heroY + 230;
  ctx.textAlign = "center";
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText("标价", W / 2 - 200, priceY);
  ctx.fillText("实付", W / 2 + 200, priceY);
  ctx.font = `800 44px ${FONT_MONO}`;
  ctx.fillStyle = C.espresso;
  ctx.fillText(`¥${report.reportedPrice ?? 0}`, W / 2 - 200, priceY + 48);
  ctx.fillStyle = C.caramel;
  ctx.fillText(`¥${report.realCost ?? 0}`, W / 2 + 200, priceY + 48);

  // 多付
  const diff = ((report.reportedPrice || 0) - (report.realCost || 0)).toFixed(1);
  ctx.font = `700 26px ${FONT_MONO}`;
  ctx.fillStyle = C.danger;
  ctx.fillText(`多付 ¥${diff}`, W / 2, priceY + 90);

  // ===== 5. 成本拆解条 =====
  const barY = priceY + 140;
  ctx.textAlign = "left";
  ctx.font = `700 32px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  ctx.fillText("成本拆解", PAD, barY);
  ctx.textAlign = "right";
  ctx.font = `500 20px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText(`实付 ¥${report.realCost ?? 0}`, W - PAD, barY);

  // 堆叠条
  const barX = PAD, barW = CW, barH = 40, barTop = barY + 24;
  const total = report.costBreakdown?.reduce((s, r) => s + (r[1] || 0), 0) || (report.realCost || 1);
  // 底槽
  roundRect(ctx, barX, barTop, barW, barH, 6);
  ctx.fillStyle = C.foam;
  ctx.fill();
  // 分段
  let acc = 0;
  (report.costBreakdown || []).forEach((row, i) => {
    const segW = ((row[1] || 0) / total) * barW;
    if (segW <= 0) return;
    const col = COST_COLORS[i % COST_COLORS.length];
    ctx.fillStyle = col;
    const isFirst = acc === 0;
    const isLast = acc + segW >= barW - 0.5;
    roundRect(ctx, barX + acc, barTop, segW + (isLast ? 0 : 0), barH, isFirst ? 6 : 0);
    ctx.save();
    // 用裁剪让中间段不超出圆角
    ctx.beginPath();
    ctx.rect(barX + acc, barTop, segW, barH);
    ctx.clip();
    ctx.fillRect(barX + acc, barTop, segW, barH);
    ctx.restore();
    acc += segW;
  });
  // 边框
  roundRect(ctx, barX, barTop, barW, barH, 6);
  ctx.strokeStyle = C.foam2;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 图例
  let legY = barTop + barH + 30;
  const legColW = CW / 2;
  (report.costBreakdown || []).forEach((row, i) => {
    const col = i < 2 ? 0 : 1;
    const rowIdx = Math.floor(i / 2);
    const lx = PAD + (i % 2) * legColW;
    const ly = legY + rowIdx * 44;
    if (ly > H - 320) return; // 防溢出
    ctx.fillStyle = COST_COLORS[i % COST_COLORS.length];
    roundRect(ctx, lx, ly - 16, 18, 18, 3);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 24px ${FONT_SANS}`;
    ctx.fillStyle = C.espresso;
    ctx.fillText(row[0], lx + 28, ly - 7);
    ctx.font = `700 24px ${FONT_MONO}`;
    ctx.fillStyle = C.caramel;
    ctx.fillText(`¥${row[1]}`, lx + 28, ly + 16);
    ctx.textBaseline = "alphabetic";
  });

  // ===== 6. 营养三栏 =====
  const nutTop = legY + Math.ceil((report.costBreakdown || []).length / 2) * 44 + 30;
  const cellW = CW / 3;
  const nutH = 150;
  const items = [
    { k: "咖啡因", v: report.caffeineMg ?? 0, u: "mg" },
    { k: "糖", v: report.sugarG ?? 0, u: "g" },
    { k: "热量", v: report.kcal ?? 0, u: "kcal" }
  ];
  items.forEach((it, i) => {
    const cx = PAD + i * cellW;
    roundRect(ctx, cx + 6, nutTop, cellW - 12, nutH, 8);
    ctx.fillStyle = i === 0 ? "#FFF" : C.cream;
    ctx.fill();
    ctx.strokeStyle = C.foam2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = `500 22px ${FONT_MONO}`;
    ctx.fillStyle = C.latte;
    ctx.fillText(it.k, cx + cellW / 2, nutTop + 44);
    ctx.font = `800 52px ${FONT_MONO}`;
    ctx.fillStyle = C.espresso;
    ctx.fillText(String(it.v), cx + cellW / 2, nutTop + 100);
    ctx.font = `500 22px ${FONT_MONO}`;
    ctx.fillStyle = C.latte;
    ctx.fillText(it.u, cx + cellW / 2, nutTop + 130);
  });

  // ===== 7. AI 深度解析摘要 =====
  const aiTop = nutTop + nutH + 36;
  ctx.textAlign = "left";
  ctx.font = `700 30px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  ctx.fillText("AI 深度解析", PAD, aiTop);
  // 取第一段 roast 文本
  let aiText = "";
  if (Array.isArray(report.roast) && report.roast.length) {
    aiText = report.roast[0].text || "";
  } else if (typeof report.roast === "string") {
    aiText = report.roast;
  }
  ctx.font = `500 26px ${FONT_SANS}`;
  ctx.fillStyle = C.mocha;
  const aiLines = wrapText(ctx, aiText, CW).slice(0, 2);
  let aiY = aiTop + 40;
  for (const ln of aiLines) {
    ctx.fillText(ln, PAD, aiY);
    aiY += 38;
  }

  // ===== 8. 底部：QR 占位 + 落款 =====
  const footY = H - 150;
  // QR 占位
  drawQRPlaceholder(ctx, PAD, footY - 30, 130, report.originalName || "coffeespit");
  // 文案
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `700 30px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  ctx.fillText("扫码查看完整报告", PAD + 150, footY - 20);
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText("一杯大实话 · CoffeeSpit", PAD + 150, footY + 22);
  ctx.textBaseline = "alphabetic";

  // 底部红条
  ctx.fillStyle = C.docRed;
  ctx.fillRect(0, H - 8, W, 8);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * 伪二维码占位（仅视觉，不可扫）
 */
function drawQRPlaceholder(ctx, x, y, size, seedStr) {
  const modules = 25;
  // 卡片底
  roundRect(ctx, x, y, size, size, 8);
  ctx.fillStyle = C.cream;
  ctx.fill();
  ctx.strokeStyle = C.foam2;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const pad = 8;
  const inner = size - pad * 2;
  const cell = inner / modules;
  const ox = x + pad, oy = y + pad;

  // 确定性随机
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rand = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };

  ctx.fillStyle = C.espresso;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // 跳过三个定位角
      if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
      if (rand() > 0.55) ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.5, cell + 0.5);
    }
  }
  // 三个定位图案
  const drawFinder = (fx, fy) => {
    ctx.fillStyle = C.espresso;
    ctx.fillRect(fx, fy, 7 * cell, 7 * cell);
    ctx.fillStyle = C.cream;
    ctx.fillRect(fx + cell, fy + cell, 5 * cell, 5 * cell);
    ctx.fillStyle = C.espresso;
    ctx.fillRect(fx + 2 * cell, fy + 2 * cell, 3 * cell, 3 * cell);
  };
  drawFinder(ox, oy);
  drawFinder(ox + (modules - 7) * cell, oy);
  drawFinder(ox, oy + (modules - 7) * cell);
}

/**
 * 生成报告卡并调用系统分享；不支持文件分享时回退为下载。
 * @param {object} report
 * @returns {Promise<boolean>} 是否走了系统分享（true=分享，false=下载回退）
 */
export async function shareReportCard(report) {
  const canvas = document.createElement("canvas");
  const blob = await drawReportCard(canvas, report);
  if (!blob) return false;

  const file = new File([blob], "coffeespit-report.png", { type: "image/png" });
  const shareData = {
    title: "一杯大实话 · 质检报告",
    text: `${report.originalName || ""} · 溢价 ${report.premiumRate ?? 0}%`
  };

  // 优先：原生文件分享
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ ...shareData, files: [file] });
      return true;
    } catch (e) {
      // 用户取消或失败 -> 回退下载
      if (e && e.name === "AbortError") return false;
    }
  }

  // 次选：仅文本分享
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (e) { /* ignore */ }
  }

  // 兜底：下载图片
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coffeespit-report.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return false;
}

/**
 * 在 canvas 上绘制 1080×1350 AI 喜好印象分享卡
 * @param {HTMLCanvasElement} canvas
 * @param {object} data { impression, keywords[], nickname, deviceId, personality:{tag} }
 * @returns {Promise<Blob|null>} PNG blob
 */
export function drawImpressionCard(canvas, data) {
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  const W = 1080, H = 1350;
  const PAD = 80;
  const CW = W - PAD * 2;

  // 1. 底色 + 纸纹
  ctx.fillStyle = C.oat;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = C.mocha;
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = C.mocha;
  let seed = 2024;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 500; i++) ctx.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  ctx.restore();

  // 2. 公文红头
  ctx.fillStyle = C.docRed;
  ctx.fillRect(0, 0, W, 8);
  ctx.fillRect(PAD, 230, CW, 3);
  ctx.fillRect(PAD, 236, CW, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 22px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText("COFFEESPIT · 喜好印象", W / 2, 88);

  ctx.font = `800 72px ${FONT_SERIF}`;
  ctx.fillStyle = C.docRed;
  ctx.fillText("AI 咖啡画像", W / 2, 162);

  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const noStr = `CS-${(Date.now().toString(36).slice(-5)).toUpperCase()}`;
  ctx.font = `500 20px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText(`编号 ${noStr} · 日期 ${dateStr}`, W / 2, 218);

  // 3. 左上角蜡封印章（人格 tag）
  const tag = data.personality?.tag || "品鉴官";
  ctx.save();
  ctx.translate(PAD + 90, 310);
  ctx.rotate(-3 * Math.PI / 180);
  ctx.fillStyle = C.roast;
  ctx.strokeStyle = C.roast;
  ctx.lineWidth = 3;
  roundRect(ctx, -90, -34, 180, 68, 4);
  ctx.globalAlpha = 0.1;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.font = `800 26px ${FONT_SERIF}`;
  ctx.fillStyle = C.roast;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tag.slice(0, 5), 0, 2);
  ctx.restore();

  // 4. 右上昵称 + 设备编号
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 30px ${FONT_SANS}`;
  ctx.fillStyle = C.mocha;
  ctx.fillText(data.nickname || "匿名品鉴官", W - PAD, 300);
  ctx.font = `500 20px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText(`ID ${String(data.deviceId || "").slice(-6)}`, W - PAD, 330);

  // 分隔虚线
  ctx.save();
  ctx.strokeStyle = C.foam2;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(PAD, 380);
  ctx.lineTo(W - PAD, 380);
  ctx.stroke();
  ctx.restore();

  // 5. 印象正文
  ctx.textAlign = "left";
  ctx.font = `600 30px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  ctx.fillText("你的咖啡喜好印象", PAD, 440);

  ctx.font = `500 30px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  const impLines = wrapText(ctx, data.impression || "", CW);
  let impY = 500;
  for (const ln of impLines.slice(0, 9)) {
    ctx.fillText(ln, PAD, impY);
    impY += 46;
  }

  // 6. 关键词标签
  const tagTop = Math.max(impY + 30, 980);
  ctx.font = `600 24px ${FONT_SANS}`;
  ctx.textBaseline = "middle";
  const keywords = data.keywords || [];
  let tx = PAD, ty = tagTop;
  keywords.slice(0, 8).forEach((kw) => {
    const tw = ctx.measureText(kw).width + 40;
    if (tx + tw > W - PAD) { tx = PAD; ty += 56; }
    roundRect(ctx, tx, ty - 22, tw, 44, 4);
    ctx.fillStyle = C.cream;
    ctx.fill();
    ctx.strokeStyle = C.roast;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.roast;
    ctx.textAlign = "center";
    ctx.fillText(kw, tx + tw / 2, ty);
    tx += tw + 16;
  });
  ctx.textBaseline = "alphabetic";

  // 7. 底部 QR 占位 + 落款 + 红条
  const footY = H - 130;
  drawQRPlaceholder(ctx, PAD, footY - 20, 120, data.deviceId || "coffeespit");
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `700 28px ${FONT_SERIF}`;
  ctx.fillStyle = C.espresso;
  ctx.fillText("扫码生成你的画像", PAD + 140, footY - 10);
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.fillStyle = C.latte;
  ctx.fillText("一杯大实话 · CoffeeSpit", PAD + 140, footY + 28);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = C.docRed;
  ctx.fillRect(0, H - 8, W, 8);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * 生成 AI 印象卡并调用系统分享；不支持文件分享时回退为下载。
 * @param {object} data { impression, keywords, nickname, deviceId, personality }
 * @returns {Promise<boolean>} 是否走了系统分享
 */
export async function shareImpressionCard(data) {
  const canvas = document.createElement("canvas");
  const blob = await drawImpressionCard(canvas, data);
  if (!blob) return false;

  const file = new File([blob], "coffeespit-impression.png", { type: "image/png" });
  const shareData = {
    title: "一杯大实话 · AI 咖啡画像",
    text: data.impression || "我的咖啡喜好印象"
  };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ ...shareData, files: [file] });
      return true;
    } catch (e) {
      if (e && e.name === "AbortError") return false;
    }
  }
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (e) { /* ignore */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coffeespit-impression.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return false;
}

export default { drawReportCard, shareReportCard, drawImpressionCard, shareImpressionCard };
