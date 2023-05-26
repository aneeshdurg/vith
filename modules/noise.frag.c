uniform float STAGE_r; /// { "start": 0, "end": 10000, "default": 0 }
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
