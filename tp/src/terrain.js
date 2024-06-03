import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vertexShader, fragmentShader } from '/assets/shaders.js';

let scene, camera, renderer, container, terrainMaterial, terrainGeometry, terrain;

const widthSegments = 100;
const heightSegments = 100;
const amplitude = 8;
const amplitudeBottom = -1.00;

const textures = {
	tierra: { url: '/assets/tierra.jpg', object: null },
	roca: { url: '/assets/roca.jpg', object: null },
	pasto: { url: '/assets/pasto.jpg', object: null },
	elevationMap: { url: '/assets/elevation_map2.png', object: null },
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

	camera = new THREE.PerspectiveCamera(
		35, window.innerWidth/window.innerHeight, 0.1, 1000);
	camera.position.set(100, 120, -100);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	const ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);

	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.25);
	//scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(100, 100, 100);
	scene.add(directionalLight);

	const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
	scene.add(directionalLightHelper);

	 const gridHelper = new THREE.GridHelper(150, 150);
	 scene.add(gridHelper);

	const axesHelper = new THREE.AxesHelper( 5 );
	scene.add( axesHelper );

	window.addEventListener('resize', onResize);
	onResize();
}

function createInstancedTrees(count) {
	console.log('Generating `' + count + '` instances of tree');

	let logHeight = 4.0;
	const treeLogGeometry   = new THREE.CylinderGeometry(
		0.30, 0.30, logHeight, 40, 40);
	treeLogGeometry.translate(0, logHeight/2.0, 0);
	const instancedTreeLogGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLogGeometry.copy(treeLogGeometry);
	const treeLogMaterial   = new THREE.MeshPhongMaterial({color: 0x7c3f00});
	const instancedTreeLogs = new THREE.InstancedMesh(
		instancedTreeLogGeometry,
		treeLogMaterial,
		count);

	const treeLeavesGeometry = new THREE.SphereGeometry(1.75,40,40);
	const instancedTreeLeavesGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLeavesGeometry.copy(treeLeavesGeometry);
	const treeLeavesMaterial  = new THREE.MeshPhongMaterial({color: 0x365829});
	const instancedTreeLeaves = new THREE.InstancedMesh(
		instancedTreeLeavesGeometry,
		treeLeavesMaterial,
		count);

	const rotMatrix         = new THREE.Matrix4();
	const translationMatrix = new THREE.Matrix4();
	const treeLogMatrix     = new THREE.Matrix4();
	const treeLeavesMatrix  = new THREE.Matrix4();

	//let origin = new THREE.Vector3();
	const RANGE = 100 - 4/2;

	const positionAttribute = terrainGeometry.getAttribute('position');
	const point = new THREE.Vector3();
	//point.fromBufferAttribute(positionAttribute, i);

	// Creamos un canvas para poder leer los valores de los píxeles de la textura
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	let img = textures.elevationMap.object.image;

	// Ajustamos el tamaño del canvas segun la cantidad de segmentos horizontales y verticales
	canvas.width = widthSegments;
	canvas.height = heightSegments;

	// Dibujamos la textura en el canvas en la escala definida por widthSegments y heightSegments
	ctx.drawImage(img, 0, 0, widthSegments, heightSegments);

	// Obtenemos los valores de los píxeles de la textura
	let imageData = ctx.getImageData(0, 0, widthSegments, heightSegments);
	let data = imageData.data; // Este es un array con los valores de los píxeles
	const quadsPerRow = widthSegments - 1;

	for (let i = 0; i < count; i++) {
		let treeX = (Math.random() - 0.5) * RANGE;
		let treeZ = (Math.random() - 0.5) * RANGE;

		let treeY = amplitudeBottom;
		// let treeY = (data[Math.floor(treeX + treeZ) * 4] / 255)*(amplitude+amplitudeBottom);
		// console.log(treeY);

		let position = new THREE.Vector3(treeX, 0, treeZ);

		//let terrainPosition = getPositionFromMatrix()

		translationMatrix.makeTranslation(position);

		//rotMatrix.lookAt(0, 0, new THREE.Vector3(0, 1, 0));
		treeLogMatrix.identity();
		treeLeavesMatrix.identity();

		let scale = 0.5 + (Math.random()*(logHeight/3));
		console.log(scale);
		treeLogMatrix.makeScale(1, scale, 1);
		//matrix.premultiply(rotMatrix);

		treeLogMatrix.premultiply(translationMatrix);

		position.y = scale*logHeight;
		translationMatrix.makeTranslation(position);
		treeLeavesMatrix.premultiply(translationMatrix);

		instancedTreeLogs.setMatrixAt(i, treeLogMatrix);
		instancedTreeLeaves.setMatrixAt(i, treeLeavesMatrix);

	}
	//
	//const vertex = new THREE.Vector3();
	//const terrainPositionAttribute = terrainGeometry.getAttribute('position');
	//
	//for(let i = 0; i < 100; i++) {
	//	vertex.fromBufferAttribute(terrainPositionAttribute, i);
	//	terrain.localToWorld(vertex);
	//	console.log(vertex);
	//}

	// Recorremos los segmentos horizontales y verticales
	for (let i = 0; i < widthSegments - 1; i++) {
		for (let j = 0; j < heightSegments - 1; j++) {
		}
	}

	return [instancedTreeLogs, instancedTreeLeaves];
}

