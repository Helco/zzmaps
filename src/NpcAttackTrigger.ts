//// <reference types="leaflet" />
import * as L from "leaflet";

export function AddNpcTriggers(map: L.Map, sceneData: any): L.Layer 
{
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
