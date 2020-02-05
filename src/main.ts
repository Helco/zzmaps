/// <reference types="leaflet" />
import { AddNpcTriggers } from "./NpcAttackTrigger";
import * as L from "leaflet";

//
// CONFIG
//
const extraMaxZoom = 3;
const tileBackend = "https://heimdallr.srvdns.de/zzmapsdata";
const metaBackend = tileBackend;

//
// UTILS
//
function parseQuery(): any {
    // from https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
    const queryString = window.location.search.substr(1);
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

//
// LAYERS
//
let sceneLayers = [];
let layerControl = L.control.layers();

function resetMap() {
    sceneLayers.forEach(layerControl.removeLayer);
    sceneLayers.forEach(mymap.removeLayer);
    sceneLayers = [];
}

function addMainTileLayer(sceneData) {
    const tileSize = sceneData.texSize / sceneData.basePixelsPerUnit;
    const boundsSize = tileSize / (1 << sceneData.minZoom);
    const bounds = L.latLngBounds(L.latLng(-boundsSize + 1, 0), L.latLng(0, boundsSize - 1));
    sceneLayers.push(L.tileLayer(`${tileBackend}/${sceneData.filename}/tile-{z}-{x}.{y}.jpg`, {
        attribution: `${sceneData.name} (${sceneData.id})`,
        minNativeZoom: sceneData.minZoom,
        maxNativeZoom: sceneData.maxZoom,
        tileSize,
        noWrap: true,
        keepBuffer: 4,
        bounds: L.latLngBounds(L.latLng(-boundsSize, 0), L.latLng(0, boundsSize))
    }).addTo(mymap));
    mymap
        .setMinZoom(sceneData.minZoom)
        .setMaxZoom(sceneData.maxZoom + extraMaxZoom)
        .fitBounds(bounds);
}

//
// STARTUP
//
let mymap = L.map('mapid', {
    crs: L.CRS.Simple,
    maxZoom: 4,
});
layerControl.addTo(mymap);

const query = parseQuery();
let sceneFilename = "test"; // Endeva
if ("scene" in query)
    sceneFilename = query.scene;

(async () => {
    const response = await fetch(`${metaBackend}/${sceneFilename}.json`);
    const sceneData = await response.json();
    sceneData.filename = sceneFilename;
    resetMap();
    addMainTileLayer(sceneData);
    AddNpcTriggers(mymap, sceneData);
})();
