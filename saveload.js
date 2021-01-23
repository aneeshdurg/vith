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

const MAGIC = "SYN".split('').map(x => x.charCodeAt(0));
MAGIC.push(255);
const header_len = MAGIC.length + 4;

function decode_stego(stegodata, LZString) {
    console.log(stegodata);
    // const stegodata = new Uint8Array(reader.result);
    for (let i = 0; i < MAGIC.length; i++) {
        if (stegodata[i] != MAGIC[i]) {
            console.log(stegodata);
            throw new Error("File is not synth data");
        }
    }

    let length = 0;
    for (let i = 2; i >= 0; i--) {
        length *= 256;
        const newdata = stegodata[MAGIC.length + i];
        console.log(length, '*', 256, '+', newdata);
        length += newdata;
    }

    console.log("len", length);
    const data = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        const idx = 4 * i;
        if (i == 0) {
            console.log(stegodata[header_len + idx + 0]);
            console.log(stegodata[header_len + idx + 0] & 0x0f);
            console.log(stegodata[header_len + idx + 1]);
            console.log(stegodata[header_len + idx + 1] & 0x0f);
        }
        const entry = (stegodata[header_len + idx + 0] & 0x0f) * 16 +
                        (stegodata[header_len + idx + 1] & 0x0f);
        data[i] = entry;
    }

    console.log(data);

    const result = LZString.decompressFromUint8Array(data);
    console.log(result);

    return result;
}

function _download(data, filename) {
    const downloader = document.createElement('a');
    downloader.setAttribute('href', data);
    downloader.setAttribute('download', filename);
    downloader.style.display = "none";
    document.body.appendChild(downloader);

    downloader.click();

    document.body.removeChild(downloader);
}

function setup_save_load(ui, synth) {
    // magic + 4 byte length + 1 byte per RGBA values
    // this is because we can't use the A channel because of premultiplied
    // stuff, TODO fix that
    const max_stego_size = Math.min(
        0xffffff,
        (4 * synth.dimensions[0] * synth.dimensions[1] - header_len) / 4);

    document.getElementById("save").addEventListener('click', () => {
        const saved = [];
        for (let i = 0; i < ui.children.length; i++) {
            saved.push(ui.children[i].save());
        }

        const saveobj = {
            stages: saved,
            modules: meta_modules,
        };

        const savestr = JSON.stringify(saveobj);

        const compressed = LZString.compressToUint8Array(savestr)
        console.log(compressed.length);
        console.log(compressed);
        const stego_possible = compressed.length < max_stego_size;
        if (compressed.length <= 0xffffff) {
            const required_px = compressed.length + header_len / 4;
            console.log("req scale factor", required_px / (synth.dimensions[0] * synth.dimensions[1]));
        }
        console.log("sp", stego_possible);
        if (stego_possible) {
            const output_canvas = document.createElement("canvas");
            output_canvas.width = synth.dimensions[0];
            output_canvas.height = synth.dimensions[1];

            const output_ctx = output_canvas.getContext("2d");
            const img = output_ctx.createImageData(...synth.dimensions);
            synth.get_frame_data(img.data);

            for (let i = 0; i < (synth.dimensions[1] / 2); i++) {
                //swap rows i and (synth.dimensions[1] - 1 -i)
                // TODO why is this upside down in the first place?
                const curr_row = 4 * i * synth.dimensions[0];
                const other_row = 4 * (synth.dimensions[1] - 1 - i) * synth.dimensions[0];
                for (let j = 0; j < 4 * synth.dimensions[0]; j++) {
                    const curr_idx = curr_row + j
                    const other_idx = other_row + j
                    const temp = img.data[curr_idx];
                    img.data[curr_idx] = img.data[other_idx];
                    img.data[other_idx] = temp;
                }
            }

            console.log("encoding MAGIC");
            for (let i = 0; i < MAGIC.length; i++)
                img.data[i] = MAGIC[i];

            console.log("encoding len");
            let length = compressed.length;
            for (let i = 0; i < 3; i++) {
                img.data[MAGIC.length + i] = length % 256;
                length = Math.floor(length / 256);
            }


            console.log("encoding data");
            for (let i = 0; i < compressed.length; i++) {
                const idx = i * 4;
                img.data[header_len + idx + 0] &= 0xf0;
                img.data[header_len + idx + 0] += (0xf0 & compressed[i]) / 16;

                img.data[header_len + idx + 1] &= 0xf0;
                img.data[header_len + idx + 1] += 0x0f & compressed[i];
            }

            output_ctx.putImageData(img, 0, 0);
            const out_data = output_ctx.canvas.toDataURL();

            const downloader = document.createElement('a');
            downloader.setAttribute('href', out_data);
            downloader.setAttribute('download', 'synth.savedata.png');
            downloader.style.display = "none";
            document.body.appendChild(downloader);

            downloader.click();

            document.body.removeChild(downloader);
        } else {
            const savedata = encodeURI(savestr);
            _download('data:text/plain;charset=utf-8,' + savedata, 'videoSynth.savedata');
        }
    });

    const loadUpload = document.getElementById("load");
    loadUpload.addEventListener("change", () => {
        let file = loadUpload.files[0];
        let reader = new FileReader();
        console.log(file, reader);
        if (file.name.endsWith(".png")) {
            reader.readAsDataURL(file)
            reader.onloadend = async () => {
                const img = new Image();
                img.src = reader.result;
                await new Promise(r => { img.onload = r; });
                console.log(img);

                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                const ctxdata = ctx.getImageData(0, 0, ...synth.dimensions);
                const stegodata = ctxdata.data;
                const result = decode_stego(stegodata, LZString);

                const savedata = JSON.parse(result);
                load_meta_modules(savedata.modules, ui, synth);
                loaddata(savedata.stages, ui, synth);
            }
        } else {
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
        }
    });
}

try {
    exports.decode_stego = decode_stego;
} catch (e) { }
