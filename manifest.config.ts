import type { ManifestV3Export } from "@crxjs/vite-plugin";

export default <ManifestV3Export>{
  manifest_version: 3,
  name: "TabAutoClose",
  version: "3.1.1",
  description: "清理用户指定可清理的标签",
  author: {
    email: "2119299531@qq.com",
  },
  icons: {
    "16": "src/assets/images/logo.png",
    "48": "src/assets/images/logo.png",
    "128": "src/assets/images/logo.png",
  },
  action: {
    default_icon: "src/assets/images/logo.png",
    default_title: "清理用户指定可清理的标签",
    default_popup: "src/pages/popup/index.html",
  },
  permissions: ["tabs", "storage", "scripting"],
  background: {
    service_worker: "src/background/background.ts",
  },
  host_permissions: ["<all_urls>"],
};
