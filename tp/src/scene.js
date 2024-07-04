import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/shaders.js';

import { generateTunnelGeometry } from '/src/tunnel.js';
import { createInstancedTrees } from '/src/trees.js';
import { elevationGeometry } from '/src/terrain.js';
import {
	getRailsPathPosAt,
	buildRailsGeometry,
	buildRailsFoundationGeometry
} from '/src/rails.js';
import { buildTrain } from '/src/train.js';
import { generateBridge } from '/src/bridge.js';
import { updateTrainCrankPosition } from '/src/train.js';

let scene, camera, renderer, container, terrainMaterial, terrainGeometry, terrain, time;
let treesForbiddenMapData, treesForbiddenMap, elevationMap, elevationMapData;

let train, gui;
let cameras = [];

let settings = {
	animationEnable: false,
	showTrain: true,
	currCameraIndex: 0,
	trainSpeed: 1.00
};

// actualizar la variable global `amplitude` de '/src/track-map/'
const widthSegments   = 150;
const heightSegments  = 150;
const amplitude       = 10;
const amplitudeBottom = -2.10; // terrain offset

const textures = {
	sky:              { url: '/assets/sky_day.jpg', object: null },
	roca:             { url: '/assets/roca.jpg', object: null },
	pasto:            { url: '/assets/pasto.jpg', object: null },
	tierra:           { url: '/assets/tierra.jpg', object: null },
	madera:           { url: '/assets/madera.jpg', object: null },
	durmientes:       { url: '/assets/durmientes.jpg', object: null },
	elevationMap:     { url: '/assets/elevation_map_wider_river.png', object: null },
	treeForbiddenMap: { url: '/assets/tree_forbidden_zone_map_wider_path.png', object: null }
};

function onResize() {
	const aspect = container.offsetWidth / container.offsetHeight;

	for(let i = 0; i < cameras.length; ++i) {
		if(cameras[i] != undefined) {
			cameras[i].aspect = aspect;
			cameras[i].updateProjectionMatrix();
		}
	}

	renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function nextCamera() {
	const camerasCount = cameras.length;

	if(settings.currCameraIndex == (camerasCount - 1)) {
		console.log("Restarting cameras");
		settings.currCameraIndex = 0;
	} else {
		settings.currCameraIndex += 1;
	}
}

function setupThreeJs() {
	scene = new THREE.Scene();
	container = document.getElementById('mainContainer');

	renderer = new THREE.WebGLRenderer();
	// renderer.setClearColor(0x606060);
	container.appendChild(renderer.domElement);

	const topView = new THREE.PerspectiveCamera(
		35, window.innerWidth / window.innerHeight, 0.1, 1000);

	topView.position.set(-50, 60, 50);
	topView.lookAt(0, 0, 0);
	cameras.push(topView);

	const controls = new OrbitControls(topView, renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xFFFFFF);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 0.25);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(100, 100, 100);
	scene.add(directionalLight);

	const helper = new THREE.HemisphereLightHelper(hemisphereLight, 5);
	// scene.add(helper) ;

	const gridHelper = new THREE.GridHelper(200, 200);
	// scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	// scene.add(axesHelper);

	window.addEventListener('resize', onResize);
	onResize();

	textures.sky.object.mapping = THREE.EquirectangularRefractionMapping;
	scene.background = textures.sky.object;

	window.addEventListener('keydown', (event) => {
		switch (event.key) {
			case "c":
				nextCamera();
				break;
			case ' ':
				console.log("Toggling train animations");
				settings.animationEnable = !settings.animationEnable;
				if(gui != undefined) {
					// update gui 'Animations' checkbox
					gui.__controllers[0].updateDisplay();
				}
				break
		}
	});
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

function buildBridge() {
	// const bridge1 = generateBridge();
	// const bridge2 = generateBridge();

	// (arcCount, arcRadius, columnWidth, columnHeight, padding, squaresCount, squareLen)
	const bridge1 = generateBridge(1, 3, 0, 0, 10, 2, 2);
	const bridge2 = generateBridge(2, 2, 1, 0, 15, 3, 2);

	bridge1.scale.set(0.5, 0.5, 0.5);
	bridge1.position.set(16, -0.75, 36);
	// bridge1.rotateY(-Math.PI*0.118);

	bridge2.scale.set(0.5, 0.5, 0.5);
	bridge2.position.set(-14, 0, -41);
	// bridge2.rotateY(-Math.PI*0.118);

	const bridgeCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	bridgeCamera.position.set(-18, 11, -2.75);
	bridgeCamera.lookAt(50, 0, 42);
	bridge2.add(bridgeCamera);
	cameras.push(bridgeCamera);

	scene.add(bridge1);
	scene.add(bridge2);
}

// loco -> locomotora/locomotive
function buildLoco() {
	train = buildTrain();

	const trainConductorCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainConductorCamera.position.set(0, 16, -20);
	trainConductorCamera.lookAt(0, 20, 100);
	train.add(trainConductorCamera);
	cameras.push(trainConductorCamera);

	const trainCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainCamera.position.set(-22, 12, -26);
	trainCamera.lookAt(0, 10, 20);
	train.add(trainCamera);
	cameras.push(trainCamera);

	const trainBackCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainBackCamera.position.set(0, 16, -10);
	trainBackCamera.lookAt(0, 18, -100);
	train.add(trainBackCamera);
	cameras.push(trainBackCamera);

	train.scale.set(0.075, 0.10, 0.09);
	train.visible = settings.showTrain;
	scene.add(train);
}

function buildRailsFoundation() {
	const railsFoundationGeometry = buildRailsFoundationGeometry();

	textures.durmientes.object.wrapS = THREE.RepeatWrapping;
	textures.durmientes.object.wrapT = THREE.RepeatWrapping;
	textures.durmientes.object.repeat.set(1, 150);
	textures.durmientes.object.anisotropy = 16;

	// load into `map` the example texture
	const map = new THREE.TextureLoader().load(
		'https://threejs.org/examples/textures/uv_grid_opengl.jpg');
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(1, 80);
	map.anisotropy = 16;
	// map.rotation = Math.PI/2;

	const railsFoundationMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.durmientes.object
		// map: map
	});

	const railsFoundation = new THREE.Mesh(railsFoundationGeometry, railsFoundationMaterial);
	railsFoundation.position.set(-1, 1.25, -1);
	railsFoundation.scale.set(1.00, 1.50, 1.00);
	scene.add(railsFoundation);
}

