class Stage {
    constructor(fn_params, step) {
        this.fn_params = fn_params;
        this.step = step;
    }
}

class Synth {
    name = "synth";
    clock_speed = 1;

    recording = [];
    record_frames = 0;

    dimensions = [1000, 1000];

    stages = []; // List[str]
    stageModules = {}; // Map[str, Stage]

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

    constructor(canvas) {
        this.dimensions = [1000, 1000];

        canvas.width = this.dimensions[0];
        canvas.height = this.dimensions[1];
        this.gl = canvas.getContext("webgl2", {'preserveDrawingBuffer': true});
        if (!this.gl)
            throw new Error("Could not initialize webgl2 context! Does your browser support webgl2?");
        enableGlExts(this.gl);

        this.programInfo = twgl.createProgramInfo(this.gl, [vs, SYNTHFRAGSHADER]);
        const bufferInfo = twgl.createBufferInfoFromArrays(this.gl, bufferArrays);
        setupProgram(this.gl, this.programInfo, bufferInfo);

        this.fbs = new FrameBufferManager(this.gl, this.dimensions);
        this.canvas = canvas;
    }

    render(time_) {
        this.dispatchEvent
        let time = time_ * this.clock_speed;

        const process_stages = (stage, stageid) => {
            const fn_params = stage.fn_params;

            if (!fn_params.enable) {
                return;
            }
            stage.step(time);

            if (stageid == 0)
                this.reset_transform();

            if (fn_params instanceof Synth || fn_params instanceof ModuleElement) {
                fn_params.stages.forEach((name, stageid_) => {
                    const fn_params_ = fn_params.stageModules[name];

                    process_stages(fn_params_, stageid + 1 + stageid_);
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
                u_stage: stageid,
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

        process_stages(new Stage(this, (t) => {}), -1);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        twgl.setUniforms(this.programInfo, {
            u_tex_dimensions: this.dimensions,
            u_texture: this.fbs.src(),
            u_function: 0,
            u_stage: this.stages.length + 1,
            u_feedback: 1,
        });
        render(this.gl);

        if (this.record_frames) {
            this.recording.push(this.canvas.toDataURL());
            this.record_frames--;
        }

    }

    get_frame_data(array) {
        this.gl.readPixels(0, 0, ...this.dimensions, this.gl.RGBA, this.gl.UNSIGNED_BYTE, array);
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
        this.stageModules[name].fn_params.enable = state;
    }

    running = null;
    cancel = false;
    run() {
        if (this.running)
            return;

        this.running = new Promise(r => {
            const runner = async (time) => {
                this.render(time);
                // TODO custom framerate?
                await new Promise(r => setTimeout(r, 10));
                if (!this.cancel)
                    requestAnimationFrame(runner);
                else
                    r();
            }
            requestAnimationFrame(runner);
        });
    }

    async stop() {
        if (!this.running)
            return;

        this.cancel = true;
        await this.running;
        this.running = null;
        this.cancel = false;
    }
}

function setup_controler() {
    let current_controls = 0;
    const num_controls = 4;
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

async function synth_main(canvas) {
    const synth = new Synth(canvas);
    window.synth = synth;
    synth.run();

    const sidebar = document.getElementById("sidebar");
    sidebar.style.display = "none";
    const burgerbtn = document.getElementById("burgerbtn");
    const title = document.getElementById("title");

    const showmenu = () => {
        sidebar.style.display = "";
        burgerbtn.style.display = "none";
    };
    const hidemenu = () => {
        sidebar.style.display = "none";
        burgerbtn.style.display = "";
    };

    burgerbtn.addEventListener('click', showmenu);
    title.addEventListener('click', hidemenu);
    document.getElementById("display-container").addEventListener("click", hidemenu);

    const rightsidebar = document.getElementById("rightsidebar");
    rightsidebar.style.display = "none";
    const gearbtn = document.getElementById("gearbtn");
    const settingstitle = document.getElementById("settingstitle");

    const showrightmenu = () => {
        rightsidebar.style.display = "";
        gearbtn.style.display = "none";
    };
    const hiderightmenu = () => {
        rightsidebar.style.display = "none";
        gearbtn.style.display = "";
    };
    gearbtn.addEventListener('click', showrightmenu);
    settingstitle.addEventListener('click', hiderightmenu);
    document.getElementById("display-container").addEventListener("click", hiderightmenu);


    const ui = document.getElementById("ui-container");
    ui.addEventListener("namechange", () => {
        title.innerText = synth.name;
    });
    setup_settings(ui, synth);
    setup_controler();
    setup_add_new_stage(ui, synth);
    setup_meta_module(ui, synth);
    setup_save_load(ui, synth);
    setup_recording(ui, synth);
}

function loadStaticSynth(canvas, data, cb) {
    const synth = new Synth(canvas)
    synth.run();

    const ui = document.createElement('div');
    // note that meta-modules don't need to be loaded
    loaddata(data.stages, ui, synth);
    if (cb) {
        cb(ui);
    }

    return synth;
}
