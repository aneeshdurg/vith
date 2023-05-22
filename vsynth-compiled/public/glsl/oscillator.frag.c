uniform vec2 STAGE_osc_f; /// { "start": [0, 0], "end": [1, 1], "default": [0.25, 0], "names": ["x", "y"] }
uniform float STAGE_osc_c; /// { "start": 0, "end": "2 * math.pi", "default": 0 }
uniform vec3 STAGE_osc_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }

vec4 STAGE(vec2 coords) {
    vec4 res = vec4(0.);
    res.xyz += sin(dot(STAGE_osc_f, coords) + STAGE_osc_c) * STAGE_osc_color;
    res.a = 1.;
    return res;
}
