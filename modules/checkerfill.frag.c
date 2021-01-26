/// modulefn: checkerfill
/// moduletag: space

uniform float u_checkerfill_strength; /// { "start": -1, "end": 10, "default": 2 }
uniform int u_checkerfill_size; /// { "start": 1, "end": 100, "default": 5 }

void checkerfill() {
    vec2 coords = t_coords.xy / u_dimensions;
    vec2 c = 2. * coords - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);

    vec3 lumc = vec3(0.2126, 0.7152, 0.0722);
    float lum = dot(color_out.rgb, lumc);
    float z = u_checkerfill_strength * lum;

    // c = c - (u_ripple_center - 0.5);
    if (z > 0.)
        c /= z;
    // c = c + (u_ripple_center - 0.5);

    c = (c + 1.) / 2.;
    c *= u_tex_dimensions;

    ivec2 ic = ivec2(c);

    int m = 0;
    if ((ic.x / u_checkerfill_size) % 2 == 0)
        m += 1;
    if ((ic.y / u_checkerfill_size) % 2 == 0)
        m += 1;
    m = m % 2;

    color_out = vec4(float(m) * vec3(1.), 1.);
}
