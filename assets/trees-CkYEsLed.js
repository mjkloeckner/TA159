import{S as G,W as D,P as _,O as j,A as H,H as C,D as I,t as R,a as A,T as U,R as W,L as E,z as q,J as B,b as F,c as J,v as N,C as O,m as V,I as P,M,l as k,h as d,V as X}from"./OrbitControls-CgjfdclN.js";import{t as $,r as K,p as Q}from"./pasto-JkRKC7jR.js";const Y=`
    precision highp float;

    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 modelMatrix;      // Matriz de transformación del objeto
    uniform mat4 viewMatrix;       // Matriz de transformación de la cámara
    uniform mat4 projectionMatrix; // Matriz de proyección de la cámara

    varying vec2 vUv;

    void main() {
        vec3 pos = position;
        gl_Position = projectionMatrix*viewMatrix*modelMatrix* vec4(pos, 1.0);
        vUv = uv;
    }`,Z=`
    precision mediump float;

    uniform float scale1;
    uniform float mask1low;
    uniform float mask1high;
    uniform float mask2low;
    uniform float mask2high;
    uniform sampler2D tierraSampler;
    uniform sampler2D rocaSampler;
    uniform sampler2D pastoSampler;

    varying vec2 vUv;

    // Perlin Noise
    vec3 mod289(vec3 x){
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x){
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x){
        return mod289(((x * 34.0) + 1.0) * x);
    }

    vec4 taylorInvSqrt(vec4 r){
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec3 fade(vec3 t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    // Classic Perlin noise
    float cnoise(vec3 P){
        vec3 Pi0 = floor(P);
        vec3 Pi1 = Pi0 + vec3(1.0);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
        vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
        vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
        vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
        vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
        vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
        vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
        vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000),
                                    dot(g010, g010),
                                    dot(g100, g100),
                                    dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001),
                                    dot(g011, g011),
                                    dot(g101, g101),
                                    dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110),
                        vec4(n001, n101, n011, n111),
                        fade_xyz.z);

        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
    }

    void main(void) {
        vec2 uv2=vUv*scale1;

        // se mezcla la textura 'pasto' a diferentes escalas
        vec3 pasto1 = texture2D(pastoSampler, uv2 * 1.0).xyz;
        vec3 pasto2 = texture2D(pastoSampler, uv2 * 3.13).xyz;
        vec3 pasto3 = texture2D(pastoSampler, uv2 * 2.37).xyz;
        vec3 colorPasto = mix(mix(pasto1, pasto2, 0.5), pasto3, 0.3);

        // lo mismo para la textura 'tierra'
        vec3 tierra1 = texture2D(tierraSampler, uv2*3.77).xyz;
        vec3 tierra2 = texture2D(tierraSampler, uv2*1.58).xyz;
        vec3 colorTierra = mix(tierra1, tierra2, 0.5);

        // lo mismo para la textura 'roca'
        vec3 roca1 = texture2D(rocaSampler, uv2).xyz;
        vec3 roca2 = texture2D(rocaSampler, uv2*2.38).xyz;
        vec3 colorRoca = mix(roca1, roca2, 0.5);

        float noise1 = cnoise(uv2.xyx*8.23+23.11);
        float noise2 = cnoise(uv2.xyx*11.77+9.45);
        float noise3 = cnoise(uv2.xyx*14.8+21.2);
        float mask1 = mix(mix(noise1, noise2, 0.5), noise3, 0.3);
        mask1 = smoothstep(mask1low, mask1high, mask1);

        float noise4 = cnoise(uv2.xyx*8.23*scale1);
        float noise5 = cnoise(uv2.xyx*11.77*scale1);
        float noise6 = cnoise(uv2.xyx*14.8*scale1);
        float mask2 = mix(mix(noise4, noise5, 0.5), noise6, 0.3);
        mask2 = smoothstep(mask2low, mask2high, mask2);
        vec3 colorTierraRoca = mix(colorTierra, colorRoca, mask1);
        vec3 color = mix(colorPasto, colorTierraRoca, mask2);

        gl_FragColor = vec4(color, 1.0);
    }`;let t,n,i,s,r;const c={tierra:{url:$,object:null},roca:{url:K,object:null},pasto:{url:Q,object:null}};function S(){n.aspect=s.offsetWidth/s.offsetHeight,n.updateProjectionMatrix(),i.setSize(s.offsetWidth,s.offsetHeight)}function ee(){t=new G,s=document.getElementById("mainContainer"),i=new D,i.setClearColor(6316128),s.appendChild(i.domElement),n=new _(35,window.innerWidth/window.innerHeight,.1,1e3),n.position.set(-50,60,50),n.lookAt(0,0,0),new j(n,i.domElement);const e=new H(16777215);t.add(e);const a=new C(16777215,0,.25);t.add(a);const o=new I(16777215,1);o.position.set(100,100,100),t.add(o),new R(o,5);const l=new A(5);t.add(l),window.addEventListener("resize",S),S()}function ae(e){console.log("Generating `"+e+"` instances of tree");let a=4;const o=new O(.3,.3,a,40,40),l=new V(1.75,40,40);o.translate(0,a/2,0);const m=new P;m.copy(o);const v=new P;v.copy(l);const b=new M({color:8142592}),p=new k(m,b,e),T=new M({color:3561513}),z=new k(v,T,e);new d;const g=new d,x=new d,u=new d,w=50-4/2;for(let f=0;f<e;f++){let y=new X((Math.random()-.5)*w,0,(Math.random()-.5)*w);g.makeTranslation(y),x.identity(),u.identity();let h=.5+Math.random()*(a/3);x.makeScale(1,h,1),x.premultiply(g),y.y=h*a,g.makeTranslation(y),u.premultiply(g),p.setMatrixAt(f,x),z.setMatrixAt(f,u)}t.add(p),t.add(z)}function oe(){console.log("Building scene"),console.log("Generating terrain");const e=new q(50,50);r=new B({uniforms:{tierraSampler:{type:"t",value:c.tierra.object},rocaSampler:{type:"t",value:c.roca.object},pastoSampler:{type:"t",value:c.pasto.object},scale1:{type:"f",value:2},mask1low:{type:"f",value:-.38},mask1high:{type:"f",value:.1},mask2low:{type:"f",value:.05},mask2high:{type:"f",value:-.7}},vertexShader:Y,fragmentShader:Z,side:F}),r.needsUpdate=!0;const a=new J(e,r);a.rotateX(Math.PI/2),a.position.set(0,0,0),t.add(a),console.log("Generating trees"),ae(35)}function te(e,a){a.wrapS=a.wrapT=W,c[e].object=a,console.log("Texture `"+e+"` loaded")}function re(e){const a=new E;a.onLoad=()=>{console.log("All textures loaded"),e()};for(const o in c){console.log("Loading textures");const l=new U(a),m=c[o];m.object=l.load(m.url,te.bind(this,o),null,v=>{console.error(v)})}}function ne(){const e=new N({width:400});e.add(r.uniforms.scale1,"value",0,10).name("Texture scale"),e.add(r.uniforms.mask1low,"value",-1,1).name("Mask1 Low"),e.add(r.uniforms.mask1high,"value",-1,1).name("Mask1 High"),e.add(r.uniforms.mask2low,"value",-1,1).name("Mask2 Low"),e.add(r.uniforms.mask2high,"value",-1,1).name("Mask2 High")}function L(){requestAnimationFrame(L),i.render(t,n)}function ie(){oe(),ne(),L()}ee();re(ie);
