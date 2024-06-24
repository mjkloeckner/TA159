import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/treesShaders.js';

import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;
let spherePath;

const textures = {
	tierra: { url: '/assets/tierra.jpg', object: null },
	roca: { url: '/assets/roca.jpg', object: null },
	pasto: { url: '/assets/pasto.jpg', object: null },
};

function createPathWithSpheres() {
	//Create a closed wavey loop
	spherePath = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-10, 0,  10),
		new THREE.Vector3( 10, 0,  10),
		new THREE.Vector3( 10, 0, -10),
		new THREE.Vector3(-10, 0, -10),
	], true);

	const points = spherePath.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

	// const geometry = new THREE.TubeGeometry( railsPath, 50, 1, 25, false );

	const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
	const sphere = new THREE.SphereGeometry(0.5,20,20);
	const instancedSphereGeo = new THREE.InstancedBufferGeometry();
	instancedSphereGeo.copy(sphere);

	let count = 10;
	const instancedSpheres = new THREE.InstancedMesh(instancedSphereGeo, material, count);

	// const sphere = new THREE.Mesh( geometry, material );
	// scene.add( sphere );

	const rotMatrix = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const sphereMatrix = new THREE.Matrix4()

	const dotGeo = new THREE.SphereGeometry()
	let u, i;
	for(u = 0.0, i = 0; u < 1.0; u += 1/count, i++) {
		let position = spherePath.getPointAt(u);
		translationMatrix.makeTranslation(position);
		sphereMatrix.identity();
		sphereMatrix.premultiply(rotMatrix);
		sphereMatrix.premultiply(translationMatrix);
		//rotMatrix.lookAt(0, 0, new THREE.Vector3(0, 1, 0));
		instancedSpheres.setMatrixAt(i, sphereMatrix);
	}

	scene.add(instancedSpheres);

	// Create the final object to add to the scene
	const curveObject = new THREE.Line(geometry, lineMaterial);
	// const curveObject = new THREE.Mesh(geometry, material);
	scene.add(curveObject);
}

function getParametricPlaneFunction(width, height) {
	return function (u, v, target) {
		const x = -width / 2 + u * width;
		const y = 0;
		const z = -width / 2 + v * height;

		target.set(x, y, z);
	};
}

// buffer
const vertices = [];
const normals = [];
const uvs = [];
const indices = [];

const vertex = new THREE.Vector3();
const normal = new THREE.Vector3();
const uv = new THREE.Vector2();

function generateIndices(tubularSegments, radialSegments) {
	for ( let j = 1; j <= tubularSegments; j ++ ) {
		for ( let i = 1; i <= radialSegments; i ++ ) {
			const a = ( radialSegments + 1 ) * ( j - 1 ) + ( i - 1 );
			const b = ( radialSegments + 1 ) * j + ( i - 1 );
			const c = ( radialSegments + 1 ) * j + i;
			const d = ( radialSegments + 1 ) * ( j - 1 ) + i;

			// faces
			indices.push( a, b, d );
			indices.push( b, c, d );
		}
	}
}

function generateSegment(i, frames, path, segments) {
	// we use getPointAt to sample evenly distributed points from the given path
	P = path.getPointAt(i/segments, P);

	// retrieve corresponding normal and binormal
	const N = frames.normals[i];
	const B = frames.binormals[i];

	// generate normals and vertices for the current segment
	for (let j = 0; j <= radialSegments; j++) {
		const v = j / radialSegments*Math.PI*2;

		const sin = Math.sin(v);
		const cos = - Math.cos(v);

		// normal
		normal.x = (cos*N.x + sin*B.x);
		normal.y = (cos*N.y + sin*B.y);
		normal.z = (cos*N.z + sin*B.z);
		normal.normalize();

		normals.push( normal.x, normal.y, normal.z );

		// vertex
		vertex.x = P.x + radius * normal.x;
		vertex.y = P.y + radius * normal.y;
		vertex.z = P.z + radius * normal.z;

		vertices.push(vertex.x, vertex.y, vertex.z);
	}
}

function generateBufferData(tubularSegments) {
	for (let i = 0; i < tubularSegments; i++) {
		generateSegment(i);
	}

	// if the geometry is not closed, generate the last row of vertices and normals
	// at the regular position on the given path
	//
	// if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)
	generateSegment( ( closed === false ) ? tubularSegments : 0 );

	// uvs are generated in a separate function.
	// this makes it easy compute correct values for closed geometries
	generateUVs();

	// finally create faces
	generateIndices();
}

function createPath() {
	//Create a closed wavey loop
	const path = new THREE.CatmullRomCurve3([
		new THREE.Vector3(-10, 0,  10),
		new THREE.Vector3( 10, 0,  10),
		new THREE.Vector3( 10, 0, -10),
		new THREE.Vector3(-10, 0, -10),
	], true);

	const points = path.getPoints(50);
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

	const curveObject = new THREE.Line(geometry, lineMaterial);
	scene.add(curveObject);

	const pMaterial = new THREE.MeshPhongMaterial({
		color: 0xFF0000,
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 0.7,
		shininess: 10,
		specular: 0XFFFFFF,
	});

	let close = true;
	let segments = 10;

	frames = path.computeFrenetFrames(segments, closed);

	let P = new THREE.Vector3();

	// setIndex( indices );
	setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
	setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

	let samplingFunction = getParametricPlaneFunction(10, 10);

	let pGeometry = new ParametricGeometry(samplingFunction, 50, 50);
	let pMesh = new THREE.Mesh(pGeometry, pMaterial);
	scene.add(pMesh);
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


function createMenu() {
	const gui = new dat.GUI({ width: 400 });
	gui.add(terrainMaterial.uniforms.scale1, 'value', 0, 10).name('Texture scale');
	gui.add(terrainMaterial.uniforms.mask1low, 'value', -1, 1).name('Mask1 Low');
	gui.add(terrainMaterial.uniforms.mask1high, 'value', -1, 1).name('Mask1 High');
	gui.add(terrainMaterial.uniforms.mask2low, 'value', -1, 1).name('Mask2 Low');
	gui.add(terrainMaterial.uniforms.mask2high, 'value', -1, 1).name('Mask2 High');
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

function main() {
	buildScene();
	// createMenu();
	mainLoop();
}

setupThreeJs();
createPath();
main();
// loadTextures(main);
