export class GenParams {
    params = {}
    range = null

    constructor(range) {
      this.range = range;
    }

    get() {
        return this.params;
    }

    save() {
        return this.params;
    }

    load(params) {
        for (let key of Object.keys(params))
            this.params[key] = params[key];
    }
}

class DefaultParams extends GenParams {
    params = {freq: 1, c: 0, y: 0, a: 1};
}

const constrain = (range, value) => Math.min(Math.max(value, range[0]), range[1]);

const sin_generator = (t, range, genparams) => {
    const params = genparams.get();
    let value = Math.sin(params.freq * 2 * Math.PI * t / 1000 + params.c);
    value = params.a * value + params.y;
    value = (value + 1) / 2;
    value = value * (range[1] - range[0]) + range[0];
    value = constrain(range, value);
    return value;
};

const raw_step = (t, range, freq, c) => {
    return ((t / 1000 * freq + c) % (range[1] - range[0])) + range[0];
}

const step_generator = (t, range, genparams) => {
    const params = genparams.get();
    return constrain(range, params.a * raw_step(t, range, params.freq, params.c) + params.y);
};

const inv_step_generator = (t, range, genparams) => {
    const params = genparams.get();
    const step = raw_step(t, range, params.freq, params.c);
    return constrain(range, params.a * (range[1] - step + range[0]) + params.y);
};

