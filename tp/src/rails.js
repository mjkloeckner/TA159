import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/treesShaders.js';

import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;
let spherePath;
let railsPath;
let railsFoundationShape;

const textures = {
	tierra: { url: '/assets/tierra.jpg', object: null },
	roca: { url: '/assets/roca.jpg', object: null },
	pasto: { url: '/assets/pasto.jpg', object: null },
};

	}
}

function parametricRailsFoundation(u, v, target) {
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const levelMatrix = new THREE.Matrix4();

	let railsPathPos = railsPath.getPointAt(u);
	let railsFoundationShapePos = railsFoundationShape.getPointAt(v);

	let tangente = new THREE.Vector3();
	let binormal = new THREE.Vector3();
	let normal = new THREE.Vector3();

	tangente = railsPath.getTangent(u);

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

function railsFoundation() {
	railsFoundationShape = new THREE.CatmullRomCurve3([
		new THREE.Vector3( -2, 0, 0),
		new THREE.Vector3( -1, 0, 1),
		new THREE.Vector3(  1, 0, 1),
		new THREE.Vector3(  2, 0, 0),
	], false);

	// const points = railsFoundationShape.getPoints(50);
	// const geometry = new THREE.BufferGeometry().setFromPoints(points);
	// const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	// const curveObject = new THREE.Line(geometry, lineMaterial);
	// scene.add(curveObject);

	const pGeometry = new ParametricGeometry(parametricRailsFoundation, 100, 10);
	return pGeometry;
}

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

	const gridHelper = new THREE.GridHelper(50, 20);
	scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	window.addEventListener('resize', onResize);
	onResize();
}

function buildScene() {
	console.log('Building scene');
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

function buildRailsFoundation() {
	railsPath = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-10, 0,  10),
		new THREE.Vector3( 10, 0,  10),
		new THREE.Vector3( 10, 0, -10),
		new THREE.Vector3(-10, 0, -10),
	], true);

	const pGeometry = railsFoundation();

	textures.tierra.object.wrapS = THREE.MirroredRepeatWrapping;
	textures.tierra.object.wrapT = THREE.MirroredRepeatWrapping;
	textures.tierra.object.repeat.set(25, 1);
	textures.tierra.object.anisotropy = 16;

	/*
	const map = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(25, 1);
	map.anisotropy = 16;
	*/

	const pMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.tierra.object
	});
	const pMesh = new THREE.Mesh(pGeometry, pMaterial);
	scene.add(pMesh);
}

function buildPlane() {
	const geo = new THREE.PlaneGeometry(20, 20);
	const mat = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.tierra.object
	});
	const mesh = new THREE.Mesh(geo, mat);
	scene.add(mesh);
}

function main() {
	buildScene();
	buildRailsFoundation();
	mainLoop();
}

setupThreeJs();
// buildRailsPath();
// createPath();
// main();
loadTextures(main);
