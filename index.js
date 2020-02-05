var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define("NpcAttackTrigger", ["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function AddNpcTriggers(map, sceneData) {
        let markers = [];
        sceneData.triggers.forEach(trigger => {
            if (trigger.type !== 8)
                return;
            markers.push(L.circle([-(trigger.pos.z - sceneData.origin.y), trigger.pos.x - sceneData.origin.x], {
                color: "red",
                fillColor: "#f03",
                fillOpacity: 0.5,
                radius: trigger.radius
            }));
        });
        let markerLayer = L.layerGroup(markers);
        markerLayer.addTo(map);
        return markerLayer;
    }
    exports.AddNpcTriggers = AddNpcTriggers;
});
define("main", ["require", "exports", "NpcAttackTrigger", "leaflet"], function (require, exports, NpcAttackTrigger_1, L) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const extraMaxZoom = 3;
    const tileBackend = "https://heimdallr.srvdns.de/zzmapsdata";
    const metaBackend = tileBackend;
    function parseQuery() {
        const queryString = window.location.search.substr(1);
        var query = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }
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
    let mymap = L.map('mapid', {
        crs: L.CRS.Simple,
        maxZoom: 4,
    });
    layerControl.addTo(mymap);
    const query = parseQuery();
    let sceneFilename = "test";
    if ("scene" in query)
        sceneFilename = query.scene;
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield fetch(`${metaBackend}/${sceneFilename}.json`);
        const sceneData = yield response.json();
        sceneData.filename = sceneFilename;
        resetMap();
        addMainTileLayer(sceneData);
        NpcAttackTrigger_1.AddNpcTriggers(mymap, sceneData);
    }))();
});
//# sourceMappingURL=index.js.map