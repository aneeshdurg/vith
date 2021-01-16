class Synth {
    recording = [];
    record_frames = 0;

    dimensions = [1000, 1000];

    stages = [];
    stageModules = {};

    transform = {
        center: [ 0.5, 0.5 ],
        scale: 1,
        rotation: 0,
    }

    reset_transform() {
        this.transform = {
            center: [ 0.5, 0.5 ],
            scale: 1,
            rotation: 0,
        }
    }

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
        this.canvas = canvas;
    }

    async render(time) {
        const process_stages = (fn_params, stage) => {
            if (!fn_params.enable) {
                return;
            }

            if (stage == 0)
                this.reset_transform();

            if (fn_params instanceof Synth || fn_params instanceof ModuleElement) {
                fn_params.stages.forEach((name, stage_) => {
                    const fn_params_ = fn_params.stageModules[name];
                    process_stages(fn_params_, stage + 1 + stage_);
                });
                return;
            } else if (fn_params instanceof TransformElement) {
                // if (fn_params.params["clear transform"]) {
                //     this.reset_transform();
                // } else {
                    this.transform.scale = fn_params.params.scale;
                    this.transform.center = [...fn_params.params.center];
                    this.transform.rotation = fn_params.params.rotation;
                // }
                return;
            }

            this.fbs.bind_dst();
            const params = {
                u_dimensions: this.dimensions,
                u_tex_dimensions: this.dimensions,
                u_texture: this.fbs.src(),
                u_transform_center: this.transform.center,
                u_transform_scale: this.transform.scale,
                u_transform_rotation: this.transform.rotation,
                u_function: fn_params.id,
                u_stage: stage,
                u_feedback: fn_params.feedback,
                u_constrain_to_transform: fn_params.constrain,
            };
            for (let key of Object.keys(fn_params.params)) {
                params['u_' + key] = fn_params.params[key];
            }

            twgl.setUniforms(this.programInfo, params);
            render(this.gl);
            this.fbs.flipflop();
        };

        process_stages(this, -1);

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

    run() {
        const runner = async (time) => {
            await this.render(time);
            if (this.record_frames) {
                this.recording.push(this.canvas.toDataURL());
                this.record_frames--;
            }
            requestAnimationFrame(runner);
        }
        requestAnimationFrame(runner);
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

const add_new_tags = ["generator", "space", "color"];
let current_add_new_tag = 0;
function setup_add_new_stage(ui, synth) {
    const update_add_new = (new_tag) => {
        new_tag = (new_tag + add_new_tags.length) % add_new_tags.length;

        const old_obj = document.getElementById(`add_new_${add_new_tags[current_add_new_tag]}_container`);
        old_obj.style.display = "none";
        const new_obj = document.getElementById(`add_new_${add_new_tags[new_tag]}_container`);
        new_obj.style.display = "";

        current_add_new_tag = new_tag;
    };

    document.getElementById("add_new-prev").addEventListener('click', () => {
        update_add_new(current_add_new_tag - 1);
    });
    document.getElementById("add_new-next").addEventListener('click', () => {
        update_add_new(current_add_new_tag + 1);
    });

    const buttons = {};
    const selectors = {};
    for (let tag of add_new_tags) {
        buttons[tag] = document.getElementById(`add_new_${tag}`);
        selectors[tag] = document.getElementById(`add_new_${tag}_select`);
        buttons[tag].addEventListener('click', () => {
            const stageElem = eval(selectors[tag].value);
            ui.appendChild(new stageElem(synth));
        });
    }

    for (let module of Object.keys(MODULE_IDS)) {
        const module_info = MODULE_IDS[module];

        const opt = document.createElement('option');
        opt.innerText = module;
        opt.value = module_info.class;

        selectors[module_info.tag].appendChild(opt);
    }

    const opt = document.createElement('option');
    opt.innerText = 'transform';
    opt.value = 'TransformElement';
    selectors['space'].appendChild(opt);
}

async function synth_main(canvas, root) {
    root = root || ".";

    const fragShader = await getFile(root + "/synth.frag.c");
    const synth = new Synth(canvas, fragShader);
    window.synth = synth;
    synth.run();

    const ui = document.getElementById("ui-container");

    setup_controler();
    setup_add_new_stage(ui, synth);
    setup_meta_module(ui, synth);
    setup_save_load(ui, synth);
}

async function loadStaticSynth(canvas, root, datapath) {
    root = root || ".";
    const fragShader = await getFile(root + "/synth.frag.c");

    const data = JSON.parse(await getFile(root + datapath));
    if (data.modules && Object.keys(data.modules).length) {
        // TODO
        throw new Error("Modules not supported");
    }

    const synth = new Synth(canvas, fragShader)
    synth.run();
    loaddata(data.stages, document.createElement('div'), synth);
}
