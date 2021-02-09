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

class Type extends HTMLElement {
    name = ""
    range = []
    defaultValue = 0
    shadow = null;
    value = 0

    constructor(range, defaultValue) {
        super();
        this.range = range;
        if (this.range === null || this.range === undefined)
            this.range = eval(this.getAttribute("range"));
        this.defaultValue = defaultValue;
        if (this.defaultValue === null || this.defaultValue === undefined)
            this.defaultValue =  eval(this.getAttribute("defaultValue"))
        this.shadow = this.attachShadow({mode: 'open'});
    }

    save() {
        return undefined;
    }

    load() {
    }

    step(time) { }
}

class BoolEntry extends Type {
    constructor(defaultValue) {
        super([0, 0], defaultValue);

        this.shadow.appendChild(createElement(html`
            <input type="checkbox"></input>
        `));
        this.input = this.shadow.querySelector("input");
        this.input.checked = defaultValue;
        this.input.addEventListener('change', () => {
            this.value = this.input.checked;
            this.dispatchEvent(new Event('change'));
        });
    }

    save() {
        return this.value;
    }

    load(data) {
        this.value = data;
        this.input.checked = data;
        this.dispatchEvent(new Event('change'));
    }
}
defineEl('bool-entry', BoolEntry);

class Slider extends Type {
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

class FloatBar extends Type {
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

    constructor(range, defaultValue, supressFunctionGen) {
        super(range, defaultValue);

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
            this.func = generators[this.func_select.value].func;
            this.params = new generators[this.func_select.value].params();
        };
        set_func();

        this.func_select.addEventListener('change', set_func);
        this.func_gen.addEventListener('change', () => {
            this.generate = this.func_gen.checked;
        });

        func_modal.addEventListener('click', async () => {
            let resolver = undefined;
            const p = new Promise(r => { resolver = r; });
            const modal = createModal(resolver);
            let curr_params = undefined;
            if (this.generate)
                curr_params = this.params;
            const generator = new FunctionGenerator(
                modal, this.func_select.value, curr_params, resolver);
            const params = await p;
            generator.remove();
            modal.remove();
            if (!params)
                return;

            this.params = params;
            this.generate = true;
            this.func_gen.checked = true;
        });

        if (supressFunctionGen)
            funcgen_container.style.display = "none";
    }

    step(time) {
        if (this.generate)
            this.set_value(this.func(time, this.range, this.params));
    }

    save() {
        const savedata = {
            value: this.value,
        }

        if (this.generate) {
            savedata.generate = this.generate;
            savedata.func = this.func_select.value;
            savedata.params = this.params.save();
        } else {
            savedata.generate = false;
        }
        return savedata;
    }

    load(data) {
        if (data === undefined)
            return;
        this.set_value(data.value);

        if (data.generate) {
            this.params = new generators[this.func_select.value].params();
            this.params.load(data.params);

            this.func_select.value = data.func;
            this.func = generators[this.func_select.value].func;
            this.func_gen.checked = true;

            this.generate = true;
        }
    }
}
defineEl('float-bar', FloatBar);

class IntEntry extends FloatBar {
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

class VecEntry extends Type {
    floats = []

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
        }

        this.value = this.defaultValue;

        this.floats = Array.from(this.shadow.querySelectorAll(getEl("float-bar")));
        for (let float of this.floats) {
            float.addEventListener('change', () => {
                for (let i = 0; i < this.nelem; i++) {
                    this.value[i] = this.floats[i].value;
                }
                this.dispatchEvent(new Event('change'));
            });
        }
    }

    save() {
        const values = {}
        for (let i = 0; i < this.nelem; i++) {
            values[this.names[i]] = this.floats[i].save();
        }
        return values;
    }

    load(data) {
        if (data === undefined)
            return;
        for (let name of Object.keys(data)) {
            const i = this.names.indexOf(name);
            this.floats[i].load(data[name]);
        }
    }

    step(time) {
        for (let i = 0; i < this.nelem; i++)
            this.floats[i].step(time);
    }
}
defineEl('vec-entry', VecEntry);

function add_new_channel_ui(ui_container, chanid) {
    const new_ui = document.createElement("div");
    new_ui.id = `ui-${chanid}`;
    ui_container.appendChild(new_ui);
}

class ChannelId {
    constructor(id) {
        this.id = id;
    }
}

class ChannelSelect extends Type {
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

