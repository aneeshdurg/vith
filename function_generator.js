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
}

class AudioDefaultParams extends GenParams {
    params = {c: 0, y: 0, a: 1};
}

const audio_generator = (t, range, genparams) => {
    const params = genparams.get();
    const step = raw_step(t, range, params.freq, params.c);
    return constrain(range, params.a * (range[1] - step + range[0]) + params.y);
};

const generators = {
    sin: { func: sin_generator, params: DefaultParams, ui: defaultFnUI },
    step: { func: step_generator, params: DefaultParams, ui: defaultFnUI },
    inv_step: { func: inv_step_generator, params: DefaultParams, ui: defaultFnUI },
    audio: { func: audio_generator, params: AudioDefaultParams, ui: defaultFnUI }
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

        this.func = generators[current].func;
        this.params = current_params || new generators[current].params();
        console.log("Using params", this.params);

        const function_ui = document.createElement('div');
        function_ui.className = 'function-ui';

        defaultFnUI(function_ui, this.params);

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
