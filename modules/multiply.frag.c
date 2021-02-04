/// modulefn: multiply
/// moduletag: channels

uniform sampler2D u_multiply_map; /// channel

void multiply() {
    vec2 coords = u_tex_dimensions * t_coords.xy / u_dimensions;
    color_out.xyz *= texelFetch(u_multiply_map, ivec2(coords), 0).rgb;
}
