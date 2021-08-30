import "./scss/all.scss";
import { createApp } from "vue";
import axios from "axios";

const app = createApp({
    data(){
        return {
            data: []
        };
    },
    methods: {

    },
    mounted() {
        // axios.get("https://randomuser.me/api/?results=50").then((response)=>{
        //     this.data = response.data.results;
        //     console.log(response);
        // });
    },
});
app.mount("#app");