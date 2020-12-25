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

uniform float u_reflect_theta; // between 0 and PI for now
uniform float u_reflect_y;
void reflect() {
    vec2 coords = gl_FragCoord.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;
    c.y -= u_reflect_y;

    vec3 color = vec3(0.);

    if (u_reflect_theta > 0.) {
        float r = length(c);
        float theta = atan(c.y, c.x);

        float pos_theta = theta;
        if (pos_theta < 0.)
            pos_theta = 2. * PI + pos_theta;
        if (pos_theta < u_reflect_theta || pos_theta > (u_reflect_theta + PI)) {
            color = texelFetch(u_texture, ivec2(coords), 0).xyz;
        } else {
            theta -= u_reflect_theta;
            if (theta < -1. * PI)
                theta += 2. * PI;
            theta = -theta;

            theta += u_reflect_theta;
            c = r * vec2(sin(theta), cos(theta));
            c += u_reflect_y;
            c = (c + 1.) / 2.;
            c *= u_tex_dimensions;
            color = texelFetch(u_texture, ivec2(c), 0).xyz;
        }
    }

    color_out = vec4(u_feedback * color, 1.);
}

uniform float u_noise_r;
uniform float u_noise_g;
uniform float u_noise_b;
// 2D Random
float random (in vec2 st, float noise_param) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * noise_param);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise_1d (float noise_param) {
    vec2 st = gl_FragCoord.xy / u_dimensions;
    st *= 5.;

    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i, noise_param);
    float b = random(i + vec2(1.0, 0.0), noise_param);
    float c = random(i + vec2(0.0, 1.0), noise_param);
    float d = random(i + vec2(1.0, 1.0), noise_param);

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void noise() {
    float r = noise_1d(u_noise_r);
    float g = noise_1d(u_noise_g);
    float b = noise_1d(u_noise_b);
    color_out.xyz += vec3(r, g, b);
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

uniform float u_hue_shift;
void hue_shift() {
    color_out.rgb = hsv_to_rgb(
        rgb_to_hsv(color_out.rgb) + vec3(u_hue_shift, 0., 0.));
}

uniform float u_zoom;
uniform vec2 u_zoom_center;
void zoom() {
    vec2 coords = gl_FragCoord.xy / u_dimensions;

    coords = coords - u_zoom_center;
    coords /= u_zoom;
    coords += u_zoom_center;

    vec2 c = coords * u_tex_dimensions;
    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c), 0).xyz, 1.);
}

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
