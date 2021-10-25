/// modulefn: voronoi
/// moduletag: color

uniform sampler2D u_voronoi_data; /// custom
uniform int u_voronoi_count; /// custom

void voronoi() {
    vec2 pt = t_coords / u_dimensions;
    vec2 cell_pt = vec2(0.);
    float dist = -1.;
    for (int i = 0; i < u_voronoi_count; i++) {
        vec4 candidate_ = texelFetch(u_voronoi_data, ivec2(i / 2, 0), 0);
        vec2 candidate = (i % 2 == 0) ? candidate_.rg : candidate_.ba;
        float curr_dist = length(candidate - pt);
        if (dist < 0. || curr_dist < dist) {
            dist = curr_dist;
            cell_pt = candidate;
        }
    }

    color_out.xyz = texelFetch(u_texture, ivec2(cell_pt * u_dimensions), 0).rgb;
}
