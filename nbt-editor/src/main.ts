import { Editor } from "./editor/Editor.ts"
import { MinecraftAPI } from "./api/apiClient.ts"
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const editor = new Editor(canvas);
editor.camera.position.setZ(30);

const modelData = await MinecraftAPI.getBlockModel("minecraft:block/anvil");
const modelBlockStates = await MinecraftAPI.getBlockStates("minecraft:anvil");
// console.log(modelBlockStates)
// console.log(modelData);
const mesh = editor.getMeshFromJson(modelData);

if (mesh) {
    editor.addBlock(0, 0, 0, mesh);
}

const modelData1 = await MinecraftAPI.getBlockModel("minecraft:block/purpur_pillar");
console.log(modelData1);
const mesh1 = editor.getMeshFromJson(modelData1);

if (mesh1) {
    editor.addBlock(0, 0, 16, mesh1);
}


const modelData2 = await MinecraftAPI.getBlockModel("minecraft:block/cauldron");
const mesh2 = editor.getMeshFromJson(modelData2);

if (mesh2) {
    editor.addBlock(0, 0, 32, mesh2);
}




editor.render();