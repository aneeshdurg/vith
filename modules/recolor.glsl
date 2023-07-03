uniform vec3 STAGE_new_r; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }
uniform vec3 STAGE_new_g; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 1, 0], "names": ["r", "g", "b"] }
uniform vec3 STAGE_new_b; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 0, 1], "names": ["r", "g", "b"] }

vec4 STAGE(vec2 coords) {
    vec3 color = INPUT0(coords).rgb;
    return vec4(
        color.r * STAGE_new_r +
        color.g * STAGE_new_g +
        color.b * STAGE_new_b, 1.);
}
