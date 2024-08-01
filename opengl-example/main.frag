#version 330 core

// out vec4 fragColor;

uniform float time;

vec3 hsl2rgb(vec3 c) {
	vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
	return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

void main() {
	vec4 rainbow = vec4(hsl2rgb(vec3(time*0.10, 1.0, 0.5)), 1.0);
	gl_FragColor = rainbow;
}
