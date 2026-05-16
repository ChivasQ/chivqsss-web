import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BlockDto, BlockStateDto, BlockModelDto } from '../types/minecraft.ts';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Editor {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;
    public texLoader: THREE.TextureLoader;
    
    public blocks: Map<string, THREE.Mesh>;

    public constructor(canvasElement: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvasElement
        });
        this.texLoader = new THREE.TextureLoader();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        const grid = new THREE.GridHelper(200, 50);
        this.scene.add(grid);
        const light = new THREE.AmbientLight(0xffffff);
        this.scene.add(light);

        this.blocks = new Map();

        this.render = this.render.bind(this);
    }

    private getBlockKey(x: number, y: number, z: number): string {
        return `${x}_${y}_${z}`;
    }

    public addBlock(x: number, y: number, z: number, mesh: THREE.Mesh) {
        const key = this.getBlockKey(x, y, z);
        
        if (this.blocks.has(key)) {
            this.removeBlock(x, y, z);
        }

        mesh.position.set(x, y, z);
        this.scene.add(mesh);
        this.blocks.set(key, mesh);
    }

    public removeBlock(x: number, y: number, z: number) {
        const key = this.getBlockKey(x, y, z);
        const mesh = this.blocks.get(key);

        if (mesh) {
            this.scene.remove(mesh);
            this.blocks.delete(key);

            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose();
            }
        }
    }

    public render() {
        requestAnimationFrame(this.render);
        this.controls.update(); 
        this.renderer.render(this.scene, this.camera);
    }

    public getMeshFromJson(model: BlockModelDto | null): THREE.Mesh | null {
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
                console.warn(`Отсутствует путь для текстуры: #${key}`);
                continue;
            }
            const cleanPath = (path as string).replace('minecraft:', '');
            
            const texture = this.texLoader.load(`/minecraft/textures/${cleanPath}.png`);
            
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace;

            materials.push(new THREE.MeshBasicMaterial({ map: texture }));
            
            textureMap['#' + key] = matIndex;
            matIndex++;
        }

        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        materials.push(fallbackMaterial);
        const fallbackIndex = materials.length - 1;

        const geometries: THREE.BufferGeometry[] = [];

        elements.forEach(element => {
            const [x1, y1, z1] = element.from;
            const [x2, y2, z2] = element.to;

            const width = x2 - x1;
            const height = y2 - y1;
            const depth = z2 - z1;

            const boxGeo = new THREE.BoxGeometry(width, height, depth);

            const faceNames = ['east', 'west', 'up', 'down', 'south', 'north'];
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

        const mesh = new THREE.Mesh(mergedGeometry, materials);
        return mesh;
    }
}