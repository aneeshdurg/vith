class Function {
    id = 0;
    feedback = 0;
    params = {};
    enable = true;

    constructor(feedback) {
        this.feedback = feedback;
    }
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
        this.defaultValue = defaultValue;
        this.shadow = this.attachShadow({mode: 'open'});
    }

    save() {
        return undefined;
    }

    load() {
    }
}

class BoolEntry extends Type {
    constructor(defaultValue) {
        super([0, 0], defaultValue);

        this.input = document.createElement('input');
        this.input.id = "generate";
        this.input.type = 'checkbox';
        this.input.checked = defaultValue;
        this.input.addEventListener('change', () => {
            this.value = this.input.checked;
            this.dispatchEvent(new Event('change'));
        });

        this.shadow.appendChild(this.input);
    }

    save() {
        return this.value;
    }

    load(data) {
        // console.log("loading bool", data);
        this.value = data;
        this.input.checked = data;
        this.dispatchEvent(new Event('change'));
    }
}
customElements.define('bool-entry', BoolEntry);

class Slider extends Type {
    constructor(range, defaultValue) {
        super(range, defaultValue);

        const container = document.createElement('div');
        container.style = "padding-bottom: 0.5em;"
        const bar = document.createElement('div');
        bar.style = "background: black; width: 10em; height: 1em;";
        this.slider = document.createElement('div');
        this.slider.style = "background: white; height: 1em; width: 1%; position: relative; left: 0em";

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

        bar.appendChild(this.slider);
        container.appendChild(bar);
        this.shadow.appendChild(container);
    }

    set_value(value) {
        const x = (value - this.range[0]) / (this.range[1] - this.range[0]);
        this.slider.style.left = `${x * 10}em`;
    }
}
customElements.define('slider-elem', Slider);

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

        const container = document.createElement('div');

        this.slider = new Slider(range, defaultValue);
        this.input = document.createElement('input');
        this.input.style.boxShadow = "none";
        this.input.type = "number";
        this.input.min = this.range[0];
        this.input.max = this.range[1];
        this.input.step = (this.range[1] - this.range[0]) / 1000;

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

        const gen_label = document.createElement('label');
        gen_label.for = "generate";
        gen_label.innerText = "function: ";
        this.func_gen = document.createElement('input');
        this.func_gen.id = "generate";
        this.func_gen.type = 'checkbox';
        this.func_select = document.createElement('select');
        const func_modal = document.createElement('button');
        func_modal.innerText = "Edit function";
        Object.keys(generators).forEach((k, i) => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.innerText = k;
            this.func_select.appendChild(opt);
        });

        this.generate = false;
        this.func = generators[this.func_select.value].func;
        this.params = generators[this.func_select.value].params;

        this.func_select.addEventListener('change', () => {
            this.func = generators[this.func_select.value].func;
            this.params = generators[this.func_select.value].params;
        });
        this.func_gen.addEventListener('change', () => {
            this.generate = this.func_gen.checked;
            if (this.generate)
                this.start_generation(0);
        });

        func_modal.addEventListener('click', async () => {
            let resolver = null;
            const p = new Promise(r => { resolver = r; });
            const modal = createModal(resolver);
            const generator = new FunctionGenerator(modal, this.func_select.value, resolver);
            const params = await p;
            generator.remove();
            modal.remove();
            if (!params)
                return;

            this.params = params;
            let needs_restart = false;
            if (!this.generate)
                needs_restart = true;
            this.generate = true;
            this.func_gen.checked = true;
            if (needs_restart)
                this.start_generation(0);
        });

        container.appendChild(this.slider);
        container.appendChild(this.input);
        container.appendChild(document.createElement('br'));
        container.appendChild(gen_label);
        if (!supressFunctionGen) {
            container.appendChild(this.func_gen);
            container.appendChild(this.func_select);
            container.appendChild(func_modal);
        }
        this.shadow.appendChild(container);
    }

    start_generation(time) {
        if (this.generate) {
            this.set_value(this.func(time, this.range, this.params));
            requestAnimationFrame(this.start_generation.bind(this));
        }
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
        // console.log("loading float", data);
        this.set_value(data.value);

        if (data.generate) {
            this.params = new GenParams();
            this.params.load(data.params);

            this.func_select.value = data.func;
            this.func = generators[this.func_select.value].func;
            this.func_gen.checked = true;

            this.generate = true;
            this.start_generation(0);
        }
    }
}
customElements.define('float-bar', FloatBar);

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
customElements.define('int-entry', IntEntry);

class VecEntry extends Type {
    floats = []

    constructor(nelem, names, range, defaultValue) {
        super(range, defaultValue);
        this.nelem = nelem;
        this.names = names;

        for (let i = 0; i < this.nelem; i++) {
            const entry = new FloatBar(this.range[i], this.defaultValue[i])
            entry.addEventListener('change', () => {
                for (let i = 0; i < this.nelem; i++) {
                    this.value[i] = this.floats[i].value;
                }
                this.dispatchEvent(new Event('change'));
            });
            this.floats.push(entry);

            const container = document.createElement('div');
            const label = document.createElement('label');
            label.for = names[i];
            label.innerText = `${names[i]}: `;
            entry.id = names[i];

            container.appendChild(label);
            container.appendChild(entry);
            this.shadow.appendChild(container);
        }

        this.value = this.defaultValue;
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
        // console.log("loading vec", data);
        for (let name of Object.keys(data)) {
            const i = this.names.indexOf(name);
            // TODO validate i
            this.floats[i].load(data[name]);
        }
    }
}
customElements.define('vec-entry', VecEntry);
