import * as THREE from 'three';

import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let railsPath;

export const railsFoundationShape = new THREE.CatmullRomCurve3([
	new THREE.Vector3( -2.00, 0.00, 0.00),
	new THREE.Vector3( -1.00, 0.00, 0.50),
	new THREE.Vector3(  0.00, 0.00, 0.55),
	new THREE.Vector3(  1.00, 0.00, 0.50),
	new THREE.Vector3(  2.00, 0.00, 0.00),
], false);


const textures = {
	tierra:     { url: '/tierra.jpg', object: null },
	roca:       { url: '/roca.jpg', object: null },
	pasto:      { url: '/pasto.jpg', object: null },
	durmientes: { url: '/durmientes.jpg', object: null },
};

export function getRailsPathPosAt(t) {
	if(railsPath == undefined) {
		console.log("railsPath is undefined");
	}
	return [railsPath.getPointAt(t), railsPath.getTangentAt(t)];
}

function parametricRailsFoundationFunction(u, v, target) {
	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const levelMatrix = new THREE.Matrix4();

	let railsPathPos = railsPath.getPointAt(v);
	let railsFoundationShapePos = railsFoundationShape.getPointAt(u);
	// TODO: make `railsFoundationShape` smaller and remove this multiplication
	railsFoundationShapePos.multiplyScalar(0.5);
	railsFoundationShapePos.x *= 1.25;

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

// devuelve la geometria del terraplen de la via
export function buildRailsFoundationGeometry() {
	/*
	// show rails foundation shape
	const points = railsFoundationShape.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);
	*/

	const pGeometry = new ParametricGeometry(
		parametricRailsFoundationFunction, 250, 250);
	
	return pGeometry;
}

// `position` es de tipo `THREE.Vector3` y representa la translacion de la
// forma del rail con respecto al origen del sist. de coordenadas de modelado
function getParametricRailsFunction(railsRadius = 0.50, position) {
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

// devuelve la geometria de los rieles
export function buildRailsGeometry(railsRadius = 0.35) {
	let railsGeometries = [];

	const leftRailGeometryFunction  = getParametricRailsFunction(railsRadius,
		new THREE.Vector3( 9.5, 0, railsRadius+8));

	const rightRailGeometryFunction = getParametricRailsFunction(railsRadius,
		new THREE.Vector3(-9.5, 0, railsRadius+8));

	const leftRailGeometry  = new ParametricGeometry(leftRailGeometryFunction, 100, 500);
	const rightRailGeometry = new ParametricGeometry(rightRailGeometryFunction, 100, 500);

	railsGeometries.push(leftRailGeometry);
	railsGeometries.push(rightRailGeometry);

	const railsGeometry = mergeGeometries(railsGeometries);
	return railsGeometry;
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

function main() {
	railsPath = new THREE.CatmullRomCurve3([
		// bridge1 side
		new THREE.Vector3(  0, 0, 32),
		new THREE.Vector3( 28, 0, 32),

		new THREE.Vector3( 28, 0, 0),

		// bridge2 side
		new THREE.Vector3(  5, 0, -37),
		new THREE.Vector3(-35, 0, -30),
		// new THREE.Vector3(-20, 0, -10),

		new THREE.Vector3(-10, 0, 0),
	], true, 'catmullrom', 0.75);

	/*
	// muestra la curva utilizada para el camino de `rails`
	const railsPathPoints = railsPath.getPoints(50);
	const railsPathGeometry = new THREE.BufferGeometry().setFromPoints(railsPathPoints);
	const railsPathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
	const railsPathMesh = new THREE.Line(railsPathGeometry, railsPathMaterial);
	scene.add(railsPathMesh);
	*/

	// buildRailsFoundation();
	// buildRails();
}

// setupThreeJs();
loadTextures(main);
