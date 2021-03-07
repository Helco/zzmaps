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
        constructor(scene, sceneData) {
            this.name = "Fairy Attacks";
            this.category = "Triggers";
            this.isEnabledByDefault = true;
            const markers = [];
            this.db = scene.db;
            sceneData.Triggers
                .filter(trigger => trigger.type === 8)
                .map(t => new AttackTrigger(scene.db, t))
                .forEach(trigger => {
                const marker = L.circle([-(trigger.pos.z - sceneData.MinBounds.z), trigger.pos.x - sceneData.MinBounds.x], {
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
                (trigger.chance === SHELL_CHANCE ? "Shell | " : `${trigger.chance}% | `) +
                trigger.fairies.map(f => this.db.fairies[f.id].name).join(", ") +
                ` | Lvl: ${trigger.levelRange.min} - ${trigger.levelRange.max}`;
        }
    };
});
define("MainTileLayer", ["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    L = __importStar(L);
    const ExtraMaxZoom = 3;
    const TileBackend = "http://localhost:8000";
    return class MainTileLayer {
        constructor(map, sceneData) {
            this.name = "Main";
            const tileSize = sceneData.TilePixelSize / sceneData.BasePixelsPerUnit;
            const boundsSize = tileSize / (1 << sceneData.MinZoom);
            const bounds = L.latLngBounds(L.latLng(-boundsSize + 1, 0), L.latLng(0, boundsSize - 1));
            map
                .setMinZoom(sceneData.MinZoom)
                .setMaxZoom(sceneData.MaxZoom + ExtraMaxZoom)
                .fitBounds(bounds);
            this.layer = L.tileLayer(`${TileBackend}/${sceneData.FileName}/0-{z}-{x}.{y}`, {
                attribution: `${sceneData.Name} (${sceneData.ID})`,
                minNativeZoom: sceneData.MinZoom,
                maxNativeZoom: sceneData.MaxZoom,
                tileSize,
                noWrap: true,
                keepBuffer: 4,
                bounds: L.latLngBounds(L.latLng(-boundsSize, 0), L.latLng(0, boundsSize))
            });
        }
    };
});
define("Scene", ["require", "exports", "leaflet", "NpcAttackTrigger", "DoorwayTrigger", "MainTileLayer"], function (require, exports, L, NpcAttackTrigger_1, DoorwayTrigger_1, MainTileLayer_1) {
    "use strict";
    L = __importStar(L);
    NpcAttackTrigger_1 = __importDefault(NpcAttackTrigger_1);
    DoorwayTrigger_1 = __importDefault(DoorwayTrigger_1);
    MainTileLayer_1 = __importDefault(MainTileLayer_1);
    const MetaBackend = "http://localhost:8000";
    const BaseLayers = [
        MainTileLayer_1.default
    ];
    const OverlayLayers = [
        NpcAttackTrigger_1.default,
        DoorwayTrigger_1.default
    ];
    return class Scene {
        constructor(divId, db) {
            this.sceneLayers = [];
            this.db = db;
            this.divId = divId;
            this.map = L.map(divId, {
                crs: L.CRS.Simple,
                maxZoom: 4
            });
            this.layerControl = L.control.layers();
            this.layerControl.addTo(this.map);
            window.onpopstate = ev => ev.state && this.load(ev.state.scene);
        }
        reset() {
            this.sceneLayers.forEach(l => this.layerControl.removeLayer(l));
            this.sceneLayers.forEach(l => this.map.removeLayer(l));
            this.sceneLayers = [];
        }
        changeData(sceneData) {
            this.reset();
            const r = (sceneData.BackgroundColor.r * 255) | 0;
            const g = (sceneData.BackgroundColor.g * 255) | 0;
            const b = (sceneData.BackgroundColor.b * 255) | 0;
            document.getElementById(this.divId).style.backgroundColor = `rgba(${r},${g},${b},1)`;
            BaseLayers.forEach(BaseLayerCtor => {
                var l = new BaseLayerCtor(this.map, sceneData);
                this.sceneLayers.push(l.layer);
                this.layerControl.addBaseLayer(l.layer, l.name);
                l.layer.addTo(this.map);
            });
            OverlayLayers.forEach(OverlayLayerCtor => {
                var l = new OverlayLayerCtor(this, sceneData);
                this.sceneLayers.push(l.layer);
                this.layerControl.addOverlay(l.layer, `${l.category} - ${l.name}`);
                if (l.isEnabledByDefault)
                    l.layer.addTo(this.map);
            });
        }
        load(sceneFilename) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch(`${MetaBackend}/${sceneFilename}/meta.json`);
                const sceneData = (yield response.json());
                sceneData.FileName = sceneFilename;
                this.changeData(sceneData);
            });
        }
        goto(sceneIdentifier) {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof sceneIdentifier === "number")
                    sceneIdentifier = "sc_" + (sceneIdentifier < 1000 ? "0" : "") + sceneIdentifier;
                const newURL = new URL(window.location.href);
                newURL.searchParams.set("scene", sceneIdentifier);
                history.pushState({ scene: sceneIdentifier }, null, newURL.href);
                yield this.load(sceneIdentifier);
            });
        }
    };
});
define("DoorwayTrigger", ["require", "exports", "leaflet"], function (require, exports, L) {
    "use strict";
    L = __importStar(L);
    const popupTemplate = document.querySelector("#tmpl-doorway-popup");
    return class DoorwayTriggerOverlay {
        constructor(scene, sceneData) {
            this.name = "Doorways";
            this.category = "Triggers";
            this.isEnabledByDefault = true;
            const markers = [];
            this.scene = scene;
            sceneData.Triggers
                .filter(trigger => trigger.type === 0)
                .forEach(trigger => {
                const marker = L.circle([-(trigger.pos.z - sceneData.MinBounds.z), trigger.pos.x - sceneData.MinBounds.x], {
                    color: "green",
                    fillColor: "#00d000",
                    fillOpacity: 0.3,
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
            const element = popupTemplate.firstElementChild.cloneNode(true);
            element.innerHTML = element.innerHTML.replace("{TITLE}", this.createTooltipHTML(trigger));
            const button = element.querySelector("button");
            button.onclick = () => this.scene.goto(trigger.ii3);
            return element;
        }
        createTooltipHTML(trigger) {
            return `Doorway to "${this.scene.db.sceneNames[trigger.ii3]}" (${trigger.ii3})`;
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