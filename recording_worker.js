const queue = [];

async function processQueue(dimensions) {
  console.log("Initializing encoder with dimensions", dimensions);
  const encoder = await HME.createH264MP4Encoder()
  // TODO enforce even width/height
  encoder.width = dimensions[0];
  encoder.height = dimensions[1];

  encoder.initialize();

  let frame = 0;

  function processInner() {
    if (queue.length > 0) {
      const msg = queue.shift();
      const data = new Uint8Array(msg);
      if (data.length == 0) {
        encoder.finalize();
        const data = encoder.FS.readFile(encoder.outputFilename);
        postMessage(data.buffer);
        return;
      } else {
        encoder.addFrameRgba(data);
        if (frame % 10 == 0) {
          console.log("Processed", frame, "frames");
        }
        frame++;
      }
    }
    setTimeout(processInner, 0);
  }
  processInner();
}

self.addEventListener('message', function(e) {
  if (!(e.data instanceof ArrayBuffer)) {
    setTimeout(() => {
      processQueue(e.data);
    }, 0);
  } else {
    queue.push(e.data);
  }
}, false);
