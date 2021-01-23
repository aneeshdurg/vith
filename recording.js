function setup_recording(ui, synth) {
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

    const duration_inp = document.getElementById("record-duration");
    const fps_inp = document.getElementById("record-fps");
    const record_btn = document.getElementById("record");

    const record_status = document.getElementById("recordstatus");
    const record_progress = document.getElementById("recordprogress");
    const record_info = document.getElementById("recordinfo");

    record_btn.addEventListener("click", async () => {
        synth.stop();
        synth.recording = [];
        synth.record_frames = duration_inp.value;
        const fps = fps_inp.value;
        const mspf = 1000 / fps;
        let time = 0;
        record_progress.max = 2.5 * duration_inp.value;
        record_progress.value = 0;
        record_status.style.display = "";
        record_info.innerText = "Recording frames...";
        while (synth.record_frames) {
            synth.render(time);
            time += mspf;
            record_progress.value++;
            console.log(synth.record_frames);
            await new Promise(r => setTimeout(r, 10));
        }

        record_info.innerText = "Exporting...";
        const zip = new JSZip();
        for (let i = 0; i < synth.recording.length; i++) {
            zip.file(`synth-${i}.png`, synth.recording[i].substr("data:image/png;base64,".length), {base64: true});
            record_progress.value++;
        }

        const zipped = await zip.generateAsync({type: "base64"});
        record_info.innerText = "Done!";
        record_progress.value = record_progress.max;

        _download('data:application/zip;base64,' + zipped, 'synth_recording.zip');
        record_status.style.display = "none";

        if (started)
            synth.run();
    });
}
