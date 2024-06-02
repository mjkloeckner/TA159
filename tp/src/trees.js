import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, container, material;

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
	camera.position.set(-40, 50, 30);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(1, 1, 1);
	scene.add(directionalLight);

	//const gridHelper = new THREE.GridHelper(50, 20);
	//scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	window.addEventListener('resize', onResize);
	onResize();
}

function buildScene() {
	console.log('Building scene');

	console.log('Generating terrain');
	const terrainGeometry = new THREE.PlaneGeometry(50, 50);
	const terrainMaterial = new THREE.MeshPhongMaterial( {color: 0x365829, side: THREE.DoubleSide} );
	const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
	terrain.rotateX(Math.PI/2);
	terrain.position.set(0, 0, 0);
	scene.add(terrain);
}

function createMenu() {
	const gui = new dat.GUI({ width: 400 });
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	setupThreeJs();
	buildScene();
	createMenu();
	mainLoop();
}

main();
