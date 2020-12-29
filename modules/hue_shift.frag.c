/// modulefn: hue_shift
uniform float u_hue_shift; /// { "start": 0, "end": 360, "default": 180 }

void hue_shift() {
    color_out.rgb = hsv_to_rgb(
        rgb_to_hsv(color_out.rgb) + vec3(u_hue_shift, 0., 0.));
}
