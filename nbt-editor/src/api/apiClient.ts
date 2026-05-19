import type { Block1Dto, BlockStateDto, BlockModelDto } from '../types/minecraft.ts';

export class MinecraftAPI {
    static cachedBlockstates: Record<string, Promise<BlockStateDto[]>> = {};
    static cachedRawModels: Record<string, Promise<BlockModelDto | null>> = {};


    static async getBlocks(): Promise<Block1Dto[]> {
        const response = await fetch('/api/assets/blocks');
        if (!response.ok) throw new Error('Err loading blocks');
        return response.json();
    }

    static getBlockStates(blockName: string): Promise<BlockStateDto[]> {
        if (blockName in this.cachedBlockstates) {
            return this.cachedBlockstates[blockName]!;
        }

        const params = new URLSearchParams({ name: blockName });
        
        const fetchPromise = fetch(`/api/assets/blockstate?${params.toString()}`)
            .then(response => {
                if (!response.ok) throw new Error('Err loading blockstate');
                return response.json();
            })
            .then(data => data.map((item: any) => ({
                ...item,
                properties: item.properties || null
            })));

        this.cachedBlockstates[blockName] = fetchPromise;

        return fetchPromise;
    }

    static getDefaultBlockState(id: string): Promise<BlockStateDto | null> {
        const params = new URLSearchParams({ id: id });

        return fetch(`/api/assets/def_blockstate?${params.toString()}`)
            .then(async (response) => {
                if (!response.ok) {
                    if (response.status === 404) return null;
                    throw new Error(`Err loading default blockstate for id: ${id}`);
                }
                
                const text = await response.text();
                if (!text) return null;
                
                const data = JSON.parse(text);
                
                return {
                    ...data,
                    properties: typeof data.properties === 'string' 
                        ? JSON.parse(data.properties) 
                        : (data.properties || null)
                };
            });
    }

    static async fetchRawModel(modelName: string): Promise<BlockModelDto | null> {
        if (modelName in this.cachedRawModels) {
            return this.cachedRawModels[modelName]!;
        }

        const params = new URLSearchParams({ name: modelName });

        const fetchPromise = fetch(`/api/assets/block_model?${params.toString()}`)
            .then(async (response) => {
                if (!response.ok) throw new Error('Err loading model: ' + modelName);
                const text = await response.text(); 
                if (!text) throw new Error('Empty model: ' + modelName);
                return JSON.parse(text);
            })
            .then(data => ({ geometry: data.geometry || null }));

        this.cachedRawModels[modelName] = fetchPromise;

        return fetchPromise;
    }

    static getBlockModel(modelName: string): Promise<BlockModelDto | null> {
        const normalizedName = modelName.includes(':') ? modelName : `minecraft:${modelName}`;
        
        if (modelName in this.cachedRawModels) {
            return this.cachedRawModels[normalizedName]!;
        }

        const fetchPromise = (async () => {
            const params = new URLSearchParams({ name: normalizedName });
            const response = await fetch(`/api/assets/block_model?${params.toString()}`);
            
            if (!response.ok) {
                console.warn(`Модель не найдена: ${normalizedName}`);
                return null; 
            }
            
            const data = await response.json();
            if (!data || !data.geometry) return null;

            const geometry = data.geometry;

            if (geometry.parent && !geometry.parent.endsWith("block/block") && !geometry.parent.endsWith("builtin/generated")) {
                const data_parent = await this.getBlockModel(geometry.parent);

                if (data_parent && data_parent.geometry) {
                    geometry.textures = {
                        ...(data_parent.geometry.textures || {}),
                        ...(geometry.textures || {})
                    };

                    geometry.elements = geometry.elements || data_parent.geometry.elements;
                }
            }

            if (geometry.textures) {
                for (const key in geometry.textures) {
                    let value = geometry.textures[key];
                    
                    let depth = 0;
                    while (typeof value === 'string' && value.startsWith('#') && depth < 5) {
                        const refKey = value.substring(1);
                        const nextValue = geometry.textures[refKey];

                        if (nextValue === undefined) {
                            break;
                        }
                        
                        value = nextValue;
                        depth++;
                    }

                    geometry.textures[key] = value;
                }
            }
            
            return {
                geometry: geometry
            };
        })();

        this.cachedRawModels[normalizedName] = fetchPromise;
        return fetchPromise;
    }
}