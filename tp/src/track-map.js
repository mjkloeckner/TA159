import * as THREE from 'three';

let treesForbiddenMapData, treesForbiddenMap, elevationMap, elevationMapData;

const textures = {
	elevationMap:     { url: '/assets/elevation_map2.png', object: null },
	treeForbiddenMap: { url: '/assets/tree_forbidden_zone_map.png', object: null }
};

const widthSegments   = 100;
const heightSegments  = 100;
const amplitude       = 10;
const amplitudeBottom = -1.00;
const imgWidth  = 512;
const imgHeight = 512;

function getPixel(imgData, index) {
  let i = index*4, d = imgData.data
  return [d[i],d[i+1],d[i+2],d[i+3]] // Returns array [R,G,B,A]
}

function getPixelXY(imgData, x, y) {
  return getPixel(imgData, y*imgData.width+x)
}

// position: Vector3
function isForbbidenPosition(position) {
	const x = Math.floor(position.x);
	const y = position.y;
	const z = Math.floor(position.z);

	// TODO: estos valores deberian depender de la posicion del terreno
	if((y > 5.8) || (y < 3.25)) {
		// console.log("(" + position.x + ", " + position.y + ", " + position.z + ") is not valid ");
		return true;
	}
	
	let pixelArray = getPixelXY(treesForbiddenMap, x, z);
	const R = pixelArray[0]; // Red
	const G = pixelArray[1]; // Green
	const B = pixelArray[2]; // Blue
	const A = pixelArray[3]; // Alpha
	// const pixel = new THREE.Vector4(R, G, B, A);

	if(((R <= 10) && (G >= 250) && (B <= 10))
		|| (R <= 80) && (G <= 80) && (B <= 80)
		|| (R >= 200) && (G >= 200) && (B >= 200)) {
		// console.log("(" + position.x + ", " + position.y + ", " + position.z + ") is not valid ");
		return true;
	}

	// console.log("(" + position.x + ", " + position.y + ") is valid ");
	return false;
}

// obtiene una posicion aleatoria en el terreno, para obtener la altura del
// terreno utiliza el mapa de elevacion.
// `padding` permite definir un borde del cual no se toman puntos
function getRandomPositionInTerrain(padding = 0) {
	const x = Math.floor(Math.random() * (widthSegments-(padding*2)));
	const z = Math.floor(Math.random() * (heightSegments-(padding*2)));

	const pixelArray = getPixelXY(elevationMap, x, z); // array [R,G,B,A]
	const y = (pixelArray[0]/255)*amplitude;

	const position = new THREE.Vector3(x+padding, y, z+padding);
	return position;
}

// La funcion devuelve una geometria de Three.js
// width: Ancho del plano
// height: Alto del plano
// amplitude: Amplitud de la elevacion
// widthSegments: Numero de segmentos en el ancho
// heightSegments: Numero de segmentos en el alto
function elevationGeometry(width, height, amplitude, widthSegments, heightSegments) {
	console.log('Generating terrain geometry');
	let geometry = new THREE.BufferGeometry();

	const positions = [];
	const indices = [];
	const normals = [];
	const uvs = [];

	let imageData = elevationMap;
	let data = elevationMapData;

	const quadsPerRow = widthSegments - 1;

	// Recorremos los segmentos horizontales y verticales
	for (let x = 0; x < widthSegments - 1; x++) {
		for (let y = 0; y < heightSegments - 1; y++) {
			// valor del pixel en el mapa de elevacion en la posicion i, j

			let pixel = getPixelXY(imageData, x, y);

			// se utiliza el canal rojo [R, G, B, A];
			let z0 = pixel[0] / 255;
			const z = amplitude * z0;

			// valores de los píxeles de los puntos adyacentes
			let xPrev, xNext, yPrev, yNext;

			xPrev = (x > 0) ? getPixelXY(imageData, x-1, y)[0]/255 : undefined;
			xNext = (x < widthSegments-1) ? getPixelXY(imageData, x+1, y)[0]/255 : undefined;

			yPrev = (y > 0) ? getPixelXY(imageData, x, y+1)[0]/255 : undefined;
			yNext = (y < heightSegments-1) ? getPixelXY(imageData, x, y+1)[0]/255 : undefined;

			// diferencia entre los valores de los píxeles adyacentes en el eje
			// `x` y en el eje `y` de la imagen en el espacio de la textura
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

			// Añadimos los valores de los puntos al array de posiciones
			positions.push((width * x) / widthSegments - width / 2);
			positions.push(z);
			positions.push((height * y) / heightSegments - height / 2);

			// vectores tangentes a la superficie en el eje `x` y en el eje `y`
			let tanX = new THREE.Vector3(width / widthSegments, deltaX * amplitude, 0);
			let tanY = new THREE.Vector3(0, deltaY * amplitude, height / heightSegments);

			tanX.normalize();
			tanY.normalize();

			let normal = new THREE.Vector3().crossVectors(tanY, tanX);

			normals.push(normal.x);
			normals.push(normal.y);
			normals.push(normal.z);

			uvs.push(x / (widthSegments - 1));
			uvs.push(y / (heightSegments - 1));

			if ((x == widthSegments-2) || (y == heightSegments-2)) continue;

			// Ensamblamos los triangulos
			indices.push(x + y*quadsPerRow);
			indices.push(x + 1 + y*quadsPerRow);
			indices.push(x + 1 + (y+1)*quadsPerRow);

			indices.push(x + y*quadsPerRow);
			indices.push(x + 1 + (y+1)*quadsPerRow);
			indices.push(x + (y+1)*quadsPerRow);
		}
	}

	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);

	return geometry;
}

