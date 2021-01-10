class Synth {
    dimensions = [1000, 1000];

    stages = [];
    stageModules = {};

    enable = true;

    constructor(canvas, fragShader) {
        this.dimensions = [1000, 1000];

        canvas.width = this.dimensions[0];
        canvas.height = this.dimensions[1];
        this.gl = canvas.getContext("webgl2", {'preserveDrawingBuffer': true});
        if (!this.gl)
            throw new Error("Could not initialize webgl2 context! Does your browser support webgl2?");
        enableGlExts(this.gl);

        this.programInfo = twgl.createProgramInfo(this.gl, [vs, fragShader]);
        const bufferInfo = twgl.createBufferInfoFromArrays(this.gl, bufferArrays);
        setupProgram(this.gl, this.programInfo, bufferInfo);

        this.fbs = new FrameBufferManager(this.gl, this.dimensions);
    }

    async render(time) {
        const process_stages = (fn_params, stage) => {
            if (!fn_params.enable) {
                return;
            }

            if (fn_params instanceof Synth || fn_params instanceof ModuleElement) {
                fn_params.stages.forEach((name, stage_) => {
                    const fn_params_ = fn_params.stageModules[name];
                    process_stages(fn_params_, stage + stage_);
                });
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
        };

        process_stages(this, 0);

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

function setup_controler() {
    let current_controls = 0;
    const num_controls = 3;
    document.getElementById("controls-next").addEventListener("click", () => {
        document.getElementById(`controls-${current_controls}`).style.display = "none";
        current_controls += 1;
        current_controls %= num_controls;
        document.getElementById(`controls-${current_controls}`).style.display = "";
    });
    document.getElementById("controls-prev").addEventListener("click", () => {
        document.getElementById(`controls-${current_controls}`).style.display = "none";
        current_controls -= 1;
        if (current_controls < 0)
            current_controls += num_controls;
        document.getElementById(`controls-${current_controls}`).style.display = "";
    });
}

function setup_add_new_stage(ui, synth) {
    const add_new_select = document.getElementById("add_new_select");
    for (let module of Object.keys(MODULE_IDS)) {
        const opt = document.createElement('option');
        opt.innerText = module;
        opt.value = MODULE_IDS[module];
        add_new_select.appendChild(opt);
    }
    document.getElementById("add_new").addEventListener('click', () => {
        const stageElem = eval(add_new_select.value);
        ui.appendChild(new stageElem(synth));
    });
}

async function synth_main(canvas, root) {
    root = root || ".";

    const fragShader = await getFile(root + "/synth.frag.c");
    const synth = new Synth(canvas, fragShader);
    window.synth = synth;

    window.recording = [];
    window.record_frames = 0;
    async function f(time) {
        await synth.render(time);
        if (window.record_frames) {
            recording.push(canvas.toDataURL());
            window.record_frames--;
        }
        requestAnimationFrame(f);
    }
    requestAnimationFrame(f);

    const ui = document.getElementById("ui-container");

    setup_controler();
    setup_add_new_stage(ui, synth);
    setup_meta_module(ui, synth);
    setup_save_load(ui, synth);
}
