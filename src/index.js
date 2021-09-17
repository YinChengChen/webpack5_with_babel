import "./scss/all.scss";
// import { createApp } from "vue";
import axios from "axios";
import { feature } from "topojson";
// import { Legend } from "d3";
// import { Legend } from "d3-color-legend";
import * as d3 from "d3";
import { Legend } from "./js/legend.js";
import { interpolate_wind_sinebow } from "./js/wind";
import { dragstarted, dragged, dragend } from "./js/d3drag";
import { zoomstarted, zoomed, zoomend, resizestarted, resizeend } from "./js/d3zoom";
import { createVertexShader, createFragmentShader, createVertexBuffer, createProgram, createTexture } from "./js/webglFunction";
const legend = Legend(d3.scaleSequential([0, 100], d3.interpolateTurbo), {
    title: "Temperature (°F)"
});

// console.log(legend);
const svg = d3.select("#earth");
// 初始經度範圍 -180 ~ 180，在前面加上 "-"
const initial_longitude = 0;
const projection = d3.geoOrthographic().precision(0.1).rotate([-initial_longitude, 0]);
const sphere = {
    type: "Sphere"
};
const width = svg.node().getBoundingClientRect().width;

const height = setHeight();

function setHeight() {
    let [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, sphere)).bounds(sphere);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
    return dy;
}

console.log(width, height);
// svg.node().appendChild(legend); // legend 回傳 node 必須用 node appendChild 加入 svg 裡

// 設置 colorbar 風場的

const scale = d3.scaleSequential().domain([0, 200]).interpolator(interpolate_wind_sinebow);
// console.log(scale);
const wind_legend = Legend(scale, {
    title: "Wind Speed (m/s)"
});
// console.log(wind_legend);
// svg.node().appendChild(wind_legend);

// 線段點數量
const number_of_prarticles = 3500;

// 地圖資料取得
async function getData() {
    try {
        let response = await axios({
            url: "https://unpkg.com/world-atlas@1/world/110m.json",
            method: "get",
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (response.status === 200) {
            console.log(response.status);
        }
        return response.data;
    } catch (err) {
        console.error(err);
    }
}
getData().then((earth_topography_110) => {
    console.log(earth_topography_110);
    let mapdata = feature(earth_topography_110, earth_topography_110.objects.countries);
    const svg_earth = chart_svg_d3(mapdata);
    console.log(svg.node());
    svg.node().append(svg_earth);
});
// const earth_topography_110 = await (axios.get("https://unpkg.com/world-atlas@1/world/110m.json").then((response) => {
//     return response.data;
// }););
// console.log(earth_topography_110);



function chart_svg_d3(mapdata) {
    let v0, q0, r0, frame, resize_flag, animation_flag;
    let animation_play = false;
    let particles = [];
    let N = number_of_prarticles;
    // 建立新的 svg
    let svg = d3.create("svg").attr('viewBox', [0, 0, width, height]).attr('fill', 'black').attr('preserveAspectRatio', 'xMinYMid');

    projection.fitSize([width, height], d3.geoGraticule10());
    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule10();
    // contains all elements that are draggable
    // 這邊先把 drag 寫上並包含開始結束動作，但是尚未撰寫動畫 function
    const map = svg.append("g").attr("id", "map").attr("width", width).attr("height", height)
        .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragend))
        .call(d3.zoom().scaleExtent([200, 1440]).on("start", zoomstarted).on("zoom", zoomed).on("end", zoomend));

    // 有一個 addEventListener 不確定監聽哪個元素
    // 應該是偵測 zoom 行為作出地球大小改變
    addEventListener('resize', function () {
        if (resize_flag) {
            // 需要 this 麻?
            clearTimeout(resize_flag);
        }
        resizestarted();
        resize_flag = setTimeout(() => resizeend(), 100);
    });
    // 長方形黑色畫布 如果背景是黑的應該就不用 ?
    map.append("rect").attr("x", 0).attr("y", 0).attr("width", width).attr("height", height).attr("fill", "#000005");
    // 地球投影: 一顆黑色圓形線，fill 要用 none 清除填滿
    map.append("path").attr("class", "outline").attr("stroke", "#000").attr("fill", "none").attr("stroke-width", 1).attr("d", path(sphere));
    // 地球格線
    map.append("path").attr("class", "graticule").attr("stroke", "#ffffff").attr("stroke-width", 0.4).attr("d", path(graticule));
    // 世界地圖
    map.append("path").attr("class", "coastline").attr("stroke", "#ffffff").attr("stroke-width", 0.8).attr("fill", "none").attr("d", path(mapdata));
    // Wind Overlay 困難的部分
    // 建立 foreignObject，因為 canvas 屬於 xmls 系統，一般 html 不會識別
    const foreignObject = map.append("foreignObject").attr("x", 0).attr("y", 0).attr("width", width).attr("height", height);
    // 建立 foreignObject 的身體(應該就是畫布的概念) 不要用 style 藥用 attr 設定 css 屬性
    const foreignBody = foreignObject.append("xhtml:body").attr("margin", "0px").attr("padding", "0px").attr("background-color", "none").attr("width", width + "px").attr("height", height + "px");
    // 添加 canvas 給動畫用 這邊尚未有透明背景，會遮住 map
    const canvas_wind_overlay = foreignBody.append("canvas").attr("id", "canvas-wind-overlay").attr("x", 0).attr("y", 0).attr("width", width).attr("height", height).attr("position", "absolute");
    // 使用 WebGl 重新用柵格投影
    const gl = canvas_wind_overlay.node().getContext('webgl', { alpha: true });
    // console.log(gl);
    const vertexShader = createVertexShader(gl);
    // console.log(vertexShader);
    const fragmentShader = createFragmentShader(gl);
    // console.log(fragmentShader);
    const vertexBuffer = createVertexBuffer(gl);
    // console.log(vertexBuffer);
    // const texture = createTexture(gl, canvas_wind_overlay);
    // console.log(texture);
    const program = createProgram(gl, vertexShader, fragmentShader);
    console.log(program);

    return svg.node();

}


// svg.a.append(svg_earth);

// wind_color_scale_accurate = {
//
//     return scale;
// };
// const wind_legend = Legend({
//     color: wind_c
// })






// const legend_element = document.getElementById("legend");
// legend_element.innerHTML = legend;
// const svg = d3.select("#earth");
// svg.insert(legend);
// const app = createApp({
//     data(){
//         return {
//             data: []
//         };
//     },
//     methods: {

//     },
//     mounted() {
//         // axios.get("https://randomuser.me/api/?results=50").then((response)=>{
//         //     this.data = response.data.results;
//         //     console.log(response);
//         // });
//     },
// });
// app.mount("#app");