// La funcion devuelve una geometria de Three.js
// width: Ancho del plano
// height: Alto del plano
// amplitude: Amplitud de la elevacion
// widthSegments: Numero de segmentos en el ancho
// heightSegments: Numero de segmentos en el alto
// texture: Textura que se usara para la elevacion
function elevationGeometry(width, height, amplitude, widthSegments, heightSegments, texture) {
	console.log('Generating terrain geometry');
	let geometry = new THREE.BufferGeometry();

	const positions = [];
	const indices = [];
	const normals = [];
	const uvs = [];

	// Creamos un canvas para poder leer los valores de los píxeles de la textura
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	let img = texture.image;

	// Ajustamos el tamaño del canvas segun la cantidad de segmentos horizontales y verticales
	canvas.width = widthSegments;
	canvas.height = heightSegments;

	// Dibujamos la textura en el canvas en la escala definida por widthSegments y heightSegments
	ctx.drawImage(img, 0, 0, widthSegments, heightSegments);

	// Obtenemos los valores de los píxeles de la textura
	let imageData = ctx.getImageData(0, 0, widthSegments, heightSegments);
	let data = imageData.data; // Este es un array con los valores de los píxeles

	const quadsPerRow = widthSegments - 1;

	// Recorremos los segmentos horizontales y verticales
	for (let i = 0; i < widthSegments - 1; i++) {
		for (let j = 0; j < heightSegments - 1; j++) {
			// Obtenemos los valores de los píxeles de los puntos adyacentes
			let xPrev = undefined;
			let xNext = undefined;
			let yPrev = undefined;
			let yNext = undefined;

			// Obtenemos el valor del pixel en la posicion i, j
			let z0 = data[(i + j * widthSegments) * 4] / 255;

			// Obtenemos los valores de los píxeles adyacentes
			xPrev = i > 0 ? data[(i - 1 + j * widthSegments) * 4] / 255 : undefined;
			xNext = i < widthSegments - 1 ? (xNext = data[(i + 1 + j * widthSegments) * 4] / 255) : undefined;

			yPrev = j > 0 ? data[(i + (j - 1) * widthSegments) * 4] / 255 : undefined;
			yNext = j < heightSegments - 1 ? data[(i + (j + 1) * widthSegments) * 4] / 255 : undefined;

			// calculamos la diferencia entre los valores de los píxeles adyacentes
			// en el eje `x` y en el eje `y` de la imagen (en el espacio de la textura
			// Ojo no confundir con el espacio 3D del modelo 3D donde Y es la altura)
			let deltaX;
			if (xPrev == undefined) {
				deltaX = xNext - z0;
			} else if (yNext == undefined) {
				deltaX = xPrev - z0;
			} else {
				deltaX = (xNext - xPrev) / 2;
			}

			let deltaY;
			if (yPrev == undefined) {
				deltaY = yNext - z0;
			} else if (yNext == undefined) {
				deltaY = yPrev - z0;
			} else {
				deltaY = (yNext - yPrev) / 2;
			}

			// Calculamos la altura del punto en el espacio 3D
			const z = amplitude * z0;

			// Añadimos los valores de los puntos al array de posiciones
			positions.push((width * i) / widthSegments - width / 2);
			positions.push(z);
			positions.push((height * j) / heightSegments - height / 2);

			// Calculamos los vectores tangentes a la superficie en el ejex y en el eje y
			let tanX = new THREE.Vector3(width / widthSegments, deltaX * amplitude, 0).normalize();
			let tanY = new THREE.Vector3(0, deltaY * amplitude, height / heightSegments).normalize();

			// Calculamos el vector normal a la superficie
			let n = new THREE.Vector3();
			n.crossVectors(tanY, tanX);

			// Añadimos los valores de los vectores normales al array de normales
			normals.push(n.x);
			normals.push(n.y);
			normals.push(n.z);

			uvs.push(i / (widthSegments - 1));
			uvs.push(j / (heightSegments - 1));

			if (i == widthSegments - 2 || j == heightSegments - 2) continue;

			// Ensamblamos los triangulos
			indices.push(i + j * quadsPerRow);
			indices.push(i + 1 + j * quadsPerRow);
			indices.push(i + 1 + (j + 1) * quadsPerRow);

			indices.push(i + j * quadsPerRow);
			indices.push(i + 1 + (j + 1) * quadsPerRow);
			indices.push(i + (j + 1) * quadsPerRow);
		}
	}

	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);

	return geometry;
}

