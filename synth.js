class Synth {
    dimensions = [1000, 1000];

    stages = [];
    stageModules = {};

    constructor(canvas, fragShader) {
        this.dimensions = [1000, 1000];

        canvas.width = this.dimensions[0];
        canvas.height = this.dimensions[1];
        this.gl = canvas.getContext("webgl2");
        if (!this.gl)
            throw new Error("Could not initialize webgl2 context! Does your browser support webgl2?");
        enableGlExts(this.gl);

        this.programInfo = twgl.createProgramInfo(this.gl, [vs, fragShader]);
        const bufferInfo = twgl.createBufferInfoFromArrays(this.gl, bufferArrays);
        setupProgram(this.gl, this.programInfo, bufferInfo);

        this.fbs = new FrameBufferManager(this.gl, this.dimensions);
    }

    render(time) {
        this.stages.forEach((name, stage) => {
            this.fbs.bind_dst();
            const fn_params = this.stageModules[name];
            const params = {
                u_dimensions: this.dimensions,
                u_tex_dimensions: this.dimensions,
                u_texture: this.fbs.src(),
                u_function: fn_params.id,
                u_stage: stage,
                u_feedback: fn_params.feedback,
            };
            for (let key of Object.keys(fn_params.params)) {
                params['u_' + key] = fn_params.params[key];
            }

            twgl.setUniforms(this.programInfo, params);
            render(this.gl);
            this.fbs.flipflop();
        });

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        twgl.setUniforms(this.programInfo, {
            u_tex_dimensions: this.dimensions,
            u_texture: this.fbs.src(),
            u_function: 0,
            u_stage: this.stages.length + 1,
            u_feedback: 1,
        });
        render(this.gl);
    }

    add_stage(name, module) {
        if (this.stages.indexOf(name) != -1)
            throw new Error("name collision");
        this.stageModules[name] = module;
        this.stages.push(name);
    }

    remove_stage(name) {
        const idx = this.stages.indexOf(name);
        if (idx == -1)
            throw new Error("no such stage");
        delete this.stageModules[name];
        this.stages.splice(idx, 1);
    }
}

async function synth_main(canvas, root) {
    root = root || ".";

    const fragShader = await getFile(root + "/synth.frag.c");
    const obj = new Synth(canvas, fragShader);
    // TODO create a UI for this
    obj.add_stage('o1', new Oscillator([0, 0.5], 0, [1, 0, 0]));
    obj.add_stage('o2', new Oscillator([0.25, 0], 0, [0, 0, 1], 1));
    const nr = Math.random();
    const ng = Math.random();
    const nb = Math.random();
    obj.add_stage('n1', new Noise(nr, ng, nb, 1));
    obj.add_stage('h1', new HueShift(5, 1));
    obj.add_stage('ro1', new Rotate(0.1, 1));
    for(let i = 1; i <= 8; i++)
        obj.add_stage(`re${i}`, new Reflector(i * Math.PI / 8, 0, 1));
    obj.add_stage('z1', new Zoom(1.5, [0.5, 0.5], 1));

    function f(time) {
        obj.render(time);
        requestAnimationFrame(f);
    }

    requestAnimationFrame(f);

    window.obj = obj;

    const ui = document.getElementById("ui");

    customElements.define('synth-reflector', ReflectElement);
    document.getElementById("add_new_ref").addEventListener("click", () => {
        ui.appendChild(new ReflectElement(obj));
    });

    customElements.define('synth-oscillator', OscillatorElement);
    document.getElementById("add_new_osc").addEventListener("click", () => {
        ui.appendChild(new OscillatorElement(obj));
    });
}

const globalCounters = {};

class SynthElementBase extends HTMLElement {
    get_title() {
        return "";
    }

    get_args() {
        //returns a map of str -> Type
        return {};
    }

    get_type() {
        return Type;
    }

    get_feedback() {
        return 0;
    }

    constructor(synth) {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const args = this.get_args();
        const container = document.createElement('div');
        container.style = "border: solid 1px; padding: 0.5em";
        container.innerHTML = `<h2>${this.get_title()}</h2>`;

        const params = [];
        const createElement = (arg, type) => {
            const label = document.createElement('label');
            container.appendChild(label);
            label.for = arg;
            label.innerText = `${arg}: `;

            const el = document.createElement('div');
            container.appendChild(el);
            el.id = arg;
            el.style = "display: inline;";

            el.appendChild(type);
            type.addEventListener('change', () => {
                this.onchange(arg, type.value);
            });

            container.appendChild(document.createElement('br'));
        };

        for (let arg of Object.keys(args)) {
            params.push(args[arg].defaultValue);
            createElement(arg, args[arg]);
        }
        createElement('feedback', new FloatEntry([0, 10], 1));

        shadow.appendChild(container);

        const counter = globalCounters[this.get_title()] || 0;
        globalCounters[this.get_title()] = counter + 1;
        this.name = `${this.get_title()}-${counter}`;

        const constructor = this.get_type();
        synth.add_stage(this.name, new constructor(...params, 1));

        this.synth = synth;
    }

    onchange(arg, val) {
        console.log("change", arg, val);
        if (arg === "feedback")
            this.synth.stageModules[this.name].feedback = val;
        else
            this.synth.stageModules[this.name].params[arg] = val;
    }
}


class OscillatorElement extends SynthElementBase {
    get_title() {
        return "Oscillator";
    }

    get_args() {
        return {
            osc_f: new VecEntry(2, ["x", "y"], [[0, 100], [0, 100]], [0.25, 0]),
            osc_c: new FloatBar([0, 100], 0),
            osc_color: new VecEntry(3, ["r", "g", "b"], [[0, 1], [0, 1], [0, 1]], [1, 0, 0]),
        }
    }

    get_type() {
        return Oscillator;
    }
}

class ReflectElement extends SynthElementBase {
    get_title() {
        return "Reflect";
    }

    get_args() {
        return {
            reflect_theta: new FloatEntry([0, Math.PI], Math.PI / 2),
            reflect_y: new FloatEntry([-1, 1], 0),
        }
    }

    get_type() {
        return Reflector;
    }
}
