/// modulefn: polygon
/// moduletag: generator

uniform vec3 u_polygon_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }
uniform int u_polygon_n; /// { "start": 3, "end": 100, "default": 4 }
uniform float u_polygon_r; /// { "start": 0, "end": 1, "default": 0.49999 }
uniform float u_polygon_thickness; /// { "start": 0, "end": 1, "default": 0.025 }
uniform bool u_polygon_smooth_edges; /// { "default": true }
uniform bool u_polygon_fill; /// { "default": false }
uniform bool u_polygon_destructive; /// { "default": false }

void polygon() {
    vec2 coords = t_coords.xy;
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    if (theta < 0.)
        theta += 2. * PI;

    float angle = 2. * PI / float(u_polygon_n);
    float lower = floor(theta / angle) * angle;
    float higher = ceil(theta / angle) * angle;

    vec2 lower_c = u_polygon_r * vec2(cos(lower), sin(lower));
    vec2 higher_c = u_polygon_r * vec2(cos(higher), sin(higher));
    // if (length(lower_c - c) < 0.1)
    //     color_out.rgb = vec3(1.);
    // if (length(higher_c - c) < 0.1)
    //     color_out.rgb = vec3(1.);

    // return;
    // a + (b - a) * t = r' * (cos x, sin x)
    // a.x + (b.x - a.x) * t = r' * cos x
    // a.y + (b.y - a.y) * t = r' * sin x
    //
    // t = (r' * cos x - a.x) / (b.x - a.x)
    // r' * sin x = (a.y + (r' * cos x - a.x) (b.y - a.y) / (b.x - a.x))
    // r' * sin x - (r' * cos x) (b.y - a.y) / (b.x - a.x) = a.y - a.x * (b.y - a.y) / (b.x - a.x)
    // r' * (sin x - (cos x - a.x) (b.y - a.y) / (b.x - a.x) = a.y - a.x * (b.y - a.y) / (b.x - a.x)
    // where a = lower_c, b = higher_c, x = theta, r' = radius along pg edge

    vec2 s = higher_c - lower_c;
    float lhs = 1. - (cos(theta) * s.y / (sin(theta) * s.x));
    float rhs = (lower_c.y * s.x - lower_c.x * s.y) / (sin(theta) * s.x);
    // float lhs = (
    //     sin(theta) - (cos(theta) - lower_c.x) * (
    //         (higher_c.y - lower_c.y) / (higher_c.x - lower_c.x)
    //     ));

    // float rhs = (
    //     lower_c.y - lower_c.x * (
    //         (higher_c.y - lower_c.y) / (higher_c.x - lower_c.x)
    //     ));
    float pg_r = rhs / lhs;

    // float base = length(higher_c - lower_c);
    // float h = sqrt(u_polygon_r * u_polygon_r - base * base);
    // float pg_r = 0.;
    // float avg = (lower + higher) / 2.;
    // if (theta < avg)
    //     pg_r = mix(u_polygon_r, h, (theta - lower) / (avg - lower));
    // else
    //     pg_r = mix(h, u_polygon_r, (theta - avg) / (avg - lower));


    if (abs(r - pg_r) < u_polygon_thickness || (u_polygon_fill && r < pg_r)) {
        float factor = 1.;
        if (u_polygon_smooth_edges && (!u_polygon_fill || r >= pg_r)) {
            factor = 1. - abs(r - pg_r) / u_polygon_thickness;
        }

        if (u_polygon_destructive && factor > 0.)
            color_out.rgb = factor * u_polygon_color;
        else
            color_out.rgb += factor * u_polygon_color;
    }
}
