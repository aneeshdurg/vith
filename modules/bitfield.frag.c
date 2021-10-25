/// modulefn: bitfield
/// moduletag: generator

uniform vec3 u_bf_fg_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 1, 1], "names": ["r", "g", "b"] }
uniform vec3 u_bf_bg_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }
uniform vec2 u_bf_offset; /// { "start": [-1, -1], "end": [1, 1], "default": [0, 0], "names": ["x", "y"] }
uniform float u_bf_operator_a; /// { "start": 0, "end": 100, "default": 9 }
uniform float u_bf_operator_b; /// { "start": 0, "end": 100, "default": 4 }
uniform bool u_bf_destructive; /// { "default": false }

void bitfield() {
    // vec2 coords = t_coords.xy;
    // vec2 c = coords / u_dimensions;
    // c = 2. * c - 1.;
    // c *= vec2(u_bf_x_scale, u_bf_y_scale);
    ivec2 ic = ivec2(t_coords.xy + u_bf_offset * u_dimensions);
    vec3 color = u_bf_bg_color;
    float factor = mod(float(ic.x ^ ic.y), u_bf_operator_a) / u_bf_operator_b;
    color = factor * u_bf_fg_color + (1. - factor) * u_bf_bg_color;

    if (u_bf_destructive) {
        color_out.rgb = color;
    } else {
        color_out.rgb += color;
    }
}
