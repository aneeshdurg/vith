import './style.css'
import * as twgl from 'twgl.js'
import * as common from './common'
import * as modules from './module_list.json'
import {Pipeline} from './pipeline.ts'
import {UIEventManager, setupUI} from './ui.ts'
import {BoolEntry, FloatBar, IntEntry, VecEntry} from './input.js'
import {makeDraggable} from "./svg.ts";

 export async function main () {
  const canvas = <HTMLCanvasElement>document.getElementById("glcanvas");
  if (!canvas) {
    throw new Error("!");
  }
  const dimensions = [1000, 1000];
  canvas.width = dimensions[0];
  canvas.height = dimensions[1];

  const gl = canvas.getContext("webgl2", {'preserveDrawingBuffer': true});
  if (!gl) {
    throw new Error("!");
  }
  common.enableGlExts(gl);
  let programInfo: any = null;
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, common.bufferArrays);
  const fbs = new common.FrameBufferManager(gl, dimensions);

  const ui_events = new UIEventManager();
  setupUI(ui_events);

  const svg_el = document.getElementById("synth-pipeline") as unknown as SVGSVGElement;
  makeDraggable(svg_el);
  const pipeline = new Pipeline(ui_events, svg_el);
  (window as any).pipeline = pipeline;

  ui_events.register_organize(() => { pipeline.organize(); });

  const recompile = async (pipeline, node_to_render) => {
    // Implements a BFS starting from leaf nodes
    let synth_prog = modules.template;
    let last_node_with_no_output: string | null  = null;
    let frontier: string[] = [];
    let visited = new Set<string>();
    for (let node of pipeline.get_nodes()) {
      if (pipeline.get_inputs(node).length == 0) {
        frontier.push(node);
      }
    }

    while (frontier.length) {
      const node = frontier.shift();
      if (!node) {
        throw new Error("Expected at least one node");
      }
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

      let stage_src = modules.modules[pipeline.get_fn(node)].src;
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

    let target = node_to_render;
    if (!node_to_render) {
      target = last_node_with_no_output
    }
    synth_prog += `vec4 synth(vec2 coords) { return ${target}(coords); }`;

    try {
      if (programInfo) {
        gl.deleteProgram(programInfo.program);
        programInfo = null;
      }
      programInfo = twgl.createProgramInfo(gl, [common.vs, synth_prog]);
      common.setupProgram(twgl, gl, programInfo, bufferInfo);

      console.log("compilation success!", target, node_to_render);
      // console.log(synth_prog);
    } catch (e) {}
  }

  const module_to_counts = new Map<string, number>();
  for (let module of Object.getOwnPropertyNames(modules.modules)) {
    module_to_counts.set(module, 0);
  }

  const params = {
    u_dimensions: dimensions,
    u_tex_dimensions: dimensions,
    u_prev_frame: fbs.src(),
  };

  const functions = {
  };

  const add_fn = async (fn) => {
    let count = module_to_counts.get(fn);
    if (!count) {
      count = 0;
    }
    module_to_counts.set(fn, count + 1);

    const name = `${fn}${count}`
    pipeline.add(name, fn);

    for (let param of modules.modules[fn].params) {
      const pname = `${name}_${param.name}`;
      params[pname] = param.info.default;
      functions[pname] = null;
    }

    await recompile(pipeline, name);
    return name;
  }

  let active_params = new Map<string, any>();

  ui_events.register_add_event(add_fn);
  ui_events.register_recompile(recompile);
  ui_events.register_show_details((node_name, fn) => {
    const container = document.getElementById("fn-details");
    if (!container) {
      throw new Error("!");
    }
    container.innerHTML = `<h2>${node_name}</h2>`;
    active_params = new Map<string, any>();

    const param_infos = modules.modules[fn].params;
    for (let param of param_infos) {
      container.appendChild(document.createElement("br"));

      const name = `${node_name}_${param.name}`;

      const label = document.createElement("label");
      label.innerText = `${param.name}:`;
      label.setAttribute("for", name);
      container.appendChild(label);

      const setupElement = (el, container) => {
        container.appendChild(el);
        el.id = name;
        el.addEventListener("change", () => {
          params[name] = el.value;
        });

        el.addEventListener("function", () => {
          functions[name] = [el.generate, el.func, el.params];
        });

        active_params.set(name, el);
      };

      const current_value = params[name];

      switch (param.type) {
        case "bool": {
          const el = new BoolEntry(current_value);
          setupElement(el, container);
          break;
        }
        case "int": {
          const el = new IntEntry([param.info.start, param.info.end], current_value);
          setupElement(el, container);
          break;
        }
        case "float": {
          const el = new FloatBar([param.info.start, param.info.end], current_value);
          setupElement(el, container);
          break;
        }
        case "vec2":
        case "vec3": {
          const range: [number, number][] = [];
          for (let i = 0; i < param.info.start.length; i++) {
            range.push([param.info.start[i], param.info.end[i]]);
          }
          const el = new VecEntry(
            param.info.start.length,
            param.info.names,
            range,
            [...current_value]
          );
          const subcontainer = document.createElement("div")
          subcontainer.style.padding = "1em";
          container.appendChild(subcontainer);

          setupElement(el, subcontainer);
          break;
        }
        default: {
          throw new Error("!");
        }
      }
    }

    container.appendChild(document.createElement("br"));
    container.appendChild(document.createElement("br"));
    const remove_btn = document.createElement("button");
    remove_btn.innerText = "delete";
    remove_btn.onclick = () => {
      pipeline.remove_node(node_name);
    };
    container.appendChild(remove_btn);
    container.appendChild(document.createElement("br"));
    container.appendChild(document.createElement("br"));
  });

  // Add an initial pipeline so it doesn't look too empty
  const c0 = await add_fn("copy_prev_frame");
  const z0 = await add_fn("zoom");
  pipeline.create_edge(c0, z0, 0);
  const p0 = await add_fn("polygon");
  const m0 = await add_fn("mix");
  pipeline.create_edge(z0, m0, 0);
  pipeline.create_edge(p0, m0, 1);
  await pipeline.organize();
  params["polygon0_color"] = [1, 1, 1];
  params["zoom0_x"] = 0.75;
  params["zoom0_y"] = 0.75;
  ui_events.recompile(pipeline, "mix0")
  ui_events.show_details("polygon0", "polygon");

  const run = (t) => {
    try {
      params["u_prev_frame"] = fbs.src();

      for (let name of Object.keys(functions)) {
        let fn_state = functions[name];
        if (!fn_state) {
          continue;
        }

        let element: any  = null;
        if (active_params.has(name)) {
          element = active_params.get(name);
        }

        const [generate, fn, fn_params] = fn_state;
        let new_param = params[name];
        if (Array.isArray(generate)) {
          for (let i = 0; i < generate.length; i++) {
            if (generate[i]) {
              const value = fn[i](t, fn_params[i], null);
              new_param[i] = value;
              element?.set_value(value, i);
            }
          }
        } else if (generate) {
          new_param = fn(t, fn_params, null);
          element?.set_value(new_param);
        }

        params[name] = new_param;
      }

      fbs.bind_dst();
      twgl.setUniforms(programInfo, params);
      common.render(gl);
      fbs.flipflop();

      // TODO just render fbs.src instead of running the pipeline twice
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      common.render(gl);
    } catch (e) {
      console.error(e);
    }

    requestAnimationFrame(run);
  };

  (window as any).params = params;
  requestAnimationFrame(run);
}
