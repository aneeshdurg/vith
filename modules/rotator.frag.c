/// modulefn: rotate
uniform float u_rotation; /// { "start": 0, "end": "2 * math.pi", "default": 0 }

void rotate() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    theta += u_rotation;
    c = r * vec2(cos(theta), sin(theta));

    c  = (c + 1.) / 2.;
    c *= u_tex_dimensions;

    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}
