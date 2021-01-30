class SettingsUI {
    constructor(ui, synth) {
        this.name_inp = document.getElementById("name");
        this.clock_inp = document.getElementById("clock_speed");
        // const autosave_btn = document.getElementById("autosave_enable");
        // const autosave_opts = document.getElementById("autosave_opts");

        this.name_inp.addEventListener("change", () => {
            synth.name = this.name_inp.value;
            ui.dispatchEvent(new Event("namechange"));
        });

        ui.addEventListener("namechange", () => {
            this.name_inp.value = synth.name;
        });

        this.clock_inp.addEventListener("change", () => {
            synth.clock_speed = this.clock_inp.value;
        });

        // this.auto_dims_btn = document.getElementById("auto_dims_enable");
        this.render_width_inp = document.getElementById("render_width");
        this.render_height_inp = document.getElementById("render_height");
        // this.render_dims = document.getElementById("render_dims");
        // this.target_fps_container = document.getElementById("target_fps_container");
        // this.target_fps = document.getElementById("target_fps");
        // this.target_fps.value = synth.target_fps;
        // this.auto_dims_btn.addEventListener("change", () => {
        //     if (this.auto_dims_btn.checked) {
        //         this.target_fps_container.style.display = "";
        //         this.render_dims.style.display = "none";
        //         synth.begin_auto_scale();
        //     } else {
        //         synth.stop_auto_scale();
        //         this.target_fps_container.style.display = "none";
        //         this.render_dims.style.display = "";
        //         this.render_width_inp.value = synth.dimensions[0];
        //         this.render_height_inp.value = synth.dimensions[1];
        //     }
        // });
        // TODO add to save/load
        // TODO allow picture/webcam to resize canvas with an option
        this.render_height_inp.addEventListener("change", () => {
            synth.resize([synth.dimensions[0], Math.floor(this.render_height_inp.value)]);
        });
        this.render_width_inp.addEventListener("change", () => {
            synth.resize([Math.floor(this.render_width_inp.value), synth.dimensions[1]]);
        });


        // TODO autosave to localstorage
    }

    save() {
        return {
            name: this.name_inp.value,
            clock: this.clock_inp.value,
        };
    }

    load(data) {
        this.name_inp.value = data.name || this.name_inp.value;
        this.name_inp.dispatchEvent(new Event("change"));
        this.clock_inp.value = data.clock || 1;
        this.clock_inp.dispatchEvent(new Event("change"));
    }
}
