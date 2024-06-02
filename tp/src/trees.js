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
	camera.position.set(-50, 60, 50);
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

function createInstancedTrees(count) {
	console.log('Generating `' + count + '` instances of tree');

	const treeLogGeometry    = new THREE.CylinderGeometry(0.35, 0.35, 4, 40, 40);
	//const treeLeavesGeometry = new THREE.SphereGeometry(1.75,40,40);

	treeLogGeometry.translate(0, 2, 0);

	const instancedTreeLogGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLogGeometry.copy(treeLogGeometry);

	const treeLogMaterial = new THREE.MeshPhongMaterial({color: 0x7c3f00});
	const instancedTreeLogs = new THREE.InstancedMesh(instancedTreeLogGeometry, treeLogMaterial, count);

	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const matrix = new THREE.Matrix4();

	//let origin = new THREE.Vector3();
	const RANGE = 50 - 4/2;

	for (let i = 0; i < count; i++) {
		let position = new THREE.Vector3(
			(Math.random() - 0.5) * RANGE,
			0,
			(Math.random() - 0.5) * RANGE
		);

		translationMatrix.makeTranslation(position);

		//rotMatrix.lookAt(0, 0, new THREE.Vector3(0, 1, 0));
		matrix.identity();
		matrix.makeScale(1, 0.5 + Math.random()*2, 1);
		//matrix.premultiply(rotMatrix);
		matrix.premultiply(translationMatrix);

		instancedTreeLogs.setMatrixAt(i, matrix);
	}

	return instancedTreeLogs;
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

	console.log('Generating trees');
	const trees = createInstancedTrees(20);
	scene.add(trees);
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
	//createMenu();
	mainLoop();
}

main();
