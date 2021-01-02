const generators = {
    sin: (t, range) => (((Math.sin(t / 1000) + 1) / 2) * (range[1] - range[0])) + range[0],
    step: (time, range) => ((time / 1000) % (range[1] - range[0])) + range[0],
    // step: (t) => ((t / 1000) % 1) * 2 - 1,
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

    validate(entry) {
        return false;
    }
}

class FloatBar extends Type {
    validate(entry) {
        return !isNaN(entry) && entry >= this.range[0] && entry <= this.range[1];
    }

    constructor(range, defaultValue, supressFunctionGen) {
        super(range, defaultValue);

        const container = document.createElement('div');

        const bar = document.createElement('div');
        bar.style = "background: black; width: 10em; height: 1em;";
        const slider = document.createElement('div');
        slider.style = "background: white; height: 1em; width: 1%; position: relative; left: 0em";
        const input = document.createElement('input');

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

        const percent = 10 * (this.defaultValue - this.range[0]) / (this.range[1] - this.range[0]);
        slider.style.left = `${percent}em`;
        this.slider = slider;

        let enable = false;
        const enable_handler = () => { enable = true; };
        const disable_handler = () => { enable = false; };

        const handler = (e) => {
            if (!enable || e.target != bar)
                return;
            const rect = e.target.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            const x = (clientX - rect.left) / rect.width;
            slider.style.left = `${x * 10}em`;
            this.value = x * (this.range[1] - this.range[0]) + this.range[0];
            input.value = this.value;

            this.dispatchEvent(new Event('change'));
        };

        bar.addEventListener('mousedown', enable_handler);
        bar.addEventListener('mousemove', handler);
        bar.addEventListener('mouseup', disable_handler);

        bar.addEventListener('touchmove', handler);
        input.addEventListener('change', () => {
            const value = parseFloat(input.value);
            if (!this.validate(value)) {
                input.style = "color: red";
            } else {
                input.style = "";
                this.value = value;
                const x = (value - this.range[0]) / (this.range[1] - this.range[0]);
                slider.style.left = `${x * 10}em`;
            }

            this.dispatchEvent(new Event('change'));
        });

        input.value = this.defaultValue;
        this.value = this.defaultValue;

        this.generate = false;
        let func = generators[func_select.value];
        const f = (time) => {
            if (this.generate) {
                let value = func(time, this.range);
                // value = ((value + 1) / 2);
                // value *= (this.range[1] - this.range[0]) + this.range[0];

                this.value = value;
                input.value = value;
                this.dispatchEvent(new Event('change'));
                requestAnimationFrame(f);
            }
        }
        func_select.addEventListener('change', () => {
            func = generators[func_select.value];
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
            const generator = new FunctionGenerator(modal, resolver);
            const value = await p;
            generator.remove();
            modal.remove();
            if (value) {
                func = (time, range) => value.func(time, range, value.params);
                let needs_restart = false;
                if (!this.generate)
                    needs_restart = true;
                this.generate = true;
                func_gen.checked = true;
                if (needs_restart)
                    f(0);
            } else {
                // we didn't get a value
            }
        });

        bar.appendChild(slider);
        container.appendChild(bar);
        container.appendChild(input);
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
