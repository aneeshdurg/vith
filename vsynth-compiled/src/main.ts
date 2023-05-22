import './style.css'
import * as twgl from 'twgl.js'
import * as common from './common'

(window as any).common = common;

document.addEventListener("DOMContentLoaded", async () => {
  const canvas = <HTMLCanvasElement>document.getElementById("glcanvas");
  if (!canvas) {
    throw new Error("!");
  }
  const dimensions = [1000, 1000];
  canvas.width = dimensions[0];
  canvas.height = dimensions[1];

  const vsynth = [
    {
      fn: "copy_prev_frame",
      name: "c0",
      params: {},
    },
    {
      fn: "zoom",
      name: "z0",
      params: {"INPUT": "c0"},
    },
    {
      fn: "polygon",
      name: "p0",
      params: {},
    },
    {
      fn: "mix",
      name: "m0",
      params: {"INPUT0": "z0", "INPUT1": "p0"},
    },
  ];

  let synth_prog = await common.getFile("./glsl/template.frag.c");
  let index = 0;
  for (let stage of vsynth) {
    index++;

    let stage_src = await common.getFile(`./glsl/${stage.fn}.frag.c`);
    stage_src = stage_src.replaceAll("STAGE", `${stage.name}`);
    for (let key of Object.getOwnPropertyNames(stage.params)) {
      stage_src = stage_src.replaceAll(key, `${stage.params[key]}`);
    }
    synth_prog += stage_src;
  }
  synth_prog += `vec4 synth(vec2 coords) { return ${vsynth[vsynth.length - 1].name}(coords); }`;
  console.log(synth_prog);

  const gl = canvas.getContext("webgl2", {'preserveDrawingBuffer': true});
  if (!gl) {
    throw new Error("!");
  }
  common.enableGlExts(gl);
  const programInfo = twgl.createProgramInfo(gl, [common.vs, synth_prog]);
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, common.bufferArrays);
  common.setupProgram(twgl, gl, programInfo, bufferInfo);

  const fbs = new common.FrameBufferManager(gl, dimensions);
  let params = {
    u_dimensions: dimensions,
    u_tex_dimensions: dimensions,
    u_prev_frame: fbs.src(),
    p0_color: [1, 0, 0],
    p0_n: 4,
    p0_r: 0.49999,
    p0_thickness: 0.025,
    p0_smooth_edges: true,
    p0_fill: false,
    p0_destructive: false,
    m0_input0_strength: 1.0,
    m0_input1_strength: 1.0,
    z0_x: 0.75,
    z0_y: 0.75,
    z0_center: [0.5, 0.5],
  }

  const run = () => {
    params["u_prev_frame"] = fbs.src();

    fbs.bind_dst();
    twgl.setUniforms(programInfo, params);
    common.render(gl);
    fbs.flipflop();

    // TODO just render fbs.src instead
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    common.render(gl);

    requestAnimationFrame(run);
  };

  (window as any).params = params;
  run();
});
