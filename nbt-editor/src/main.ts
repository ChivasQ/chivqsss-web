import { Editor } from "./editor/Editor.ts"
import { MinecraftAPI } from "./api/apiClient.ts"
import * as nbt from 'prismarine-nbt';
import type { BlockDto, BlockStateDto, BlockModelDto } from './types/minecraft.ts';

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const block_list = document.getElementById("block-list");
const editor = new Editor(canvas);
editor.camera.position.setZ(30);

const blocks = await MinecraftAPI.getBlocks();
let list_buffer = new DocumentFragment();
for (const element of blocks) {
    let card = document.createElement('div');
    card.className = "block-card";
    card.dataset.blockName = element.name;
    card.innerHTML = `<img src="/api/assets/preview?name=${element.name}" width="48" height="48" loading="lazy">`;
    list_buffer.appendChild(card);
}
block_list?.appendChild(list_buffer);

block_list?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.block-card');
    if (target) {
        const name = (target as HTMLElement).dataset.blockName;
        console.log("Choosed block:", name);

    }
});


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
        console.error("Err reading NBT:", err);
    }
});

editor.render();