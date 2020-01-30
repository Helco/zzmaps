const texSize = 1024;
const halfTexSize = texSize / 2;
const quarterTexSize = texSize / 4;

var mymap = L.map('mapid', {
    crs: L.CRS.Simple,
    maxZoom: 7,
    maxBounds: L.latLngBounds(L.latLng(-halfTexSize, -halfTexSize), L.latLng(0, texSize))
}).setView([-quarterTexSize, quarterTexSize], 0);
L.tileLayer('data/{mapName}/tile-{z}-{x}.{y}.jpg', {
    attribution: 'Zanzarah Maps',
    minNativeZoom: 0,
    maxNativeZoom: 5,
    mapName: "test",
    tileSize: halfTexSize,
    noWrap: true,
    keepBuffer: 4,
    bounds: L.latLngBounds(L.latLng(-texSize, -0), L.latLng(0, texSize))
}).addTo(mymap);
