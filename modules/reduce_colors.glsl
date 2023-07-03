uniform sampler2D STAGE_data; /// custom
uniform int STAGE_count; /// { "start": 1, "end": 256, "default": 16 }

vec4 STAGE(vec2 coords) {
    vec3 color = INPUT0(coords).rgb;
    vec3 closest_color = vec3(0.);
    float dist = -1.;
    for (int i = 0; i < STAGE_count; i++) {
        vec3 candidate = texelFetch(STAGE_data, ivec2(i, 0), 0).rgb;
        vec3 dists = abs(candidate - color);
        float curr_dist = dists.r + dists.g + dists.b;
        if (dist < 0. || curr_dist < dist) {
            dist = curr_dist;
            closest_color = candidate;
        }
    }

    return vec4(closest_color, 1.);
}
