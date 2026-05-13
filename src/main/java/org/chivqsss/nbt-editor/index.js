import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('canvas') 
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

renderer.render(scene, camera);

const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();