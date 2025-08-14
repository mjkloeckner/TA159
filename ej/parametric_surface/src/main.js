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

let controls;
let shapeBase, shapeNarrow;

import tierraUrl     from '/src/assets/tierra.jpg'
import rocaUrl       from '/src/assets/roca.jpg'
import pastoUrl      from '/src/assets/pasto.jpg'
import durmientesUrl from '/src/assets/durmientes.jpg'

const textures = {
	tierra:     { url: tierraUrl,     object: null },
	roca:       { url: rocaUrl,       object: null },
	pasto:      { url: pastoUrl,      object: null },
	durmientes: { url: durmientesUrl, object: null },
};

function onResize() {
	camera.aspect = container.offsetWidth / container.offsetHeight;
	const rotMatrix = new THREE.Matrix4();
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

	camera.position.set(10, 20, 10);
	camera.lookAt(0, 0, 0);

	controls = new OrbitControls(camera, renderer.domElement);
	controls.update();

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(100, 100, 100);
	scene.add(directionalLight);

	const gridHelper = new THREE.GridHelper(50, 50);
	scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(1);
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

	// show rails foundation shape
	const points = railsFoundationShape.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);

	const pGeometry = new ParametricGeometry(
		parametricRailsFoundationFunction, 4, 50); // paso de discretizacion u y v
	
	textures.durmientes.object.wrapS = THREE.RepeatWrapping;
	textures.durmientes.object.wrapT = THREE.RepeatWrapping;
	textures.durmientes.object.repeat.set(1, 60);
	textures.durmientes.object.anisotropy = 16;

	// load into `map` the example texture
	const map = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');
	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	map.repeat.set(1, 30);
	map.anisotropy = 16;
	// map.rotation = Math.PI/2;

	const pMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		// map: textures.durmientes.object
		map: map
	});
	const pMesh = new THREE.Mesh(pGeometry, pMaterial);
	pMesh.receiveShadow = true;
	pMesh.castShadow = true;
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

		// railsShapePos es un cilindro
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
	rails.castShadow = true;
	scene.add(rails);
}

function buildRailsPath() {
	railsPath = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-10, 0,  10),
		new THREE.Vector3( 10, 0,  10),
		new THREE.Vector3( 10, 0, -10),
		new THREE.Vector3(-10, 0, -10),
	], true, 'catmullrom', 1.0);

	// muestra la curva utilizada para el camino de `rails`
	const railsPathPoints = railsPath.getPoints(50);
	const railsPathGeometry = new THREE.BufferGeometry().setFromPoints(railsPathPoints);
	const railsPathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const railsPathMesh = new THREE.Line(railsPathGeometry, railsPathMaterial);
	scene.add(railsPathMesh);
}

function shapeExample() {
	const arcRadius = 1;

	shapeBase = new THREE.Shape()
		.moveTo(-1, -1.5)
		.lineTo(1, -1.5)
		.lineTo(1, -1)
		.arc(0, arcRadius, arcRadius, -Math.PI/2, Math.PI/2, false) 
		.lineTo(1, 1.5)
		.lineTo(-1, 1.5)
		.lineTo(-1, 1)
		.arc(0, -arcRadius, arcRadius, Math.PI/2, -Math.PI/2, false) 
		.lineTo(-1, -1.5);

	shapeNarrow = new THREE.Shape()
		.moveTo(-1.0, -1.0)
		.lineTo(-1.0, -0.5)
		.lineTo( 1.0, -0.5)
		.lineTo( 1.0, -1.0)
		.arc(0, arcRadius, arcRadius, -Math.PI/2, Math.PI/2, false) 
		.lineTo( 1.0, 0.5)
		.lineTo(-1.0, 0.5)
		.lineTo(-1.0, 1.0)
		.arc(0, -arcRadius, arcRadius, Math.PI/2, -Math.PI/2, false);

	const pointsBase = shapeBase.getPoints();
	const geometryBase = new THREE.BufferGeometry().setFromPoints(pointsBase);
	const materialBase = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const lineBase = new THREE.Line(geometryBase, materialBase);
	// lineBase.rotation.x = Math.PI / 2; // de XY a XZ

	const pointsNarrow = shapeNarrow.getPoints();
	const geometryNarrow = new THREE.BufferGeometry().setFromPoints(pointsNarrow);
	const materialNarrow = new THREE.LineBasicMaterial({ color: 0x0000FF });
	const lineNarrow = new THREE.Line(geometryNarrow, materialNarrow);
	// lineNarrow.rotation.x = Math.PI / 2; // de XY a XZ

	// scene.add(lineBase);
	// scene.add(lineNarrow);
}

