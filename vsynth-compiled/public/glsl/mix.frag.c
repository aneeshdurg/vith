uniform float STAGE_input0_strength;
uniform float STAGE_input1_strength;

vec4 STAGE(vec2 coords) {
    vec3 color = STAGE_input0_strength * INPUT0(coords).rgb +
      STAGE_input1_strength * INPUT1(coords).rgb;
    return vec4(color, 1.);
}
