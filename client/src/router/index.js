import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", redirect: "/scan" },
  { path: "/scan", name: "scan", component: () => import("../views/ScanView.vue"), meta: { tab: 0, title: "识破" } },
  { path: "/plaza", name: "plaza", component: () => import("../views/PlazaView.vue"), meta: { tab: 1, title: "避坑" } },
  { path: "/radar", name: "radar", component: () => import("../views/RadarView.vue"), meta: { tab: 2, title: "良心" } },
  { path: "/profile", name: "profile", component: () => import("../views/ProfileView.vue"), meta: { tab: 3, title: "我的" } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; }
});

export default router;
