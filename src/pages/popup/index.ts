import { createApp } from "vue";
// @ts-ignore
import App from "./index.vue";
import "@/style.css";
import "virtual:svg-icons-register";
import commonComponent from "@/components/svgIcon/register";
import i18n from '@/i18n';

const app = createApp(App).use(commonComponent);
app.use(i18n);
app.mount("#popup_html");