const defaultFnUI = (function_ui, params) => {
    function_ui.appendChild(createElement(html`
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
    const freq_input = function_ui.querySelector("#freq_input");
    const c_input = function_ui.querySelector("#c_input");
    const a_input = function_ui.querySelector("#a_input");
    const y_input = function_ui.querySelector("#y_input");

    freq_input.set_value(params.params.freq);
    c_input.set_value(params.params.c);
    a_input.set_value(params.params.a);
    y_input.set_value(params.params.y);

    freq_input.addEventListener('change', () => {
        params.params.freq = parseFloat(freq_input.value);
    });
    c_input.addEventListener('change', () => {
        params.params.c = parseFloat(c_input.value);
    });
    a_input.addEventListener('change', () => {
        params.params.a = parseFloat(a_input.value);
    });
    y_input.addEventListener('change', () => {
        params.params.y = parseFloat(y_input.value);
    });
};

class AudioDefaultParams extends GenParams {
    params = {
        low: 20,
        high: 100,
        y: 0,
        a: 1,
        fr: 1,
        fs: true,
    };
}

const audio_generator = (t, range, genparams, synth) => {
    if (synth.volume.length == 0)
        return range[0];

    const params = genparams.get();

    let volume = 0;
    let start = params.fs ? 0 : Math.floor(params.fr * synth.volume.length);
    let end = params.fs ? Math.floor(params.fr * synth.volume.length) : synth.volume.length;
    for (let i = start; i < end; i++) {
      volume += (synth.volume[i]);
    }
    volume = volume / (end - start);

    let val = (volume - params.low) / params.high;
    val = params.a * val + params.y;
    return constrain(range, (range[1] - range[0]) * val + range[0]);
};

const audioUI = (function_ui, params) => {
    console.log(params);
    function_ui.appendChild(createElement(html`
        <div>
            <br>
            <h3>Frequency</h3>
            <br>
            <label for="freqrange">Frequency Width: </label>
            <${getEl("float-bar")}
                id="freqrange"
                range="[0, 1]"
                defaultValue="1"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
            <br>
            <label for="freqselect">Low pass filter: </label>
            <input type="checkbox" checked id="freqselect"></input>
            <br>
            <h3>Intensity</h3>
            <label for="low">Low: </label>
            <${getEl("float-bar")}
                id="low"
                range="[0, 1000]"
                defaultValue="20"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
            <br>
            <label for="high">High: </label>
            <${getEl("float-bar")}
                id="high"
                range="[0.01, 1000]"
                defaultValue="100"
                supressFunctionGen="true">
            </${getEl("float-bar")}>
            <br>
            <h3> Function </h3>
            <label for="a_input">Amplitude: </label>
            <${getEl("float-bar")}
                id="a_input"
                range="[0, 100]"
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
    const freqrange = function_ui.querySelector("#freqrange");
    const freqselect = function_ui.querySelector("#freqselect");
    const a_input = function_ui.querySelector("#a_input");
    const y_input = function_ui.querySelector("#y_input");
    const low_input = function_ui.querySelector("#low");
    const high_input = function_ui.querySelector("#high");

    freqselect.checked = params.params.fs;
    freqrange.set_value(params.params.fr);
    freqselect.addEventListener('change', () => {
        params.params.fs = freqselect.checked;
    });
    freqrange.addEventListener('change', () => {
        params.params.fr = parseFloat(freqrange.value);
    });

    a_input.set_value(params.params.a);
    y_input.set_value(params.params.y);
    a_input.addEventListener('change', () => {
        params.params.a = parseFloat(a_input.value);
    });
    y_input.addEventListener('change', () => {
        params.params.y = parseFloat(y_input.value);
    });

    low_input.set_value(params.params.low);
    high_input.set_value(params.params.high);
    high_input.addEventListener('change', () => {
        params.params.high = parseFloat(high.value);
    });
    low_input.addEventListener('change', () => {
        params.params.low = parseFloat(low.value);
    });
};

export const generators = {
    sin: { func: sin_generator, params: DefaultParams, ui: defaultFnUI },
    step: { func: step_generator, params: DefaultParams, ui: defaultFnUI },
    inv_step: { func: inv_step_generator, params: DefaultParams, ui: defaultFnUI },
  // audio: { func: audio_generator, params: AudioDefaultParams, ui: audioUI }
}

export class FunctionGenerator{
    cancel = false;

    constructor (parentEl, current, current_params, resolver, synth) {
        const container = document.createElement('div');
        container.className = "functiongen";

        const header = document.createElement("h1");
        header.innerText = "Function Generator";
        container.appendChild(header);
        container.appendChild(document.createElement('hr'));

        this.graph = document.createElement('canvas');
        this.graph.className = "functioncanvas";
        this.graph.width = 1000;
        this.graph.height = 1000;
        container.appendChild(this.graph);

        this.ctx = this.graph.getContext("2d");

        this.freq = 1;
        this.c = 0;

        this.draw_axes();

        this.func = generators[current].func;
        this.params = current_params || new generators[current].params();
        console.log("Using params", this.params);

        const function_ui = document.createElement('div');
        function_ui.className = 'function-ui';

        generators[current].ui(function_ui, this.params);

        function_ui.appendChild(document.createElement('br'));
        function_ui.appendChild(document.createElement('br'));
        const done_button = document.createElement('button');
        done_button.innerText = 'done';
        function_ui.appendChild(done_button);
        done_button.addEventListener('click', () => {
            resolver(this.params);
        });

        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('br'));
        container.appendChild(function_ui);
        parentEl.appendChild(container);

        this.synth = synth;
        const f = () => {
            this.draw_axes();
            this.draw_function();
            this.draw_labels();
            if (!this.cancel)
                requestAnimationFrame(f);
        };
        f();
    }

    draw_axes() {
        this.ctx.fillStyle = "black";
        this.ctx.beginPath();
        this.ctx.rect(0, 0, 1000, 1000);
        this.ctx.fill();

        this.ctx.fillStyle = "#ffffff50";
        const count = 20;
        for (let i = 1; i < count; i++) {
            const start = i * (this.graph.width / count);
            this.ctx.beginPath();
            this.ctx.rect(start, 0, 5, 1000);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.rect(0, start, 1000, 5);
            this.ctx.fill();
        }
    }

    draw_function() {
        this.ctx.strokeStyle = "red";
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        const maxy = this.graph.height / 2;
        this.ctx.moveTo(0, maxy);
        for (let i = 0; i < this.graph.width; i++) {
            this.ctx.lineTo(i, maxy - maxy * this.func(i, [-1, 1], this.params, this.synth));
        }
        this.ctx.stroke();
    }

    draw_labels() {
        this.ctx.beginPath();
        this.ctx.rect(0, 0, 1000, 1000);
        this.ctx.fill();
    }

    remove() {
        this.cancel = true;
    }
}

// defined for syntax highlighting purposes
const html = String.raw;
// https://medium.com/@trukrs/tagged-template-literal-for-html-templates-4820cf5538f9
function createElement(markup) {
    const temp = document.createElement('div')
    temp.innerHTML = markup
    const frag = document.createDocumentFragment()
    const children = Array.prototype.slice.apply(temp.childNodes)
    children.map(el => frag.appendChild(el))
    return frag
}

const __suffix = window.globalsuffix;

const getEl = (name) => name + (__suffix || "");

const defineEl = (name, class_) => {
    customElements.define(getEl(name), class_);
}

function createModal(resolver) {
    const modal = document.createElement('div');
    modal.addEventListener('click', (e) => {
        if (e.target != modal)
            return;
        resolver(undefined);
        modal.remove();
    });

    modal.style.background = "#2b2b2b50";
    modal.style.position = "absolute";
    modal.style.left = "0";
    modal.style.top = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";

    document.body.appendChild(modal);
    return modal;
}

export class Type extends HTMLElement {
    name = ""
    range = []
    defaultValue = 0
    shadow = null;
    value = 0

    constructor(range, defaultValue) {
        super();
        this.synth = null;
        this.range = range;
        if (this.range === null || this.range === undefined)
            this.range = eval(this.getAttribute("range"));
        this.defaultValue = defaultValue;
        if (this.defaultValue === null || this.defaultValue === undefined)
            this.defaultValue =  eval(this.getAttribute("defaultValue"))
        this.shadow = this.attachShadow({mode: 'open'});
    }
}

export class BoolEntry extends Type {
    constructor(defaultValue) {
        super([0, 0], defaultValue);

        this.shadow.appendChild(createElement(html`
            <input type="checkbox"></input>
        `));
        this.input = this.shadow.querySelector("input");
        this.input.checked = defaultValue;
        this.value = this.input.checked;
        this.input.addEventListener('change', () => {
            this.value = this.input.checked;
            this.dispatchEvent(new Event('change'));
        });
    }

    save() {
        return this.value;
    }
}
defineEl('bool-entry', BoolEntry);

export class Slider extends Type {
    constructor(range, defaultValue) {
        super(range, defaultValue);

        this.shadow.appendChild(createElement(html`
            <div style="padding-bottom: 0.5em;"> <!-- TODO use template + <style> ? -->
                <div id="bar" style="background: black; width: 10em; height: 1em;">
                    <div
                        id="slider"
                        style="background: white; width: 1%; height: 1em; position: relative; left: 0em">
                    </div>
                </div>
            </div>
        `));

        const bar = this.shadow.querySelector("#bar");
        this.slider = this.shadow.querySelector("#slider");

        const handler = (e) => {
            if (e.target != bar)
                return;
            const rect = e.target.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            const x = (clientX - rect.left) / rect.width;
            this.value = x * (this.range[1] - this.range[0]) + this.range[0];
            this.dispatchEvent(new Event('change'));
        };
        bar.addEventListener('mousemove', (e) => { if (e.buttons & 1) handler(e); });
        bar.addEventListener('touchmove', handler);
    }

    set_value(value) {
        const x = (value - this.range[0]) / (this.range[1] - this.range[0]);
        this.slider.style.left = `${x * 10}em`;
    }
}
defineEl('slider-elem', Slider);

export class FloatBar extends Type {
    validate(entry) {
        return !isNaN(entry) && entry >= this.range[0] && entry <= this.range[1];
    }

    _set_value(value) {
        this.value = value;
        this.input.value = this.value;
        this.slider.set_value(value);
    }

    set_value(value) {
        this._set_value(value);
        this.dispatchEvent(new Event('change'));
    }

    set_generated() {
      this.generated = true;
      this.func_gen.checked = true;
    }

    constructor(range, defaultValue, supressFunctionGen) {
        super(range, defaultValue);

        if (supressFunctionGen === null || supressFunctionGen === undefined)
            supressFunctionGen =  eval(this.getAttribute("supressFunctionGen"))

        this.shadow.appendChild(createElement(html`
            <div>
                <${getEl("slider-elem")} range="[${this.range}]" defaultValue="${this.defaultValue}">
                </${getEl("slider-elem")}>
                <input
                    id="floatinp"
                    style="box-shadow: none;"
                    type="number"
                    min="${this.range[0]}"
                    max="${this.range[1]}"
                    step="${(this.range[1] - this.range[0]) / 1000}"></input>
                <div id="functiongen">
                    <label for="generate">function: </label>
                    <input id="generate" type="checkbox"></input>
                    <select></select>
                    <button>Edit function</button>
                </div>
            </div>
        `));

        this.slider = this.shadow.querySelector(getEl("slider-elem"));
        this.input = this.shadow.querySelector("#floatinp");

        this._set_value(this.defaultValue);

        this.input.addEventListener('change', () => {
            const value = parseFloat(this.input.value);
            if (!this.validate(value)) {
                this.input.style = "color: red";
            } else {
                this.input.style = "";
                this.set_value(value);
            }
        });
        this.slider.addEventListener('change', () => { this.set_value(this.slider.value); });

        const funcgen_container = this.shadow.querySelector("#functiongen");
        this.func_gen = funcgen_container.querySelector("#generate");
        const func_modal = funcgen_container.querySelector("button");
        this.func_select = funcgen_container.querySelector("select");
        Object.keys(generators).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.innerText = k;
            this.func_select.appendChild(opt);
        });

        this.generate = false;
        const set_func = () => {
            this.func = this.func_select.value;
            this.params = new generators[this.func_select.value].params(this.range);
            this.dispatchEvent(new Event("function"));
        };
        set_func();

        this.func_select.addEventListener('change', set_func);
        this.func_gen.addEventListener('change', () => {
            this.generate = this.func_gen.checked;
            this.dispatchEvent(new Event("function"));
        });

        func_modal.addEventListener('click', async () => {
            let resolver = undefined;
            const p = new Promise(r => { resolver = r; });
            const modal = createModal(resolver);
            let curr_params = undefined;
            if (this.generate)
                curr_params = this.params;
            const generator = new FunctionGenerator(
                modal, this.func_select.value, curr_params, resolver, this.synth);
            const params = await p;
            generator.remove();
            modal.remove();
            if (!params)
                return;

            this.params = params;
            this.generate = true;
            this.func_gen.checked = true;
            this.dispatchEvent(new Event("function"));
        });

        if (supressFunctionGen)
            funcgen_container.style.display = "none";
    }
}
defineEl('float-bar', FloatBar);

