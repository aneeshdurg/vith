import * as twgl from 'twgl.js'
import * as common from './common'
import * as modules from './module_list.json'
import {Pipeline} from './pipeline.ts'
import {UIEventManager} from './ui.ts'
import {BoolEntry, FloatBar, IntEntry, VecEntry, generators, GenParams} from './input.js'
import * as custom from './customElements.js'

export class Synth {
  canvas: HTMLCanvasElement
  dimensions: [number, number];
  gl: WebGL2RenderingContext;
  programInfo: twgl.ProgramInfo | null = null;
  bufferInfo: twgl.BufferInfo;
  fbs: common.FrameBufferManager;
  ui_events: UIEventManager;
  pipeline: Pipeline;

  module_to_counts: Map<string, number>;
  params: object
  functions: object
  active_params: Map<string, any>;

  webcam_sources: Map<string, HTMLVideoElement>;
  webcam_listeners: Map<string, string>;

  constructor(
    canvas: HTMLCanvasElement,
    dimensions: [number, number],
    ui_events: UIEventManager,
    svg_el: SVGSVGElement
  ) {
    this.canvas = canvas
    this.dimensions = dimensions
    canvas.width = dimensions[0];
    canvas.height = dimensions[1];

    const gl = canvas.getContext("webgl2", {'preserveDrawingBuffer': true});
    if (!gl) {
      throw new Error("WebGL2 context unavailible");
    }
    this.gl = gl;
    common.enableGlExts(this.gl);

    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, common.bufferArrays);
    this.fbs = new common.FrameBufferManager(this.gl, dimensions);

    this.ui_events = ui_events;

    this.pipeline = new Pipeline(this.ui_events, svg_el);

    this.active_params = new Map<string, any>();

    this.ui_events.register_organize(() => { this.pipeline.organize(); });
    this.ui_events.register_recompile((fn) => this.recompile(fn));

    this.module_to_counts = new Map<string, number>();
    for (let module of Object.getOwnPropertyNames(modules.modules)) {
      this.module_to_counts.set(module, 0);
    }

    this.params = {
      u_dimensions: dimensions,
      u_tex_dimensions: dimensions,
      u_prev_frame: this.fbs.src(),
    };

    this.functions = { };

    this.webcam_sources = new Map<string, HTMLVideoElement>();
    this.webcam_listeners = new Map<string, string>();

