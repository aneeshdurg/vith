/// modulefn: greyscale
/// moduletag: color

uniform vec3 u_greyscale_luminance; /// { "start": [0,0,0], "end": [1,1,1], "default": [0.2126, 0.7152, 0.0722], "names": ["r", "g", "b"] }

void greyscale() {
    vec2 coords = t_coords.xy;
    vec3 color = u_feedback * texelFetch(u_texture, ivec2(coords), 0).xyz;
    color_out.rgb = vec3(dot(color.rgb, u_greyscale_luminance));
}