function shapeExtrude(shape, color) {
	const extrudeSettings = {
		steps: 10,
		depth: 5,
		bevelEnabled: false,
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings );
	const material = new THREE.MeshPhongMaterial( { color: color } );
	const mesh = new THREE.Mesh( geometry, material ) ;
	scene.add(mesh);
	mesh.rotation.x =-Math.PI/2;
}

/*
if (v <= 0.2 || v >= 0.8) {
	point = pointNarrow;
} else if (v <= 0.3) {
	const interpolationFactor = (v - 0.3)/0.1;

	point.x = THREE.MathUtils.lerp(pointNarrow.x, pointBase.x, interpolationFactor);
	point.y = THREE.MathUtils.lerp(pointNarrow.y, pointBase.y, interpolationFactor);
} else if (v >= 0.7 && v <= 0.8) {
	const interpolationFactor = (v - 0.7)/0.1;

	point.x = THREE.MathUtils.lerp(pointBase.x, pointNarrow.x, interpolationFactor);
	point.y = THREE.MathUtils.lerp(pointBase.y, pointNarrow.y, interpolationFactor);
} else {
	point = pointBase;
}
*/
function parametricFunction(u, v, target) {
	let point = new THREE.Vector2(0, 0);
	const pointBase = shapeBase.getPointAt(u);
	const pointNarrow = shapeNarrow.getPointAt(u);
	// const pointNarrow = shapeBase.getPointAt(u);

	// if (v <= 0.40) {
	// 	point = pointNarrow;
	// } else if (v >= 0.60) {
	// 	point = pointBase;
	// } else { // v en [0.45 - 0.55]
	// 	const interpolationFactor = (v - 0.40)/0.2;
	// 	console.log(interpolationFactor);
	// 	point.lerpVectors(pointNarrow, pointBase, interpolationFactor);
	// }
	
	point = new THREE.Vector3(pointBase.x, pointBase.y, 10*v);
	// point.applyAxisAngle(new THREE.Vector3(0, 0, 1), 2*Math.PI*v);

	const rotMatrix = new THREE.Matrix4();
	rotMatrix.makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI*v);
	// rotMatrix.makeBasis(normal, tangente, binormal);
	
	point.applyMatrix4(rotMatrix);
	target.set(point.x, point.y, point.z);
}

function generateTunnelGeometry(
	tunnelHeight = 20, tunnelWidth = 14,
	tunnelWallThickness = 0.5, tunnelLen = 26) {

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

	const pathPoints = path.getPoints(50);
	const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
	const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const pathObject = new THREE.Line(pathGeometry, pathMaterial);
	scene.add(pathObject);
	return;

	// const points = path.getPoints();
	// const shape = new THREE.Shape(points);
	const extrudeSettings = {
		curveSegments: 24,
		steps: 50,
		depth: tunnelLen,
	};

	const geometry = new THREE.ExtrudeGeometry(path, extrudeSettings);

	// el `1` en `x` es porque por algun motivo queda descentrado con respecto
	// a la vía del tren
	geometry.translate(1, 0, -tunnelLen/2);
	return geometry;
}

function generateTunnel() {
	const geometry = generateTunnelGeometry();
	const material = new THREE.MeshPhongMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
	const mesh = new THREE.Mesh( geometry, material );
	scene.add(mesh);
}

function shapeSweep(shape) {
	const geometry = new ParametricGeometry(parametricFunction, 100, 100);
	const material = new THREE.MeshPhongMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
	const mesh = new THREE.Mesh( geometry, material );
	mesh.rotation.x = -Math.PI/2;
	scene.add(mesh);
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	shapeExample();
	// shapeExtrude(shapeBase, 0xCF4040);
	// shapeExtrude(shapeNarrow, 0x5050FF);
	shapeSweep();
	// generateTunnel();

	// buildRailsPath();
	// buildRailsFoundation();
	// buildRails();

	mainLoop();
}

setupThreeJs();
loadTextures(main);
