/// modulefn: blur
/// moduletag: space

uniform int u_blur_stride_x; /// { "start": 1, "end": 100, "default": 1 }
uniform int u_blur_stride_y; /// { "start": 1, "end": 100, "default": 1 }

void blur() {
    ivec2 c = ivec2(t_coords.xy);
    vec3 color = vec3(0);
    float size = float(u_blur_stride_y * u_blur_stride_x * 4);
    for (int y = -u_blur_stride_y + 1; y < u_blur_stride_y; y++) {
        for (int x = -u_blur_stride_x + 1; x < u_blur_stride_x; x++) {
            color += texelFetch(u_texture, c + ivec2(x, y), 0).xyz / size ;
        }
    }
    color_out = vec4(u_feedback * color, 1.);
}
