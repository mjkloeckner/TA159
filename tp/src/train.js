import * as THREE from 'three';
import * as dat from 'dat.gui';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/treesShaders.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;

const textures = {
	tierra: { url: '/assets/tierra.jpg', object: null },
	roca: { url: '/assets/roca.jpg', object: null },
	pasto: { url: '/assets/pasto.jpg', object: null },
};

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

function buildChamber() {
	const steamChamberLen = 17;
	const steamChamberRad = 5;
	const steamChamberEndLen = 5;
	const cabinLen = 10;

	let geometries = [];

	const g1 = new THREE.CylinderGeometry( steamChamberRad, steamChamberRad,
		steamChamberLen, 32);

	geometries.push(g1);

	const g2 = new THREE.CylinderGeometry( steamChamberRad+0.75,
		steamChamberRad+0.75, steamChamberEndLen, 32);

	g2.translate(0,steamChamberLen/2 + steamChamberEndLen/2,0);
	geometries.push(g2);

	const g3 = new THREE.BoxGeometry(steamChamberRad*2,
	 	steamChamberLen + steamChamberEndLen + cabinLen, 1.0);

	g3.translate(0, -2.5, steamChamberRad);
	geometries.push(g3);

	const g4 = new THREE.BoxGeometry(10,10,20);
	g4.translate(0, -steamChamberLen+steamChamberEndLen, -steamChamberRad);
	geometries.push(g4);

	const g5 = new THREE.BoxGeometry(steamChamberRad*2,
	 	steamChamberLen + steamChamberEndLen + cabinLen, 1.0);

	g5.translate(0, -2.5, steamChamberRad);
	geometries.push(g3);

	const geometry = BufferGeometryUtils.mergeGeometries(geometries);
	return geometry;
}

function buildTrainChassis() {
	const g1 = new THREE.BoxGeometry(5, 5, 28);
	return g1;
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
	chamber.rotateX(Math.PI/2);
	train.add(chamber);

	const chassisGeometry = buildTrainChassis();
	const chassisMaterial = new THREE.MeshPhongMaterial({
		color: 0x7A7F80, 
		side: THREE.DoubleSide,
		shininess: 100.0
	});

	const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
	chassis.position.set(0, -7.5, -2);
	train.add(chassis);

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

function loadTextures(callback) {
	const loadingManager = new THREE.LoadingManager();

	loadingManager.onLoad = () => {
		console.log('All textures loaded');
		callback();
	};

	for (const key in textures) {
		console.log("Loading textures");
		const loader = new THREE.TextureLoader(loadingManager);
		const texture = textures[key];
		texture.object = loader.load(
			texture.url,
			onTextureLoaded.bind(this, key),
			null,
			(error) => {
				console.error(error);
			}
		);
	}
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
// loadTextures(main);
