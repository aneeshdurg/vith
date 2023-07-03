uniform float STAGE_angle; /// { "start": 0, "end": "2 * math.pi", "default": 0 }

vec4 STAGE(vec2 coords) {
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    theta += STAGE_angle;
    c = r * vec2(cos(theta), sin(theta));

    c  = (c + 1.) / 2.;
    c *= u_dimensions;

    return vec4(INPUT0(c).rgb, 1.);
}
