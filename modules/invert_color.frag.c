vec4 STAGE(vec2 coords) {
    return vec4(1. - INPUT0(coords).rgb, 1.);
}
