class Stage {
    constructor(fn_params, step) {
        this.fn_params = fn_params;
        this.step = step;
    }
}

class Channel {
    enable = true;
    stages = []; // List[str]
    stageModules = {}; // Map[str, Stage]
}

class Synth {
    name = "";
    clock_speed = 1;

    recording = [];
    record_frames = 0;

    dimensions = [1000, 1000];

    active_channel = 0; // TODO Synth should not track active channel! That belongs to the non-existant UI object.
    render_channel = 0;
    channels = [new Channel()];

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

        this.fbs = [new FrameBufferManager(this.gl, this.dimensions)];
        this.canvas = canvas;
    }

    add_channel() {
        this.channels.push(new Channel());
        this.fbs.push(new FrameBufferManager(this.gl, this.dimensions));
    }

    _get_stages(channelid) {
        return this.channels[channelid].stages;
    }

    _get_stageModules(channelid) {
        return this.channels[channelid].stageModules;
    }

    resize(new_dims) {
        this.dimensions = [...new_dims];
        this.canvas.width = this.dimensions[0];
        this.canvas.height = this.dimensions[1];

        this.gl.viewport(0, 0, ...this.dimensions);

        for (let i = 0; i < this.channels.length; i++)
            this.fbs[i] = new FrameBufferManager(this.gl, this.dimensions);
    }

    last_render_time = 0;
    target_time_ms = 1000 / 60;
    auto_scaling = false;

    render(time_) {
        this.dispatchEvent
        let time = time_ * this.clock_speed;

        const process_stages = (fbs, stage, stageid) => {
            const fn_params = stage.fn_params;

            if (!fn_params.enable)
                return;
            stage.step(time);

            if (stageid == 0)
                this.reset_transform();

            if (fn_params instanceof Channel || fn_params instanceof ModuleElement) {
                fn_params.stages.forEach((name, stageid_) => {
                    const fn_params_ = fn_params.stageModules[name];

                    process_stages(fbs, fn_params_, stageid + 1 + stageid_);
                });
                return;
            } else if (fn_params instanceof TransformElement) {
                this.transform.scale = fn_params.params.scale;
                this.transform.center = [...fn_params.params.center];
                this.transform.rotation = fn_params.params.rotation;
                return;
            }

            fbs.bind_dst();
            const params = {
                u_dimensions: this.dimensions,
                u_tex_dimensions: this.dimensions,
                u_texture: fbs.src(),
                u_transform_center: this.transform.center,
                u_transform_scale: this.transform.scale,
                u_transform_rotation: this.transform.rotation,
                u_function: fn_params.id,
                u_feedback: fn_params.feedback,
                u_constrain_to_transform: fn_params.constrain,
            };
            for (let key of Object.keys(fn_params.params)) {
                let value = fn_params.params[key];
                if (value instanceof ChannelId)
                    value = this.fbs[value.id].src();
                params['u_' + key] = value;
            }

            twgl.setUniforms(this.programInfo, params);
            render(this.gl);

            // clear channel textures
            for (let key of Object.keys(fn_params.params)) {
                let value = fn_params.params[key];
                if (value instanceof ChannelId) {
                    params['u_' + key] = 0;
                }
            }
            twgl.setUniforms(this.programInfo, params);

            fbs.flipflop();
        };

        for (let i = 0; i < this.channels.length; i++)
            process_stages(this.fbs[i], new Stage(this.channels[i], (t) => {}), -1);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        twgl.setUniforms(this.programInfo, {
            u_tex_dimensions: this.dimensions,
            u_texture: this.fbs[this.render_channel].src(),
            u_function: 0, // DRAW
            u_feedback: 1,
        });
        render(this.gl);

        if (this.record_frames) {
            this.recording.push(this.canvas.toDataURL());
            this.record_frames--;
        }

        // if (this.auto_scaling) {
        //     const delta = time_ - this.last_render_time;

        //     const threshold = 100; // 100 ms threshold
        //     const difference = this.target_time_ms - delta;
        //     const adiff = Math.abs(difference);
        //     if (this.last_render_time == 0 || adiff < 100) {
        //         this.last_render_time = time_;
        //         console.log(".", Math.floor(adiff));
        //         return;
        //     }
        //     this.last_render_time = time_;
        //     console.log("!", adiff);

        //     const sdiff = Math.sign(difference);

        //     const factor = Math.max(Math.min(Math.floor(adiff) / 2, 1), 50);
        //     let new_dims = null;
        //     if (Math.sign > 0)
        //         new_dims = this.dimensions.map(x => Math.max(x + factor));
        //     else
        //         new_dims = this.dimensions.map(x => Math.max(x - factor));
        //     TODO resize might allocate memory, this is bad to call here.
        //     this.resize(new_dims);
        // }
    }

    // set_target_fps(fps) {
    //     this.target_time_ms = 1000 / fps;
    // }

    // begin_auto_scale() {
    //     this.auto_scaling = true;
    // }

    // stop_auto_scale() {
    //     this.auto_scaling = false;
    // }

    get_frame_data(array) {
        this.gl.readPixels(0, 0, ...this.dimensions, this.gl.RGBA, this.gl.UNSIGNED_BYTE, array);
    }

    add_stage(chan, name, module) {
        if (this.channels[chan].stages.indexOf(name) != -1)
            throw new Error("name collision");
        this.channels[chan].stageModules[name] = module;
        this.channels[chan].stages.push(name);
    }

    remove_stage(chan, name) {
        const idx = this.channels[chan].stages.indexOf(name);
        if (idx == -1)
            throw new Error("no such stage");
        delete this.channels[chan].stageModules[name];
        this.channels[chan].stages.splice(idx, 1);
    }

    toggle_stage(chan, name, state) {
        this.channels[chan].stageModules[name].fn_params.enable = state;
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
    const num_controls = 5;
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

const add_new_tags = ["generator", "space", "color", "channels"];
let current_add_new_tag = 0;
function setup_add_new_stage(ui_container, synth) {
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
            const ui = ui_container.querySelector(`#ui-${synth.active_channel}`);
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


    const ui_container = document.getElementById("ui-container");
    ui_container.addEventListener("namechange", () => {
        title.innerText = synth.name;
    });

    const settings = new SettingsUI(ui_container, synth);
    setup_controler();
    setup_channels(ui_container, synth);

    setup_add_new_stage(ui_container, synth);
    setup_meta_module(ui_container, synth);
    // TODO channelize saveload
    setup_save_load(ui_container, synth, settings);
    setup_recording(synth);
}

function loadStaticSynth(canvas, data, cb) {
    const synth = new Synth(canvas)
    synth.run();

    const ui_container = document.createElement('div');
    const ui0 = document.createElement('div');
    ui0.id = "ui-0";
    ui_container.appendChild(ui0);
    // note that meta-modules don't need to be loaded
    loaddata(data.stages, ui_container, synth);
    if (cb) {
        cb(ui_container);
    }

    return synth;
}
