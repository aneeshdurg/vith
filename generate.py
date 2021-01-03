#!/usr/bin/python3
import glob
import json
import math
import os
import re
import shutil
import textwrap

def setup_build_dir():
    os.makedirs("build", exist_ok=True)
    os.chdir("build")
    for g in glob.glob("*"):
        try:
            os.remove(g)
        except IsADirectoryError:
            shutil.rmtree(g)

    os.chdir("..")

def copy_regular():
    print("Copying regular files")
    for entry in os.listdir('.'):
        if entry in ["build", "modules", "synth.frag.c"]:
            continue

        files = [
            "customui.js",
            "function_generator.js",
            "index.html",
            "synth.js",
            "synth_element_base.js",
            "ui.js",
        ]
        for file_ in files:
            shutil.copy(file_, f"build/{file_}")

def parse(data):
    if isinstance(data, float) or isinstance(data, int):
        return float(data)
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

def validate_info(type_, info):
    if 'start' not in info or 'end' not in info:
        return None

    start = parse(info['start'])
    if start is None:
        print("invalid start", info['start'])
        return None
    end = parse(info['end'])
    if end is None:
        print("invalid end", info['end'])
        return None
    default = parse(info['default'])
    if default is None:
        print("invalid default", info['default'])
        return None

    valid = None
    if type_ == "float":
        valid = lambda b: isinstance(b, float)
    elif type_.startswith('vec'):
        count = int(type_[len('vec'):])
        valid = lambda b: isinstance(b, list) and len(b) == count
    else:
        assert False, "!!!"

    if not valid(start) or not valid(end) or not valid(default):
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
    for line in lines:
        if line.startswith("/// modulefn: "):
            module_name = line.split(':')[1].strip()
        if line.startswith("uniform"):
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
            else:
                assert type_ in ("float", "vec2", "vec3"), error_str
                info = json.loads(info)
                validated_info = validate_info(type_, info)
                assert validated_info, error_str
                print("   ", name, type_, validated_info)
                descriptor[name] = {'type': type_, 'info': validated_info}
    assert module_name, filename
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

    return modules

def generate_initializer(name, arg, parent_class_name):
    if arg['type'] == 'custom':
        return f'{name}: new {parent_class_name}_{name}(this.synth)'

    info = arg['info']

    initalizer_class = {
        'float': 'FloatBar', 'vec2': 'VecEntry', 'vec3': 'VecEntry'
    }
    class_name = initalizer_class[arg['type']]

    initalizer = f"new {class_name}("
    if arg['type'] == 'float':
        initalizer += '[{},{}], {}'.format(
            info['start'], info['end'], info['default']
        )
    else:
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
        for param in modules[module]:
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

        descriptor = modules[module]
        arg_list = [
            generate_initializer(name, descriptor[name], class_name)
            for name in descriptor
        ]
        output.write(textwrap.dedent(
            f'''\
        class {class_name} extends Function {{
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

            get_type() {{
                return {class_name};
            }}

            get_args() {{
                return {{
                    {','.join(arg_list)}
                }}
            }}
        }}
        customElements.define('synth-{class_name.lower()}', {class_name}Element);
        '''
        ))
        module_ids += f'"{human_name}": "{class_name}Element",'

    module_ids += '}\n'
    output.write(module_ids)

setup_build_dir()
copy_regular()
modules = create_fragshader()
with open('build/module_lib.js', 'w') as f:
    create_module_library(modules, f)
