import * as t from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const castleW = 10;
const castleD = 10;
const castleH =  4;

const gateW = 2.5;
const gateH = 3;
const gateD = 0.5;

const towerR =  1.5;
const towerH =  castleH + 2;

const towerSpireR = towerR + 0.5;
const towerSpireH = 6;

const lakeR = 6;
const treeLogH = 4;

let scene, camera, renderer, container;

function setUpThree() {
    scene = new t.Scene();
    scene.background = new t.Color(0x9FCFFB);

    camera = new t.PerspectiveCamera(50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000);
    camera.position.set(40, 35, 30);
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
    const floorGeometry = new t.BoxGeometry(90, 75, 0.1);
    floorGeometry.translate(14,0,0);
    const floorMaterial = new t.MeshPhongMaterial({color: 0x086f09});
    const floor = new t.Mesh(floorGeometry, floorMaterial); 
    scene.add(floor);

    const castleGeometry = new t.BoxGeometry(castleW, castleD, castleH);
    castleGeometry.translate(0,0,castleH/2)
    castleMaterial.flatShading = true;

    const castleMaterial = new t.MeshPhongMaterial({color: 0xfddde6});
    const castle = new t.Mesh(castleGeometry, castleMaterial); 
    scene.add(castle);

    let towersGeometry = [];
    let towersSpireGeometry = [];
    const towerMaterial = new t.MeshPhongMaterial({color: 0xfddde6});
    const towerSpireMaterial = new t.MeshPhongMaterial({color: 0x4d8dff});
    for (let i = 0; i < 4; i++) {
        towersGeometry[i] = new t.CylinderGeometry(
            towerR,
            towerR,
            towerH, 40, 40);
        towersSpireGeometry[i] = new t.ConeGeometry(
            towerSpireR,
            towerSpireH,
            40);

        // 0 -> 00
        // 1 -> 01
        // 2 -> 10
        // 3 -> 11
        towersGeometry[i].translate(
            ((-1)**(i>>1))*(castleW/2-(towerR*2/3)),
            towerH/2,
             ((-1)**(i&1))*(castleD/2-towerR*2/3));

        towersSpireGeometry[i].translate(
            ((-1)**(i>>1))*(castleW/2-towerR*2/3),
            towerH + (towerSpireH/2),
             ((-1)**(i&1))*(castleD/2-towerR*2/3));
    } 

    towerMaterial.flatShading = true;

    towerSpireMaterial.flatShading = true;

    let towersMesh = [];
    let towersSpireMesh = [];
    for (let i = 0; i < 4; i++) {
        towersMesh[i] = new t.Mesh(towersGeometry[i], towerMaterial); 
        towersMesh[i].rotation.x = Math.PI/2;

        towersSpireMesh[i] = new t.Mesh(
            towersSpireGeometry[i],
            towerSpireMaterial); 
        towersSpireMesh[i].rotation.x = Math.PI/2;

        scene.add(towersMesh[i]);
        scene.add(towersSpireMesh[i]);
    }

    const gateGeometry = new t.BoxGeometry(gateD, gateW, gateH);
    // 0.01 previene un error visual
    gateGeometry.translate((castleW-gateD)/2 + 0.01, 0, gateH/2);

    gateMaterial.flatShading = true;

    const gateMaterial = new t.MeshPhongMaterial({color: 0x7c3f00});
    const gate = new t.Mesh(gateGeometry, gateMaterial); 
    scene.add(gate);

    let lakeGeometries = [];
    for (let i = 0; i < 2; ++i) {
        lakeGeometries[i] = new t.CircleGeometry(lakeR, 40);
        lakeGeometries[i].translate(24 + (i*lakeR*5/4),0,0.1);
    }

    lakeMaterial.flatShading = true;
    const lakeMaterial = new t.MeshPhongMaterial({color: 0x62c4ff});

    let lake = [];
    for (let i = 0; i < 2; ++i) {
        lake[i] = new t.Mesh(lakeGeometries[i], lakeMaterial); 
        scene.add(lake[i]);
    }

    const treeLogGeometry = new t.CylinderGeometry(0.5, 0.5, treeLogH, 40, 40);
    treeLogGeometry.translate(14,treeLogH/2,12);

    treeLogMaterial.flatShading = true;

    const treeLogMaterial = new t.MeshPhongMaterial({color: 0x7c3f00});
    const treeLog = new t.Mesh(treeLogGeometry, treeLogMaterial); 
    treeLog.rotation.x = Math.PI/2;
    scene.add(treeLog);

    let treeLeavesGeometries = [];
    const treeLeavesMaterial = new t.MeshPhongMaterial({color: 0x00ff00});
    for (let i = 0; i < 3; i++) {
        treeLeavesGeometries[i] = new t.SphereGeometry(1.75,40,40);
        treeLeavesGeometries[i].translate(
            14,
            -11-((0.5)*(1+((-1)**i))),
            treeLogH+i);
    }

    treeLeavesMaterial.flatShading = true;

    let treeLeaves = [];
    for (let i = 0; i < 3; i++) {
        treeLeaves[i] = new t.Mesh(treeLeavesGeometries[i], treeLeavesMaterial); 
        scene.add(treeLeaves[i]);
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
