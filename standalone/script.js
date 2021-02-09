const fs = require('fs')
const LZString = require('lz-string');
const PNG = require('pngjs').PNG;
const decode_stego = require('../saveload.js').decode_stego;

const input_file = process.argv[2];
const output_name = process.argv[3];
if (!output_name || !input_file)
    throw new Error("Usage: node standalone/script.js [input_file] [output_name]");

const header = `
const ${output_name} = (() => {
    window.globalsuffix = "${output_name}";
`
const footer = `
    window.globalsuffix = "";
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
            console.log(decode_stego);
             const result = decode_stego(this.data, LZString);
             generate(result);
        });
} else {
    const data = fs.readFileSync(input_file, "utf-8")
    generate(data);
}
