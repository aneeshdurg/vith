class Picture_picture_texture extends Type {
    validate() {
        return true;
    }

    customonchange(element) {
        this.synth.stageModules[element.name].params['picture_texture'] = this.tex;
        this.synth.stageModules[element.name].params['picture_dimensions'] = this.dimensions;

        element.args.picture_dimensions.set_value(this.dimensions);
    }

    imgload() {
        this.dimensions = [this.img.width, this.img.height];
        this.tex = createTexture(this.synth.gl, this.dimensions, this.img)
        this.dispatchEvent(new Event('change'));
    }

    constructor(synth) {
        const img = new Image();
        const tex = createTexture(synth.gl, synth.dimensions);
        super(undefined, tex);

        this.tex = tex;
        this.synth = synth;
        this.dimensions = [...synth.dimensions];
        this.img = img;
        this.img.addEventListener('load', () => { this.imgload(); });

        this.el = document.createElement("div");

        this.fileSelect = document.createElement("input");
        this.fileSelect.type = "file";
        this.fileSelect.accept = "image/*";
        this.fileSelect.addEventListener("change", this.uploadImage.bind(this));
        this.el.appendChild(this.fileSelect);

        this.shadow.appendChild(this.el);
    }

    uploadImage() {
        let file = this.fileSelect.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file)
        reader.onloadend = () => {
            this.img.src = reader.result;
        };
    }

    save() {
        return this.img.src;
    }

    load(data) {
        this.img.src = data;
    }
}
customElements.define('picture-picture-texture', Picture_picture_texture);

class Picture_picture_dimensions extends Type {
    validate() {
        return true;
    }

    constructor(synth) {
        super(undefined, [0, 0]);
        this.data = document.createElement('code');
        this.data.style = 'border: solid 1px; padding: 2px';
        this.data.innerText = synth.dimensions;
        this.shadow.appendChild(this.data);
    }

    set_value(value) {
        this.data.innerText = value;
    }

    save() {
        return undefined;
    }
}
customElements.define('picture-picture-dimensions', Picture_picture_dimensions);

class Webcam_webcam_texture extends Type {
    customonchange(element) {
        this.synth.stageModules[element.name].params['webcam_texture'] = this.tex;
        this.synth.stageModules[element.name].params['webcam_dimensions'] = this.dimensions;

        element.args.webcam_dimensions.set_value(this.dimensions);
    }

    constructor(synth) {
        const tex = createTexture(synth.gl, synth.dimensions);
        super(undefined, tex);

        this.tex = tex;
        this.synth = synth;
        this.dimensions = synth.dimensions;
        this.setup();
    }

    async setup() {
        this.video = document.createElement("video");

        let devices = undefined;
        try {
            devices = await navigator.mediaDevices.enumerateDevices();
        } catch (err) {
            alert("Error initializing webcam!");
            throw err;
        }

        devices = devices.filter(d => d.kind === "videoinput");

        this.container = document.createElement("div");

        this.container.innerHTML = `<label for="webcamSelector">Choose a webcam: </label>`
        const selector = document.createElement("select");
        selector.id = "webcamSelector";
        this.container.appendChild(selector);

        devices.forEach(device => {
            const entry = document.createElement("option");
            entry.value = device.deviceId;
            entry.innerHTML = device.label || device.deviceId.substr(0, 10);
            selector.appendChild(entry)
        });

        this.needsUpdate = false;
        const selectVideo = async () => {
            const deviceId = selector.value;

            const constraints = {
                video: { deviceId: deviceId }
            }

            try {
                if (this.video.srcObject) {
                    const stream = this.video.srcObject;
                    stream.getTracks().forEach(function(track) {
                        track.stop();
                    });
                    this.video.srcObject = null;
                }

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                this.video.srcObject = stream;
                this.video.play();
                this.needsUpdate = true;
            } catch (err) {
                alert("Error initializing webcam! " + err);
                console.log(err);
            }
        }
        selector.onchange = selectVideo;
        selectVideo();

        this.generate = true;
        let f = () => {
            if (!this.video.paused && !this.video.ended) {
                const dimensions = [this.video.videoWidth, this.video.videoHeight];
                if (dimensions[0] && dimensions[1]) {
                    if (this.needsUpdate) {
                        this.dimensions = [this.video.videoWidth, this.video.videoHeight];
                        console.log("UPDATE", this.dimensions, this.video);
                        this.tex = createTexture(this.synth.gl, this.dimensions);
                    }
                    updateTexture(this.synth.gl, this.dimensions, this.tex, this.video);
                    if (this.needsUpdate) {
                        this.needsUpdate = false;
                        this.dispatchEvent(new Event('change'));
                    }
                }
            }

            if (this.generate)
                requestAnimationFrame(f);
        };
        f();

        this.shadow.appendChild(this.container);
    }

