import * as t from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const houseW = 10;
const houseD = 10;
const houseH =  4;

const towerR =  1.5;
const towerH =  houseH + 2;

const towerSpireR = towerR + 0.5;
const towerSpireH = 6;

let scene, camera, renderer, container;

function setUpThree() {
    scene = new t.Scene();
    scene.background = new t.Color(0x9FCFFB);

    camera = new t.PerspectiveCamera(50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000);
    camera.position.set(30, 25, 25);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, 1); // Set Z axis facing up 

    renderer = new t.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onResize);
    onResize();

    const light = new t.DirectionalLight(0xffffff);
    light.position.x = 100;
    light.position.y =  50;
    light.position.z = 100;
    scene.add(light);
}

function addGeometries() {
    const floorGeometry = new t.BoxGeometry(80, 50, 0.1);
    const floorMaterial = new t.MeshPhongMaterial();
    floorMaterial.color.set(0x086f09);
    floorMaterial.emissive.set(0x000000);

    const floor = new t.Mesh(floorGeometry, floorMaterial); 
    scene.add(floor);

    const houseGeometry = new t.BoxGeometry(houseW, houseD, houseH);
    houseGeometry.translate(0,0,houseH/2)
    const houseMaterial = new t.MeshPhongMaterial();
    houseMaterial.color.set(0xfddde6);
    houseMaterial.emissive.set(0x000000);
    houseMaterial.flatShading = true;

    const house = new t.Mesh(houseGeometry, houseMaterial); 
    scene.add(house);

    let towersGeometry = [];
    let towersSpireGeometry = [];
    for (let i = 0; i < 4; i++) {
        towersGeometry[i] = new t.CylinderGeometry(towerR, towerR, towerH, 40, 40);
        towersSpireGeometry[i] = new t.ConeGeometry(towerSpireR, towerSpireH, 40);

        // 0 -> 00
        // 1 -> 01
        // 2 -> 10
        // 3 -> 11
        towersGeometry[i].translate(
            ((-1)**(i>>1))*(houseW/2-(towerR*2/3)),
            towerH/2,
             ((-1)**(i&1))*(houseD/2-towerR*2/3));

        towersSpireGeometry[i].translate(
            ((-1)**(i>>1))*(houseW/2-towerR*2/3),
            towerH + (towerSpireH/2),
             ((-1)**(i&1))*(houseD/2-towerR*2/3));
    } 

    const towerMaterial = new t.MeshPhongMaterial();
    towerMaterial.color.set(0xfddde6);
    towerMaterial.emissive.set(0x000000);
    towerMaterial.flatShading = true;

    const towerSpireMaterial = new t.MeshPhongMaterial();
    towerSpireMaterial.color.set(0x4d8dff);
    towerSpireMaterial.emissive.set(0x000000);
    towerSpireMaterial.flatShading = true;

    let towersMesh = [];
    let towersSpireMesh = [];
    for (let i = 0; i < 4; i++) {
        towersMesh[i] = new t.Mesh(towersGeometry[i], towerMaterial); 
        towersMesh[i].rotation.x = Math.PI/2;

        towersSpireMesh[i] = new t.Mesh(towersSpireGeometry[i], towerSpireMaterial); 
        towersSpireMesh[i].rotation.x = Math.PI/2;

        scene.add(towersMesh[i]);
        scene.add(towersSpireMesh[i]);
    } 
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function mainLoop() {
    requestAnimationFrame(mainLoop);
    renderer.render(scene, camera);
}

setUpThree();
addGeometries();
mainLoop();
