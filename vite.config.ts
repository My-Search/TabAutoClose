import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
// import manifest from './manifest.json' // Node 14 & 16
// import manifest from "./manifest.json" assert { type: "json" }; // Node >=17
import path, { resolve } from "path";

import manifest from "./manifest.config"; // 为manifest.config中了有类型提示，使用这种

import { createSvgIconsPlugin } from "vite-plugin-svg-icons";

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    crx({ manifest }),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), "src/assets/icons")],
      symbolId: "icon-[dir]-[name]",
    }),
  ],
  build: {
    sourcemap: true, // 生成sourceMap文件，方便调试
    rollupOptions: {
      input: {
        welcome: "src/pages/welcome/index.html",
        popup: "src/pages/popup/index.html",
      }
    },
  },
  // 为了在项目中使用@别名
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "./src"),
      },
      {
        find: 'vue-i18n',
        replacement: 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
      }
    ],
  },
  // sass依赖的配置，为了在vue中使用scss
  css: {
    preprocessorOptions: {
      scss: {
        // 配置全局sass变量注入
        additionalData: '@use "@/styles/variable.scss";',
      },
    },
  },
});
