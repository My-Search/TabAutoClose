import { createApp } from "vue";
// @ts-ignore
import App from "./index.vue";
import "../../style.css";
import "virtual:svg-icons-register";
import commonComponent from "@/components/svgIcon/register";

const app = createApp(App).use(commonComponent);

app.mount("#popup_html");
