import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, container;

import maderaUrl from '../assets/madera.jpg'

const textures = {
	madera: { url: maderaUrl, object: null },
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

function generateTunnel() {
	const tunnelHeight        = 20;
	const tunnelWidth         = 14;
	const tunnelWallThickness = 0.5;
	const tunnelLen           = 26;

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
	// muestra la curva utilizada para la extrusión
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);
	*/

	const shape = new THREE.Shape(points);

	const extrudeSettings = {
		curveSegments: 24,
		steps: 50,
		depth: tunnelLen,
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
	geometry.translate(0, 0, -tunnelLen/2);

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

	const mesh = new THREE.Mesh(geometry, tunnelMaterial) ;
	scene.add(mesh);
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	generateTunnel();
	mainLoop();
}

setupThreeJs();
loadTextures(main);
