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

    async render(time) {
        this.stages.forEach((name, stage) => {
            const fn_params = this.stageModules[name];
            if (!fn_params.enable) {
                return;
            }

            this.fbs.bind_dst();
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

        await new Promise(r => setTimeout(r, 10));
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

    toggle_stage(name, state) {
        this.stageModules[name].enable = state;
    }
}

async function synth_main(canvas, root) {
    root = root || ".";

    const fragShader = await getFile(root + "/synth.frag.c");
    const obj = new Synth(canvas, fragShader);
    // TODO create a UI for this
    // obj.add_stage('o1', new Oscillator([0, 0.5], 0, [1, 0, 0]));
    // obj.add_stage('o2', new Oscillator([0.25, 0], 0, [0, 0, 1], 1));
    // const nr = Math.random();
    // const ng = Math.random();
    // const nb = Math.random();
    // obj.add_stage('n1', new Noise(nr, ng, nb, 1));
    // obj.add_stage('h1', new HueShift(5, 1));
    // obj.add_stage('ro1', new Rotate(0.1, 1));
    // for(let i = 1; i <= 8; i++)
    //     obj.add_stage(`re${i}`, new Reflector(i * Math.PI / 8, 0, 1));
    // obj.add_stage('z1', new Zoom(1.5, [0.5, 0.5], 1));

    async function f(time) {
        await obj.render(time);
        requestAnimationFrame(f);
    }

    requestAnimationFrame(f);

    window.obj = obj;

    const ui = document.getElementById("ui-container");

    document.getElementById("add_new_hue").addEventListener("click", () => {
        ui.appendChild(new HueShiftElement(obj));
    });

    document.getElementById("add_new_noise").addEventListener("click", () => {
        ui.appendChild(new NoiseElement(obj));
    });

    document.getElementById("add_new_osc").addEventListener("click", () => {
        ui.appendChild(new OscillatorElement(obj));
    });

    document.getElementById("add_new_ref").addEventListener("click", () => {
        ui.appendChild(new ReflectorElement(obj));
    });


    document.getElementById("add_new_rot").addEventListener("click", () => {
        ui.appendChild(new RotateElement(obj));
    });

    document.getElementById("add_new_zoom").addEventListener("click", () => {
        ui.appendChild(new ZoomElement(obj));
    });
}

const globalCounters = {};
