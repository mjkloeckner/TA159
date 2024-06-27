import * as THREE from 'three';

export function generateTunnelGeometry(
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

	const points = path.getPoints();
	const shape = new THREE.Shape(points);

	const extrudeSettings = {
		curveSegments: 24,
		steps: 50,
		depth: tunnelLen,
	};

	const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
	geometry.translate(0, 0, -tunnelLen/2);
	return geometry;
}
