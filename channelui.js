function setup_channels(ui_container, synth) {
    const chan_select = document.getElementById("channel-select");
    const render_select = document.getElementById("channel-render");

    chan_select.addEventListener("change", () => {
        const curr_ui = ui_container.querySelector(`#ui-${synth.active_channel}`);
        curr_ui.style.display = "none";

        synth.active_channel = parseInt(chan_select.value);

        const new_ui = ui_container.querySelector(`#ui-${synth.active_channel}`);
        new_ui.style.display = "";
    });
    chan_select.value = "0";

    render_select.addEventListener("change", () => {
        synth.render_channel = parseInt(render_select.value);
    });
    render_select.value = "0";

    const add_new_chan_option = () => {
        const new_chan = synth.channels.length - 1;
        add_new_channel_ui(ui_container, new_chan);
        const new_opt = document.createElement('option');
        new_opt.innerText = new_chan;
        new_opt.value = new_chan;

        chan_select.appendChild(new_opt);
        chan_select.value = new_chan;

        chan_select.dispatchEvent(new Event("change"));

        console.log("Appending to render_select", new_chan);
        const new_opt_1 = document.createElement('option');
        new_opt_1.innerText = new_chan;
        new_opt_1.value = new_chan;
        render_select.appendChild(new_opt_1);
        render_select.value = new_chan;

        render_select.dispatchEvent(new Event("change"));
    }

    const add_chan_btn = document.getElementById("channel-add");
    add_chan_btn.addEventListener("click", () => {
        synth.add_channel();
        add_new_chan_option();
    });

    ui_container.addEventListener("add_channel", add_new_chan_option);
}
