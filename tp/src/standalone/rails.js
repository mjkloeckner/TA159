import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;
let spherePath;
let railsPath;
let railsFoundationShape;

const textures = {
	tierra:     { url: '/assets/tierra.jpg', object: null },
	roca:       { url: '/assets/roca.jpg', object: null },
	pasto:      { url: '/assets/pasto.jpg', object: null },
	durmientes: { url: '/assets/durmientes.jpg', object: null },
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

	camera = new THREE.PerspectiveCamera(
		35, window.innerWidth / window.innerHeight, 0.1, 1000);

	camera.position.set(-10, 15, -10);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(100, 100, 100);
	scene.add(directionalLight);

	const gridHelper = new THREE.GridHelper(50, 20);
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

function parametricRailsFoundationFunction(u, v, target) {
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const levelMatrix = new THREE.Matrix4();

	let railsPathPos = railsPath.getPointAt(v);
	let railsFoundationShapePos = railsFoundationShape.getPointAt(u);
	// TODO: make `railsFoundationShape` smaller and remove this multiplication
	railsFoundationShapePos.multiplyScalar(0.5);

	let tangente = new THREE.Vector3();
	let binormal = new THREE.Vector3();
	let normal = new THREE.Vector3();

	tangente = railsPath.getTangent(v);

	tangente.normalize();
	binormal = new THREE.Vector3(0, 1, 0);
	normal.crossVectors(tangente, binormal);

	translationMatrix.makeTranslation(railsPathPos);

	rotMatrix.identity();
	levelMatrix.identity();

	levelMatrix.makeTranslation(railsPathPos);
	rotMatrix.makeBasis(normal, tangente, binormal);
	levelMatrix.multiply(rotMatrix);
	railsFoundationShapePos.applyMatrix4(levelMatrix);
	
	const x = railsFoundationShapePos.x;
	const y = railsFoundationShapePos.y;
	const z = railsFoundationShapePos.z;
	target.set(x, y, z);
}

export function buildRailsFoundation() {
	railsFoundationShape = new THREE.CatmullRomCurve3([
		new THREE.Vector3( -2.00, 0.00, 0.00),
		new THREE.Vector3( -1.00, 0.00, 0.50),
		new THREE.Vector3(  0.00, 0.00, 0.55),
		new THREE.Vector3(  1.00, 0.00, 0.50),
		new THREE.Vector3(  2.00, 0.00, 0.00),
	], false);

	/*
	// show rails foundation shape
	const points = railsFoundationShape.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);
	*/
	const pGeometry = new ParametricGeometry(
		parametricRailsFoundationFunction, 100, 100);
	
	textures.durmientes.object.wrapS = THREE.RepeatWrapping;
	textures.durmientes.object.wrapT = THREE.RepeatWrapping;
	textures.durmientes.object.repeat.set(1, 60);
	textures.durmientes.object.anisotropy = 16;

	/*
	// load into `map` the example texture
	const map = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(1, 30);
	map.anisotropy = 16;
	// map.rotation = Math.PI/2;
	*/

	const pMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.durmientes.object
	});
	const pMesh = new THREE.Mesh(pGeometry, pMaterial);
	scene.add(pMesh);
}

// `position` es de tipo `THREE.Vector3` y representa la translacion de la
// forma del rail con respecto al origen del sist. de coordenadas de modelado
function getParametricRailsFunction(radius, position) {
	return function parametricRails(u, v, target) {
		const rotMatrix = new THREE.Matrix4();
		const translationMatrix = new THREE.Matrix4();
		const levelMatrix = new THREE.Matrix4();

		let railsShape = new THREE.Vector3();

		let railsPathPos = railsPath.getPointAt(v);
		let railsShapePos = new THREE.Vector3(
			Math.cos(u*6.28) + position.x,
			position.y,
			Math.sin(u*6.28) + position.z);

		railsShapePos.multiplyScalar(0.1*railsRadius);

		let tangente = new THREE.Vector3();
		let binormal = new THREE.Vector3();
		let normal = new THREE.Vector3();

		// https://threejs.org/docs/index.html?q=curve#api/en/extras/core/Curve.getTangent
		tangente = railsPath.getTangentAt(v);
		binormal = new THREE.Vector3(0, 1, 0);
		normal.crossVectors(tangente, binormal);

		translationMatrix.makeTranslation(railsPathPos);

		rotMatrix.identity();
		levelMatrix.identity();

		levelMatrix.makeTranslation(railsPathPos);
		rotMatrix.makeBasis(normal, tangente, binormal);
		levelMatrix.multiply(rotMatrix);
		railsShapePos.applyMatrix4(levelMatrix);
		
		const x = railsShapePos.x;
		const y = railsShapePos.y;
		const z = railsShapePos.z;
		target.set(x, y, z);
	}
}

const railsRadius = 0.35;
function buildRails() {
	let railsGeometries = [];

	const leftRailGeometryFunction  = getParametricRailsFunction(railsRadius,
		new THREE.Vector3( 6, 0, railsRadius+8));

	const rightRailGeometryFunction = getParametricRailsFunction(railsRadius,
		new THREE.Vector3(-6, 0, railsRadius+8));

	const leftRailGeometry  = new ParametricGeometry(leftRailGeometryFunction, 100, 500);
	const rightRailGeometry = new ParametricGeometry(rightRailGeometryFunction, 100, 500);

	railsGeometries.push(leftRailGeometry);
	railsGeometries.push(rightRailGeometry);

	const railsMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		color: 0xFFFFFF
	});

	const railsGeometry = mergeGeometries(railsGeometries);
	const rails = new THREE.Mesh(railsGeometry, railsMaterial);
	scene.add(rails);
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	railsPath = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-10, 0,  10),
		new THREE.Vector3( 10, 0,  10),
		new THREE.Vector3( 10, 0, -10),
		new THREE.Vector3(-10, 0, -10),
	], true);

	/*
	// muestra la curva utilizada para el camino de `rails`
	const railsPathPoints = railsPath.getPoints(50);
	const railsPathGeometry = new THREE.BufferGeometry().setFromPoints(railsPathPoints);
	const railsPathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const railsPathMesh = new THREE.Line(railsPathGeometry, railsPathMaterial);
	scene.add(railsPathMesh);
	*/

	buildRailsFoundation();
	buildRails();
	mainLoop();
}

setupThreeJs();
loadTextures(main);
