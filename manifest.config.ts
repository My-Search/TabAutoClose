import type { ManifestV3Export } from "@crxjs/vite-plugin";

export default <ManifestV3Export>{
  manifest_version: 3,
  name: "TabAutoClose",
  version: "3.0.0",
  description: "清理用户指定可清理的标签",
  author: {
    email: "2119299531@qq.com",
  },
  icons: {
    "16": "src/public/images/16.png",
    "48": "src/public/images/48.png",
    "128": "src/public/images/128.png",
  },
  action: {
    default_icon: "src/public/images/128.png",
    default_title: "清理用户指定可清理的标签",
    default_popup: "src/pages/popup/index.html",
  },
  permissions: ["tabs", "storage", "scripting"],
  background: {
    service_worker: "src/background/background.ts",
  },
  host_permissions: ["<all_urls>"],
};