function buildRails() {
	const railsGeometry = buildRailsGeometry();
	const railsMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		color: 0xFFFFFF
	});

	const rails = new THREE.Mesh(railsGeometry, railsMaterial);
	rails.position.set(-1, 1.25, -1);
	rails.scale.set(1.00, 1.50, 1.00);
	scene.add(rails);
}

function buildTerrain() {
	const width = 100;
	const height = 100;

	terrainGeometry = elevationGeometry(
		width, height,
		amplitude,
		widthSegments, heightSegments,
		textures.elevationMap.object);

	console.log('Applying textures');
	terrainMaterial = new THREE.RawShaderMaterial({
		uniforms: {
			dirtSampler: { type: 't', value: textures.tierra.object },
			rockSampler: { type: 't', value: textures.roca.object },
			grassSampler: { type: 't', value: textures.pasto.object },
			scale: { type: 'f', value: 3.0 },
			terrainAmplitude: { type: 'f', value: amplitude },
			terrainAmplitudeBottom: { type: 'f', value: amplitudeBottom },
			worldNormalMatrix: { type: 'm4', value: null },
			dirtStepWidth: { type: 'f', value: 0.20 },
			rockStepWidth: { type: 'f', value: 0.15 },
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
	});
	terrainMaterial.needsUpdate = true;

	terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
	terrain.position.set(0, amplitudeBottom, 0);
	scene.add(terrain);

	console.log('Generating water');
	const waterGeometry = new THREE.PlaneGeometry(width/2, height-1.25);
	const waterMaterial = new THREE.MeshPhongMaterial( {color: 0x12ABFF, side: THREE.DoubleSide} );
	const water = new THREE.Mesh( waterGeometry, waterMaterial );
	water.rotateX(Math.PI/2);
	water.position.set(0, 0, -0.65);
	scene.add(water);
}

function buildTunnel() {
	// tunnelHeight = 20, tunnelWidth = 14, tunnelWallThickness = 0.5, tunnelLen = 26
	const tunnelGeometry = generateTunnelGeometry(24, 12, 0.5, 46);

	textures.madera.object.wrapS = THREE.RepeatWrapping;
	textures.madera.object.wrapT = THREE.RepeatWrapping;
	textures.madera.object.repeat.set(0.10, 0.10);
	textures.madera.object.anisotropy = 16;

	const tunnelMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.madera.object
	});

	const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial) ;
	tunnel.scale.set(0.5, 0.5, 0.5);

	const trainPathPos = getRailsPathPosAt(0.32);
	tunnel.position.set(trainPathPos[0].x, 0, trainPathPos[0].z);
	tunnel.lookAt(trainPathPos[1].x*1000, 0, trainPathPos[1].z*1000);
	console.log(trainPathPos);

	scene.add(tunnel);

	const tunnelCamera = new THREE.PerspectiveCamera(
		65, window.innerWidth / window.innerHeight, 0.1, 10000);

	tunnelCamera.position.set(-1, 12, 18);
	tunnelCamera.lookAt(0, 10, -10);
	tunnel.add(tunnelCamera);
	cameras.push(tunnelCamera);
}

function buildTrees(count = 50) {
	const [treeLogs, treeLeaves] = createInstancedTrees(count);
	scene.add(treeLogs);
	scene.add(treeLeaves);
}

function createMenu() {
	gui = new dat.GUI({ width: 250 });
	gui.add(settings, 'animationEnable', true).name('Animations enabled');
	gui.add(settings, 'showTrain', false).name('Show train').onChange(
		function () {
			train.visible = !train.visible;
		});
}

function buildScene() {
	console.log('Building scene');
	buildTunnel();
	buildTrees(100);
	buildTerrain();
	buildRailsFoundation();
	buildRails();
	buildLoco();
	buildBridge();
}

function mainLoop() {
	let currCamera = cameras[settings.currCameraIndex];

	requestAnimationFrame(mainLoop);
	renderer.render(scene, currCamera);

	const dt = 0.001;
	if(settings.animationEnable) {
		time = (time < 1.0-dt) ? (time + dt) : 0.00;
	}

	if(train.visible) {
		updateTrainCrankPosition(time*100);
		const trainPos = getRailsPathPosAt(time);
		const railsData = getRailsPathPosAt(time);
		// [railsPath.getPointAt(t), railsPath.getTangentAt(t)]

		let x = railsData[0].x;
		let z = railsData[0].z;

		// translationMatrix.makeTranslation(trainPos);
		// rotMatrix.identity();

		// translationMatrix.makeTranslation(trainPos);
		// train.position.set(0, 0, 0);
		// train.position.set(time*10, 1.9, 0);
		train.position.set(-1+x, 2.25, -1+z);
		// railsFoundation.position.set(-1, 1.25, -1);
		train.lookAt(railsData[1].x*1000, 1.9, railsData[1].z*1000);
		// train.lookAt(0, 1.9, 0);
	}
}

function main() {
	setupThreeJs();
	time = 0.00;
	buildScene();
	createMenu();
	mainLoop();
}

loadTextures(main);
