import * as modules from './module_list.json'

type PipelineNode = {
  fn: string,
  outputs: [[string, number]],
  output_el: SVGElement,
  inputs: [[string, SVGElement | null] | null],
  input_els: [SVGElement],
  svg_el: SVGElement,
};

type Point = { x: number, y: number };

export class Pipeline {
  constructor(ui_events: UIEventManager) {
    this.ui_events = ui_events;

    this.svg = <SVGElement>document.getElementById("synth-pipeline");
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

  get_nodes() {
    return this.nodes.keys();
  }

  get_fn(node_name: string) {
    return this.nodes.get(node_name).fn;
  }

  get_inputs(node_name: string) {
    const inputs = [];
    for (let input of this.nodes.get(node_name).inputs) {
      if (input) {
        inputs.push(input[0]);
      } else {
        inputs.push(null);
      }
    }
    return inputs;
  }


  get_outputs(node_name: string) {
    const outputs = [];
    for (let output of this.nodes.get(node_name).outputs) {
      outputs.push(output[0]);
    }
    return outputs;
  }

  has_output(node_name: string) {
    return this.nodes.get(node_name).outputs.length != 0;
  }

  add(node_name: string, fn: string) {
    console.log(modules, fn);
    const input_cnt = modules[fn].inputs.length;

    const rect_width = 100;
    const rect_height = rect_width * 3 / 4;
    const io_port_width = rect_width / 20;

    this.last_pos.x = -Infinity;
    if (!this.nodes.keys().length) {
      this.last_pos.x = 0;
    }
    for (let node of this.nodes.keys()) {
      const curr_node = this.nodes.get(node);
      const new_value = curr_node.svg_el.transform.baseVal[0].matrix.e + rect_width + io_port_width + 50;
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
    main_rect.setAttribute('width', rect_width);
    main_rect.setAttribute('height', rect_height);
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
    text_el.setAttribute("textLength", rect_width - 2 * text_padding);
    text_el.setAttribute("lengthAdjust", "spacingAndGlyphs");
    const text_translate = this.svg.createSVGTransform();
    text_translate.setTranslate(text_padding, rect_height / 2);
    text_el.transform.baseVal.insertItemBefore(text_translate, 0);
    text_el.id = node_name + "text";
    svg_el.appendChild(text_el);

    const output_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    output_rect.setAttribute('width', io_port_width);
    output_rect.setAttribute('height', rect_height / 4);
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
          this.create_edge(this.adding_edge_output, ...this.adding_edge_input);
        }
      }

      e.stopPropagation();
    };
    svg_el.appendChild(output_rect);

    const inputs = [];
    const input_els = [];
    const min_padding = 10;
    const input_height = (rect_height - (input_cnt - 1) * min_padding) / input_cnt;
    for (let i = 0; i < input_cnt; i++) {
      inputs.push(null);

      const input_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      input_rect.setAttribute('width', rect_width / 20);
      input_rect.setAttribute('height', input_height);
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
            this.create_edge(this.adding_edge_output, ...this.adding_edge_input);
          }
        }

        e.stopPropagation();
      };
      svg_el.appendChild(input_rect);
      input_els.push(input_rect);
    }

    svg_el.addEventListener("dragged", () => {
      const node = this.nodes.get(node_name);
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

  create_edge(src_node: str, dst_node: str, dst_input_port: number) {
    const old_input = this.nodes.get(dst_node).inputs[dst_input_port];
    if (old_input) {
      old_input[1].remove();
      this.nodes.get(dst_node).inputs[dst_input_port] = null;

      const old_src = this.nodes.get(old_input[0]);
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

    this.ui_events.recompile(this);
  }

  set_input(node_name: string, input_name: string, input_idx: number) {
    if (!this.nodes.has(input_name)) {
      throw new Error("Unknown node " + node_name);
    }

    this.nodes.get(node_name).inputs[input_idx] = [input_name, null];
    this.nodes.get(input_name).outputs.push([node_name, input_idx]);

    this.draw_edge(node_name, input_idx);
  }


  draw_edge(node_name: string, input_idx: number) {
    const input_name = this.nodes.get(node_name).inputs[input_idx][0];
    const linestart_el = this.nodes.get(input_name).output_el;
    const linestart = {
      x: linestart_el.parentElement.transform.baseVal[0].matrix.e + linestart_el.transform.baseVal[0].matrix.e + linestart_el.width.baseVal.value,
      y: linestart_el.parentElement.transform.baseVal[0].matrix.f + linestart_el.transform.baseVal[0].matrix.f + linestart_el.height.baseVal.value / 2,
    }
    const lineend_el = this.nodes.get(node_name).input_els[input_idx];
    const lineend = {
      x: lineend_el.parentElement.transform.baseVal[0].matrix.e + lineend_el.transform.baseVal[0].matrix.e,
      y: lineend_el.parentElement.transform.baseVal[0].matrix.f + lineend_el.transform.baseVal[0].matrix.f + lineend_el.height.baseVal.value / 2,
    }
    const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
    edge.setAttribute("x1", linestart.x);
    edge.setAttribute("y1", linestart.y);
    edge.setAttribute("x2", lineend.x);
    edge.setAttribute("y2", lineend.y);
    edge.style.stroke = "black";

    const old_edge = this.nodes.get(node_name).inputs[input_idx][1];
    if (old_edge) {
      old_edge.remove();
    }

    this.nodes.get(node_name).inputs[input_idx] = [input_name, edge];
    this.svg.appendChild(edge);
  }
}
