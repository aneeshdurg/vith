/// modulefn: oscillator

// sin(dot(f, x) + c) * color
uniform vec2 u_osc_f;
uniform float u_osc_c;
uniform vec3 u_osc_color;

void oscillator() {
    vec2 coords = gl_FragCoord.xy;
    color_out.xyz += sin(dot(u_osc_f, coords) + u_osc_c) * u_osc_color;
    color_out.a = 1.;
}
