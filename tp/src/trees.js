import * as THREE from 'three';

let treesForbiddenMapData, treesForbiddenMap, elevationMap, elevationMapData;

import elevationMapUrl     from './assets/elevation_map_wider_river.png'
import treeForbiddenMapUrl from './assets/tree_forbidden_zone_map_wider_path.png'

const textures = {
	elevationMap:     { url: elevationMapUrl, object: null },
	treeForbiddenMap: { url: treeForbiddenMapUrl, object: null }
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
	if((y > 6.8) || (y < 3.25)) {
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

// devuelve un arreglo de 2 `instancedMesh` con los troncos y copas de los arboles
export function createInstancedTrees(count) {
	console.log('Generating `' + count + '` instances of tree');

	let logHeight = 3.0;
	const treeLogGeometry   = new THREE.CylinderGeometry(
		0.10, 0.25, logHeight, 40, 40);
	treeLogGeometry.translate(0, logHeight/2.0, 0);
	const instancedTreeLogGeometry = new THREE.InstancedBufferGeometry();
	instancedTreeLogGeometry.copy(treeLogGeometry);
	const treeLogMaterial   = new THREE.MeshPhongMaterial({color: 0x7c3f00, side: THREE.FrontSide});
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

loadTextures(loadMapsData);
