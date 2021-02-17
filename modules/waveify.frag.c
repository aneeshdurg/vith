/// modulefn: waveify
/// moduletag: color

uniform vec3 u_waveify_a; /// {"start": [0, 0, 0], "end": [10, 10, 10], "default": [1, 1, 1], "names": ["r", "g", "b"]}
uniform vec3 u_waveify_f; /// {"start": [0, 0, 0], "end": [1000, 1000, 1000], "default": [100, 100, 100], "names": ["r", "g", "b"]}
uniform vec3 u_waveify_c; /// {"start": [0, 0, 0], "end": ["2 * math.pi", "2 * math.pi", "2 * math.pi"], "default": [0, 0, 0], "names": ["r", "g", "b"]}

void waveify() {
    color_out.xyz *=
        u_waveify_a * sin(color_out.xyz * u_waveify_f + u_waveify_c);
}
