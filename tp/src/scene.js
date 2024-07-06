import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { vertexShader, fragmentShader } from '/src/shaders.js';

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

let scene, camera, renderer, terrainMaterial, terrainGeometry, terrain, time;
let treesForbiddenMapData, treesForbiddenMap, elevationMap, elevationMapData;

let firstPersonControls, orbitControls;

let train, gui;
let cameras = [];
let objects = [];

let settings = {
	animationEnable: false,
	showTrain: true,
	currCameraIndex: 0,
	trainSpeed: 1.00
};

let raycaster;

let moveForward = false;
let moveForwardRunning = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// actualizar la variable global `amplitude` de '/src/track-map/'
const widthSegments   = 150;
const heightSegments  = 150;
const amplitude       = 10;
const amplitudeBottom = -2.10; // terrain offset

const textures = {
	sky:              { url: '/sky_day_void.jpg', object: null },
	roca:             { url: '/roca.jpg', object: null },
	pasto:            { url: '/pasto.jpg', object: null },
	tierra:           { url: '/tierra.jpg', object: null },
	madera:           { url: '/madera.jpg', object: null },
	durmientes:       { url: '/durmientes.jpg', object: null },
	elevationMap:     { url: '/elevation_map_wider_river.png', object: null },
	treeForbiddenMap: { url: '/tree_forbidden_zone_map_wider_path.png', object: null }
};

function onResize() {
	// const aspect = container.offsetWidth / container.offsetHeight;
	const aspect = window.innerWidth / window.innerHeight;

	for(let i = 0; i < cameras.length; ++i) {
		if(cameras[i] != undefined) {
			cameras[i].aspect = aspect;
			cameras[i].updateProjectionMatrix();
		}
	}

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function prevCamera() {
	const camerasCount = cameras.length;

	if(cameras[settings.currCameraIndex].name == "firstPersonCamera") {
		firstPersonControls.unlock();
		blocker.style.display = 'none';
		instructions.style.display = 'flex';
	}

	if(settings.currCameraIndex == 0) {
		settings.currCameraIndex = (camerasCount - 1);
	} else {
		settings.currCameraIndex -= 1;
	}

	if(cameras[settings.currCameraIndex].name == "firstPersonCamera") {
		firstPersonControls.unlock();
		blocker.style.display = 'block';
		instructions.style.display = 'flex';
	}
	onResize();
}

function nextCamera() {
	const camerasCount = cameras.length;

	if(cameras[settings.currCameraIndex].name == "firstPersonCamera") {
		firstPersonControls.unlock();
		blocker.style.display = 'none';
		instructions.style.display = 'flex';
	}

	if(settings.currCameraIndex == (camerasCount - 1)) {
		settings.currCameraIndex = 0;
	} else {
		settings.currCameraIndex += 1;
	}

	if(cameras[settings.currCameraIndex].name == "firstPersonCamera") {
		firstPersonControls.unlock();
		blocker.style.display = 'block';
		instructions.style.display = 'flex';
	}
	onResize();
}

const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );

function firstPersonCameraHandler(eventName) {
	// if(cameras[settings.currCameraIndex].name != "firstPersonCamera") {
	// 	console.log(cameras[settings.currCameraIndex].name);
	// 	return;
	// }

	// console.log(eventName);
	switch(eventName) {
		case 'click':
			console.log('click');
			firstPersonControls.lock();
			break;
		case 'lock':
			console.log('lock');
			instructions.style.display = 'none';
			blocker.style.display = 'none';
			break;
		case 'unlock':
			console.log('unlock');
			blocker.style.display = 'block';
			instructions.style.display = 'flex';
			break;
	}
}

function keyHandler(event) {
	// console.log(event);
	if(event.type == 'keydown') {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveForward = true;
				if(event.shiftKey) {
					moveForwardRunning = true;
				}
				break;
			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = true;
				break;
			case 'ArrowDown':
			case 'KeyS':
				moveBackward = true;
				break;
			case 'ArrowRight':
			case 'KeyD':
				moveRight = true;
				break;
			case "KeyC":
				if(event.shiftKey) {
					prevCamera();
				} else {
					nextCamera();
				}
				break;
			case 'Space':
				// if (firstPersonControls.isLocked === true) {
				// 	console.log(canJump);
				// 	velocity.y += 350;
				// 	break;
				// }
				console.log("Toggling train animations");
				settings.animationEnable = !settings.animationEnable;
				if(gui != undefined) {
					// update gui 'Animations' checkbox
					gui.__controllers[0].updateDisplay();
				}
				break;
		}
		switch(event.key) {
			case "Shift":
				if(!moveForwardRunning) {
					moveForwardRunning = true;
				}
				break;
			default:
				break;
		}				
	} else {
		// key up
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveForward = false;
				moveForwardRunning = false;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = false;
				break;
			case 'ArrowDown':
			case 'KeyS':
				moveBackward = false;
				break;
			case 'ArrowRight':
			case 'KeyD':
				moveRight = false;
				break;
		}
		switch(event.key) {
			case "Shift":
				if(moveForwardRunning) {
					moveForwardRunning = false;
				}
				break;
			default:
				break;
		}
	}
}

