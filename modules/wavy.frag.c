/// modulefn: wavy
/// moduletag: space

uniform float u_wavy_freq_x; /// { "start": 0, "end": 100, "default": 1 }
uniform float u_wavy_c_x; /// { "start": 0, "end": "2 * math.pi", "default": 0 }
uniform float u_wavy_strength_x; /// { "start": 0, "end": 100, "default": 1 }

uniform float u_wavy_freq_y; /// { "start": 0, "end": 100, "default": 1 }
uniform float u_wavy_c_y; /// { "start": 0, "end": "2 * math.pi", "default": 0 }
uniform float u_wavy_strength_y; /// { "start": 0, "end": 100, "default": 1 }


void wavy() {
    vec2 coords = gl_FragCoord.xy / u_dimensions;
    vec2 c = 2. * coords - 1.;

    float x_mod =
        u_wavy_strength_x * sin(u_wavy_freq_x * c.y + u_wavy_c_x);
    float y_mod =
        u_wavy_strength_y * sin(u_wavy_freq_y * c.x + u_wavy_c_y);

    c = (c + 1.) / 2.;
    c *= u_dimensions;

    c.x = mod(c.x + x_mod, u_dimensions.x);
    c.y = mod(c.y + y_mod, u_dimensions.y);

    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}
