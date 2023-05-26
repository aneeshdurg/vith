import * as modules from './module_list.json'
import {UIEventManager} from './ui.ts'

type PipelineNode = {
  fn: string,
  outputs: [string, number][],
  output_el: SVGRectElement,
  inputs: ([string, SVGLineElement | null] | null)[],
  input_els: SVGRectElement[],
  svg_el: SVGGraphicsElement,
};

type Point = { x: number, y: number };

const rect_width = 100;
const rect_height = rect_width * 3 / 4;
const io_port_width = rect_width / 20;

export class Pipeline {
   ui_events: UIEventManager;
   svg: SVGSVGElement;
   nodes: Map<string, PipelineNode>;
   last_pos: Point
   adding_edge: boolean;
   adding_edge_input: [string | null, number | null];
   adding_edge_output: string | null;

  constructor(ui_events: UIEventManager, svg: SVGSVGElement) {
    this.ui_events = ui_events;

    this.svg = svg;
    this.nodes = new Map<string, PipelineNode>();
    this.last_pos = {x: 50, y: 50}
    this.adding_edge = false;
    this.adding_edge_input = [null, null];
    this.adding_edge_output = null;

    this.svg.addEventListener("click", () => {
      if (this.adding_edge) {
        this.adding_edge = false;
        this.adding_edge_input = [null, null];
        this.adding_edge_output = null;
      }
    });
  }

  get_nodes(): Iterable<string> {
    return this.nodes.keys();
  }

  get_fn(node_name: string) {
    return this.nodes.get(node_name)?.fn;
  }

  get_inputs(node_name: string): (string | null)[] {
    const node = this.nodes.get(node_name);
    if (!node) {
      throw new Error(`Could not find node with name ${node_name}`);
    }

    const inputs: (string | null)[] = [];
    for (let input of node.inputs) {
      if (input) {
        inputs.push(input[0]);
      } else {
        inputs.push(null);
      }
    }
    return inputs;
  }


  get_outputs(node_name: string): Iterable<string> {
    const node = this.nodes.get(node_name);
    if (!node) {
      throw new Error(`Could not find node with name ${node_name}`);
    }
    const outputs: string[] = [];
    for (let output of node.outputs) {
      outputs.push(output[0]);
    }
    return outputs;
  }

  has_output(node_name: string): boolean {
    return this.nodes.get(node_name)?.outputs.length != 0;
  }

