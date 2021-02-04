/// modulefn: condzoom
/// moduletag: channels

uniform float u_condzoom_strength; /// { "start": -1, "end": 10, "default": 2 }
uniform sampler2D u_condzoom_map; /// channel

void condzoom() {
    vec2 coords = t_coords.xy / u_dimensions;
    vec2 c = 2. * coords - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);

    vec3 lumc = vec3(0.2126, 0.7152, 0.0722);
    float lum = dot(color_out.rgb, lumc);
    float z = u_condzoom_strength * lum;

    if (z > 0.)
        c /= z;

    c = (c + 1.) / 2.;
    c *= u_tex_dimensions;

    ivec2 ic = ivec2(c);

    color_out.xyz = texelFetch(u_condzoom_map, ic, 0).rgb;
}
