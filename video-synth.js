var K = Object.defineProperty;
var j = (e, t, r) => t in e ? K(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var S = (e, t, r) => (j(e, typeof t != "symbol" ? t + "" : t, r), r);
const modules = {
  reduce_colors: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "data",
        type: null,
        info: null
      },
      {
        name: "count",
        type: "int",
        info: {
          start: 1,
          end: 256,
          default: 16
        }
      }
    ],
    src: `uniform sampler2D STAGE_data; /// custom
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
`
  },
  noise: {
    inputs: [],
    params: [
      {
        name: "r",
        type: "float",
        info: {
          start: 0,
          end: 1e4,
          default: 0
        }
      },
      {
        name: "g",
        type: "float",
        info: {
          start: 0,
          end: 1e4,
          default: 0
        }
      },
      {
        name: "b",
        type: "float",
        info: {
          start: 0,
          end: 1e4,
          default: 0
        }
      }
    ],
    src: `uniform float STAGE_r; /// { "start": 0, "end": 10000, "default": 0 }
uniform float STAGE_g; /// { "start": 0, "end": 10000, "default": 0 }
uniform float STAGE_b; /// { "start": 0, "end": 10000, "default": 0 }

// 2D Random
float STAGE_random(in vec2 st, float noise_param) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * noise_param);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float STAGE_noise_1d(float noise_param, vec2 coords) {
  vec2 st = coords.xy / u_dimensions;
  st *= 5.;

  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = STAGE_random(i, noise_param);
  float b = STAGE_random(i + vec2(1.0, 0.0), noise_param);
  float c = STAGE_random(i + vec2(0.0, 1.0), noise_param);
  float d = STAGE_random(i + vec2(1.0, 1.0), noise_param);

  // Smooth Interpolation

  // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);
  // u = smoothstep(0.,1.,f);

  // Mix 4 coorners percentages
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec4 STAGE(vec2 coords) {
  float r = STAGE_noise_1d(STAGE_r, coords);
  float g = STAGE_noise_1d(STAGE_g, coords);
  float b = STAGE_noise_1d(STAGE_b, coords);
  return vec4(r, g, b, 1.);
}
`
  },
  blur: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "stride_x",
        type: "int",
        info: {
          start: 1,
          end: 100,
          default: 1
        }
      },
      {
        name: "stride_y",
        type: "int",
        info: {
          start: 1,
          end: 100,
          default: 1
        }
      }
    ],
    src: `uniform int STAGE_stride_x; /// { "start": 1, "end": 100, "default": 1 }
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
`
  },
  oscillator: {
    inputs: [],
    params: [
      {
        name: "osc_f",
        type: "vec2",
        info: {
          start: [
            0,
            0
          ],
          end: [
            1,
            1
          ],
          default: [
            0.25,
            0
          ],
          names: [
            "x",
            "y"
          ]
        }
      },
      {
        name: "osc_c",
        type: "float",
        info: {
          start: 0,
          end: 6.283185307179586,
          default: 0
        }
      },
      {
        name: "osc_color",
        type: "vec3",
        info: {
          start: [
            0,
            0,
            0
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            1,
            0,
            0
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      }
    ],
    src: `uniform vec2 STAGE_osc_f; /// { "start": [0, 0], "end": [1, 1], "default": [0.25, 0], "names": ["x", "y"] }
uniform float STAGE_osc_c; /// { "start": 0, "end": "2 * math.pi", "default": 0 }
uniform vec3 STAGE_osc_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }

vec4 STAGE(vec2 coords) {
    vec4 res = vec4(0.);
    res.xyz += sin(dot(STAGE_osc_f, coords) + STAGE_osc_c) * STAGE_osc_color;
    res.a = 1.;
    return res;
}
`
  },
  recolor: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "new_r",
        type: "vec3",
        info: {
          start: [
            0,
            0,
            0
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            1,
            0,
            0
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      },
      {
        name: "new_g",
        type: "vec3",
        info: {
          start: [
            0,
            0,
            0
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            0,
            1,
            0
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      },
      {
        name: "new_b",
        type: "vec3",
        info: {
          start: [
            0,
            0,
            0
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            0,
            0,
            1
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      }
    ],
    src: `uniform vec3 STAGE_new_r; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }
uniform vec3 STAGE_new_g; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 1, 0], "names": ["r", "g", "b"] }
uniform vec3 STAGE_new_b; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [0, 0, 1], "names": ["r", "g", "b"] }

vec4 STAGE(vec2 coords) {
    vec3 color = INPUT0(coords).rgb;
    return vec4(
        color.r * STAGE_new_r +
        color.g * STAGE_new_g +
        color.b * STAGE_new_b, 1.);
}
`
  },
  pixelate: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "factor",
        type: "int",
        info: {
          start: 0,
          end: 500,
          default: 10
        }
      }
    ],
    src: `uniform int STAGE_factor; /// { "start": 0, "end": 500, "default": 10 }

vec4 STAGE(vec2 coords) {
    float f = float(STAGE_factor);
    coords = floor(coords / f) * f;
    vec3 color = vec3(0);
    float samples = 4.;
    color += INPUT0(coords + vec2(0, 0)).xyz / samples;
    color += INPUT0(coords + vec2(0, STAGE_factor)).xyz / samples;
    color += INPUT0(coords + vec2(STAGE_factor, 0)).xyz / samples;
    color += INPUT0(coords + vec2(STAGE_factor, STAGE_factor)).xyz / samples;
    return vec4(color, 1.);
}
`
  },
  invert_color: {
    inputs: [
      "INPUT0"
    ],
    params: [],
    src: `vec4 STAGE(vec2 coords) {
    return vec4(1. - INPUT0(coords).rgb, 1.);
}
`
  },
  mix: {
    inputs: [
      "INPUT0",
      "INPUT1"
    ],
    params: [
      {
        name: "input0_strength",
        type: "float",
        info: {
          start: 0,
          end: 1,
          default: 1
        }
      },
      {
        name: "input1_strength",
        type: "float",
        info: {
          start: 0,
          end: 1,
          default: 1
        }
      }
    ],
    src: `uniform float STAGE_input0_strength; /// { "start": 0, "end": 1, "default": 1 }
uniform float STAGE_input1_strength; /// { "start": 0, "end": 1, "default": 1 }

vec4 STAGE(vec2 coords) {
    vec3 color = STAGE_input0_strength * INPUT0(coords).rgb +
      STAGE_input1_strength * INPUT1(coords).rgb;
    return vec4(color, 1.);
}
`
  },
  tile: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "x",
        type: "int",
        info: {
          start: 1,
          end: 100,
          default: 2
        }
      },
      {
        name: "y",
        type: "int",
        info: {
          start: 1,
          end: 100,
          default: 2
        }
      }
    ],
    src: `uniform int STAGE_x; /// { "start": 1, "end": 100, "default": 2 }
uniform int STAGE_y; /// { "start": 1, "end": 100, "default": 2 }

vec4 STAGE(vec2 coords) {
    float tile_x_size = u_dimensions.x / float(STAGE_x);
    float tile_y_size = u_dimensions.y / float(STAGE_y);

    coords.x = mod(coords.x, tile_x_size) * float(STAGE_x);
    coords.y = mod(coords.y, tile_y_size) * float(STAGE_y);
    // vec2 c = coords / u_dimensions;

    return INPUT0(coords);
}
`
  },
  polygon: {
    inputs: [],
    params: [
      {
        name: "color",
        type: "vec3",
        info: {
          start: [
            0,
            0,
            0
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            1,
            0,
            0
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      },
      {
        name: "n",
        type: "int",
        info: {
          start: 3,
          end: 100,
          default: 4
        }
      },
      {
        name: "r",
        type: "float",
        info: {
          start: 0,
          end: 1,
          default: 0.49999
        }
      },
      {
        name: "thickness",
        type: "float",
        info: {
          start: 0,
          end: 1,
          default: 0.025
        }
      },
      {
        name: "smooth_edges",
        type: "bool",
        info: {
          default: !0
        }
      },
      {
        name: "fill",
        type: "bool",
        info: {
          default: !1
        }
      },
      {
        name: "destructive",
        type: "bool",
        info: {
          default: !1
        }
      }
    ],
    src: `uniform vec3 STAGE_color; /// { "start": [0, 0, 0], "end": [1, 1, 1], "default": [1, 0, 0], "names": ["r", "g", "b"] }
uniform int STAGE_n; /// { "start": 3, "end": 100, "default": 4 }
uniform float STAGE_r; /// { "start": 0, "end": 1, "default": 0.49999 }
uniform float STAGE_thickness; /// { "start": 0, "end": 1, "default": 0.025 }
uniform bool STAGE_smooth_edges; /// { "default": true }
uniform bool STAGE_fill; /// { "default": false }
uniform bool STAGE_destructive; /// { "default": false }

vec4 STAGE(vec2 coords) {
    vec4 color_out;
    color_out.a = 1.;

    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    if (theta < 0.)
        theta += 2. * PI;

    float angle = 2. * PI / float(STAGE_n);
    float lower = floor(theta / angle) * angle;
    float higher = ceil(theta / angle) * angle;

    vec2 lower_c = STAGE_r * vec2(cos(lower), sin(lower));
    vec2 higher_c = STAGE_r * vec2(cos(higher), sin(higher));
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
    // float h = sqrt(STAGE_r * STAGE_r - base * base);
    // float pg_r = 0.;
    // float avg = (lower + higher) / 2.;
    // if (theta < avg)
    //     pg_r = mix(STAGE_r, h, (theta - lower) / (avg - lower));
    // else
    //     pg_r = mix(h, STAGE_r, (theta - avg) / (avg - lower));


    if (abs(r - pg_r) < STAGE_thickness || (STAGE_fill && r < pg_r)) {
        float factor = 1.;
        if (STAGE_smooth_edges && (!STAGE_fill || r >= pg_r)) {
            factor = 1. - abs(r - pg_r) / STAGE_thickness;
        }

        if (STAGE_destructive && factor > 0.)
            color_out.rgb = factor * STAGE_color;
        else
            color_out.rgb += factor * STAGE_color;
    }

    return color_out;
}
`
  },
  brightness: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "strength",
        type: "float",
        info: {
          start: 0,
          end: 2,
          default: 1
        }
      }
    ],
    src: `uniform float STAGE_strength; /// { "start": 0, "end": 2, "default": 1 }

vec4 STAGE(vec2 coords) {
    return STAGE_strength * INPUT0(coords);
}
`
  },
  mirror: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "reflect_theta",
        type: "float",
        info: {
          start: 0,
          end: 6.283185307179586,
          default: 1.5707963267948966
        }
      },
      {
        name: "reflect_y",
        type: "float",
        info: {
          start: -1,
          end: 1,
          default: 0
        }
      },
      {
        name: "reflect_x",
        type: "float",
        info: {
          start: -1,
          end: 1,
          default: 0
        }
      }
    ],
    src: `uniform float STAGE_reflect_theta; /// { "start": 0, "end": "2 * math.pi", "default": "math.pi / 2" }
uniform float STAGE_reflect_y; /// { "start": -1, "end": 1, "default": 0 }
uniform float STAGE_reflect_x; /// { "start": -1, "end": 1, "default": 0 }

vec4 STAGE(vec2 coords) {
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;
    c.y -= STAGE_reflect_y;
    c.x -= STAGE_reflect_x;

    float r = length(c);
    float theta = atan(c.y, c.x);
    float pos_theta = theta;
    if (pos_theta < 0.)
        pos_theta = 2. * PI + pos_theta;

    vec3 color = vec3(0.);

    if (pos_theta > (STAGE_reflect_theta - PI) &&
            (pos_theta < STAGE_reflect_theta ||
             pos_theta > (STAGE_reflect_theta + PI))) {
        color = INPUT0(coords).xyz;
    } else {
        theta = -(theta - STAGE_reflect_theta) + STAGE_reflect_theta;

        c = r * vec2(cos(theta), sin(theta));

        c.y += STAGE_reflect_y;
        c.x += STAGE_reflect_x;
        c = (c + 1.) / 2.;
        c *= u_dimensions;
        color = INPUT0(c).xyz;
    }

    return vec4(color, 1.);
}
`
  },
  offset: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "offsets_x",
        type: "vec3",
        info: {
          start: [
            -1,
            -1,
            -1
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            0,
            0,
            0
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      },
      {
        name: "offsets_y",
        type: "vec3",
        info: {
          start: [
            -1,
            -1,
            -1
          ],
          end: [
            1,
            1,
            1
          ],
          default: [
            0,
            0,
            0
          ],
          names: [
            "r",
            "g",
            "b"
          ]
        }
      }
    ],
    src: `uniform vec3 STAGE_offsets_x; /// { "start": [-1, -1, -1], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }
uniform vec3 STAGE_offsets_y; /// { "start": [-1, -1, -1], "end": [1, 1, 1], "default": [0, 0, 0], "names": ["r", "g", "b"] }

vec2 STAGE_offset_fix_range(vec2 c) {
    vec2 res = c;
    if (res.x > 1.)
        res.x = res.x - 1.;
    if (res.x < 0.)
        res.x = 1. + res.x;

    if (res.y > 1.)
        res.y = res.y - 1.;
    if (res.y < 0.)
        res.y = 1. + res.y;

    return res;
}

vec4 STAGE(vec2 coords) {
    vec2 c = coords / u_dimensions;

    vec2 c_r = c + vec2(STAGE_offsets_x.r, STAGE_offsets_y.r);
    c_r = STAGE_offset_fix_range(c_r);
    vec2 c_g = c + vec2(STAGE_offsets_x.g, STAGE_offsets_y.g);
    c_g = STAGE_offset_fix_range(c_g);
    vec2 c_b = c + vec2(STAGE_offsets_x.b, STAGE_offsets_y.b);
    c_b = STAGE_offset_fix_range(c_b);

    vec4 color;
    color.r = INPUT0(c_r * u_tex_dimensions).r;
    color.g = INPUT0(c_g * u_tex_dimensions).g;
    color.b = INPUT0(c_b * u_tex_dimensions).b;
    color.a = 1.;
    return color;
}
`
  },
  copy_prev_frame: {
    inputs: [],
    params: [],
    src: `vec4 STAGE(vec2 coords) {
    return vec4(texelFetch(u_prev_frame, ivec2(coords), 0).rgb, 1.);
}
`
  },
  webcam: {
    inputs: [],
    params: [
      {
        name: "src",
        type: null,
        info: null
      },
      {
        name: "invert_x",
        type: "bool",
        info: {
          default: !0
        }
      },
      {
        name: "invert_y",
        type: "bool",
        info: {
          default: !0
        }
      }
    ],
    src: `uniform sampler2D STAGE_src;   /// custom
uniform bool STAGE_invert_x;   ///  { "default": true }
uniform bool STAGE_invert_y;   ///  { "default": true }

vec4 STAGE(vec2 coords) {
  vec2 c = coords / u_dimensions;
  if (STAGE_invert_y)
    c.y = 1. - c.y;
  if (STAGE_invert_x)
    c.x = 1. - c.x;
  c *= vec2(textureSize(STAGE_src, 0));

  return vec4(texelFetch(STAGE_src, ivec2(c), 0).xyz, 1.);
}
`
  },
  rotate: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "angle",
        type: "float",
        info: {
          start: 0,
          end: 6.283185307179586,
          default: 0
        }
      }
    ],
    src: `uniform float STAGE_angle; /// { "start": 0, "end": "2 * math.pi", "default": 0 }

vec4 STAGE(vec2 coords) {
    vec2 c = coords / u_dimensions;
    c = 2. * c - 1.;

    float r = length(c);
    float theta = atan(c.y, c.x);
    theta += STAGE_angle;
    c = r * vec2(cos(theta), sin(theta));

    c  = (c + 1.) / 2.;
    c *= u_dimensions;

    return vec4(INPUT0(c).rgb, 1.);
}
`
  },
  zoom: {
    inputs: [
      "INPUT0"
    ],
    params: [
      {
        name: "x",
        type: "float",
        info: {
          start: 0,
          end: 100,
          default: 1
        }
      },
      {
        name: "y",
        type: "float",
        info: {
          start: 0,
          end: 100,
          default: 1
        }
      },
      {
        name: "center",
        type: "vec2",
        info: {
          start: [
            0,
            0
          ],
          end: [
            1,
            1
          ],
          default: [
            0.5,
            0.5
          ],
          names: [
            "x",
            "y"
          ]
        }
      }
    ],
    src: `uniform float STAGE_x; /// {"start": 0, "end": 100, "default": 1}
uniform float STAGE_y; /// {"start": 0, "end": 100, "default": 1}
uniform vec2 STAGE_center; /// {"start": [0, 0], "end": [1, 1], "default": [0.5, 0.5], "names": ["x", "y"]}

vec4 STAGE(vec2 coords) {
    coords = coords / u_dimensions;

    coords = coords - STAGE_center;
    if (STAGE_x > 0.)
      coords.x /= STAGE_x;
    if (STAGE_y > 0.)
      coords.y /= STAGE_y;
    coords += STAGE_center;

    vec2 c = coords * u_tex_dimensions;
    return vec4(INPUT0(c).xyz, 1.);
}
`
  }
}, template = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

#define PI 3.1415926538
#define GOLDEN_RATIO 1.6180339887

uniform vec2 u_dimensions;
uniform vec2 u_tex_dimensions;
uniform sampler2D u_prev_frame;
out vec4 color_out;

vec4 synth(vec2 coords);

