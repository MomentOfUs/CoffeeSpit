// API 客户端：统一 fetch 封装，自动带 deviceId
const BASE = "";

function getDeviceId() {
  let id = localStorage.getItem("cs_device_id");
  if (!id) {
    id = `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("cs_device_id", id);
  }
  return id;
}

async function request(path, options = {}) {
  const opts = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getDeviceId(),
      ...(options.headers || {})
    }
  };
  if (options.body !== undefined) opts.body = JSON.stringify(options.body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try { const e = await res.json(); msg = e.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// 文件上传用 FormData，不能 JSON
async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(BASE + "/api/upload", {
    method: "POST",
    headers: { "X-Device-Id": getDeviceId() },
    body: fd
  });
  if (!res.ok) throw new Error("图片上传失败");
  return res.json();
}

export const api = {
  getDeviceId,
  // 设备
  registerDevice: (nickname) => request("/api/devices", { method: "POST", body: { deviceId: getDeviceId(), nickname } }),
  // 咖啡库
  getCoffees: () => request("/api/coffees"),
  getCoffee: (id) => request(`/api/coffees/${id}`),
  // 图片
  uploadImage,
  // 扫描
  analyze: (payload) => request("/api/scan/analyze", { method: "POST", body: payload }),
  analyzeCustom: (payload) => request("/api/scan/analyze-custom", { method: "POST", body: payload }),
  analyzeNatural: (text) => request("/api/scan/analyze-natural", { method: "POST", body: { text } }),
  history: () => request(`/api/scan/history/${getDeviceId()}`),
  // 广场
  plaza: (cat) => request(`/api/plaza${cat ? `?cat=${encodeURIComponent(cat)}` : ""}`),
  createPost: (payload) => request("/api/plaza", { method: "POST", body: payload }),
  likePost: (id) => request(`/api/plaza/${id}/like`, { method: "POST" }),
  getComments: (postId) => request(`/api/plaza/${postId}/comments`),
  addComment: (postId, payload) => request(`/api/plaza/${postId}/comments`, { method: "POST", body: payload }),
  // 店铺
  shops: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/shops${q ? `?${q}` : ""}`);
  },
  shop: (id) => request(`/api/shops/${id}`),
  favShop: (id) => request(`/api/shops/${id}/fav`, { method: "POST" }),
  // 档案
  profile: () => request(`/api/profile/${getDeviceId()}`),
  updateProfile: (profile) => request(`/api/profile/${getDeviceId()}`, { method: "PUT", body: { profile } }),
  todayIntake: () => request(`/api/profile/${getDeviceId()}/today`),
  intakeStats: (period) => request(`/api/profile/${getDeviceId()}/intake-stats?period=${period}`),
  addIntake: (payload) => request(`/api/profile/${getDeviceId()}/intake`, { method: "POST", body: payload }),
  exportData: () => request(`/api/profile/${getDeviceId()}/export`),
  // 元数据
  meta: () => request("/api/meta")
};
