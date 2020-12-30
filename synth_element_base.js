class SynthElementBase extends HTMLElement {
    get_title() {
        return "";
    }

    get_args() {
        //returns a map of str -> Type
        return {};
    }

    get_type() {
        return Type;
    }

    get_feedback() {
        return 0;
    }

    constructor(synth) {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const args = this.get_args();
        const box = document.createElement('div');
        box.style = "border: solid 1px; padding: 0.5em";
        const title = document.createElement('h2')
        title.innerText = this.get_title();
        box.appendChild(title);

        const enable_label = document.createElement('label');
        enable_label.for = "enable";
        enable_label.innerText = "Enable: ";
        const enable = document.createElement('input');
        enable.id = "enable";
        enable.type = 'checkbox';
        enable.checked = true;

        box.appendChild(enable_label);
        box.appendChild(enable);

        const container = document.createElement('div');
        container.style.display = "none";
        box.appendChild(container);

        this.container_visible = false;
        title.onclick = () => {
            if (this.container_visible) {
                container.style.display = "none";
            } else {
                container.style.display = "";
            }

            this.container_visible = !this.container_visible;
        }

        const moveup = document.createElement('button');
        moveup.innerText = 'Move up';
        container.appendChild(moveup);

        const movedn = document.createElement('button');
        movedn.innerText = 'Move down';
        container.appendChild(movedn);

        const remove = document.createElement('button');
        remove.innerText = 'Remove';
        container.appendChild(remove);

        container.appendChild(document.createElement('br'));

        const params = [];
        const createElement = (arg, type) => {
            const label = document.createElement('label');
            container.appendChild(label);
            label.for = arg;
            label.innerText = `${arg}: `;

            const el = document.createElement('div');
            container.appendChild(el);
            el.id = arg;
            el.style = "display: inline;";

            el.appendChild(type);
            type.addEventListener('change', () => {
                this.onchange(arg, type.value);
            });

            container.appendChild(document.createElement('br'));
        };

        for (let arg of Object.keys(args)) {
            params.push(args[arg].defaultValue);
            createElement(arg, args[arg]);
        }
        createElement('feedback', new FloatBar([0, 10], 1));

        shadow.appendChild(box);

        const counter = globalCounters[this.get_title()] || 0;
        globalCounters[this.get_title()] = counter + 1;
        this.name = `${this.get_title()}-${counter}`;

        const constructor = this.get_type();
        synth.add_stage(this.name, new constructor(...params, 1));

        this.synth = synth;

        moveup.addEventListener('click', () => {
            const idx = this.synth.stages.indexOf(this.name);
            if (idx != 0) {
                const other = this.synth.stages[idx - 1];
                this.synth.stages[idx] = other;
                this.synth.stages[idx - 1] = this.name;
                const parentEl =this.parentElement;
                this.remove();
                parentEl.insertBefore(this, parentEl.childNodes[idx - 1]);
            }
        });

        movedn.addEventListener('click', () => {
            const idx = this.synth.stages.indexOf(this.name);
            if (idx != (this.synth.stages.length - 1)) {
                const other = this.synth.stages[idx + 1];
                this.synth.stages[idx] = other;
                this.synth.stages[idx + 1] = this.name;

                const parentEl =this.parentElement;
                this.remove();
                parentEl.insertBefore(this, parentEl.childNodes[idx + 1]);
            }
        });

        remove.addEventListener('click', () => {
            this.synth.remove_stage(this.name);
            this.remove();
        });

        enable.addEventListener('change', () => {
            this.synth.toggle_stage(this.name, enable.checked);
        });
    }

    onchange(arg, val) {
        if (arg === "feedback")
            this.synth.stageModules[this.name].feedback = val;
        else
            this.synth.stageModules[this.name].params[arg] = val;
    }
}