  add(node_name: string, fn: string) {
    const input_cnt = modules.modules[fn].inputs.length;

    this.last_pos.x = -Infinity;
    if (!this.nodes.size) {
      this.last_pos.x = 0;
    }
    for (let node of this.nodes.keys()) {
      const curr_node = this.nodes.get(node) as PipelineNode;
      const new_value = curr_node?.svg_el.transform.baseVal[0].matrix.e + rect_width + io_port_width + 50;
      this.last_pos.x = Math.max(new_value, this.last_pos.x);
      if (new_value > this.last_pos.x) {
        this.last_pos.x = new_value;
        this.last_pos.y = curr_node.svg_el.transform.baseVal[0].matrix.f;
      }
    }


    const svg_el = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg_el.classList.add("draggable");
    const translate = this.svg.createSVGTransform();
    translate.setTranslate(this.last_pos.x, this.last_pos.y);
    svg_el.transform.baseVal.insertItemBefore(translate, 0);

    const main_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    main_rect.setAttribute('width', rect_width.toString());
    main_rect.setAttribute('height', rect_height.toString());
    main_rect.style.stroke = "black";
    main_rect.style.fill = "white";
    main_rect.style.fillOpacity = "0";
    main_rect.onclick = () => {
      this.ui_events.show_details(node_name, fn);
    };
    svg_el.appendChild(main_rect);

    const text_padding = 10;
    const text_el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text_el.innerHTML = node_name;
    text_el.setAttribute("textLength", (rect_width - 2 * text_padding).toString());
    text_el.setAttribute("lengthAdjust", "spacingAndGlyphs");
    const text_translate = this.svg.createSVGTransform();
    text_translate.setTranslate(text_padding, rect_height / 2);
    text_el.transform.baseVal.insertItemBefore(text_translate, 0);
    text_el.id = node_name + "text";
    svg_el.appendChild(text_el);

    const output_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    output_rect.setAttribute('width', io_port_width.toString());
    output_rect.setAttribute('height', (rect_height / 4).toString());
    output_rect.style.stroke = "black";
    output_rect.style.fill = "rgb(50, 150, 240)";
    const output_translate = this.svg.createSVGTransform();
    output_translate.setTranslate(rect_width, rect_height / 4 + rect_height / 8);
    output_rect.transform.baseVal.insertItemBefore(output_translate, 0);
    output_rect.id = node_name + "output";
    output_rect.onmousedown = (e) => {
      e.stopPropagation();
    };
    output_rect.onclick = (e) => {
      if (this.adding_edge_output) {
        return;
      } else  {
        this.adding_edge = true;
        this.adding_edge_output = node_name;
        if (this.adding_edge_input[0]) {

          this.create_edge(this.adding_edge_output, ...(this.adding_edge_input as [string, number]));
        }
      }

      e.stopPropagation();
    };
    svg_el.appendChild(output_rect);

    const inputs: ([string, SVGLineElement | null] | null)[] = [];
    const input_els: SVGRectElement[] = [];
    const min_padding = 10;
    const input_height = (rect_height - (input_cnt - 1) * min_padding) / input_cnt;
    for (let i = 0; i < input_cnt; i++) {
      inputs.push(null);

      const input_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      input_rect.setAttribute('width', (rect_width / 20).toString());
      input_rect.setAttribute('height', input_height.toString());
      input_rect.style.stroke = "black";
      input_rect.style.fill = "rgb(50, 240, 150)";
      const input_translate = this.svg.createSVGTransform();
      input_translate.setTranslate(-io_port_width, i * (input_height + min_padding));
      input_rect.transform.baseVal.insertItemBefore(input_translate, 0);
      input_rect.id = node_name + "input" + i;
      input_rect.onmousedown = (e) => {
        e.stopPropagation();
      };

      input_rect.onclick = (e) => {
        if (this.adding_edge_input[0]) {
          return;
        } else {
          this.adding_edge = true;
          this.adding_edge_input = [node_name, i];
          if (this.adding_edge_output) {
            this.create_edge(this.adding_edge_output, node_name, i);
          }
        }

        e.stopPropagation();
      };
      svg_el.appendChild(input_rect);
      input_els.push(input_rect);
    }

    svg_el.addEventListener("dragged", () => {
      const node = this.nodes.get(node_name);
      if (!node) {
        throw new Error(`Could not find node with name ${node_name}`);
      }
      for (let i = 0; i < input_cnt; i++) {
        if (node.inputs[i]) {
          this.draw_edge(node_name, i);
        }
      }

      for (let output of node.outputs) {
          this.draw_edge(...output);
      }
    });

    this.svg.appendChild(svg_el);

    this.nodes.set(node_name, {
      fn: fn,
      outputs: [],
      output_el: output_rect,
      inputs: inputs,
      input_els: input_els,
      svg_el: svg_el
    });
  }

  create_edge(src_node: string, dst_node: string, dst_input_port: number) {
    const dst = this.nodes.get(dst_node);
    if (!dst) {
      throw new Error(`Could not find node with name ${dst_node}`);
    }
    const old_input = dst.inputs[dst_input_port];
    if (old_input) {
      if (old_input[1]) {
        old_input[1].remove();
      }
      dst.inputs[dst_input_port] = null;

      const old_src = this.nodes.get(old_input[0]);
      if (!old_src) {
        throw new Error(`Could not find node with name ${old_input[0]}`);
      }
      for (let i = 0; i < old_src.outputs.length; i++) {
        if (old_src.outputs[i][0] == dst_node &&
            old_src.outputs[i][1] == dst_input_port){
          old_src.outputs.splice(i, 1);
        }
      }
    }

    if (old_input == null || old_input[0] != src_node) {
      this.set_input(dst_node, src_node, dst_input_port);
    }

    this.adding_edge = false;
    this.adding_edge_input = [null, null];
    this.adding_edge_output = null;

    this.ui_events.recompile(null);
  }

