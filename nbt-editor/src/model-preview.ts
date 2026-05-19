import * as THREE from 'three';
import type { BlockDto, BlockStateDto, BlockModelDto } from './types/minecraft.ts';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MinecraftAPI } from './api/apiClient.ts';
const scene = new THREE.Scene();

const frustumSize = 28; 
const camera = new THREE.OrthographicCamera(
    frustumSize / -2, frustumSize / 2, 
    frustumSize / 2, frustumSize / -2, 
    0.1, 1000
);

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    alpha: true,
    preserveDrawingBuffer: true,
    antialias: true
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(1);
renderer.setSize(128, 128);

const texLoader = new THREE.TextureLoader();

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

camera.position.set(-16, 14, -16);
camera.lookAt(0, 0, 0);

// const params = new URLSearchParams(window.location.search);
const blocks = await MinecraftAPI.getBlocks();
console.log(blocks);

for (const element of blocks) {
    const block_name = element.name
    const default_blockstate = element.defaultBlockstate;
    if (!default_blockstate) {
        continue
    }
    console.log(block_name, default_blockstate)
    const state_data = await MinecraftAPI.getDefaultBlockState(default_blockstate);
    const mesh = await getBlockMesh(block_name, state_data);
    if (mesh != null) {
        mesh.position.set(-8, -8, -8);
        scene.add(mesh);
    } else {
        continue;
    }

    renderer.render(scene, camera);
    if (mesh != null) {
        // const image = renderer.domElement.toDataURL('image/png');
        const imageBlob = await new Promise<Blob | null>(resolve => renderer.domElement.toBlob(resolve, 'image/png'));
        if (imageBlob != null) {
            let formData = new FormData();
            formData.append("name", block_name as string);
            formData.append("preview", imageBlob, `${block_name}.png`);
            let response = await fetch('/api/assets/put-preview', {
                method: 'POST',
                body: formData
            });
            console.log(response);
        }
        scene.remove(mesh);

        mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
        } else {
            mesh.material.dispose();
        }
    }
}






