uniform vec3 STAGE_offsets_x; /// { "start": [-1, -1, -1], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }
uniform vec3 STAGE_offsets_y; /// { "start": [-1, -1, -1], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }

vec2 STAGE_offset_fix_range(vec2 c) {
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

vec4 STAGE(vec2 coords) {
    vec2 c = coords / u_dimensions;

    vec2 c_r = c + vec2(STAGE_offsets_x.r, STAGE_offsets_y.r);
    c_r = STAGE_offset_fix_range(c_r);
    vec2 c_g = c + vec2(STAGE_offsets_x.g, STAGE_offsets_y.g);
    c_g = STAGE_offset_fix_range(c_g);
    vec2 c_b = c + vec2(STAGE_offsets_x.b, STAGE_offsets_y.b);
    c_b = STAGE_offset_fix_range(c_b);

    vec4 color;
    color.r = INPUT0(c_r * u_tex_dimensions).r;
    color.g = INPUT0(c_g * u_tex_dimensions).g;
    color.b = INPUT0(c_b * u_tex_dimensions).b;
    color.a = 1.;
    return color;
}