  set_input(node_name: string, input_name: string, input_idx: number) {
    const node = this.nodes.get(node_name);
    if (!node) {
      throw new Error(`Could not find node with name ${node_name}`);
    }

    node.inputs[input_idx] = [input_name, null];
    this.nodes.get(input_name)?.outputs.push([node_name, input_idx]);

    this.draw_edge(node_name, input_idx);
  }


  draw_edge(node_name: string, input_idx: number) {
    const node = this.nodes.get(node_name);
    if (!node) {
      throw new Error(`Could not find node with name ${node_name}`);
    }

    const input = node.inputs[input_idx];
    if (!input) {
      throw new Error(`Input ${input_idx} does not exist`);
    }
    const input_name = input[0];
    const input_node = this.nodes.get(input_name);
    if (!input_node) {
      throw new Error(`Could not find node with name ${input_name}`);
    }

    const linestart_el = input_node.output_el;
    const startparent_el = linestart_el.parentElement as unknown as SVGGraphicsElement;
    const linestart = {
      x: startparent_el.transform.baseVal[0].matrix.e + linestart_el.transform.baseVal[0].matrix.e + linestart_el.width.baseVal.value,
      y: startparent_el.transform.baseVal[0].matrix.f + linestart_el.transform.baseVal[0].matrix.f + linestart_el.height.baseVal.value / 2,
    }
    const lineend_el = node.input_els[input_idx];
    if (!lineend_el) {
      throw new Error(`Input ${input_idx} does not exist`);
    }
    const endparent_el = lineend_el.parentElement as unknown as SVGGraphicsElement;
    const lineend = {
      x: endparent_el.transform.baseVal[0].matrix.e + lineend_el.transform.baseVal[0].matrix.e,
      y: endparent_el.transform.baseVal[0].matrix.f + lineend_el.transform.baseVal[0].matrix.f + lineend_el.height.baseVal.value / 2,
    }

    let edge = input[1];
    if (!edge) {
      edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
      this.svg.appendChild(edge);
      edge.style.stroke = "black";
    }

    edge.setAttribute("x1", linestart.x.toString());
    edge.setAttribute("y1", linestart.y.toString());
    edge.setAttribute("x2", lineend.x.toString());
    edge.setAttribute("y2", lineend.y.toString());

    node.inputs[input_idx] = [input_name, edge];
  }

  remove_output(node_name: string, output_name: string, index: number) {
    const node = this.nodes.get(node_name);
    if (!node) {
      throw new Error(`Could not find node with name ${node_name}`);
    }
    for (let i = 0; i < node.outputs.length; i++) {
      if (node.outputs[i][0] == output_name &&
          node.outputs[i][1] == index) {
        node.outputs.splice(i, 1);
        break;
      }
    }
  }

  remove_node(node_name: string) {
    const node = this.nodes.get(node_name);
    if (!node) {
      throw new Error(`Could not find node with name ${node_name}`);
    }
    let idx = 0;
    for (let input of node.inputs) {
      if (input) {
        const output = input[0];
        if (input[1]) {
          input[1].remove();
        }

        this.remove_output(output, node_name, idx);
      }
      idx += 1;
    }
    node?.svg_el.remove();
    this.nodes.delete(node_name);

    this.ui_events.recompile(null);
  }

