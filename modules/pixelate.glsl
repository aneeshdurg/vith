uniform int STAGE_factor; /// { "start": 0, "end": 500, "default": 10 }

vec4 STAGE(vec2 coords) {
    float f = float(STAGE_factor);
    coords = floor(coords / f) * f;
    vec3 color = vec3(0);
    float samples = 4.;
    color += INPUT0(coords + vec2(0, 0)).xyz / samples;
    color += INPUT0(coords + vec2(0, STAGE_factor)).xyz / samples;
    color += INPUT0(coords + vec2(STAGE_factor, 0)).xyz / samples;
    color += INPUT0(coords + vec2(STAGE_factor, STAGE_factor)).xyz / samples;
    return vec4(color, 1.);
}
