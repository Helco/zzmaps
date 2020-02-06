var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("SceneElements", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("MainTileLayer", ["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    L = __importStar(L);
    const ExtraMaxZoom = 3;
    const TileBackend = "https://heimdallr.srvdns.de/zzmapsdata";
    return class MainTileLayer {
        constructor(map, sceneData) {
            this.name = "Main";
            const tileSize = sceneData.texSize / sceneData.basePixelsPerUnit;
            const boundsSize = tileSize / (1 << sceneData.minZoom);
            const bounds = L.latLngBounds(L.latLng(-boundsSize + 1, 0), L.latLng(0, boundsSize - 1));
            map
                .setMinZoom(sceneData.minZoom)
                .setMaxZoom(sceneData.maxZoom + ExtraMaxZoom)
                .fitBounds(bounds);
            this.layer = L.tileLayer(`${TileBackend}/${sceneData.filename}/tile-{z}-{x}.{y}.jpg`, {
                attribution: `${sceneData.name} (${sceneData.id})`,
                minNativeZoom: sceneData.minZoom,
                maxNativeZoom: sceneData.maxZoom,
                tileSize,
                noWrap: true,
                keepBuffer: 4,
                bounds: L.latLngBounds(L.latLng(-boundsSize, 0), L.latLng(0, boundsSize))
            });
        }
    };
});
define("NpcAttackTrigger", ["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    L = __importStar(L);
    return class NpcTriggerOverlay {
        constructor(map, sceneData) {
            this.name = "Fairy Attacks";
            this.category = "Triggers";
            this.isEnabledByDefault = true;
            const markers = [];
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
            this.layer = L.layerGroup(markers);
        }
    };
});
define("Scene", ["require", "exports", "leaflet", "NpcAttackTrigger", "MainTileLayer"], function (require, exports, L, NpcAttackTrigger_1, MainTileLayer_1) {
    "use strict";
    L = __importStar(L);
    NpcAttackTrigger_1 = __importDefault(NpcAttackTrigger_1);
    MainTileLayer_1 = __importDefault(MainTileLayer_1);
    const MetaBackend = "https://heimdallr.srvdns.de/zzmapsdata";
    const BaseLayers = [
        MainTileLayer_1.default
    ];
    const OverlayLayers = [
        NpcAttackTrigger_1.default
    ];
    return class Scene {
        constructor(divId) {
            this.sceneLayers = [];
            this.map = L.map(divId, {
                crs: L.CRS.Simple,
                maxZoom: 4
            });
            this.layerControl = L.control.layers();
            this.layerControl.addTo(this.map);
        }
        reset() {
            this.sceneLayers.forEach(this.layerControl.removeLayer);
            this.sceneLayers.forEach(this.map.removeLayer);
            this.sceneLayers = [];
        }
        changeData(sceneData) {
            this.reset();
            BaseLayers.forEach(BaseLayerCtor => {
                var l = new BaseLayerCtor(this.map, sceneData);
                this.sceneLayers.push(l.layer);
                this.layerControl.addBaseLayer(l.layer, l.name);
                l.layer.addTo(this.map);
            });
            OverlayLayers.forEach(OverlayLayerCtor => {
                var l = new OverlayLayerCtor(this.map, sceneData);
                this.sceneLayers.push(l.layer);
                this.layerControl.addOverlay(l.layer, `${l.category} - ${l.name}`);
                if (l.isEnabledByDefault)
                    l.layer.addTo(this.map);
            });
        }
        load(sceneFilename) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch(`${MetaBackend}/${sceneFilename}.json`);
                const sceneData = (yield response.json());
                sceneData.filename = sceneFilename;
                this.changeData(sceneData);
            });
        }
    };
});
define("main", ["require", "exports", "Scene"], function (require, exports, Scene_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Scene_1 = __importDefault(Scene_1);
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
    let scene = new Scene_1.default("mapid");
    const query = parseQuery();
    let sceneFilename = "test";
    if ("scene" in query)
        sceneFilename = query.scene;
    scene.load(sceneFilename);
});
//# sourceMappingURL=index.js.map