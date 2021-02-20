/// modulefn: radial
/// moduletag: color

uniform float u_radial_strength; /// { "start": 0, "end": 10, "default": -1 }
uniform vec2 u_radial_center;  /// { "start": [0, 0], "end": [1, 1], "default": [0.5, 0.5], "names": ["x", "y"] }

void radial() {
    vec2 coords = t_coords.xy / u_dimensions;

    float r = length(coords - u_radial_center);
    float f = 1. - pow(r, u_radial_strength);

    color_out.rgb *= f;
}
