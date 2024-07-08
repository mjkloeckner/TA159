import * as THREE from 'three';
import * as dat from 'dat.gui';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;

let time = 0.0;

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

const steamChamberLen = 10;
const steamChamberRad = 2.50;
const steamChamberEndRad = steamChamberRad+0.375;
const steamChamberEndLen = 2.50;
const cabinLen = 5;
const cabinHeight = 6;
const cabinRoofHeight = 3;
const cabinWallThickness = 0.375;
const wheelRad = 1.475;
const chassisHeight = 2.5;
const wheelThickness = 0.425;
const chassisOffset = 1.245;
const wheelOffset = -0.45;
const steamCylindersLen = 4;
const crankLen = 12;
const crankOffset = 1.55;
const crankWidth = 0.25;

let crankLeft, crankRight;

function buildCabinRoof() {
	console.log('Building train cabin roof');
	const geometry = new THREE.BoxGeometry(6, cabinWallThickness, 6);
	return geometry;
}

function buildCabin() {
	console.log('Building train cabin');

	let cabin = [];

	const cabinFront = new THREE.BoxGeometry(
		steamChamberRad*2,
		cabinWallThickness,
		cabinHeight);

	cabinFront.translate(0, cabinLen/2, -cabinHeight/2);
	cabin.push(cabinFront);

	const cabinLeft = new THREE.BoxGeometry(
		steamChamberRad*2,
		cabinWallThickness,
		cabinHeight);

	cabinLeft.rotateZ(Math.PI/2);
	cabinLeft.translate(
		steamChamberRad-cabinWallThickness/2,
		cabinWallThickness/2,
		-cabinHeight/2);

	cabin.push(cabinLeft);

	const cabinRight = new THREE.BoxGeometry(
		steamChamberRad*2,
		cabinWallThickness,
		cabinHeight);

	cabinRight.rotateZ(Math.PI/2);
	cabinRight.translate(
		-steamChamberRad+cabinWallThickness/2,
		cabinWallThickness/2,
		-cabinHeight/2);

	cabin.push(cabinRight);

	const g1 = new THREE.BoxGeometry(
		cabinWallThickness, cabinWallThickness, cabinRoofHeight);

	g1.rotateZ(Math.PI/2);
	g1.translate(
		-steamChamberRad+(cabinWallThickness/2),
		-steamChamberRad+cabinWallThickness,
		-cabinHeight-cabinRoofHeight/2);

	cabin.push(g1);

	const g2 = new THREE.BoxGeometry(
		cabinWallThickness, cabinWallThickness, cabinRoofHeight);

	g2.rotateZ(Math.PI/2);
	g2.translate(
		steamChamberRad-cabinWallThickness/2,
		steamChamberRad,
		-cabinHeight-cabinRoofHeight/2);

	cabin.push(g2);

	const g3 = new THREE.BoxGeometry(
		cabinWallThickness, cabinWallThickness, cabinRoofHeight);

	g3.rotateZ(Math.PI/2);
	g3.translate(
		steamChamberRad-cabinWallThickness/2,
		-steamChamberRad+cabinWallThickness,
		-cabinHeight-cabinRoofHeight/2);

	cabin.push(g3);

	const g4 = new THREE.BoxGeometry(
		cabinWallThickness, cabinWallThickness, cabinRoofHeight);

	g4.rotateZ(Math.PI/2);
	g4.translate(
		-steamChamberRad+cabinWallThickness/2,
		steamChamberRad,
		-cabinHeight-cabinRoofHeight/2);

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

	const floor = new THREE.BoxGeometry(
		steamChamberRad*2, steamChamberLen + steamChamberEndLen + cabinLen, 1.0);
	floor.translate(0, -steamChamberEndLen/2, steamChamberRad);
	geometries.push(floor);

	const chamberPipeLen = 4;
	const chamberPipe = new THREE.CylinderGeometry(0.55, 0.55, chamberPipeLen, 32);
	chamberPipe.translate(0, -(steamChamberRad + chamberPipeLen/2)+1.0,
		-(steamChamberLen+steamChamberEndLen)/2);

	chamberPipe.rotateX(Math.PI/2);
	geometries.push(chamberPipe);

	const geometry = BufferGeometryUtils.mergeGeometries(geometries);
	geometry.rotateX(Math.PI/2);
	geometry.translate(0, steamChamberRad+0.25, 0);
	return geometry;
}

