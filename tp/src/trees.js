import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/treesShaders.js';

let scene, camera, renderer, container, terrainMaterial, instancedTrees;

const textures = {
	tierra: { url: '/assets/tierra.jpg', object: null },
	roca: { url: '/assets/roca.jpg', object: null },
	pasto: { url: '/assets/pasto.jpg', object: null },
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

	const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
	// scene.add(directionalLightHelper);

	//const gridHelper = new THREE.GridHelper(50, 20);
	//scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper(5);
	scene.add(axesHelper);

	window.addEventListener('resize', onResize);
	onResize();
}

function createInstancedTrees(count) {
	console.log('Generating `' + count + '` instances of tree');

	let logHeight = 4.0;

	const treeLogGeometry    = new THREE.CylinderGeometry(0.30, 0.30, logHeight, 40, 40);
	const treeLeavesGeometry = new THREE.SphereGeometry(1.75,40,40);

	treeLogGeometry.translate(0, logHeight/2.0, 0);

	const instancedTreeLogGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLogGeometry.copy(treeLogGeometry);

	const instancedTreeLeavesGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLeavesGeometry.copy(treeLeavesGeometry);

	const treeLogMaterial   = new THREE.MeshPhongMaterial({color: 0x7c3f00});
	const instancedTreeLogs = new THREE.InstancedMesh(instancedTreeLogGeometry, treeLogMaterial, count);

	const treeLeavesMaterial  = new THREE.MeshPhongMaterial({color: 0x365829});
	const instancedTreeLeaves = new THREE.InstancedMesh(instancedTreeLeavesGeometry, treeLeavesMaterial, count);

	const rotMatrix = new THREE.Matrix4();

	const translationMatrix = new THREE.Matrix4();
	const treeLogMatrix    = new THREE.Matrix4();
	const treeLeavesMatrix = new THREE.Matrix4();

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
		treeLogMatrix.identity();
		treeLeavesMatrix.identity();

		let scale = 0.5 + (Math.random()*(logHeight/3));
		treeLogMatrix.makeScale(1, scale, 1);
		//matrix.premultiply(rotMatrix);

		treeLogMatrix.premultiply(translationMatrix);

		position.y = scale*logHeight;
		translationMatrix.makeTranslation(position);
		treeLeavesMatrix.premultiply(translationMatrix);

		instancedTreeLogs.setMatrixAt(i, treeLogMatrix);
		instancedTreeLeaves.setMatrixAt(i, treeLeavesMatrix);
	}

	scene.add(instancedTreeLogs);
	scene.add(instancedTreeLeaves);
}

function buildScene() {
	console.log('Building scene');

	console.log('Generating terrain');
	const terrainGeometry = new THREE.PlaneGeometry(50, 50);
	//const terrainMaterial = new THREE.MeshPhongMaterial( {color: 0x365829, side: THREE.DoubleSide} );
	terrainMaterial = new THREE.RawShaderMaterial({
		uniforms: {
			tierraSampler: { type: 't', value: textures.tierra.object },
			rocaSampler: { type: 't', value: textures.roca.object },
			pastoSampler: { type: 't', value: textures.pasto.object },
			scale1: { type: 'f', value: 2.0 },

			mask1low: { type: 'f', value: -0.38 },
			mask1high: { type: 'f', value: 0.1 },

			mask2low: { type: 'f', value: 0.05 },
			mask2high: { type: 'f', value: -0.70 },
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
	});
	terrainMaterial.needsUpdate = true;

	const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
	terrain.rotateX(Math.PI/2);
	terrain.position.set(0, 0, 0);
	scene.add(terrain);

	console.log('Generating trees');
	createInstancedTrees(35);
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
	createMenu();
	mainLoop();
}

setupThreeJs();
loadTextures(main);
