import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BlockDto, BlockStateDto, BlockModelDto } from '../types/minecraft.ts';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Editor {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;
    
    public blocks: Map<string, THREE.Mesh>;

    public constructor(canvasElement: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvasElement
        });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        const grid = new THREE.GridHelper(200, 50);
        this.scene.add(grid);

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

    public getMeshFromJson(model: BlockModelDto): THREE.Mesh | null {
        const elements = model.geometry?.elements;
        
        if (!elements || elements.length === 0) {
            return null;
        }

        const geometries: THREE.BufferGeometry[] = [];

        elements.forEach(element => {
            const [x1, y1, z1] = element.from;
            const [x2, y2, z2] = element.to;

            const width = x2 - x1;
            const height = y2 - y1;
            const depth = z2 - z1;

            const boxGeo = new THREE.BoxGeometry(width, height, depth);

            const centerX = x1 + (width / 2);
            const centerY = y1 + (height / 2);
            const centerZ = z1 + (depth / 2);

            boxGeo.translate(centerX, centerY, centerZ);

            geometries.push(boxGeo);
        });

        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

        const material = new THREE.MeshNormalMaterial();

        const mesh = new THREE.Mesh(mergedGeometry, material);
        
        return mesh;
    }
}