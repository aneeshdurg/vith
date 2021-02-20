/// modulefn: checkerfill
/// moduletag: space

uniform int u_checkerfill_size; /// { "start": 1, "end": 100, "default": 5 }

void checkerfill() {
    vec2 coords = t_coords.xy / u_dimensions;
    ivec2 ic = ivec2(coords);

    int m = 0;
    if ((ic.x / u_checkerfill_size) % 2 == 0)
        m += 1;
    if ((ic.y / u_checkerfill_size) % 2 == 0)
        m += 1;
    m = m % 2;

    color_out = vec4(float(m) * vec3(1.), 1.);
}
