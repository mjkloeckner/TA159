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

let scene, camera, renderer, terrainGeometry, terrain, time, gui;
let treesForbiddenMapData, treesForbiddenMap, elevationMap, elevationMapData;

let firstPersonControls, orbitControls;

let train, trainLight, trainLight2, trainLight3;

let helpers = [];
let cameras = [];
let objects = [];
let lights = {
	ambient:     { object: null },
	directional: { object: null },
	hemisphere:  { object: null }
};

let settings = {
	animationEnable: false,
	showTrain: true,
	currCameraIndex: 0,
	nightMode: true,
	showHelpers: false,
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

import skyDayUrl           from './assets/sky_day_void.jpg'
import skyNightUrl         from './assets/sky_night.jpg'
import rocaUrl             from './assets/roca.jpg'
import pastoUrl            from './assets/pasto.jpg'
import tierraUrl           from './assets/tierra.jpg'
import maderaUrl           from './assets/madera.jpg'
import durmientesUrl       from './assets/durmientes.jpg'
import elevationMapUrl     from './assets/elevation_map_wider_river.png'
import treeForbiddenMapUrl from './assets/tree_forbidden_zone_map_wider_path.png'

const textures = {
	skyDay:           { url: skyDayUrl, object: null },
	skyNight:         { url: skyNightUrl, object: null },
	roca:             { url: rocaUrl, object: null },
	pasto:            { url: pastoUrl, object: null },
	tierra:           { url: tierraUrl, object: null },
	madera:           { url: maderaUrl, object: null },
	durmientes:       { url: durmientesUrl, object: null },
	elevationMap:     { url: elevationMapUrl, object: null },
	treeForbiddenMap: { url: treeForbiddenMapUrl, object: null }
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

	firstPersonCamera.position.set(0, 5, 20);
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
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);

	const topView = new THREE.PerspectiveCamera(
		35, window.innerWidth / window.innerHeight, 0.1, 1000);

	topView.position.set(-32, 38, 70);
	topView.lookAt(0, 0, 0);
	topView.name = "topView"
	cameras.push(topView);

	orbitControls = new OrbitControls(topView, renderer.domElement);

	lights.ambient.object = new THREE.AmbientLight(0xffffff);

	lights.hemisphere.object = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 0.25);

	lights.directional.object = new THREE.DirectionalLight(0xffffff, 1);
	lights.directional.object.position.set(-100, 100, 100);

	// Set up shadow properties for the light
	lights.directional.object.castShadow            = true;
	lights.directional.object.shadow.mapSize.width  = 1024;
	lights.directional.object.shadow.mapSize.height = 1024;

	lights.directional.object.shadow.camera = new THREE.OrthographicCamera(
		-65, 65, 65, -40, 0.5, 225); 

	const directionalLightShadowsHelper = new THREE.CameraHelper(lights.directional.object.shadow.camera);
	directionalLightShadowsHelper.visible = settings.showHelpers;
	scene.add(directionalLightShadowsHelper);
	helpers.push(directionalLightShadowsHelper);

	scene.add(lights.ambient.object);
	scene.add(lights.hemisphere.object);
	scene.add(lights.directional.object);

	if(settings.nightMode == true) {
		lights.ambient.object.visible = false;
		lights.hemisphere.object.intensity = 0;
		lights.directional.object.color.setHex(0xcdddfe); // 0x090254; 0xa8a1fd
		scene.background = textures.skyNight.object;
		lights.directional.object.position.set(100, 100, 100); // math the skybox texture moon light
	} else {
		lights.ambient.object.visible = true;
		lights.hemisphere.object.intensity = 1;
		lights.directional.object.intensity = 1;
		lights.directional.object.color.setHex(0xFFFFFF);
		scene.background = textures.skyDay.object;
		lights.directional.object.position.set(-100, 100, 100);
	}
	
	const hemisphereLightHelper = new THREE.HemisphereLightHelper(lights.hemisphere.object, 5);
	helpers.push(hemisphereLightHelper);

	const directionalLightHelper = new THREE.DirectionalLightHelper(lights.directional.object, 5);
	helpers.push(directionalLightHelper);

	const gridHelper = new THREE.GridHelper(200, 200);
	helpers.push(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	helpers.push(axesHelper);

	for(let i = 0; i < helpers.length; ++i) {
		helpers[i].visible = settings.showHelpers;
		scene.add(helpers[i]);
	}

	window.addEventListener('resize', onResize);
	onResize();

	textures.skyDay.object.mapping = THREE.EquirectangularRefractionMapping;
	textures.skyNight.object.mapping = THREE.EquirectangularRefractionMapping;

	if(settings.nightMode == true) {
		scene.background = textures.skyNight.object;
	} else {
		scene.background = textures.skyDay.object;
	}
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

	bridge1.castShadow    = true;
	bridge1.receiveShadow = true;
	bridge2.castShadow    = true;
	bridge2.receiveShadow = true;

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

	trainConductorCamera.position.set(0, 7, -11);
	trainConductorCamera.lookAt(0, 20, 100);
	train.add(trainConductorCamera);
	trainConductorCamera.name = "trainConductorCamera";
	cameras.push(trainConductorCamera);

	const trainCamera = new THREE.PerspectiveCamera(
		55, window.innerWidth / window.innerHeight, 0.1, 10000);

	trainCamera.position.set(-12, 6, -20);
	trainCamera.lookAt(0, 10, 15);
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

	// SpotLight(color: Int, intensity: Float, distance: Float, angle: Radians, penumbra: Float, decay: Float)
	trainLight = new THREE.SpotLight(0xffffff, 200.0, 100.0, Math.PI/6, 0.5, 1.0);
	train.add(trainLight.target);
	train.add(trainLight);
	trainLight.position.set(0, 4, 5);
	trainLight.target.position.set(0, -100, 1000);
	trainLight.target.updateMatrixWorld();

	trainLight2 = new THREE.SpotLight(0xffffff, 10.0, 3.0, Math.PI/6, 0.5, 0.5);
	train.add(trainLight2.target);
	train.add(trainLight2);
	trainLight2.position.set(0, 3.25, 15);
	trainLight2.target.position.set(0, 0, -100);
	trainLight2.target.updateMatrixWorld();

	trainLight3 = new THREE.SpotLight(0xffffff, 10.0, 16.0, Math.PI/3, 0.5, 0.5);
	train.add(trainLight3.target);
	train.add(trainLight3);
	trainLight3.position.set(0, 5, 5);
	trainLight3.target.position.set(0, -25, 100);
	trainLight3.target.updateMatrixWorld();

	//Set up shadow properties for the light
	trainLight.castShadow            = true; // default false
	trainLight.shadow.mapSize.width  = 512; // default
	trainLight.shadow.mapSize.height = 512; // default
	trainLight.shadow.camera.near    = 0.5; // default
	trainLight.shadow.camera.far     = 40; // default
	trainLight.shadow.focus          = 1; // default

	trainLight3.castShadow            = true; // default false
	trainLight3.shadow.mapSize.width  = 512; // default
	trainLight3.shadow.mapSize.height = 512; // default
	trainLight3.shadow.camera.near    = 0.5; // default
	trainLight3.shadow.camera.far     = 100; // default
	trainLight3.shadow.focus          = 1; // default

	const trainLightHelper = new THREE.CameraHelper(trainLight.shadow.camera);
	const trainLight2Helper = new THREE.CameraHelper(trainLight2.shadow.camera);
	const trainLight3Helper = new THREE.CameraHelper(trainLight3.shadow.camera);

	trainLightHelper.visible  = settings.showHelpers;
	trainLight2Helper.visible = settings.showHelpers;
	trainLight3Helper.visible = settings.showHelpers;

	helpers.push(trainLightHelper);
	helpers.push(trainLight2Helper);
	helpers.push(trainLight3Helper);

	train.scale.set(0.145, 0.145, 0.145);
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
	// const map = new THREE.TextureLoader().load(
	// 	'https://threejs.org/examples/textures/uv_grid_opengl.jpg');
	// map.wrapS = map.wrapT = THREE.RepeatWrapping;
	// map.repeat.set(1, 80);
	// map.anisotropy = 16;
	// map.rotation = Math.PI/2;

	const railsFoundationMaterial = new THREE.MeshPhongMaterial({
		side: THREE.FrontSide,
		map: textures.durmientes.object
		// map: map
	});

	const railsFoundation = new THREE.Mesh(railsFoundationGeometry, railsFoundationMaterial);
	railsFoundation.receiveShadow = true;
	railsFoundation.castShadow    = true;
	railsFoundation.position.set(-1, 1.25, -1);
	railsFoundation.scale.set(1.00, 1.50, 1.00);
	scene.add(railsFoundation);
	// descomentando esto se tiene en cuenta la altura del terraplen de las vias
	// para la camara en primera person pero resulta en muy baja performance
	// objects.push(railsFoundation);
}

