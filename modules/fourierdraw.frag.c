/// modulefn: fourierdraw
/// moduletag: generator

// sin(dot(f, x) + c) * color
uniform vec3 u_fd_r; /// { "start": [-10, -10, -10], "end": [10, 10, 10], "default": [0, 0, 0], "names": ["1", "2", "3"] }
uniform vec3 u_fd_theta; /// { "start": [0, 0, 0], "end": ["2 * math.pi", "2 * math.pi", "2 * math.pi"], "default": [0, 0, 0], "names": ["1", "2", "3"] }
uniform float u_fd_draw_r; /// { "start": 0, "end": 2, "default": 0.25 }
uniform vec3 u_fd_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }
uniform float u_fd_thickness; /// { "start": 0, "end": 1, "default": 0.025 }
uniform bool u_fd_smooth_edges; /// { "default": true }
uniform bool u_fd_fill; /// { "default": false }
uniform bool u_fd_destructive; /// { "default": false }

void fourierdraw() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float x = dot(u_fd_r * cos(u_fd_theta), vec3(1.));
    float y = dot(u_fd_r * sin(u_fd_theta), vec3(1.));

    vec2 pos = vec2(x, y);
    float r = length(pos - c);
    if ((u_fd_fill &&  r < u_fd_draw_r) ||
        (!u_fd_fill && abs(r - u_fd_draw_r) < u_fd_thickness )) {
        float factor = 1.;
        if (u_fd_smooth_edges && (!u_fd_fill || r >= u_fd_draw_r)) {
            factor = 1. - abs(r - u_fd_draw_r) / u_fd_thickness;
        }

        if (u_fd_destructive && factor > 0.)
            color_out.rgb = factor * u_fd_color;
        else
            color_out.rgb += factor * u_fd_color;

    }
}
