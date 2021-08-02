import "./scss/all.scss";
import { createApp } from "vue";

const app = createApp({
    data(){
        return {
            text: "Welcome to my TO-DO List",
        };
    }
});
app.mount("#app");