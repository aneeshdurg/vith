uniform float STAGE_x; /// {"start": 0, "end": 100, "default": 1}
uniform float STAGE_y; /// {"start": 0, "end": 100, "default": 1}
uniform vec2 STAGE_center; /// {"start": [0, 0], "end": [1, 1], "default": [0.5, 0.5], "names": ["x", "y"]}

vec4 STAGE(vec2 coords) {
    coords = coords / u_dimensions;

    coords = coords - STAGE_center;
    if (STAGE_x > 0.)
      coords.x /= STAGE_x;
    if (STAGE_y > 0.)
      coords.y /= STAGE_y;
    coords += STAGE_center;

    vec2 c = coords * u_tex_dimensions;
    return vec4(INPUT0(c).xyz, 1.);
}
