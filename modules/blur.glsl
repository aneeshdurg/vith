uniform int STAGE_stride_x; /// { "start": 1, "end": 100, "default": 1 }
uniform int STAGE_stride_y; /// { "start": 1, "end": 100, "default": 1 }

vec4 STAGE(vec2 coords) {
    vec3 color = vec3(0);
    int stride_x = 2 * STAGE_stride_x - 1;
    int stride_y = 2 * STAGE_stride_y - 1;

    color += INPUT0(coords + vec2(-1, -1)).rgb * 0.045 ;
    color += INPUT0(coords + vec2(0, -1)).rgb * 0.122 ;
    color += INPUT0(coords + vec2(1, -1)).rgb * 0.045 ;

    color += INPUT0(coords + vec2(-1, 0)).rgb * 0.122 ;
    color += INPUT0(coords + vec2(0, 0)).rgb * 0.332 ;
    color += INPUT0(coords + vec2(1, 0)).rgb * 0.122 ;

    color += INPUT0(coords + vec2(-1, 1)).rgb * 0.045 ;
    color += INPUT0(coords + vec2(0, 1)).rgb * 0.122 ;
    color += INPUT0(coords + vec2(1, 1)).rgb * 0.045 ;

    return vec4(color, 1.);
}
