uniform float STAGE_x;
uniform float STAGE_y;
uniform vec2 STAGE_center;

vec4 STAGE(vec2 coords) {
    coords = coords / u_dimensions;

    coords = coords - STAGE_center;
    if (STAGE_x > 0.)
      coords.x /= STAGE_x;
    if (STAGE_y > 0.)
      coords.y /= STAGE_y;
    coords += STAGE_center;

    vec2 c = coords * u_tex_dimensions;
    return vec4(INPUT(c).xyz, 1.);
}