function buildScene() {
	console.log('Building scene');

	const width = 100;
	const height = 100;

	terrainGeometry = elevationGeometry(
		width, height,
		amplitude,
		widthSegments, heightSegments,
		textures.elevationMap.object);

	console.log('Applying textures');
	terrainMaterial = new THREE.RawShaderMaterial({
		uniforms: {
			dirtSampler: { type: 't', value: textures.tierra.object },
			rockSampler: { type: 't', value: textures.roca.object },
			grassSampler: { type: 't', value: textures.pasto.object },
			scale: { type: 'f', value: 3.0 },
			terrainAmplitude: { type: 'f', value: amplitude },
			terrainAmplitudeBottom: { type: 'f', value: amplitudeBottom },
			worldNormalMatrix: { type: 'm4', value: null },
			dirtStepWidth: { type: 'f', value: 0.20 },
			rockStepWidth: { type: 'f', value: 0.15 },
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
	});
	terrainMaterial.needsUpdate = true;

	terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
	terrain.position.set(0, amplitudeBottom, 0);
	scene.add(terrain);

	console.log('Generating water');
	const waterGeometry = new THREE.PlaneGeometry(width/2, height);
	const waterMaterial = new THREE.MeshPhongMaterial( {color: 0x12ABFF, side: THREE.DoubleSide} );
	const water = new THREE.Mesh( waterGeometry, waterMaterial );
	water.rotateX(Math.PI/2);
	water.position.set(0, 0.85, 0);
	scene.add(water);

	const [treeLogs, treeLeaves] = createInstancedTrees(50);
	scene.add(treeLogs);
	scene.add(treeLeaves);
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
	gui.add(terrainMaterial.uniforms.scale, 'value', 1.00, 5.00).name('Terrain texture scale');
	gui.add(terrainMaterial.uniforms.dirtStepWidth, 'value', 0.0, 1.0).name('dirt step width');
	gui.add(terrainMaterial.uniforms.rockStepWidth, 'value', 0.10, 0.50).name('rock step width');
}

function mainLoop() {
	requestAnimationFrame(mainLoop);
	renderer.render(scene, camera);
}

setupThreeJs();
loadTextures(main);

function main() {
	buildScene();
	createMenu();
	mainLoop();
}