function buildRails() {
	const railsGeometry = buildRailsGeometry();
	const railsMaterial = new THREE.MeshPhongMaterial({
		side: THREE.BackSide,
		color: 0xFFFFFF
	});

	const rails = new THREE.Mesh(railsGeometry, railsMaterial);
	rails.castShadow = true;
	rails.receiveShadow = true;
	rails.position.set(-1, 1.25, -1);
	rails.scale.set(1.00, 1.50, 1.00);
	scene.add(rails);
}

function buildTerrainCustomMaterial() {
	const customMaterial = new THREE.MeshPhongMaterial({
		color: 0xffffff,
		specular: 0x333333,
		side: THREE.FrontSide,
	});

	// definos las variables uniformes adicionales que necesitamos
	let additionalUniforms = {
		// grassTexture: { value: grassTexture, type: 't' },
		// rockTexture: { value: rockTexture, type: 't' },

		dirtSampler: { type: 't', value: textures.tierra.object },
		rockSampler: { type: 't', value: textures.roca.object },
		grassSampler: { type: 't', value: textures.pasto.object },
		scale: { type: 'f', value: 3.0 },
		terrainAmplitude: { type: 'f', value: amplitude },
		terrainAmplitudeBottom: { type: 'f', value: amplitudeBottom },
		worldNormalMatrix: { type: 'm4', value: null },
		dirtStepWidth: { type: 'f', value: 0.20 },
		rockStepWidth: { type: 'f', value: 0.15 },
	};
	// le decimos al material que vamos a usar UVs para que incluya las coordenadas UV en el shader
	customMaterial.defines = { USE_UV: true };

	// Este callback se ejecuta antes de compilar el shader
	// Hay que ver como referencia el archivo
	// node_modules/three/src/renderers/shaders/ShaderLib/meshphong.glsl.js
	// para saber que chunks podemos reemplazar

	customMaterial.onBeforeCompile = function (shader) {
		// le agregamos las variables uniformes adicionales al shader
		shader.uniforms.dirtSampler = additionalUniforms.dirtSampler;
		shader.uniforms.rockSampler = additionalUniforms.rockSampler;
		shader.uniforms.grassSampler = additionalUniforms.grassSampler;
		shader.uniforms.scale = additionalUniforms.scale;
		shader.uniforms.terrainAmplitude = additionalUniforms.terrainAmplitude;
		shader.uniforms.terrainAmplitudeBottom = additionalUniforms.terrainAmplitudeBottom;
		shader.uniforms.worldNormalMatrix = additionalUniforms.worldNormalMatrix;
		shader.uniforms.dirtStepWidth = additionalUniforms.dirtStepWidth;
		shader.uniforms.rockStepWidth = additionalUniforms.rockStepWidth;

		// hacemos un search and replace en el vertex shader
		// buscamos la linea que dice
		// vViewPosition = - mvPosition.xyz;
		// y le agregamos una linea mas que guarde la posicion del vertice en el espacio del mundo
		shader.vertexShader = shader.vertexShader.replace(
			'vViewPosition = - mvPosition.xyz;',
			`vViewPosition = - mvPosition.xyz;
			 vWorldPosition = (modelMatrix*vec4(transformed,1.0)).xyz;`
		);

		// agregamos una variable varying al comienzo del vertex shader
		// para pasar la posicion del vertice en coordenadas del mundo al fragment shader
		shader.vertexShader =
			`varying vec3 vWorldPosition;
		` + shader.vertexShader;

		// agregamos las variables uniformes y varying al fragment shader
		// Siempre hay que tener cuidado con los nombres de las variables que definimos
		// no deben coincidir con las variables que usa Three.js

		shader.fragmentShader = `
uniform float scale;
uniform float terrainAmplitude;
uniform float terrainAmplitudeBottom;
uniform float dirtStepWidth;
uniform float rockStepWidth;

uniform sampler2D dirtSampler;
uniform sampler2D rockSampler;
uniform sampler2D grassSampler;
varying vec3 vWorldPosition;

` + shader.fragmentShader;

		shader.fragmentShader = shader.fragmentShader.replace(
			'void main() {',
			`
float myNormalizeFunc(float inputValue, float minValue, float maxValue) {
	return (inputValue - minValue) / (maxValue - minValue);
}

void main () {
	float heightFactor = vWorldPosition.y - terrainAmplitudeBottom;
	float heightFactorNormalized = myNormalizeFunc(heightFactor, 0.0, terrainAmplitude);
`);

		// reemplazamos el include del chunk map_fragment por nuestro propio codigo
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <map_fragment>',
			`// calculamos las coordenadas UV en base a las coordenadas de mundo
vec2 uvCoords=vWorldPosition.xz/100.0;
vec2 myUV  = uvCoords*8.0;
vec2 myUV2 = uvCoords*scale;

vec3 grass = texture2D(grassSampler, uvCoords).xyz;
vec3 dirt  = texture2D(dirtSampler, uvCoords*4.0).xyz;
vec3 rock  = texture2D(rockSampler, uvCoords).xyz;

// si quisieramos podriamos usar la variabl vUv tambien que son las coordenadas UV del vertice

// muestreo de pasto a diferentes escalas, luego se combina con \`mix()\`
vec3 grass1 = texture2D(grassSampler, myUV2*1.00).xyz;
vec3 grass2 = texture2D(grassSampler, myUV2*3.13).xyz;
vec3 grass3 = texture2D(grassSampler, myUV2*2.37).xyz;
vec3 colorGrass = mix(mix(grass1,grass2,0.5),grass3,0.3);

// lo mismo para la textura de tierra
vec3 dirt1 = texture2D(dirtSampler, myUV2*3.77).xyz;
vec3 dirt2 = texture2D(dirtSampler, myUV2*1.58).xyz;
vec3 dirt3 = texture2D(dirtSampler, myUV2*1.00).xyz;
vec3 colorDirt = mix(mix(dirt1, dirt2, 0.5), dirt3, 0.3);

// lo mismo para la textura de roca
vec3 rock1 = texture2D(rockSampler,myUV2*0.40).xyz;
vec3 rock2 = texture2D(rockSampler,myUV2*2.38).xyz;
vec3 rock3 = texture2D(rockSampler,myUV2*3.08).xyz;
vec3 colorRock = mix(mix(rock1, rock2, 0.5), rock3,0.5);

float u = heightFactorNormalized;

float width2 = rockStepWidth;
float rockFactor = 2.00 - smoothstep(0.0, width2, u) - smoothstep(1.0, 1.00 - width2, u);

float width = dirtStepWidth;
float s1 = smoothstep(0.00, width, u);
float s2 = smoothstep(width, width*2.0, u);
float s3 = smoothstep(0.50, 0.50 + width, u);
float s4 = smoothstep(0.50 + width, 0.50 + width*2.0, u);
float dirtFactor = (s1 - s2) + (s3 - s4);

float grassFactor = smoothstep(0.0, 0.35, u) - smoothstep(0.35, 1.00, u);

vec3 colorDirtGrass = mix(colorDirt, colorGrass, grassFactor);
vec3 colorDirtGrassDirt = mix(colorDirtGrass, colorDirt, dirtFactor);
vec3 color = mix(colorDirtGrassDirt, colorRock, rockFactor);

diffuseColor = vec4(color, 1.0);

// leemos los colores de las texturas
// vec4 grassColor = texture2D(grassSampler,uvCoords);
// vec4 rockColor = texture2D(rockSampler,uvCoords);

// mezclamos los colores en base a la altura del vertice
// diffuseColor = mix(grassColor, rockColor, smoothstep(0.0,5.0,vWorldPosition.y));`);

		// imprimimos el shader para debuggear
		// console.log(shader.vertexShader);
		// console.log(shader.fragmentShader);
	};
	return customMaterial;
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

	const customMaterial = buildTerrainCustomMaterial();
	terrain = new THREE.Mesh(terrainGeometry, customMaterial);

	terrain.castShadow = true;
	terrain.receiveShadow = true;

	scene.add(terrain);

	terrain.position.set(0, amplitudeBottom, 0);
	objects.push(terrain);

	console.log('Generating water');
	const waterGeometry = new THREE.PlaneGeometry(width/2, height-1.25);
	const waterMaterial = new THREE.MeshPhongMaterial( {color: 0x12ABFF, side: THREE.BackSide} );
	const water = new THREE.Mesh( waterGeometry, waterMaterial );
	water.rotateX(Math.PI/2);
	water.position.set(0, 0, -0.65);

	water.castShadow    = false;
	water.receiveShadow = true;
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
		side: THREE.FrontSide,
		map: textures.madera.object
	});

	const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial) ;
	tunnel.castShadow = true;
	tunnel.receiveShadow = true;
	tunnel.scale.set(0.5, 0.5, 0.5);

	const trainPathPos = getRailsPathPosAt(0.32);
	tunnel.position.set(trainPathPos[0].x, 0, trainPathPos[0].z);
	tunnel.lookAt(trainPathPos[1].x*1000, 0, trainPathPos[1].z*1000);

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

	treeLogs.castShadow    = true;
	treeLogs.receiveShadow = true;
	treeLeaves.castShadow    = true;
	treeLeaves.receiveShadow = true;
}

