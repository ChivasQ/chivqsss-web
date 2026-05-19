import { Editor } from "./editor/Editor.ts"
import { MinecraftAPI } from "./api/apiClient.ts"
import * as nbt from 'prismarine-nbt';
import type { BlockDto, BlockStateDto, BlockModelDto } from './types/minecraft.ts';

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const editor = new Editor(canvas);
editor.camera.position.setZ(30);

// const modelData = await MinecraftAPI.getBlockModel("minecraft:block/anvil");
// const modelBlockStates = await MinecraftAPI.getBlockStates("minecraft:anvil");
// console.log(modelBlockStates)
// // console.log(modelData);
// const mesh = editor.getMeshFromJson(modelData);

// if (mesh) {
//     editor.addBlock(0, 0, 0, mesh);
// }

// const modelData1 = await MinecraftAPI.getBlockModel("minecraft:block/purpur_pillar");
// const modelBlockStates1 = await MinecraftAPI.getBlockStates("minecraft:purpur_pillar");
// console.log(modelBlockStates1)
// console.log(modelData1);
// const mesh1 = editor.getMeshFromJson(modelData1);

// if (mesh1) {
//     editor.addBlock(0, 0, 16, mesh1);
// }


// const modelData2 = await MinecraftAPI.getBlockModel("minecraft:block/cauldron");
// const mesh2 = editor.getMeshFromJson(modelData2);

// if (mesh2) {
//     editor.addBlock(0, 0, 32, mesh2);
// }


document.getElementById('file-input')?.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const { parsed } = await nbt.parse(arrayBuffer);
        const simplifiedData = nbt.simplify(parsed);
    
        let palette: Record<number, { name: string, stateDto: BlockStateDto }> = {}; 
        
        if (simplifiedData.palette) {
            for (let i = 0; i < simplifiedData.palette.length; i++) {
                const p = simplifiedData.palette[i];
                
                const dto: BlockStateDto = {
                    properties: p.Properties || {},
                    model_name: p.name,
                    rot_x: 0,
                    rot_y: 0
                };

                palette[i] = {
                    name: p.Name,
                    stateDto: dto
                };
            }
        }

        if (simplifiedData.blocks) {
            for (let i = 0; i < simplifiedData.blocks.length; i++) {
                const element = simplifiedData.blocks[i];
                const [x, y, z] = element.pos;
                const stateId = element.state;

                const blockData = palette[stateId];

                if (blockData) {
                    const mesh = await editor.getBlockMesh(blockData.name, blockData.stateDto);
                    if (mesh) {
                        editor.addBlock(x*16, y*16, z*16, mesh);
                    }
                }
            }
        }
        
    } catch (err) {
        console.error("Ошибка чтения NBT:", err);
    }
});

editor.render();