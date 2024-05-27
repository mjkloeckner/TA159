# Sistemas Gráficos

## Clase 15-05-24

### Renderer

- `toneMapping()`
- `domElement()` representa el contenido html a diferencia de `setSize()` el
  cual representa el tamano del canvas.

### Scene

### Object3D

#### Matrix

- position
- rotation
- scale

#### Mesh

Siempre conviene aplicarle rotación/escala a la mesh por sobre la geometría ya
que de esta manera se ahora memoria en la GPU

- PBR Meterials

#### Material

#### Geometrías

- Three.js utiliza triángulos para representar objetos, otra manera de trabajar
  es la Geometría Constructiva de Solidos (CSG por sus siglas en ingles)
- `BufferGeometryUtils()`: es conveniente unir multiples objetos que no van a
  cambiar entre si.

### Editor de three.js

[Visit this link](threejs.org/editor)


### Libros

[Libros Escenciales](http://www.repo.dreamhosters.com/libros-escenciales.zip)
## Clase 17-03-24

### Sistemas de coordenadas

- Terna derecha o terna izquierda
- `Three.js` utiliza un sistema coordenado de terna derecha
- Las transformaciones afines son aquellas que preservan la forma, son lineales
- Coordenadas homogéneas
- Las rotaciones siempre son desde el origen de coordenadas
- Las matrices se inicializan a la matriz identidad
- `matrixAutoUpdate = false`
- Gimbal Lock
- Cuaterniones
## Clase 21-03-24

### Arbol de Escena

- Un sistemas de coordenadas relativo puede ser interpretado como multiples
  transformaciones

### Correcta posición de los objectos en su sistema de coordenadas

- Trasladar la geometría instead of mesh to set the coordinate system origin
- `Parent.add(Child)` posición relativa al `Parent`
- `matrixWorld` representa las coordenadas respecto al sistema de coordenadas
  absoluto
- `matrix` representa las coordenadas respecto al sistema de coordenadas
  relativo

### Contenedores

- Los contenedores son los `Group`, también podrían ser `Object3D`
## Clase 25-3-24

### BufferAttributes

- [BufferAttributes](https://threejs.org/docs/index.html?q=bufferat#api/en/core/BufferAttribute)
- El constructor debe ser un
  (TypedArray)[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray]
- Spread opearator (...)
- `Index buffer` para ahorrar memoria eliminando vertices redundantes
- `bufferGeometry.setIndex()`
- Los intex buffers tambien son Typed Arrays *verificar la precision*
- Modos de dibujo de WebGL
- Three.js solo soporta GL_TRIANGLES para dibujar triángulos
- WebGL permite utilizar un numero de vertices con un determinado material y
  otro numero de vertices con otro.
- Regla de la mano derecha para determinar la cara frontal de un triangulo.
    * Solo se dibujan la cara frontal de los triángulos
- `flatShading()`
- WebGL interpola las normales de los vertices
- La GPU interpola los vertices ya sea de colores, normales, etc.
- Three.js `side` permite seleccionar que cara del triangulo dibujar

```js
	const defaultMaterial = new THREE.MeshPhongMaterial({
		color: 0xff9900,
		side: THREE.DoubleSide,
	});
```

- Los vectores normales deben tener norma `1`

### Tarea

- 23 grados tierra
## Clase 05-04-24

\tableofcontents

### Formatos Soportados por Three.js

* glTF
* FBX
* OBJ
* COLLADA (DAE)
* STL

Siendo el más importante y eficiente `glTF`

* Dos versiones 1.0 y 2.0, siendo la primera obsoleta

### GLTF

Los archivos `.gltf` son modelos 3D en formato JSON.

Los archivos `.glb` son la version binaria de los archivos `gltf`

### Loaders

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
```

```js
loader.load( 'models/helmet/DamagedHelmet.gltf',
            onModelLoaded,
            onProgress,
            onLoadError);
```

```js
function onModelLoaded(gltf) {
	console.log('Model loaded', gltf);
	gltf.scene;
	scene.add(gltf.scene);
}
```

```js
function onProgress(event) {
	console.log((event.loaded / event.total) * 100 + '% loaded');
}
```

* CallBacks vs. Promises

### Formate USDZ

Formato alternativo adoptado por Apple y desarrollado en conjunto por Pixar

Object promise

### Eventos del Teclado

Primero hay definir un callback para cuando se produzca un evento sobre un
objeto html en particular mientras la ventana del navegador este en foco

```js
Document.addEventListener('keydown', keyHandler)
```

```js
function keyHandler(event) {
    if (event.key == 'c' && event.ctrlKey && event.shiftKey) {
        console.log("Ctrl+Shift+c");
    }
}
```

#### Controles

##### FlyControl

##### OrbitControl

##### TrackballControl

#### User Interface

##### uil

[uil](https://github.com/lo-th/uil)

#### dat GUI

[dat.GUI](https://github.com/dataarts/dat.gui)

```js
let gui = new dat.GUI();
gui.add(params, 'cantidadTotal', 0, 10).step(1);
```

### Matriz de Normales

* El comportamiento deseado al trasladar y escalar un objeto, es que las
  normales conserven su dirección
* El comportamiento deseado al rotar un objeto es que las normales cambien su
  dirección
* Casos particulares incluyen escalado con diferente magnitud en sus componentes

### Shaders

#### Uniforms

Las `uniforms` son variables globales que comparten todas las unidades de
procesamiento de la GPU

```js
// Se definen los uniforms que se usarán en los shaders
uniforms: {
    modelMatrix: { value: new THREE.Matrix4() },
    viewMatrix: { value: new THREE.Matrix4() },
    projectionMatrix: { value: new THREE.Matrix4() },
},
```

#### Varyings

Las `varyings` son variables globales que el Vertex Shader comparte con el
Fragment Shader

#### Vertex Shader

```c
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;

void main() {
    vec3 pos = position;	

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
    vUv = uv;
}
```

#### Fragment Shader

```c
precision highp float;
varying vec2 vUv;

void main() {
    // Se pinta el fragmento con las coordenadas de textura
    gl_FragColor = vec4(vUv, 0.0, 1.0);
}
```

##### Normal a una Superficie deformada

* Versión de WebGl 2.0 (OpenGL 3.0) proporciona el calculo de las derivadas
* Se calcula el vector gradiente

```c
vec3 x=dFdx(vViewPos);
vec3 y=dFdy(vViewPos);
```

```c
// Normal de la superficie surge de la normalización del producto cruz de los
// vectores gradiente
vec3 normal=normalize(cross(x,y));
```
## Clase 08-04-24

\tableofcontents

### Superficies de Barrido (Sweep)

* Segmentos = niveles - 1;
* El buffer de indices no depende de la forma del objeto
* Para calcular el vector normal de una superficie siempre es mejor computarla
  utilizando la expresión analítica de la superficie, ya que al realizar una
  interpolación de las normales de los vertices adyacentes se pueden cometer
  errores
* Para la curva que forma el recorrido que genera la forma se necesita conocer
  la expresión analítica de la curva en forma paramétrica, por ejemplo para un
  tubo

$$f(u) =(R*cos(u*PI/2),R*sen(u*PI/2))$$

* Posición
* Tangente
* Normal
* Binormal

#### Matriz de Nivel

Para cada nivel se define la **Matriz de Nivel** que transforma la forma (sus
vértices) del espacio de modelado al sistema de coordenadas del nivel

La transformación de puede descomponer en: una Rotación (en X,Y,Z) + una
Traslación (al nivel)

#### Generación de Tapas

> Las tapas las podemos resolver duplicando las matrices de Nivel del primer y
> último nivel del recorrido
 
* De esta manera los indices son los mismo sol oque la posición de los vertices
  del ultimo nivel colapsara en un punto

* Muchos objectos manufacturados se pueden modelar con el algoritmo de Sweep
* Cualquier superficie de barrido se puede descomponer en un plano

### Superficies de Revolución

Las superficies de barrido son superficies de barrido cuya curva de recorrido
esun circulo de radio infinitesimal

### Trabajo Práctico

Una de las partes fundamentales

> Implementar el algoritmo de barrido

#### Forma

```js
posiciones = [];
normales = [];
```

#### Recorrido

```js
matricesDeNivel = [];
```
## Clase 12-04-24

\tableofcontents

### Geometrias
#### Superficies de Revolucion

#### [LatheGeombetry](https://threejs.org/docs/#api/en/geometries/LatheGeometry)

Genera superficies de revolución a partir de una forma, no interpola las
normales

#### ExtrudeGeometry

* Shape
* Path

#### ConvexGeometry

Genera el polígono más chico que encierra a una nube de puntos

#### ParametricGeometry

Permite implementar superficies de barrido

```js
const geometry = new THREE.ParametricGeometry( THREE.ParametricGeometries.klein, 25, 25 );
```

* `u` y `v` varían siempre entre 0 y 1 independiente del tamaño de la superficie

#### ShapeGeometry

#### TubeGeometry

#### SDFGeometry

* shadertoy -> Raymarching

#### [InstancedBufferGeometry](https://threejs.org/docs/#api/en/core/InstancedBufferGeometry)

#### Curvas de Bézier

> Controlar la tangente de la curva

Permite realizar curvas a tramos mucho más fácil que con puntos, luego para
representarla o utilizarla se discretiza

Puntos de control

##### Quadratic Bézier

##### Cubic Bézier

`getPoint(t)` devuelve el valor de la curva analíticamente

`getPointAt(u)` devuelve el valor de la curva al evaluar `u` en `lookUpTable`

* La distancia minima para dibujar una curva son 4 puntos de control

#### Catmull-Rom Spline

> Documental ILM: LIGHT & MAGIC (2022)

Son similares a las curvas de bezier pero permite calcular una curva suave que
pasa por un conjunto determinado de puntos

#### [Frenet Frames](https://janakiev.com/blog/framing-parametric-curves)

Es un algoritmo que permite obtener un vector tangente

`TubeGeometry`
## Clase 15-04-24 

\tableofcontents

* Binormal eje z positivo
* Normal hacia la derecha derecha
* Tangente recta

> Para calcular la normal se toma un vector provisorio `v = (0,1,0)` provisorio
> luego realizar el producto vectorial con el vector tangente. Para calcular la
> Binormal, se multiplica vectorialmente la normal hallada con el vector
> tangente.

* `Matrix.slerp()`: Interpola dos matrices

### Texturas

Mapeo de texturas

#### Unidimensional

> Arregla unidimensional

#### Bidimensional

> Arreglo 2D

##### Rasterizador (o Sampler?)

Dado un valor devuelve el color basado en una textura

* Minification
* Magnification

###### Filtrado de Texturas

Se utiliza para mitigar el efecto del aliasing. El aliasing ocurre en la
geometría también, y en ese caso se utiliza el anti-aliasing

###### Nearest Neighbor

###### Linear Filtering

###### Mipmapping

Se escalan las texturas hasta llegar a una textura de 1x1

Es preprocesado, por lo que **no genera** un gasto significativo en tiempo de
ejecución, ademas de que no consume mas de 50% de la textura original

#### Tridimensional

> Arreglo 3D

#### Bitmaps

Los bilmas es un formato de imagen y es así como se guarda en la memoria de la
GPU

#### Wrapping Modes

* `gl.REPEAT` La textura se repite infinitamente, aunque solo se guarda una copia
* `gl.CLAMP` Se conserva el valor limite de la textura

#### Shader

Se pueden modificar las texturas ya que las texturas pasan por un Shader

* En el vertex Shader se puede modificar las texturas

### Texturas en Three.js

[Textures](https://threejs.org/manual/#en/textures)

* Los cubos son grupos de indices
* Se pueden cargar multiples texturas a un grupo y Treejs asigna la texturas al
  grupo con el respectivo indice
* Simulación de flujo de líquido mediante la modificación de texturas
## Clase 19-04-24 

\tableofcontents

### Curvas

Las curvas pueden no verse y definir la geometría de la escena

#### Puntos de Control

Un conjunto de vertices con una determinada

#### Interpolación vs. Aproximación

En el primero, la curva pasa por los puntos de control, mientras que en la
aproximación, la curva no pasa por ningún punto de control, salvo quizás los
extremos 

#### Métodos de aproximación

##### Curva B-Spline

[Curva B-Spline](https://en.wikipedia.org/wiki/B-spline)

##### Curva de Lagrange

#### Invariancia Afín

#### Parametrización de Curvas

#### Método de Casteljau

Algoritmo de interpolación de puntos de control

#### Curvas de Bézier

La curva final es igual a la obtenida por el método de Casteljau, pero se
utiliza un método distinto para obtenerla, el algoritmo utilizado en la curva de
Bézier es recursivo

> De control global, es decir, todos los puntos de control afectan a todos los
> demás

Se define una curva de Bézier de grado $n$ de la siguiente manera

$$C(u) = \sum^{n}_{i=0} p_{i} B^{n}_{i}(u)$$

Hay que tener en cuenta que el grado $n$ es la cantidad de puntos de control
menos uno

Existe una forma matricial para halla de las curvas de Bézier

> Para definir una curva cerrada se usan las mismas coordenadas para el punto
> inicial y final y ademas para que sea suave el segundo punto y el penúltimo
> deben tener la misma dirección

> Polinomios de Berstein
> 
> $$B^{n}_{i}\left(u\right)$$

##### Propiedades

* Comienzan y terminan en los puntos extremos, es decir, interpola dichos puntos
* Comienza en el primer punto con la dirección del segundo 
* La curva de Bézier siempre queda definida dentro del casco convexo del
  polígono de control
* La velocidad inicial de la curva, depende de la longitud del segundo punto

##### Concatenación de Curvas de Bézier

Se pueden obtener formas complejas concatenando Curvas de Bézier, para esto se
usa el ultimo punto de la primer curva como el primero de la siguiente

#### Curvas de Catmull-Rom

Son curvas de interpolación similares a las de Bézier, solo que utilizan cuatro
puntos de control como mínimo y luego la curva se dibuja con el segundo y tercer
punto

#### Trabajo Práctico

* Arboles -> Grupo dentro de Geometrías
* Animar el nivel del agua
* Height Maps o Elevation Map
* [World Machine](https://www.world-machine.com/) Sirve para crear Elevation Maps
## Clase 22-04-24 

\tableofcontents

### Transformaciones

### Map de coordenadas UV

#### En superficies de barrido

Utilizar `getPointAt()` por sobre `getPoint()`

#### En tapas

[Shape](https://threejs.org/docs/index.html?q=shape#api/en/extras/core/Shape)

### [Perlin noise](https://es.wikipedia.org/wiki/Ruido_Perlin)

* Se utilizan números pseudo-aleatorios para generar ruido

### Repetición de texturas en el Sampler

Para cubrir una extension mayor que el de la textura evitando que la repetición
de la misma sea evidente, una técnica es repetir la textura pero con diferentes
escalas, siendo el valor de la escala un numero no múltiplo, luego mezclar todas
las texturas escaladas
## Clase 26-04-24 

\tableofcontents

### Notas sobre el Trabajo Práctico

* Para la cámara en primera persona, se puede agregar un botón a la interfaz
  para iniciar la captura del teclado (debido a como funcionan los navegadores)
* Textura `skybox` para el cielo
    - En caso de utilizar se puede hacer con
      [`renderer.background`](https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L31)
* Para el modo noche se suele utilizar una iluminación azul oscuro  

### Sobre curvas de Bézier

* Promedio ponderado de una serie de puntos de control
* El algoritmo de Casteljau es un método iterativo que sirve para contruir la
  curva de Bézier
* Con mas de 4 puntos de control la curva pierde "control local", por lo que se
  preferible utilizar curvas de Bézier de grado `4` concatenadas
* La suma de todos las bases de Bernstein es `1`, esto garantiza que la curva
  esta incluida en la envolvente convexa 
* Derivando la expresión de las bases de Bernstein se obtiene el vector tangente
* [The Beauty of Bézier Curves](https://youtu.be/aVwxzDHniEw)
* [OpenGL ES Shading Language (GLSL)](https://shaderific.com/glsl.html)

### Sobre el parcial

El parcial es en mayoría teórico escrito, puede pedir algunos ejemplos breves de
código 

#### Temas que se evalúan

* Pipeline gráfico
* Transformaciones 
* Curvas de Bézier
* Proyecciones

### Iluminación

* En `glsl` no existen los arreglos dinámicos ya que los programas deben ser
  estáticos, es decir, se debe declarar el "scope" de cada variable de antemano
* Para declarar shaders en `Three.JS` se puede utilizar `rawShaderMaterial`
* Reflexiones
* Refracciones
* Interreflexiones
* Sub-Surface Scattering
* Modelo `phong` de iluminación
## Clase 29-04-24 

\tableofcontents

### Proyecciones Gráficas

* Las cámaras se crean en el origen de coordenadas de la cámara, mirando en la
  dirección del eje `z` negativo
* La cámara queda fija, la escena es la que transforma
* La cámara tiene 6 grados de libertad:
    - traslación en los ejes `x`, `y` y `z`
    - rotación `roll`, `pitch` y `yaw`
* Coordenadas de visualización a coordenadas de proyección
* Cuando se aplica la proyección se pierde una dimensión

#### Proyección perspectiva

Quedan determinadas por el punto de proyección.

* Se ubica el punto de proyección en el origen del sistema de coordenadas de la
  cámara
* En las proyecciones en perspectiva hay que calcular una matriz de proyección
  para cada vértice, ya que la proyección depende de la distancia

#### Proyección paralela

Quedan determinadas por la dirección de la proyección 

##### Proyecciones ortográficas

* Debido a que la cámara apunta en dirección `-z`, para calcular las
  proyecciones ortográficas principales se rota la pieza y luego se proyecta
  sobre el eje `z` , de esta forma la coordenadas de la proyección sobre el
  plano de proyección son las coordenadas `x` e `y`

###### Multivista

###### Axonométricas Dimétricas

###### Axonométricas Isométricas 

###### Axonométricas Trimétricas 

##### Proyecciones oblicuas

* z-buffer
## Clase 03-05-24 

\tableofcontents

### Iluminación

* En la luz puntual se utiliza un decaimiento lineal para compensar la falta de
  luz indirecta
* Modelo de iluminación global vs. Iluminación

#### Modelo de Phong

* Ley de Lambert
* Los materiales tienen una componente especular, una difusa y una mezcla de
  ambos
* Reflexión Difusa
* Reflexión Especular
* Para el calculo de la componente especular del modelo de Phong los vectores
  deben estar normalizados
* $K_d$ es similar a $K_s$ pero para la componente difusa
* Color de luz y de superficie
* $\alpha$: Factor de "glossiness" (en `three.js` "shininess")
* Coeficiente especular $K_s$

#### Mapa de Normales

* Se codifica en RGB el valor de la normal
* Luego el modelo de Phong se utiliza de la misma manera solo que con la nueva
  normal obtenida mediante el mapa de normales

#### Mapa de Desplazamiento

#### Mapa de Iluminación
## Clase 06-05-24

\tableofcontents

### Resolución Ejercicios de Proyección

En las proyecciones en perspectiva se necesita un foco, mientras que las
proyecciones paralelas una dirección.

Para determinar las ecuaciones de la proyección en perspectiva se sabe que los
triángulos que forman el plano con el punto foco y el punto a proyectar con el
punto foco, son triángulos semejantes, sabiendo esto se puede hallar una
relación entre los catetos de los triángulos.

* Parámetros de Cámara
    - Near
    - Far
    - Frustum
* [Demo Proyección](https://xnqor.csb.app/)
* En el z-buffer se guarda la posición en el eje `z` de los fragmentos para
  luego determinar que fragmento dibujar por sobre cual, en función de la
  distancia a la cámara

### Color

* El color es una sensación que percibe el ser humano
* El termino "luz blanca" hace referencia a toda la gama de grises
* Hay tonalidades que no se corresponden a una longitud de onda, por ejemplo la
  gama de magenta (el violeta no es magenta). Este tipo de tonalidades se
  denominan no espectrales justamente porque no corresponden a una longitud de
  onda. Por el contrario los tonos espectrales, son aquellos que tiene una
  longitud de onda del espectro electromagnético asociada.
* Los monitores de las computadoras no representan todos los colores ya que con
  tres colores monocromáticos no se pueden representar todos los colores. Los
  colores que se pierden son los totalmente saturados.
* Modelo CIE 1931
    - Diagrama de cromaticidad
    - GAMUT
* Modelo RGB (Red-Green-Blue)
* Modelo CMY (Cyan-Magenta-Yellow)
## Clase 16-05-24

\tableofcontents

### Efectos de post-procesado con `EffectComposer`

* Se utiliza para aplicar filtros a una imagen ya generada
* Ocurre al final del pipeline gráfico
* Estos filtros por lo general utilizan información de profundidad del
  `depthBuffer` en el cual se almacena la coordenada `z` de los objetos cuando
  se proyectan en la imagen final
* El rasterizador solo dibuja lo que pasa por el centro del pixel
* Para el [efecto de blur](https://threejs.org/examples/?q=post#webgl_postprocessing_unreal_bloom)
  se utiliza un filtro de convolución

### Render to texture

Se guarda el resultado de un render en una textura y luego se puede aplicar
sobre un objeto

### Partículas

Las partículas se representan utilizando `sprites` los cuales son imágenes de 2D
que siempre están de frente a la cámara

### Shadow maps

Se guarda una imagen del render en escala de grises con más precision de los
normal, por lo general `float16` o `float32`. Luego la luz "ilumina" hasta una
profundidad dada por el mapa de grises

* Solo funciona con luces que tienen frustum

### [Raycaster](https://threejs.org/docs/index.html?q=raycaster#api/en/core/Raycaster)

Calcula la intersección entre un rayo y un objeto. Se puede utilizar para
interacciones con el mouse, utilizando como rayo aquel que se origina en la
cámara y atraviesa el cursor.

```js
// update the picking ray with the camera and pointer position
raycaster.setFromCamera( pointer, camera );

// calculate objects intersecting the picking ray
const intersects = raycaster.intersectObjects( scene.children );
```

### [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

Se puede utilizar para simular sonidos tridimensionales. Tiene un modelo muy
preciso para simular como absorbe las frecuencias el cráneo humano
## Clase 24-05-24

\tableofcontents

### Links útiles sobre color

> NOTA: El Cubo RGB, CMY se toma en el coloquio

* El modelo CMY es un modelo sustractivo, ya que al restar valores a las
  coordenadas se aumenta luz, mientras que en el modelo RGB al aumenta los
  valores RGB se aumenta luz.
* Corrección de gamma: se aplica una curva de transferencia o curva de gamma a
  la imagen para corregir el tono de los colores oscuros y claros
  [Color management](https://threejs.org/docs/?q=color#manual/en/introduction/Color-management0)
* Espacio RGB lineal o RGB con curva de gamma.
* Cuando se carga una imagen en Three.JS se debe conocer el modo en que esta
  guardada la imagen (por ejemplo en sRGB).
