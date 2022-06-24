#!/usr/bin/python3
import glob
import json
import math
import os
import re
import shutil
import textwrap

from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Dict, Optional

def setup_build_dir() -> None:
    os.makedirs("build", exist_ok=True)
    os.chdir("build")
    for g in glob.glob("*"):
        try:
            os.remove(g)
        except IsADirectoryError:
            shutil.rmtree(g)

    os.chdir("..")

def copy_regular() -> None:
    print("Copying regular files")
    for entry in os.listdir('.'):
        if entry in ["build", "modules", "synth.frag.c"]:
            continue

        files = glob.glob('*.js') + glob.glob('*.css')
        for file_ in files:
            shutil.copy(file_, f"build/{file_}")
        shutil.copy("webgl-common/common.js", "build/common.js")
        shutil.copy("lz-string/libs/lz-string.min.js", "build/lz-string.min.js")
        shutil.copy("h264-mp4-encoder/web.js", "build/h264-mp4-encoder.web.js")
        shutil.copy("jszip/jszip.min.js", "build/jszip.min.js")

def build_js() -> None:
    with open("build/synth.build.js", "w") as output:
        # TODO parse this from the debug file
        # All js files in the right order excluding entrypoint.js
        files = [
            "twgl-full.min.js",
            "lz-string/libs/lz-string.min.js",
            "build/h264-mp4-encoder.web.js",
            "jszip/jszip.min.js",
            "webgl-common/common.js",
            "build/synth.frag.js",
            "ui.js",
            "customui.js",
            "function_generator.js",
            "synth_element_base.js",
            "build/module_lib.js",
            "custommodule.js",
            "meta_module.js",
            "recording.js",
            "channelui.js",
            "saveload.js",
            "settings.js",
            "synth.js",
        ]

        for file_ in files:
            with open(file_) as input_:
                output.write(f"// ---------- {file_} ----------\n")
                output.write(input_.read())
                output.write(f"// ---------- END {file_} ------\n\n")
        # TODO compress?

def generate_entrypoints() -> None:
    with open("index.html") as index:
        base = index.read();
        with open("head.html") as head:
            with open("build/index.html", "w") as output:
                output.write(head.read() + base)

        with open("head_debug.html") as head:
            with open("build/debug.html", "w") as output:
                output.write(head.read() + base)

def parse(data) -> None:
    if isinstance(data, bool):
        return data
    elif isinstance(data, float) or isinstance(data, int):
        return data
    elif isinstance(data, str):
        try:
            parsed = float(eval(data))
        except:
            return None
        return parsed
    elif isinstance(data, list):
        parsed = [parse(d) for d in data]
        if any([p is None for p in parsed]):
            return None
        return parsed
    return None

@dataclass
class TypeInfo:
    constructor: str
    validator: Callable[..., bool]

type_info: Dict[str, TypeInfo] = {
    'bool': TypeInfo('BoolEntry', lambda b: isinstance(b, bool)),
    'float': TypeInfo(
        'FloatBar',
        lambda b: isinstance(b, float) or isinstance(b, int)
    ),
    'int': TypeInfo('IntEntry', lambda b: isinstance(b, int)),
    'vec2': TypeInfo('VecEntry', lambda b: isinstance(b, list) and len(b) == 2),
    'vec3': TypeInfo('VecEntry', lambda b: isinstance(b, list) and len(b) == 3),
    'channel': TypeInfo('ChannelSelect', lambda _: True),
}

def validate_info(type_: str, info: Dict) -> Optional[Dict]:
    if type_ != "bool":
        if 'start' not in info or 'end' not in info:
            print("no start or end")
            return None

        start = parse(info['start'])
        if start is None:
            print("invalid start", info['start'])
            return None
        end = parse(info['end'])
        if end is None:
            print("invalid end", info['end'])
            return None
    else:
        start = True
        end = False
    default = parse(info['default'])
    if default is None:
        print("invalid default", info['default'])
        return None

    valid = type_info[type_].validator
    if not valid(start) or not valid(end) or not valid(default):
        print("invalid boundries", start, end, default)
        return None

    names = None
    ret = {'start': start, 'end': end, 'default': default}
    if type_.startswith('vec'):
        assert 'names' in info
        ret['names'] = info['names']
    return ret

