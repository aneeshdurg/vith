class ModuleElement extends SynthStageBase {
    stages = [];
    stageModules = {};

    enable = true;

    get_title() {
        return `Meta-${this.module.name}`;
    }

    setup_synth_state(synth, module) {
        for (let idx of module.selection) {
            const name = synth.stages[idx];
            this.stages.push(name);
            this.stageModules[name] = synth.stageModules[name];
        }

        const counter = globalCounters[this.get_title()] || 0;
        globalCounters[this.get_title()] = counter + 1;
        this.name = `${this.get_title()}-${counter}`;

        let old_name = synth.stages[module.selection[0]];
        synth.stages[module.selection[0]] = this.name;
        delete synth.stageModules[old_name];
        synth.stageModules[this.name] = this;

        console.log("removed stage", old_name, module.selection);

        for (let _i = 1; _i < module.selection.length; _i++) {
            console.log("removing stage", synth.stages[module.selection[1]]);
            synth.remove_stage(synth.stages[module.selection[1]]);
        }
    }

    constructor(synth, module) {
        super(synth, (self_) => {
            self_.module = module;
        });
        this.setup_synth_state(synth, module);
        this.synth_container = document.createElement('div');
        this.container.appendChild(this.synth_container);
    }

    appendChild(child) {
        this.synth_container.appendChild(child);
    }

    toggle_stage(name, state) {
        this.stageModules[name].enable = state;
    }

    // TODO save/load
    save() {
        const saved = [];
        for (let i = 0; i < this.synth_container.children.length; i++)
            saved.push(this.synth_container.children[i].save());
        return {
            title: this.get_title(),
            module: this.module,
            enabled: this.enable_el.checked,
            args: saved,
        }
    }
}
customElements.define('module-element', ModuleElement);

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

function setup_add_new_module(ui, synth) {
    const add_new_select = document.getElementById("add_new_select");
    for (let module of Object.keys(MODULE_IDS)) {
        const opt = document.createElement('option');
        opt.innerText = module;
        opt.value = MODULE_IDS[module];
        add_new_select.appendChild(opt);
    }
    document.getElementById("add_new").addEventListener('click', () => {
        const moduleElem = eval(add_new_select.value);
        ui.appendChild(new moduleElem(synth));
    });
}

const meta_modules = { };

class ModuleCreator {
    selection = new Set();

    constructor(modal, synth, resolver) {
        this.container = document.createElement('div');
        this.container.className = "functiongen";
        this.container.style['text-align'] = "left";

        const header = document.createElement('h1');
        header.innerText = "Module Creator";
        const subheading = document.createElement('h3');
        subheading.innerText = "Select consecutive modules to create a meta module";
        this.container.appendChild(header);
        this.container.appendChild(subheading);
        this.container.appendChild(document.createElement('hr'));
        this.container.appendChild(document.createElement('br'));

        this.error = document.createElement('p');
        this.error.className = 'errors';

        const name_label = document.createElement("label");
        name_label.for = "module-name";
        name_label.innerText = "Name of module: ";
        const name = document.createElement("input");
        name.id = "module-name";
        this.container.appendChild(name_label);
        this.container.appendChild(name);
        this.container.appendChild(document.createElement("br"));

        if (synth.stages.length == 0) {
            this.error.innerText = "No stages in synth! Please add some modules before creating a new module.";
        } else {
            const selection_container = document.createElement('div');
            selection_container.className = 'create-module-selection';
            for (let i = 0; i < synth.stages.length; i++) {
                const stage = synth.stages[i];
                const label = document.createElement('label');
                label.for = stage;
                label.innerText = stage;
                const option = document.createElement('input');
                option.type = 'checkbox';
                option.id = stage;
                option.addEventListener('change', () => {
                    this.selected(stage, i, option.checked);
                });

                selection_container.appendChild(label);
                selection_container.appendChild(option);
                selection_container.appendChild(document.createElement('br'));
            }

            this.container.appendChild(selection_container);
        }

        this.save = document.createElement('button');
        this.save.innerText = "Save";
        this.save.style.display = "";
        this.save.addEventListener("click", () => {
            if (name.value === "") {
                this.error.innerText = "Please enter a valid name!";
            } else if (meta_modules[name.value] === "") {
                this.error.innerText = "That name is already taken!";
            } else {
                const selection = Array.from(this.selection);
                selection.sort((x, y) => x - y);
                resolver({
                    name: name.value,
                    selection: selection
                });
            }
        });

        const cancel = document.createElement('button');
        cancel.innerText = "Cancel";
        cancel.addEventListener("click", () => {
            resolver();
        });
        this.container.appendChild(document.createElement('br'));
        this.container.appendChild(this.error);
        this.container.appendChild(cancel);
        this.container.appendChild(this.save);
        modal.appendChild(this.container);
    }

    remove() {
        this.container.remove();
    }

    selected(name, id, state) {
        if (state)
            this.selection.add(id);
        else
            this.selection.delete(id);
        console.log(name, id, state);

        this.validate();
    }

