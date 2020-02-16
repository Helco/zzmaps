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
    const popupTemplate = document.querySelector("#tmpl-attack-popup");
    const itemTemplate = document.querySelector("#tmpl-attack-item");
    var AttackTriggerType;
    (function (AttackTriggerType) {
        AttackTriggerType[AttackTriggerType["Enabled"] = 0] = "Enabled";
        AttackTriggerType[AttackTriggerType["Shell"] = 1] = "Shell";
        AttackTriggerType[AttackTriggerType["Disabled"] = 2] = "Disabled";
        AttackTriggerType[AttackTriggerType["AlwaysEnabled"] = 3] = "AlwaysEnabled";
        AttackTriggerType[AttackTriggerType["AlwaysEnabledSnoopy"] = 50] = "AlwaysEnabledSnoopy";
    })(AttackTriggerType || (AttackTriggerType = {}));
    const SHELL_CHANCE = -100.0;
    class AttackTrigger {
        constructor(db, trigger) {
            this.pos = trigger.pos;
            this.radius = trigger.radius;
            switch (trigger.ii2) {
                case AttackTriggerType.Enabled:
                case AttackTriggerType.Disabled:
                    this.chance = trigger.ii3 === 0 ? 1 : trigger.ii3;
                    break;
                case AttackTriggerType.AlwaysEnabled:
                case AttackTriggerType.AlwaysEnabledSnoopy:
                    this.chance = 100;
                    break;
                case AttackTriggerType.Shell:
                    this.chance = SHELL_CHANCE;
                    break;
                default:
                    this.chance = NaN;
            }
            const group = db.fairyGroups[trigger.ii4];
            const oneChance = (100 / group.fairies.length) | 0;
            this.fairies = [];
            group.fairies.forEach(id => {
                let entry = this.fairies.find(f => f.id == id);
                if (entry == null)
                    this.fairies.push({ id, chance: oneChance });
                else
                    entry.chance += oneChance;
            });
            const ampl = (group.lrid / 4) | 0;
            const base = group.lrid - ampl - 1;
            this.levelRange = {
                min: base,
                max: base + ampl - 1
            };
        }
    }
    return class NpcTriggerOverlay {
        constructor(map, db, sceneData) {
            this.name = "Fairy Attacks";
            this.category = "Triggers";
            this.isEnabledByDefault = true;
            const markers = [];
            this.db = db;
            sceneData.triggers
                .filter(trigger => trigger.type === 8)
                .map(t => new AttackTrigger(db, t))
                .forEach(trigger => {
                const marker = L.circle([-(trigger.pos.z - sceneData.origin.y), trigger.pos.x - sceneData.origin.x], {
                    color: "red",
                    fillColor: "#f03",
                    fillOpacity: 0.5,
                    radius: trigger.radius
                });
                marker.on("click", () => marker.togglePopup());
                marker.on("tooltipopen", () => {
                    if (marker.isPopupOpen())
                        marker.closeTooltip();
                });
                marker.on("popupopen", () => marker.closeTooltip());
                marker.bindPopup(this.createPopupHTML(trigger));
                marker.bindTooltip(this.createTooltipHTML(trigger));
                markers.push(marker);
            });
            this.layer = L.layerGroup(markers);
        }
        createPopupHTML(trigger) {
            let title = "Attack Trigger " +
                (trigger.chance === SHELL_CHANCE ? "Shell " : `${trigger.chance}% `) +
                `Levels: ${trigger.levelRange.min} - ${trigger.levelRange.max}`;
            return popupTemplate.innerHTML
                .replace("{TITLE}", title)
                .replace("{ITEMS}", trigger.fairies.map(f => this.createFairyHTML(f)).join(""));
        }
        createFairyHTML(fairy) {
            return itemTemplate.innerHTML
                .replace("{TITLE}", this.db.fairies[fairy.id].name)
                .replace("'{ICONPOS}'", "" + (fairy.id * 40))
                .replace("{SUBTEXT}", "")
                .replace("{CHANCE}", fairy.chance + "%");
        }
        createTooltipHTML(trigger) {
            return "" +
                (trigger.chance === SHELL_CHANCE ? "Shell " : `${trigger.chance}% | `) +
                trigger.fairies.map(f => this.db.fairies[f.id].name).join(", ") +
                ` | Lvl: ${trigger.levelRange.min} - ${trigger.levelRange.max}`;
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
        constructor(divId, db) {
            this.sceneLayers = [];
            this.db = db;
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
                var l = new OverlayLayerCtor(this.map, this.db, sceneData);
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
    function loadDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`res/db.json`);
            return (yield response.json());
        });
    }
    let scene = null;
    let database = null;
    (() => __awaiter(void 0, void 0, void 0, function* () {
        database = yield loadDatabase();
        scene = new Scene_1.default("mapid", database);
        const query = parseQuery();
        let sceneFilename = "sc_2421";
        if ("scene" in query)
            sceneFilename = query.scene;
        scene.load(sceneFilename);
    }))();
});
//# sourceMappingURL=index.js.map