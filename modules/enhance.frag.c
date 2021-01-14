/// modulefn: enhance
/// moduletag: color

uniform vec3 u_enhance; /// { "start": [0, 0, 0], "end": [10, 10, 10], "default": [1, 1, 1], "names": ["r", "g", "b"] }

void enhance() {
    color_out.rgb *= u_enhance;
}
