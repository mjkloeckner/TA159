import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const textures = {
	tierra:     { url: '/assets/tierraSeca.jpg', object: null },
	ladrillos:  { url: '/assets/pared-de-ladrillos.jpg', object: null },
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

const arcWidth     = 5;
const arcCount     = 4;
const arcRadius    = arcWidth/2;
const columnHeight = 5;
const columnWidth  = 1.50;
const topPadding   = 0.50;
const startPadding = 10;
const endPadding   = startPadding;
const bridgeWallThickness = 2.5;
const bridgeLen           = arcCount*(columnWidth+arcWidth)+columnWidth+startPadding+endPadding;
const bridgeHeight        = columnHeight+arcRadius+topPadding;

export function generateBridgeWallGeometry() {
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

const squareTubeRadius = 0.15;
function generateBridgeCage(squaresCount = 3) {
	const squaresSideLen = 10;
	const bridgeCageLen  = squaresCount * squaresSideLen;

	let geometries = []

	let cylinderBase, cylinderCorner, cylinderCrossbar;
	for(let square = 0; square < squaresCount; ++square) {
		// 0 -> 00
		// 1 -> 01
		// 2 -> 10
		// 3 -> 11
		for(let i = 0; i < 4; ++i) {
			cylinderBase = new THREE.CylinderGeometry(
				squareTubeRadius, squareTubeRadius, squaresSideLen);

			cylinderCorner = cylinderBase.clone();

			const squareHypotenuse = Math.sqrt(2*squaresSideLen*squaresSideLen);
			cylinderCrossbar = new THREE.CylinderGeometry(
				squareTubeRadius, squareTubeRadius, squareHypotenuse);

			if((i % 2) == 0) {
				cylinderBase.rotateZ(Math.PI/2);
				cylinderBase.translate(
					0,
					square*(squaresSideLen),
					((-1)**(i>>1))*squaresSideLen/2);

				cylinderCrossbar.rotateZ((-1)**((i>>1))*Math.PI/4);
				cylinderCrossbar.translate(
					0,
					square*(squaresSideLen)+(squaresSideLen/2),
					((-1)**(i>>1))*squaresSideLen/2);

				cylinderCorner.translate(
					((-1)**(i>>1))*squaresSideLen/2,
					square*(squaresSideLen)+(squaresSideLen/2),
					((-1)**(i&1))*squaresSideLen/2);
			} else {
				cylinderBase.rotateX(Math.PI/2);
				cylinderBase.translate(
					((-1)**(i>>1))*squaresSideLen/2,
					square*(squaresSideLen),
					0);

				cylinderCrossbar.rotateX((-1)**((i>>1))*Math.PI/4);
				cylinderCrossbar.translate(
					((-1)**(i>>1))*squaresSideLen/2,
					square*(squaresSideLen)+(squaresSideLen/2),
					0);

				cylinderCorner.translate(
					((-1)**(i>>1))*squaresSideLen/2,
					square*(squaresSideLen)+(squaresSideLen/2),
					((-1)**(i&1))*squaresSideLen/2);
			}
			geometries.push(cylinderBase);
			geometries.push(cylinderCrossbar);
			geometries.push(cylinderCorner);
		}

		// agregamos un cuadrado mas para 'cerrar' la 'jaula'
		if((square + 1) == squaresCount) {
			for(let i = 0; i < 4; ++i) {
				cylinderBase = new THREE.CylinderGeometry(
					squareTubeRadius, squareTubeRadius, squaresSideLen);

				if((i % 2) == 0) {
					cylinderBase.rotateZ(Math.PI/2);
					cylinderBase.translate(
						0,
						(square+1)*(squaresSideLen),
						((-1)**(i>>1))*squaresSideLen/2);
				} else {
					cylinderBase.rotateX(Math.PI/2);
					cylinderBase.translate(
						((-1)**(i>>1))*squaresSideLen/2,
						(square+1)*(squaresSideLen), 0);
				}
				geometries.push(cylinderBase);
			}
		}
	}

	const bridgeCage = mergeGeometries(geometries);
	bridgeCage.rotateZ(Math.PI/2);
	bridgeCage.translate(bridgeCageLen/2, squaresSideLen/2, 0);
	return bridgeCage;
}

export function generateBridge() {
	const bridge = new THREE.Object3D();

	const bridgeWidth   = 10;
	const roadwayHeight = 2;

	const leftWallGeometry = generateBridgeWallGeometry();
	leftWallGeometry.translate(0, 0, -bridgeWidth/2);

	const rightWallGeometry = generateBridgeWallGeometry();
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
	bridge.add(bridgeColumns);

	// para reutilizar la textura de ladrillos usada en los arcos se escalan las
	// coordenadas uv de la geometria de la parte superior
	let uvs = bridgeRoadwayGeometry.attributes.uv.array;
	for (let i = 0, len = uvs.length; i < len; i++) {
		uvs[i] = (i % 2) ? uvs[i]*2.50 : uvs[i]*30.0;
	}

	const bridgeRoadway = new THREE.Mesh(bridgeRoadwayGeometry, bridgeMaterial);
	bridge.add(bridgeRoadway);

	const cageGeometry = generateBridgeCage()
	cageGeometry.translate(0, bridgeHeight+roadwayHeight-squareTubeRadius*2, 0);

	const cageMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		color: 0xFFFFFF
	});

	const bridgeCage = new THREE.Mesh(cageGeometry, cageMaterial);
	bridge.add(bridgeCage);

	const roadwayFloorGeometry = new THREE.PlaneGeometry(
		bridgeWidth+bridgeWallThickness,
		bridgeLen);

	roadwayFloorGeometry.rotateZ(Math.PI/2)
	roadwayFloorGeometry.rotateX(Math.PI/2)
	roadwayFloorGeometry.translate(0, bridgeHeight+roadwayHeight, 0)

	textures.tierra.object.wrapS = THREE.MirroredRepeatWrapping;
	textures.tierra.object.wrapT = THREE.MirroredRepeatWrapping;
	textures.tierra.object.repeat.set(1, 5);
	textures.tierra.object.anisotropy = 16;

	const roadwayFloorMaterial = new THREE.MeshPhongMaterial({
		side: THREE.DoubleSide,
		transparent: false,
		opacity: 1.0,
		shininess: 10,
		map: textures.tierra.object
	});

	const roadwayFloor = new THREE.Mesh(roadwayFloorGeometry, roadwayFloorMaterial);
	bridge.add(roadwayFloor)
	return bridge;
}

function main() {
}

loadTextures(main);
