<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="solid ? 'currentColor' : 'none'"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="path"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
  solid: { type: Boolean, default: false },
  strokeWidth: { type: Number, default: 1.7 }
});

const PATHS = {
  // 导航
  scan: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 3v18"/>',
  plaza: '<path d="M3 11l18-8-8 18-2-7-8-3z"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  // 输入
  camera: '<path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  gallery: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  // 互动
  heart: '<path d="M12 21s-7-4.6-9.4-9.1C1.1 8.7 2.7 5.3 6.1 5.3c2 0 3.3 1.2 4 2.4.7-1.2 2-2.4 4-2.4 3.4 0 5 3.4 3.5 6.6C19 16.4 12 21 12 21z"/>',
  'heart-solid': '<path d="M12 21s-7-4.6-9.4-9.1C1.1 8.7 2.7 5.3 6.1 5.3c2 0 3.3 1.2 4 2.4.7-1.2 2-2.4 4-2.4 3.4 0 5 3.4 3.5 6.6C19 16.4 12 21 12 21z"/>',
  comment: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-5A8.4 8.4 0 1 1 21 11.5z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4"/>',
  star: '<path d="M12 3l2.6 6.3 6.4.5-4.9 4.2 1.5 6.5L12 17.8 6.4 20.5l1.5-6.5L3 9.8l6.4-.5z"/>',
  'star-solid': '<path d="M12 3l2.6 6.3 6.4.5-4.9 4.2 1.5 6.5L12 17.8 6.4 20.5l1.5-6.5L3 9.8l6.4-.5z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  // 报告
  stamp: '<rect x="4" y="9" width="16" height="7" rx="1"/><path d="M6 16v3h12v-3"/><path d="M9 9V6h6v3"/>',
  alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  recipe: '<path d="M5 3h10v18H5z"/><path d="M15 8h4v13h-4"/><path d="M8 8h4M8 12h4M8 16h2"/>',
  flame: '<path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  coins: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/><path d="M9 9h.5M15 15h.5"/>',
  droplet: '<path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z"/>',
  gauge: '<path d="M12 13l4-4"/><circle cx="12" cy="13" r="8.5"/><path d="M3.5 21a8.5 8.5 0 0 1 17 0"/>',
  // 成就
  medal: '<circle cx="12" cy="15" r="5"/><path d="M9 10L7 3h10l-2 7M12 12v3"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/><path d="M10 14h4M9 18h6M12 14v4"/>',
  fire: '<path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  cup: '<path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 4v2M11 3v3M14 4v2"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  diamond: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l-3 6 6 12 6-12-3-6"/>',
  // 通用
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  filter: '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
  download: '<path d="M12 3v12M7 11l5 4 5-4M5 21h14"/>',
  'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
  'arrow-down': '<path d="M12 5v14M5 12l7 7 7-7"/>',
  edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  location: '<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tag: '<path d="M3 12l9-9 9 9-9 9z"/><circle cx="12" cy="12" r="2"/>'
};

const path = computed(() => PATHS[props.name] || "");
</script>
