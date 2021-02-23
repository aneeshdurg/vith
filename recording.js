function setup_recording(synth) {
    const start_btn = document.getElementById("startstop");
    let started = true;
    start_btn.addEventListener("click", () => {
        if (started) {
            synth.stop();
            start_btn.innerText = "Start";
            started = false;
        } else {
            synth.run();
            start_btn.innerText = "Stop";
            started = true;
        }
    });

    const screenshot = document.getElementById("screenshot").addEventListener("click", () => {
        synth.canvas.toDataURL()
        _download(synth.canvas.toDataURL(), 'synth_screenshot.png');
    });

    const frame_fps_inp = document.getElementById("render-fps");
    const frame_inp = document.getElementById("render-frame");
    const render_specific = document.getElementById("render-specific");
    const render_next = document.getElementById("render-next");
    render_specific.addEventListener("click", async () => {
        synth.stop();
        start_btn.innerText = "Start";
        started = false;
        await new Promise(r => setTimeout(r, 100));
        const mspf = 1000 / frame_fps_inp.value;
        const frame_time = frame_inp.value * mspf;
        synth.render(frame_time);
    });
    render_next.addEventListener("click", async () => {
        console.log(frame_inp);
        frame_inp.value = Number(frame_inp.value) + 1;
        render_specific.dispatchEvent(new Event("click"));
    });

    const record_start_inp = document.getElementById("record-start");
    const duration_inp = document.getElementById("record-duration");
    const fps_inp = document.getElementById("record-fps");
    const record_btn_zip = document.getElementById("record");
    const record_btn_mp4 = document.getElementById("record-mp4");

    const record_status = document.getElementById("recordstatus");
    const record_progress = document.getElementById("recordprogress");
    const record_info = document.getElementById("recordinfo");

    const do_record = async (ext, get_context, add_to_context, export_context) => {
        synth.stop();
        const recording = [];
        let record_frames = duration_inp.value;
        const fps = fps_inp.value;
        const mspf = 1000 / fps;
        let time = record_start_inp.value * mspf;
        record_progress.max = 2.5 * duration_inp.value;
        record_progress.value = 0;
        record_status.style.display = "";
        record_info.innerText = "Recording frames...";

        const context = await get_context();
        for (let i = 0; i < record_frames; i++) {
            synth.render(time);
            time += mspf;
            record_progress.value++;
            add_to_context(context, synth, i);
            record_progress.value++;
            await new Promise(r => setTimeout(r, 10));
        }

        record_info.innerText = "Exporting...";
        const exported = await export_context(context);
        record_info.innerText = "Done!";
        record_progress.value = record_progress.max;

        const name = synth.name || 'recording';
        _download(exported, `${name}.${ext}`);
        record_status.style.display = "none";

        // TODO re-download button

        if (started)
            synth.run();
    };

    record_btn_zip.addEventListener("click", async () => {
        await do_record(
            "zip",
            () => new JSZip(),
            (zip, synth, i) => {
                zip.file(`recording-${i}.png`, synth.get_url().substr("data:image/png;base64,".length), {base64: true});
            },
            async (zip) => URL.createObjectURL(await zip.generateAsync({type: "blob"})),
        );
    });

    record_btn_mp4.addEventListener("click", async () => {
        await do_record(
            "mp4",
            async () => {
                const encoder = await HME.createH264MP4Encoder()
                // TODO enforce even width/height
                encoder.width = synth.dimensions[0];
                encoder.height = synth.dimensions[1];
                encoder.initialize();
                return encoder;
            },
            (encoder, synth, _i) => {
                encoder.addFrameRgba(synth.get_img_data());
            },
            async (encoder) => {
                encoder.finalize();
                const data = encoder.FS.readFile(encoder.outputFilename);
                const blob = new Blob([data], { type: 'octet/stream' });
                return window.URL.createObjectURL(blob);
            },
        );
    });
}
