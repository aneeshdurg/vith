/// modulefn: halftone
/// moduletag: space

uniform int u_halftone_factor; /// { "start": 0, "end": 500, "default": 10 }
uniform bool u_halftone_invert; /// { "default": false }
uniform float u_halftone_strength; /// { "start": 0, "end": 2, "default": 1 }

void halftone() {
    vec2 coords = t_coords.xy;
    float f = float(u_halftone_factor);
    vec2 f_coords = floor(coords / f) * f + f / 2.;
    vec3 color = texelFetch(u_texture, ivec2(f_coords), 0).xyz;
    vec3 lumc = vec3(0.2126, 0.7152, 0.0722);
    float lum = dot(color.rgb, lumc);
    float intensity = length(coords - f_coords) / (sqrt(2.) * f / 2.);
    if (intensity < u_halftone_strength * lum)
        intensity = 1.;
    else
        intensity = 0.;
    if (u_halftone_invert)
        intensity = 1. - intensity;
    color *= intensity;

    color_out = vec4(u_feedback * color, 1.);
}