async function getMeshFromJson(model: BlockModelDto | null, rot_x: number = 0, rot_y: number = 0, name: string = ""): Promise<THREE.Mesh | null> {
        if (model == null) {
            return null;
        }
        const elements = model.geometry?.elements;
        const textures = model.geometry?.textures || {};
        
        if (!elements || elements.length === 0) {
            return null;
        }
        

        const materials: THREE.MeshBasicMaterial[] = [];
        const textureMap: Record<string, number> = {};

        let matIndex = 0;
        for (const [key, path] of Object.entries(textures)) {
            if (typeof path !== 'string') {
                console.warn(`No texture for key: #${key} in block: ${name}`);
                continue;
            }
            const cleanPath = (path as string).replace('minecraft:', '');
            
            const texture = await texLoader.loadAsync(`/minecraft/textures/${cleanPath}.png`);
            
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace;

            materials.push(new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                alphaTest: 0.5, 
            }));
            
            textureMap['#' + key] = matIndex;
            matIndex++;
        }

        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        materials.push(fallbackMaterial);
        const fallbackIndex = materials.length - 1;

        const geometries: THREE.BufferGeometry[] = [];
        const faceNames = ['east', 'west', 'up', 'down', 'south', 'north'];
        elements.forEach(element => {
            const [x1, y1, z1] = element.from;
            const [x2, y2, z2] = element.to;

            const width = x2 - x1;
            const height = y2 - y1;
            const depth = z2 - z1;

            const boxGeo = new THREE.BoxGeometry(width, height, depth);

            
            const uvAttribute = boxGeo.attributes.uv;

            for (let i = 0; i < 6; i++) {
                const faceName = faceNames[i];
                const faceData = element.faces[faceName];
                const vIndex = i * 4;

                if (faceData) {
                    let mIndex = textureMap[faceData.texture];
                    if (mIndex === undefined) {
                        mIndex = fallbackIndex; 
                    }
            
                    boxGeo.groups[i].materialIndex = mIndex;

                    const uv = faceData.uv || [0, 0, 16, 16];
                    const u0 = uv[0] / 16.0;
                    const v0 = 1.0 - (uv[1] / 16.0);
                    const u1 = uv[2] / 16.0;
                    const v1 = 1.0 - (uv[3] / 16.0);

                    let pts = [
                        [u0, v0], [u1, v0], [u0, v1], [u1, v1]
                    ];

                    const rot = faceData.rotation || 0;
                    if (rot === 90) {
                        pts = [[u0, v1], [u0, v0], [u1, v1], [u1, v0]];
                    } else if (rot === 180) {
                        pts = [[u1, v1], [u0, v1], [u1, v0], [u0, v0]];
                    } else if (rot === 270 || rot === -90) {
                        pts = [[u1, v0], [u1, v1], [u0, v0], [u0, v1]];
                    }

                    uvAttribute.setXY(vIndex + 0, pts[0][0], pts[0][1]);
                    uvAttribute.setXY(vIndex + 1, pts[1][0], pts[1][1]);
                    uvAttribute.setXY(vIndex + 2, pts[2][0], pts[2][1]);
                    uvAttribute.setXY(vIndex + 3, pts[3][0], pts[3][1]);
                } else {
                    uvAttribute.setXY(vIndex + 0, 0, 0);
                    uvAttribute.setXY(vIndex + 1, 0, 0);
                    uvAttribute.setXY(vIndex + 2, 0, 0);
                    uvAttribute.setXY(vIndex + 3, 0, 0);
                }
            }
            
            uvAttribute.needsUpdate = true;

            const centerX = x1 + (width / 2);
            const centerY = y1 + (height / 2);
            const centerZ = z1 + (depth / 2);

            boxGeo.translate(centerX, centerY, centerZ);
            geometries.push(boxGeo);
        });

        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
        
        mergedGeometry.clearGroups();
        let indexOffset = 0;
        geometries.forEach(geo => {
            const indexCount = geo.index ? geo.index.count : geo.attributes.position.count;
            geo.groups.forEach(group => {
                mergedGeometry.addGroup(indexOffset + group.start, group.count, group.materialIndex);
            });
            indexOffset += indexCount;
        });

    const radX = THREE.MathUtils.degToRad(rot_x || 0);
    const radY = THREE.MathUtils.degToRad(rot_y || 0);

    if (radX !== 0 || radY !== 0) {
        mergedGeometry.translate(-8, -8, -8);
        
        mergedGeometry.rotateY(radY);
        mergedGeometry.rotateX(radX);
        
        mergedGeometry.translate(8, 8, 8);
    }

    const mesh = new THREE.Mesh(mergedGeometry, materials);
    return mesh;
}   


async function getBlockMesh(name: string | null, blockstate: BlockStateDto | null = null): Promise<THREE.Mesh | null>  {
    if (name == null) {
        return null;
    }

    if (!blockstate) {
        const modelData = await MinecraftAPI.getBlockModel(name);
        return getMeshFromJson(modelData); 
    }

    const blockstates = await MinecraftAPI.getBlockStates(name);
    const keys1 = Object.keys(blockstate.properties);

    for (const bs of blockstates) {
        const keys2 = Object.keys(bs.properties);
        
        const isShallowEqual = keys1.length === keys2.length && 
            keys1.every(key => bs.properties[key] === blockstate.properties[key]);
        
        if (isShallowEqual) {
            const modelData = await MinecraftAPI.getBlockModel(bs.model_name);
            return getMeshFromJson(modelData, bs.rot_x, bs.rot_y, name);
        }
    }

    console.warn(`Err loading blockstate for block ${name}. default blockstate applied`);
    const fallbackModelData = await MinecraftAPI.getBlockModel(name);
    return getMeshFromJson(fallbackModelData);
}