void main() {
    vec2 coords = gl_FragCoord.xy;
    vec2 c = coords * u_tex_dimensions / u_dimensions;
    color_out = synth(c);
}
`;
class UIEventManager {
  constructor() {
    S(this, "_add_event", null);
    S(this, "_show_details", null);
    S(this, "_recompile", null);
    S(this, "_organize", null);
    S(this, "_get_webcam_feed", null);
    S(this, "_list_webcam_sources", null);
    S(this, "_add_webcam_feed", null);
    S(this, "_remove_webcam_feed", null);
  }
  add_event(t) {
    this._add_event && this._add_event(t);
  }
  register_add_event(t) {
    this._add_event = t;
  }
  show_details(t, r) {
    this._show_details && this._show_details(t, r);
  }
  register_show_details(t) {
    this._show_details = t;
  }
  recompile(t) {
    this._recompile && this._recompile(t);
  }
  register_recompile(t) {
    this._recompile = t;
  }
  organize() {
    this._organize && this._organize();
  }
  register_organize(t) {
    this._organize = t;
  }
  register_get_webcam_feed(t) {
    this._get_webcam_feed = t;
  }
  register_list_webcam_sources(t) {
    this._list_webcam_sources = t;
  }
  register_add_webcam_feed(t) {
    this._add_webcam_feed = t;
  }
  register_remove_webcam_feed(t) {
    this._remove_webcam_feed = t;
  }
  get_webcam_feed(t) {
    return this._get_webcam_feed ? this._get_webcam_feed(t) : null;
  }
  list_webcam_sources() {
    if (this._list_webcam_sources)
      return this._list_webcam_sources();
  }
  add_webcam_feed(t, r) {
    this._add_webcam_feed && this._add_webcam_feed(t, r);
  }
  remove_webcam_feed(t) {
    this._remove_webcam_feed && this._remove_webcam_feed(t);
  }
}
function setupSidebars() {
  var f, l;
  const e = document.getElementById("sidebar"), t = document.getElementById("burgerbtn"), r = document.getElementById("title"), n = () => {
    e.style.display = "", t.style.display = "none";
  }, o = () => {
    e.style.display = "none", t.style.display = "";
  };
  t.addEventListener("click", n), r.addEventListener("click", o), (f = document.getElementById("display-container")) == null || f.addEventListener("click", o);
  const a = document.getElementById("rightsidebar");
  a.style.display = "none";
  const s = document.getElementById("gearbtn"), c = document.getElementById("settingstitle"), i = () => {
    a.style.display = "", s.style.display = "none";
  }, u = () => {
    a.style.display = "none", s.style.display = "";
  };
  s.addEventListener("click", i), c.addEventListener("click", u), (l = document.getElementById("display-container")) == null || l.addEventListener("click", u);
}
async function setupWebcamInput(e) {
  const t = document.getElementById("webcamsources");
  let r;
  try {
    r = await navigator.mediaDevices.enumerateDevices();
  } catch (i) {
    throw alert("Error initializing webcam!"), i;
  }
  r = r.filter((i) => i.kind === "videoinput"), console.log(r);
  const n = document.createElement("div");
  n.innerHTML = '<label for="webcamSelector">Choose a webcam: </label>';
  const o = document.createElement("select");
  o.id = "webcamSelector", r.forEach((i) => {
    const u = document.createElement("option");
    u.value = i.deviceId, u.innerHTML = i.label || i.deviceId.substr(0, 10), o.appendChild(u);
  }), n.appendChild(o), t.appendChild(n);
  const a = document.getElementById("webcamfeeds"), s = document.getElementById("startwebcam");
  async function c() {
    const i = document.createElement("div"), u = document.createElement("video"), f = o.value;
    if (u.id = f, e.get_webcam_feed(f)) {
      alert(`Webcam feed for ${f} already exists`);
      return;
    }
    const l = {
      video: { deviceId: f }
    };
    try {
      const m = await navigator.mediaDevices.getUserMedia(l);
      u.srcObject = m, u.play();
    } catch (m) {
      alert("Error initializing webcam! " + m), console.log(m);
    }
    u.style.width = "25%", i.appendChild(document.createElement("br")), i.appendChild(u), i.appendChild(document.createElement("br")), i.appendChild(document.createElement("br")), e.add_webcam_feed(f, u);
    const _ = document.createElement("button");
    _.innerText = "Remove feed", _.onclick = () => {
      i.remove(), e.remove_webcam_feed(f);
    }, i.appendChild(_), a.appendChild(i);
  }
  s.onclick = c;
}
function setupControls(e) {
  const t = document.getElementById("add_new_stage_select");
  if (!t)
    throw new Error("!");
  for (let o of Object.getOwnPropertyNames(modules)) {
    const a = document.createElement("option");
    a.value = o, a.innerText = o, t.appendChild(a);
  }
  const r = document.getElementById("add_new_stage");
  if (!r)
    throw new Error("!");
  r.onclick = () => {
    e.add_event(t.value);
  };
  const n = document.getElementById("organize");
  if (!n)
    throw new Error("!");
  n.onclick = () => {
    e.organize();
  };
}
function setupUI(e) {
  setupSidebars(), setupControls(e), setupWebcamInput(e);
}
function makeDraggable(e) {
  e.addEventListener("mousedown", s), e.addEventListener("mousemove", c), e.addEventListener("mouseup", i), e.addEventListener("mouseleave", i), e.addEventListener("touchstart", s), e.addEventListener("touchmove", c), e.addEventListener("touchend", i), e.addEventListener("touchleave", i), e.addEventListener("touchcancel", i);
  var t, r, n = { x: 0, y: 0 }, o = !1;
  function a(u) {
    var f = e.getScreenCTM();
    return u.touches && (u = u.touches[0]), {
      x: (u.clientX - f.e) / f.a,
      y: (u.clientY - f.f) / f.d
    };
  }
  function s(u) {
    n = a(u);
    let f = u.target;
    for (; !f.classList.contains("draggable") && f != e; )
      f = f.parentElement;
    if (f == e)
      o = !0;
    else if (f.classList.contains("draggable")) {
      t = f;
      var l = t.transform.baseVal;
      if (l.length === 0 || l.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        var _ = e.createSVGTransform();
        _.setTranslate(0, 0), t.transform.baseVal.insertItemBefore(_, 0);
      }
      r = l.getItem(0), n.x -= r.matrix.e, n.y -= r.matrix.f;
    }
  }
  function c(u) {
    var f = a(u), l = f.x - n.x, _ = f.y - n.y;
    o ? (e.viewBox.baseVal.x -= l, e.viewBox.baseVal.y -= _) : t && (u.preventDefault(), r.setTranslate(l, _), t.dispatchEvent(new Event("dragged")));
  }
  function i(u) {
    t = !1, o = !1;
  }
}
/* @license twgl.js 5.3.1 Copyright (c) 2015, Gregg Tavares All Rights Reserved.
Available via the MIT license.
see: http://github.com/greggman/twgl.js for details */
let VecType = Float32Array;
function setDefaultType$1(e) {
  const t = VecType;
  return VecType = e, t;
}
function create$1(e, t, r) {
  const n = new VecType(3);
  return e && (n[0] = e), t && (n[1] = t), r && (n[2] = r), n;
}
function add(e, t, r) {
  return r = r || new VecType(3), r[0] = e[0] + t[0], r[1] = e[1] + t[1], r[2] = e[2] + t[2], r;
}
function subtract(e, t, r) {
  return r = r || new VecType(3), r[0] = e[0] - t[0], r[1] = e[1] - t[1], r[2] = e[2] - t[2], r;
}
function lerp(e, t, r, n) {
  return n = n || new VecType(3), n[0] = e[0] + r * (t[0] - e[0]), n[1] = e[1] + r * (t[1] - e[1]), n[2] = e[2] + r * (t[2] - e[2]), n;
}
function lerpV(e, t, r, n) {
  return n = n || new VecType(3), n[0] = e[0] + r[0] * (t[0] - e[0]), n[1] = e[1] + r[1] * (t[1] - e[1]), n[2] = e[2] + r[2] * (t[2] - e[2]), n;
}
function max(e, t, r) {
  return r = r || new VecType(3), r[0] = Math.max(e[0], t[0]), r[1] = Math.max(e[1], t[1]), r[2] = Math.max(e[2], t[2]), r;
}
function min(e, t, r) {
  return r = r || new VecType(3), r[0] = Math.min(e[0], t[0]), r[1] = Math.min(e[1], t[1]), r[2] = Math.min(e[2], t[2]), r;
}
function mulScalar(e, t, r) {
  return r = r || new VecType(3), r[0] = e[0] * t, r[1] = e[1] * t, r[2] = e[2] * t, r;
}
function divScalar(e, t, r) {
  return r = r || new VecType(3), r[0] = e[0] / t, r[1] = e[1] / t, r[2] = e[2] / t, r;
}
function cross(e, t, r) {
  r = r || new VecType(3);
  const n = e[2] * t[0] - e[0] * t[2], o = e[0] * t[1] - e[1] * t[0];
  return r[0] = e[1] * t[2] - e[2] * t[1], r[1] = n, r[2] = o, r;
}
function dot(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function length$1(e) {
  return Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
}
function lengthSq(e) {
  return e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
}
function distance(e, t) {
  const r = e[0] - t[0], n = e[1] - t[1], o = e[2] - t[2];
  return Math.sqrt(r * r + n * n + o * o);
}
function distanceSq(e, t) {
  const r = e[0] - t[0], n = e[1] - t[1], o = e[2] - t[2];
  return r * r + n * n + o * o;
}
function normalize(e, t) {
  t = t || new VecType(3);
  const r = e[0] * e[0] + e[1] * e[1] + e[2] * e[2], n = Math.sqrt(r);
  return n > 1e-5 ? (t[0] = e[0] / n, t[1] = e[1] / n, t[2] = e[2] / n) : (t[0] = 0, t[1] = 0, t[2] = 0), t;
}
function negate$1(e, t) {
  return t = t || new VecType(3), t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t;
}
function copy$1(e, t) {
  return t = t || new VecType(3), t[0] = e[0], t[1] = e[1], t[2] = e[2], t;
}
function multiply$1(e, t, r) {
  return r = r || new VecType(3), r[0] = e[0] * t[0], r[1] = e[1] * t[1], r[2] = e[2] * t[2], r;
}
function divide(e, t, r) {
  return r = r || new VecType(3), r[0] = e[0] / t[0], r[1] = e[1] / t[1], r[2] = e[2] / t[2], r;
}
var v3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  add,
  copy: copy$1,
  create: create$1,
  cross,
  distance,
  distanceSq,
  divide,
  divScalar,
  dot,
  lerp,
  lerpV,
  length: length$1,
  lengthSq,
  max,
  min,
  mulScalar,
  multiply: multiply$1,
  negate: negate$1,
  normalize,
  setDefaultType: setDefaultType$1,
  subtract
});
let MatType = Float32Array;
function setDefaultType(e) {
  const t = MatType;
  return MatType = e, t;
}
function negate(e, t) {
  return t = t || new MatType(16), t[0] = -e[0], t[1] = -e[1], t[2] = -e[2], t[3] = -e[3], t[4] = -e[4], t[5] = -e[5], t[6] = -e[6], t[7] = -e[7], t[8] = -e[8], t[9] = -e[9], t[10] = -e[10], t[11] = -e[11], t[12] = -e[12], t[13] = -e[13], t[14] = -e[14], t[15] = -e[15], t;
}
function create() {
  return new MatType(16).fill(0);
}
function copy(e, t) {
  return t = t || new MatType(16), t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], t[6] = e[6], t[7] = e[7], t[8] = e[8], t[9] = e[9], t[10] = e[10], t[11] = e[11], t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function identity(e) {
  return e = e || new MatType(16), e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e;
}
function transpose(e, t) {
  if (t = t || new MatType(16), t === e) {
    let y;
    return y = e[1], e[1] = e[4], e[4] = y, y = e[2], e[2] = e[8], e[8] = y, y = e[3], e[3] = e[12], e[12] = y, y = e[6], e[6] = e[9], e[9] = y, y = e[7], e[7] = e[13], e[13] = y, y = e[11], e[11] = e[14], e[14] = y, t;
  }
  const r = e[0 * 4 + 0], n = e[0 * 4 + 1], o = e[0 * 4 + 2], a = e[0 * 4 + 3], s = e[1 * 4 + 0], c = e[1 * 4 + 1], i = e[1 * 4 + 2], u = e[1 * 4 + 3], f = e[2 * 4 + 0], l = e[2 * 4 + 1], _ = e[2 * 4 + 2], m = e[2 * 4 + 3], E = e[3 * 4 + 0], p = e[3 * 4 + 1], T = e[3 * 4 + 2], d = e[3 * 4 + 3];
  return t[0] = r, t[1] = s, t[2] = f, t[3] = E, t[4] = n, t[5] = c, t[6] = l, t[7] = p, t[8] = o, t[9] = i, t[10] = _, t[11] = T, t[12] = a, t[13] = u, t[14] = m, t[15] = d, t;
}
function inverse(e, t) {
  t = t || new MatType(16);
  const r = e[0 * 4 + 0], n = e[0 * 4 + 1], o = e[0 * 4 + 2], a = e[0 * 4 + 3], s = e[1 * 4 + 0], c = e[1 * 4 + 1], i = e[1 * 4 + 2], u = e[1 * 4 + 3], f = e[2 * 4 + 0], l = e[2 * 4 + 1], _ = e[2 * 4 + 2], m = e[2 * 4 + 3], E = e[3 * 4 + 0], p = e[3 * 4 + 1], T = e[3 * 4 + 2], d = e[3 * 4 + 3], y = _ * d, h = T * m, x = i * d, A = T * u, b = i * m, F = _ * u, g = o * d, R = T * a, I = o * m, N = _ * a, G = o * u, w = i * a, v = f * p, C = E * l, B = s * p, P = E * c, U = s * l, M = f * c, L = r * p, $ = E * n, O = r * l, V = f * n, k = r * c, z = s * n, H = y * c + A * l + b * p - (h * c + x * l + F * p), X = h * n + g * l + N * p - (y * n + R * l + I * p), Y = x * n + R * c + G * p - (A * n + g * c + w * p), W = F * n + I * c + w * l - (b * n + N * c + G * l), D = 1 / (r * H + s * X + f * Y + E * W);
  return t[0] = D * H, t[1] = D * X, t[2] = D * Y, t[3] = D * W, t[4] = D * (h * s + x * f + F * E - (y * s + A * f + b * E)), t[5] = D * (y * r + R * f + I * E - (h * r + g * f + N * E)), t[6] = D * (A * r + g * s + w * E - (x * r + R * s + G * E)), t[7] = D * (b * r + N * s + G * f - (F * r + I * s + w * f)), t[8] = D * (v * u + P * m + U * d - (C * u + B * m + M * d)), t[9] = D * (C * a + L * m + V * d - (v * a + $ * m + O * d)), t[10] = D * (B * a + $ * u + k * d - (P * a + L * u + z * d)), t[11] = D * (M * a + O * u + z * m - (U * a + V * u + k * m)), t[12] = D * (B * _ + M * T + C * i - (U * T + v * i + P * _)), t[13] = D * (O * T + v * o + $ * _ - (L * _ + V * T + C * o)), t[14] = D * (L * i + z * T + P * o - (k * T + B * o + $ * i)), t[15] = D * (k * _ + U * o + V * i - (O * i + z * _ + M * o)), t;
}
function multiply(e, t, r) {
  r = r || new MatType(16);
  const n = e[0], o = e[1], a = e[2], s = e[3], c = e[4 + 0], i = e[4 + 1], u = e[4 + 2], f = e[4 + 3], l = e[8 + 0], _ = e[8 + 1], m = e[8 + 2], E = e[8 + 3], p = e[12 + 0], T = e[12 + 1], d = e[12 + 2], y = e[12 + 3], h = t[0], x = t[1], A = t[2], b = t[3], F = t[4 + 0], g = t[4 + 1], R = t[4 + 2], I = t[4 + 3], N = t[8 + 0], G = t[8 + 1], w = t[8 + 2], v = t[8 + 3], C = t[12 + 0], B = t[12 + 1], P = t[12 + 2], U = t[12 + 3];
  return r[0] = n * h + c * x + l * A + p * b, r[1] = o * h + i * x + _ * A + T * b, r[2] = a * h + u * x + m * A + d * b, r[3] = s * h + f * x + E * A + y * b, r[4] = n * F + c * g + l * R + p * I, r[5] = o * F + i * g + _ * R + T * I, r[6] = a * F + u * g + m * R + d * I, r[7] = s * F + f * g + E * R + y * I, r[8] = n * N + c * G + l * w + p * v, r[9] = o * N + i * G + _ * w + T * v, r[10] = a * N + u * G + m * w + d * v, r[11] = s * N + f * G + E * w + y * v, r[12] = n * C + c * B + l * P + p * U, r[13] = o * C + i * B + _ * P + T * U, r[14] = a * C + u * B + m * P + d * U, r[15] = s * C + f * B + E * P + y * U, r;
}
function setTranslation(e, t, r) {
  return r = r || identity(), e !== r && (r[0] = e[0], r[1] = e[1], r[2] = e[2], r[3] = e[3], r[4] = e[4], r[5] = e[5], r[6] = e[6], r[7] = e[7], r[8] = e[8], r[9] = e[9], r[10] = e[10], r[11] = e[11]), r[12] = t[0], r[13] = t[1], r[14] = t[2], r[15] = 1, r;
}
function getTranslation(e, t) {
  return t = t || create$1(), t[0] = e[12], t[1] = e[13], t[2] = e[14], t;
}
function getAxis(e, t, r) {
  r = r || create$1();
  const n = t * 4;
  return r[0] = e[n + 0], r[1] = e[n + 1], r[2] = e[n + 2], r;
}
function setAxis(e, t, r, n) {
  n !== e && (n = copy(e, n));
  const o = r * 4;
  return n[o + 0] = t[0], n[o + 1] = t[1], n[o + 2] = t[2], n;
}
function perspective(e, t, r, n, o) {
  o = o || new MatType(16);
  const a = Math.tan(Math.PI * 0.5 - 0.5 * e), s = 1 / (r - n);
  return o[0] = a / t, o[1] = 0, o[2] = 0, o[3] = 0, o[4] = 0, o[5] = a, o[6] = 0, o[7] = 0, o[8] = 0, o[9] = 0, o[10] = (r + n) * s, o[11] = -1, o[12] = 0, o[13] = 0, o[14] = r * n * s * 2, o[15] = 0, o;
}
function ortho(e, t, r, n, o, a, s) {
  return s = s || new MatType(16), s[0] = 2 / (t - e), s[1] = 0, s[2] = 0, s[3] = 0, s[4] = 0, s[5] = 2 / (n - r), s[6] = 0, s[7] = 0, s[8] = 0, s[9] = 0, s[10] = 2 / (o - a), s[11] = 0, s[12] = (t + e) / (e - t), s[13] = (n + r) / (r - n), s[14] = (a + o) / (o - a), s[15] = 1, s;
}
function frustum(e, t, r, n, o, a, s) {
  s = s || new MatType(16);
  const c = t - e, i = n - r, u = o - a;
  return s[0] = 2 * o / c, s[1] = 0, s[2] = 0, s[3] = 0, s[4] = 0, s[5] = 2 * o / i, s[6] = 0, s[7] = 0, s[8] = (e + t) / c, s[9] = (n + r) / i, s[10] = a / u, s[11] = -1, s[12] = 0, s[13] = 0, s[14] = o * a / u, s[15] = 0, s;
}
let xAxis, yAxis, zAxis;
function lookAt(e, t, r, n) {
  return n = n || new MatType(16), xAxis = xAxis || create$1(), yAxis = yAxis || create$1(), zAxis = zAxis || create$1(), normalize(
    subtract(e, t, zAxis),
    zAxis
  ), normalize(cross(r, zAxis, xAxis), xAxis), normalize(cross(zAxis, xAxis, yAxis), yAxis), n[0] = xAxis[0], n[1] = xAxis[1], n[2] = xAxis[2], n[3] = 0, n[4] = yAxis[0], n[5] = yAxis[1], n[6] = yAxis[2], n[7] = 0, n[8] = zAxis[0], n[9] = zAxis[1], n[10] = zAxis[2], n[11] = 0, n[12] = e[0], n[13] = e[1], n[14] = e[2], n[15] = 1, n;
}
function translation(e, t) {
  return t = t || new MatType(16), t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = e[0], t[13] = e[1], t[14] = e[2], t[15] = 1, t;
}
function translate(e, t, r) {
  r = r || new MatType(16);
  const n = t[0], o = t[1], a = t[2], s = e[0], c = e[1], i = e[2], u = e[3], f = e[1 * 4 + 0], l = e[1 * 4 + 1], _ = e[1 * 4 + 2], m = e[1 * 4 + 3], E = e[2 * 4 + 0], p = e[2 * 4 + 1], T = e[2 * 4 + 2], d = e[2 * 4 + 3], y = e[3 * 4 + 0], h = e[3 * 4 + 1], x = e[3 * 4 + 2], A = e[3 * 4 + 3];
  return e !== r && (r[0] = s, r[1] = c, r[2] = i, r[3] = u, r[4] = f, r[5] = l, r[6] = _, r[7] = m, r[8] = E, r[9] = p, r[10] = T, r[11] = d), r[12] = s * n + f * o + E * a + y, r[13] = c * n + l * o + p * a + h, r[14] = i * n + _ * o + T * a + x, r[15] = u * n + m * o + d * a + A, r;
}
function rotationX(e, t) {
  t = t || new MatType(16);
  const r = Math.cos(e), n = Math.sin(e);
  return t[0] = 1, t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = r, t[6] = n, t[7] = 0, t[8] = 0, t[9] = -n, t[10] = r, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function rotateX(e, t, r) {
  r = r || new MatType(16);
  const n = e[4], o = e[5], a = e[6], s = e[7], c = e[8], i = e[9], u = e[10], f = e[11], l = Math.cos(t), _ = Math.sin(t);
  return r[4] = l * n + _ * c, r[5] = l * o + _ * i, r[6] = l * a + _ * u, r[7] = l * s + _ * f, r[8] = l * c - _ * n, r[9] = l * i - _ * o, r[10] = l * u - _ * a, r[11] = l * f - _ * s, e !== r && (r[0] = e[0], r[1] = e[1], r[2] = e[2], r[3] = e[3], r[12] = e[12], r[13] = e[13], r[14] = e[14], r[15] = e[15]), r;
}
function rotationY(e, t) {
  t = t || new MatType(16);
  const r = Math.cos(e), n = Math.sin(e);
  return t[0] = r, t[1] = 0, t[2] = -n, t[3] = 0, t[4] = 0, t[5] = 1, t[6] = 0, t[7] = 0, t[8] = n, t[9] = 0, t[10] = r, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function rotateY(e, t, r) {
  r = r || new MatType(16);
  const n = e[0 * 4 + 0], o = e[0 * 4 + 1], a = e[0 * 4 + 2], s = e[0 * 4 + 3], c = e[2 * 4 + 0], i = e[2 * 4 + 1], u = e[2 * 4 + 2], f = e[2 * 4 + 3], l = Math.cos(t), _ = Math.sin(t);
  return r[0] = l * n - _ * c, r[1] = l * o - _ * i, r[2] = l * a - _ * u, r[3] = l * s - _ * f, r[8] = l * c + _ * n, r[9] = l * i + _ * o, r[10] = l * u + _ * a, r[11] = l * f + _ * s, e !== r && (r[4] = e[4], r[5] = e[5], r[6] = e[6], r[7] = e[7], r[12] = e[12], r[13] = e[13], r[14] = e[14], r[15] = e[15]), r;
}
function rotationZ(e, t) {
  t = t || new MatType(16);
  const r = Math.cos(e), n = Math.sin(e);
  return t[0] = r, t[1] = n, t[2] = 0, t[3] = 0, t[4] = -n, t[5] = r, t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = 1, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function rotateZ(e, t, r) {
  r = r || new MatType(16);
  const n = e[0 * 4 + 0], o = e[0 * 4 + 1], a = e[0 * 4 + 2], s = e[0 * 4 + 3], c = e[1 * 4 + 0], i = e[1 * 4 + 1], u = e[1 * 4 + 2], f = e[1 * 4 + 3], l = Math.cos(t), _ = Math.sin(t);
  return r[0] = l * n + _ * c, r[1] = l * o + _ * i, r[2] = l * a + _ * u, r[3] = l * s + _ * f, r[4] = l * c - _ * n, r[5] = l * i - _ * o, r[6] = l * u - _ * a, r[7] = l * f - _ * s, e !== r && (r[8] = e[8], r[9] = e[9], r[10] = e[10], r[11] = e[11], r[12] = e[12], r[13] = e[13], r[14] = e[14], r[15] = e[15]), r;
}
function axisRotation(e, t, r) {
  r = r || new MatType(16);
  let n = e[0], o = e[1], a = e[2];
  const s = Math.sqrt(n * n + o * o + a * a);
  n /= s, o /= s, a /= s;
  const c = n * n, i = o * o, u = a * a, f = Math.cos(t), l = Math.sin(t), _ = 1 - f;
  return r[0] = c + (1 - c) * f, r[1] = n * o * _ + a * l, r[2] = n * a * _ - o * l, r[3] = 0, r[4] = n * o * _ - a * l, r[5] = i + (1 - i) * f, r[6] = o * a * _ + n * l, r[7] = 0, r[8] = n * a * _ + o * l, r[9] = o * a * _ - n * l, r[10] = u + (1 - u) * f, r[11] = 0, r[12] = 0, r[13] = 0, r[14] = 0, r[15] = 1, r;
}
function axisRotate(e, t, r, n) {
  n = n || new MatType(16);
  let o = t[0], a = t[1], s = t[2];
  const c = Math.sqrt(o * o + a * a + s * s);
  o /= c, a /= c, s /= c;
  const i = o * o, u = a * a, f = s * s, l = Math.cos(r), _ = Math.sin(r), m = 1 - l, E = i + (1 - i) * l, p = o * a * m + s * _, T = o * s * m - a * _, d = o * a * m - s * _, y = u + (1 - u) * l, h = a * s * m + o * _, x = o * s * m + a * _, A = a * s * m - o * _, b = f + (1 - f) * l, F = e[0], g = e[1], R = e[2], I = e[3], N = e[4], G = e[5], w = e[6], v = e[7], C = e[8], B = e[9], P = e[10], U = e[11];
  return n[0] = E * F + p * N + T * C, n[1] = E * g + p * G + T * B, n[2] = E * R + p * w + T * P, n[3] = E * I + p * v + T * U, n[4] = d * F + y * N + h * C, n[5] = d * g + y * G + h * B, n[6] = d * R + y * w + h * P, n[7] = d * I + y * v + h * U, n[8] = x * F + A * N + b * C, n[9] = x * g + A * G + b * B, n[10] = x * R + A * w + b * P, n[11] = x * I + A * v + b * U, e !== n && (n[12] = e[12], n[13] = e[13], n[14] = e[14], n[15] = e[15]), n;
}
function scaling(e, t) {
  return t = t || new MatType(16), t[0] = e[0], t[1] = 0, t[2] = 0, t[3] = 0, t[4] = 0, t[5] = e[1], t[6] = 0, t[7] = 0, t[8] = 0, t[9] = 0, t[10] = e[2], t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, t;
}
function scale(e, t, r) {
  r = r || new MatType(16);
  const n = t[0], o = t[1], a = t[2];
  return r[0] = n * e[0 * 4 + 0], r[1] = n * e[0 * 4 + 1], r[2] = n * e[0 * 4 + 2], r[3] = n * e[0 * 4 + 3], r[4] = o * e[1 * 4 + 0], r[5] = o * e[1 * 4 + 1], r[6] = o * e[1 * 4 + 2], r[7] = o * e[1 * 4 + 3], r[8] = a * e[2 * 4 + 0], r[9] = a * e[2 * 4 + 1], r[10] = a * e[2 * 4 + 2], r[11] = a * e[2 * 4 + 3], e !== r && (r[12] = e[12], r[13] = e[13], r[14] = e[14], r[15] = e[15]), r;
}
function transformPoint(e, t, r) {
  r = r || create$1();
  const n = t[0], o = t[1], a = t[2], s = n * e[0 * 4 + 3] + o * e[1 * 4 + 3] + a * e[2 * 4 + 3] + e[3 * 4 + 3];
  return r[0] = (n * e[0 * 4 + 0] + o * e[1 * 4 + 0] + a * e[2 * 4 + 0] + e[3 * 4 + 0]) / s, r[1] = (n * e[0 * 4 + 1] + o * e[1 * 4 + 1] + a * e[2 * 4 + 1] + e[3 * 4 + 1]) / s, r[2] = (n * e[0 * 4 + 2] + o * e[1 * 4 + 2] + a * e[2 * 4 + 2] + e[3 * 4 + 2]) / s, r;
}
function transformDirection(e, t, r) {
  r = r || create$1();
  const n = t[0], o = t[1], a = t[2];
  return r[0] = n * e[0 * 4 + 0] + o * e[1 * 4 + 0] + a * e[2 * 4 + 0], r[1] = n * e[0 * 4 + 1] + o * e[1 * 4 + 1] + a * e[2 * 4 + 1], r[2] = n * e[0 * 4 + 2] + o * e[1 * 4 + 2] + a * e[2 * 4 + 2], r;
}
function transformNormal$1(e, t, r) {
  r = r || create$1();
  const n = inverse(e), o = t[0], a = t[1], s = t[2];
  return r[0] = o * n[0 * 4 + 0] + a * n[0 * 4 + 1] + s * n[0 * 4 + 2], r[1] = o * n[1 * 4 + 0] + a * n[1 * 4 + 1] + s * n[1 * 4 + 2], r[2] = o * n[2 * 4 + 0] + a * n[2 * 4 + 1] + s * n[2 * 4 + 2], r;
}
var m4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  axisRotate,
  axisRotation,
  copy,
  create,
  frustum,
  getAxis,
  getTranslation,
  identity,
  inverse,
  lookAt,
  multiply,
  negate,
  ortho,
  perspective,
  rotateX,
  rotateY,
  rotateZ,
  rotationX,
  rotationY,
  rotationZ,
  scale,
  scaling,
  setAxis,
  setDefaultType,
  setTranslation,
  transformDirection,
  transformNormal: transformNormal$1,
  transformPoint,
  translate,
  translation,
  transpose
});
const BYTE$2 = 5120, UNSIGNED_BYTE$3 = 5121, SHORT$2 = 5122, UNSIGNED_SHORT$3 = 5123, INT$3 = 5124, UNSIGNED_INT$3 = 5125, FLOAT$3 = 5126, UNSIGNED_SHORT_4_4_4_4$1 = 32819, UNSIGNED_SHORT_5_5_5_1$1 = 32820, UNSIGNED_SHORT_5_6_5$1 = 33635, HALF_FLOAT$1 = 5131, UNSIGNED_INT_2_10_10_10_REV$1 = 33640, UNSIGNED_INT_10F_11F_11F_REV$1 = 35899, UNSIGNED_INT_5_9_9_9_REV$1 = 35902, FLOAT_32_UNSIGNED_INT_24_8_REV$1 = 36269, UNSIGNED_INT_24_8$1 = 34042, glTypeToTypedArray = {};
{
  const e = glTypeToTypedArray;
  e[BYTE$2] = Int8Array, e[UNSIGNED_BYTE$3] = Uint8Array, e[SHORT$2] = Int16Array, e[UNSIGNED_SHORT$3] = Uint16Array, e[INT$3] = Int32Array, e[UNSIGNED_INT$3] = Uint32Array, e[FLOAT$3] = Float32Array, e[UNSIGNED_SHORT_4_4_4_4$1] = Uint16Array, e[UNSIGNED_SHORT_5_5_5_1$1] = Uint16Array, e[UNSIGNED_SHORT_5_6_5$1] = Uint16Array, e[HALF_FLOAT$1] = Uint16Array, e[UNSIGNED_INT_2_10_10_10_REV$1] = Uint32Array, e[UNSIGNED_INT_10F_11F_11F_REV$1] = Uint32Array, e[UNSIGNED_INT_5_9_9_9_REV$1] = Uint32Array, e[FLOAT_32_UNSIGNED_INT_24_8_REV$1] = Uint32Array, e[UNSIGNED_INT_24_8$1] = Uint32Array;
}
function getGLTypeForTypedArray(e) {
  if (e instanceof Int8Array)
    return BYTE$2;
  if (e instanceof Uint8Array || e instanceof Uint8ClampedArray)
    return UNSIGNED_BYTE$3;
  if (e instanceof Int16Array)
    return SHORT$2;
  if (e instanceof Uint16Array)
    return UNSIGNED_SHORT$3;
  if (e instanceof Int32Array)
    return INT$3;
  if (e instanceof Uint32Array)
    return UNSIGNED_INT$3;
  if (e instanceof Float32Array)
    return FLOAT$3;
  throw new Error("unsupported typed array type");
}
function getGLTypeForTypedArrayType(e) {
  if (e === Int8Array)
    return BYTE$2;
  if (e === Uint8Array || e === Uint8ClampedArray)
    return UNSIGNED_BYTE$3;
  if (e === Int16Array)
    return SHORT$2;
  if (e === Uint16Array)
    return UNSIGNED_SHORT$3;
  if (e === Int32Array)
    return INT$3;
  if (e === Uint32Array)
    return UNSIGNED_INT$3;
  if (e === Float32Array)
    return FLOAT$3;
  throw new Error("unsupported typed array type");
}
function getTypedArrayTypeForGLType(e) {
  const t = glTypeToTypedArray[e];
  if (!t)
    throw new Error("unknown gl type");
  return t;
}
const isArrayBuffer$1 = typeof SharedArrayBuffer < "u" ? function(t) {
  return t && t.buffer && (t.buffer instanceof ArrayBuffer || t.buffer instanceof SharedArrayBuffer);
} : function(t) {
  return t && t.buffer && t.buffer instanceof ArrayBuffer;
};
var typedarrays = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  getGLTypeForTypedArray,
  getGLTypeForTypedArrayType,
  getTypedArrayTypeForGLType,
  isArrayBuffer: isArrayBuffer$1
});
function copyNamedProperties(e, t, r) {
  e.forEach(function(n) {
    const o = t[n];
    o !== void 0 && (r[n] = o);
  });
}
function copyExistingProperties(e, t) {
  Object.keys(t).forEach(function(r) {
    t.hasOwnProperty(r) && e.hasOwnProperty(r) && (t[r] = e[r]);
  });
}
function error$1(...e) {
  console.error(...e);
}
function warn$1(...e) {
  console.warn(...e);
}
const isTypeWeakMaps = /* @__PURE__ */ new Map();
function isType(e, t) {
  if (!e || typeof e != "object")
    return !1;
  let r = isTypeWeakMaps.get(t);
  r || (r = /* @__PURE__ */ new WeakMap(), isTypeWeakMaps.set(t, r));
  let n = r.get(e);
  if (n === void 0) {
    const o = Object.prototype.toString.call(e);
    n = o.substring(8, o.length - 1) === t, r.set(e, n);
  }
  return n;
}
function isBuffer(e, t) {
  return typeof WebGLBuffer < "u" && isType(t, "WebGLBuffer");
}
function isRenderbuffer(e, t) {
  return typeof WebGLRenderbuffer < "u" && isType(t, "WebGLRenderbuffer");
}
function isTexture(e, t) {
  return typeof WebGLTexture < "u" && isType(t, "WebGLTexture");
}
function isSampler(e, t) {
  return typeof WebGLSampler < "u" && isType(t, "WebGLSampler");
}
const STATIC_DRAW = 35044, ARRAY_BUFFER$1 = 34962, ELEMENT_ARRAY_BUFFER$2 = 34963, BUFFER_SIZE = 34660, BYTE$1 = 5120, UNSIGNED_BYTE$2 = 5121, SHORT$1 = 5122, UNSIGNED_SHORT$2 = 5123, INT$2 = 5124, UNSIGNED_INT$2 = 5125, FLOAT$2 = 5126, defaults$2 = {
  attribPrefix: ""
};
function setAttributePrefix(e) {
  defaults$2.attribPrefix = e;
}
function setDefaults$2(e) {
  copyExistingProperties(e, defaults$2);
}
function setBufferFromTypedArray(e, t, r, n, o) {
  e.bindBuffer(t, r), e.bufferData(t, n, o || STATIC_DRAW);
}
function createBufferFromTypedArray(e, t, r, n) {
  if (isBuffer(e, t))
    return t;
  r = r || ARRAY_BUFFER$1;
  const o = e.createBuffer();
  return setBufferFromTypedArray(e, r, o, t, n), o;
}
function isIndices(e) {
  return e === "indices";
}
function getNormalizationForTypedArrayType(e) {
  return e === Int8Array || e === Uint8Array;
}
function getArray$1(e) {
  return e.length ? e : e.data;
}
const texcoordRE = /coord|texture/i, colorRE = /color|colour/i;
function guessNumComponentsFromName(e, t) {
  let r;
  if (texcoordRE.test(e) ? r = 2 : colorRE.test(e) ? r = 4 : r = 3, t % r > 0)
    throw new Error(`Can not guess numComponents for attribute '${e}'. Tried ${r} but ${t} values is not evenly divisible by ${r}. You should specify it.`);
  return r;
}
function getNumComponents$1(e, t, r) {
  return e.numComponents || e.size || guessNumComponentsFromName(t, r || getArray$1(e).length);
}
function makeTypedArray(e, t) {
  if (isArrayBuffer$1(e))
    return e;
  if (isArrayBuffer$1(e.data))
    return e.data;
  Array.isArray(e) && (e = {
    data: e
  });
  let r = e.type ? typedArrayTypeFromGLTypeOrTypedArrayCtor(e.type) : void 0;
  return r || (isIndices(t) ? r = Uint16Array : r = Float32Array), new r(e.data);
}
function glTypeFromGLTypeOrTypedArrayType(e) {
  return typeof e == "number" ? e : e ? getGLTypeForTypedArrayType(e) : FLOAT$2;
}
function typedArrayTypeFromGLTypeOrTypedArrayCtor(e) {
  return typeof e == "number" ? getTypedArrayTypeForGLType(e) : e || Float32Array;
}
function attribBufferFromBuffer(e, t) {
  return {
    buffer: t.buffer,
    numValues: 2 * 3 * 4,
    // safely divided by 2, 3, 4
    type: glTypeFromGLTypeOrTypedArrayType(t.type),
    arrayType: typedArrayTypeFromGLTypeOrTypedArrayCtor(t.type)
  };
}
function attribBufferFromSize(e, t) {
  const r = t.data || t, n = typedArrayTypeFromGLTypeOrTypedArrayCtor(t.type), o = r * n.BYTES_PER_ELEMENT, a = e.createBuffer();
  return e.bindBuffer(ARRAY_BUFFER$1, a), e.bufferData(ARRAY_BUFFER$1, o, t.drawType || STATIC_DRAW), {
    buffer: a,
    numValues: r,
    type: getGLTypeForTypedArrayType(n),
    arrayType: n
  };
}
function attribBufferFromArrayLike(e, t, r) {
  const n = makeTypedArray(t, r);
  return {
    arrayType: n.constructor,
    buffer: createBufferFromTypedArray(e, n, void 0, t.drawType),
    type: getGLTypeForTypedArray(n),
    numValues: 0
  };
}
function createAttribsFromArrays(e, t) {
  const r = {};
  return Object.keys(t).forEach(function(n) {
    if (!isIndices(n)) {
      const o = t[n], a = o.attrib || o.name || o.attribName || defaults$2.attribPrefix + n;
      if (o.value) {
        if (!Array.isArray(o.value) && !isArrayBuffer$1(o.value))
          throw new Error("array.value is not array or typedarray");
        r[a] = {
          value: o.value
        };
      } else {
        let s;
        o.buffer && o.buffer instanceof WebGLBuffer ? s = attribBufferFromBuffer : typeof o == "number" || typeof o.data == "number" ? s = attribBufferFromSize : s = attribBufferFromArrayLike;
        const { buffer: c, type: i, numValues: u, arrayType: f } = s(e, o, n), l = o.normalize !== void 0 ? o.normalize : getNormalizationForTypedArrayType(f), _ = getNumComponents$1(o, n, u);
        r[a] = {
          buffer: c,
          numComponents: _,
          type: i,
          normalize: l,
          stride: o.stride || 0,
          offset: o.offset || 0,
          divisor: o.divisor === void 0 ? void 0 : o.divisor,
          drawType: o.drawType
        };
      }
    }
  }), e.bindBuffer(ARRAY_BUFFER$1, null), r;
}
function setAttribInfoBufferFromArray(e, t, r, n) {
  r = makeTypedArray(r), n !== void 0 ? (e.bindBuffer(ARRAY_BUFFER$1, t.buffer), e.bufferSubData(ARRAY_BUFFER$1, n, r)) : setBufferFromTypedArray(e, ARRAY_BUFFER$1, t.buffer, r, t.drawType);
}
function getBytesPerValueForGLType(e, t) {
  return t === BYTE$1 || t === UNSIGNED_BYTE$2 ? 1 : t === SHORT$1 || t === UNSIGNED_SHORT$2 ? 2 : t === INT$2 || t === UNSIGNED_INT$2 || t === FLOAT$2 ? 4 : 0;
}
const positionKeys = ["position", "positions", "a_position"];
function getNumElementsFromNonIndexedArrays(e) {
  let t, r;
  for (r = 0; r < positionKeys.length && (t = positionKeys[r], !(t in e)); ++r)
    ;
  r === positionKeys.length && (t = Object.keys(e)[0]);
  const n = e[t], o = getArray$1(n).length;
  if (o === void 0)
    return 1;
  const a = getNumComponents$1(n, t), s = o / a;
  if (o % a > 0)
    throw new Error(`numComponents ${a} not correct for length ${o}`);
  return s;
}
function getNumElementsFromAttributes(e, t) {
  let r, n;
  for (n = 0; n < positionKeys.length && (r = positionKeys[n], !(r in t || (r = defaults$2.attribPrefix + r, r in t))); ++n)
    ;
  n === positionKeys.length && (r = Object.keys(t)[0]);
  const o = t[r];
  if (!o.buffer)
    return 1;
  e.bindBuffer(ARRAY_BUFFER$1, o.buffer);
  const a = e.getBufferParameter(ARRAY_BUFFER$1, BUFFER_SIZE);
  e.bindBuffer(ARRAY_BUFFER$1, null);
  const s = getBytesPerValueForGLType(e, o.type), c = a / s, i = o.numComponents || o.size, u = c / i;
  if (u % 1 !== 0)
    throw new Error(`numComponents ${i} not correct for length ${length}`);
  return u;
}
function createBufferInfoFromArrays(e, t, r) {
  const n = createAttribsFromArrays(e, t), o = Object.assign({}, r || {});
  o.attribs = Object.assign({}, r ? r.attribs : {}, n);
  const a = t.indices;
  if (a) {
    const s = makeTypedArray(a, "indices");
    o.indices = createBufferFromTypedArray(e, s, ELEMENT_ARRAY_BUFFER$2), o.numElements = s.length, o.elementType = getGLTypeForTypedArray(s);
  } else
    o.numElements || (o.numElements = getNumElementsFromAttributes(e, o.attribs));
  return o;
}
function createBufferFromArray(e, t, r) {
  const n = r === "indices" ? ELEMENT_ARRAY_BUFFER$2 : ARRAY_BUFFER$1, o = makeTypedArray(t, r);
  return createBufferFromTypedArray(e, o, n);
}
function createBuffersFromArrays(e, t) {
  const r = {};
  return Object.keys(t).forEach(function(n) {
    r[n] = createBufferFromArray(e, t[n], n);
  }), t.indices ? (r.numElements = t.indices.length, r.elementType = getGLTypeForTypedArray(makeTypedArray(t.indices))) : r.numElements = getNumElementsFromNonIndexedArrays(t), r;
}
var attributes = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  createAttribsFromArrays,
  createBuffersFromArrays,
  createBufferFromArray,
  createBufferFromTypedArray,
  createBufferInfoFromArrays,
  setAttribInfoBufferFromArray,
  setAttributePrefix,
  setAttributeDefaults_: setDefaults$2,
  getNumComponents_: getNumComponents$1,
  getArray_: getArray$1
});
const getArray = getArray$1, getNumComponents = getNumComponents$1;
function augmentTypedArray(e, t) {
  let r = 0;
  return e.push = function() {
    for (let n = 0; n < arguments.length; ++n) {
      const o = arguments[n];
      if (o instanceof Array || isArrayBuffer$1(o))
        for (let a = 0; a < o.length; ++a)
          e[r++] = o[a];
      else
        e[r++] = o;
    }
  }, e.reset = function(n) {
    r = n || 0;
  }, e.numComponents = t, Object.defineProperty(e, "numElements", {
    get: function() {
      return this.length / this.numComponents | 0;
    }
  }), e;
}
function createAugmentedTypedArray(e, t, r) {
  const n = r || Float32Array;
  return augmentTypedArray(new n(e * t), e);
}
function allButIndices(e) {
  return e !== "indices";
}
function deindexVertices(e) {
  const t = e.indices, r = {}, n = t.length;
  function o(a) {
    const s = e[a], c = s.numComponents, i = createAugmentedTypedArray(c, n, s.constructor);
    for (let u = 0; u < n; ++u) {
      const l = t[u] * c;
      for (let _ = 0; _ < c; ++_)
        i.push(s[l + _]);
    }
    r[a] = i;
  }
  return Object.keys(e).filter(allButIndices).forEach(o), r;
}
function flattenNormals(e) {
  if (e.indices)
    throw new Error("can not flatten normals of indexed vertices. deindex them first");
  const t = e.normal, r = t.length;
  for (let n = 0; n < r; n += 9) {
    const o = t[n + 0], a = t[n + 1], s = t[n + 2], c = t[n + 3], i = t[n + 4], u = t[n + 5], f = t[n + 6], l = t[n + 7], _ = t[n + 8];
    let m = o + c + f, E = a + i + l, p = s + u + _;
    const T = Math.sqrt(m * m + E * E + p * p);
    m /= T, E /= T, p /= T, t[n + 0] = m, t[n + 1] = E, t[n + 2] = p, t[n + 3] = m, t[n + 4] = E, t[n + 5] = p, t[n + 6] = m, t[n + 7] = E, t[n + 8] = p;
  }
  return e;
}
function applyFuncToV3Array(e, t, r) {
  const n = e.length, o = new Float32Array(3);
  for (let a = 0; a < n; a += 3)
    r(t, [e[a], e[a + 1], e[a + 2]], o), e[a] = o[0], e[a + 1] = o[1], e[a + 2] = o[2];
}
function transformNormal(e, t, r) {
  r = r || create$1();
  const n = t[0], o = t[1], a = t[2];
  return r[0] = n * e[0 * 4 + 0] + o * e[0 * 4 + 1] + a * e[0 * 4 + 2], r[1] = n * e[1 * 4 + 0] + o * e[1 * 4 + 1] + a * e[1 * 4 + 2], r[2] = n * e[2 * 4 + 0] + o * e[2 * 4 + 1] + a * e[2 * 4 + 2], r;
}
function reorientDirections(e, t) {
  return applyFuncToV3Array(e, t, transformDirection), e;
}
function reorientNormals(e, t) {
  return applyFuncToV3Array(e, inverse(t), transformNormal), e;
}
function reorientPositions(e, t) {
  return applyFuncToV3Array(e, t, transformPoint), e;
}
function reorientVertices(e, t) {
  return Object.keys(e).forEach(function(r) {
    const n = e[r];
    r.indexOf("pos") >= 0 ? reorientPositions(n, t) : r.indexOf("tan") >= 0 || r.indexOf("binorm") >= 0 ? reorientDirections(n, t) : r.indexOf("norm") >= 0 && reorientNormals(n, t);
  }), e;
}
function createXYQuadVertices(e, t, r) {
  return e = e || 2, t = t || 0, r = r || 0, e *= 0.5, {
    position: {
      numComponents: 2,
      data: [
        t + -1 * e,
        r + -1 * e,
        t + 1 * e,
        r + -1 * e,
        t + -1 * e,
        r + 1 * e,
        t + 1 * e,
        r + 1 * e
      ]
    },
    normal: [
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1
    ],
    texcoord: [
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      1
    ],
    indices: [0, 1, 2, 2, 1, 3]
  };
}
function createPlaneVertices(e, t, r, n, o) {
  e = e || 1, t = t || 1, r = r || 1, n = n || 1, o = o || identity();
  const a = (r + 1) * (n + 1), s = createAugmentedTypedArray(3, a), c = createAugmentedTypedArray(3, a), i = createAugmentedTypedArray(2, a);
  for (let _ = 0; _ <= n; _++)
    for (let m = 0; m <= r; m++) {
      const E = m / r, p = _ / n;
      s.push(
        e * E - e * 0.5,
        0,
        t * p - t * 0.5
      ), c.push(0, 1, 0), i.push(E, p);
    }
  const u = r + 1, f = createAugmentedTypedArray(
    3,
    r * n * 2,
    Uint16Array
  );
  for (let _ = 0; _ < n; _++)
    for (let m = 0; m < r; m++)
      f.push(
        (_ + 0) * u + m,
        (_ + 1) * u + m,
        (_ + 0) * u + m + 1
      ), f.push(
        (_ + 1) * u + m,
        (_ + 1) * u + m + 1,
        (_ + 0) * u + m + 1
      );
  return reorientVertices({
    position: s,
    normal: c,
    texcoord: i,
    indices: f
  }, o);
}
function createSphereVertices(e, t, r, n, o, a, s) {
  if (t <= 0 || r <= 0)
    throw new Error("subdivisionAxis and subdivisionHeight must be > 0");
  n = n || 0, o = o || Math.PI, a = a || 0, s = s || Math.PI * 2;
  const c = o - n, i = s - a, u = (t + 1) * (r + 1), f = createAugmentedTypedArray(3, u), l = createAugmentedTypedArray(3, u), _ = createAugmentedTypedArray(2, u);
  for (let p = 0; p <= r; p++)
    for (let T = 0; T <= t; T++) {
      const d = T / t, y = p / r, h = i * d + a, x = c * y + n, A = Math.sin(h), b = Math.cos(h), F = Math.sin(x), g = Math.cos(x), R = b * F, I = g, N = A * F;
      f.push(e * R, e * I, e * N), l.push(R, I, N), _.push(1 - d, y);
    }
  const m = t + 1, E = createAugmentedTypedArray(3, t * r * 2, Uint16Array);
  for (let p = 0; p < t; p++)
    for (let T = 0; T < r; T++)
      E.push(
        (T + 0) * m + p,
        (T + 0) * m + p + 1,
        (T + 1) * m + p
      ), E.push(
        (T + 1) * m + p,
        (T + 0) * m + p + 1,
        (T + 1) * m + p + 1
      );
  return {
    position: f,
    normal: l,
    texcoord: _,
    indices: E
  };
}
const CUBE_FACE_INDICES = [
  [3, 7, 5, 1],
  // right
  [6, 2, 0, 4],
  // left
  [6, 7, 3, 2],
  // ??
  [0, 1, 5, 4],
  // ??
  [7, 6, 4, 5],
  // front
  [2, 3, 1, 0]
  // back
];
function createCubeVertices(e) {
  e = e || 1;
  const t = e / 2, r = [
    [-t, -t, -t],
    [+t, -t, -t],
    [-t, +t, -t],
    [+t, +t, -t],
    [-t, -t, +t],
    [+t, -t, +t],
    [-t, +t, +t],
    [+t, +t, +t]
  ], n = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1]
  ], o = [
    [1, 0],
    [0, 0],
    [0, 1],
    [1, 1]
  ], a = 6 * 4, s = createAugmentedTypedArray(3, a), c = createAugmentedTypedArray(3, a), i = createAugmentedTypedArray(2, a), u = createAugmentedTypedArray(3, 6 * 2, Uint16Array);
  for (let f = 0; f < 6; ++f) {
    const l = CUBE_FACE_INDICES[f];
    for (let m = 0; m < 4; ++m) {
      const E = r[l[m]], p = n[f], T = o[m];
      s.push(E), c.push(p), i.push(T);
    }
    const _ = 4 * f;
    u.push(_ + 0, _ + 1, _ + 2), u.push(_ + 0, _ + 2, _ + 3);
  }
  return {
    position: s,
    normal: c,
    texcoord: i,
    indices: u
  };
}
function createTruncatedConeVertices(e, t, r, n, o, a, s) {
  if (n < 3)
    throw new Error("radialSubdivisions must be 3 or greater");
  if (o < 1)
    throw new Error("verticalSubdivisions must be 1 or greater");
  const c = a === void 0 ? !0 : a, i = s === void 0 ? !0 : s, u = (c ? 2 : 0) + (i ? 2 : 0), f = (n + 1) * (o + 1 + u), l = createAugmentedTypedArray(3, f), _ = createAugmentedTypedArray(3, f), m = createAugmentedTypedArray(2, f), E = createAugmentedTypedArray(3, n * (o + u / 2) * 2, Uint16Array), p = n + 1, T = Math.atan2(e - t, r), d = Math.cos(T), y = Math.sin(T), h = c ? -2 : 0, x = o + (i ? 2 : 0);
  for (let A = h; A <= x; ++A) {
    let b = A / o, F = r * b, g;
    A < 0 ? (F = 0, b = 1, g = e) : A > o ? (F = r, b = 1, g = t) : g = e + (t - e) * (A / o), (A === -2 || A === o + 2) && (g = 0, b = 0), F -= r / 2;
    for (let R = 0; R < p; ++R) {
      const I = Math.sin(R * Math.PI * 2 / n), N = Math.cos(R * Math.PI * 2 / n);
      l.push(I * g, F, N * g), A < 0 ? _.push(0, -1, 0) : A > o ? _.push(0, 1, 0) : g === 0 ? _.push(0, 0, 0) : _.push(I * d, y, N * d), m.push(R / n, 1 - b);
    }
  }
  for (let A = 0; A < o + u; ++A)
    if (!(A === 1 && c || A === o + u - 2 && i))
      for (let b = 0; b < n; ++b)
        E.push(
          p * (A + 0) + 0 + b,
          p * (A + 0) + 1 + b,
          p * (A + 1) + 1 + b
        ), E.push(
          p * (A + 0) + 0 + b,
          p * (A + 1) + 1 + b,
          p * (A + 1) + 0 + b
        );
  return {
    position: l,
    normal: _,
    texcoord: m,
    indices: E
  };
}
function expandRLEData(e, t) {
  t = t || [];
  const r = [];
  for (let n = 0; n < e.length; n += 4) {
    const o = e[n], a = e.slice(n + 1, n + 4);
    a.push.apply(a, t);
    for (let s = 0; s < o; ++s)
      r.push.apply(r, a);
  }
  return r;
}
function create3DFVertices() {
  const e = [
    // left column front
    0,
    0,
    0,
    0,
    150,
    0,
    30,
    0,
    0,
    0,
    150,
    0,
    30,
    150,
    0,
    30,
    0,
    0,
    // top rung front
    30,
    0,
    0,
    30,
    30,
    0,
    100,
    0,
    0,
    30,
    30,
    0,
    100,
    30,
    0,
    100,
    0,
    0,
    // middle rung front
    30,
    60,
    0,
    30,
    90,
    0,
    67,
    60,
    0,
    30,
    90,
    0,
    67,
    90,
    0,
    67,
    60,
    0,
    // left column back
    0,
    0,
    30,
    30,
    0,
    30,
    0,
    150,
    30,
    0,
    150,
    30,
    30,
    0,
    30,
    30,
    150,
    30,
    // top rung back
    30,
    0,
    30,
    100,
    0,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    100,
    0,
    30,
    100,
    30,
    30,
    // middle rung back
    30,
    60,
    30,
    67,
    60,
    30,
    30,
    90,
    30,
    30,
    90,
    30,
    67,
    60,
    30,
    67,
    90,
    30,
    // top
    0,
    0,
    0,
    100,
    0,
    0,
    100,
    0,
    30,
    0,
    0,
    0,
    100,
    0,
    30,
    0,
    0,
    30,
    // top rung front
    100,
    0,
    0,
    100,
    30,
    0,
    100,
    30,
    30,
    100,
    0,
    0,
    100,
    30,
    30,
    100,
    0,
    30,
    // under top rung
    30,
    30,
    0,
    30,
    30,
    30,
    100,
    30,
    30,
    30,
    30,
    0,
    100,
    30,
    30,
    100,
    30,
    0,
    // between top rung and middle
    30,
    30,
    0,
    30,
    60,
    30,
    30,
    30,
    30,
    30,
    30,
    0,
    30,
    60,
    0,
    30,
    60,
    30,
    // top of middle rung
    30,
    60,
    0,
    67,
    60,
    30,
    30,
    60,
    30,
    30,
    60,
    0,
    67,
    60,
    0,
    67,
    60,
    30,
    // front of middle rung
    67,
    60,
    0,
    67,
    90,
    30,
    67,
    60,
    30,
    67,
    60,
    0,
    67,
    90,
    0,
    67,
    90,
    30,
    // bottom of middle rung.
    30,
    90,
    0,
    30,
    90,
    30,
    67,
    90,
    30,
    30,
    90,
    0,
    67,
    90,
    30,
    67,
    90,
    0,
    // front of bottom
    30,
    90,
    0,
    30,
    150,
    30,
    30,
    90,
    30,
    30,
    90,
    0,
    30,
    150,
    0,
    30,
    150,
    30,
    // bottom
    0,
    150,
    0,
    0,
    150,
    30,
    30,
    150,
    30,
    0,
    150,
    0,
    30,
    150,
    30,
    30,
    150,
    0,
    // left side
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    150,
    30,
    0,
    0,
    0,
    0,
    150,
    30,
    0,
    150,
    0
  ], t = [
    // left column front
    0.22,
    0.19,
    0.22,
    0.79,
    0.34,
    0.19,
    0.22,
    0.79,
    0.34,
    0.79,
    0.34,
    0.19,
    // top rung front
    0.34,
    0.19,
    0.34,
    0.31,
    0.62,
    0.19,
    0.34,
    0.31,
    0.62,
    0.31,
    0.62,
    0.19,
    // middle rung front
    0.34,
    0.43,
    0.34,
    0.55,
    0.49,
    0.43,
    0.34,
    0.55,
    0.49,
    0.55,
    0.49,
    0.43,
    // left column back
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1,
    // top rung back
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1,
    // middle rung back
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1,
    // top
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    // top rung front
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    // under top rung
    0,
    0,
    0,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    1,
    0,
    // between top rung and middle
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    // top of middle rung
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    // front of middle rung
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    // bottom of middle rung.
    0,
    0,
    0,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    1,
    0,
    // front of bottom
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    // bottom
    0,
    0,
    0,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    1,
    0,
    // left side
    0,
    0,
    0,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    1,
    0
  ], r = expandRLEData([
    // left column front
    // top rung front
    // middle rung front
    18,
    0,
    0,
    1,
    // left column back
    // top rung back
    // middle rung back
    18,
    0,
    0,
    -1,
    // top
    6,
    0,
    1,
    0,
    // top rung front
    6,
    1,
    0,
    0,
    // under top rung
    6,
    0,
    -1,
    0,
    // between top rung and middle
    6,
    1,
    0,
    0,
    // top of middle rung
    6,
    0,
    1,
    0,
    // front of middle rung
    6,
    1,
    0,
    0,
    // bottom of middle rung.
    6,
    0,
    -1,
    0,
    // front of bottom
    6,
    1,
    0,
    0,
    // bottom
    6,
    0,
    -1,
    0,
    // left side
    6,
    -1,
    0,
    0
  ]), n = expandRLEData([
    // left column front
    // top rung front
    // middle rung front
    18,
    200,
    70,
    120,
    // left column back
    // top rung back
    // middle rung back
    18,
    80,
    70,
    200,
    // top
    6,
    70,
    200,
    210,
    // top rung front
    6,
    200,
    200,
    70,
    // under top rung
    6,
    210,
    100,
    70,
    // between top rung and middle
    6,
    210,
    160,
    70,
    // top of middle rung
    6,
    70,
    180,
    210,
    // front of middle rung
    6,
    100,
    70,
    210,
    // bottom of middle rung.
    6,
    76,
    210,
    100,
    // front of bottom
    6,
    140,
    210,
    80,
    // bottom
    6,
    90,
    130,
    110,
    // left side
    6,
    160,
    160,
    220
  ], [255]), o = e.length / 3, a = {
    position: createAugmentedTypedArray(3, o),
    texcoord: createAugmentedTypedArray(2, o),
    normal: createAugmentedTypedArray(3, o),
    color: createAugmentedTypedArray(4, o, Uint8Array),
    indices: createAugmentedTypedArray(3, o / 3, Uint16Array)
  };
  a.position.push(e), a.texcoord.push(t), a.normal.push(r), a.color.push(n);
  for (let s = 0; s < o; ++s)
    a.indices.push(s);
  return a;
}
function createCrescentVertices(e, t, r, n, o, a, s) {
  if (o <= 0)
    throw new Error("subdivisionDown must be > 0");
  a = a || 0, s = s || 1;
  const c = 2, i = s - a, u = (o + 1) * 2 * (2 + c), f = createAugmentedTypedArray(3, u), l = createAugmentedTypedArray(3, u), _ = createAugmentedTypedArray(2, u);
  function m(y, h, x) {
    return y + (h - y) * x;
  }
  function E(y, h, x, A, b, F) {
    for (let g = 0; g <= o; g++) {
      const R = h / (c - 1), I = g / o, N = (R - 0.5) * 2, G = (a + I * i) * Math.PI, w = Math.sin(G), v = Math.cos(G), C = m(e, y, w), B = N * n, P = v * e, U = w * C;
      f.push(B, P, U);
      const M = add(multiply$1([0, w, v], x), A);
      l.push(M), _.push(R * b + F, I);
    }
  }
  for (let y = 0; y < c; y++) {
    const h = (y / (c - 1) - 0.5) * 2;
    E(t, y, [1, 1, 1], [0, 0, 0], 1, 0), E(t, y, [0, 0, 0], [h, 0, 0], 0, 0), E(r, y, [1, 1, 1], [0, 0, 0], 1, 0), E(r, y, [0, 0, 0], [h, 0, 0], 0, 1);
  }
  const p = createAugmentedTypedArray(3, o * 2 * (2 + c), Uint16Array);
  function T(y, h) {
    for (let x = 0; x < o; ++x)
      p.push(
        y + x + 0,
        y + x + 1,
        h + x + 0
      ), p.push(
        y + x + 1,
        h + x + 1,
        h + x + 0
      );
  }
  const d = o + 1;
  return T(d * 0, d * 4), T(d * 5, d * 7), T(d * 6, d * 2), T(d * 3, d * 1), {
    position: f,
    normal: l,
    texcoord: _,
    indices: p
  };
}
function createCylinderVertices(e, t, r, n, o, a) {
  return createTruncatedConeVertices(
    e,
    e,
    t,
    r,
    n,
    o,
    a
  );
}
function createTorusVertices(e, t, r, n, o, a) {
  if (r < 3)
    throw new Error("radialSubdivisions must be 3 or greater");
  if (n < 3)
    throw new Error("verticalSubdivisions must be 3 or greater");
  o = o || 0, a = a || Math.PI * 2;
  const s = a - o, c = r + 1, i = n + 1, u = c * i, f = createAugmentedTypedArray(3, u), l = createAugmentedTypedArray(3, u), _ = createAugmentedTypedArray(2, u), m = createAugmentedTypedArray(3, r * n * 2, Uint16Array);
  for (let E = 0; E < i; ++E) {
    const p = E / n, T = p * Math.PI * 2, d = Math.sin(T), y = e + d * t, h = Math.cos(T), x = h * t;
    for (let A = 0; A < c; ++A) {
      const b = A / r, F = o + b * s, g = Math.sin(F), R = Math.cos(F), I = g * y, N = R * y, G = g * d, w = R * d;
      f.push(I, x, N), l.push(G, h, w), _.push(b, 1 - p);
    }
  }
  for (let E = 0; E < n; ++E)
    for (let p = 0; p < r; ++p) {
      const T = 1 + p, d = 1 + E;
      m.push(
        c * E + p,
        c * d + p,
        c * E + T
      ), m.push(
        c * d + p,
        c * d + T,
        c * E + T
      );
    }
  return {
    position: f,
    normal: l,
    texcoord: _,
    indices: m
  };
}
function createDiscVertices(e, t, r, n, o) {
  if (t < 3)
    throw new Error("divisions must be at least 3");
  r = r || 1, o = o || 1, n = n || 0;
  const a = (t + 1) * (r + 1), s = createAugmentedTypedArray(3, a), c = createAugmentedTypedArray(3, a), i = createAugmentedTypedArray(2, a), u = createAugmentedTypedArray(3, r * t * 2, Uint16Array);
  let f = 0;
  const l = e - n, _ = t + 1;
  for (let m = 0; m <= r; ++m) {
    const E = n + l * Math.pow(m / r, o);
    for (let p = 0; p <= t; ++p) {
      const T = 2 * Math.PI * p / t, d = E * Math.cos(T), y = E * Math.sin(T);
      if (s.push(d, 0, y), c.push(0, 1, 0), i.push(1 - p / t, m / r), m > 0 && p !== t) {
        const h = f + (p + 1), x = f + p, A = f + p - _, b = f + (p + 1) - _;
        u.push(h, x, A), u.push(h, A, b);
      }
    }
    f += t + 1;
  }
  return {
    position: s,
    normal: c,
    texcoord: i,
    indices: u
  };
}
function randInt(e) {
  return Math.random() * e | 0;
}
function makeRandomVertexColors(e, t) {
  t = t || {};
  const r = e.position.numElements, n = createAugmentedTypedArray(4, r, Uint8Array), o = t.rand || function(a, s) {
    return s < 3 ? randInt(256) : 255;
  };
  if (e.color = n, e.indices)
    for (let a = 0; a < r; ++a)
      n.push(o(a, 0), o(a, 1), o(a, 2), o(a, 3));
  else {
    const a = t.vertsPerColor || 3, s = r / a;
    for (let c = 0; c < s; ++c) {
      const i = [o(c, 0), o(c, 1), o(c, 2), o(c, 3)];
      for (let u = 0; u < a; ++u)
        n.push(i);
    }
  }
  return e;
}
function createBufferFunc(e) {
  return function(t) {
    const r = e.apply(this, Array.prototype.slice.call(arguments, 1));
    return createBuffersFromArrays(t, r);
  };
}
function createBufferInfoFunc(e) {
  return function(t) {
    const r = e.apply(null, Array.prototype.slice.call(arguments, 1));
    return createBufferInfoFromArrays(t, r);
  };
}
const arraySpecPropertyNames = [
  "numComponents",
  "size",
  "type",
  "normalize",
  "stride",
  "offset",
  "attrib",
  "name",
  "attribName"
];
function copyElements(e, t, r, n) {
  n = n || 0;
  const o = e.length;
  for (let a = 0; a < o; ++a)
    t[r + a] = e[a] + n;
}
function createArrayOfSameType(e, t) {
  const r = getArray(e), n = new r.constructor(t);
  let o = n;
  return r.numComponents && r.numElements && augmentTypedArray(n, r.numComponents), e.data && (o = {
    data: n
  }, copyNamedProperties(arraySpecPropertyNames, e, o)), o;
}
function concatVertices(e) {
  const t = {};
  let r;
  for (let c = 0; c < e.length; ++c) {
    const i = e[c];
    Object.keys(i).forEach(function(u) {
      t[u] || (t[u] = []), !r && u !== "indices" && (r = u);
      const f = i[u], l = getNumComponents(f, u), m = getArray(f).length / l;
      t[u].push(m);
    });
  }
  function n(c) {
    let i = 0, u;
    for (let f = 0; f < e.length; ++f) {
      const _ = e[f][c], m = getArray(_);
      i += m.length, (!u || _.data) && (u = _);
    }
    return {
      length: i,
      spec: u
    };
  }
  function o(c, i, u) {
    let f = 0, l = 0;
    for (let _ = 0; _ < e.length; ++_) {
      const E = e[_][c], p = getArray(E);
      c === "indices" ? (copyElements(p, u, l, f), f += i[_]) : copyElements(p, u, l), l += p.length;
    }
  }
  const a = t[r], s = {};
  return Object.keys(t).forEach(function(c) {
    const i = n(c), u = createArrayOfSameType(i.spec, i.length);
    o(c, a, getArray(u)), s[c] = u;
  }), s;
}
function duplicateVertices(e) {
  const t = {};
  return Object.keys(e).forEach(function(r) {
    const n = e[r], o = getArray(n), a = createArrayOfSameType(n, o.length);
    copyElements(o, getArray(a), 0), t[r] = a;
  }), t;
}
const create3DFBufferInfo = createBufferInfoFunc(create3DFVertices), create3DFBuffers = createBufferFunc(create3DFVertices), createCubeBufferInfo = createBufferInfoFunc(createCubeVertices), createCubeBuffers = createBufferFunc(createCubeVertices), createPlaneBufferInfo = createBufferInfoFunc(createPlaneVertices), createPlaneBuffers = createBufferFunc(createPlaneVertices), createSphereBufferInfo = createBufferInfoFunc(createSphereVertices), createSphereBuffers = createBufferFunc(createSphereVertices), createTruncatedConeBufferInfo = createBufferInfoFunc(createTruncatedConeVertices), createTruncatedConeBuffers = createBufferFunc(createTruncatedConeVertices), createXYQuadBufferInfo = createBufferInfoFunc(createXYQuadVertices), createXYQuadBuffers = createBufferFunc(createXYQuadVertices), createCrescentBufferInfo = createBufferInfoFunc(createCrescentVertices), createCrescentBuffers = createBufferFunc(createCrescentVertices), createCylinderBufferInfo = createBufferInfoFunc(createCylinderVertices), createCylinderBuffers = createBufferFunc(createCylinderVertices), createTorusBufferInfo = createBufferInfoFunc(createTorusVertices), createTorusBuffers = createBufferFunc(createTorusVertices), createDiscBufferInfo = createBufferInfoFunc(createDiscVertices), createDiscBuffers = createBufferFunc(createDiscVertices), createCresentBufferInfo = createCrescentBufferInfo, createCresentBuffers = createCrescentBuffers, createCresentVertices = createCrescentVertices;
var primitives = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create3DFBufferInfo,
  create3DFBuffers,
  create3DFVertices,
  createAugmentedTypedArray,
  createCubeBufferInfo,
  createCubeBuffers,
  createCubeVertices,
  createPlaneBufferInfo,
  createPlaneBuffers,
  createPlaneVertices,
  createSphereBufferInfo,
  createSphereBuffers,
  createSphereVertices,
  createTruncatedConeBufferInfo,
  createTruncatedConeBuffers,
  createTruncatedConeVertices,
  createXYQuadBufferInfo,
  createXYQuadBuffers,
  createXYQuadVertices,
  createCresentBufferInfo,
  createCresentBuffers,
  createCresentVertices,
  createCrescentBufferInfo,
  createCrescentBuffers,
  createCrescentVertices,
  createCylinderBufferInfo,
  createCylinderBuffers,
  createCylinderVertices,
  createTorusBufferInfo,
  createTorusBuffers,
  createTorusVertices,
  createDiscBufferInfo,
  createDiscBuffers,
  createDiscVertices,
  deindexVertices,
  flattenNormals,
  makeRandomVertexColors,
  reorientDirections,
  reorientNormals,
  reorientPositions,
  reorientVertices,
  concatVertices,
  duplicateVertices
});
function isWebGL2(e) {
  return !!e.texStorage2D;
}
function isWebGL1(e) {
  return !e.texStorage2D;
}
const glEnumToString = function() {
  const e = {}, t = {};
  function r(n) {
    const o = n.constructor.name;
    if (!e[o]) {
      for (const a in n)
        if (typeof n[a] == "number") {
          const s = t[n[a]];
          t[n[a]] = s ? `${s} | ${a}` : a;
        }
      e[o] = !0;
    }
  }
  return function(o, a) {
    return r(o), t[a] || (typeof a == "number" ? `0x${a.toString(16)}` : a);
  };
}();
var utils = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  glEnumToString,
  isWebGL1,
  isWebGL2
});
const defaults$1 = {
  textureColor: new Uint8Array([128, 192, 255, 255]),
  textureOptions: {},
  crossOrigin: void 0
}, isArrayBuffer = isArrayBuffer$1, getShared2DContext = function() {
  let e;
  return function() {
    return e = e || (typeof document < "u" && document.createElement ? document.createElement("canvas").getContext("2d") : null), e;
  };
}(), ALPHA = 6406, RGB = 6407, RGBA$1 = 6408, LUMINANCE = 6409, LUMINANCE_ALPHA = 6410, DEPTH_COMPONENT$1 = 6402, DEPTH_STENCIL$1 = 34041, CLAMP_TO_EDGE$1 = 33071, NEAREST = 9728, LINEAR$1 = 9729, TEXTURE_2D$2 = 3553, TEXTURE_CUBE_MAP$1 = 34067, TEXTURE_3D$1 = 32879, TEXTURE_2D_ARRAY$1 = 35866, TEXTURE_CUBE_MAP_POSITIVE_X = 34069, TEXTURE_CUBE_MAP_NEGATIVE_X = 34070, TEXTURE_CUBE_MAP_POSITIVE_Y = 34071, TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072, TEXTURE_CUBE_MAP_POSITIVE_Z = 34073, TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074, TEXTURE_MIN_FILTER = 10241, TEXTURE_MAG_FILTER = 10240, TEXTURE_WRAP_S = 10242, TEXTURE_WRAP_T = 10243, TEXTURE_WRAP_R = 32882, TEXTURE_MIN_LOD = 33082, TEXTURE_MAX_LOD = 33083, TEXTURE_BASE_LEVEL = 33084, TEXTURE_MAX_LEVEL = 33085, UNPACK_ALIGNMENT = 3317, UNPACK_ROW_LENGTH = 3314, UNPACK_IMAGE_HEIGHT = 32878, UNPACK_SKIP_PIXELS = 3316, UNPACK_SKIP_ROWS = 3315, UNPACK_SKIP_IMAGES = 32877, UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443, UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441, UNPACK_FLIP_Y_WEBGL = 37440, R8 = 33321, R8_SNORM = 36756, R16F = 33325, R32F = 33326, R8UI = 33330, R8I = 33329, RG16UI = 33338, RG16I = 33337, RG32UI = 33340, RG32I = 33339, RG8 = 33323, RG8_SNORM = 36757, RG16F = 33327, RG32F = 33328, RG8UI = 33336, RG8I = 33335, R16UI = 33332, R16I = 33331, R32UI = 33334, R32I = 33333, RGB8 = 32849, SRGB8 = 35905, RGB565$1 = 36194, RGB8_SNORM = 36758, R11F_G11F_B10F = 35898, RGB9_E5 = 35901, RGB16F = 34843, RGB32F = 34837, RGB8UI = 36221, RGB8I = 36239, RGB16UI = 36215, RGB16I = 36233, RGB32UI = 36209, RGB32I = 36227, RGBA8 = 32856, SRGB8_ALPHA8 = 35907, RGBA8_SNORM = 36759, RGB5_A1$1 = 32855, RGBA4$1 = 32854, RGB10_A2 = 32857, RGBA16F = 34842, RGBA32F = 34836, RGBA8UI = 36220, RGBA8I = 36238, RGB10_A2UI = 36975, RGBA16UI = 36214, RGBA16I = 36232, RGBA32I = 36226, RGBA32UI = 36208, DEPTH_COMPONENT16$1 = 33189, DEPTH_COMPONENT24$1 = 33190, DEPTH_COMPONENT32F$1 = 36012, DEPTH32F_STENCIL8$1 = 36013, DEPTH24_STENCIL8$1 = 35056, BYTE = 5120, UNSIGNED_BYTE$1 = 5121, SHORT = 5122, UNSIGNED_SHORT$1 = 5123, INT$1 = 5124, UNSIGNED_INT$1 = 5125, FLOAT$1 = 5126, UNSIGNED_SHORT_4_4_4_4 = 32819, UNSIGNED_SHORT_5_5_5_1 = 32820, UNSIGNED_SHORT_5_6_5 = 33635, HALF_FLOAT = 5131, HALF_FLOAT_OES = 36193, UNSIGNED_INT_2_10_10_10_REV = 33640, UNSIGNED_INT_10F_11F_11F_REV = 35899, UNSIGNED_INT_5_9_9_9_REV = 35902, FLOAT_32_UNSIGNED_INT_24_8_REV = 36269, UNSIGNED_INT_24_8 = 34042, RG = 33319, RG_INTEGER = 33320, RED = 6403, RED_INTEGER = 36244, RGB_INTEGER = 36248, RGBA_INTEGER = 36249, formatInfo = {};
{
  const e = formatInfo;
  e[ALPHA] = { numColorComponents: 1 }, e[LUMINANCE] = { numColorComponents: 1 }, e[LUMINANCE_ALPHA] = { numColorComponents: 2 }, e[RGB] = { numColorComponents: 3 }, e[RGBA$1] = { numColorComponents: 4 }, e[RED] = { numColorComponents: 1 }, e[RED_INTEGER] = { numColorComponents: 1 }, e[RG] = { numColorComponents: 2 }, e[RG_INTEGER] = { numColorComponents: 2 }, e[RGB] = { numColorComponents: 3 }, e[RGB_INTEGER] = { numColorComponents: 3 }, e[RGBA$1] = { numColorComponents: 4 }, e[RGBA_INTEGER] = { numColorComponents: 4 }, e[DEPTH_COMPONENT$1] = { numColorComponents: 1 }, e[DEPTH_STENCIL$1] = { numColorComponents: 2 };
}
let s_textureInternalFormatInfo;
function getTextureInternalFormatInfo(e) {
  if (!s_textureInternalFormatInfo) {
    const t = {};
    t[ALPHA] = { textureFormat: ALPHA, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1] }, t[LUMINANCE] = { textureFormat: LUMINANCE, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1] }, t[LUMINANCE_ALPHA] = { textureFormat: LUMINANCE_ALPHA, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [2, 4, 4, 8], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1] }, t[RGB] = { textureFormat: RGB, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [3, 6, 6, 12, 2], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1, UNSIGNED_SHORT_5_6_5] }, t[RGBA$1] = { textureFormat: RGBA$1, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1] }, t[DEPTH_COMPONENT$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [2, 4], type: [UNSIGNED_INT$1, UNSIGNED_SHORT$1] }, t[R8] = { textureFormat: RED, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [1], type: [UNSIGNED_BYTE$1] }, t[R8_SNORM] = { textureFormat: RED, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [1], type: [BYTE] }, t[R16F] = { textureFormat: RED, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [4, 2], type: [FLOAT$1, HALF_FLOAT] }, t[R32F] = { textureFormat: RED, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [4], type: [FLOAT$1] }, t[R8UI] = { textureFormat: RED_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [1], type: [UNSIGNED_BYTE$1] }, t[R8I] = { textureFormat: RED_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [1], type: [BYTE] }, t[R16UI] = { textureFormat: RED_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [2], type: [UNSIGNED_SHORT$1] }, t[R16I] = { textureFormat: RED_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [2], type: [SHORT] }, t[R32UI] = { textureFormat: RED_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [UNSIGNED_INT$1] }, t[R32I] = { textureFormat: RED_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [INT$1] }, t[RG8] = { textureFormat: RG, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [2], type: [UNSIGNED_BYTE$1] }, t[RG8_SNORM] = { textureFormat: RG, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [2], type: [BYTE] }, t[RG16F] = { textureFormat: RG, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [8, 4], type: [FLOAT$1, HALF_FLOAT] }, t[RG32F] = { textureFormat: RG, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [8], type: [FLOAT$1] }, t[RG8UI] = { textureFormat: RG_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [2], type: [UNSIGNED_BYTE$1] }, t[RG8I] = { textureFormat: RG_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [2], type: [BYTE] }, t[RG16UI] = { textureFormat: RG_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [UNSIGNED_SHORT$1] }, t[RG16I] = { textureFormat: RG_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [SHORT] }, t[RG32UI] = { textureFormat: RG_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [8], type: [UNSIGNED_INT$1] }, t[RG32I] = { textureFormat: RG_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [8], type: [INT$1] }, t[RGB8] = { textureFormat: RGB, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [3], type: [UNSIGNED_BYTE$1] }, t[SRGB8] = { textureFormat: RGB, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [3], type: [UNSIGNED_BYTE$1] }, t[RGB565$1] = { textureFormat: RGB, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [3, 2], type: [UNSIGNED_BYTE$1, UNSIGNED_SHORT_5_6_5] }, t[RGB8_SNORM] = { textureFormat: RGB, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [3], type: [BYTE] }, t[R11F_G11F_B10F] = { textureFormat: RGB, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [12, 6, 4], type: [FLOAT$1, HALF_FLOAT, UNSIGNED_INT_10F_11F_11F_REV] }, t[RGB9_E5] = { textureFormat: RGB, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [12, 6, 4], type: [FLOAT$1, HALF_FLOAT, UNSIGNED_INT_5_9_9_9_REV] }, t[RGB16F] = { textureFormat: RGB, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [12, 6], type: [FLOAT$1, HALF_FLOAT] }, t[RGB32F] = { textureFormat: RGB, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [12], type: [FLOAT$1] }, t[RGB8UI] = { textureFormat: RGB_INTEGER, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [3], type: [UNSIGNED_BYTE$1] }, t[RGB8I] = { textureFormat: RGB_INTEGER, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [3], type: [BYTE] }, t[RGB16UI] = { textureFormat: RGB_INTEGER, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [6], type: [UNSIGNED_SHORT$1] }, t[RGB16I] = { textureFormat: RGB_INTEGER, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [6], type: [SHORT] }, t[RGB32UI] = { textureFormat: RGB_INTEGER, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [12], type: [UNSIGNED_INT$1] }, t[RGB32I] = { textureFormat: RGB_INTEGER, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [12], type: [INT$1] }, t[RGBA8] = { textureFormat: RGBA$1, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [4], type: [UNSIGNED_BYTE$1] }, t[SRGB8_ALPHA8] = { textureFormat: RGBA$1, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [4], type: [UNSIGNED_BYTE$1] }, t[RGBA8_SNORM] = { textureFormat: RGBA$1, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [4], type: [BYTE] }, t[RGB5_A1$1] = { textureFormat: RGBA$1, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [4, 2, 4], type: [UNSIGNED_BYTE$1, UNSIGNED_SHORT_5_5_5_1, UNSIGNED_INT_2_10_10_10_REV] }, t[RGBA4$1] = { textureFormat: RGBA$1, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [4, 2], type: [UNSIGNED_BYTE$1, UNSIGNED_SHORT_4_4_4_4] }, t[RGB10_A2] = { textureFormat: RGBA$1, colorRenderable: !0, textureFilterable: !0, bytesPerElement: [4], type: [UNSIGNED_INT_2_10_10_10_REV] }, t[RGBA16F] = { textureFormat: RGBA$1, colorRenderable: !1, textureFilterable: !0, bytesPerElement: [16, 8], type: [FLOAT$1, HALF_FLOAT] }, t[RGBA32F] = { textureFormat: RGBA$1, colorRenderable: !1, textureFilterable: !1, bytesPerElement: [16], type: [FLOAT$1] }, t[RGBA8UI] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [UNSIGNED_BYTE$1] }, t[RGBA8I] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [BYTE] }, t[RGB10_A2UI] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [UNSIGNED_INT_2_10_10_10_REV] }, t[RGBA16UI] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [8], type: [UNSIGNED_SHORT$1] }, t[RGBA16I] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [8], type: [SHORT] }, t[RGBA32I] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [16], type: [INT$1] }, t[RGBA32UI] = { textureFormat: RGBA_INTEGER, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [16], type: [UNSIGNED_INT$1] }, t[DEPTH_COMPONENT16$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [2, 4], type: [UNSIGNED_SHORT$1, UNSIGNED_INT$1] }, t[DEPTH_COMPONENT24$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [UNSIGNED_INT$1] }, t[DEPTH_COMPONENT32F$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [FLOAT$1] }, t[DEPTH24_STENCIL8$1] = { textureFormat: DEPTH_STENCIL$1, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [UNSIGNED_INT_24_8] }, t[DEPTH32F_STENCIL8$1] = { textureFormat: DEPTH_STENCIL$1, colorRenderable: !0, textureFilterable: !1, bytesPerElement: [4], type: [FLOAT_32_UNSIGNED_INT_24_8_REV] }, Object.keys(t).forEach(function(r) {
      const n = t[r];
      n.bytesPerElementMap = {}, n.bytesPerElement.forEach(function(o, a) {
        const s = n.type[a];
        n.bytesPerElementMap[s] = o;
      });
    }), s_textureInternalFormatInfo = t;
  }
  return s_textureInternalFormatInfo[e];
}
function getBytesPerElementForInternalFormat(e, t) {
  const r = getTextureInternalFormatInfo(e);
  if (!r)
    throw "unknown internal format";
  const n = r.bytesPerElementMap[t];
  if (n === void 0)
    throw "unknown internal format";
  return n;
}
function getFormatAndTypeForInternalFormat(e) {
  const t = getTextureInternalFormatInfo(e);
  if (!t)
    throw "unknown internal format";
  return {
    format: t.textureFormat,
    type: t.type[0]
  };
}
function isPowerOf2(e) {
  return (e & e - 1) === 0;
}
function canGenerateMipmap(e, t, r, n) {
  if (!isWebGL2(e))
    return isPowerOf2(t) && isPowerOf2(r);
  const o = getTextureInternalFormatInfo(n);
  if (!o)
    throw "unknown internal format";
  return o.colorRenderable && o.textureFilterable;
}
function canFilter(e) {
  const t = getTextureInternalFormatInfo(e);
  if (!t)
    throw "unknown internal format";
  return t.textureFilterable;
}
function getNumComponentsForFormat(e) {
  const t = formatInfo[e];
  if (!t)
    throw "unknown format: " + e;
  return t.numColorComponents;
}
function getTextureTypeForArrayType(e, t, r) {
  return isArrayBuffer(t) ? getGLTypeForTypedArray(t) : r || UNSIGNED_BYTE$1;
}
function guessDimensions(e, t, r, n, o) {
  if (o % 1 !== 0)
    throw "can't guess dimensions";
  if (!r && !n) {
    const a = Math.sqrt(o / (t === TEXTURE_CUBE_MAP$1 ? 6 : 1));
    a % 1 === 0 ? (r = a, n = a) : (r = o, n = 1);
  } else if (n) {
    if (!r && (r = o / n, r % 1))
      throw "can't guess dimensions";
  } else if (n = o / r, n % 1)
    throw "can't guess dimensions";
  return {
    width: r,
    height: n
  };
}
function setDefaultTextureColor(e) {
  defaults$1.textureColor = new Uint8Array([e[0] * 255, e[1] * 255, e[2] * 255, e[3] * 255]);
}
function setDefaults$1(e) {
  copyExistingProperties(e, defaults$1), e.textureColor && setDefaultTextureColor(e.textureColor);
}
function setPackState(e, t) {
  t.colorspaceConversion !== void 0 && e.pixelStorei(UNPACK_COLORSPACE_CONVERSION_WEBGL, t.colorspaceConversion), t.premultiplyAlpha !== void 0 && e.pixelStorei(UNPACK_PREMULTIPLY_ALPHA_WEBGL, t.premultiplyAlpha), t.flipY !== void 0 && e.pixelStorei(UNPACK_FLIP_Y_WEBGL, t.flipY);
}
function setSkipStateToDefault(e) {
  e.pixelStorei(UNPACK_ALIGNMENT, 4), isWebGL2(e) && (e.pixelStorei(UNPACK_ROW_LENGTH, 0), e.pixelStorei(UNPACK_IMAGE_HEIGHT, 0), e.pixelStorei(UNPACK_SKIP_PIXELS, 0), e.pixelStorei(UNPACK_SKIP_ROWS, 0), e.pixelStorei(UNPACK_SKIP_IMAGES, 0));
}
function setTextureSamplerParameters(e, t, r, n) {
  n.minMag && (r.call(e, t, TEXTURE_MIN_FILTER, n.minMag), r.call(e, t, TEXTURE_MAG_FILTER, n.minMag)), n.min && r.call(e, t, TEXTURE_MIN_FILTER, n.min), n.mag && r.call(e, t, TEXTURE_MAG_FILTER, n.mag), n.wrap && (r.call(e, t, TEXTURE_WRAP_S, n.wrap), r.call(e, t, TEXTURE_WRAP_T, n.wrap), (t === TEXTURE_3D$1 || isSampler(e, t)) && r.call(e, t, TEXTURE_WRAP_R, n.wrap)), n.wrapR && r.call(e, t, TEXTURE_WRAP_R, n.wrapR), n.wrapS && r.call(e, t, TEXTURE_WRAP_S, n.wrapS), n.wrapT && r.call(e, t, TEXTURE_WRAP_T, n.wrapT), n.minLod && r.call(e, t, TEXTURE_MIN_LOD, n.minLod), n.maxLod && r.call(e, t, TEXTURE_MAX_LOD, n.maxLod), n.baseLevel && r.call(e, t, TEXTURE_BASE_LEVEL, n.baseLevel), n.maxLevel && r.call(e, t, TEXTURE_MAX_LEVEL, n.maxLevel);
}
function setTextureParameters(e, t, r) {
  const n = r.target || TEXTURE_2D$2;
  e.bindTexture(n, t), setTextureSamplerParameters(e, n, e.texParameteri, r);
}
function setSamplerParameters(e, t, r) {
  setTextureSamplerParameters(e, t, e.samplerParameteri, r);
}
function createSampler(e, t) {
  const r = e.createSampler();
  return setSamplerParameters(e, r, t), r;
}
function createSamplers(e, t) {
  const r = {};
  return Object.keys(t).forEach(function(n) {
    r[n] = createSampler(e, t[n]);
  }), r;
}
function make1Pixel(e) {
  return e = e || defaults$1.textureColor, isArrayBuffer(e) ? e : new Uint8Array([e[0] * 255, e[1] * 255, e[2] * 255, e[3] * 255]);
}
function setTextureFilteringForSize(e, t, r, n, o, a) {
  r = r || defaults$1.textureOptions, a = a || RGBA$1;
  const s = r.target || TEXTURE_2D$2;
  if (n = n || r.width, o = o || r.height, e.bindTexture(s, t), canGenerateMipmap(e, n, o, a))
    e.generateMipmap(s);
  else {
    const c = canFilter(a) ? LINEAR$1 : NEAREST;
    e.texParameteri(s, TEXTURE_MIN_FILTER, c), e.texParameteri(s, TEXTURE_MAG_FILTER, c), e.texParameteri(s, TEXTURE_WRAP_S, CLAMP_TO_EDGE$1), e.texParameteri(s, TEXTURE_WRAP_T, CLAMP_TO_EDGE$1);
  }
}
function shouldAutomaticallySetTextureFilteringForSize(e) {
  return e.auto === !0 || e.auto === void 0 && e.level === void 0;
}
function getCubeFaceOrder(e, t) {
  return t = t || {}, t.cubeFaceOrder || [
    TEXTURE_CUBE_MAP_POSITIVE_X,
    TEXTURE_CUBE_MAP_NEGATIVE_X,
    TEXTURE_CUBE_MAP_POSITIVE_Y,
    TEXTURE_CUBE_MAP_NEGATIVE_Y,
    TEXTURE_CUBE_MAP_POSITIVE_Z,
    TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];
}
function getCubeFacesWithNdx(e, t) {
  const n = getCubeFaceOrder(e, t).map(function(o, a) {
    return { face: o, ndx: a };
  });
  return n.sort(function(o, a) {
    return o.face - a.face;
  }), n;
}
function setTextureFromElement(e, t, r, n) {
  n = n || defaults$1.textureOptions;
  const o = n.target || TEXTURE_2D$2, a = n.level || 0;
  let s = r.width, c = r.height;
  const i = n.internalFormat || n.format || RGBA$1, u = getFormatAndTypeForInternalFormat(i), f = n.format || u.format, l = n.type || u.type;
  if (setPackState(e, n), e.bindTexture(o, t), o === TEXTURE_CUBE_MAP$1) {
    const _ = r.width, m = r.height;
    let E, p;
    if (_ / 6 === m)
      E = m, p = [0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0];
    else if (m / 6 === _)
      E = _, p = [0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5];
    else if (_ / 3 === m / 2)
      E = _ / 3, p = [0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 2, 1];
    else if (_ / 2 === m / 3)
      E = _ / 2, p = [0, 0, 1, 0, 0, 1, 1, 1, 0, 2, 1, 2];
    else
      throw "can't figure out cube map from element: " + (r.src ? r.src : r.nodeName);
    const T = getShared2DContext();
    T ? (T.canvas.width = E, T.canvas.height = E, s = E, c = E, getCubeFacesWithNdx(e, n).forEach(function(d) {
      const y = p[d.ndx * 2 + 0] * E, h = p[d.ndx * 2 + 1] * E;
      T.drawImage(r, y, h, E, E, 0, 0, E, E), e.texImage2D(d.face, a, i, f, l, T.canvas);
    }), T.canvas.width = 1, T.canvas.height = 1) : typeof createImageBitmap < "u" && (s = E, c = E, getCubeFacesWithNdx(e, n).forEach(function(d) {
      const y = p[d.ndx * 2 + 0] * E, h = p[d.ndx * 2 + 1] * E;
      e.texImage2D(d.face, a, i, E, E, 0, f, l, null), createImageBitmap(r, y, h, E, E, {
        premultiplyAlpha: "none",
        colorSpaceConversion: "none"
      }).then(function(x) {
        setPackState(e, n), e.bindTexture(o, t), e.texImage2D(d.face, a, i, f, l, x), shouldAutomaticallySetTextureFilteringForSize(n) && setTextureFilteringForSize(e, t, n, s, c, i);
      });
    }));
  } else if (o === TEXTURE_3D$1 || o === TEXTURE_2D_ARRAY$1) {
    const _ = Math.min(r.width, r.height), m = Math.max(r.width, r.height), E = m / _;
    if (E % 1 !== 0)
      throw "can not compute 3D dimensions of element";
    const p = r.width === m ? 1 : 0, T = r.height === m ? 1 : 0;
    e.pixelStorei(UNPACK_ALIGNMENT, 1), e.pixelStorei(UNPACK_ROW_LENGTH, r.width), e.pixelStorei(UNPACK_IMAGE_HEIGHT, 0), e.pixelStorei(UNPACK_SKIP_IMAGES, 0), e.texImage3D(o, a, i, _, _, _, 0, f, l, null);
    for (let d = 0; d < E; ++d) {
      const y = d * _ * p, h = d * _ * T;
      e.pixelStorei(UNPACK_SKIP_PIXELS, y), e.pixelStorei(UNPACK_SKIP_ROWS, h), e.texSubImage3D(o, a, 0, 0, d, _, _, 1, f, l, r);
    }
    setSkipStateToDefault(e);
  } else
    e.texImage2D(o, a, i, f, l, r);
  shouldAutomaticallySetTextureFilteringForSize(n) && setTextureFilteringForSize(e, t, n, s, c, i), setTextureParameters(e, t, n);
}
function noop() {
}
function urlIsSameOrigin(e) {
  if (typeof document < "u") {
    const t = document.createElement("a");
    return t.href = e, t.hostname === location.hostname && t.port === location.port && t.protocol === location.protocol;
  } else {
    const t = new URL(location.href).origin;
    return new URL(e, location.href).origin === t;
  }
}
function setToAnonymousIfUndefinedAndURLIsNotSameOrigin(e, t) {
  return t === void 0 && !urlIsSameOrigin(e) ? "anonymous" : t;
}
function loadImage(e, t, r) {
  r = r || noop;
  let n;
  if (t = t !== void 0 ? t : defaults$1.crossOrigin, t = setToAnonymousIfUndefinedAndURLIsNotSameOrigin(e, t), typeof Image < "u") {
    n = new Image(), t !== void 0 && (n.crossOrigin = t);
    const o = function() {
      n.removeEventListener("error", a), n.removeEventListener("load", s), n = null;
    }, a = function() {
      const i = "couldn't load image: " + e;
      error$1(i), r(i, n), o();
    }, s = function() {
      r(null, n), o();
    };
    return n.addEventListener("error", a), n.addEventListener("load", s), n.src = e, n;
  } else if (typeof ImageBitmap < "u") {
    let o, a;
    const s = function() {
      r(o, a);
    }, c = {};
    t && (c.mode = "cors"), fetch(e, c).then(function(i) {
      if (!i.ok)
        throw i;
      return i.blob();
    }).then(function(i) {
      return createImageBitmap(i, {
        premultiplyAlpha: "none",
        colorSpaceConversion: "none"
      });
    }).then(function(i) {
      a = i, setTimeout(s);
    }).catch(function(i) {
      o = i, setTimeout(s);
    }), n = null;
  }
  return n;
}
function isTexImageSource(e) {
  return typeof ImageBitmap < "u" && e instanceof ImageBitmap || typeof ImageData < "u" && e instanceof ImageData || typeof HTMLElement < "u" && e instanceof HTMLElement;
}
function loadAndUseImage(e, t, r) {
  return isTexImageSource(e) ? (setTimeout(function() {
    r(null, e);
  }), e) : loadImage(e, t, r);
}
function setTextureTo1PixelColor(e, t, r) {
  r = r || defaults$1.textureOptions;
  const n = r.target || TEXTURE_2D$2;
  if (e.bindTexture(n, t), r.color === !1)
    return;
  const o = make1Pixel(r.color);
  if (n === TEXTURE_CUBE_MAP$1)
    for (let a = 0; a < 6; ++a)
      e.texImage2D(TEXTURE_CUBE_MAP_POSITIVE_X + a, 0, RGBA$1, 1, 1, 0, RGBA$1, UNSIGNED_BYTE$1, o);
  else
    n === TEXTURE_3D$1 || n === TEXTURE_2D_ARRAY$1 ? e.texImage3D(n, 0, RGBA$1, 1, 1, 1, 0, RGBA$1, UNSIGNED_BYTE$1, o) : e.texImage2D(n, 0, RGBA$1, 1, 1, 0, RGBA$1, UNSIGNED_BYTE$1, o);
}
function loadTextureFromUrl(e, t, r, n) {
  return n = n || noop, r = r || defaults$1.textureOptions, setTextureTo1PixelColor(e, t, r), r = Object.assign({}, r), loadAndUseImage(r.src, r.crossOrigin, function(a, s) {
    a ? n(a, t, s) : (setTextureFromElement(e, t, s, r), n(null, t, s));
  });
}
function loadCubemapFromUrls(e, t, r, n) {
  n = n || noop;
  const o = r.src;
  if (o.length !== 6)
    throw "there must be 6 urls for a cubemap";
  const a = r.level || 0, s = r.internalFormat || r.format || RGBA$1, c = getFormatAndTypeForInternalFormat(s), i = r.format || c.format, u = r.type || UNSIGNED_BYTE$1, f = r.target || TEXTURE_2D$2;
  if (f !== TEXTURE_CUBE_MAP$1)
    throw "target must be TEXTURE_CUBE_MAP";
  setTextureTo1PixelColor(e, t, r), r = Object.assign({}, r);
  let l = 6;
  const _ = [], m = getCubeFaceOrder(e, r);
  let E;
  function p(T) {
    return function(d, y) {
      --l, d ? _.push(d) : y.width !== y.height ? _.push("cubemap face img is not a square: " + y.src) : (setPackState(e, r), e.bindTexture(f, t), l === 5 ? getCubeFaceOrder().forEach(function(h) {
        e.texImage2D(h, a, s, i, u, y);
      }) : e.texImage2D(T, a, s, i, u, y), shouldAutomaticallySetTextureFilteringForSize(r) && e.generateMipmap(f)), l === 0 && n(_.length ? _ : void 0, t, E);
    };
  }
  E = o.map(function(T, d) {
    return loadAndUseImage(T, r.crossOrigin, p(m[d]));
  });
}
function loadSlicesFromUrls(e, t, r, n) {
  n = n || noop;
  const o = r.src, a = r.internalFormat || r.format || RGBA$1, s = getFormatAndTypeForInternalFormat(a), c = r.format || s.format, i = r.type || UNSIGNED_BYTE$1, u = r.target || TEXTURE_2D_ARRAY$1;
  if (u !== TEXTURE_3D$1 && u !== TEXTURE_2D_ARRAY$1)
    throw "target must be TEXTURE_3D or TEXTURE_2D_ARRAY";
  setTextureTo1PixelColor(e, t, r), r = Object.assign({}, r);
  let f = o.length;
  const l = [];
  let _;
  const m = r.level || 0;
  let E = r.width, p = r.height;
  const T = o.length;
  let d = !0;
  function y(h) {
    return function(x, A) {
      if (--f, x)
        l.push(x);
      else {
        if (setPackState(e, r), e.bindTexture(u, t), d) {
          d = !1, E = r.width || A.width, p = r.height || A.height, e.texImage3D(u, m, a, E, p, T, 0, c, i, null);
          for (let b = 0; b < T; ++b)
            e.texSubImage3D(u, m, 0, 0, b, E, p, 1, c, i, A);
        } else {
          let b = A, F;
          (A.width !== E || A.height !== p) && (F = getShared2DContext(), b = F.canvas, F.canvas.width = E, F.canvas.height = p, F.drawImage(A, 0, 0, E, p)), e.texSubImage3D(u, m, 0, 0, h, E, p, 1, c, i, b), F && b === F.canvas && (F.canvas.width = 0, F.canvas.height = 0);
        }
        shouldAutomaticallySetTextureFilteringForSize(r) && e.generateMipmap(u);
      }
      f === 0 && n(l.length ? l : void 0, t, _);
    };
  }
  _ = o.map(function(h, x) {
    return loadAndUseImage(h, r.crossOrigin, y(x));
  });
}
function setTextureFromArray(e, t, r, n) {
  n = n || defaults$1.textureOptions;
  const o = n.target || TEXTURE_2D$2;
  e.bindTexture(o, t);
  let a = n.width, s = n.height, c = n.depth;
  const i = n.level || 0, u = n.internalFormat || n.format || RGBA$1, f = getFormatAndTypeForInternalFormat(u), l = n.format || f.format, _ = n.type || getTextureTypeForArrayType(e, r, f.type);
  if (isArrayBuffer(r))
    r instanceof Uint8ClampedArray && (r = new Uint8Array(r.buffer));
  else {
    const T = getTypedArrayTypeForGLType(_);
    r = new T(r);
  }
  const m = getBytesPerElementForInternalFormat(u, _), E = r.byteLength / m;
  if (E % 1)
    throw "length wrong size for format: " + glEnumToString(e, l);
  let p;
  if (o === TEXTURE_3D$1 || o === TEXTURE_2D_ARRAY$1)
    if (!a && !s && !c) {
      const T = Math.cbrt(E);
      if (T % 1 !== 0)
        throw "can't guess cube size of array of numElements: " + E;
      a = T, s = T, c = T;
    } else
      a && (!s || !c) ? (p = guessDimensions(e, o, s, c, E / a), s = p.width, c = p.height) : s && (!a || !c) ? (p = guessDimensions(e, o, a, c, E / s), a = p.width, c = p.height) : (p = guessDimensions(e, o, a, s, E / c), a = p.width, s = p.height);
  else
    p = guessDimensions(e, o, a, s, E), a = p.width, s = p.height;
  if (setSkipStateToDefault(e), e.pixelStorei(UNPACK_ALIGNMENT, n.unpackAlignment || 1), setPackState(e, n), o === TEXTURE_CUBE_MAP$1) {
    const T = m / r.BYTES_PER_ELEMENT, d = E / 6 * T;
    getCubeFacesWithNdx(e, n).forEach((y) => {
      const h = d * y.ndx, x = r.subarray(h, h + d);
      e.texImage2D(y.face, i, u, a, s, 0, l, _, x);
    });
  } else
    o === TEXTURE_3D$1 || o === TEXTURE_2D_ARRAY$1 ? e.texImage3D(o, i, u, a, s, c, 0, l, _, r) : e.texImage2D(o, i, u, a, s, 0, l, _, r);
  return {
    width: a,
    height: s,
    depth: c,
    type: _
  };
}
function setEmptyTexture(e, t, r) {
  const n = r.target || TEXTURE_2D$2;
  e.bindTexture(n, t);
  const o = r.level || 0, a = r.internalFormat || r.format || RGBA$1, s = getFormatAndTypeForInternalFormat(a), c = r.format || s.format, i = r.type || s.type;
  if (setPackState(e, r), n === TEXTURE_CUBE_MAP$1)
    for (let u = 0; u < 6; ++u)
      e.texImage2D(TEXTURE_CUBE_MAP_POSITIVE_X + u, o, a, r.width, r.height, 0, c, i, null);
  else
    n === TEXTURE_3D$1 || n === TEXTURE_2D_ARRAY$1 ? e.texImage3D(n, o, a, r.width, r.height, r.depth, 0, c, i, null) : e.texImage2D(n, o, a, r.width, r.height, 0, c, i, null);
}
function createTexture$1(e, t, r) {
  r = r || noop, t = t || defaults$1.textureOptions;
  const n = e.createTexture(), o = t.target || TEXTURE_2D$2;
  let a = t.width || 1, s = t.height || 1;
  const c = t.internalFormat || RGBA$1;
  e.bindTexture(o, n), o === TEXTURE_CUBE_MAP$1 && (e.texParameteri(o, TEXTURE_WRAP_S, CLAMP_TO_EDGE$1), e.texParameteri(o, TEXTURE_WRAP_T, CLAMP_TO_EDGE$1));
  let i = t.src;
  if (i)
    if (typeof i == "function" && (i = i(e, t)), typeof i == "string")
      loadTextureFromUrl(e, n, t, r);
    else if (isArrayBuffer(i) || Array.isArray(i) && (typeof i[0] == "number" || Array.isArray(i[0]) || isArrayBuffer(i[0]))) {
      const u = setTextureFromArray(e, n, i, t);
      a = u.width, s = u.height;
    } else
      Array.isArray(i) && (typeof i[0] == "string" || isTexImageSource(i[0])) ? o === TEXTURE_CUBE_MAP$1 ? loadCubemapFromUrls(e, n, t, r) : loadSlicesFromUrls(e, n, t, r) : (setTextureFromElement(e, n, i, t), a = i.width, s = i.height);
  else
    setEmptyTexture(e, n, t);
  return shouldAutomaticallySetTextureFilteringForSize(t) && setTextureFilteringForSize(e, n, t, a, s, c), setTextureParameters(e, n, t), n;
}
function resizeTexture(e, t, r, n, o, a) {
  n = n || r.width, o = o || r.height, a = a || r.depth;
  const s = r.target || TEXTURE_2D$2;
  e.bindTexture(s, t);
  const c = r.level || 0, i = r.internalFormat || r.format || RGBA$1, u = getFormatAndTypeForInternalFormat(i), f = r.format || u.format;
  let l;
  const _ = r.src;
  if (_ && (isArrayBuffer(_) || Array.isArray(_) && typeof _[0] == "number") ? l = r.type || getTextureTypeForArrayType(e, _, u.type) : l = r.type || u.type, s === TEXTURE_CUBE_MAP$1)
    for (let m = 0; m < 6; ++m)
      e.texImage2D(TEXTURE_CUBE_MAP_POSITIVE_X + m, c, i, n, o, 0, f, l, null);
  else
    s === TEXTURE_3D$1 || s === TEXTURE_2D_ARRAY$1 ? e.texImage3D(s, c, i, n, o, a, 0, f, l, null) : e.texImage2D(s, c, i, n, o, 0, f, l, null);
}
function isAsyncSrc(e) {
  return typeof e == "string" || Array.isArray(e) && typeof e[0] == "string";
}
function createTextures(e, t, r) {
  r = r || noop;
  let n = 0;
  const o = [], a = {}, s = {};
  function c() {
    n === 0 && setTimeout(function() {
      r(o.length ? o : void 0, a, s);
    }, 0);
  }
  return Object.keys(t).forEach(function(i) {
    const u = t[i];
    let f;
    isAsyncSrc(u.src) && (f = function(l, _, m) {
      s[i] = m, --n, l && o.push(l), c();
    }, ++n), a[i] = createTexture$1(e, u, f);
  }), c(), a;
}
var textures = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  setTextureDefaults_: setDefaults$1,
  createSampler,
  createSamplers,
  setSamplerParameters,
  createTexture: createTexture$1,
  setEmptyTexture,
  setTextureFromArray,
  loadTextureFromUrl,
  setTextureFromElement,
  setTextureFilteringForSize,
  setTextureParameters,
  setDefaultTextureColor,
  createTextures,
  resizeTexture,
  canGenerateMipmap,
  canFilter,
  getNumComponentsForFormat,
  getBytesPerElementForInternalFormat,
  getFormatAndTypeForInternalFormat
});
const error = error$1, warn = warn$1;
function getElementById(e) {
  return typeof document < "u" && document.getElementById ? document.getElementById(e) : null;
}
const TEXTURE0 = 33984, DYNAMIC_DRAW = 35048, ARRAY_BUFFER = 34962, ELEMENT_ARRAY_BUFFER$1 = 34963, UNIFORM_BUFFER = 35345, TRANSFORM_FEEDBACK_BUFFER = 35982, TRANSFORM_FEEDBACK = 36386, COMPILE_STATUS = 35713, LINK_STATUS = 35714, FRAGMENT_SHADER = 35632, VERTEX_SHADER = 35633, SEPARATE_ATTRIBS = 35981, ACTIVE_UNIFORMS = 35718, ACTIVE_ATTRIBUTES = 35721, TRANSFORM_FEEDBACK_VARYINGS = 35971, ACTIVE_UNIFORM_BLOCKS = 35382, UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = 35396, UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 35398, UNIFORM_BLOCK_DATA_SIZE = 35392, UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = 35395, FLOAT = 5126, FLOAT_VEC2 = 35664, FLOAT_VEC3 = 35665, FLOAT_VEC4 = 35666, INT = 5124, INT_VEC2 = 35667, INT_VEC3 = 35668, INT_VEC4 = 35669, BOOL = 35670, BOOL_VEC2 = 35671, BOOL_VEC3 = 35672, BOOL_VEC4 = 35673, FLOAT_MAT2 = 35674, FLOAT_MAT3 = 35675, FLOAT_MAT4 = 35676, SAMPLER_2D = 35678, SAMPLER_CUBE = 35680, SAMPLER_3D = 35679, SAMPLER_2D_SHADOW = 35682, FLOAT_MAT2x3 = 35685, FLOAT_MAT2x4 = 35686, FLOAT_MAT3x2 = 35687, FLOAT_MAT3x4 = 35688, FLOAT_MAT4x2 = 35689, FLOAT_MAT4x3 = 35690, SAMPLER_2D_ARRAY = 36289, SAMPLER_2D_ARRAY_SHADOW = 36292, SAMPLER_CUBE_SHADOW = 36293, UNSIGNED_INT = 5125, UNSIGNED_INT_VEC2 = 36294, UNSIGNED_INT_VEC3 = 36295, UNSIGNED_INT_VEC4 = 36296, INT_SAMPLER_2D = 36298, INT_SAMPLER_3D = 36299, INT_SAMPLER_CUBE = 36300, INT_SAMPLER_2D_ARRAY = 36303, UNSIGNED_INT_SAMPLER_2D = 36306, UNSIGNED_INT_SAMPLER_3D = 36307, UNSIGNED_INT_SAMPLER_CUBE = 36308, UNSIGNED_INT_SAMPLER_2D_ARRAY = 36311, TEXTURE_2D$1 = 3553, TEXTURE_CUBE_MAP = 34067, TEXTURE_3D = 32879, TEXTURE_2D_ARRAY = 35866, typeMap = {};
function getBindPointForSamplerType(e, t) {
  return typeMap[t].bindPoint;
}
function floatSetter(e, t) {
  return function(r) {
    e.uniform1f(t, r);
  };
}
function floatArraySetter(e, t) {
  return function(r) {
    e.uniform1fv(t, r);
  };
}
function floatVec2Setter(e, t) {
  return function(r) {
    e.uniform2fv(t, r);
  };
}
function floatVec3Setter(e, t) {
  return function(r) {
    e.uniform3fv(t, r);
  };
}
function floatVec4Setter(e, t) {
  return function(r) {
    e.uniform4fv(t, r);
  };
}
function intSetter(e, t) {
  return function(r) {
    e.uniform1i(t, r);
  };
}
function intArraySetter(e, t) {
  return function(r) {
    e.uniform1iv(t, r);
  };
}
function intVec2Setter(e, t) {
  return function(r) {
    e.uniform2iv(t, r);
  };
}
function intVec3Setter(e, t) {
  return function(r) {
    e.uniform3iv(t, r);
  };
}
function intVec4Setter(e, t) {
  return function(r) {
    e.uniform4iv(t, r);
  };
}
function uintSetter(e, t) {
  return function(r) {
    e.uniform1ui(t, r);
  };
}
function uintArraySetter(e, t) {
  return function(r) {
    e.uniform1uiv(t, r);
  };
}
function uintVec2Setter(e, t) {
  return function(r) {
    e.uniform2uiv(t, r);
  };
}
function uintVec3Setter(e, t) {
  return function(r) {
    e.uniform3uiv(t, r);
  };
}
function uintVec4Setter(e, t) {
  return function(r) {
    e.uniform4uiv(t, r);
  };
}
function floatMat2Setter(e, t) {
  return function(r) {
    e.uniformMatrix2fv(t, !1, r);
  };
}
function floatMat3Setter(e, t) {
  return function(r) {
    e.uniformMatrix3fv(t, !1, r);
  };
}
function floatMat4Setter(e, t) {
  return function(r) {
    e.uniformMatrix4fv(t, !1, r);
  };
}
function floatMat23Setter(e, t) {
  return function(r) {
    e.uniformMatrix2x3fv(t, !1, r);
  };
}
function floatMat32Setter(e, t) {
  return function(r) {
    e.uniformMatrix3x2fv(t, !1, r);
  };
}
function floatMat24Setter(e, t) {
  return function(r) {
    e.uniformMatrix2x4fv(t, !1, r);
  };
}
function floatMat42Setter(e, t) {
  return function(r) {
    e.uniformMatrix4x2fv(t, !1, r);
  };
}
function floatMat34Setter(e, t) {
  return function(r) {
    e.uniformMatrix3x4fv(t, !1, r);
  };
}
function floatMat43Setter(e, t) {
  return function(r) {
    e.uniformMatrix4x3fv(t, !1, r);
  };
}
function samplerSetter(e, t, r, n) {
  const o = getBindPointForSamplerType(e, t);
  return isWebGL2(e) ? function(a) {
    let s, c;
    !a || isTexture(e, a) ? (s = a, c = null) : (s = a.texture, c = a.sampler), e.uniform1i(n, r), e.activeTexture(TEXTURE0 + r), e.bindTexture(o, s), e.bindSampler(r, c);
  } : function(a) {
    e.uniform1i(n, r), e.activeTexture(TEXTURE0 + r), e.bindTexture(o, a);
  };
}
function samplerArraySetter(e, t, r, n, o) {
  const a = getBindPointForSamplerType(e, t), s = new Int32Array(o);
  for (let c = 0; c < o; ++c)
    s[c] = r + c;
  return isWebGL2(e) ? function(c) {
    e.uniform1iv(n, s), c.forEach(function(i, u) {
      e.activeTexture(TEXTURE0 + s[u]);
      let f, l;
      !i || isTexture(e, i) ? (f = i, l = null) : (f = i.texture, l = i.sampler), e.bindSampler(r, l), e.bindTexture(a, f);
    });
  } : function(c) {
    e.uniform1iv(n, s), c.forEach(function(i, u) {
      e.activeTexture(TEXTURE0 + s[u]), e.bindTexture(a, i);
    });
  };
}
typeMap[FLOAT] = { Type: Float32Array, size: 4, setter: floatSetter, arraySetter: floatArraySetter };
typeMap[FLOAT_VEC2] = { Type: Float32Array, size: 8, setter: floatVec2Setter, cols: 2 };
typeMap[FLOAT_VEC3] = { Type: Float32Array, size: 12, setter: floatVec3Setter, cols: 3 };
typeMap[FLOAT_VEC4] = { Type: Float32Array, size: 16, setter: floatVec4Setter, cols: 4 };
typeMap[INT] = { Type: Int32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
typeMap[INT_VEC2] = { Type: Int32Array, size: 8, setter: intVec2Setter, cols: 2 };
typeMap[INT_VEC3] = { Type: Int32Array, size: 12, setter: intVec3Setter, cols: 3 };
typeMap[INT_VEC4] = { Type: Int32Array, size: 16, setter: intVec4Setter, cols: 4 };
typeMap[UNSIGNED_INT] = { Type: Uint32Array, size: 4, setter: uintSetter, arraySetter: uintArraySetter };
typeMap[UNSIGNED_INT_VEC2] = { Type: Uint32Array, size: 8, setter: uintVec2Setter, cols: 2 };
typeMap[UNSIGNED_INT_VEC3] = { Type: Uint32Array, size: 12, setter: uintVec3Setter, cols: 3 };
typeMap[UNSIGNED_INT_VEC4] = { Type: Uint32Array, size: 16, setter: uintVec4Setter, cols: 4 };
typeMap[BOOL] = { Type: Uint32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
typeMap[BOOL_VEC2] = { Type: Uint32Array, size: 8, setter: intVec2Setter, cols: 2 };
typeMap[BOOL_VEC3] = { Type: Uint32Array, size: 12, setter: intVec3Setter, cols: 3 };
typeMap[BOOL_VEC4] = { Type: Uint32Array, size: 16, setter: intVec4Setter, cols: 4 };
typeMap[FLOAT_MAT2] = { Type: Float32Array, size: 32, setter: floatMat2Setter, rows: 2, cols: 2 };
typeMap[FLOAT_MAT3] = { Type: Float32Array, size: 48, setter: floatMat3Setter, rows: 3, cols: 3 };
typeMap[FLOAT_MAT4] = { Type: Float32Array, size: 64, setter: floatMat4Setter, rows: 4, cols: 4 };
typeMap[FLOAT_MAT2x3] = { Type: Float32Array, size: 32, setter: floatMat23Setter, rows: 2, cols: 3 };
typeMap[FLOAT_MAT2x4] = { Type: Float32Array, size: 32, setter: floatMat24Setter, rows: 2, cols: 4 };
typeMap[FLOAT_MAT3x2] = { Type: Float32Array, size: 48, setter: floatMat32Setter, rows: 3, cols: 2 };
typeMap[FLOAT_MAT3x4] = { Type: Float32Array, size: 48, setter: floatMat34Setter, rows: 3, cols: 4 };
typeMap[FLOAT_MAT4x2] = { Type: Float32Array, size: 64, setter: floatMat42Setter, rows: 4, cols: 2 };
typeMap[FLOAT_MAT4x3] = { Type: Float32Array, size: 64, setter: floatMat43Setter, rows: 4, cols: 3 };
typeMap[SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
typeMap[SAMPLER_2D_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
typeMap[SAMPLER_2D_ARRAY_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
typeMap[SAMPLER_CUBE_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
typeMap[INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
typeMap[UNSIGNED_INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[UNSIGNED_INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
typeMap[UNSIGNED_INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
function floatAttribSetter(e, t) {
  return function(r) {
    if (r.value)
      switch (e.disableVertexAttribArray(t), r.value.length) {
        case 4:
          e.vertexAttrib4fv(t, r.value);
          break;
        case 3:
          e.vertexAttrib3fv(t, r.value);
          break;
        case 2:
          e.vertexAttrib2fv(t, r.value);
          break;
        case 1:
          e.vertexAttrib1fv(t, r.value);
          break;
        default:
          throw new Error("the length of a float constant value must be between 1 and 4!");
      }
    else
      e.bindBuffer(ARRAY_BUFFER, r.buffer), e.enableVertexAttribArray(t), e.vertexAttribPointer(
        t,
        r.numComponents || r.size,
        r.type || FLOAT,
        r.normalize || !1,
        r.stride || 0,
        r.offset || 0
      ), e.vertexAttribDivisor && e.vertexAttribDivisor(t, r.divisor || 0);
  };
}
function intAttribSetter(e, t) {
  return function(r) {
    if (r.value)
      if (e.disableVertexAttribArray(t), r.value.length === 4)
        e.vertexAttrib4iv(t, r.value);
      else
        throw new Error("The length of an integer constant value must be 4!");
    else
      e.bindBuffer(ARRAY_BUFFER, r.buffer), e.enableVertexAttribArray(t), e.vertexAttribIPointer(
        t,
        r.numComponents || r.size,
        r.type || INT,
        r.stride || 0,
        r.offset || 0
      ), e.vertexAttribDivisor && e.vertexAttribDivisor(t, r.divisor || 0);
  };
}
function uintAttribSetter(e, t) {
  return function(r) {
    if (r.value)
      if (e.disableVertexAttribArray(t), r.value.length === 4)
        e.vertexAttrib4uiv(t, r.value);
      else
        throw new Error("The length of an unsigned integer constant value must be 4!");
    else
      e.bindBuffer(ARRAY_BUFFER, r.buffer), e.enableVertexAttribArray(t), e.vertexAttribIPointer(
        t,
        r.numComponents || r.size,
        r.type || UNSIGNED_INT,
        r.stride || 0,
        r.offset || 0
      ), e.vertexAttribDivisor && e.vertexAttribDivisor(t, r.divisor || 0);
  };
}
function matAttribSetter(e, t, r) {
  const n = r.size, o = r.count;
  return function(a) {
    e.bindBuffer(ARRAY_BUFFER, a.buffer);
    const s = a.size || a.numComponents || n, c = s / o, i = a.type || FLOAT, f = typeMap[i].size * s, l = a.normalize || !1, _ = a.offset || 0, m = f / o;
    for (let E = 0; E < o; ++E)
      e.enableVertexAttribArray(t + E), e.vertexAttribPointer(
        t + E,
        c,
        i,
        l,
        f,
        _ + m * E
      ), e.vertexAttribDivisor && e.vertexAttribDivisor(t + E, a.divisor || 0);
  };
}
const attrTypeMap = {};
attrTypeMap[FLOAT] = { size: 4, setter: floatAttribSetter };
attrTypeMap[FLOAT_VEC2] = { size: 8, setter: floatAttribSetter };
attrTypeMap[FLOAT_VEC3] = { size: 12, setter: floatAttribSetter };
attrTypeMap[FLOAT_VEC4] = { size: 16, setter: floatAttribSetter };
attrTypeMap[INT] = { size: 4, setter: intAttribSetter };
attrTypeMap[INT_VEC2] = { size: 8, setter: intAttribSetter };
attrTypeMap[INT_VEC3] = { size: 12, setter: intAttribSetter };
attrTypeMap[INT_VEC4] = { size: 16, setter: intAttribSetter };
attrTypeMap[UNSIGNED_INT] = { size: 4, setter: uintAttribSetter };
attrTypeMap[UNSIGNED_INT_VEC2] = { size: 8, setter: uintAttribSetter };
attrTypeMap[UNSIGNED_INT_VEC3] = { size: 12, setter: uintAttribSetter };
attrTypeMap[UNSIGNED_INT_VEC4] = { size: 16, setter: uintAttribSetter };
attrTypeMap[BOOL] = { size: 4, setter: intAttribSetter };
attrTypeMap[BOOL_VEC2] = { size: 8, setter: intAttribSetter };
attrTypeMap[BOOL_VEC3] = { size: 12, setter: intAttribSetter };
attrTypeMap[BOOL_VEC4] = { size: 16, setter: intAttribSetter };
attrTypeMap[FLOAT_MAT2] = { size: 4, setter: matAttribSetter, count: 2 };
attrTypeMap[FLOAT_MAT3] = { size: 9, setter: matAttribSetter, count: 3 };
attrTypeMap[FLOAT_MAT4] = { size: 16, setter: matAttribSetter, count: 4 };
const errorRE = /ERROR:\s*\d+:(\d+)/gi;
function addLineNumbersWithError(e, t = "", r = 0) {
  const n = [...t.matchAll(errorRE)], o = new Map(n.map((a, s) => {
    const c = parseInt(a[1]), i = n[s + 1], u = i ? i.index : t.length, f = t.substring(a.index, u);
    return [c - 1, f];
  }));
  return e.split(`