export class IntEntry extends FloatBar {
    _set_value(value) {
        value = Math.round(value);
        super._set_value(value);
    }

    constructor(range, defaultValue, supressFunctionGen) {
        super(range, defaultValue, supressFunctionGen);
        this.input.step = 1;
    }
}
defineEl('int-entry', IntEntry);

export class VecEntry extends Type {
    floats = []
    generate = []
    func = []
    params = []

    constructor(nelem, names, range, defaultValue) {
        super(range, defaultValue);
        this.nelem = nelem;
        this.names = names;

        const suffix = window.globalsuffix;

        for (let i = 0; i < this.nelem; i++) {
            this.shadow.appendChild(createElement(html`
                <label for="${names[i]}">${names[i]}: </label>
                <${getEl("float-bar")}
                    id="${names[i]}"
                    range="[${this.range[i]}]"
                    defaultValue="${this.defaultValue[i]}">
                </${getEl("float-bar")}>
              `));
              this.generate.push(false);
              this.func.push(null);
              this.params.push(null);
        }

        this.value = this.defaultValue;

        this.floats = Array.from(this.shadow.querySelectorAll(getEl("float-bar")));
        for (let i = 0; i < this.nelem; i++) {
            let float = this.floats[i]
            float.addEventListener('change', () => {
                this.value[i] = float.value;
                this.dispatchEvent(new Event('change'));
            });

            float.addEventListener("function", () => {
                this.generate[i] = float.generate;
                this.func[i] = float.func;
                this.params[i] = float.params;
                this.dispatchEvent(new Event("function"));
            });
        }
    }

