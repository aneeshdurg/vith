const fs = require('fs')
const LZString = require('lz-string');
const PNG = require('pngjs').PNG;

const input_file = process.argv[2];
const output_name = process.argv[3];
if (!output_name || !input_file)
    throw new Error("Usage: node standalone/script.js [input_file] [output_name]");

const header = `
const ${output_name} = (() => {
    window.globalprefix = "${output_name}";
`
const footer = `
    window.globalprefix = "";
    return async (canvas, cb) => {
        await loadTwgl();
        return loadStaticSynth(canvas, data, cb);
    };
})();
`

const runner_code = fs.readFileSync("build/synth.build.js", "utf-8")

function generate(data) {
    const data_decl = `const data = ${data};\n`;
    const generated = header + runner_code + data_decl + footer;
    const out_file = `${output_name}.js`;
    console.log("Writing to", out_file);
    fs.writeFileSync(out_file, generated);
}

// TODO dedup this and the loading code
const MAGIC = "SYN".split('').map(x => x.charCodeAt(0));
MAGIC.push(255);
const header_len = MAGIC.length + 4;
if (input_file.endsWith(".png")) {
    fs.createReadStream(input_file)
        .pipe(new PNG())
        .on("parsed", function () {
             for (let i = 0; i < MAGIC.length; i++) {
               if (this.data[i] != MAGIC[i])
                     throw new Error("File was not a valid savedata");
             }

             let length = 0;
             for (let i = 2; i >= 0; i--) {
                 length *= 256;
                 const newdata = this.data[MAGIC.length + i];
                 console.log(length, '*', 256, '+', newdata);
                 length += newdata;
             }

             console.log("len", length);
             const data = new Uint8Array(length);
             for (let i = 0; i < length; i++) {
                 const idx = 4 * i;
                 if (i == 0) {
                     console.log(this.data[header_len + idx + 0]);
                     console.log(this.data[header_len + idx + 0] & 0x0f);
                     console.log(this.data[header_len + idx + 1]);
                     console.log(this.data[header_len + idx + 1] & 0x0f);
                 }
                 const entry = (this.data[header_len + idx + 0] & 0x0f) * 16 +
                                 (this.data[header_len + idx + 1] & 0x0f);
                 data[i] = entry;
             }

             console.log(data);

             const result = LZString.decompressFromUint8Array(data);
             generate(result);
        });
} else {
    const data = fs.readFileSync(input_file, "utf-8")
    generate(data);
}
