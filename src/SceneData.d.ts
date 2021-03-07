export type Vec2f = { x: number, y: number };
export type Vec3f = { x: number, y: number, z: number };
export type FColor = { r: number, g: number, b: number, a: number };

export interface Trigger {
    idx: number;
    normalizeDir: number;
    colliderType: number;
    dir: Vec3f;
    type: number;
    ii1: number;
    ii2: number;
    ii3: number;
    ii4: number;
    s: string;
    pos: Vec3f;
    size: Vec3f;
    radius: number;
}

export interface SceneData {
    FileName: string;
    Name: string;
    ID: number;
    MinZoom: number;
    MaxZoom: number;
    BasePixelsPerUnit: number;
    TilePixelSize: number;
    MinBounds: Vec3f;
    MaxBounds: Vec3f;
    Origin: Vec3f;
    BackgroundColor: FColor;
    Triggers: Trigger[];
}
