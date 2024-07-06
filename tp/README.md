# Trabajo Practico Sistemas Gráficos

El trabajo practico consiste en implementar una escena en 3D en
[WebGL](https://www.khronos.org/webgl/) utilizando la librería de JavaScript
[Three.js](https://threejs.org/)

![main_night](https://github.com/mjkloeckner/86.43-tp/assets/64109770/7c6c5819-63ce-485b-8b1c-766ff1cca611)

## Inicio Rápido

Clone el repositorio con el siguiente comando:

```console
$ git clone https://github.com/mjkloeckner/86.43.git
```

Navegue al directorio del repositorio clonado y posteriormente a la carpeta del
trabajo práctico

```console
$ cd 86.43/tp/
```

Instale las dependencias

```console
$ npm i
```

Finalmente inicialice un servidor Web en el directorio del trabajo práctico y
abra su navegador de internet preferido en la `url` especificada por `vite`

```console
$ vite
```

## Dependencias

* Un navegador que soporte [WebGL](https://get.webgl.org/)
* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)
* [vite](https://www.npmjs.com/package/vite)

## Objetivos

* [X] Terreno
* [X] Arboles
* [X] Vias de Tren
    - [X] Crear el terraplen
    - [X] Crear las vias
* [ ] Locomotora
    - [X] Chassis, cabina, ruedas, caldera
    - [ ] Hacer que las ruedas roten sobre su eje
* [X] Puente
    - [X] Base de ladrillos
    - [X] Estructura de Hierro
* [X] Túnel
* [X] Cámaras
    - [X] Orbital general
    - [X] Fija, locomotora frontal (desde la cabina hacia adelante)
    - [X] Fija, locomotora trasera (desde la cabina hacia atrás)
    - [X] Fija, con vistas al interior del túnel
    - [X] Fija, con vistas al interior del puente
    - [X] Primera persona (debe poder moverse sobre el terreno con el teclado y el mouse)
* [X] Texturas
* [ ] Iluminación
    - [X] Modo noche/día
    - [X] Luz en el frente del tren
    - [ ] Lamparas en posiciones aleatorias del mapa

## Como se generan los elementos de la escena

### Terreno

Para generar la geometría del terreno se utiliza un mapa de elevación el cual se
puede encontrar en [`assets/elevationMap.png`](./assets/elevationMap.png), luego
para la textura del terreno se utiliza 3 texturas diferentes, las cuales
se utilizan en el terreno de acuerdo a la elevación del mismo.

Para utilizar la misma textura varias veces y evitar que se note la repetición,
se utiliza la función Ruido de Perlin para obtener valores pseudo-aleatorios.

### Arboles

Los arboles se generan de manera aleatoria en todo el mapa, y se utiliza un mapa
similar al mapa de elevación para verificar que no caiga en un punto muy bajo o
muy alto, o una zona prohibida.

La cantidad de arboles en el mapa se puede cambiar mediante la modificación del
argumento del llamado a la función `buildTrees` en la función `buildScene` del
archivo `/src/scene.js`, hay que tener en cuenta que si bien queda mejor con
mas arboles en la escena, cuantos mas arboles haya peor será la performance.

### Terraplén y Vías de Tren

Para generar las vías del tren se utiliza la función
[`ParametricGeometry`](https://threejs.org/docs/index.html?q=param#examples/en/geometries/ParametricGeometry)
de `three.js`, la cual genera una geometría a partir de una función paramétrica
que recibe tres parámetros: `u`, `v` y un vector en espacio 3D.

### Locomotora

A continuación se muestra el árbol de dependencias de los objetos que componen
la locomotora

![Objeto tren: árbol de dependencia](./train-tree.png)

Para realizar cada objeto de la locomotora se utilizan funciones primitivas de `three.js` tales como
[`BoxGeometry`](https://threejs.org/docs/index.html?q=box#api/en/geometries/BoxGeometry) o
[`CylinderGeometry`](https://threejs.org/docs/index.html?q=cylin#api/en/geometries/CylinderGeometry),
las cuales generan cubos y cilindros, respectivamente.

### Túnel

El túnel se genera con la función `ExtrudeGeometry()` utilizando como forma una
curva predefinida.

### Puente

El puente se genera por partes, siendo las partes principales las paredes y los
soportes de metal (o `cage` como se define en el código), las paredes se generan
de manera similar al túnel, extruyendo una curva, a diferencia que la curva que
define la forma se define en base a parámetros definidos por el
usuario, de esta manera se puede reutilizar el mismo código para ambos puentes.

Para los soportes de metal del puente se utilizan cilindros para formar un cubo,
luego se repite el cubo en base a parámetros especificados por el usuario.

### Iluminación

La iluminación depende del modo (noche/día), en caso de estar en modo día se
muestran 3 luces: ambiente, direccional y puntual, esta ultima imitando al sol,
posicionándose de manera tal que coincida con el sol de la textura del cielo.

En modo noche se oculta la luz ambiente y se cambia el color de la luz
direccional por un tono más azulado, además se cambia la posición de la luz
puntual para que coincida con la posición de la luna de la textura del cielo

En cuanto a las luces del tren, solo se muestran cuando el modo noche esta
activo, en modo día se oculta.

## Recursos Consultados

* [Documentación de Three.js](https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene)

## Licencia

[MIT](./LICENSE)

