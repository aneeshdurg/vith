class SettingsUI {
    constructor(ui, synth) {
        this.name_inp = document.getElementById("name");
        this.clock_inp = document.getElementById("clock_speed");
        const autosave_btn = document.getElementById("autosave_enable");
        const autosave_opts = document.getElementById("autosave_opts");

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
