uniform vec2 STAGE_osc_f;
uniform float STAGE_osc_c;
uniform vec3 STAGE_osc_color;

vec4 STAGE(vec2 coords) {
    vec4 res = vec4(0.);
    res.xyz += sin(dot(STAGE_osc_f, coords) + STAGE_osc_c) * STAGE_osc_color;
    res.a = 1.;
    return res;
}
