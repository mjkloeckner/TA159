export const vertexShader = `
    precision highp float;

    // Atributos de los vértices
    attribute vec3 position; // Posición del vértice
    attribute vec3 normal;   // Normal del vértice
    attribute vec2 uv;       // Coordenadas de textura

    // Uniforms
    uniform mat4 modelMatrix;       // Matriz de transformación del objeto
    uniform mat4 viewMatrix;        // Matriz de transformación de la cámara
    uniform mat4 projectionMatrix;  // Matriz de proyección de la cámara
    uniform mat4 worldNormalMatrix; // Matriz de normales

    // Varying
    varying vec2  vUv;       // Coordenadas de textura que se pasan al fragment shader
    varying vec3  vNormal;   // Normal del vértice que se pasa al fragment shader
    varying vec3  vWorldPos; // Posición del vértice en el espacio  de mundo

    void main() {
        // Lee la posición del vértice desde los atributos
        vec3 pos = position;

        // Se calcula la posición final del vértice
        // Se aplica la transformación del objeto, la de la cámara y la de proyección
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);

        // Se pasan las coordenadas de textura al fragment shader
        vUv = uv;
        vNormal = normalize(vec3(worldNormalMatrix * vec4(normal, 0.0)));
        vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    }
`;

export const fragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    uniform float scale;
    uniform float terrainAmplitude;
    uniform float terrainAmplitudeBottom;
    uniform float dirtStepWidth;
    uniform float rockStepWidth;

    uniform sampler2D dirtSampler;
    uniform sampler2D rockSampler;
    uniform sampler2D grassSampler;

    float normalize(float inputValue, float minValue, float maxValue) {
        return (inputValue - minValue) / (maxValue - minValue);
    }

    void main(void) {
        vec2 uv = vUv*8.0;
        vec2 uv2 = vUv*scale;

        float verticallity = 1.0-max(0.0,vNormal.y);
        float flatness = 1.0-verticallity;
        float heightFactor = vWorldPos.y - terrainAmplitudeBottom;
        float heightFactorNormalized = normalize(heightFactor, 0.0, terrainAmplitude);

        vec3 grass = texture2D(grassSampler, uv).xyz;
        vec3 dirt  = texture2D(dirtSampler, uv*4.0).xyz;
        vec3 rock  = texture2D(rockSampler, uv).xyz;

        // muestreo de pasto a diferentes escalas, luego se combina con \`mix()\`
        vec3 grass1 = texture2D(grassSampler, uv2*1.00).xyz;
        vec3 grass2 = texture2D(grassSampler, uv2*3.13).xyz;
        vec3 grass3 = texture2D(grassSampler, uv2*2.37).xyz;
        vec3 colorGrass = mix(mix(grass1,grass2,0.5),grass3,0.3);

        // lo mismo para la textura de tierra
        vec3 dirt1 = texture2D(dirtSampler, uv2*3.77).xyz;
        vec3 dirt2 = texture2D(dirtSampler, uv2*1.58).xyz;
        vec3 dirt3 = texture2D(dirtSampler, uv2*1.00).xyz;
        vec3 colorDirt = mix(mix(dirt1, dirt2, 0.5), dirt3, 0.3);

        // lo mismo para la textura de roca
        vec3 rock1 = texture2D(rockSampler,uv2*0.40).xyz;
        vec3 rock2 = texture2D(rockSampler,uv2*2.38).xyz;
        vec3 rock3 = texture2D(rockSampler,uv2*3.08).xyz;
        vec3 colorRock = mix(mix(rock1, rock2, 0.5), rock3,0.5);

        float u = heightFactorNormalized;

        // float pi = 3.141592654;
        // float grassFactor = sin(pi*u);
        // float dirtFactor  = abs(sin(2.0*pi));
        // float rockFactor  = clamp(cos(2.0*pi*u), 0.0, 1.0);

        float width2 = rockStepWidth;
        float rockFactor = 2.00 - smoothstep(0.0, width2, u)
                                - smoothstep(1.0, 1.00 - width2, u);

        float width = dirtStepWidth;
        float s1 = smoothstep(0.00, width, u);
        float s2 = smoothstep(width, width*2.0, u);
        float s3 = smoothstep(0.50, 0.50 + width, u);
        float s4 = smoothstep(0.50 + width, 0.50 + width*2.0, u);
        float dirtFactor = (s1 - s2) + (s3 - s4);

        float grassFactor = smoothstep(0.0, 0.35, u) - smoothstep(0.35, 1.00, u);

        vec3 colorDirtGrass = mix(colorDirt, colorGrass, grassFactor);
        vec3 colorDirtGrassDirt = mix(colorDirtGrass, colorDirt, dirtFactor);
        vec3 color = mix(colorDirtGrassDirt, colorRock, rockFactor);

        gl_FragColor = vec4(color, 1.0);
    }`;
