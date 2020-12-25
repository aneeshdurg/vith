/// modulefn: zoom
uniform float u_zoom;
uniform vec2 u_zoom_center;

void zoom() {
    vec2 coords = gl_FragCoord.xy / u_dimensions;

    coords = coords - u_zoom_center;
    coords /= u_zoom;
    coords += u_zoom_center;

    vec2 c = coords * u_tex_dimensions;
    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}
