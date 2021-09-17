
import { axios } from "axios";
function getData(){
    let data_object = new Object();
    let lat = 90;
    let long = 0;

}

async function getRawData(){
    let response = await axios.get("..\data\current-wind-surface-level-gfs-1.0.json");
    return response.data;
}