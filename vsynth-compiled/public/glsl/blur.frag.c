uniform int STAGE_blur_stride_x;
uniform int STAGE_blur_stride_y;

vec4 STAGE(vec2 coords) {
    vec3 color = vec3(0);
    float size = float(STAGE_blur_stride_y * STAGE_blur_stride_x * 4);
    for (int y = -STAGE_blur_stride_y + 1; y < STAGE_blur_stride_y; y++) {
        for (int x = -STAGE_blur_stride_x + 1; x < STAGE_blur_stride_x; x++) {
            color += INPUT(coords + vec2(x, y)).xyz / size ;
        }
    }
    return vec4(color, 1.);
}
