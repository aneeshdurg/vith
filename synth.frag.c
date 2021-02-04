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

#define FN_RENDER    0

uniform vec2 u_dimensions;
uniform vec2 u_tex_dimensions;
uniform sampler2D u_texture;
uniform float u_transform_scale;
uniform vec2 u_transform_center;
uniform float u_transform_rotation;
uniform int u_function;

uniform float u_feedback;
uniform bool u_constrain_to_transform;

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

vec2 t_coords;

#include "modules/blur.frag.c"
#include "modules/composite.frag.c"
#include "modules/condzoom.frag.c"
#include "modules/copy.frag.c"
#include "modules/checkerfill.frag.c"
#include "modules/enhance.frag.c"
#include "modules/gamma_correct.frag.c"
#include "modules/greyscale.frag.c"
#include "modules/halftone.frag.c"
#include "modules/hue_shift.frag.c"
#include "modules/invert_color.frag.c"
#include "modules/multiply.frag.c"
#include "modules/noise.frag.c"
#include "modules/offset.frag.c"
#include "modules/oscillator.frag.c"
#include "modules/picture.frag.c"
#include "modules/pixelate.frag.c"
#include "modules/recolor.frag.c"
#include "modules/reduce_colors.frag.c"
#include "modules/reflector.frag.c"
#include "modules/ripple.frag.c"
#include "modules/rotator.frag.c"
#include "modules/superformula.frag.c"
#include "modules/swirl.frag.c"
#include "modules/threshold.frag.c"
#include "modules/tile.frag.c"
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
    mat2 rot_mat = mat2(
            cos(u_transform_rotation), sin(u_transform_rotation),
            -sin(u_transform_rotation), cos(u_transform_rotation));
    t_coords = rot_mat * t_coords;

    t_coords += vec2(0.5);
    t_coords *= u_dimensions;

    if (u_constrain_to_transform) {
        if (t_coords.x < 0. || t_coords.x > u_dimensions.x ||
                t_coords.y < 0. || t_coords.y > u_dimensions.y) {
            return;
        }
    }

    switch(u_function) {
    case FN_RENDER:
        break;
    GENERATE_CASES;
    default:
        // shouldn't happen
        color_out = vec4(1., 0., 1., 1.);
        break;
    }

   color_out = clamp(color_out, -1., 1.);
}
