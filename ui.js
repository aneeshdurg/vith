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
}

class BoolEntry extends Type {
    constructor(defaultValue) {
        super([0, 0], defaultValue);

        const input = document.createElement('input');
        input.id = "generate";
        input.type = 'checkbox';
        input.checked = defaultValue;
        input.addEventListener('change', () => {
            this.value = input.checked;
            this.dispatchEvent(new Event('change'));
        });

        this.shadow.appendChild(input);
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
        const func_gen = document.createElement('input');
        func_gen.id = "generate";
        func_gen.type = 'checkbox';
        const func_select = document.createElement('select');
        const func_modal = document.createElement('button');
        func_modal.innerText = "Edit function";
        Object.keys(generators).forEach((k, i) => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.innerText = k;
            func_select.appendChild(opt);
        });

        this.generate = false;
        let func = generators[func_select.value].func;
        let params = generators[func_select.value].params;
        const f = (time) => {
            if (this.generate) {
                this.set_value(func(time, this.range, params));
                requestAnimationFrame(f);
            }
        }
        func_select.addEventListener('change', () => {
            func = generators[func_select.value].func;
            params = generators[func_select.value].params;
        });
        func_gen.addEventListener('change', () => {
            this.generate = func_gen.checked;
            if (this.generate)
                f(0);
        });

        func_modal.addEventListener('click', async () => {
            let resolver = null;
            const p = new Promise(r => { resolver = r; });
            const modal = createModal(resolver);
            const generator = new FunctionGenerator(modal, func_select.value, resolver);
            const value = await p;
            generator.remove();
            modal.remove();
            if (!value)
                return;

            func = value.func;
            params = value.params;
            let needs_restart = false;
            if (!this.generate)
                needs_restart = true;
            this.generate = true;
            func_gen.checked = true;
            if (needs_restart)
                f(0);
        });

        container.appendChild(this.slider);
        container.appendChild(this.input);
        container.appendChild(document.createElement('br'));
        container.appendChild(gen_label);
        if (!supressFunctionGen) {
            container.appendChild(func_gen);
            container.appendChild(func_select);
            container.appendChild(func_modal);
        }
        this.shadow.appendChild(container);
    }
}
customElements.define('float-bar', FloatBar);

class VecEntry extends Type {
    floats = []

    constructor(nelem, names, range, defaultValue) {
        super(range, defaultValue);
        this.nelem = nelem;

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
}
customElements.define('vec-entry', VecEntry);
