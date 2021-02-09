/// modulefn: chromakey
/// moduletag: channels

uniform vec3 u_chromakey_key; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 1, 0], "names": ["r", "g", "b"] }
uniform float u_chromakey_strength; /// { "start": 0, "end": 2, "default": 0.25 }
uniform sampler2D u_chromakey_map; /// channel

void chromakey() {
    vec2 coords = u_tex_dimensions * t_coords.xy / u_dimensions;
    if (length(color_out.rgb - u_chromakey_key) <= u_chromakey_strength)
        color_out.xyz = texelFetch(u_chromakey_map, ivec2(coords), 0).rgb;
}
