function setup_settings(ui, synth) {
    const name_inp = document.getElementById("name");
    const autosave_btn = document.getElementById("autosave_enable");
    const autosave_opts = document.getElementById("autosave_opts");

    name_inp.addEventListener("change", () => {
        synth.name = name_inp.value;
        ui.dispatchEvent(new Event("namechange"));
    });


    ui.addEventListener("namechange", () => {
        name_inp.value = synth.name;
    });
}
