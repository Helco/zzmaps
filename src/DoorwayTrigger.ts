import * as L from "leaflet";
import { SceneOverlay } from "./SceneElements";
import { SceneData, Trigger } from "SceneData";
import { Database } from "Database";
import Scene from "Scene";

const popupTemplate = document.querySelector("#tmpl-doorway-popup");

export = class DoorwayTriggerOverlay implements SceneOverlay {
    readonly name: string = "Doorways";
    readonly category: string = "Triggers";
    readonly isEnabledByDefault = true;
    readonly layer: L.Layer;
    readonly scene: Scene;

    constructor(scene: Scene, sceneData: SceneData) {
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

    private createPopupHTML(trigger: Trigger): HTMLElement {
        const element = <HTMLElement>popupTemplate.firstElementChild.cloneNode(true);
        element.innerHTML = element.innerHTML.replace("{TITLE}", this.createTooltipHTML(trigger));
        const button = <HTMLButtonElement>element.querySelector("button");
        button.onclick = () => this.scene.goto(trigger.ii3);
        return <HTMLElement>element;
    }

    private createTooltipHTML(trigger: Trigger): string {
        return `Doorway to "${this.scene.db.sceneNames[trigger.ii3]}" (${trigger.ii3})`;
    }
}
