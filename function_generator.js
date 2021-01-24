class GenParams {
    params = {}
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
    params = {freq: 1, c: 0};
}


const sin_generator = (t, range, genparams) => {
    const params = genparams.get();
    let value = Math.sin(params.freq * 2 * Math.PI * t / 1000 + params.c);
    value = (value + 1) / 2;
    value = value * (range[1] - range[0]) + range[0];
    return value;
};

const step_generator = (t, range, genparams) => {
    const params = genparams.get();
    return ((t / 1000 * params.freq + params.c) % (range[1] - range[0])) + range[0];
};

const inv_step_generator = (t, range, genparams) => {
    const step = step_generator(t, range, genparams);
    return range[1] - step + range[0];
};

const generators = {
    sin: { func: sin_generator, params: DefaultParams },
    step: { func: step_generator, params: DefaultParams },
    inv_step: { func: inv_step_generator, params: DefaultParams }
}

class FunctionGenerator{
    cancel = false;

    constructor (parentEl, current, current_params, resolver) {
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

        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('br'));

        const function_ui = document.createElement('div');
        function_ui.className = 'function-ui';

        function_ui.appendChild(document.createElement('br'));
        const freq_label = document.createElement('label');
        freq_label.for = "freq_input";
        freq_label.innerText = "Frequency: ";
        const freq_input = new FloatBar([0, 100], 1, true);
        freq_input.id = "freq_input";
        function_ui.appendChild(freq_label);
        function_ui.appendChild(freq_input);

        function_ui.appendChild(document.createElement('br'));
        const c_label = document.createElement('label');
        c_label.for = "c_input";
        c_label.innerText = "Phase shift: ";
        const c_input = new FloatBar([0, 2 * Math.PI], 0, true);
        c_input.id = "c_input";
        function_ui.appendChild(c_label);
        function_ui.appendChild(c_input);

        this.func = generators[current].func;
        this.params = current_params || new generators[current].params();
        console.log("Using params", this.params);
        freq_input.set_value(this.params.params.freq);
        c_input.set_value(this.params.params.c);

        freq_input.addEventListener('change', () => {
            this.params.params.freq = parseFloat(freq_input.value);
        });
        c_input.addEventListener('change', () => {
            this.params.params.c = parseFloat(c_input.value);
        });

        const f = () => {
            this.draw_axes();
            this.draw_function();
            this.draw_labels();
            if (!this.cancel)
                requestAnimationFrame(f);
        };
        f();

        function_ui.appendChild(document.createElement('br'));
        function_ui.appendChild(document.createElement('br'));
        const done_button = document.createElement('button');
        done_button.innerText = 'done';
        function_ui.appendChild(done_button);
        done_button.addEventListener('click', () => {
            resolver(this.params);
        });

        container.appendChild(function_ui);
        parentEl.appendChild(container);
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
            this.ctx.lineTo(i, maxy - maxy * this.func(i, [-1, 1], this.params));
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
