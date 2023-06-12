#!/usr/bin/env python3
import os
import json
import math

module_list = {}
for f in os.listdir():
    if not f.endswith(".frag.c") or f == "template.frag.c":
        continue

    inputs = set()
    with open(f) as fh:
        lines = fh.readlines()

    param_lines = [l for l in lines if l.startswith('uniform')]
    for l in lines:
        cur_pos = 0
        while (n := l.find("INPUT", cur_pos)) > 0:
            cur_pos = n + 1
            c = l[n + len("INPUT")]
            if c == '(':
                inputs.add("INPUT0")
            else:
                inputs.add("INPUT" + c)

    params = []
    for l in param_lines:
        assert "///" in l, f"{f}, {l.strip()}"
        [typedecl, info] = l.split("///")
        [_, type_, name] = typedecl.split()
        name = name.replace("STAGE_", "")
        name = name.replace(";", "")

        true = True
        false = False
        custom_type = info.strip() == "custom"
        param = {
            "name": name,
            "type": type_ if not custom_type else None,
            "info": json.loads(info) if not custom_type else None
        }

        if not custom_type:
            for k, v in param["info"].items():
                if isinstance(v, str):
                    param["info"][k] = eval(v)
        params.append(param)

    module_list[f.split('.')[0]] = {
        "inputs": sorted(list(inputs)),
        "params": params,
        "src": "".join(lines)
    }

with open("module_list.json", "w") as out:
    json.dump({"modules": module_list, "template": open("template.frag.c").read()}, out)
