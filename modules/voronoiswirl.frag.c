/// modulefn: voronoiswirl
/// moduletag: space

uniform sampler2D u_voronoiswirl_data; /// custom
uniform int u_voronoiswirl_count; /// custom
uniform float u_voronoiswirl_factor; /// { "start": 0, "end": "2 * math.pi", "default": 0 }

void voronoiswirl() {
    vec2 pt = t_coords / u_dimensions;
    vec2 cell_pt = vec2(0.);
    float dist = -1.;
    for (int i = 0; i < u_voronoiswirl_count; i++) {
        vec4 candidate_ = texelFetch(u_voronoiswirl_data, ivec2(i / 2, 0), 0);
        vec2 candidate = (i % 2 == 0) ? candidate_.rg : candidate_.ba;
        float curr_dist = length(candidate - pt);
        if (dist < 0. || curr_dist < dist) {
            dist = curr_dist;
            cell_pt = candidate;
        }
    }

    pt = 2. * pt - 1.;
    vec2 c = pt - cell_pt;
    c = (c + 1.) / 2.;
    // c = 2. * c - 1.;

    // float r = length(c);
    // float theta = atan(c.y, c.x);
    // theta += r * u_voronoiswirl_factor;
    // c = r * vec2(cos(theta), sin(theta));

    // c  = (c + 1.) / 2.;

    // c += cell_pt;

    color_out = vec4(u_feedback * texelFetch(u_texture, ivec2(c *u_dimensions), 0).xyz, 1.);

}
