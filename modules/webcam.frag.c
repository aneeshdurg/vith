/// modulefn: webcam
uniform sampler2D u_webcam_texture; /// custom
uniform vec2 u_webcam_dimensions; /// custom
uniform bool u_webcam_invert_x; ///  { "default": true }
uniform bool u_webcam_invert_y; ///  { "default": true }

void webcam() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;
    if (u_webcam_invert_y)
        c.y = 1. - c.y;
    if (u_webcam_invert_x)
        c.x = 1. - c.x;
    c *= u_webcam_dimensions;

    color_out.xyz += texelFetch(u_webcam_texture, ivec2(c), 0).xyz;
}
