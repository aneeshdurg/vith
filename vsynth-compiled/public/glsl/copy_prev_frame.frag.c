vec4 STAGE(vec2 coords) {
    return vec4(texelFetch(u_prev_frame, ivec2(coords), 0).rgb, 1.);
}