  _organize() {
    const repulsion_constant = 20000;

    const updates = new Map();

    this.nodes.forEach((node_i, i) => {
      const pos_i = {
        x: node_i.svg_el.transform.baseVal[0].matrix.e,
        y: node_i.svg_el.transform.baseVal[0].matrix.f,
      };

      const force_vector = { x: 0, y: 0 };
      this.nodes.forEach((node_j) => {
        if (node_i == node_j) {
          return;
        }

        const pos_j = {
          x: node_j.svg_el.transform.baseVal[0].matrix.e,
          y: node_j.svg_el.transform.baseVal[0].matrix.f,
        };

        // direction vector
        const d = { x: pos_i.x - pos_j.x, y: pos_i.y - pos_j.y };
        // distance squared
        const r2 = Math.pow(d.x, 2) + Math.pow(d.y, 2);
        // normalize direction
        const r = Math.sqrt(r2);
        d.x /= r;
        d.y /= r;
        // f = R / dist^2
        const force = repulsion_constant / r2;

        // console.log("repulse", i, j, d, force);

        force_vector.x += d.x * force;
        force_vector.y += d.y * force;
      });

      for (let input of node_i.inputs) {
        if (!input || !input[1]) {
          continue;
        }
        const x = input[1].x2.baseVal.value - input[1].x1.baseVal.value;
        const y = input[1].y2.baseVal.value - input[1].y1.baseVal.value;

        // console.log(i, x, y)

        const delta = {x: 0, y: 0};
        if (x < 0) {
          delta.x += -x * 0.5;
        } else if (x > 25) {
          delta.x -= (x - 25) * 0.5;
        } else if (x < 25) {
          delta.x += (25 - x) * 0.5;
        }

        if (y != 0) {
          delta.y += -y * 0.1;
        }

        force_vector.x += delta.x / node_i.inputs.length;
        force_vector.y += delta.y / node_i.inputs.length;
      }

      for (let output of node_i.outputs) {
        const input = this.nodes.get(output[0])?.inputs[output[1]];
        if (!input || !input[1]) {
          continue;
        }
        const x = input[1].x2.baseVal.value - input[1].x1.baseVal.value;
        const y = input[1].y2.baseVal.value - input[1].y1.baseVal.value;

        // console.log(i, x, y)

        const delta = {x: 0, y: 0};
        if (x < 0) {
          delta.x += -x * 0.5;
        } else if (x > 25) {
          delta.x -= (x - 25) * 0.5;
        } else if (x < 25) {
          delta.x += (25 - x) * 0.5;
        }

        if (y != 0) {
          delta.y += -y * 0.1;
        }

        // NEGATE
        force_vector.x -= delta.x / node_i.outputs.length;
        force_vector.y -= delta.y / node_i.outputs.length;
      }

      if (Math.abs(force_vector.x) < 0.1) {
        force_vector.x = 0;
      }
      if (Math.abs(force_vector.y) < 0.1) {
        force_vector.y = 0;
      }

      // console.log(force_vector.x, force_vector.y)
      updates.set(i, force_vector);

      // console.log(i, force_vector);
      node_i.svg_el.transform.baseVal[0].setTranslate(
        node_i.svg_el.transform.baseVal[0].matrix.e + force_vector.x,
        node_i.svg_el.transform.baseVal[0].matrix.f + force_vector.y);
      node_i.svg_el.dispatchEvent(new Event("dragged"));
    });

    return updates;
  }

  async organize() {
    let updates = this._organize();
    while (true) {
      const new_updates = this._organize();
      let any_updates = false;
      for (let k of updates.keys()) {
        const old_vec = updates.get(k);
        const new_vec = new_updates.get(k);
        const diff = Math.pow(old_vec.x - new_vec.x, 2) + Math.pow(old_vec.y - new_vec.y, 2);
        // console.log(diff);
        if (diff > 0.001) {
          any_updates = true;
          break;
        }
      }
      if (!any_updates) {
        break;
      }
      updates = new_updates;
      await new Promise((r) => { setTimeout(r, 1); });
    }
  }
}