function toggleNightMode() {
	console.log("Toggling night mode");
	console.log(settings.nightMode);
	if(settings.nightMode == true) {
		lights.ambient.object.visible = false;
		lights.hemisphere.object.intensity = 0;
		lights.directional.object.color.setHex(0xcdddfe); // 0x090254; 0xa8a1fd
		scene.background = textures.skyNight.object;
		lights.directional.object.position.set(100, 100, 100); // match the skybox texture moon light
		trainLight.visible = true;
		trainLight2.visible = true;
		trainLight3.visible = true;
	} else {
		lights.ambient.object.visible = true;
		lights.hemisphere.object.intensity = 1;
		lights.directional.object.intensity = 1;
		lights.directional.object.color.setHex(0xFFFFFF);
		scene.background = textures.skyDay.object;
		lights.directional.object.position.set(-100, 100, 100);
		trainLight.visible = false;
		trainLight2.visible = false;
		trainLight3.visible = false;
	}
}

function createMenu() {
	gui = new dat.GUI({ width: 250 });
	gui.add(settings, 'animationEnable', true).name('Animaciones');
	gui.add(settings, 'showTrain').name('Mostrar tren').onChange(
		function () {
			train.visible = !train.visible;
		});
	gui.add(settings, 'nightMode', false).name('Modo noche').onChange(toggleNightMode);
	gui.add(settings, 'showHelpers', true).name('Mostrar Guias').onChange(
		function() {
			for(let i = 0; i < helpers.length; ++i) {
				helpers[i].visible = settings.showHelpers;
				scene.add(helpers[i]);
			}
		});
}

