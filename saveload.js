function loaddata(savedata, ui, synth) {
    // TODO validation
    for (let elem of savedata) {
        if (elem.module) {
            // if (!meta_modules[elem.module.name])
            //     throw new Error("Unexpected module"); // TODO ui for this error
            const count = elem.module.selection.length;
            console.group(`ADD ${elem.module.name}`);
            // TODO take in MetaModuleManager obj or smth
            append_meta_module(elem.module.name, elem.args, count, ui, synth);
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

function load_meta_modules(moduledata_descs) {
    for (let module_name of Object.keys(moduledata_descs)) {
        if (meta_modules[module_name])
            throw new Error("Conflicting module name"); // TODO ui for this error
    }

    for (let module_name of Object.keys(moduledata_descs))
        register_module(module_name, moduledata_descs[module_name]);
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
                load_meta_modules(savedata.modules, ui, synth);
                loaddata(savedata.stages, ui, synth);
            } else { // older version for compat
                loaddata(savedata, ui, synth);
            }
        };
    });
}
