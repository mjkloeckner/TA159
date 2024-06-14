# Trabajo Practico Sistemas Gráficos

El trabajo practico consiste en implementar una escena en 3D utilizando WebGL,
en particular la libreria [Three.js]()

## Elementos de la escena

* [X] Terreno
* [X] Arboles
* [ ] Vias de Tren
* [ ] Locomotora
* [ ] Puente
* [ ] Túnel
* [ ] Camaras
* [X] Texturas
* [ ] Iluminación

### Terreno

Para generar la geometría del terreno se utiliza un mapa de elevación el cual se
puede encontrar en [`assets/elevationMap.png`](./assets/elevationMap.png), luego
para la textura del terreno se utiliza 3 texturas diferentes, las cuales
se utilizan en el terreno de acuerdo a la elevación del mismo.

Para utilizar la misma textura varias veces y evitar que se note la repetición,
se utiliza la función Ruido de Perlin para obtener valores pseudo-aleatorios.

### Arboles

Los arboles se generan de manera aleatoria en todo el mapa, y se utiliza el mapa
de elevación para verificar que no caiga en un punto muy bajo o muy alto, como
puede ser montaña o rio, de acuerdo a un parametro fijo

### Vias de Tren

### Locomotora

A continuacion se muestra el arbol de dependencias de los objetos que componen
la locomotora

![Objeto tren: arbol de dependencia](https://github.com/mjkloeckner/86.43-tp/assets/64109770/a4f8ea14-83f1-4180-bbad-696f4ee5dadf)

### Puente

### Túnel

### Camaras

### Texturas

### Iluminación
