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
	madera:     { url: '/assets/madera.jpg', object: null },
};

function parametricRailsFoundationInverted(u, v, target) {
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const levelMatrix = new THREE.Matrix4();

	let railsPathPos = railsPath.getPointAt(v);
	let railsFoundationShapePos = railsFoundationShape.getPointAt(u).multiplyScalar(0.5);

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


function parametricRailsFoundation(u, v, target) {
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const levelMatrix = new THREE.Matrix4();

	let railsPathPos = railsPath.getPointAt(u);
	let railsFoundationShapePos = railsFoundationShape.getPointAt(v).multiplyScalar(0.5);

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

function buildRailsFoundation() {
	railsFoundationShape = new THREE.CatmullRomCurve3([
		new THREE.Vector3( -2.00, 0.00, 0.00),
		new THREE.Vector3( -1.00, 0.00, 1.00),
		new THREE.Vector3(  0.00, 0.00, 1.15),
		new THREE.Vector3(  1.00, 0.00, 1.00),
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

	/*
	const pGeometry = new ParametricGeometry(parametricRailsFoundation, 100, 10);
	*/
	const pGeometry = new ParametricGeometry(parametricRailsFoundationInverted, 100, 100);
	
	textures.durmientes.object.wrapS = THREE.RepeatWrapping;
	textures.durmientes.object.wrapT = THREE.RepeatWrapping;
	textures.durmientes.object.repeat.set(1, 45);
	textures.durmientes.object.anisotropy = 16;
	// textures.durmientes.object.rotation = Math.PI/2;

	/*
	const pGeometry = new ParametricGeometry(parametricRailsFoundationInverted, 100, 100);

	// load into `map` the examples texture
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

const railsRadius = 0.5;
function buildRails() {
	let railsGeometries = [];

	const leftRailGeometryFunction  = getParametricRailsFunction(railsRadius,
		new THREE.Vector3( 6, 0, railsRadius+11.25));

	const rightRailGeometryFunction = getParametricRailsFunction(railsRadius,
		new THREE.Vector3(-7, 0, railsRadius+11.25));

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
	/*
	railsPath = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-10, 0,  10),
		new THREE.Vector3( 10, 0,  10),
		new THREE.Vector3( 10, 0, -10),
		new THREE.Vector3(-10, 0, -10),
	], true);

	const railsPathPoints = railsPath.getPoints(50);
	const railsPathGeometry = new THREE.BufferGeometry().setFromPoints(railsPathPoints);
	const railsPathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const railsPathMesh = new THREE.Line(railsPathGeometry, railsPathMaterial);
	scene.add(railsPathMesh);

	buildRailsFoundation();
	buildRails();
	*/
	const length = 12, width = 8;

	// const shape = new THREE.Shape();
	// shape.moveTo(0,0);
	// shape.lineTo(0, width);
	// shape.lineTo(length, width);
	// shape.lineTo(length, 0);
	// shape.lineTo(0, 0);
	
	const tunnelHeight        = 20;
	const tunnelWidth         = 14;
	const tunnelWallThickness = 0.5;

	const path = new THREE.Path();
	path.moveTo(-tunnelWidth/2, 0);
	path.lineTo(-tunnelWidth/2, tunnelHeight*1/3);
	path.moveTo(-tunnelWidth/2, tunnelHeight*1/3);
	path.quadraticCurveTo(0, tunnelHeight, tunnelWidth/2, tunnelHeight*1/3);
	path.moveTo(tunnelWidth/2, 0);
	path.lineTo(tunnelWidth/2, 0);


	// cerramos la curva con otra de la misma forma con una diferencia de
	// `tunnelWallThickness`
	path.lineTo(tunnelWidth/2-tunnelWallThickness, 0);
	path.moveTo(tunnelWidth/2-tunnelWallThickness, 0);

	path.lineTo(tunnelWidth/2-tunnelWallThickness, tunnelHeight*1/3);
	path.moveTo(tunnelWidth/2-tunnelWallThickness, tunnelHeight*1/3);

	path.quadraticCurveTo(
		0, tunnelHeight-(tunnelWallThickness*2),
		-tunnelWidth/2+tunnelWallThickness, tunnelHeight*1/3);

	path.lineTo(-tunnelWidth/2+tunnelWallThickness, 0);
	path.moveTo(-tunnelWidth/2+tunnelWallThickness, 0);

	path.lineTo(-tunnelWidth/2, 0);
	path.moveTo(-tunnelWidth/2, 0);

	const points = path.getPoints();

	/*
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);
	*/

	const shape = new THREE.Shape(points);

	const extrudeSettings = {
		curveSegments: 24,
		steps: 50,
		depth: 26,
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	textures.madera.object.wrapS = THREE.RepeatWrapping;
	textures.madera.object.wrapT = THREE.RepeatWrapping;
	textures.madera.object.repeat.set(100, 100);
	textures.madera.object.anisotropy = 16;

	const tunnelMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.madera.object
	});

	const mesh = new THREE.Mesh(geometry, tunnelMaterial) ;
	scene.add(mesh);

	mainLoop();
}

setupThreeJs();
loadTextures(main);