function setupFirstPersonControls() {
	const firstPersonCamera = new THREE.PerspectiveCamera(
		50, window.innerWidth / window.innerHeight, 0.1, 1000);

	firstPersonCamera.position.set(5, 5, 40);
	firstPersonCamera.lookAt(-10, 5, 0);
	firstPersonCamera.name = "firstPersonCamera"
	cameras.push(firstPersonCamera);

	firstPersonControls = new PointerLockControls(firstPersonCamera, document.body);


	instructions.addEventListener('click', function() {
		// console.log(event);
		firstPersonCameraHandler('click');
	});

	firstPersonControls.addEventListener('lock', function() {
		// console.log(event);
		firstPersonCameraHandler('lock');
	});

	firstPersonControls.addEventListener('unlock', function() {
		// console.log(event);
		firstPersonCameraHandler('unlock');
	});
	scene.add(firstPersonControls.getObject());

	window.addEventListener('keydown', (event) => {
		keyHandler(event);
	});

	window.addEventListener('keyup', (event) => {
		keyHandler(event);
	});
}

function setupThreeJs() {
	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	const topView = new THREE.PerspectiveCamera(
		35, window.innerWidth / window.innerHeight, 0.1, 1000);

	topView.position.set(-32, 38, 70);
	topView.lookAt(0, 0, 0);
	topView.name = "topView"
	cameras.push(topView);

	orbitControls = new OrbitControls(topView, renderer.domElement);

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
	bridge2.position.set(-14, -0.25, -41);
	// bridge2.rotateY(-Math.PI*0.118);

	const bridgeCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	bridgeCamera.position.set(-18, 11, -2.75);
	bridgeCamera.lookAt(50, 0, 42);
	bridge2.add(bridgeCamera);
	bridgeCamera.name = "bridgeCamera";
	cameras.push(bridgeCamera);

	scene.add(bridge1);
	scene.add(bridge2);

	objects.push(bridge1);
	objects.push(bridge2);
}

// loco -> locomotora/locomotive
function buildLoco() {
	train = buildTrain();

	const trainConductorCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainConductorCamera.position.set(0, 16, -20);
	trainConductorCamera.lookAt(0, 20, 100);
	train.add(trainConductorCamera);
	trainConductorCamera.name = "trainConductorCamera";
	cameras.push(trainConductorCamera);

	const trainCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainCamera.position.set(-22, 12, -26);
	trainCamera.lookAt(0, 10, 20);
	train.add(trainCamera);
	trainCamera.name = `trainCamera`;
	cameras.push(trainCamera);

	const trainBackCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainBackCamera.position.set(0, 16, -10);
	trainBackCamera.lookAt(0, 18, -100);
	train.add(trainBackCamera);
	trainBackCamera.name = "trainBackCamera";
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
	terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);

	terrainMaterial.onBeforeRender = (renderer, scene, camera, geometry, terrain) => {
		let m = terrain.matrixWorld.clone();
		m = m.transpose().invert();
		terrain.material.uniforms.worldNormalMatrix.value = m;
	};
	terrainMaterial.needsUpdate = true;
	scene.add(terrain);

	terrain.position.set(0, amplitudeBottom, 0);
	objects.push(terrain);

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
	tunnelCamera.name = "tunnelCamera";
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
	switch(currCamera.name) {
		case "topView":
			orbitControls.enabled = true;
			blocker.style.display = 'none';
			instructions.style.display = 'none';
			break;
		case "firstPersonCamera":
			orbitControls.enabled = false;
			break;
		default:
			orbitControls.enabled = false;
			blocker.style.display = 'none';
			instructions.style.display = 'none';
			break;
	}

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

		let x = railsData[0].x;
		let z = railsData[0].z;

		train.position.set(-1+x, 2.25, -1+z);
		train.lookAt(railsData[1].x*1000, 1.9, railsData[1].z*1000);
	}

	let time2 = performance.now();
	const firstPersonCameraHeight = 1.90;
	if (firstPersonControls.isLocked === true) {
		raycaster = new THREE.Raycaster();
		var raycasterPos = new THREE.Vector3();
		raycasterPos.copy(firstPersonControls.getObject().position)
		raycasterPos.y += 2;
		var raycasterDir = new THREE.Vector3(0, -1, 0);

		raycaster.set(raycasterPos, raycasterDir);
		const intersections = raycaster.intersectObjects(objects);
		let positionY;
		if((intersections == undefined) || (intersections[0] == undefined)) {
			positionY = 0.0;
		} else {
			positionY = intersections[0].point.y;
		}

		const delta = (time2 - prevTime) / 1000;

		velocity.x -= velocity.x * 11.0 * delta;
		velocity.z -= velocity.z * 11.0 * delta;
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveRight ) - Number( moveLeft );
		direction.normalize(); // this ensures consistent movements in all directions

		if (moveForward || moveBackward) {
			if(moveForwardRunning) {
				velocity.z -= direction.z * 200.0 * delta;
			} else {
				velocity.z -= direction.z * 100.0 * delta;
			}
		}

		if (moveLeft || moveRight) {
			velocity.x -= direction.x * 100.0 * delta;
		}

		// TODO: terrain limits
		firstPersonControls.moveRight(-velocity.x * delta);
		firstPersonControls.moveForward(-velocity.z * delta);

		firstPersonControls.getObject().position.y =
			positionY < 0.0 ? firstPersonCameraHeight : positionY + firstPersonCameraHeight;


		if (firstPersonControls.getObject().position.y < (positionY + firstPersonCameraHeight)) {
			velocity.y = 0;
			firstPersonControls.getObject().position.y = firstPersonCameraHeight;
			// canJump = true;
		}
	}
	prevTime = time2;
}

function main() {
	setupThreeJs();
	setupFirstPersonControls();
	time = 0.00;
	buildScene();
	createMenu();
	mainLoop();
}

loadTextures(main);
