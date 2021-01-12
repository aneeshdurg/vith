/// modulefn: hue_shift
/// moduletag: color

uniform float u_hue_shift; /// { "start": 0, "end": 360, "default": 180 }
uniform float u_saturate_shift; /// { "start": 0, "end": 1, "default": 0 }

void hue_shift() {
    color_out.rgb = hsv_to_rgb(
        rgb_to_hsv(color_out.rgb) + vec3(u_hue_shift, u_saturate_shift, 0.));
}