    set_value(value, idx) {
        this.value[idx] = value;
        this.floats[idx].set_value(value);
    }

    set_generated(generated) {
      for (let i = 0; i < this.nelem; i++) {
        this.generated = generated[i];
        this.func_gen.checked = generated[i];
      }
    }
}
defineEl('vec-entry', VecEntry);

function add_new_channel_ui(ui_container, chanid) {
    const new_ui = document.createElement("div");
    new_ui.id = `ui-${chanid}`;
    ui_container.appendChild(new_ui);
}

export class ChannelId {
    constructor(id) {
        this.id = id;
    }
}

export class ChannelSelect extends Type {
    constructor(synth) {
        const value = new ChannelId(0);
        super(undefined, value);

        this.value = value;
        this.shadow.appendChild(createElement(html`
            <input type="number" min="0" step="1"></input>
        `));
        this.input = this.shadow.querySelector("input");
        this.input.value = 0;
        this.input.addEventListener('change', () => {
            const value = this.input.value;
            if (value >= synth.channels.length) {
                this.input.style = "color: red";
                return;
            }

            this.input.style = "";
            this.value.id = parseInt(this.input.value);
            console.log(parseInt(this.input.value), this.value);
            this.dispatchEvent(new Event('change'));
        });
    }

    save() {
        return this.value.id;
    }

    load(data) {
        this.value.id = data;
        this.input.value = data;
        this.dispatchEvent(new Event('change'));
    }
}
defineEl('channel-select', ChannelSelect);