function buildScene() {
	console.log('Building scene');
	buildTunnel();
	buildTrees(350);
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
			if(settings.nightMode == true) {
				trainLight.intensity = 200;
				trainLight.distance = 100;
			}
			break;
		case "firstPersonCamera":
			orbitControls.enabled = false;
			if(settings.nightMode == true) {
				trainLight.intensity = 200;
				trainLight.distance = 100;
			}
			break;
		case "trainCamera":
		case "trainConductorCamera":
			// por alguna razon cuando la camara es `trainConductorCamera`
			// la luz principal del tren se ve mas tenue
			if(settings.nightMode == true) {
				trainLight.intensity = 1000;
				trainLight.distance = 1000;
			}
			break;
		default:
			orbitControls.enabled = false;
			blocker.style.display = 'none';
			instructions.style.display = 'none';
			if(settings.nightMode == true) {
				trainLight.intensity = 200;
				trainLight.distance = 100;
			}
			break;
	}

	requestAnimationFrame(mainLoop);
	renderer.render(scene, currCamera);

	const dt = 0.001;
	if(settings.animationEnable) {
		time = (time < 1.0-dt) ? (time + dt) : 0.00;
	}

	if(train.visible) {
		updateTrainCrankPosition(time*200);
		const trainPos = getRailsPathPosAt(time);
		const railsData = getRailsPathPosAt(time);

		let x = railsData[0].x;
		let z = railsData[0].z;

		train.position.set(-1+x, 2.30, -1+z);
		train.lookAt(railsData[1].x*1000, 1.9, railsData[1].z*1000);
	}

	let time2 = performance.now();
	const firstPersonCameraHeight = 1.60;
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
	time = 0.90;
	buildScene();
	createMenu();
	nextCamera();
	mainLoop();
}

loadTextures(main);
