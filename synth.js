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
    window.obj = obj;

    async function f(time) {
        await obj.render(time);
        requestAnimationFrame(f);
    }
    requestAnimationFrame(f);

    const ui = document.getElementById("ui-container");

    const add_new_select = document.getElementById("add_new_select");
    for (let module of Object.keys(MODULE_IDS)) {
        const opt = document.createElement('option');
        opt.innerText = module;
        opt.value = MODULE_IDS[module];
        add_new_select.appendChild(opt);
    }
    document.getElementById("add_new").addEventListener('click', () => {
        const moduleElem = eval(add_new_select.value);
        ui.appendChild(new moduleElem(obj));
    });
}
