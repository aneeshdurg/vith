/// modulefn: recolor
/// moduletag: color

uniform vec3 u_recolor_new_r; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }
uniform vec3 u_recolor_new_g; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 1, 0], "names": ["r", "g", "b"] }
uniform vec3 u_recolor_new_b; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 0, 1], "names": ["r", "g", "b"] }

void recolor() {
    color_out.xyz =
        color_out.r * u_recolor_new_r +
        color_out.g * u_recolor_new_g +
        color_out.b * u_recolor_new_b;
}