function buildTrainWheel() {
	const wheel = new THREE.CylinderGeometry(wheelRad, wheelRad, wheelThickness);
	wheel.rotateZ(Math.PI/2);

	const wheelBolt = new THREE.CylinderGeometry(wheelRad, wheelRad, wheelThickness);
	wheelBolt.rotateZ(Math.PI/2);

	const wheelsMaterial = new THREE.MeshPhongMaterial({
		color: 0x393939, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	return new THREE.Mesh(wheel, wheelsMaterial)
}

function buildTrainAxe(material) {
	const axeGeometry = new THREE.CylinderGeometry(0.325, 0.325, 5);
	axeGeometry.rotateZ(Math.PI/2);

	const axeMaterial = new THREE.MeshPhongMaterial({
		color: 0x7A7F80, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	return new THREE.Mesh(axeGeometry, axeMaterial);
}

function buildTrainChassis() {
	const chassis = new THREE.BoxGeometry(3.5, 2.5, steamChamberLen+steamChamberEndLen+cabinLen);
	return chassis;
}

function buildTrain() {
	console.log('Building train');
	const train = new THREE.Group();

	const chassisGeometry = buildTrainChassis();
	const chassisMaterial = new THREE.MeshPhongMaterial({
		color: 0x7A7F80, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
	train.add(chassis);

	const chamberGeometry = buildChamber();
	const chamberMaterial = new THREE.MeshPhongMaterial({
		color: 0xFA1A09, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
	chassis.add(chamber);
	chamber.position.set(0, (chassisHeight + cabinWallThickness)/2, chassisOffset);

	const cabinGeometry = buildCabin();
	const cabin = new THREE.Mesh(cabinGeometry, chamberMaterial);
	chassis.add(cabin);
	cabin.position.set(0,
		(chassisHeight + cabinWallThickness)/2,
		-steamChamberLen+(cabinLen/2)+chassisOffset);

	const cabinRoofGeometry = buildCabinRoof();
	const roofMaterial = new THREE.MeshPhongMaterial({
		color: 0xFBEC50, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const cabinRoof = new THREE.Mesh(cabinRoofGeometry, roofMaterial);
	cabin.add(cabinRoof);
	cabinRoof.position.set(0, cabinHeight+cabinRoofHeight+cabinWallThickness/2, 0);

	const a1 = buildTrainAxe();
	chassis.add(a1);

	const a2 = buildTrainAxe();
	chassis.add(a2);

	const a3 = buildTrainAxe(chassisMaterial);
	chassis.add(a3);

	a1.position.set(0, wheelOffset, -0.60);
	a2.position.set(0, wheelOffset, -0.60+wheelRad*2.5);
	a3.position.set(0, wheelOffset, -0.60-wheelRad*2.5);

	const cylinderLeft = new THREE.CylinderGeometry(1.25, 1.5, steamCylindersLen);
	cylinderLeft.rotateX(Math.PI/2);
	cylinderLeft.translate(steamChamberRad-0.25, -.25, steamChamberLen-steamCylindersLen/1.5);

	const cylinderRight = new THREE.CylinderGeometry(1.25, 1.5, steamCylindersLen);
	cylinderRight.rotateX(Math.PI/2);
	cylinderRight.translate(-steamChamberRad+0.25, -.25, steamChamberLen-steamCylindersLen/1.5);

	const cylindersGeometry = BufferGeometryUtils.mergeGeometries([cylinderRight, cylinderLeft]);
	const cylindersMaterial = new THREE.MeshPhongMaterial({
		color: 0x393939, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	chassis.add(new THREE.Mesh(cylindersGeometry, cylindersMaterial));
	chassis.position.set(0,-2,-2.75);

	const w1 = buildTrainWheel();
	w1.position.set(steamChamberRad-wheelThickness/2.1,0,0);
	a1.add(w1);

	const w2 = buildTrainWheel();
	w2.position.set(-steamChamberRad+wheelThickness/2.1,0,0);
	a1.add(w2);

	const w3 = buildTrainWheel();
	w3.position.set(steamChamberRad-wheelThickness/2.1,0,0);
	a2.add(w3);

	const w4 = buildTrainWheel();
	w4.position.set(-steamChamberRad+wheelThickness/2.1,0,);
	a2.add(w4);

	const w5 = buildTrainWheel();
	w5.position.set(steamChamberRad-wheelThickness/2.1,0,0);
	a3.add(w5);

	const w6 = buildTrainWheel();
	w6.position.set(-steamChamberRad+wheelThickness/2.1,0,0);
	a3.add(w6);

	const crankGeometry = new THREE.BoxGeometry(crankWidth, 0.5, crankLen);

	crankRight = new THREE.Mesh(crankGeometry, chassisMaterial);
	//crankRight.position.set(steamChamberRad, wheelOffset, crankOffset);

	crankLeft = new THREE.Mesh(crankGeometry, chassisMaterial);
	//crankLeft.position.set(-steamChamberRad, wheelOffset, crankOffset);

	chassis.add(crankLeft);
	chassis.add(crankRight);

	chassis.translateY(-wheelOffset);

	const lightRad = 1.10;
	const lightGeometry = new THREE.CylinderGeometry(lightRad, lightRad, 1, 32);
	lightGeometry.rotateX(Math.PI/2);

	const lightMaterial = new THREE.MeshPhongMaterial({
		color: 0x393939, 
		side: THREE.DoubleSide,
		shininess: 100.0,
		emissive: 0xf6d32d
	});

	const light = new THREE.Mesh(lightGeometry, lightMaterial);
	train.add(light)
	light.position.set(0,
		steamChamberRad+chassisOffset-lightRad/2-.30,
		(steamChamberLen+steamChamberEndLen)/2-.3);

	train.position.set(0, 2, 0);
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
	time += 0.05;

	requestAnimationFrame(mainLoop);

	crankLeft.position.set(-steamChamberRad-crankWidth/2,
		wheelOffset + 0.50*(Math.sin(time*Math.PI/2)),
		crankOffset - 0.50*(Math.cos(time*Math.PI/2)));

	crankRight.position.set(steamChamberRad+crankWidth/2,
		wheelOffset + 0.50*(Math.sin(time*Math.PI/2)),
		crankOffset - 0.50*(Math.cos(time*Math.PI/2)));

	renderer.render(scene, camera);
}

function main() {
	buildScene();
	mainLoop();
}

setupThreeJs();
main();
