#!/usr/bin/env python3
import sys

input_file = sys.argv[1]
output_name = sys.argv[2]
with open("build/synth.build.js") as base:
    runner_code = base.read()


header = f"""
const {output_name} = (() => {{
    window.globalprefix = "{output_name}";
"""
footer = """
    window.globalprefix = "";
    return async (canvas, cb) => {
        await loadTwgl();
        return loadStaticSynth(canvas, data, cb);
    };
})();
"""

with open(input_file) as input_:
    savedata = input_.read();
    data = f"const data = {savedata};\n"

with open(f"{output_name}.js", 'w') as output:
    output.write(header)
    output.write(runner_code);
    output.write(data);
    output.write(footer);
