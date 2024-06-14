import * as THREE from 'three';
import * as dat from 'dat.gui';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function setupThreeJs() {
	scene = new THREE.Scene();
	container = document.getElementById('mainContainer');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x606060);
	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(-50, 60, 50);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xAAAAAA);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(100, 100, 100);
	scene.add(directionalLight);

	const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
	// scene.add(directionalLightHelper);

	const gridHelper = new THREE.GridHelper(50, 20);
	scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	window.addEventListener('resize', onResize);
	onResize();
}

const steamChamberLen = 20;
const steamChamberRad = 5;
const steamChamberEndRad = steamChamberRad+0.75;
const steamChamberEndLen = 5;
const cabinLen = 10;
const cabinHeight = 11;
const cabinRoofHeight = 8;
const cabinWallThickness = 0.75;
const wheelRad = 5;

function buildCabinRoof() {
	const geometry = new THREE.BoxGeometry(12, cabinWallThickness, 12);
	return geometry;
}

function buildCabin() {
	let cabin = [];

	const cabinFront = new THREE.BoxGeometry(steamChamberRad*2, cabinWallThickness, cabinHeight);
	cabinFront.translate(0, cabinLen/2, -cabinHeight/2);
	cabin.push(cabinFront);

	const cabinLeft = new THREE.BoxGeometry(steamChamberRad*2, cabinWallThickness, cabinHeight);
	cabinLeft.rotateZ(Math.PI/2);
	cabinLeft.translate(steamChamberRad-cabinWallThickness/2, cabinWallThickness/2, -cabinHeight/2);
	cabin.push(cabinLeft);

	const cabinRight = new THREE.BoxGeometry(steamChamberRad*2, cabinWallThickness, cabinHeight);
	cabinRight.rotateZ(Math.PI/2);
	cabinRight.translate(-steamChamberRad+cabinWallThickness/2, cabinWallThickness/2, -cabinHeight/2);
	cabin.push(cabinRight);

	const g1 = new THREE.BoxGeometry(cabinWallThickness, cabinWallThickness, cabinRoofHeight);
	g1.rotateZ(Math.PI/2);
	g1.translate(-steamChamberRad+(cabinWallThickness/2), -steamChamberRad+cabinWallThickness, -cabinHeight-cabinRoofHeight/2);
	cabin.push(g1);

	const g2 = new THREE.BoxGeometry(cabinWallThickness, cabinWallThickness, cabinRoofHeight);
	g2.rotateZ(Math.PI/2);
	g2.translate(steamChamberRad-cabinWallThickness/2, steamChamberRad, -cabinHeight-cabinRoofHeight/2);
	cabin.push(g2);

	const g3 = new THREE.BoxGeometry(cabinWallThickness, cabinWallThickness, cabinRoofHeight);
	g3.rotateZ(Math.PI/2);
	g3.translate(steamChamberRad-cabinWallThickness/2, -steamChamberRad+cabinWallThickness, -cabinHeight-cabinRoofHeight/2);
	cabin.push(g3);

	const g4 = new THREE.BoxGeometry(cabinWallThickness, cabinWallThickness, cabinRoofHeight);
	g4.rotateZ(Math.PI/2);
	g4.translate(-steamChamberRad+cabinWallThickness/2, steamChamberRad, -cabinHeight-cabinRoofHeight/2);
	cabin.push(g4);

	const geometry = BufferGeometryUtils.mergeGeometries(cabin);
	geometry.rotateX(Math.PI/2);
	return geometry;
}

