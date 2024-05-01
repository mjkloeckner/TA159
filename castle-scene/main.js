import * as t from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const castleW = 10;
const castleD = 10;
const castleH =  5;

const gateW = 2.5;
const gateH = 3;
const gateD = 0.5;

const towerR =  1.5;
const towerH =  castleH + 2.5;

const towerSpireR = towerR + 0.5;
const towerSpireH = 6;

const lakeR = 6;
const treeLogH = 4;

let scene, camera, renderer, container;

function setUpThree() {
    scene = new t.Scene();
    scene.background = new t.Color(0x9fcffb);

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
    const floorMaterial = new t.MeshPhongMaterial({color: 0x086f09});
    const floor = new t.Mesh(floorGeometry, floorMaterial); 
    floor.position.set(10,0,0);
    scene.add(floor);

    const castleGeometry = new t.BoxGeometry(castleW, castleD, castleH);
    const castleMaterial = new t.MeshPhongMaterial({color: 0xfddde6});
    const castle = new t.Mesh(castleGeometry, castleMaterial); 
    castle.position.set(0,0,castleH/2)
    scene.add(castle);

    const towerGeometry = new t.CylinderGeometry(towerR, towerR, towerH, 40, 40);
    const towerSpireGeometry = new t.ConeGeometry(towerSpireR, towerSpireH, 40);
    const towerMaterial = new t.MeshPhongMaterial({color: 0xfddde6});
    const towerSpireMaterial = new t.MeshPhongMaterial({color: 0x4d8dff});

    let towersMesh = [];
    let towersSpireMesh = [];
    const towers = new t.Group();
    for (let i = 0; i < 4; i++) {
        towersMesh[i] = new t.Mesh(towerGeometry, towerMaterial); 
        towersSpireMesh[i] = new t.Mesh(towerSpireGeometry, towerSpireMaterial); 

        // 0 -> 00
        // 1 -> 01
        // 2 -> 10
        // 3 -> 11
        towersMesh[i].position.set(
            ((-1)**(i>>1))*(castleW/2-(towerR*2/3)),
            towerH/2,
            ((-1)**(i&1))*(castleD/2-towerR*2/3));

        towersSpireMesh[i].position.set(
            ((-1)**(i>>1))*(castleW/2-towerR*2/3),
            towerH + (towerSpireH/2),
            ((-1)**(i&1))*(castleD/2-towerR*2/3));

        towers.add(towersMesh[i]);
        towers.add(towersSpireMesh[i]);
    }

    towers.rotation.x = Math.PI/2;
    scene.add(towers);

    const gateGeometry = new t.BoxGeometry(gateD, gateW, gateH);
    const gateMaterial = new t.MeshPhongMaterial({color: 0x7c3f00});
    const gate = new t.Mesh(gateGeometry, gateMaterial); 

    // 0.01 previene un error visual
    gate.position.set((castleW-gateD)/2 + 0.01, 0, gateH/2);
    scene.add(gate);

    const lakeGeometry = new t.CircleGeometry(lakeR, 40);
    const lakeMaterial = new t.MeshPhongMaterial({color: 0x62c4ff});

    let lake = [];
    for (let i = 0; i < 2; ++i) {
        lake[i] = new t.Mesh(lakeGeometry, lakeMaterial); 
        lake[i].position.set(24 + (i*lakeR*5/4),0,0.1)
        scene.add(lake[i]);
    }

    const Tree = new t.Group();
    const treeLogGeometry = new t.CylinderGeometry(0.5, 0.5, treeLogH, 40, 40);
    const treeLogMaterial = new t.MeshPhongMaterial({color: 0x7c3f00});
    const treeLog = new t.Mesh(treeLogGeometry, treeLogMaterial); 
    treeLog.rotation.x = Math.PI/2;
    treeLog.position.set(14,-12,treeLogH/2)
    Tree.add(treeLog);

    const treeLeavesGeometry = new t.SphereGeometry(1.75,40,40);
    const treeLeavesMaterial = new t.MeshPhongMaterial({color: 0x00ff00});
    let treeLeaves = [];
    for (let i = 0; i < 3; i++) {
        treeLeaves[i] = new t.Mesh(treeLeavesGeometry, treeLeavesMaterial); 
        treeLeaves[i].position.set(
            14,
            -11.5-((0.25)*(1+((-1)**i))),
            treeLogH+i);
        Tree.add(treeLeaves[i]);
    }

    scene.add(Tree);
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
