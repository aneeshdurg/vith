import './style.css'
import * as twgl from 'twgl.js'
import * as common from './common'
import * as modules from './module_list.json'
import {Pipeline} from './pipeline.ts'
import {UIEventManager, setupUI} from './ui.ts'

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

  // console.log(synth_prog);

  const gl = canvas.getContext("webgl2", {'preserveDrawingBuffer': true});
  if (!gl) {
    throw new Error("!");
  }
  common.enableGlExts(gl);
  let programInfo = null;
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, common.bufferArrays);
  const fbs = new common.FrameBufferManager(gl, dimensions);

  const ui_events = new UIEventManager();
  setupUI(ui_events);

  const pipeline = new Pipeline(ui_events);

  const recompile = async (pipeline, node_to_render) => {
    // Implements a BFS starting from leaf nodes
    let synth_prog = await common.getFile("./glsl/template.frag.c");
    let last_node_with_no_output = null;
    let frontier = [];
    let visited = new Set<string>();
    for (let node of pipeline.get_nodes()) {
      if (pipeline.get_inputs(node).length == 0) {
        frontier.push(node);
      }
    }

    while (frontier.length) {
      const node = frontier.shift();
      if (visited.has(node)) {
        continue;
      }

      let invalid = false;
      for (let input of pipeline.get_inputs(node)) {
        if (!visited.has(input)) {
          invalid = true;
          break;
        }
      }
      if (invalid) {
        continue
      }

      let stage_src = await common.getFile(`./glsl/${pipeline.get_fn(node)}.frag.c`);
      stage_src = stage_src.replaceAll("STAGE", `${node}`);

      let counter = 0;
      for (let input of pipeline.get_inputs(node)) {
        stage_src = stage_src.replaceAll(`INPUT${counter}`, `${input}`);
        counter += 1;
      }
      synth_prog += stage_src;

      if (!pipeline.has_output(node)) {
        last_node_with_no_output = node;
      }

      visited.add(node);
      for (let child of pipeline.get_outputs(node)) {
        if (!visited.has(child)) {
          frontier.push(child);
        }
      }
    }

    if (node_to_render) {
      synth_prog += `vec4 synth(vec2 coords) { return ${node_to_render}(coords); }`;
    } else {
      synth_prog += `vec4 synth(vec2 coords) { return ${last_node_with_no_output}(coords); }`;
    }

    try {
      if (programInfo) {
        gl.deleteProgram(programInfo.program);
        programInfo = null;
      }
      programInfo = twgl.createProgramInfo(gl, [common.vs, synth_prog]);
      common.setupProgram(twgl, gl, programInfo, bufferInfo);

      console.log("compilation success!");
    } catch (e) {}
  }

  const module_to_counts = new Map<string, number>();
  for (let module of Object.getOwnPropertyNames(modules)) {
    module_to_counts.set(module, 0);
  }

  const params = {
    u_dimensions: dimensions,
    u_tex_dimensions: dimensions,
    u_prev_frame: fbs.src(),
  };

  const add_fn = (fn) => {
    const count = module_to_counts.get(fn);
    module_to_counts.set(fn, count + 1);

    const name = `${fn}${count}`
    pipeline.add(name, fn);

    for (let param of modules[fn].params) {
      const pname = `${name}_${param.name}`;
      console.log(pname, param);
      params[pname] = param.info.default;
    }

    recompile(pipeline, name);
    return name;
  }

  ui_events.register_add_event(add_fn);
  ui_events.register_recompile(recompile);

  const c0 = add_fn("copy_prev_frame");
  const z0 = add_fn("zoom");
  const p0 = add_fn("polygon");
  const m0 = add_fn("mix");
  pipeline.create_edge(c0, z0, 0);
  pipeline.create_edge(z0, m0, 0);
  pipeline.create_edge(p0, m0, 1);

  const run = () => {
    try {
      params["u_prev_frame"] = fbs.src();

      fbs.bind_dst();
      twgl.setUniforms(programInfo, params);
      common.render(gl);
      fbs.flipflop();

      // TODO just render fbs.src instead
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      common.render(gl);
    } catch (e) {}

    requestAnimationFrame(run);
  };

  (window as any).params = params;
  run();
});