`).map((a, s) => {
    const c = o.get(s);
    return `${s + 1 + r}: ${a}${c ? `

^^^ ${c}` : ""}`;
  }).join(`
`);
}
const spaceRE = /^[ \t]*\n/;
function prepShaderSource(e) {
  let t = 0;
  return spaceRE.test(e) && (t = 1, e = e.replace(spaceRE, "")), { lineOffset: t, shaderSource: e };
}
function reportError(e, t) {
  return e.errorCallback(t), e.callback && setTimeout(() => {
    e.callback(`${t}
${e.errors.join(`
`)}`);
  }), null;
}
function checkShaderStatus(e, t, r, n) {
  if (n = n || error, !e.getShaderParameter(r, COMPILE_STATUS)) {
    const a = e.getShaderInfoLog(r), { lineOffset: s, shaderSource: c } = prepShaderSource(e.getShaderSource(r)), i = `${addLineNumbersWithError(c, a, s)}
Error compiling ${glEnumToString(e, t)}: ${a}`;
    return n(i), i;
  }
  return "";
}
function getProgramOptions(e, t, r) {
  let n, o, a;
  if (typeof t == "function" && (r = t, t = void 0), typeof e == "function")
    r = e, e = void 0;
  else if (e && !Array.isArray(e)) {
    const u = e;
    r = u.errorCallback, e = u.attribLocations, n = u.transformFeedbackVaryings, o = u.transformFeedbackMode, a = u.callback;
  }
  const s = r || error, c = [], i = {
    errorCallback(u, ...f) {
      c.push(u), s(u, ...f);
    },
    transformFeedbackVaryings: n,
    transformFeedbackMode: o,
    callback: a,
    errors: c
  };
  {
    let u = {};
    Array.isArray(e) ? e.forEach(function(f, l) {
      u[f] = t ? t[l] : l;
    }) : u = e || {}, i.attribLocations = u;
  }
  return i;
}
const defaultShaderType = [
  "VERTEX_SHADER",
  "FRAGMENT_SHADER"
];
function getShaderTypeFromScriptType(e, t) {
  if (t.indexOf("frag") >= 0)
    return FRAGMENT_SHADER;
  if (t.indexOf("vert") >= 0)
    return VERTEX_SHADER;
}
function deleteProgramAndShaders(e, t, r) {
  const n = e.getAttachedShaders(t);
  for (const o of n)
    r.has(o) && e.deleteShader(o);
  e.deleteProgram(t);
}
const wait = (e = 0) => new Promise((t) => setTimeout(t, e));
function createProgramNoCheck(e, t, r) {
  const n = e.createProgram(), {
    attribLocations: o,
    transformFeedbackVaryings: a,
    transformFeedbackMode: s
  } = getProgramOptions(r);
  for (let c = 0; c < t.length; ++c) {
    let i = t[c];
    if (typeof i == "string") {
      const u = getElementById(i), f = u ? u.text : i;
      let l = e[defaultShaderType[c]];
      u && u.type && (l = getShaderTypeFromScriptType(e, u.type) || l), i = e.createShader(l), e.shaderSource(i, prepShaderSource(f).shaderSource), e.compileShader(i), e.attachShader(n, i);
    }
  }
  Object.entries(o).forEach(([c, i]) => e.bindAttribLocation(n, i, c));
  {
    let c = a;
    c && (c.attribs && (c = c.attribs), Array.isArray(c) || (c = Object.keys(c)), e.transformFeedbackVaryings(n, c, s || SEPARATE_ATTRIBS));
  }
  return e.linkProgram(n), n;
}
function createProgram(e, t, r, n, o) {
  const a = getProgramOptions(r, n, o), s = new Set(t), c = createProgramNoCheck(e, t, a);
  function i(u, f) {
    const l = getProgramErrors(u, f, a.errorCallback);
    return l && deleteProgramAndShaders(u, f, s), l;
  }
  if (a.callback) {
    waitForProgramLinkCompletionAsync(e, c).then(() => {
      const u = i(e, c);
      a.callback(u, u ? void 0 : c);
    });
    return;
  }
  return i(e, c) ? void 0 : c;
}
function wrapCallbackFnToAsyncFn(e) {
  return function(t, r, ...n) {
    return new Promise((o, a) => {
      const s = getProgramOptions(...n);
      s.callback = (c, i) => {
        c ? a(c) : o(i);
      }, e(t, r, s);
    });
  };
}
const createProgramAsync = wrapCallbackFnToAsyncFn(createProgram), createProgramInfoAsync = wrapCallbackFnToAsyncFn(createProgramInfo);
async function waitForProgramLinkCompletionAsync(e, t) {
  const r = e.getExtension("KHR_parallel_shader_compile"), n = r ? (a, s) => a.getProgramParameter(s, r.COMPLETION_STATUS_KHR) : () => !0;
  let o = 0;
  do
    await wait(o), o = 1e3 / 60;
  while (!n(e, t));
}
async function waitForAllProgramsLinkCompletionAsync(e, t) {
  for (const r of Object.values(t))
    await waitForProgramLinkCompletionAsync(e, r);
}
function getProgramErrors(e, t, r) {
  if (r = r || error, !e.getProgramParameter(t, LINK_STATUS)) {
    const o = e.getProgramInfoLog(t);
    r(`Error in program linking: ${o}`);
    const s = e.getAttachedShaders(t).map((c) => checkShaderStatus(e, e.getShaderParameter(c, e.SHADER_TYPE), c, r));
    return `${o}