    save() {
        return undefined;
    }
}
customElements.define('webcam-webcam-texture', Webcam_webcam_texture);

class Webcam_webcam_dimensions extends Picture_picture_dimensions { }
customElements.define('webcam-webcam-dimensions', Webcam_webcam_dimensions);

class ReduceColors_reduce_colors_data extends Type {
    customonchange(element) {
        try {
            this.synth.stageModules[element.name].params['reduce_colors_data'] = this.tex;
            this.synth.stageModules[element.name].params['reduce_colors_count'] = this.count;
        } catch (e) {
            console.log("!!!", ...this.synth.stages);
            // TODO custom elements break with meta modules
        }

        element.args.reduce_colors_count.set_value(this.dimensions);
    }

    constructor(synth) {
        const limit = 256;
        const img = new Image();
        const tex = createTexture(synth.gl, [256, 1]);
        super(undefined, tex);

        this.tex = tex;
        this.synth = synth;

        // we waste 1 float for the alpha channel - TODO
        this.data = new Float32Array(4 * 256);
        // this.count = 100;
        this.count = 100;
        this.generate_colors();

        updateTexture(synth.gl, [256, 1], this.tex, this.data);

        this.el = document.createElement("div");
        const btn = document.createElement("button");
        btn.addEventListener('click', () => {
            this.generate_colors();
            this.dispatchEvent(new Event('change'));
        });
        btn.innerText = "Re-pick colors";
        this.el.appendChild(btn);

        this.el.appendChild(document.createElement('br'));
        const label = document.createElement("label");
        label.innerText = "Number of colors: ";
        label.for = "num_colors";
        const input = new IntEntry([1, 256], 100);
        input.id = "num_colors";
        input.addEventListener('change', () => { this.set_count(input.value); });
        this.el.appendChild(label);
        this.el.appendChild(input);

        this.shadow.appendChild(this.el);
    }

    set_count(value) {
        this.count = value;
        this.generate_colors();
        // console.log("New count", input.value);
        this.dispatchEvent(new Event('change'));

    }

    generate_colors() {
        // console.log("Regenerating", this.count);
        for (let i = 0; i < 4 * this.count; i++)
            this.data[i] = Math.random();
        updateTexture(this.synth.gl, [256, 1], this.tex, this.data);
    }

    save() {
        const data = [];
        for (let i = 0; i < this.count; i++)
            data.push(this.data[i])
        return [...data];
    }

    load(data) {
        for (let i = 0; i < data.length; i++)
            this.data[i] = data[i];
        this.count = data.length / 4;
        updateTexture(this.synth.gl, [256, 1], this.tex, this.data);
        this.dispatchEvent(new Event('change'));
    }
}
customElements.define('reducecolors-reduce-colors-data', ReduceColors_reduce_colors_data);

class ReduceColors_reduce_colors_count extends Type {
    constructor(synth) {
        super(undefined, 100);
        this.data = document.createElement('code');
        this.data.style = 'border: solid 1px; padding: 2px';
        this.data.innerText = 100;
        this.shadow.appendChild(this.data);
    }

    set_value(value) {
        this.data.innerText = value;
    }

    save() {
        return undefined;
    }
}
customElements.define('reducecolors-reduce-colors-count', ReduceColors_reduce_colors_count);
