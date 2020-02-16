import * as L from "leaflet";
import { SceneOverlay } from "SceneElements";
import { SceneData, Trigger, Vec3f } from "SceneData";
import { Database } from "Database";
import Scene from "Scene";

const popupTemplate = document.querySelector("#tmpl-attack-popup");
const itemTemplate = document.querySelector("#tmpl-attack-item");

enum AttackTriggerType {
    Enabled = 0,
    Shell = 1,
    Disabled = 2,
    AlwaysEnabled = 3,
    AlwaysEnabledSnoopy = 50 // only in sc_1413, thanks snoopy
}

const SHELL_CHANCE = -100.0;

class AttackTrigger {
    readonly chance: number;
    readonly levelRange: { min: number, max: number };
    readonly fairies: { id: number, chance: number }[];
    readonly pos: Vec3f;
    readonly radius: number;

    constructor(db: Database, trigger: Trigger) {
        this.pos = trigger.pos;
        this.radius = trigger.radius;

        switch(<AttackTriggerType>trigger.ii2)
        {
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

export = class NpcTriggerOverlay implements SceneOverlay {
    readonly name: string = "Fairy Attacks";
    readonly category: string = "Triggers";
    readonly isEnabledByDefault = true;
    readonly layer: L.Layer;
    readonly db: Database;

    constructor(scene: Scene, sceneData: SceneData) {
        const markers = [];
        this.db = scene.db;

        sceneData.triggers
            .filter(trigger => trigger.type === 8)
            .map(t => new AttackTrigger(scene.db, t))
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

    private createPopupHTML(trigger: AttackTrigger): string {
        let title =
            "Attack Trigger " +
            (trigger.chance === SHELL_CHANCE ? "Shell " : `${trigger.chance}% `) +
            `Levels: ${trigger.levelRange.min} - ${trigger.levelRange.max}`;

        return popupTemplate.innerHTML
            .replace("{TITLE}", title)
            .replace("{ITEMS}", trigger.fairies.map(f => this.createFairyHTML(f)).join(""));
    }

    private createFairyHTML(fairy: { id: number, chance: number }): string {
        return itemTemplate.innerHTML
            .replace("{TITLE}", this.db.fairies[fairy.id].name)
            .replace("'{ICONPOS}'", "" + (fairy.id * 40))
            .replace("{SUBTEXT}", "")
            .replace("{CHANCE}", fairy.chance + "%");
    }

    private createTooltipHTML(trigger: AttackTrigger): string {
        return "" + // stupid javascript
            (trigger.chance === SHELL_CHANCE ? "Shell | " : `${trigger.chance}% | `) +
            trigger.fairies.map(f => this.db.fairies[f.id].name).join(", ") +
            ` | Lvl: ${trigger.levelRange.min} - ${trigger.levelRange.max}`;
    }
}
