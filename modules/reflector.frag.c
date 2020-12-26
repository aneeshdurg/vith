/// modulefn: reflector
uniform float u_reflect_theta; // between 0 and PI for now
uniform float u_reflect_y;

void reflector() {
    vec2 coords = gl_FragCoord.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;
    c.y -= u_reflect_y;

    vec3 color = vec3(0.);

    if (u_reflect_theta > 0.) {
        float r = length(c);
        float theta = atan(c.y, c.x);

        float pos_theta = theta;
        if (pos_theta < 0.)
            pos_theta = 2. * PI + pos_theta;
        if (pos_theta < u_reflect_theta || pos_theta > (u_reflect_theta + PI)) {
            color = texelFetch(u_texture, ivec2(coords), 0).xyz;
        } else {
            theta = -(theta - u_reflect_theta) + u_reflect_theta;

            c = r * vec2(cos(theta), sin(theta));

            c.y += u_reflect_y;
            c = (c + 1.) / 2.;
            c *= u_dimensions;
            color = texelFetch(u_texture, ivec2(c), 0).xyz;
        }
    }

    color_out = vec4(u_feedback * color, 1.);
}
