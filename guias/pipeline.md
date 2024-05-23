# El Pipeline Gráfico de WebGL

Sistemas Gráficos (86.43) - 1C2024 - FIUBA  
Martin J. Klöckner - [mklockner@fi.uba.ar](mailto:mklockner@fi.uba.ar)

> 1. ¿Qué es el Pipeline Gráfico en el contexto de WebGL y Three.js?

El pipeline gráfico hace referencia a la serie de procedimientos que hacen falta
para renderizar un objeto 3D en la pantalla de una computadora, en el contexto
de WebGL y Three.js, el objeto se renderiza en un navegador.

> 2. ¿Cuáles son las etapas principales del Pipeline Gráfico?

Las etapas principales del Pipeline Gráfico son el procesamiento de vertices
("vertex shader"), la etapa de pasterización y la etapa de procesamiento de
fragmentos ("fragment shader" o "pixel shader").

![Diagrama de flujo completo del pipeline gráfico[^1]](./3D-Pipeline.png)

[^1]: [Pipeline Flow Chart: Martin Wantke, Wikimedia Commons,
    2021.](https://commons.wikimedia.org/wiki/File:3D-Pipeline.svg)

> 3. ¿Qué función desempeña el "vertex shader" en el proceso de renderizado?

El procesador de vertices o "vertex shader" se encarga de aplicar
transformaciones a cada uno de los vertices, la principal tarea es transformar
la posición 3D del vértice en una posición 2D en el plano virtual que se
mostrara en pantalla, así como también obtener la profundidad y almacenarla en
el `z-buffer`.[^2]

[^2]: [“Shader” Wikipedia, The Free Encyclopedia, 2 Mar 2024.](https://en.wikipedia.org/w/index.php?title=Shader)

Los "vertex shader" pueden manipular propiedades del vértice como la posición,
el color o las coordenadas de la textura, no pueden crear nuevos vértices.

> 4. ¿Cómo se define un vertex shader en GLSL, cuáles son las salidas mínimas 
>    necesarias (que valores debe retornar obligatoriamente)?

En GLSL el trabajo mínimo de un vertex shader es asignar a la variable
especial `gl_Position` un vector de 4 dimensiones (x, y, z, w). Esta variable
luego será entregada a la siguiente etapa del pipeline gráfico.[^3]

[^3]: ["A Primer on Shaders", Learn WebGL, Wayne Brown, 2015.](http://learnwebgl.brown37.net/rendering/shader_primer.html)

Un implementación en GLSL del vertex shader mas básico para renderizar un objeto
se puede ver a continuación:

```glsl
// Vertex Shader
uniform   mat4 u_Transform;
uniform   vec4 u_Color;
attribute vec3 a_Vertex;

void main() {
    // Transforma la posicion del vertice
    gl_Position = u_Transform * vec4(a_Vertex, 1.0);
}
```

> 5. ¿Qué datos se pueden pasar al vertex shader a través de atributos?

Los atributos que se pueden pasar al "vertex shader" se denominan "vertex
attributes" y pueden contener por ejemplo posiciones, normales o coordenadas de
textura.

> 6. ¿Qué es una variable uniform en el contexto de shaders?

En GLSL una variable `uniform` es una variable de alcance global la cual se
puede utilizar para recibir parámetros del programa que utiliza el shader.[^4]
El valor de las variables de tipo `uniform` se almacena en el propio objeto
compilado del shader.[^5]

[^4]: ["GLSL Object" OpenGL Wiki, 2015.](https://www.khronos.org/opengl/wiki/GLSL_Object)
[^5]: ["Uniform (GLSL)" OpenGL Wiki, 2015.](https://www.khronos.org/opengl/wiki/Uniform_(GLSL))

Las variables de tipo `uniform` se denominan así porque no cambian entre las
diferencias instancias de la ejecución del shader. Recordemos que en el caso de
los "vertex shaders", por ejemplo, se ejecuta una instancia del shader por cada
vértice. Las variables `uniform` se diferencian de otras variables como las de
entrada y salida de cada etapa, las cuales por lo general cambian en cada
invocación del shader.

> 7. ¿Cuál es la diferencia entre un vertex shader y un fragment shader?

La diferencia entre "fragment shader" y "vertex shader" es
que el trabajo del primero es asignar un color a cada fragmento, mientras que el
trabajo del segundo es, como vimos previamente, aplicar transformaciones a cada
vértice.

Recordemos que un "fragmento" es el conjunto de un pixel y toda su información
necesaria para ser renderizado. 

> 8. ¿Cómo se almacenan los valores de color de cada pixel en el fragment
>    shader?

En el fragment shader se almacenan en la variable `gl_FragColor`

```glsl
// Fragment shader
uniform vec4 u_Color;

void main() {
  gl_FragColor = u_Color;
}
```

> 9. ¿Qué es un `sampler2D` y cómo se utiliza en un fragment shader?

Un sampler en GLSL es un tipo de variable especial que se utiliza par acceder a
una textura desde un shader. En particular `sampler2D` es un tipo especial de
sampler que se utiliza para acceder o almacenar texturas bidimensionales desde
un shader.

> 10. ¿Cuál es el propósito del rasterizador en el Pipeline Gráfico?

El rasterizador se encarga de convertir cada primitiva (generada en la etapa de
"vertex post-processing") en un fragmentos, para luego ser enviados al "fragment
shader".[^6]

[^6]: ["Rendering Pipeline Overview" OpenGL Wiki, 2022.](https://www.khronos.org/opengl/wiki/Rendering_Pipeline_Overview)

A fragment is a set of state that is used to compute the final data for a pixel
(or sample if multisampling is enabled) in the output framebuffer. The state for
a fragment includes its position in screen-space, the sample coverage if
multisampling is enabled, and a list of arbitrary data that was output from the
previous vertex or geometry shader.

This last set of data is computed by interpolating between the data values in
the vertices for the fragment. The style of interpolation is defined by the
shader that outputed those values.

> 11. ¿Cuál es la función principal de la GPU en el Pipeline Gráfico?

La GPU se encarga de la mayor parte del pipeline gráfico, ya que procesa desde
el "vertex shader" hasta el renderizado de la imagen en pantalla. La GPU obtiene
los píxeles a procesar en el vertex shader de su propia memoria, la cual es
distinta de la memoria del CPU, es el CPU el que se encarga de enviar los
píxeles a renderizar a la memoria de la GPU.

> 12. ¿Cómo se extrae un valor de una textura en un fragment shader?

Para obtener un valor de una textura en un fragment shader, primero se debe
tener acceso a la misma mediante un `sampler`, como se mencionó previamente,
luego se puede utilizar la función `texture`, la cual obtiene el valor de la
textura para las coordinas pedidas. Como se muestra en el siguiente ejemplo de
"fragment shader":

```glsl
uniform sampler2D myTexture; // Sampler asociado a la textura 2D

void main() {
    vec2 textureCoordinates = vec2(0.5, 0.5);
    vec4 texelColor = texture(myTexture, textureCoordinates);
    gl_FragColor = texelColor;
}
```

> 13. ¿Qué son las variables varying en el contexto de los shaders?

Las variables declaradas de tip `varying` son aquellas que cambian para cada
fragmento. Se utilizan para pasar datos interpolados entre las diferentes etapas
del pipeline gráfico, como el "vertex shader" y el "fragment shader".

A la variable se le asigna un valor en el "vertex shader" y es automáticamente
interpolado a lo largo de la superficie de una primitiva (por ejemplo la
superficie de un triangulo) antes de que llegue al "fragment shader". El valor
puede ser usado por el "fragment shader" pero no cambiado ya que el propósito
de estas variable es que sea interpolado automáticamente

> 14. ¿Qué información se comparte entre el vertex shader y el fragment shader a
>     través de las variables varying? 

> 15. ¿Cómo se realiza la interpolación de valores de los vértices en un
>     fragment shader?



> 16. ¿Qué es la matriz de vista?

> 17. ¿Qué es la matriz de modelado? 

> 18. ¿Qué es la matriz de proyección? 

> 19. ¿Cómo se crea la matriz de transformación de la vista a partir de la
>     posición y orientación de la cámara?

> 20. ¿Cómo se transforman las normales en un vertex shader para mantener su
>     coherencia durante las transformaciones de modelo y vista?

> 21. ¿Cuál es la diferencia entre `gl.LINE_STRIP` y `gl.LINE_LOOP` al dibujar
>     líneas en WebGL?

> 22. ¿Cómo se dibuja una línea entre un par de vértices utilizando el modo
>     `gl.LINES`? De un ejemplo

> 23. ¿Cuál es el propósito de `gl.TRIANGLE_FAN` y cómo difiere de
>     `gl.TRIANGLES`? Ejemplifique

> 24. ¿Qué ocurre cuando se utiliza `gl.TRIANGLE_STRIP` en lugar de
>     `gl.TRIANGLES`? de un ejemplo

> 25. ¿Cuál es el papel del rasterizador en la transformación de primitivas en
>     píxeles?

> 26. ¿Cuál es el papel de los núcleos (cores) en una GPU y cómo se organizan?

> 27. ¿Qué es la memoria de video (VRAM) y cómo se diferencia de la memoria RAM
>     convencional?

> 28. ¿Cómo se gestionan las variables uniforms en un shader y cuál es su
>     propósito?

> 30. ¿Cómo se puede optimizar el rendimiento en WebGL al minimizar el número de
>     llamadas al pipeline gráfico?

> 31. ¿Qué papel desempeña el atributo `gl_Position` en un vertex shader y cómo
>     afecta el resultado final del renderizado?

> 32. ¿Cuál es la diferencia entre el mapeo de texturas en coordenadas UV y
>     coordenadas de proyección en un fragment shader?
