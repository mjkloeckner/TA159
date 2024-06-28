import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/shaders.js';

import { generateTunnelGeometry } from '/src/tunnel.js';
import { createInstancedTrees } from '/src/track-map.js';
import { elevationGeometry } from '/src/terrain.js';
import { 
	buildRailsGeometry,
	buildRailsFoundationGeometry
} from '/src/rails.js';
import { buildTrain } from '/src/train.js';
import { generateBridge } from '/src/bridge.js';
import { updateTrainCrankPosition } from '/src/train.js';

let scene, camera, renderer, container, terrainMaterial, terrainGeometry, terrain, time;
let treesForbiddenMapData, treesForbiddenMap, elevationMap, elevationMapData;

const widthSegments   = 150;
const heightSegments  = 150;
const amplitude       = 10;
const amplitudeBottom = -2.10; // terrain offset

const textures = {
	roca:             { url: '/assets/roca.jpg', object: null },
	pasto:            { url: '/assets/pasto.jpg', object: null },
	tierra:           { url: '/assets/tierra.jpg', object: null },
	madera:           { url: '/assets/madera.jpg', object: null },
	durmientes:       { url: '/assets/durmientes.jpg', object: null },
	elevationMap:     { url: '/assets/elevation_map_wider_river.png', object: null },
	treeForbiddenMap: { url: '/assets/tree_forbidden_zone_map_wider_path.png', object: null }
};

let settings = {
	animationEnable: true,
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

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(100, 100, 100);
	scene.add(directionalLight);

	const gridHelper = new THREE.GridHelper(200, 200);
	scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	window.addEventListener('resize', onResize);
	onResize();
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
	bridge1.position.set(16, -0.75, 33);
	// bridge1.rotateY(-Math.PI*0.118);

	bridge2.scale.set(0.5, 0.5, 0.5);
	bridge2.position.set(-14, 0, -40);
	// bridge2.rotateY(-Math.PI*0.118);

	scene.add(bridge1);
	scene.add(bridge2);
}

// loco -> locomotora/locomotive
function buildLoco() {
	const train = buildTrain();
	train.scale.set(0.35, 0.35, 0.35)
	scene.add(train);
}

function buildRailsFoundation() {
	const railsFoundationGeometry = buildRailsFoundationGeometry();

	textures.durmientes.object.wrapS = THREE.RepeatWrapping;
	textures.durmientes.object.wrapT = THREE.RepeatWrapping;
	textures.durmientes.object.repeat.set(1, 60);
	textures.durmientes.object.anisotropy = 16;

	const railsFoundationMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.durmientes.object
	});

	const railsFoundation = new THREE.Mesh(railsFoundationGeometry, railsFoundationMaterial);
	railsFoundation.scale.set(2, 2, 2);
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
	rails.scale.set(2, 2, 2);
	scene.add(rails);
}

function buildTerrain() {
	// console.log('Building scene');

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
	const waterGeometry = new THREE.PlaneGeometry(width/2, height);
	const waterMaterial = new THREE.MeshPhongMaterial( {color: 0x12ABFF, side: THREE.DoubleSide} );
	const water = new THREE.Mesh( waterGeometry, waterMaterial );
	water.rotateX(Math.PI/2);
	water.position.set(0, 0, 0);
	scene.add(water);
}

function buildTunnel() {
	const tunnelGeometry = generateTunnelGeometry();

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

	const mesh = new THREE.Mesh(tunnelGeometry, tunnelMaterial) ;
	scene.add(mesh);
}

function buildTrees(count = 50) {
	const [treeLogs, treeLeaves] = createInstancedTrees(count);
	scene.add(treeLogs);
	scene.add(treeLeaves);
}

function createMenu() {
	const gui = new dat.GUI({ width: 250 });
	gui.add(settings, 'animationEnable', true).name('Animations enabled');
	// console.log(settings.animationEnable);
}

function buildScene() {
	console.log('Building scene');
	buildTunnel();
	// buildTrees(100);
	// buildTerrain();
	buildRailsFoundation();
	buildRails();
	buildLoco();
	// buildBridge();
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);

	time += 0.05;
	if(settings.animationEnable) {
		updateTrainCrankPosition(time);
	}
	renderer.render(scene, camera);
}

function main() {
	time = 0.00;
	buildScene();
	createMenu();
	mainLoop();
}

setupThreeJs();
loadTextures(main);
