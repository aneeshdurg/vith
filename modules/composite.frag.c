/// modulefn: composite
/// moduletag: channels

uniform sampler2D u_composite_map_1; /// channel
uniform sampler2D u_composite_map_2; /// channel

void composite() {
    vec2 coords = u_tex_dimensions * t_coords.xy / u_dimensions;
    color_out.xyz =
        color_out.rgb * texelFetch(u_composite_map_1, ivec2(coords), 0).rgb +
        (1. - color_out.rgb) * texelFetch(u_composite_map_2, ivec2(coords), 0).rgb;
}