    this.ui_events.register_add_event((fn) => { this.add_fn(fn, null); });
    this.ui_events.register_show_details(this.show_details.bind(this));
    this.ui_events.register_get_webcam_feed(this.get_webcam_feed.bind(this));
    this.ui_events.register_list_webcam_sources(this.list_webcam_sources.bind(this));
    this.ui_events.register_add_webcam_feed(this.add_webcam_feed.bind(this));
    this.ui_events.register_remove_webcam_feed(this.remove_webcam_feed.bind(this));
  }

  step(t: number) {
    try {
      this.params["u_prev_frame"] = this.fbs.src();

      this.run_functions(t);

      this.fbs.bind_dst();
      if (!this.programInfo) {
        return;
      }
      twgl.setUniforms(this.programInfo, this.params);
      common.render(this.gl);
      this.fbs.flipflop();

      // TODO just render fbs.src instead of running the pipeline twice
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      common.render(this.gl);
    } catch (e) {
      console.error(e);
    }
  };

  async recompile(node_to_render) {
    // Implements a BFS starting from leaf nodes
    let synth_prog = modules.template;
    let last_node_with_no_output: string | null  = null;
    let frontier: string[] = [];
    let visited = new Set<string>();
    for (let node of this.pipeline.get_nodes()) {
      if (this.pipeline.get_inputs(node).length == 0) {
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
      for (let input of this.pipeline.get_inputs(node)) {
        if (!input || !visited.has(input)) {
          invalid = true;
          break;
        }
      }
      if (invalid) {
        continue
      }

      const fn = <string>this.pipeline.get_fn(node);
      let stage_src = modules.modules[fn].src;
      stage_src = stage_src.replaceAll("STAGE", `${node}`);

      let counter = 0;
      for (let input of this.pipeline.get_inputs(node)) {
        stage_src = stage_src.replaceAll(`INPUT${counter}`, `${input}`);
        counter += 1;
      }
      synth_prog += stage_src;

      if (!this.pipeline.has_output(node)) {
        last_node_with_no_output = node;
      }

      visited.add(node);
      for (let child of this.pipeline.get_outputs(node)) {
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
      if (this.programInfo) {
        this.gl.deleteProgram(this.programInfo.program);
        this.programInfo = null;
      }
      this.programInfo = twgl.createProgramInfo(this.gl, [common.vs, synth_prog]);
      common.setupProgram(twgl, this.gl, this.programInfo, this.bufferInfo);

      console.log("compilation success!", target, node_to_render);
      // console.log(synth_prog);
    } catch (e) {}
  }

  async add_fn(fn, name?) {
    console.log(this, this.module_to_counts);
    let count = this.module_to_counts.get(fn);
    if (!count) {
      count = 0;
    }
    this.module_to_counts.set(fn, count + 1);

    if (!name) {
      name = `${fn}${count}`
    }
    this.pipeline.add(name, fn);

    if (modules.modules[fn].custom_module) {
      // custom initialization routine?
    }

    for (let param of modules.modules[fn].params) {
      const pname = `${name}_${param.name}`;
      if (param.info) {
        this.params[pname] = param.info.default;
      } else {
        this.params[pname] = custom.elements[`${fn}-${param.name}`].default(this.gl);
      }
      this.functions[pname] = null;
    }

    await this.recompile(name);
    return name;
  }

  show_details(node_name, fn) {
    const container = <HTMLElement>document.getElementById("fn-details");
    container.innerHTML = `<h2>${node_name}</h2>`;
    this.active_params = new Map<string, any>();

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
          this.params[name] = el.value;
        });

        el.addEventListener("function", () => {
          this.functions[name] = [el.generate, el.func, el.params];
        });

        el.addEventListener("webcam", () => {
          this.webcam_listeners.set(name, el.source);
        });

        if (this.functions[name]) {
          el.set_generated(this.functions[name][0]);
        }

        this.active_params.set(name, el);
      };

      const current_value = this.params[name];

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
        case null: {
          const el = new custom.elements[`${fn}-${param.name}`](current_value, this.gl, this.ui_events);
          setupElement(el, container);
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
      this.pipeline.remove_node(node_name);
    };
    container.appendChild(remove_btn);
    container.appendChild(document.createElement("br"));
    container.appendChild(document.createElement("br"));
  }

  run_functions(t) {
    for (let name of Object.keys(this.functions)) {
        let fn_state = this.functions[name];
        if (!fn_state) {
          continue;
        }

        let element: any  = null;
        if (this.active_params.has(name)) {
          element = this.active_params.get(name);
        }

        const [generate, fn, fn_params] = fn_state;
        let new_param = this.params[name];
        if (Array.isArray(generate)) {
          for (let i = 0; i < generate.length; i++) {
            if (generate[i]) {
              const value = generators[fn[i]].func(t, fn_params[i].range, fn_params[i]);
              new_param[i] = value;
              element?.set_value(value, i);
            }
          }
        } else if (generate) {
          new_param = generators[fn].func(t, fn_params.range, fn_params);
          element?.set_value(new_param);
        }

        this.params[name] = new_param;
    }

    this.webcam_listeners.forEach((listener, name) => {
      const feed = <HTMLVideoElement>this.get_webcam_feed(listener);
      const dimensions = [feed.videoWidth, feed.videoHeight];
      if (this.params[name] == null) {
        const tex = common.createTexture(this.gl, dimensions)
        this.params[name] = tex;
      }
      common.updateTexture(this.gl, dimensions, this.params[name], feed);
    });
  }

  save() {
    const state = {
      params: this.params,
      functions: this.functions,
      stages: {},
      module_to_counts: {},
    };
    for (let node of this.pipeline.get_nodes()) {
      const fn = this.pipeline.get_fn(node);
      const inputs = this.pipeline.get_inputs(node);
      state.stages[node] = { "module": fn, "inputs": inputs };
    }

    this.module_to_counts.forEach((v, k) => {
      if (v > 0) {
        state.module_to_counts[k] = v;
      }
    });

    return JSON.stringify(state);
  }

  async load(state) {
    this.pipeline.clear();

    this.module_to_counts.forEach((_v, k) => {
      this.module_to_counts.set(k, 0);
    });

    // TODO fix dimensions if changed
    for (let node of Object.getOwnPropertyNames(state.stages)) {
      const fn = state.stages[node].module;
      await this.add_fn(fn, node);
    }

    for (let node of Object.getOwnPropertyNames(state.stages)) {
      const inputs = state.stages[node].inputs;
      for (let i = 0; i < inputs.length; i++) {
        if (inputs[i]) {
          this.pipeline.create_edge(inputs[i], node, i);
        }
      }
    }

    this.params = state.params
    this.functions = state.functions
    for (let fn of Object.getOwnPropertyNames(this.functions)) {
      const fn_desc = this.functions[fn];
      if (fn_desc) {
        const gen_params = fn_desc[2];
        this.functions[fn][2] = new GenParams(gen_params.range);
        this.functions[fn][2].load(gen_params.params);
      }
    }

    await this.pipeline.organize();
    const container = <HTMLElement>document.getElementById("fn-details");
    container.innerHTML = "";
  }

  get_webcam_feed(feedname: string) {
    return this.webcam_sources.get(feedname);
  }

  list_webcam_sources() {
    return this.webcam_sources.keys();
  }

  add_webcam_feed(feedname: string, feedsource: HTMLVideoElement) {
    console.log("!!!");
    return this.webcam_sources.set(feedname, feedsource);
  }

  remove_webcam_feed(feedname: string) {
    return this.webcam_sources.delete(feedname);
  }

}
