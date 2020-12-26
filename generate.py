#!/usr/bin/python3
import glob
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

        shutil.copy("index.html", "build/index.html")
        shutil.copy("synth.js", "build/synth.js")

def process_module(filename, modules, output):
    print("Processing module", filename)
    with open(filename) as f:
        lines = f.readlines()
    descriptor = {}
    name = None
    for line in lines:
        if line.startswith("/// modulefn: "):
            name = line.split(':')[1].strip()
        if line.startswith("uniform"):
            line = line.strip().replace(';', '')
            print("   ", line)
            parts = line.split(" ")
            # TODO search for doc comment
            descriptor[parts[2]] = parts[1].strip()
    assert name, filename
    modules[name] = descriptor
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

def create_module_library(modules, output):
    module_names = sorted(list(modules.keys()))
    module_ids = "const MODULE_IDS = {"

    for id_, module in enumerate(module_names):
        initalizer = ""
        args = ""
        for param in modules[module]:
            param = param[2:]
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
        module_ids += f'module: {{ class: {class_name} }},'

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
        '''
        ))

    module_ids += '}\n'
    output.write(module_ids)

setup_build_dir()
copy_regular()
modules = create_fragshader()
with open('build/module_lib.js', 'w') as f:
    create_module_library(modules, f)
