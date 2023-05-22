uniform float STAGE_reflect_theta;
uniform float STAGE_reflect_y;
uniform float STAGE_reflect_x;

vec4 STAGE(vec2 coords) {
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;
    c.y -= STAGE_reflect_y;
    c.x -= STAGE_reflect_x;

    float r = length(c);
    float theta = atan(c.y, c.x);
    float pos_theta = theta;
    if (pos_theta < 0.)
        pos_theta = 2. * PI + pos_theta;

    vec3 color = vec3(0.);

    if (pos_theta > (STAGE_reflect_theta - PI) &&
            (pos_theta < STAGE_reflect_theta ||
             pos_theta > (STAGE_reflect_theta + PI))) {
        color = INPUT(coords).xyz;
    } else {
        theta = -(theta - STAGE_reflect_theta) + STAGE_reflect_theta;

        c = r * vec2(cos(theta), sin(theta));

        c.y += STAGE_reflect_y;
        c.x += STAGE_reflect_x;
        c = (c + 1.) / 2.;
        c *= u_dimensions;
        color = INPUT(c).xyz;
    }

    return vec4(color, 1.);
}
