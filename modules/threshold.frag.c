/// modulefn: threshold

uniform bool u_theshold_high_r; /// { "default": true }
uniform bool u_theshold_high_g; /// { "default": true }
uniform bool u_theshold_high_b; /// { "default": true }
uniform vec3 u_thresholds; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }

void threshold() {
    color_out.rgb = sign(sign(color_out.rgb - u_thresholds) + 1.);
    if (u_theshold_high_r)
        color_out.r = 1. - color_out.r;
    if (u_theshold_high_g)
        color_out.g = 1. - color_out.g;
    if (u_theshold_high_b)
        color_out.b = 1. - color_out.b;
}
