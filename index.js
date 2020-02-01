/// <reference types="leaflet" />

//
// CONFIG
//
const texSize = 1024;
const basePixelsPerUnit = 4;
const tileSize = texSize / basePixelsPerUnit;
const extraMaxZoom = 2;
const tileBackend = "data";
const metaBackend = tileBackend;

//
// UTILS
//
function parseQuery() {
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
    sceneLayers.push(L.tileLayer('{tileBackend}/{sceneFilename}/tile-{z}-{x}.{y}.jpg', {
        attribution: `${sceneData.name} (${sceneData.id})`,
        minNativeZoom: 0,
        maxNativeZoom: sceneData.maxZoom,
        tileSize,
        noWrap: true,
        keepBuffer: 4,
        sceneFilename: sceneData.filename,
        tileBackend,
    }).addTo(mymap));
    mymap
        .setMaxZoom(sceneData.maxZoom + extraMaxZoom)
        .setView([0, 0], 0);
}

function addNpcAttacks(sceneData) {
    let markers = [];
    sceneData.triggers.forEach(trigger => {
        if (trigger.type !== 8)
            return;
        markers.push(L.circle([-(trigger.pos.z - 100.2), trigger.pos.x - 123.8], {
            color: "red",
            fillColor: "#f03",
            fillOpacity: 0.5,
            radius: trigger.radius
        }));
    });

    let markerLayer = L.layerGroup(markers);
    sceneLayers.push(markerLayer);
    layerControl.addOverlay(markerLayer, "Wild fairies");
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
    addNpcAttacks(sceneData);
})();