def process_module(filename, modules, output):
    print("Processing module", filename)
    with open(filename) as f:
        lines = f.readlines()
    descriptor = {}
    module_name = None
    module_tag = None
    for line in lines:
        if line.startswith("/// modulefn: "):
            module_name = line.split(':')[1].strip()
        elif line.startswith("/// moduletag: "):
            module_tag = line.split(':')[1].strip()
        elif line.startswith("uniform"):
            error_str = "Invalid line: {}".format(line)

            line = line.strip().replace(';', '')
            parts = line.split("///")
            assert len(parts) == 2, error_str
            static_parts = list(filter(lambda x: len(x), parts[0].split(" ")))
            name = static_parts[2].replace("u_", "")
            type_ = static_parts[1]

            info = parts[1]
            if "custom" in info:
                print("   ", name, "CUSTOM")
                descriptor[name] = {'type': "custom"}
            elif "none" in info:
                descriptor[name] = {'type': "none"}
            elif "channel" in info:
                print("   ", name, "CHANNEL")
                descriptor[name] = {'type': "channel"}
            else:
                assert type_ in type_info, error_str
                info = json.loads(info)
                validated_info = validate_info(type_, info)
                assert validated_info, error_str
                print("   ", name, type_, validated_info)
                descriptor[name] = {'type': type_, 'info': validated_info}

    assert module_name, filename
    assert module_tag, filename
    descriptor['__module_tag'] = module_tag
    modules[module_name] = descriptor
    output += [line.replace('\n', '') for line in lines] + ['\n']

def create_fragshader():
    output = []
    modules = {}
    done_processing_modules = False

    with open("synth.frag.c") as f:
        fragshader = f.readlines()

    includes = re.compile("^ *#include \"(.*)\"")
    for line in fragshader:
        include_line = includes.search(line)
        if include_line:
            assert not done_processing_modules
            filename = include_line.group(1)
            process_module(filename, modules, output)
        elif 'GENERATE_CASES;' in line:
            done_processing_modules = True
            module_names = sorted(list(modules.keys()))
            cases = ""
            for id_, module in enumerate(module_names):
                cases += textwrap.dedent(
                    f'''\
                case {id_ + 1}:
                    {module}();
                    break;
                '''
                )
            output.append(cases)
        else:
            output.append(line.replace('\n', ''))

    with open("build/synth.frag.c", 'w') as f:
        f.write("\n".join(output))

    with open("build/synth.frag.js", 'w') as output:
        with open("build/synth.frag.c") as input_:
            shader = input_.read()
            output.write("const SYNTHFRAGSHADER = `\n")
            output.write(shader);
            output.write("\n`;\n")

    return modules


def generate_initializer(name, arg, parent_class_name):
    if arg['type'] == 'custom':
        return f'{name}: new {parent_class_name}_{name}(this.synth)'

    if arg['type'] == 'none':
        return ""

    class_name = type_info[arg['type']].constructor
    if arg['type'] == 'channel':
        return f'{name}: new {class_name}(this.synth)'

    info = arg['info']

    initalizer = f"new {class_name}("
    if arg['type'] in ['float', 'int']:
        initalizer += '[{},{}], {}'.format(
            info['start'], info['end'], info['default']
        )
    elif arg['type'] == 'bool':
        initalizer += '{}'.format(json.dumps(info['default']))
    elif 'vec' in arg['type']:
        count = int(arg['type'][len('vec'):])
        names = ','.join(['"{}"'.format(x) for x in info['names']])
        default = ','.join([str(x) for x in info['default']])

        initalizer += f"{count}, "
        initalizer += f"[{names}], "
        initalizer += "["
        for i in range(count):
            initalizer += f"[{info['start'][i]}, {info['end'][i]}],"
        initalizer += "], "
        initalizer += f"[{default}]"
    initalizer += ")"
    return f'{name}: {initalizer}'

def create_module_library(modules, output):
    module_names = sorted(list(modules.keys()))
    module_ids = "const MODULE_IDS = {"

    for id_, module in enumerate(module_names):
        initalizer = ""
        args = ""
        descriptor = modules[module]
        for param in descriptor:
            if param != '__module_tag':
                initalizer += f'this.params.{param} = {param};\n'
                args += f'{param}, '

        class_name = ''
        uppercase_next = True
        for c in module:
            if c == '_':
                uppercase_next = True
            elif uppercase_next:
                class_name += c.upper()
                uppercase_next = False
            else:
                class_name += c
        human_name = module.replace('_', ' ')

        arg_list = [
            generate_initializer(name, descriptor[name], class_name)
            for name in descriptor if name != '__module_tag'
        ]
        arg_list = [arg for arg in arg_list if arg != ""]
        output.write(textwrap.dedent(
            f'''\
        class {class_name} extends SynthFunction {{
            id = {id_ + 1}
            params = {{}}

            constructor({args}feedback) {{
                super(feedback || 0);
                {initalizer}
            }}
        }}

        class {class_name}Element extends SynthElementBase {{
            get_title() {{
                return "{class_name}";
            }}

            get_fn() {{
                return {class_name};
            }}

            get_args() {{
                return {{
                    {', '.join(arg_list)}
                }}
            }}
        }}
        defineEl('synth-{class_name.lower()}', {class_name}Element);
        '''
        ))

        tag = descriptor['__module_tag']
        module_ids +=\
            f'"{human_name}": {{class: "{class_name}Element", tag: "{tag}"}},'

    module_ids += '}\n'
    output.write(module_ids)

setup_build_dir()
copy_regular()
generate_entrypoints()
modules = create_fragshader()
with open('build/module_lib.js', 'w') as f:
    create_module_library(modules, f)
build_js()
