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

class FloatEntry extends Type {
    validate(entry) {
        return !isNaN(entry) && entry >= this.range[0] && entry <= this.range[1];
    }

    constructor(range, defaultValue) {
        super(range, defaultValue);

        const input = document.createElement('input');
        input.addEventListener('change', () => {
            const value = parseFloat(input.value);
            if (!this.validate(value)) {
                input.style = "color: red";
            } else {
                input.style = "";
                this.value = value;
            }

            this.dispatchEvent(new Event('change'));
        });
        input.value = this.defaultValue;
        this.value = this.defaultValue;
        this.shadow.appendChild(input);
    }
}
customElements.define('float-entry', FloatEntry);

class FloatBar extends Type {
    validate(entry) {
        return !isNaN(entry) && entry >= this.range[0] && entry <= this.range[1];
    }

    constructor(range, defaultValue) {
        super(range, defaultValue);

        const container = document.createElement('div');

        const bar = document.createElement('div');
        bar.style = "background: black; width: 10em; height: 1em;";
        const slider = document.createElement('div');
        slider.style = "background: white; height: 1em; width: 1%; position: relative; left: 0em";
        const input = document.createElement('input');

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

        bar.appendChild(slider);
        container.appendChild(bar);
        container.appendChild(input);
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
