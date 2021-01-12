/// modulefn: zoom
/// moduletag: space

uniform float u_zoom; /// { "start": 0, "end": 10, "default": 1 }
uniform vec2 u_zoom_center;  /// { "start": [0, 0], "end": [1, 1], "default": [0.5, 0.5], "names": ["x", "y"] }

void zoom() {
    vec2 coords = t_coords.xy / u_dimensions;

    coords = coords - u_zoom_center;
    if (u_zoom > 0.)
        coords /= u_zoom;
    coords += u_zoom_center;

    vec2 c = coords * u_tex_dimensions;
    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}
