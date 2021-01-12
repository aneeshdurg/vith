/// modulefn: reflector
uniform float u_reflect_theta; /// { "start": 0, "end": "2 * math.pi", "default": "math.pi / 2" }
uniform float u_reflect_y; /// { "start": -1, "end": 1, "default": 0 }
uniform float u_reflect_x; /// { "start": -1, "end": 1, "default": 0 }

void reflector() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;
    c.y -= u_reflect_y;
    c.x -= u_reflect_x;

    float r = length(c);
    float theta = atan(c.y, c.x);
    float pos_theta = theta;
    if (pos_theta < 0.)
        pos_theta = 2. * PI + pos_theta;

    vec3 color = vec3(0.);

    if (pos_theta > (u_reflect_theta - PI) &&
            (pos_theta < u_reflect_theta ||
             pos_theta > (u_reflect_theta + PI))) {
        color = texelFetch(u_texture, ivec2(coords), 0).xyz;
    } else {
        theta = -(theta - u_reflect_theta) + u_reflect_theta;

        c = r * vec2(cos(theta), sin(theta));

        c.y += u_reflect_y;
        c.x += u_reflect_x;
        c = (c + 1.) / 2.;
        c *= u_dimensions;
        color = texelFetch(u_texture, ivec2(c), 0).xyz;
    }

    color_out = vec4(u_feedback * color, 1.);
}
