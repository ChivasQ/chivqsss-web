import type { BlockDto, BlockStateDto, BlockModelDto } from '../types/minecraft.ts';

export class MinecraftAPI {
    static async getBlocks(): Promise<BlockDto[]> {
        const response = await fetch('/api/assets/blocks');
        if (!response.ok) throw new Error('Err loading blocks');
        return response.json();
    }

    static async getBlockStates(blockName: string): Promise<BlockStateDto[]> {
        const response = await fetch(`/api/assets/blockstate/${blockName}`);
        if (!response.ok) throw new Error('Err loading blockstate');
        
        const data = await response.json();
        
        return data.map((item: any) => ({
            ...item,
            properties: item.properties ? JSON.parse(item.properties) : {}
        }));
    }

    static async getBlockModel(modelName: string): Promise<BlockModelDto> {
        const params = new URLSearchParams({ name: modelName });
        const response = await fetch(`/api/assets/block_model?${params.toString()}`);
        
        if (!response.ok) throw new Error('Err loading model');
        
        const data = await response.json();
        
        return {
            geometry: data.geometry || null
        };
    }
}