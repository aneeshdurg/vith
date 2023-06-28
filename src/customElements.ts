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

  constructor(value, gl, ui_manager) {
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

class WebcamSource extends Type {
  static default(gl: any) {
    return null;
  }

  constructor(value, gl, ui_manager) {
    super([], value);
    this.value = value;
    this.gl = gl;

    const devices = ui_manager.list_webcam_sources();
    console.log(devices, ui_manager);

    this.el = document.createElement("div");
    this.el.innerHTML = `<label for="webcamSelector">Choose a webcam: </label>`
    const selector = document.createElement("select");
    selector.id = "webcamSelector";
    for (let deviceId of devices) {
        const entry = document.createElement("option");
        entry.value = deviceId;
        entry.innerHTML = deviceId.substr(0, 10);
        selector.appendChild(entry)
    }
    this.el.appendChild(selector);

    const btn = document.createElement("button");
    btn.innerText = "Select";
    btn.onclick = () => {
      this.source = selector.value;
      this.dispatchEvent(new Event('change'));
      this.dispatchEvent(new Event('webcam'));
    };
    this.el.appendChild(btn);

    this.shadow.appendChild(this.el);
  }
}
defineEl('webcam-src', WebcamSource);

export const elements = {
  "reduce_colors-data": ReduceColorsData,
  "webcam-src": WebcamSource,
};
