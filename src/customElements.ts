import * as common from './common'
import {defineEl, Type} from './input.js'

class ReduceColorsData extends Type {
  static generate_colors(tex: any, gl: any) {
    const data = new Float32Array(4 * 256);
    // console.log("Regenerating", this.count);
    for (let i = 0; i < (4 * 256); i++) {
      data[i] = Math.random();
    }
    common.updateTexture(gl, [256, 1], tex, data);
  }

  static default(gl: any) {
    const tex = common.createTexture(gl, [256, 1])
    ReduceColorsData.generate_colors(tex, gl);
    return tex;
  }

  constructor(value, gl) {
    super([], value);
    this.value = value;
    this.gl = gl;

    this.el = document.createElement("div");
    const btn = document.createElement("button");
    btn.addEventListener('click', () => {
        ReduceColorsData.generate_colors(this.value, this.gl);
        this.dispatchEvent(new Event('change'));
    });
    btn.innerText = "Re-pick colors";
    this.el.appendChild(btn);

    // TODO add a ui to edit colors individually

    this.shadow.appendChild(this.el);
  }
}
defineEl('reduce_colors-data', ReduceColorsData);

export const elements = {
  "reduce_colors-data": ReduceColorsData,
};
