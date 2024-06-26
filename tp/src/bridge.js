import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let scene, camera, renderer, container;

const textures = {
	madera:     { url: '/assets/madera.jpg', object: null },
	ladrillos:  { url: '/assets/pared-de-ladrillos.jpg', object: null },
	ladrillos2: { url: '/assets/pared-de-ladrillos.jpg', object: null },
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
	// renderer.setClearColor(0xFFFFFF);
	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(25, 25, 25);
	camera.lookAt(10, 10, 10);

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

const arcWidth     = 5;
const arcCount     = 4;
const arcRadius    = arcWidth/2;
const columnHeight = 5;
const columnWidth  = 1.50;
const topPadding   = 0.50;
const startPadding = 2;
const endPadding   = startPadding;
const bridgeWallThickness = 2.5;
const bridgeLen           = arcCount*(columnWidth+arcWidth)+columnWidth+startPadding+endPadding;
const bridgeHeight        = columnHeight+arcRadius+topPadding;

function generateBridgeWall() {
	const path = new THREE.Path();

	// generate the arcs
	for(let i = 1; i <= arcCount; ++i) {
		path.lineTo(startPadding+i*columnWidth+((i-1)*arcWidth), 0);
		path.moveTo(startPadding+i*columnWidth+((i-1)*arcWidth), 0);
		path.lineTo(startPadding+i*columnWidth+((i-1)*arcWidth), columnHeight);
		path.arc(arcRadius, 0, arcRadius, Math.PI, 0, true)
		path.moveTo(startPadding+i*(columnWidth+arcWidth), 0);
		path.lineTo(startPadding+i*(columnWidth+arcWidth), 0);
	}

	// no we close the curve
	path.lineTo(bridgeLen, 0);
	path.lineTo(bridgeLen, bridgeHeight);

	path.lineTo(0, bridgeHeight);
	path.lineTo(0, 0);

	/*
	// muestra la curva utilizada para la extrusión
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);
	*/

	const points = path.getPoints();
	const shape = new THREE.Shape(points);

	const extrudeSettings = {
		curveSegments: 24,
		steps: 50,
		depth: bridgeWallThickness,
		bevelEnabled: false
	};

	const bridgeWallGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
	bridgeWallGeometry.translate(-bridgeLen/2, 0, -bridgeWallThickness/2);
	return bridgeWallGeometry;
}

function generateBridge() {
	const bridgeWidth   = 10;
	const roadwayHeight = 2;

	const leftWallGeometry = generateBridgeWall();
	leftWallGeometry.translate(0, 0, -bridgeWidth/2);

	const rightWallGeometry = generateBridgeWall();
	rightWallGeometry.translate(0, 0, bridgeWidth/2)

	const bridgeColumnsGeometry = mergeGeometries([leftWallGeometry, rightWallGeometry]);
	const bridgeRoadwayGeometry = new THREE.BoxGeometry(
		bridgeLen, roadwayHeight, bridgeWidth+bridgeWallThickness,
	);

	bridgeRoadwayGeometry.translate(0, bridgeHeight+roadwayHeight/2, 0);

	textures.ladrillos.object.wrapS = THREE.RepeatWrapping;
	textures.ladrillos.object.wrapT = THREE.RepeatWrapping;
	textures.ladrillos.object.repeat.set(0.75*0.15, 0.75*0.35);
	textures.ladrillos.object.anisotropy = 16;

	const bridgeMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.ladrillos.object
		// color: 0xFF0000
	});


	textures.ladrillos2.object.wrapS = THREE.RepeatWrapping;
	textures.ladrillos2.object.wrapT = THREE.RepeatWrapping;
	textures.ladrillos2.object.repeat.set(0.75*5, 0.75*0.75);
	textures.ladrillos2.object.anisotropy = 16;

	const roadwayMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.ladrillos2.object
		// color: 0xFF0000
	});

	const bridgeColumns = new THREE.Mesh(bridgeColumnsGeometry, bridgeMaterial);
	scene.add(bridgeColumns);

	const bridgeRoadway = new THREE.Mesh(bridgeRoadwayGeometry, roadwayMaterial);
	scene.add(bridgeRoadway);
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	generateBridge();
	mainLoop();
}

setupThreeJs();
loadTextures(main);
