export interface BlockDto {
    name: string;
    preview: string | null;
    defaultBlockstate: string;
}

export interface Block1Dto {
    name: string;
    defaultBlockstate: string;
}

export interface BlockStateDto {
    properties: Record<string, string>; 
    model_name: string;
    rot_x: number;
    rot_y: number;
}

export type Vector3Tuple = [number, number, number];

export interface BlockFace {
    texture: string;
    cullface?: string;
    uv?: [number, number, number, number];
    rotation?: number;
}

export interface BlockElement {
    from: Vector3Tuple;
    to: Vector3Tuple;
    // "up", "down", "north", "south", "east", "west", etc..
    faces: Record<string, BlockFace>; 
}

export interface MinecraftModelJson {
    parent?: string;
    textures?: Record<string, string>;
    elements?: BlockElement[];
}

export interface BlockModelDto {
    geometry: MinecraftModelJson | null;
}