    validate() {
        let seen_true = false;
        let expect_absent = false;
        let invalid = false;
        for (let i = 0; i < synth.stages.length; i++) {
            if (this.selection.has(i)) {
                if (expect_absent) {
                    invalid = true;
                    break;
                }
                seen_true = true;
            } else if (seen_true) {
                expect_absent = true;
            }
        }

        if (invalid) {
            this.save.style.display = "none";
            this.error.innerText = "Invalid selection! Must choose consecutive modules"
        } else if (this.selection.size) {
            this.save.style.display = "";
            this.error.innerText = ""
        } else {
            this.save.style.display = "none";
        }
    }
}

function loaddata(savedata, ui, synth) {
    // TODO validation
    for (let elem of savedata) {
        if (elem.module) {
            // if (!meta_modules[elem.module.name])
            //     throw new Error("Unexpected module"); // TODO ui for this error
            console.group(`ADD ${elem.module.name}`);
            loaddata(elem.args, ui, synth);

            // TODO refactor module loading /adding
            const count = elem.module.selection.length;
            elem.module.selection = [...Array(count).keys()].map(x => synth.stages.length - count + x);
            console.log(
                elem.module, synth.stages.length, elem.module.selection);
            add_module(elem.module, ui, synth);
            console.groupEnd(`ADD ${elem.module.name}`);
        } else {
            const moduleElem = eval(elem.title + 'Element');
            const new_elem = new moduleElem(synth);
            ui.appendChild(new_elem);
            new_elem.load(elem);
            console.log('ADD', new_elem.get_title());
        }
    }
}

function register_module(name, module) {
    if (meta_modules[name])
        return;
    meta_modules[name] = module;
    document.getElementById('add-meta-module').style.display = "";
    const new_option = document.createElement('option');
    new_option.innerText = name;
    new_option.value = name;
    document.getElementById('add-meta-select').appendChild(new_option);

}

function loadmodules(moduledata) {
    for (let module_name of Object.keys(moduledata)) {
        if (meta_modules[module_name])
            throw new Error("Conflicting module name"); // TODO ui for this error
    }

    for (let module_name of Object.keys(moduledata))
        register_module(module_name, moduledata[module_name]);
}

function add_module(module, ui, synth) {
    console.log(...synth.stages);
    const synth_module = new ModuleElement(synth, module);
    for (let idx of module.selection)
        ui.children[idx].reparent_to_module(synth_module);

    ui.insertBefore(synth_module, ui.children[module.selection[0]]);
    for (let i = 0; i < module.selection.length; i++) {
        const child = ui.children[module.selection[0] + 1];
        child.remove();
        synth_module.appendChild(child);
    }
    console.log(...synth.stages);
}

function setup_meta_module(ui, synth) {
    const createbtn = document.getElementById("create-module");
    createbtn.addEventListener('click', async () => {
        let resolver = null;
        const p = new Promise(r => { resolver = r; });
        const modal = createModal(resolver);
        const creator = new ModuleCreator(modal, synth, resolver);

        const module = await p;
        creator.remove();
        modal.remove();
        if (!module)
            return;

        const module_initializer = [];
        for (let idx of module.selection) {
            module_initializer.push(ui.children[idx].save());
        }

        register_module(
            module.name,
            {
                init: module_initializer,
                count: module.selection.length
            }
        );

        add_module(module, ui, synth);
        // Create download link for module
    });

    document.getElementById("add-meta").addEventListener("click", () => {
        console.log("onclick");
        const name = document.getElementById('add-meta-select').value;
        const data = meta_modules[name];
        loaddata(data.init, ui, synth);
        console.log(...synth.stages);
        const module = {
            name: name,
            selection: [...Array(data.count).keys()].map(x => synth.stages.length - data.count + x)
        };
        add_module(module, ui, synth);
        console.log(...synth.stages);
    });

    // TODO "delete" module ui
}

function setup_save_load(ui, synth) {
    document.getElementById("save").addEventListener('click', () => {
        const saved = [];
        for (let i = 0; i < ui.children.length; i++) {
            saved.push(ui.children[i].save());
        }

        const saveobj = {
            stages: saved,
            modules: meta_modules,
        };

        const savedata = encodeURI(JSON.stringify(saveobj));
        const downloader = document.createElement('a');
        downloader.setAttribute('href', 'data:text/plain;charset=utf-8,' + savedata);
        downloader.setAttribute('download', 'videoSynth.savedata');
        downloader.style.display = "none";
        document.body.appendChild(downloader);

        downloader.click();

        document.body.removeChild(downloader);
    });

    const loadUpload = document.getElementById("load");
    loadUpload.addEventListener("change", () => {
        let file = loadUpload.files[0];
        let reader = new FileReader();
        console.log(file, reader);
        reader.readAsText(file)
        reader.onloadend = () => {
            const savedata = JSON.parse(reader.result);
            if (savedata.stages) {
                loadmodules(savedata.modules, ui, synth);
                loaddata(savedata.stages, ui, synth);
            } else { // older version for compat
                loaddata(savedata, ui, synth);
            }
        };
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
    setup_add_new_module(ui, synth);
    setup_meta_module(ui, synth);
    setup_save_load(ui, synth);
}
