import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import tierraSecaUrl from './assets/tierraSeca.jpg'
import ladrillosUrl  from './assets/pared-de-ladrillos.jpg'

const textures = {
	tierra:     { url: tierraSecaUrl, object: null },
	ladrillos:  { url: ladrillosUrl, object: null },
};

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

// const arcRadius    = 3;
// const arcCount     = 1;
// const columnHeight = 0;
// const columnWidth  = 1.00;
// const arcWidth     = arcRadius*2;
// const startPadding = 12;
// const endPadding   = startPadding;
// const bridgeHeight        = columnHeight+arcRadius+topPadding;

const topPadding   = 0.25;
const bridgeWallThickness = 2.5;
const bridgeWidth   = 10;
const roadwayHeight = 0.65;

function generateBridgeWallGeometry(
		arcCount=2, arcRadius=3, columnWidth=1, columnHeight=0, padding=10) {

	const arcWidth = arcRadius*2;
	const startPadding = padding;
	const endPadding = padding;
	const bridgeLen = arcCount*(columnWidth+arcWidth)+columnWidth+startPadding+endPadding;
	const bridgeHeight = columnHeight+arcRadius+topPadding;
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

function generateBridgeCage(squaresCount=3, squareTubeRadius=0.15) {
	const squareLen = bridgeWidth - 0.25;
	const bridgeCageLen  = squaresCount * squareLen;

	let geometries = []

	let cylinderBase, cylinderCorner, cylinderCrossbar;
	for(let square = 0; square < squaresCount; ++square) {
		// 0 -> 00
		// 1 -> 01
		// 2 -> 10
		// 3 -> 11
		for(let i = 0; i < 4; ++i) {
			cylinderBase = new THREE.CylinderGeometry(
				squareTubeRadius, squareTubeRadius, squareLen);

			cylinderCorner = cylinderBase.clone();

			const squareHypotenuse = Math.sqrt(2*squareLen*squareLen);
			cylinderCrossbar = new THREE.CylinderGeometry(
				squareTubeRadius, squareTubeRadius, squareHypotenuse);

			if((i % 2) == 0) {
				cylinderBase.rotateZ(Math.PI/2);
				cylinderBase.translate(
					0,
					square*(squareLen),
					((-1)**(i>>1))*squareLen/2);

				cylinderCrossbar.rotateZ((-1)**((i>>1))*Math.PI/4);
				cylinderCrossbar.translate(
					0,
					square*(squareLen)+(squareLen/2),
					((-1)**(i>>1))*squareLen/2);

				cylinderCorner.translate(
					((-1)**(i>>1))*squareLen/2,
					square*(squareLen)+(squareLen/2),
					((-1)**(i&1))*squareLen/2);
			} else {
				cylinderBase.rotateX(Math.PI/2);
				cylinderBase.translate(
					((-1)**(i>>1))*squareLen/2,
					square*(squareLen),
					0);

				cylinderCrossbar.rotateX((-1)**((i>>1))*Math.PI/4);
				cylinderCrossbar.translate(
					((-1)**(i>>1))*squareLen/2,
					square*(squareLen)+(squareLen/2),
					0);

				cylinderCorner.translate(
					((-1)**(i>>1))*squareLen/2,
					square*(squareLen)+(squareLen/2),
					((-1)**(i&1))*squareLen/2);
			}
			geometries.push(cylinderBase);
			geometries.push(cylinderCrossbar);
			geometries.push(cylinderCorner);
		}

		// agregamos un cuadrado mas para 'cerrar' la 'jaula'
		if((square + 1) == squaresCount) {
			for(let i = 0; i < 4; ++i) {
				cylinderBase = new THREE.CylinderGeometry(
					squareTubeRadius, squareTubeRadius, squareLen);

				if((i % 2) == 0) {
					cylinderBase.rotateZ(Math.PI/2);
					cylinderBase.translate(
						0,
						(square+1)*(squareLen),
						((-1)**(i>>1))*squareLen/2);
				} else {
					cylinderBase.rotateX(Math.PI/2);
					cylinderBase.translate(
						((-1)**(i>>1))*squareLen/2,
						(square+1)*(squareLen), 0);
				}
				geometries.push(cylinderBase);
			}
		}
	}

	const bridgeCage = mergeGeometries(geometries);
	bridgeCage.rotateZ(Math.PI/2);
	bridgeCage.translate(bridgeCageLen/2, squareLen/2, 0);
	return bridgeCage;
}

export function generateBridge(arcCount=1, arcRadius=3,
	columnWidth=0, columnHeight=0, padding=10, squaresCount=0, squareLen=1) {

	const arcWidth     = arcRadius*2;
	const startPadding = padding;
	const endPadding   = padding;
	const bridgeHeight = columnHeight+arcRadius+topPadding;
	const bridgeLen    = arcCount*(columnWidth+arcWidth)+columnWidth+startPadding+endPadding;
	const squareTubeRadius = 0.30;

	const bridge = new THREE.Object3D();

	const leftWallGeometry = generateBridgeWallGeometry(
		arcCount, arcRadius, columnWidth, columnHeight, padding);

	// const leftWallGeometry = generateBridgeWallGeometry();
	leftWallGeometry.translate(0, 0, -bridgeWidth/2);

	const rightWallGeometry = generateBridgeWallGeometry(
		arcCount, arcRadius, columnWidth, columnHeight, padding);

	// const rightWallGeometry = generateBridgeWallGeometry();
	rightWallGeometry.translate(0, 0, bridgeWidth/2)

	const bridgeColumnsGeometry = mergeGeometries([leftWallGeometry, rightWallGeometry]);

	const bridgeRoadwayGeometry = new THREE.BoxGeometry(
		bridgeLen, roadwayHeight, bridgeWidth+bridgeWallThickness,
	);

	bridgeRoadwayGeometry.translate(0, bridgeHeight+roadwayHeight/2, 0);

	textures.ladrillos.object.wrapS = THREE.RepeatWrapping;
	textures.ladrillos.object.wrapT = THREE.RepeatWrapping;
	textures.ladrillos.object.repeat.set(0.75*0.15, 0.75*0.35);
	// textures.ladrillos.object.anisotropy = 16;

	const bridgeMaterial = new THREE.MeshPhongMaterial({
		side: THREE.FrontSide,
		map: textures.ladrillos.object
	});

	/*
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

	const bridgeRoadway = new THREE.Mesh(bridgeRoadwayGeometry, roadwayMaterial);
	scene.add(bridgeRoadway);
	*/

	const bridgeColumns = new THREE.Mesh(bridgeColumnsGeometry, bridgeMaterial);
	bridgeColumns.castShadow    = true;
	bridgeColumns.receiveShadow = true;

	bridge.add(bridgeColumns);

	// para reutilizar la textura de ladrillos usada en los arcos se escalan las
	// coordenadas uv de la geometria de la parte superior
	let uvs = bridgeRoadwayGeometry.attributes.uv.array;
	for (let i = 0, len = uvs.length; i < len; i++) {
		uvs[i] = (i % 2) ? uvs[i]*2.50 : uvs[i]*30.0;
	}

	const bridgeRoadway = new THREE.Mesh(bridgeRoadwayGeometry, bridgeMaterial);
	bridge.add(bridgeRoadway);

	bridgeRoadway.castShadow    = true;
	bridgeRoadway.receiveShadow = true;

	const cageGeometry = generateBridgeCage(squaresCount)
	cageGeometry.translate(0, bridgeHeight+roadwayHeight-squareTubeRadius*2, 0);

	const cageMaterial = new THREE.MeshPhongMaterial({
		side: THREE.FrontSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		color: 0xFFFFFF
	});

	const bridgeCage = new THREE.Mesh(cageGeometry, cageMaterial);

	bridgeCage.castShadow    = true;
	bridgeCage.receiveShadow = true;

	bridge.add(bridgeCage);

	const roadwayFloorGeometry = new THREE.BoxGeometry(
		bridgeWidth+bridgeWallThickness+0.01,
		bridgeLen+0.01, 0.10);

	roadwayFloorGeometry.rotateZ(Math.PI/2)
	roadwayFloorGeometry.rotateX(Math.PI/2)
	roadwayFloorGeometry.translate(0, bridgeHeight+roadwayHeight, 0)

	textures.tierra.object.wrapS = THREE.MirroredRepeatWrapping;
	textures.tierra.object.wrapT = THREE.MirroredRepeatWrapping;
	textures.tierra.object.repeat.set(1, 5);
	textures.tierra.object.anisotropy = 16;

	const roadwayFloorMaterial = new THREE.MeshPhongMaterial({
		side: THREE.FrontSide,
		map: textures.tierra.object
	});

	const roadwayFloor = new THREE.Mesh(roadwayFloorGeometry, roadwayFloorMaterial);
	roadwayFloor.receiveShadow = true;
	roadwayFloor.castShadow = false;

	bridge.add(roadwayFloor)
	return bridge;
}

function main() {
}

loadTextures(main);