// devuelve un arreglo de 2 `instancedMesh` con los troncos y copas de los arboles
export function createInstancedTrees(count) {
	console.log('Generating `' + count + '` instances of tree');

	let logHeight = 3.0;
	const treeLogGeometry   = new THREE.CylinderGeometry(
		0.10, 0.25, logHeight, 40, 40);
	treeLogGeometry.translate(0, logHeight/2.0, 0);
	const instancedTreeLogGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLogGeometry.copy(treeLogGeometry);
	const treeLogMaterial   = new THREE.MeshPhongMaterial({color: 0x7c3f00});
	const instancedTreeLogs = new THREE.InstancedMesh(
		instancedTreeLogGeometry,
		treeLogMaterial,
		count);

	const treeLeavesRadius = 1.25;
	const treeLeavesGeometry = new THREE.SphereGeometry(treeLeavesRadius,40,40);
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

	const treesBorderPadding = 3.0;
	for (let i = 0; i < count; i++) {
		let position = getRandomPositionInTerrain(treesBorderPadding);
		for(let j = 0; isForbbidenPosition(position); ++j) {
			position = getRandomPositionInTerrain(treesBorderPadding);
			if(j++ == 1000) { // maximo de iteraciones
				break;
			}
		}

		if(isForbbidenPosition(position)) {
			continue;
		}

		const treeOffset = -1.50;

		// 1.50 numbero magico para posicionar correctamente los arboles con
		// respecto al terreno
		position.x -= (widthSegments+treesBorderPadding+1.50)/2;
		position.y += (amplitudeBottom + treeOffset);
		position.z -= (heightSegments+treesBorderPadding)/2;
		translationMatrix.makeTranslation(position);
		treeLogMatrix.identity();
		treeLeavesMatrix.identity();

		let scale = 0.6 + (Math.random()*(logHeight/3));
		treeLogMatrix.makeScale(1, scale, 1);
		treeLogMatrix.premultiply(translationMatrix);

		position.y += scale*logHeight;

		translationMatrix.makeTranslation(position);
		treeLeavesMatrix.premultiply(translationMatrix);

		instancedTreeLogs.setMatrixAt(i, treeLogMatrix);
		instancedTreeLeaves.setMatrixAt(i, treeLeavesMatrix);
	}

	console.log('Done generating `' + count + '` instances of tree');
	return [instancedTreeLogs, instancedTreeLeaves];
}



function buildTrees() {
	console.log('Building scene');

	const width  = widthSegments;
	const height = heightSegments;

	terrainGeometry = elevationGeometry(
		width, height,
		amplitude,
		widthSegments, heightSegments);

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

	const waterGeometry = new THREE.PlaneGeometry(width/2, height-1.55);
	const waterMaterial = new THREE.MeshPhongMaterial( {color: 0x12ABFF, side: THREE.DoubleSide} );
	const water = new THREE.Mesh( waterGeometry, waterMaterial );
	water.rotateX(Math.PI/2);
	water.position.set(0, 0.75, -1.00);
	// scene.add(water);

	const [treeLogs, treeLeaves] = createInstancedTrees(250);
	return 
	// scene.add(treeLogs);
	// scene.add(treeLeaves);
}

function loadMapsData() {
	console.log("Loading maps data");

	// Creamos un canvas para poder leer los valores de los píxeles de la textura
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');

	let treesForbiddenMapImage = textures.treeForbiddenMap.object.image;
	let elevationMapImage = textures.elevationMap.object.image;

	// ambos mapas deben tener el mismo tamaño
	const imgWidth  = widthSegments;
	const imgHeight = heightSegments;

	canvas.width  = imgWidth;
	canvas.height = imgHeight;

	ctx.drawImage(treesForbiddenMapImage, 0, 0, imgWidth, imgHeight);
	treesForbiddenMap = ctx.getImageData(0, 0, imgWidth, imgHeight);
	treesForbiddenMapData = treesForbiddenMap.data;

	ctx.drawImage(elevationMapImage, 0, 0, imgWidth, imgHeight);
	elevationMap = ctx.getImageData(0, 0, imgWidth, imgHeight);
	elevationMapData = elevationMap.data

	console.log("All maps data loaded succesfully");
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
	loadMapsData();
	// buildScene();
}

loadTextures(main);
