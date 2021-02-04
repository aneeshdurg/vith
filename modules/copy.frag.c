/// modulefn: copy
/// moduletag: channels

uniform sampler2D u_copy_map; /// channel

void copy() {
    vec2 coords = u_tex_dimensions * t_coords.xy / u_dimensions;
    color_out.xyz += texelFetch(u_copy_map, ivec2(coords), 0).rgb;
}
