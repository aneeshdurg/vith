uniform float STAGE_strength; /// { "start": 0, "end": 2, "default": 1 }

vec4 STAGE(vec2 coords) {
    return STAGE_strength * INPUT0(coords);
}
