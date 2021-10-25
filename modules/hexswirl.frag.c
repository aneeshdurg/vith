
/// modulefn: hexswirl
/// moduletag: space

uniform float u_hexswirl_factor; /// { "start": 0, "end": "2 * math.pi", "default": 0 }
uniform float u_hexswirl_size; /// { "start": 0, "end": "100", "default": 5 }

void hexswirl() {
    vec2 hex_coords = get_hex_origin(t_coords.xy, u_hexswirl_size);
    float hex_r = (u_hexswirl_size / 2.)/ cos(5. * PI / 12.);
    vec2 c = (t_coords.xy - hex_coords) / hex_r;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    theta += r * u_hexswirl_factor;
    c = r * vec2(cos(theta), sin(theta));

    c  = (c + 1.) / 2.;

    c *= hex_r;
    c += hex_coords;

    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}
