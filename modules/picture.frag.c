/// modulefn: picture
uniform sampler2D u_picture_texture; /// custom
uniform vec2 u_picture_dimensions; /// custom

void picture() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;
    c.y = 1. - c.y;
    c *= u_picture_dimensions;

    color_out.xyz += texelFetch(u_picture_texture, ivec2(c), 0).xyz;
}
