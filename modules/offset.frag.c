/// modulefn: offset
/// moduletag: color

uniform vec3 u_offsets_x; /// { "start": [-1, -1, -1], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }
uniform vec3 u_offsets_y; /// { "start": [-1, -1, -1], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }

vec2 offset_fix_range(vec2 c) {
    vec2 res = c;
    if (res.x > 1.)
        res.x = res.x - 1.;
    if (res.x < 0.)
        res.x = 1. + res.x;

    if (res.y > 1.)
        res.y = res.y - 1.;
    if (res.y < 0.)
        res.y = 1. + res.y;

    return res;
}

void offset() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;

    vec2 c_r = c + vec2(u_offsets_x.r, u_offsets_y.r);
    c_r = offset_fix_range(c_r);
    vec2 c_g = c + vec2(u_offsets_x.g, u_offsets_y.g);
    c_g = offset_fix_range(c_g);
    vec2 c_b = c + vec2(u_offsets_x.b, u_offsets_y.b);
    c_b = offset_fix_range(c_b);

    color_out.r = texelFetch(u_texture, ivec2(c_r * u_tex_dimensions), 0).r;
    color_out.g = texelFetch(u_texture, ivec2(c_g * u_tex_dimensions), 0).g;
    color_out.b = texelFetch(u_texture, ivec2(c_b * u_tex_dimensions), 0).b;
    color_out *= u_feedback;
    color_out.a = 1.;
}
