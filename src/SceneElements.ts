import * as L from "leaflet";
import { SceneData } from "SceneData";
import { Database } from "Database";

export interface SceneOverlay {
    readonly name: string;
    readonly category: string;
    readonly isEnabledByDefault: boolean;
    readonly layer: L.Layer;
}

export interface SceneOverlayCtor {
    new(map: L.Map, db: Database, sceneData: SceneData): SceneOverlay
}

export interface SceneBaseLayer {
    readonly name: string;
    readonly layer: L.Layer;
}

export interface SceneBaseLayerCtor {
    new(map: L.Map, sceneData: SceneData): SceneBaseLayer;
}
