uniform int STAGE_stride_x; /// { "start": 1, "end": 100, "default": 1 }
uniform int STAGE_stride_y; /// { "start": 1, "end": 100, "default": 1 }

vec4 STAGE(vec2 coords) {
    vec3 color = vec3(0);
    float size = float(STAGE_stride_y * STAGE_stride_x * 4);
    for (int y = -STAGE_stride_y + 1; y < STAGE_stride_y; y++) {
        for (int x = -STAGE_stride_x + 1; x < STAGE_stride_x; x++) {
            color += INPUT0(coords + vec2(x, y)).xyz / size ;
        }
    }
    return vec4(color, 1.);
}
