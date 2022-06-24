/// modulefn: circle_packing
/// moduletag: color

#define OPCODE_SELECT_CIRCLES 1
#define OPCODE_RENDER 2

uniform float u_cp_radius_factor; /// { "start": 1, "end": 10, "default": 5 }
// make sel thresh a fn of radius?
uniform float u_cp_selection_threshold; /// { "start": 0, "end": 1, "default": 0.25 }
uniform int u_cp_max_radius; /// { "start": 1, "end": 100, "default": 8 }

uniform sampler2D u_cp_data_texture; /// none
uniform int u_cp_opcode; /// none

vec4 circle_packing_getImgPx(vec2 coords_) {
  // vec2 coords = vec2(coords_);
  // coords *= vec2(u_cp_in_dimensions) / vec2(u_dimensions);
  // coords.x = float(u_cp_in_dimensions.x) - coords.x;
  return texelFetch(u_texture, ivec2(coords_), 0);
}

float circle_packing_getRadius(vec2 coords_) {
  vec4 color = circle_packing_getImgPx(coords_);
  float gray_value = 0.3 * color.r + 0.59 * color.g + 0.11 * color.b;
  float radius = ceil(exp(gray_value * u_cp_radius_factor) /
                      exp(u_cp_radius_factor) * float(u_cp_max_radius));
  return radius + 1.0;
}

void circle_packing() {
  vec2 coords = gl_FragCoord.xy;
  switch (u_cp_opcode) {
  case OPCODE_SELECT_CIRCLES: {
    ivec2 icoords = ivec2(coords);

    vec4 random_state_local = texelFetch(u_cp_data_texture, icoords, 0);
    float radius_local = circle_packing_getRadius(coords);

    bool circle_is_active = random_state_local.a > u_cp_selection_threshold;
    if (circle_is_active) {
      // find if there are higher priority circles we belong to
      for (int ix = -1 * 2 * u_cp_max_radius; ix <= 2 * u_cp_max_radius; ix++) {
        for (int iy = -1 * 2 * u_cp_max_radius; iy <= 2 * u_cp_max_radius;
             iy++) {
          ivec2 pcoords = icoords + ivec2(ix, iy);
          vec4 random_state_remote =
              texelFetch(u_cp_data_texture, pcoords, 0);
          if (ix == 0 && iy == 0) {
            continue;
          }
          if (random_state_remote.a > u_cp_selection_threshold) {
            float radius = circle_packing_getRadius(vec2(pcoords));
            float dist = length(vec2(ix, iy));
            if (dist < (radius + radius_local)) {
              if (random_state_remote.a > random_state_local.a) {
                circle_is_active = false;
                break;
              }
            }
          }
        }
        if (!circle_is_active) {
          break;
        }
      }
    }

    color_out.r = radius_local;
    color_out.g = circle_is_active ? 1.0 : 0.0;
    color_out.a = 1.0;
    break;
  }
  case OPCODE_RENDER: {
    ivec2 icoords = ivec2(t_coords.x, t_coords.y);//float(u_dimensions.y) - t_coords.y);

    bool found = false;
    for (int ix = -1 * u_cp_max_radius; ix <= u_cp_max_radius; ix++) {
      for (int iy = -1 * u_cp_max_radius; iy <= u_cp_max_radius; iy++) {
        ivec2 pcoords = icoords + ivec2(ix, iy);
        vec4 selection_state = texelFetch(u_cp_data_texture, pcoords, 0);
        float dist = length(vec2(ix, iy));
        float radius = circle_packing_getRadius(vec2(pcoords));
        if (selection_state.g > 0.0 && dist <= (selection_state.r + 0.5)) {
          if (abs(dist - selection_state.r) <= 1.5) {
            vec4 color = circle_packing_getImgPx(vec2(pcoords));
            color_out.rgb = color.rgb - vec3(0.05, 0.05, 0.05);
            found = true;
          }
          break;
        }
      }
      if (found) {
        break;
      }
    }

    if (!found) {
      color_out.r = 1.;
      color_out.g = 1.;
      color_out.b = 1.;
    }
    color_out.a = 1.0;
    break;
  }
  default: {
    break;
  }
  }
}
