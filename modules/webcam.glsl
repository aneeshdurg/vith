uniform sampler2D STAGE_src;   /// custom
uniform bool STAGE_invert_x;   ///  { "default": true }
uniform bool STAGE_invert_y;   ///  { "default": true }

vec4 STAGE(vec2 coords) {
  vec2 c = coords / u_dimensions;
  if (STAGE_invert_y)
    c.y = 1. - c.y;
  if (STAGE_invert_x)
    c.x = 1. - c.x;
  c *= vec2(textureSize(STAGE_src, 0));

  return vec4(texelFetch(STAGE_src, ivec2(c), 0).xyz, 1.);
}
