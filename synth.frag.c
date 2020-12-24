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
#define FN_RENDER 0
#define FN_OSC    1
#define FN_ROTATE 2
// TODO kaleidoscope, noise

uniform vec2 u_dimensions;
uniform vec2 u_tex_dimensions;
uniform sampler2D u_texture;
uniform int u_function;
uniform int u_stage;

uniform float u_feedback;

//   ___           _ _ _       _
//  / _ \ ___  ___(_) | | __ _| |_ ___  _ __ ___
// | | | / __|/ __| | | |/ _` | __/ _ \| '__/ __|
// | |_| \__ \ (__| | | | (_| | || (_) | |  \__ \
//  \___/|___/\___|_|_|_|\__,_|\__\___/|_|  |___/
// figlet: Oscilators
// sin(dot(f, x) + c) * color
uniform vec2 u_osc_f;
uniform float u_osc_c;
uniform vec3 u_osc_color;

// Rotation
uniform float u_rotation;

out vec4 color_out;

void oscillator() {
    vec2 coords = gl_FragCoord.xy;
    color_out.xyz += sin(dot(u_osc_f, coords) + u_osc_c) * u_osc_color;
    color_out.a = 1.;
}

void rotate() {
    vec2 coords = gl_FragCoord.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    theta += u_rotation;
    c = r * vec2(sin(theta), cos(theta));

    c  = (c + 1.) / 2.;
    c *= u_tex_dimensions;

    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}

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
    default:
        // shouldn't happen
        color_out = vec4(1., 0., 1., 1.);
        break;
    }
}
