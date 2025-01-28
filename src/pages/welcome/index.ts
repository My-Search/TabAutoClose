import { createApp } from "vue";
// @ts-ignore
import App from "./index.vue";
import "../../style.css";

const app = createApp(App);

app.mount("#popup_html");
