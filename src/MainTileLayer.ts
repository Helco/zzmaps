import * as L from "leaflet";
import { SceneBaseLayer } from "SceneElements";
import { SceneData } from "SceneData";

const ExtraMaxZoom = 3;
const TileBackend = "https://heimdallr.srvdns.de/zzmapsdata";

export = class MainTileLayer implements SceneBaseLayer {
    readonly name: string = "Main";
    readonly layer: L.Layer;

    constructor(map: L.Map, sceneData: SceneData) {
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
}