function buildChamber() {
	let geometries = [];

	const steamChamber = new THREE.CylinderGeometry(steamChamberRad,
		steamChamberRad, steamChamberLen, 32);
	
	geometries.push(steamChamber);

	const steamChamberEnd = new THREE.CylinderGeometry(steamChamberEndRad,
		steamChamberEndRad, steamChamberEndLen, 32);

	steamChamberEnd.translate(0,steamChamberLen/2 + steamChamberEndLen/2,0);
	geometries.push(steamChamberEnd);

	const floor = new THREE.BoxGeometry(steamChamberRad*2, steamChamberLen + steamChamberEndLen + cabinLen, 1.0);
	floor.translate(0, -steamChamberEndLen/2, steamChamberRad);
	geometries.push(floor);

	const chamberPipeLen = 8;
	const chamberPipe = new THREE.CylinderGeometry(0.75, 0.75, chamberPipeLen, 32);
	chamberPipe.translate(0, -(steamChamberRad + chamberPipeLen/2)+1.0,
		-(steamChamberLen+steamChamberEndLen)/2);
	chamberPipe.rotateX(Math.PI/2);
	geometries.push(chamberPipe);

	const geometry = BufferGeometryUtils.mergeGeometries(geometries);
	geometry.rotateX(Math.PI/2);
	geometry.translate(0, steamChamberRad, 0);
	return geometry;
}

function buildTrainAxe() {
	const axe = new THREE.CylinderGeometry(0.65, 0.65, 10);
	axe.rotateZ(Math.PI/2);
	return axe;
}

function buildTrainChassis() {
	const chassis = new THREE.BoxGeometry(7, 3, steamChamberLen+steamChamberEndLen+cabinLen);
	return chassis;
}

function buildTrain() {
	console.log('Building train');
	const train = new THREE.Group();

	const chamberGeometry = buildChamber();
	const chamberMaterial = new THREE.MeshPhongMaterial({
		color: 0xFA1A09, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
	train.add(chamber);

	const cabinGeometry = buildCabin();
	const cabin = new THREE.Mesh(cabinGeometry, chamberMaterial);
	train.add(cabin);
	cabin.position.set(0,0,-steamChamberLen+(cabinLen/2));

	const cabinRoofGeometry = buildCabinRoof();
	const roofMaterial = new THREE.MeshPhongMaterial({
		color: 0xFBEC50, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const cabinRoof = new THREE.Mesh(cabinRoofGeometry, roofMaterial);
	train.add(cabinRoof);
	cabinRoof.position.set(0, cabinHeight+cabinRoofHeight+cabinWallThickness/2, -steamChamberLen+(cabinLen/2));

	const chassisGeometry = buildTrainChassis();
	const chassisMaterial = new THREE.MeshPhongMaterial({
		color: 0x7A7F80, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
	train.add(chassis);

	let axes = [];
	const a1 = buildTrainAxe();
	a1.translate(0, 0, 0);
	axes.push(a1);

	const a2 = buildTrainAxe();
	a2.translate(0, 0, wheelRad*1.65);
	axes.push(a2);

	const a3 = buildTrainAxe();
	a3.translate(0, 0, -wheelRad*1.65);
	axes.push(a3);
	
	const axesGeometry = BufferGeometryUtils.mergeGeometries(axes);
	chassis.add(new THREE.Mesh(axesGeometry, chassisMaterial));
	chassis.position.set(0,-2,-2.75);

	const steamCylindersLen = 8;

	const cylinderLeft = new THREE.CylinderGeometry(1.75, 1.75, steamCylindersLen);
	cylinderLeft.rotateX(Math.PI/2);
	cylinderLeft.translate(steamChamberRad-1.25, 0, steamChamberLen-steamCylindersLen/1.5);

	const cylinderRight = new THREE.CylinderGeometry(1.75, 1.75, steamCylindersLen);
	cylinderRight.rotateX(Math.PI/2);
	cylinderRight.translate(-steamChamberRad+1.25, 0, steamChamberLen-steamCylindersLen/1.5);

	const cylindersGeometry = BufferGeometryUtils.mergeGeometries([cylinderRight, cylinderLeft]);
	const cylindersMaterial = new THREE.MeshPhongMaterial({
		color: 0x393939, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	chassis.add(new THREE.Mesh(cylindersGeometry, cylindersMaterial));
	chassis.position.set(0,-2,-2.75);

	train.position.set(0,2,0);
	return train;
}

function buildScene() {
	console.log('Building scene');

	const train = buildTrain();
	scene.add(train);
}

function onTextureLoaded(key, texture) {
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	textures[key].object = texture;
	console.log('Texture `' + key + '` loaded');
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	buildScene();
	mainLoop();
}

setupThreeJs();
main();
