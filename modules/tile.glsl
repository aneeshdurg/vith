uniform int STAGE_x; /// { "start": 1, "end": 100, "default": 2 }
uniform int STAGE_y; /// { "start": 1, "end": 100, "default": 2 }

vec4 STAGE(vec2 coords) {
    float tile_x_size = u_dimensions.x / float(STAGE_x);
    float tile_y_size = u_dimensions.y / float(STAGE_y);

    coords.x = mod(coords.x, tile_x_size) * float(STAGE_x);
    coords.y = mod(coords.y, tile_y_size) * float(STAGE_y);
    // vec2 c = coords / u_dimensions;

    return INPUT0(coords);
}
