import * as L from "leaflet";
import {
    SceneOverlay,
    SceneOverlayCtor,
    SceneBaseLayer,
    SceneBaseLayerCtor
} from "./SceneElements";
import { SceneData } from "SceneData";

import NpcAttackTrigger from "NpcAttackTrigger";
import DoorwayTrigger from "DoorwayTrigger";
import MainTileLayer from "./MainTileLayer";
import { Database } from "./Database";

//const MetaBackend = "https://heimdallr.srvdns.de/zzmapsdata";
const MetaBackend = "http://localhost:8000";
const BaseLayers: SceneBaseLayerCtor[] = [
    MainTileLayer
];
const OverlayLayers: SceneOverlayCtor[] = [
    NpcAttackTrigger,
    DoorwayTrigger
];

export = class Scene
{
    readonly map: L.Map;
    readonly db: Database;
    readonly layerControl: L.Control.Layers;
    readonly divId: string;
    sceneLayers: L.Layer[] = [];

    constructor(divId: string, db: Database)
    {
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

    public reset(): void {
        this.sceneLayers.forEach(l => this.layerControl.removeLayer(l));
        this.sceneLayers.forEach(l => this.map.removeLayer(l));
        this.sceneLayers = [];
    }

    public changeData(sceneData: SceneData): void {
        this.reset();
        
        const r = (sceneData.BackgroundColor.r * 255)|0;
        const g = (sceneData.BackgroundColor.g * 255)|0;
        const b = (sceneData.BackgroundColor.b * 255)|0;
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

    public async load(sceneFilename: string): Promise<void> {
        const response = await fetch(`${MetaBackend}/${sceneFilename}/meta.json`);
        const sceneData = <SceneData>(await response.json());
        sceneData.FileName = sceneFilename;
        this.changeData(sceneData);
    }

    public async goto(sceneIdentifier: string | number): Promise<void> {
        if (typeof sceneIdentifier === "number")
            sceneIdentifier = "sc_" + (sceneIdentifier < 1000 ? "0" : "") + sceneIdentifier;
        
        const newURL = new URL(window.location.href);
        newURL.searchParams.set("scene", sceneIdentifier);
        history.pushState({ scene: sceneIdentifier }, null, newURL.href);
        await this.load(sceneIdentifier);
    }
}
