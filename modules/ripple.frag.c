/// modulefn: ripple
/// moduletag: space

uniform float u_ripple_freq; /// { "start": 0, "end": 100, "default": 1 }
uniform float u_ripple_c; /// { "start": 0, "end": "2 * math.pi", "default": 0 }
uniform float u_ripple_strength; /// { "start": -1, "end": 10, "default": 2 }
uniform vec2 u_ripple_center;  /// { "start": [0, 0], "end": [1, 1], "default": [0.5, 0.5], "names": ["x", "y"] }

void ripple() {
    vec2 coords = t_coords.xy / u_dimensions;
    vec2 c = 2. * coords - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);

    float z = u_ripple_strength * abs(cos(r * u_ripple_freq + u_ripple_c)) + 1.;

    c = c - (u_ripple_center - 0.5);
    if (z > 0.)
        c /= z;
    c = c + (u_ripple_center - 0.5);

    c = (c + 1.) / 2.;
    c *= u_tex_dimensions;
    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}
