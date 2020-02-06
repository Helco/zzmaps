import * as L from "leaflet";
import { SceneOverlay } from "SceneElements";
import { SceneData } from "SceneData";

export = class NpcTriggerOverlay implements SceneOverlay {
    readonly name: string = "Fairy Attacks";
    readonly category: string = "Triggers";
    readonly isEnabledByDefault = true;
    readonly layer: L.Layer;

    constructor(map: L.Map, sceneData: SceneData)
    {
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
}
