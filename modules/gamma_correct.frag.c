/// modulefn: gamma_correct
/// moduletag: color

uniform float u_gamma_correction; /// { "start": 2, "end": 4, "default": 2 }

void gamma_correct() {
    float r = pow(color_out.r, 1. / u_gamma_correction);
    float g = pow(color_out.g, 1. / u_gamma_correction);
    float b = pow(color_out.b, 1. / u_gamma_correction);
    color_out.xyz = vec3(r, g, b);
}
