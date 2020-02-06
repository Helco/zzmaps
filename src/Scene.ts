import * as L from "leaflet";
import {
    SceneOverlay,
    SceneOverlayCtor,
    SceneBaseLayer,
    SceneBaseLayerCtor
} from "./SceneElements";
import { SceneData } from "SceneData";

import NpcAttackTrigger from "NpcAttackTrigger";
import MainTileLayer from "./MainTileLayer";

const MetaBackedn = "https://heimdallr.srvdns.de/zzmapsdata";
const BaseLayers: SceneBaseLayerCtor[] = [
    MainTileLayer
];
const OverlayLayers: SceneOverlayCtor[] = [
    NpcAttackTrigger
];

export = class Scene
{
    readonly map: L.Map;
    readonly layerControl: L.Control.Layers;
    sceneLayers: L.Layer[] = [];

    constructor(divId: string)
    {
        this.map = L.map(divId, {
            crs: L.CRS.Simple,
            maxZoom: 4
        });
        this.layerControl = L.control.layers();
        this.layerControl.addTo(this.map);
    }

    public reset(): void {
        this.sceneLayers.forEach(this.layerControl.removeLayer);
        this.sceneLayers.forEach(this.map.removeLayer);
        this.sceneLayers = [];
    }

    public changeData(sceneData: SceneData): void {
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

    public async load(sceneFilename: string): Promise<void> {
        const response = await fetch(`${MetaBackedn}/${sceneFilename}.json`);
        const sceneData = <SceneData>(await response.json());
        sceneData.filename = sceneFilename;
        this.changeData(sceneData);
    }
}
