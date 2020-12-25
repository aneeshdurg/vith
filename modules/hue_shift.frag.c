/// modulefn: hue_shuft
uniform float u_hue_shift;

void hue_shift() {
    color_out.rgb = hsv_to_rgb(
        rgb_to_hsv(color_out.rgb) + vec3(u_hue_shift, 0., 0.));
}