${s.filter((c) => c).join(`
`)}`;
  }
}
function createProgramFromScripts(e, t, r, n, o) {
  const a = getProgramOptions(r, n, o), s = [];
  for (const c of t) {
    const i = getElementById(c);
    if (!i)
      return reportError(a, `unknown script element: ${c}`);
    s.push(i.text);
  }
  return createProgram(e, s, a);
}
function createProgramFromSources(e, t, r, n, o) {
  return createProgram(e, t, r, n, o);
}
function isBuiltIn(e) {
  const t = e.name;
  return t.startsWith("gl_") || t.startsWith("webgl_");
}
const tokenRE = /(\.|\[|]|\w+)/g, isDigit = (e) => e >= "0" && e <= "9";
function addSetterToUniformTree(e, t, r, n) {
  const o = e.split(tokenRE).filter((c) => c !== "");
  let a = 0, s = "";
  for (; ; ) {
    const c = o[a++];
    s += c;
    const i = isDigit(c[0]), u = i ? parseInt(c) : c;
    if (i && (s += o[a++]), a === o.length) {
      r[u] = t;
      break;
    } else {
      const l = o[a++], _ = l === "[", m = r[u] || (_ ? [] : {});
      r[u] = m, r = m, n[s] = n[s] || function(E) {
        return function(p) {
          setUniformTree(E, p);
        };
      }(m), s += l;
    }
  }
}
function createUniformSetters(e, t) {
  let r = 0;
  function n(c, i, u) {
    const f = i.name.endsWith("[0]"), l = i.type, _ = typeMap[l];
    if (!_)
      throw new Error(`unknown type: 0x${l.toString(16)}`);
    let m;
    if (_.bindPoint) {
      const E = r;
      r += i.size, f ? m = _.arraySetter(e, l, E, u, i.size) : m = _.setter(e, l, E, u, i.size);
    } else
      _.arraySetter && f ? m = _.arraySetter(e, u) : m = _.setter(e, u);
    return m.location = u, m;
  }
  const o = {}, a = {}, s = e.getProgramParameter(t, ACTIVE_UNIFORMS);
  for (let c = 0; c < s; ++c) {
    const i = e.getActiveUniform(t, c);
    if (isBuiltIn(i))
      continue;
    let u = i.name;
    u.endsWith("[0]") && (u = u.substr(0, u.length - 3));
    const f = e.getUniformLocation(t, i.name);
    if (f) {
      const l = n(t, i, f);
      o[u] = l, addSetterToUniformTree(u, l, a, o);
    }
  }
  return o;
}
function createTransformFeedbackInfo(e, t) {
  const r = {}, n = e.getProgramParameter(t, TRANSFORM_FEEDBACK_VARYINGS);
  for (let o = 0; o < n; ++o) {
    const a = e.getTransformFeedbackVarying(t, o);
    r[a.name] = {
      index: o,
      type: a.type,
      size: a.size
    };
  }
  return r;
}
function bindTransformFeedbackInfo(e, t, r) {
  t.transformFeedbackInfo && (t = t.transformFeedbackInfo), r.attribs && (r = r.attribs);
  for (const n in r) {
    const o = t[n];
    if (o) {
      const a = r[n];
      a.offset ? e.bindBufferRange(TRANSFORM_FEEDBACK_BUFFER, o.index, a.buffer, a.offset, a.size) : e.bindBufferBase(TRANSFORM_FEEDBACK_BUFFER, o.index, a.buffer);
    }
  }
}
function createTransformFeedback(e, t, r) {
  const n = e.createTransformFeedback();
  return e.bindTransformFeedback(TRANSFORM_FEEDBACK, n), e.useProgram(t.program), bindTransformFeedbackInfo(e, t, r), e.bindTransformFeedback(TRANSFORM_FEEDBACK, null), n;
}
function createUniformBlockSpecFromProgram(e, t) {
  const r = e.getProgramParameter(t, ACTIVE_UNIFORMS), n = [], o = [];
  for (let c = 0; c < r; ++c) {
    o.push(c), n.push({});
    const i = e.getActiveUniform(t, c);
    n[c].name = i.name;
  }
  [
    ["UNIFORM_TYPE", "type"],
    ["UNIFORM_SIZE", "size"],
    // num elements
    ["UNIFORM_BLOCK_INDEX", "blockNdx"],
    ["UNIFORM_OFFSET", "offset"]
  ].forEach(function(c) {
    const i = c[0], u = c[1];
    e.getActiveUniforms(t, o, e[i]).forEach(function(f, l) {
      n[l][u] = f;
    });
  });
  const a = {}, s = e.getProgramParameter(t, ACTIVE_UNIFORM_BLOCKS);
  for (let c = 0; c < s; ++c) {
    const i = e.getActiveUniformBlockName(t, c), u = {
      index: e.getUniformBlockIndex(t, i),
      usedByVertexShader: e.getActiveUniformBlockParameter(t, c, UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
      usedByFragmentShader: e.getActiveUniformBlockParameter(t, c, UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      size: e.getActiveUniformBlockParameter(t, c, UNIFORM_BLOCK_DATA_SIZE),
      uniformIndices: e.getActiveUniformBlockParameter(t, c, UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
    };
    u.used = u.usedByVertexShader || u.usedByFragmentShader, a[i] = u;
  }
  return {
    blockSpecs: a,
    uniformData: n
  };
}
const arraySuffixRE = /\[\d+\]\.$/, pad = (e, t) => ((e + (t - 1)) / t | 0) * t;
function createUniformBlockUniformSetter(e, t, r, n) {
  if (t || r) {
    n = n || 1;
    const a = e.length / 4;
    return function(s) {
      let c = 0, i = 0;
      for (let u = 0; u < a; ++u) {
        for (let f = 0; f < n; ++f)
          e[c++] = s[i++];
        c += 4 - n;
      }
    };
  } else
    return function(o) {
      o.length ? e.set(o) : e[0] = o;
    };
}
function createUniformBlockInfoFromProgram(e, t, r, n) {
  const o = r.blockSpecs, a = r.uniformData, s = o[n];
  if (!s)
    return warn("no uniform block object named:", n), {
      name: n,
      uniforms: {}
    };
  const c = new ArrayBuffer(s.size), i = e.createBuffer(), u = s.index;
  e.bindBuffer(UNIFORM_BUFFER, i), e.uniformBlockBinding(t, s.index, u);
  let f = n + ".";
  arraySuffixRE.test(f) && (f = f.replace(arraySuffixRE, "."));
  const l = {}, _ = {}, m = {};
  return s.uniformIndices.forEach(function(E) {
    const p = a[E];
    let T = p.name;
    T.startsWith(f) && (T = T.substr(f.length));
    const d = T.endsWith("[0]");
    d && (T = T.substr(0, T.length - 3));
    const y = typeMap[p.type], h = y.Type, x = d ? pad(y.size, 16) * p.size : y.size * p.size, A = new h(c, p.offset, x / h.BYTES_PER_ELEMENT);
    l[T] = A;
    const b = createUniformBlockUniformSetter(A, d, y.rows, y.cols);
    _[T] = b, addSetterToUniformTree(T, b, m, _);
  }), {
    name: n,
    array: c,
    asFloat: new Float32Array(c),
    // for debugging
    buffer: i,
    uniforms: l,
    setters: _
  };
}
function createUniformBlockInfo(e, t, r) {
  return createUniformBlockInfoFromProgram(e, t.program, t.uniformBlockSpec, r);
}
function bindUniformBlock(e, t, r) {
  const o = (t.uniformBlockSpec || t).blockSpecs[r.name];
  if (o) {
    const a = o.index;
    return e.bindBufferRange(UNIFORM_BUFFER, a, r.buffer, r.offset || 0, r.array.byteLength), !0;
  }
  return !1;
}
function setUniformBlock(e, t, r) {
  bindUniformBlock(e, t, r) && e.bufferData(UNIFORM_BUFFER, r.array, DYNAMIC_DRAW);
}
function setBlockUniforms(e, t) {
  const r = e.setters;
  for (const n in t) {
    const o = r[n];
    if (o) {
      const a = t[n];
      o(a);
    }
  }
}
function setUniformTree(e, t) {
  for (const r in t) {
    const n = e[r];
    typeof n == "function" ? n(t[r]) : setUniformTree(e[r], t[r]);
  }
}
function setUniforms(e, ...t) {
  const r = e.uniformSetters || e, n = t.length;
  for (let o = 0; o < n; ++o) {
    const a = t[o];
    if (Array.isArray(a)) {
      const s = a.length;
      for (let c = 0; c < s; ++c)
        setUniforms(r, a[c]);
    } else
      for (const s in a) {
        const c = r[s];
        c && c(a[s]);
      }
  }
}
const setUniformsAndBindTextures = setUniforms;
function createAttributeSetters(e, t) {
  const r = {}, n = e.getProgramParameter(t, ACTIVE_ATTRIBUTES);
  for (let o = 0; o < n; ++o) {
    const a = e.getActiveAttrib(t, o);
    if (isBuiltIn(a))
      continue;
    const s = e.getAttribLocation(t, a.name), c = attrTypeMap[a.type], i = c.setter(e, s, c);
    i.location = s, r[a.name] = i;
  }
  return r;
}
function setAttributes(e, t) {
  for (const r in t) {
    const n = e[r];
    n && n(t[r]);
  }
}
function setBuffersAndAttributes(e, t, r) {
  r.vertexArrayObject ? e.bindVertexArray(r.vertexArrayObject) : (setAttributes(t.attribSetters || t, r.attribs), r.indices && e.bindBuffer(ELEMENT_ARRAY_BUFFER$1, r.indices));
}
function createProgramInfoFromProgram(e, t) {
  const r = createUniformSetters(e, t), n = createAttributeSetters(e, t), o = {
    program: t,
    uniformSetters: r,
    attribSetters: n
  };
  return isWebGL2(e) && (o.uniformBlockSpec = createUniformBlockSpecFromProgram(e, t), o.transformFeedbackInfo = createTransformFeedbackInfo(e, t)), o;
}
const notIdRE = /\s|{|}|;/;
function createProgramInfo(e, t, r, n, o) {
  const a = getProgramOptions(r, n, o), s = [];
  if (t = t.map(function(u) {
    if (!notIdRE.test(u)) {
      const f = getElementById(u);
      if (f)
        u = f.text;
      else {
        const l = `no element with id: ${u}`;
        a.errorCallback(l), s.push(l);
      }
    }
    return u;
  }), s.length)
    return reportError(a, "");
  const c = a.callback;
  c && (a.callback = (u, f) => {
    c(u, u ? void 0 : createProgramInfoFromProgram(e, f));
  });
  const i = createProgramFromSources(e, t, a);
  return i ? createProgramInfoFromProgram(e, i) : null;
}
function checkAllPrograms(e, t, r, n, o) {
  for (const [a, s] of Object.entries(t)) {
    const c = { ...o }, i = r[a];
    Array.isArray(i) || Object.assign(c, i);
    const u = getProgramErrors(e, s, c.errorCallback);
    if (u) {
      for (const f of Object.values(t)) {
        const l = e.getAttachedShaders(f);
        e.deleteProgram(f);
        for (const _ of l)
          n.has(_) || e.deleteShader(_);
      }
      return u;
    }
  }
}
function createPrograms(e, t, r = {}) {
  const n = /* @__PURE__ */ new Set(), o = Object.fromEntries(Object.entries(t).map(([s, c]) => {
    const i = { ...r }, u = Array.isArray(c) ? c : c.shaders;
    return Array.isArray(c) || Object.assign(i, c), u.forEach(n.add, n), [s, createProgramNoCheck(e, u, i)];
  }));
  if (r.callback) {
    waitForAllProgramsLinkCompletionAsync(e, o).then(() => {
      const s = checkAllPrograms(e, o, t, n, r);
      r.callback(s, s ? void 0 : o);
    });
    return;
  }
  return checkAllPrograms(e, o, t, n, r) ? void 0 : o;
}
function createProgramInfos(e, t, r) {
  r = getProgramOptions(r);
  function n(s, c) {
    return Object.fromEntries(Object.entries(c).map(
      ([i, u]) => [i, createProgramInfoFromProgram(s, u)]
    ));
  }
  const o = r.callback;
  o && (r.callback = (s, c) => {
    o(s, s ? void 0 : n(e, c));
  });
  const a = createPrograms(e, t, r);
  if (!(o || !a))
    return n(e, a);
}
const createProgramsAsync = wrapCallbackFnToAsyncFn(createPrograms), createProgramInfosAsync = wrapCallbackFnToAsyncFn(createProgramInfos);
var programs = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  createAttributeSetters,
  createProgram,
  createProgramAsync,
  createPrograms,
  createProgramsAsync,
  createProgramFromScripts,
  createProgramFromSources,
  createProgramInfo,
  createProgramInfoAsync,
  createProgramInfos,
  createProgramInfosAsync,
  createProgramInfoFromProgram,
  createUniformSetters,
  createUniformBlockSpecFromProgram,
  createUniformBlockInfoFromProgram,
  createUniformBlockInfo,
  createTransformFeedback,
  createTransformFeedbackInfo,
  bindTransformFeedbackInfo,
  setAttributes,
  setBuffersAndAttributes,
  setUniforms,
  setUniformsAndBindTextures,
  setUniformBlock,
  setBlockUniforms,
  bindUniformBlock
});
const TRIANGLES = 4, UNSIGNED_SHORT = 5123;
function drawBufferInfo(e, t, r, n, o, a) {
  r = r === void 0 ? TRIANGLES : r;
  const s = t.indices, c = t.elementType, i = n === void 0 ? t.numElements : n;
  o = o === void 0 ? 0 : o, c || s ? a !== void 0 ? e.drawElementsInstanced(r, i, c === void 0 ? UNSIGNED_SHORT : t.elementType, o, a) : e.drawElements(r, i, c === void 0 ? UNSIGNED_SHORT : t.elementType, o) : a !== void 0 ? e.drawArraysInstanced(r, o, i, a) : e.drawArrays(r, o, i);
}
function drawObjectList(e, t) {
  let r = null, n = null;
  t.forEach(function(o) {
    if (o.active === !1)
      return;
    const a = o.programInfo, s = o.vertexArrayInfo || o.bufferInfo;
    let c = !1;
    const i = o.type === void 0 ? TRIANGLES : o.type;
    a !== r && (r = a, e.useProgram(a.program), c = !0), (c || s !== n) && (n && n.vertexArrayObject && !s.vertexArrayObject && e.bindVertexArray(null), n = s, setBuffersAndAttributes(e, a, s)), setUniforms(a, o.uniforms), drawBufferInfo(e, s, i, o.count, o.offset, o.instanceCount);
  }), n && n.vertexArrayObject && e.bindVertexArray(null);
}
var draw = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  drawBufferInfo,
  drawObjectList
});
const FRAMEBUFFER = 36160, RENDERBUFFER = 36161, TEXTURE_2D = 3553, UNSIGNED_BYTE = 5121, DEPTH_COMPONENT = 6402, RGBA = 6408, DEPTH_COMPONENT24 = 33190, DEPTH_COMPONENT32F = 36012, DEPTH24_STENCIL8 = 35056, DEPTH32F_STENCIL8 = 36013, RGBA4 = 32854, RGB5_A1 = 32855, RGB565 = 36194, DEPTH_COMPONENT16 = 33189, STENCIL_INDEX = 6401, STENCIL_INDEX8 = 36168, DEPTH_STENCIL = 34041, COLOR_ATTACHMENT0 = 36064, DEPTH_ATTACHMENT = 36096, STENCIL_ATTACHMENT = 36128, DEPTH_STENCIL_ATTACHMENT = 33306, CLAMP_TO_EDGE = 33071, LINEAR = 9729, defaultAttachments = [
  { format: RGBA, type: UNSIGNED_BYTE, min: LINEAR, wrap: CLAMP_TO_EDGE },
  { format: DEPTH_STENCIL }
], attachmentsByFormat = {};
attachmentsByFormat[DEPTH_STENCIL] = DEPTH_STENCIL_ATTACHMENT;
attachmentsByFormat[STENCIL_INDEX] = STENCIL_ATTACHMENT;
attachmentsByFormat[STENCIL_INDEX8] = STENCIL_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT16] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT24] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT32F] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH24_STENCIL8] = DEPTH_STENCIL_ATTACHMENT;
attachmentsByFormat[DEPTH32F_STENCIL8] = DEPTH_STENCIL_ATTACHMENT;
function getAttachmentPointForFormat(e, t) {
  return attachmentsByFormat[e] || attachmentsByFormat[t];
}
const renderbufferFormats = {};
renderbufferFormats[RGBA4] = !0;
renderbufferFormats[RGB5_A1] = !0;
renderbufferFormats[RGB565] = !0;
renderbufferFormats[DEPTH_STENCIL] = !0;
renderbufferFormats[DEPTH_COMPONENT16] = !0;
renderbufferFormats[STENCIL_INDEX] = !0;
renderbufferFormats[STENCIL_INDEX8] = !0;
function isRenderbufferFormat(e) {
  return renderbufferFormats[e];
}
const MAX_COLOR_ATTACHMENT_POINTS = 32;
function isColorAttachmentPoint(e) {
  return e >= COLOR_ATTACHMENT0 && e < COLOR_ATTACHMENT0 + MAX_COLOR_ATTACHMENT_POINTS;
}
function createFramebufferInfo(e, t, r, n) {
  const o = FRAMEBUFFER, a = e.createFramebuffer();
  e.bindFramebuffer(o, a), r = r || e.drawingBufferWidth, n = n || e.drawingBufferHeight, t = t || defaultAttachments;
  const s = [], c = {
    framebuffer: a,
    attachments: [],
    width: r,
    height: n
  };
  return t.forEach(function(i, u) {
    let f = i.attachment;
    const l = i.samples, _ = i.format;
    let m = i.attachmentPoint || getAttachmentPointForFormat(_, i.internalFormat);
    if (m || (m = COLOR_ATTACHMENT0 + u), isColorAttachmentPoint(m) && s.push(m), !f)
      if (l !== void 0 || isRenderbufferFormat(_))
        f = e.createRenderbuffer(), e.bindRenderbuffer(RENDERBUFFER, f), l > 1 ? e.renderbufferStorageMultisample(RENDERBUFFER, l, _, r, n) : e.renderbufferStorage(RENDERBUFFER, _, r, n);
      else {
        const E = Object.assign({}, i);
        E.width = r, E.height = n, E.auto === void 0 && (E.auto = !1, E.min = E.min || E.minMag || LINEAR, E.mag = E.mag || E.minMag || LINEAR, E.wrapS = E.wrapS || E.wrap || CLAMP_TO_EDGE, E.wrapT = E.wrapT || E.wrap || CLAMP_TO_EDGE), f = createTexture$1(e, E);
      }
    if (isRenderbuffer(e, f))
      e.framebufferRenderbuffer(o, m, RENDERBUFFER, f);
    else if (isTexture(e, f))
      i.layer !== void 0 ? e.framebufferTextureLayer(
        o,
        m,
        f,
        i.level || 0,
        i.layer
      ) : e.framebufferTexture2D(
        o,
        m,
        i.target || TEXTURE_2D,
        f,
        i.level || 0
      );
    else
      throw new Error("unknown attachment type");
    c.attachments.push(f);
  }), e.drawBuffers && e.drawBuffers(s), c;
}
function resizeFramebufferInfo(e, t, r, n, o) {
  n = n || e.drawingBufferWidth, o = o || e.drawingBufferHeight, t.width = n, t.height = o, r = r || defaultAttachments, r.forEach(function(a, s) {
    const c = t.attachments[s], i = a.format, u = a.samples;
    if (u !== void 0 || isRenderbuffer(e, c))
      e.bindRenderbuffer(RENDERBUFFER, c), u > 1 ? e.renderbufferStorageMultisample(RENDERBUFFER, u, i, n, o) : e.renderbufferStorage(RENDERBUFFER, i, n, o);
    else if (isTexture(e, c))
      resizeTexture(e, c, a, n, o);
    else
      throw new Error("unknown attachment type");
  });
}
function bindFramebufferInfo(e, t, r) {
  r = r || FRAMEBUFFER, t ? (e.bindFramebuffer(r, t.framebuffer), e.viewport(0, 0, t.width, t.height)) : (e.bindFramebuffer(r, null), e.viewport(0, 0, e.drawingBufferWidth, e.drawingBufferHeight));
}
var framebuffers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  bindFramebufferInfo,
  createFramebufferInfo,
  resizeFramebufferInfo
});
const ELEMENT_ARRAY_BUFFER = 34963;
function createVertexArrayInfo(e, t, r) {
  const n = e.createVertexArray();
  return e.bindVertexArray(n), t.length || (t = [t]), t.forEach(function(o) {
    setBuffersAndAttributes(e, o, r);
  }), e.bindVertexArray(null), {
    numElements: r.numElements,
    elementType: r.elementType,
    vertexArrayObject: n
  };
}
function createVAOAndSetAttributes(e, t, r, n) {
  const o = e.createVertexArray();
  return e.bindVertexArray(o), setAttributes(t, r), n && e.bindBuffer(ELEMENT_ARRAY_BUFFER, n), e.bindVertexArray(null), o;
}
function createVAOFromBufferInfo(e, t, r) {
  return createVAOAndSetAttributes(e, t.attribSetters || t, r.attribs, r.indices);
}
var vertexArrays = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  createVertexArrayInfo,
  createVAOAndSetAttributes,
  createVAOFromBufferInfo
});
const defaults = {
  addExtensionsToContext: !0
};
function setDefaults(e) {
  copyExistingProperties(e, defaults), setDefaults$2(e), setDefaults$1(e);
}
const prefixRE = /^(.*?)_/;
function addExtensionToContext(e, t) {
  glEnumToString(e, 0);
  const r = e.getExtension(t);
  if (r) {
    const n = {}, o = prefixRE.exec(t)[1], a = "_" + o;
    for (const s in r) {
      const c = r[s], i = typeof c == "function", u = i ? o : a;
      let f = s;
      s.endsWith(u) && (f = s.substring(0, s.length - u.length)), e[f] !== void 0 ? !i && e[f] !== c && warn$1(f, e[f], c, s) : i ? e[f] = function(l) {
        return function() {
          return l.apply(r, arguments);
        };
      }(c) : (e[f] = c, n[f] = c);
    }
    n.constructor = {
      name: r.constructor.name
    }, glEnumToString(n, 0);
  }
  return r;
}
const supportedExtensions = [
  "ANGLE_instanced_arrays",
  "EXT_blend_minmax",
  "EXT_color_buffer_float",
  "EXT_color_buffer_half_float",
  "EXT_disjoint_timer_query",
  "EXT_disjoint_timer_query_webgl2",
  "EXT_frag_depth",
  "EXT_sRGB",
  "EXT_shader_texture_lod",
  "EXT_texture_filter_anisotropic",
  "OES_element_index_uint",
  "OES_standard_derivatives",
  "OES_texture_float",
  "OES_texture_float_linear",
  "OES_texture_half_float",
  "OES_texture_half_float_linear",
  "OES_vertex_array_object",
  "WEBGL_color_buffer_float",
  "WEBGL_compressed_texture_atc",
  "WEBGL_compressed_texture_etc1",
  "WEBGL_compressed_texture_pvrtc",
  "WEBGL_compressed_texture_s3tc",
  "WEBGL_compressed_texture_s3tc_srgb",
  "WEBGL_depth_texture",
  "WEBGL_draw_buffers"
];
function addExtensionsToContext(e) {
  for (let t = 0; t < supportedExtensions.length; ++t)
    addExtensionToContext(e, supportedExtensions[t]);
}
function create3DContext(e, t) {
  const r = ["webgl", "experimental-webgl"];
  let n = null;
  for (let o = 0; o < r.length; ++o)
    if (n = e.getContext(r[o], t), n) {
      defaults.addExtensionsToContext && addExtensionsToContext(n);
      break;
    }
  return n;
}
function getWebGLContext(e, t) {
  return create3DContext(e, t);
}
function createContext(e, t) {
  const r = ["webgl2", "webgl", "experimental-webgl"];
  let n = null;
  for (let o = 0; o < r.length; ++o)
    if (n = e.getContext(r[o], t), n) {
      defaults.addExtensionsToContext && addExtensionsToContext(n);
      break;
    }
  return n;
}
function getContext(e, t) {
  return createContext(e, t);
}
function resizeCanvasToDisplaySize(e, t) {
  t = t || 1, t = Math.max(0, t);
  const r = e.clientWidth * t | 0, n = e.clientHeight * t | 0;
  return e.width !== r || e.height !== n ? (e.width = r, e.height = n, !0) : !1;
}
const twgl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addExtensionsToContext,
  attributes,
  bindFramebufferInfo,
  bindTransformFeedbackInfo,
  bindUniformBlock,
  canFilter,
  canGenerateMipmap,
  createAttribsFromArrays,
  createAttributeSetters,
  createBufferFromArray,
  createBufferFromTypedArray,
  createBufferInfoFromArrays,
  createBuffersFromArrays,
  createFramebufferInfo,
  createProgram,
  createProgramAsync,
  createProgramFromScripts,
  createProgramFromSources,
  createProgramInfo,
  createProgramInfoAsync,
  createProgramInfoFromProgram,
  createProgramInfos,
  createProgramInfosAsync,
  createPrograms,
  createProgramsAsync,
  createSampler,
  createSamplers,
  createTexture: createTexture$1,
  createTextures,
  createTransformFeedback,
  createTransformFeedbackInfo,
  createUniformBlockInfo,
  createUniformBlockInfoFromProgram,
  createUniformBlockSpecFromProgram,
  createUniformSetters,
  createVAOAndSetAttributes,
  createVAOFromBufferInfo,
  createVertexArrayInfo,
  draw,
  drawBufferInfo,
  drawObjectList,
  framebuffers,
  getArray_: getArray$1,
  getBytesPerElementForInternalFormat,
  getContext,
  getFormatAndTypeForInternalFormat,
  getGLTypeForTypedArray,
  getGLTypeForTypedArrayType,
  getNumComponentsForFormat,
  getNumComponents_: getNumComponents$1,
  getTypedArrayTypeForGLType,
  getWebGLContext,
  glEnumToString,
  isArrayBuffer: isArrayBuffer$1,
  isWebGL1,
  isWebGL2,
  loadTextureFromUrl,
  m4,
  primitives,
  programs,
  resizeCanvasToDisplaySize,
  resizeFramebufferInfo,
  resizeTexture,
  setAttribInfoBufferFromArray,
  setAttributeDefaults_: setDefaults$2,
  setAttributePrefix,
  setAttributes,
  setBlockUniforms,
  setBuffersAndAttributes,
  setDefaultTextureColor,
  setDefaults,
  setEmptyTexture,
  setSamplerParameters,
  setTextureDefaults_: setDefaults$1,
  setTextureFilteringForSize,
  setTextureFromArray,
  setTextureFromElement,
  setTextureParameters,
  setUniformBlock,
  setUniforms,
  setUniformsAndBindTextures,
  textures,
  typedarrays,
  utils,
  v3,
  vertexArrays
}, Symbol.toStringTag, { value: "Module" }));
function createTexture(e, t, r) {
  const n = e.createTexture();
  return e.bindTexture(e.TEXTURE_2D, n), e.texImage2D(
    e.TEXTURE_2D,
    0,
    // level
    e.RGBA32F,
    // internal format
    t[0],
    // width
    t[1],
    // height
    0,
    // border
    e.RGBA,
    // format
    e.FLOAT,
    // type
    r
    /* source */
  ), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), n;
}
function updateTexture(e, t, r, n) {
  e.bindTexture(e.TEXTURE_2D, r), e.texImage2D(
    e.TEXTURE_2D,
    0,
    // level
    e.RGBA32F,
    // internal format
    t[0],
    // width
    t[1],
    // height
    0,
    // border
    e.RGBA,
    // format
    e.FLOAT,
    // type
    n
    /* source */
  );
}
function render(e) {
  e.drawArrays(e.TRIANGLES, 0, 6);
}
function setupProgram(e, t, r, n) {
  t.useProgram(r.program), e.setBuffersAndAttributes(t, r, n);
}
function enableGlExts(e) {
  if (e.getExtension("OES_texture_float"), e.getExtension("OES_texture_float_linear"), !e.getExtension("EXT_color_buffer_float"))
    throw alert("no ext color..."), new Error("!");
}
const vs = `
    #version 300 es
    in vec4 position;
    void main() {
      gl_Position = position;
    }`, bufferArrays = {
  position: {
    data: [
      -1,
      -1,
      1,
      -1,
      -1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      1
    ],
    numComponents: 2
  }
};
class FrameBufferManager {
  constructor(t, r) {
    this.computeDsts = [
      createTexture(t, r, null),
      createTexture(t, r, null)
    ], this.fb = t.createFramebuffer(), this.counter = 0, this.gl = t;
  }
  src() {
    return this.computeDsts[this.counter];
  }
  dst() {
    return this.computeDsts[(this.counter + 1) % 2];
  }
  flipflop() {
    this.counter = this.counter + 1, this.counter %= 2;
  }
  bind_dst() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb), this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.dst(),
      0
      /* level */
    );
  }
}
const rect_width = 100, rect_height = rect_width * 3 / 4, io_port_width = rect_width / 20;
class Pipeline {
  constructor(t, r) {
    S(this, "ui_events");
    S(this, "svg");
    S(this, "nodes");
    S(this, "last_pos");
    S(this, "adding_edge");
    S(this, "adding_edge_input");
    S(this, "adding_edge_output");
    this.ui_events = t, this.svg = r, this.nodes = /* @__PURE__ */ new Map(), this.last_pos = { x: 50, y: 50 }, this.adding_edge = !1, this.adding_edge_input = [null, null], this.adding_edge_output = null, this.svg.addEventListener("click", () => {
      this.adding_edge && (this.adding_edge = !1, this.adding_edge_input = [null, null], this.adding_edge_output = null);
    });
  }
  get_nodes() {
    return this.nodes.keys();
  }
  get_fn(t) {
    var r;
    return (r = this.nodes.get(t)) == null ? void 0 : r.fn;
  }
  get_inputs(t) {
    const r = this.nodes.get(t);
    if (!r)
      throw new Error(`Could not find node with name ${t}`);
    const n = [];
    for (let o of r.inputs)
      o ? n.push(o[0]) : n.push(null);
    return n;
  }
  get_outputs(t) {
    const r = this.nodes.get(t);
    if (!r)
      throw new Error(`Could not find node with name ${t}`);
    const n = [];
    for (let o of r.outputs)
      n.push(o[0]);
    return n;
  }
  has_output(t) {
    var r;
    return ((r = this.nodes.get(t)) == null ? void 0 : r.outputs.length) != 0;
  }
  add(t, r) {
    const n = modules[r].inputs.length;
    this.last_pos.x = -1 / 0, this.nodes.size || (this.last_pos.x = 0);
    for (let T of this.nodes.keys()) {
      const d = this.nodes.get(T), y = (d == null ? void 0 : d.svg_el.transform.baseVal[0].matrix.e) + rect_width + io_port_width + 50;
      this.last_pos.x = Math.max(y, this.last_pos.x), y > this.last_pos.x && (this.last_pos.x = y, this.last_pos.y = d.svg_el.transform.baseVal[0].matrix.f);
    }
    const o = document.createElementNS("http://www.w3.org/2000/svg", "g");
    o.classList.add("draggable");
    const a = this.svg.createSVGTransform();
    a.setTranslate(this.last_pos.x, this.last_pos.y), o.transform.baseVal.insertItemBefore(a, 0);
    const s = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    s.setAttribute("width", rect_width.toString()), s.setAttribute("height", rect_height.toString()), s.style.stroke = "black", s.style.fill = "white", s.style.fillOpacity = "0", s.onclick = () => {
      this.ui_events.show_details(t, r);
    }, o.appendChild(s);
    const c = 10, i = document.createElementNS("http://www.w3.org/2000/svg", "text");
    i.innerHTML = t, i.setAttribute("textLength", (rect_width - 2 * c).toString()), i.setAttribute("lengthAdjust", "spacingAndGlyphs");
    const u = this.svg.createSVGTransform();
    u.setTranslate(c, rect_height / 2), i.transform.baseVal.insertItemBefore(u, 0), i.id = t + "text", o.appendChild(i);
    const f = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    f.setAttribute("width", io_port_width.toString()), f.setAttribute("height", (rect_height / 4).toString()), f.style.stroke = "black", f.style.fill = "rgb(50, 150, 240)";
    const l = this.svg.createSVGTransform();
    l.setTranslate(rect_width, rect_height / 4 + rect_height / 8), f.transform.baseVal.insertItemBefore(l, 0), f.id = t + "output", f.onmousedown = (T) => {
      T.stopPropagation();
    }, f.onclick = (T) => {
      this.adding_edge_output || (this.adding_edge = !0, this.adding_edge_output = t, this.adding_edge_input[0] && this.create_edge(this.adding_edge_output, ...this.adding_edge_input), T.stopPropagation());
    }, o.appendChild(f);
    const _ = [], m = [], E = 10, p = (rect_height - (n - 1) * E) / n;
    for (let T = 0; T < n; T++) {
      _.push(null);
      const d = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      d.setAttribute("width", (rect_width / 20).toString()), d.setAttribute("height", p.toString()), d.style.stroke = "black", d.style.fill = "rgb(50, 240, 150)";
      const y = this.svg.createSVGTransform();
      y.setTranslate(-io_port_width, T * (p + E)), d.transform.baseVal.insertItemBefore(y, 0), d.id = t + "input" + T, d.onmousedown = (h) => {
        h.stopPropagation();
      }, d.onclick = (h) => {
        this.adding_edge_input[0] || (this.adding_edge = !0, this.adding_edge_input = [t, T], this.adding_edge_output && this.create_edge(this.adding_edge_output, t, T), h.stopPropagation());
      }, o.appendChild(d), m.push(d);
    }
    o.addEventListener("dragged", () => {
      const T = this.nodes.get(t);
      if (!T)
        throw new Error(`Could not find node with name ${t}`);
      const d = o.transform.baseVal[0].matrix.e, y = o.transform.baseVal[0].matrix.f, h = d + T.output_el.transform.baseVal[0].matrix.e, x = h + T.output_el.width.baseVal.value, A = y + T.output_el.transform.baseVal[0].matrix.f, b = A + T.output_el.width.baseVal.value, F = (g, R, I) => I >= g && I <= R;
      this.nodes.forEach((g, R) => {
        const I = g.svg_el.transform.baseVal[0].matrix.e, N = g.svg_el.transform.baseVal[0].matrix.f, G = I + g.output_el.transform.baseVal[0].matrix.e, w = G + g.output_el.width.baseVal.value, v = N + g.output_el.transform.baseVal[0].matrix.f, C = v + g.output_el.width.baseVal.value;
        for (let B = 0; B < m.length; B++) {
          const P = m[B], U = d + P.transform.baseVal[0].matrix.e, M = U + P.width.baseVal.value, L = y + P.transform.baseVal[0].matrix.f, $ = L + P.height.baseVal.value, O = F(U, M, G) || F(U, M, w), V = F(L, $, v) || F(L, $, C);
          O && V && this.create_edge(R, t, B);
        }
        for (let B = 0; B < g.input_els.length; B++) {
          const P = g.input_els[B], U = I + P.transform.baseVal[0].matrix.e, M = U + P.width.baseVal.value, L = N + P.transform.baseVal[0].matrix.f, $ = L + P.height.baseVal.value, O = F(h, x, U) || F(h, x, M), V = F(A, b, L) || F(A, b, $);
          O && V && this.create_edge(t, R, B);
        }
      });
      for (let g = 0; g < n; g++)
        T.inputs[g] && this.draw_edge(t, g);
      for (let g of T.outputs)
        this.draw_edge(...g);
    }), this.svg.appendChild(o), this.nodes.set(t, {
      fn: r,
      outputs: [],
      output_el: f,
      inputs: _,
      input_els: m,
      svg_el: o
    });
  }
  create_edge(t, r, n) {
    const o = this.nodes.get(r);
    if (!o)
      throw new Error(`Could not find node with name ${r}`);
    const a = o.inputs[n];
    if (a) {
      a[1] && a[1].remove(), o.inputs[n] = null;
      const s = this.nodes.get(a[0]);
      if (!s)
        throw new Error(`Could not find node with name ${a[0]}`);
      for (let c = 0; c < s.outputs.length; c++)
        s.outputs[c][0] == r && s.outputs[c][1] == n && s.outputs.splice(c, 1);
    }
    (a == null || a[0] != t) && this.set_input(r, t, n), this.adding_edge = !1, this.adding_edge_input = [null, null], this.adding_edge_output = null, this.ui_events.recompile(null);
  }
  set_input(t, r, n) {
    var a;
    const o = this.nodes.get(t);
    if (!o)
      throw new Error(`Could not find node with name ${t}`);
    o.inputs[n] = [r, null], (a = this.nodes.get(r)) == null || a.outputs.push([t, n]), this.draw_edge(t, n);
  }
  draw_edge(t, r) {
    const n = this.nodes.get(t);
    if (!n)
      throw new Error(`Could not find node with name ${t}`);
    const o = n.inputs[r];
    if (!o)
      throw new Error(`Input ${r} does not exist`);
    const a = o[0], s = this.nodes.get(a);
    if (!s)
      throw new Error(`Could not find node with name ${a}`);
    const c = s.output_el, i = c.parentElement, u = {
      x: i.transform.baseVal[0].matrix.e + c.transform.baseVal[0].matrix.e + c.width.baseVal.value,
      y: i.transform.baseVal[0].matrix.f + c.transform.baseVal[0].matrix.f + c.height.baseVal.value / 2
    }, f = n.input_els[r];
    if (!f)
      throw new Error(`Input ${r} does not exist`);
    const l = f.parentElement, _ = {
      x: l.transform.baseVal[0].matrix.e + f.transform.baseVal[0].matrix.e,
      y: l.transform.baseVal[0].matrix.f + f.transform.baseVal[0].matrix.f + f.height.baseVal.value / 2
    };
    let m = o[1];
    m || (m = document.createElementNS("http://www.w3.org/2000/svg", "line"), this.svg.appendChild(m), m.style.stroke = "black"), m.setAttribute("x1", u.x.toString()), m.setAttribute("y1", u.y.toString()), m.setAttribute("x2", _.x.toString()), m.setAttribute("y2", _.y.toString()), n.inputs[r] = [a, m];
  }
  remove_output(t, r, n) {
    const o = this.nodes.get(t);
    if (!o)
      throw new Error(`Could not find node with name ${t}`);
    for (let a = 0; a < o.outputs.length; a++)
      if (o.outputs[a][0] == r && o.outputs[a][1] == n) {
        o.outputs.splice(a, 1);
        break;
      }
  }
  remove_node(t) {
    const r = this.nodes.get(t);
    if (!r)
      throw new Error(`Could not find node with name ${t}`);
    let n = 0;
    for (let o of r.inputs) {
      if (o) {
        const a = o[0];
        o[1] && o[1].remove(), this.remove_output(a, t, n);
      }
      n += 1;
    }
    r == null || r.svg_el.remove(), this.nodes.delete(t), this.ui_events.recompile(null);
  }
  _organize() {
    const r = /* @__PURE__ */ new Map();
    return this.nodes.forEach((n, o) => {
      var c;
      const a = {
        x: n.svg_el.transform.baseVal[0].matrix.e,
        y: n.svg_el.transform.baseVal[0].matrix.f
      }, s = { x: 0, y: 0 };
      this.nodes.forEach((i) => {
        if (n == i)
          return;
        const u = {
          x: i.svg_el.transform.baseVal[0].matrix.e,
          y: i.svg_el.transform.baseVal[0].matrix.f
        }, f = { x: a.x - u.x, y: a.y - u.y }, l = Math.pow(f.x, 2) + Math.pow(f.y, 2), _ = Math.sqrt(l);
        f.x /= _, f.y /= _;
        const m = 2e4 / l;
        s.x += f.x * m, s.y += f.y * m;
      });
      for (let i of n.inputs) {
        if (!i || !i[1])
          continue;
        const u = i[1].x2.baseVal.value - i[1].x1.baseVal.value, f = i[1].y2.baseVal.value - i[1].y1.baseVal.value, l = { x: 0, y: 0 };
        u < 0 ? l.x += -u * 0.5 : u > 25 ? l.x -= (u - 25) * 0.5 : u < 25 && (l.x += (25 - u) * 0.5), f != 0 && (l.y += -f * 0.1), s.x += l.x / n.inputs.length, s.y += l.y / n.inputs.length;
      }
      for (let i of n.outputs) {
        const u = (c = this.nodes.get(i[0])) == null ? void 0 : c.inputs[i[1]];
        if (!u || !u[1])
          continue;
        const f = u[1].x2.baseVal.value - u[1].x1.baseVal.value, l = u[1].y2.baseVal.value - u[1].y1.baseVal.value, _ = { x: 0, y: 0 };
        f < 0 ? _.x += -f * 0.5 : f > 25 ? _.x -= (f - 25) * 0.5 : f < 25 && (_.x += (25 - f) * 0.5), l != 0 && (_.y += -l * 0.1), s.x -= _.x / n.outputs.length, s.y -= _.y / n.outputs.length;
      }
      Math.abs(s.x) < 0.1 && (s.x = 0), Math.abs(s.y) < 0.1 && (s.y = 0), r.set(o, s), n.svg_el.transform.baseVal[0].setTranslate(
        n.svg_el.transform.baseVal[0].matrix.e + s.x,
        n.svg_el.transform.baseVal[0].matrix.f + s.y
      ), n.svg_el.dispatchEvent(new Event("dragged"));
    }), r;
  }
  async organize() {
    let t = this._organize();
    for (; ; ) {
      const r = this._organize();
      let n = !1;
      for (let o of t.keys()) {
        const a = t.get(o), s = r.get(o);
        if (Math.pow(a.x - s.x, 2) + Math.pow(a.y - s.y, 2) > 1e-3) {
          n = !0;
          break;
        }
      }
      if (!n)
        break;
      t = r, await new Promise((o) => {
        setTimeout(o, 1);
      });
    }
  }
  clear() {
    this.nodes = /* @__PURE__ */ new Map(), this.last_pos = { x: 50, y: 50 }, this.adding_edge = !1, this.adding_edge_input = [null, null], this.adding_edge_output = null, this.svg.innerHTML = "";
  }
}
class GenParams {
  constructor(t) {
    S(this, "params", {});
    S(this, "range", null);
    this.range = t;
  }
  get() {
    return this.params;
  }
  save() {
    return this.params;
  }
  load(t) {
    for (let r of Object.keys(t))
      this.params[r] = t[r];
  }
}
class DefaultParams extends GenParams {
  constructor() {
    super(...arguments);
    S(this, "params", { freq: 1, c: 0, y: 0, a: 1 });
  }
}
const constrain = (e, t) => Math.min(Math.max(t, e[0]), e[1]), sin_generator = (e, t, r) => {
  const n = r.get();
  let o = Math.sin(n.freq * 2 * Math.PI * e / 1e3 + n.c);
  return o = n.a * o + n.y, o = (o + 1) / 2, o = o * (t[1] - t[0]) + t[0], o = constrain(t, o), o;
}, raw_step = (e, t, r, n) => (e / 1e3 * r + n) % (t[1] - t[0]) + t[0], step_generator = (e, t, r) => {
  const n = r.get();
  return constrain(t, n.a * raw_step(e, t, n.freq, n.c) + n.y);
}, inv_step_generator = (e, t, r) => {
  const n = r.get(), o = raw_step(e, t, n.freq, n.c);
  return constrain(t, n.a * (t[1] - o + t[0]) + n.y);
}, defaultFnUI = (e, t) => {
  e.appendChild(createElement(html`
        <div>
            <br>
            <label for="freq_input">Frequency: </label>
            <${getEl("float-bar")}
                id="freq_input"
                range="[0, 100]"
                defaultValue="1"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
            <br>
            <label for="c_input">Phase shift: </label>
            <${getEl("float-bar")}
                id="c_input"
                range="[0, ${2 * Math.PI}]"
                defaultValue="0"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
            <br>
            <label for="a_input">Amplitude: </label>
            <${getEl("float-bar")}
                id="a_input"
                range="[0, 10]"
                defaultValue="1"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
            <br>
            <label for="y_input">Y offset: </label>
            <${getEl("float-bar")}
                id="y_input"
                range="[-1, 1]"
                defaultValue="0"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
        </div>
    `));
  const r = e.querySelector("#freq_input"), n = e.querySelector("#c_input"), o = e.querySelector("#a_input"), a = e.querySelector("#y_input");
  r.set_value(t.params.freq), n.set_value(t.params.c), o.set_value(t.params.a), a.set_value(t.params.y), r.addEventListener("change", () => {
    t.params.freq = parseFloat(r.value);
  }), n.addEventListener("change", () => {
    t.params.c = parseFloat(n.value);
  }), o.addEventListener("change", () => {
    t.params.a = parseFloat(o.value);
  }), a.addEventListener("change", () => {
    t.params.y = parseFloat(a.value);
  });
}, generators = {
  sin: { func: sin_generator, params: DefaultParams, ui: defaultFnUI },
  step: { func: step_generator, params: DefaultParams, ui: defaultFnUI },
  inv_step: { func: inv_step_generator, params: DefaultParams, ui: defaultFnUI }
  // audio: { func: audio_generator, params: AudioDefaultParams, ui: audioUI }
};
class FunctionGenerator {
  constructor(t, r, n, o, a) {
    S(this, "cancel", !1);
    const s = document.createElement("div");
    s.className = "functiongen";
    const c = document.createElement("h1");
    c.innerText = "Function Generator", s.appendChild(c), s.appendChild(document.createElement("hr")), this.graph = document.createElement("canvas"), this.graph.className = "functioncanvas", this.graph.width = 1e3, this.graph.height = 1e3, s.appendChild(this.graph), this.ctx = this.graph.getContext("2d"), this.freq = 1, this.c = 0, this.draw_axes(), this.func = generators[r].func, this.params = n || new generators[r].params(), console.log("Using params", this.params);
    const i = document.createElement("div");
    i.className = "function-ui", generators[r].ui(i, this.params), i.appendChild(document.createElement("br")), i.appendChild(document.createElement("br"));
    const u = document.createElement("button");
    u.innerText = "done", i.appendChild(u), u.addEventListener("click", () => {
      o(this.params);
    }), s.appendChild(document.createElement("br")), s.appendChild(document.createElement("br")), s.appendChild(i), t.appendChild(s), this.synth = a;
    const f = () => {
      this.draw_axes(), this.draw_function(), this.draw_labels(), this.cancel || requestAnimationFrame(f);
    };
    f();
  }
  draw_axes() {
    this.ctx.fillStyle = "black", this.ctx.beginPath(), this.ctx.rect(0, 0, 1e3, 1e3), this.ctx.fill(), this.ctx.fillStyle = "#ffffff50";
    const t = 20;
    for (let r = 1; r < t; r++) {
      const n = r * (this.graph.width / t);
      this.ctx.beginPath(), this.ctx.rect(n, 0, 5, 1e3), this.ctx.fill(), this.ctx.beginPath(), this.ctx.rect(0, n, 1e3, 5), this.ctx.fill();
    }
  }
  draw_function() {
    this.ctx.strokeStyle = "red", this.ctx.lineWidth = 4, this.ctx.beginPath();
    const t = this.graph.height / 2;
    this.ctx.moveTo(0, t);
    for (let r = 0; r < this.graph.width; r++)
      this.ctx.lineTo(r, t - t * this.func(r, [-1, 1], this.params, this.synth));
    this.ctx.stroke();
  }
  draw_labels() {
    this.ctx.beginPath(), this.ctx.rect(0, 0, 1e3, 1e3), this.ctx.fill();
  }
  remove() {
    this.cancel = !0;
  }
}
const html = String.raw;
function createElement(e) {
  const t = document.createElement("div");
  t.innerHTML = e;
  const r = document.createDocumentFragment();
  return Array.prototype.slice.apply(t.childNodes).map((o) => r.appendChild(o)), r;
}
const __suffix = window.globalsuffix, getEl = (e) => e + (__suffix || "");
function defineEl(e, t) {
  customElements.define(getEl(e), t);
}
function createModal(e) {
  const t = document.createElement("div");
  return t.addEventListener("click", (r) => {
    r.target == t && (e(void 0), t.remove());
  }), t.style.background = "#2b2b2b50", t.style.position = "absolute", t.style.left = "0", t.style.top = "0", t.style.width = "100%", t.style.height = "100%", document.body.appendChild(t), t;
}
let Type$1 = class extends HTMLElement {
  constructor(range, defaultValue) {
    super();
    S(this, "name", "");
    S(this, "range", []);
    S(this, "defaultValue", 0);
    S(this, "shadow", null);
    S(this, "value", 0);
    this.synth = null, this.range = range, (this.range === null || this.range === void 0) && (this.range = eval(this.getAttribute("range"))), this.defaultValue = defaultValue, (this.defaultValue === null || this.defaultValue === void 0) && (this.defaultValue = eval(this.getAttribute("defaultValue"))), this.shadow = this.attachShadow({ mode: "open" });
  }
};
class BoolEntry extends Type$1 {
  constructor(t) {
    super([0, 0], t), this.shadow.appendChild(createElement(html`
            <input type="checkbox"></input>
        `)), this.input = this.shadow.querySelector("input"), this.input.checked = t, this.value = this.input.checked, this.input.addEventListener("change", () => {
      this.value = this.input.checked, this.dispatchEvent(new Event("change"));
    });
  }
  save() {
    return this.value;
  }
}
defineEl("bool-entry", BoolEntry);
class Slider extends Type$1 {
  constructor(t, r) {
    super(t, r), this.shadow.appendChild(createElement(html`
            <div style="padding-bottom: 0.5em;"> <!-- TODO use template + <style> ? -->
                <div id="bar" style="background: black; width: 10em; height: 1em;">
                    <div
                        id="slider"
                        style="background: white; width: 1%; height: 1em; position: relative; left: 0em">
                    </div>
                </div>
            </div>
        `));
    const n = this.shadow.querySelector("#bar");
    this.slider = this.shadow.querySelector("#slider");
    const o = (a) => {
      if (a.target != n)
        return;
      const s = a.target.getBoundingClientRect(), c = a.clientX || a.touches[0].clientX;
      a.clientY || a.touches[0].clientY;
      const i = (c - s.left) / s.width;
      this.value = i * (this.range[1] - this.range[0]) + this.range[0], this.dispatchEvent(new Event("change"));
    };
    n.addEventListener("mousemove", (a) => {
      a.buttons & 1 && o(a);
    }), n.addEventListener("touchmove", o);
  }
  set_value(t) {
    const r = (t - this.range[0]) / (this.range[1] - this.range[0]);
    this.slider.style.left = `${r * 10}em`;
  }
}
defineEl("slider-elem", Slider);
class FloatBar extends Type$1 {
  validate(e) {
    return !isNaN(e) && e >= this.range[0] && e <= this.range[1];
  }
  _set_value(e) {
    this.value = e, this.input.value = this.value, this.slider.set_value(e);
  }
  set_value(e) {
    this._set_value(e), this.dispatchEvent(new Event("change"));
  }
  set_generated() {
    this.generated = !0, this.func_gen.checked = !0;
  }
  constructor(range, defaultValue, supressFunctionGen) {
    super(range, defaultValue), supressFunctionGen == null && (supressFunctionGen = eval(this.getAttribute("supressFunctionGen"))), this.shadow.appendChild(createElement(html`
            <div>
                <${getEl("slider-elem")} range="[${this.range}]" defaultValue="${this.defaultValue}">
                </${getEl("slider-elem")}>
                <input
                    id="floatinp"
                    style="box-shadow: none;"
                    type="number"
                    min="${this.range[0]}"
                    max="${this.range[1]}"
                    step="${(this.range[1] - this.range[0]) / 1e3}"></input>
                <div id="functiongen">
                    <label for="generate">function: </label>
                    <input id="generate" type="checkbox"></input>
                    <select></select>
                    <button>Edit function</button>
                </div>
            </div>
        `)), this.slider = this.shadow.querySelector(getEl("slider-elem")), this.input = this.shadow.querySelector("#floatinp"), this._set_value(this.defaultValue), this.input.addEventListener("change", () => {
      const e = parseFloat(this.input.value);
      this.validate(e) ? (this.input.style = "", this.set_value(e)) : this.input.style = "color: red";
    }), this.slider.addEventListener("change", () => {
      this.set_value(this.slider.value);
    });
    const funcgen_container = this.shadow.querySelector("#functiongen");
    this.func_gen = funcgen_container.querySelector("#generate");
    const func_modal = funcgen_container.querySelector("button");
    this.func_select = funcgen_container.querySelector("select"), Object.keys(generators).forEach((e) => {
      const t = document.createElement("option");
      t.value = e, t.innerText = e, this.func_select.appendChild(t);
    }), this.generate = !1;
    const set_func = () => {
      this.func = this.func_select.value, this.params = new generators[this.func_select.value].params(this.range), this.dispatchEvent(new Event("function"));
    };
    set_func(), this.func_select.addEventListener("change", set_func), this.func_gen.addEventListener("change", () => {
      this.generate = this.func_gen.checked, this.dispatchEvent(new Event("function"));
    }), func_modal.addEventListener("click", async () => {
      let e;
      const t = new Promise((s) => {
        e = s;
      }), r = createModal(e);
      let n;
      this.generate && (n = this.params);
      const o = new FunctionGenerator(
        r,
        this.func_select.value,
        n,
        e,
        this.synth
      ), a = await t;
      o.remove(), r.remove(), a && (this.params = a, this.generate = !0, this.func_gen.checked = !0, this.dispatchEvent(new Event("function")));
    }), supressFunctionGen && (funcgen_container.style.display = "none");
  }
}
defineEl("float-bar", FloatBar);
class IntEntry extends FloatBar {
  _set_value(t) {
    t = Math.round(t), super._set_value(t);
  }
  constructor(t, r, n) {
    super(t, r, n), this.input.step = 1;
  }
}
defineEl("int-entry", IntEntry);
class VecEntry extends Type$1 {
  constructor(r, n, o, a) {
    super(o, a);
    S(this, "floats", []);
    S(this, "generate", []);
    S(this, "func", []);
    S(this, "params", []);
    this.nelem = r, this.names = n;
    for (let s = 0; s < this.nelem; s++)
      this.shadow.appendChild(createElement(html`
                <label for="${n[s]}">${n[s]}: </label>
                <${getEl("float-bar")}
                    id="${n[s]}"
                    range="[${this.range[s]}]"
                    defaultValue="${this.defaultValue[s]}">
                </${getEl("float-bar")}>
              `)), this.generate.push(!1), this.func.push(null), this.params.push(null);
    this.value = this.defaultValue, this.floats = Array.from(this.shadow.querySelectorAll(getEl("float-bar")));
    for (let s = 0; s < this.nelem; s++) {
      let c = this.floats[s];
      c.addEventListener("change", () => {
        this.value[s] = c.value, this.dispatchEvent(new Event("change"));
      }), c.addEventListener("function", () => {
        this.generate[s] = c.generate, this.func[s] = c.func, this.params[s] = c.params, this.dispatchEvent(new Event("function"));
      });
    }
  }
  set_value(r, n) {
    this.value[n] = r, this.floats[n].set_value(r);
  }
  set_generated(r) {
    for (let n = 0; n < this.nelem; n++)
      this.generated = r[n], this.func_gen.checked = r[n];
  }
}
defineEl("vec-entry", VecEntry);
class ChannelId {
  constructor(t) {
    this.id = t;
  }
}
class ChannelSelect extends Type$1 {
  constructor(t) {
    const r = new ChannelId(0);
    super(void 0, r), this.value = r, this.shadow.appendChild(createElement(html`
            <input type="number" min="0" step="1"></input>
        `)), this.input = this.shadow.querySelector("input"), this.input.value = 0, this.input.addEventListener("change", () => {
      if (this.input.value >= t.channels.length) {
        this.input.style = "color: red";
        return;
      }
      this.input.style = "", this.value.id = parseInt(this.input.value), console.log(parseInt(this.input.value), this.value), this.dispatchEvent(new Event("change"));
    });
  }
  save() {
    return this.value.id;
  }
  load(t) {
    this.value.id = t, this.input.value = t, this.dispatchEvent(new Event("change"));
  }
}
defineEl("channel-select", ChannelSelect);
class Type extends HTMLElement {
  constructor(range, defaultValue) {
    super();
    S(this, "name", "");
    S(this, "range", []);
    S(this, "defaultValue", 0);
    S(this, "shadow");
    S(this, "value", 0);
    this.range = range, (this.range === null || this.range === void 0) && (this.range = eval(this.getAttribute("range") || "null")), this.defaultValue = defaultValue, (this.defaultValue === null || this.defaultValue === void 0) && (this.defaultValue = eval(this.getAttribute("defaultValue") || "null")), this.shadow = this.attachShadow({ mode: "open" });
  }
}
class ReduceColorsData extends Type {
  constructor(r, n, o) {
    super([], r);
    S(this, "gl");
    this.value = r, this.gl = n;
    const a = document.createElement("div"), s = document.createElement("button");
    s.addEventListener("click", () => {
      ReduceColorsData.generate_colors(this.value, this.gl), this.dispatchEvent(new Event("change"));
    }), s.innerText = "Re-pick colors", a.appendChild(s), this.shadow.appendChild(a);
  }
  static generate_colors(r, n) {
    const o = new Float32Array(1024);
    for (let a = 0; a < 4 * 256; a++)
      o[a] = Math.random();
    updateTexture(n, [256, 1], r, o);
  }
  static default(r) {
    const n = createTexture(r, [256, 1]);
    return ReduceColorsData.generate_colors(n, r), n;
  }
}
defineEl("reduce_colors-data", ReduceColorsData);
class WebcamSource extends Type {
  constructor(r, n, o) {
    super([], r);
    S(this, "gl");
    S(this, "source", null);
    this.value = r, this.gl = n;
    const a = o.list_webcam_sources();
    console.log(a, o);
    const s = document.createElement("div");
    s.innerHTML = '<label for="webcamSelector">Choose a webcam: </label>';
    const c = document.createElement("select");
    c.id = "webcamSelector";
    for (let u of a) {
      const f = document.createElement("option");
      f.value = u, f.innerHTML = u.substr(0, 10), c.appendChild(f);
    }
    s.appendChild(c);
    const i = document.createElement("button");
    i.innerText = "Select", i.onclick = () => {
      this.source = c.value, this.dispatchEvent(new Event("change")), this.dispatchEvent(new Event("webcam"));
    }, s.appendChild(i), this.shadow.appendChild(s);
  }
  static default(r) {
    return null;
  }
}
defineEl("webcam-src", WebcamSource);
const elements = {
  "reduce_colors-data": ReduceColorsData,
  "webcam-src": WebcamSource
};
class Synth {
  constructor(t, r, n, o) {
    S(this, "canvas");
    S(this, "dimensions");
    S(this, "gl");
    S(this, "programInfo", null);
    S(this, "bufferInfo");
    S(this, "fbs");
    S(this, "ui_events");
    S(this, "pipeline");
    S(this, "module_to_counts");
    S(this, "params");
    S(this, "functions");
    S(this, "active_params");
    S(this, "webcam_sources");
    S(this, "webcam_listeners");
    this.canvas = t, this.dimensions = r, t.width = r[0], t.height = r[1];
    const a = t.getContext("webgl2", { preserveDrawingBuffer: !0 });
    if (!a)
      throw new Error("WebGL2 context unavailible");
    this.gl = a, enableGlExts(this.gl), this.bufferInfo = createBufferInfoFromArrays(this.gl, bufferArrays), this.fbs = new FrameBufferManager(this.gl, r), this.ui_events = n, this.pipeline = new Pipeline(this.ui_events, o), this.active_params = /* @__PURE__ */ new Map(), this.ui_events.register_organize(() => {
      this.pipeline.organize();
    }), this.ui_events.register_recompile((s) => this.recompile(s)), this.module_to_counts = /* @__PURE__ */ new Map();
    for (let s of Object.getOwnPropertyNames(modules))
      this.module_to_counts.set(s, 0);
    this.params = {
      u_dimensions: r,
      u_tex_dimensions: r,
      u_prev_frame: this.fbs.src()
    }, this.functions = {}, this.webcam_sources = /* @__PURE__ */ new Map(), this.webcam_listeners = /* @__PURE__ */ new Map(), this.ui_events.register_add_event((s) => {
      this.add_fn(s, null);
    }), this.ui_events.register_show_details(this.show_details.bind(this)), this.ui_events.register_get_webcam_feed(this.get_webcam_feed.bind(this)), this.ui_events.register_list_webcam_sources(this.list_webcam_sources.bind(this)), this.ui_events.register_add_webcam_feed(this.add_webcam_feed.bind(this)), this.ui_events.register_remove_webcam_feed(this.remove_webcam_feed.bind(this));
  }
  step(t) {
    try {
      if (this.params.u_prev_frame = this.fbs.src(), this.run_functions(t), this.fbs.bind_dst(), !this.programInfo)
        return;
      setUniforms(this.programInfo, this.params), render(this.gl), this.fbs.flipflop(), this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null), render(this.gl);
    } catch (r) {
      console.error(r);
    }
  }
  async recompile(t) {
    let r = template, n = null, o = [], a = /* @__PURE__ */ new Set();
    for (let c of this.pipeline.get_nodes())
      this.pipeline.get_inputs(c).length == 0 && o.push(c);
    for (; o.length; ) {
      const c = o.shift();
      if (!c)
        throw new Error("Expected at least one node");
      if (a.has(c))
        continue;
      let i = !1;
      for (let _ of this.pipeline.get_inputs(c))
        if (!_ || !a.has(_)) {
          i = !0;
          break;
        }
      if (i)
        continue;
      const u = this.pipeline.get_fn(c);
      let f = modules[u].src;
      f = f.replaceAll("STAGE", `${c}`);
      let l = 0;
      for (let _ of this.pipeline.get_inputs(c))
        f = f.replaceAll(`INPUT${l}`, `${_}`), l += 1;
      r += f, this.pipeline.has_output(c) || (n = c), a.add(c);
      for (let _ of this.pipeline.get_outputs(c))
        a.has(_) || o.push(_);
    }
    let s = t;
    t || (s = n), r += `vec4 synth(vec2 coords) { return ${s}(coords); }`;
    try {
      this.programInfo && (this.gl.deleteProgram(this.programInfo.program), this.programInfo = null), this.programInfo = createProgramInfo(this.gl, [vs, r]), setupProgram(twgl, this.gl, this.programInfo, this.bufferInfo), console.log("compilation success!", s, t);
    } catch {
    }
  }
  async add_fn(t, r) {
    console.log(this, this.module_to_counts);
    let n = this.module_to_counts.get(t);
    n || (n = 0), this.module_to_counts.set(t, n + 1), r || (r = `${t}${n}`), this.pipeline.add(r, t), modules[t].custom_module;
    for (let o of modules[t].params) {
      const a = `${r}_${o.name}`;
      o.info ? this.params[a] = o.info.default : this.params[a] = elements[`${t}-${o.name}`].default(this.gl), this.functions[a] = null;
    }
    return await this.recompile(r), r;
  }
  show_details(t, r) {
    const n = document.getElementById("fn-details");
    n.innerHTML = `<h2>${t}</h2>`, this.active_params = /* @__PURE__ */ new Map();
    const o = modules[r].params;
    for (let s of o) {
      n.appendChild(document.createElement("br"));
      const c = `${t}_${s.name}`, i = document.createElement("label");
      i.innerText = `${s.name}:`, i.setAttribute("for", c), n.appendChild(i);
      const u = (l, _) => {
        _.appendChild(l), l.id = c, l.addEventListener("change", () => {
          this.params[c] = l.value;
        }), l.addEventListener("function", () => {
          this.functions[c] = [l.generate, l.func, l.params];
        }), l.addEventListener("webcam", () => {
          this.webcam_listeners.set(c, l.source);
        }), this.functions[c] && l.set_generated(this.functions[c][0]), this.active_params.set(c, l);
      }, f = this.params[c];
      switch (s.type) {
        case "bool": {
          const l = new BoolEntry(f);
          u(l, n);
          break;
        }
        case "int": {
          const l = new IntEntry([s.info.start, s.info.end], f);
          u(l, n);
          break;
        }
        case "float": {
          const l = new FloatBar([s.info.start, s.info.end], f);
          u(l, n);
          break;
        }
        case "vec2":
        case "vec3": {
          const l = [];
          for (let E = 0; E < s.info.start.length; E++)
            l.push([s.info.start[E], s.info.end[E]]);
          const _ = new VecEntry(
            s.info.start.length,
            s.info.names,
            l,
            [...f]
          ), m = document.createElement("div");
          m.style.padding = "1em", n.appendChild(m), u(_, m);
          break;
        }
        case null: {
          const l = new elements[`${r}-${s.name}`](f, this.gl, this.ui_events);
          u(l, n);
          break;
        }
        default:
          throw new Error("!");
      }
    }
    n.appendChild(document.createElement("br")), n.appendChild(document.createElement("br"));
    const a = document.createElement("button");
    a.innerText = "delete", a.onclick = () => {
      this.pipeline.remove_node(t);
    }, n.appendChild(a), n.appendChild(document.createElement("br")), n.appendChild(document.createElement("br"));
  }
  run_functions(t) {
    for (let r of Object.keys(this.functions)) {
      let n = this.functions[r];
      if (!n)
        continue;
      let o = null;
      this.active_params.has(r) && (o = this.active_params.get(r));
      const [a, s, c] = n;
      let i = this.params[r];
      if (Array.isArray(a)) {
        for (let u = 0; u < a.length; u++)
          if (a[u]) {
            const f = generators[s[u]].func(t, c[u].range, c[u]);
            i[u] = f, o == null || o.set_value(f, u);
          }
      } else
        a && (i = generators[s].func(t, c.range, c), o == null || o.set_value(i));
      this.params[r] = i;
    }
    this.webcam_listeners.forEach((r, n) => {
      const o = this.get_webcam_feed(r), a = [o.videoWidth, o.videoHeight];
      if (this.params[n] == null) {
        const s = createTexture(this.gl, a);
        this.params[n] = s;
      }
      updateTexture(this.gl, a, this.params[n], o);
    });
  }
  save() {
    const t = {
      params: this.params,
      functions: this.functions,
      stages: {},
      module_to_counts: {}
    };
    for (let r of this.pipeline.get_nodes()) {
      const n = this.pipeline.get_fn(r), o = this.pipeline.get_inputs(r);
      t.stages[r] = { module: n, inputs: o };
    }
    return this.module_to_counts.forEach((r, n) => {
      r > 0 && (t.module_to_counts[n] = r);
    }), JSON.stringify(t);
  }
  async load(t) {
    this.pipeline.clear(), this.module_to_counts.forEach((n, o) => {
      this.module_to_counts.set(o, 0);
    });
    for (let n of Object.getOwnPropertyNames(t.stages)) {
      const o = t.stages[n].module;
      await this.add_fn(o, n);
    }
    for (let n of Object.getOwnPropertyNames(t.stages)) {
      const o = t.stages[n].inputs;
      for (let a = 0; a < o.length; a++)
        o[a] && this.pipeline.create_edge(o[a], n, a);
    }
    this.params = t.params, this.functions = t.functions;
    for (let n of Object.getOwnPropertyNames(this.functions)) {
      const o = this.functions[n];
      if (o) {
        const a = o[2];
        this.functions[n][2] = new GenParams(a.range), this.functions[n][2].load(a.params);
      }
    }
    await this.pipeline.organize();
    const r = document.getElementById("fn-details");
    r.innerHTML = "";
  }
  get_webcam_feed(t) {
    return this.webcam_sources.get(t);
  }
  list_webcam_sources() {
    return this.webcam_sources.keys();
  }
  add_webcam_feed(t, r) {
    return console.log("!!!"), this.webcam_sources.set(t, r);
  }
  remove_webcam_feed(t) {
    return this.webcam_sources.delete(t);
  }
}
async function main() {
  const e = document.getElementById("glcanvas"), t = new UIEventManager();
  setupUI(t);
  const r = document.getElementById("synth-pipeline");
  makeDraggable(r);
  const n = new Synth(e, [1e3, 1e3], t, r);
  await (async () => {
    const c = await n.add_fn("copy_prev_frame"), i = await n.add_fn("zoom");
    n.pipeline.create_edge(c, i, 0);
    const u = await n.add_fn("polygon"), f = await n.add_fn("mix");
    n.pipeline.create_edge(i, f, 0), n.pipeline.create_edge(u, f, 1);
    const l = await n.add_fn("rotate");
    n.pipeline.create_edge(f, l, 0), await n.pipeline.organize(), n.params[`${u}_color`] = [1, 1, 1], n.params[`${i}_x`] = 0.75, n.params[`${i}_y`] = 0.75, n.params[`${l}_angle`] = Math.PI / 4, t.recompile(l), t.show_details(l, "rotate");
  })();
  let a = null;
  const s = (c) => {
    if (n.step(c), a) {
      a();
      return;
    }
    requestAnimationFrame(s);
  };
  requestAnimationFrame(s), window.synth = n, window.stop_synth = () => new Promise((c) => {
    a = () => {
      c(null);
    };
  }), window.start_synth = () => {
    requestAnimationFrame(s);
  };
}
export {
  Synth,
  UIEventManager,
  main
};
