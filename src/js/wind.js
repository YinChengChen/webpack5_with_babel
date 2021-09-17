import {scaleLinear, hsl, rgb, geoEquirectangular, geoGraticule10 } from "d3";
export { interpolate_wind_sinebow };
function interpolate_wind_sinebow(t){
    const end_of_sinebow_scale = 0.3;
    const shift_constant = 0.82;
    const s = scaleLinear().domain([0, end_of_sinebow_scale]).range([0, shift_constant]);
    const end_of_sinebow_scale_color = hsl(rgb(
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 0 / 3),
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 1 / 3),
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 2 / 3)
    ));
    const l_scale = scaleLinear().domain([end_of_sinebow_scale, 1]).range([end_of_sinebow_scale_color.l, 1]);
    let parameter = shift_constant + s(t);
    let interpolate_color = rgb(
        255 * sin2(parameter + 0 / 3),
        255 * sin2(parameter + 1 / 3),
        255 * sin2(parameter + 2 / 3)
    );
    if (t > end_of_sinebow_scale){
        interpolate_color = hsl(end_of_sinebow_scale_color.h, end_of_sinebow_scale_color.s, l_scale(t)) + "";
    }
    return interpolate_color;
    // const end_of_sine
}

function sin2(t){
    return Math.sin(Math.PI * t) ** 2;
}

function wind_overlay(){
    const lightness = 0.75;
    const image_width = 4096 / 4;
    const image_height = 2048 / 4;
    const array_size = 4 * image_width * image_height;
    const projection_overlay = geoEquirectangular().precision(0.1).fitSize([image_width, image_height], geoGraticule10());

    let overlay_array = new Uint8ClampedArray(array_size);

    let x = 0;
    let y = 0;

    for (let i = 0; i < array_size; i=i+4){
        let coords = projection_overlay.invert([x, y]);
        if (Math.abs(coords[1]) > 90){
            console.log(x, y, coords, i, array_size);
        }
        // let color = get_color(coords[0], coords[1]);
    }
}

// function get_color(long, lat){
//     let wind_strength;
//     if((long in))
// }

// function getData(){

// }