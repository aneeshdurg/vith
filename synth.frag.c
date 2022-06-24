#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

#define PI 3.1415926538
#define GOLDEN_RATIO 1.6180339887

#define FN_RENDER 0

uniform vec2 u_dimensions;
uniform vec2 u_tex_dimensions;
uniform sampler2D u_texture;
uniform float u_transform_scale;
uniform vec2 u_transform_center;
uniform float u_transform_rotation;
uniform int u_function;

uniform float u_feedback;
uniform bool u_constrain_to_transform;

uniform bool u_no_clamp;

out vec4 color_out;

vec3 hsv_to_rgb(vec3 hsv) {
  float h = hsv.r;
  while (h > 360.)
    h -= 360.;

  float s = hsv.g;
  float v = hsv.b;

  float c = v * s;
  float x = c * float(1 - abs(int(h / 60.) % 2 - 1));
  float m = v - c;

  vec3 rgb = vec3(0.);
  if (h < 60.)
    rgb = vec3(c, x, 0.);
  else if (h < 120.)
    rgb = vec3(x, c, 0.);
  else if (h < 180.)
    rgb = vec3(0., c, x);
  else if (h < 240.)
    rgb = vec3(0., x, c);
  else if (h < 300.)
    rgb = vec3(x, 0., c);
  else
    rgb = vec3(c, 0., x);

  rgb += m;
  return rgb;
}

vec3 rgb_to_hsv(vec3 rgb) {
  float c_max = max(max(rgb.r, rgb.g), rgb.b);
  float c_min = min(min(rgb.r, rgb.g), rgb.b);
  float delta = c_max - c_min;
  float h = 0.;
  if (delta == 0.)
    h = 0.;
  else if (c_max == rgb.r)
    h = 60. * float(int((rgb.g - rgb.b) / delta) % 6);
  else if (c_max == rgb.g)
    h = 60. * (((rgb.b - rgb.r) / delta) + 2.);
  else if (c_max == rgb.b)
    h = 60. * (((rgb.r - rgb.g) / delta) + 4.);

  float s = 0.;
  if (c_max != 0.)
    s = delta / c_max;
  float v = c_max;

  return vec3(h, s, v);
}

float isGEq(float a, float b) { return sign(sign(a - b) + 1.0); }

vec2 get_hex_origin(vec2 coords, float hex_size) {
  float n = max(hex_size, 0.01);
  float halfn = n / 2.0;

  float sqrt3 = 1.732;

  float W = sqrt3 * n;
  float halfW = W / 2.0;

  float H = 3.0 * halfn;

  float xidx = floor(coords.x / W);
  float yidx = floor(coords.y / H);

  // Get top left corner of bounding square
  vec2 o = vec2(W * xidx, H * yidx);

  // transform coordinates to make square begin at origin
  vec2 t = coords - o;

  // Hexagon targets in transformed space
  vec2 vertA = vec2(0.0, 0.0);
  vec2 vertB = vec2(W, 0.0);
  vec2 vertC = vec2(halfW, H);

  vec2 vertInvalid = vec2(-1.0, 0.0);

  // pattern alternates every other row
  if (mod(yidx, 2.0) != 0.0) {
    t.y = H - t.y;
  }

  float xLeHalfW = isGEq(halfW, t.x);
  float yLehalfN = isGEq(halfn, t.y);
  float yGeN = isGEq(t.y, n);

  float yt = t.y - halfn;
  float xt = (t.x - halfW) / sqrt3;
  float xnt = (halfW - t.x) / sqrt3;

  float xntGeYt = isGEq(xnt, yt);
  float xtGeYt = isGEq(xt, yt);

  vec2 hex = yLehalfN * (xLeHalfW * vertA + (1.0 - xLeHalfW) * vertB) +
             yGeN * vertC +
             (1.0 - yLehalfN) * (1.0 - yGeN) *
                 (xLeHalfW * (xntGeYt * vertA + (1.0 - xntGeYt) * vertC) +
                  (1.0 - xLeHalfW) * (xtGeYt * vertB + (1.0 - xtGeYt) * vertC));

  if (mod(yidx, 2.0) != 0.0) {
    hex.y = H - hex.y;
  }

  hex += o;

  return hex;
}

vec2 t_coords;

#include "modules/bitfield.frag.c"
#include "modules/blur.frag.c"
#include "modules/checkerfill.frag.c"
#include "modules/chromakey.frag.c"
#include "modules/circlepacking.frag.c"
#include "modules/composite.frag.c"
#include "modules/condzoom.frag.c"
#include "modules/copy.frag.c"
#include "modules/enhance.frag.c"
#include "modules/fourierdraw.frag.c"
#include "modules/gamma_correct.frag.c"
#include "modules/greyscale.frag.c"
#include "modules/halftone.frag.c"
#include "modules/hexswirl.frag.c"
#include "modules/hue_shift.frag.c"
#include "modules/invert_color.frag.c"
#include "modules/invert_phase.frag.c"
#include "modules/multiply.frag.c"
#include "modules/noise.frag.c"
#include "modules/offset.frag.c"
#include "modules/oscillator.frag.c"
#include "modules/picture.frag.c"
#include "modules/pixelate.frag.c"
#include "modules/polygon.frag.c"
#include "modules/radial.frag.c"
#include "modules/recolor.frag.c"
#include "modules/reduce_colors.frag.c"
#include "modules/reflector.frag.c"
#include "modules/ripple.frag.c"
#include "modules/rotator.frag.c"
#include "modules/superformula.frag.c"
#include "modules/swirl.frag.c"
#include "modules/threshold.frag.c"
#include "modules/tile.frag.c"
#include "modules/voronoi.frag.c"
#include "modules/voronoiswirl.frag.c"
#include "modules/waveify.frag.c"
#include "modules/wavy.frag.c"
#include "modules/webcam.frag.c"
#include "modules/zoom.frag.c"

void main() {
  vec2 coords = gl_FragCoord.xy;
  vec2 c = coords * u_tex_dimensions / u_dimensions;
  color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);

  t_coords = gl_FragCoord.xy / u_dimensions - vec2(0.5) + u_transform_center;
  t_coords -= vec2(0.5);

  t_coords /= u_transform_scale;
  mat2 rot_mat = mat2(cos(u_transform_rotation), sin(u_transform_rotation),
                      -sin(u_transform_rotation), cos(u_transform_rotation));
  t_coords = rot_mat * t_coords;

  t_coords += vec2(0.5);
  t_coords *= u_dimensions;

  if (u_constrain_to_transform) {
    if (t_coords.x < 0. || t_coords.x > u_dimensions.x || t_coords.y < 0. ||
        t_coords.y > u_dimensions.y) {
      return;
    }
  }

  switch (u_function) {
  case FN_RENDER:
    break;
    GENERATE_CASES;
  default:
    // shouldn't happen
    color_out = vec4(1., 0., 1., 1.);
    break;
  }

  if (!u_no_clamp) {
    color_out = clamp(color_out, -1., 1.);
  }
}
