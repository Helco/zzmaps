import * as L from "leaflet";
import { SceneBaseLayer } from "SceneElements";
import { SceneData } from "SceneData";

const ExtraMaxZoom = 3;
//const TileBackend = "https://heimdallr.srvdns.de/zzmapsdata";
const TileBackend = "http://localhost:8000";

export = class MainTileLayer implements SceneBaseLayer {
    readonly name: string = "Main";
    readonly layer: L.Layer;

    constructor(map: L.Map, sceneData: SceneData) {
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
}
