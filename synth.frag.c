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

//   __                  _   _
//  / _|_   _ _ __   ___| |_(_) ___  _ __  ___
// | |_| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
// |  _| |_| | | | | (__| |_| | (_) | | | \__ \
// |_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
// figlet: functions
#define FN_RENDER    0
#define FN_OSC       1
#define FN_ROTATE    2
#define FN_REFLECT   3
#define FN_NOISE     4
#define FN_HUE_SHIFT 5
#define FN_ZOOM      6
// TODO kaleidoscope, hue shift, grayscale, low_pass/high pass thresholding

uniform vec2 u_dimensions;
uniform vec2 u_tex_dimensions;
uniform sampler2D u_texture;
uniform int u_function;
uniform int u_stage;

uniform float u_feedback;

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

#include "modules/hue_shift.frag.c"
#include "modules/noise.frag.c"
#include "modules/oscillator.frag.c"
#include "modules/reflector.frag.c"
#include "modules/rotator.frag.c"
#include "modules/zoom.frag.c"

// TODO split up each module into files
void main() {
    vec2 coords = gl_FragCoord.xy;
    vec2 c = coords * u_tex_dimensions / u_dimensions;
    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);

    switch(u_function) {
    case FN_RENDER:
        break;
    case FN_OSC:
        oscillator();
        break;
    case FN_ROTATE:
        rotate();
        break;
    case FN_REFLECT:
        reflect();
        break;
    case FN_NOISE:
        noise();
        break;
    case FN_HUE_SHIFT:
        hue_shift();
        break;
    case FN_ZOOM:
        zoom();
        break;
    default:
        // shouldn't happen
        color_out = vec4(1., 0., 1., 1.);
        break;
    }
}
