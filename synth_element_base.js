const globalCounters = {};

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
        this.synth = synth;

        const shadow = this.attachShadow({mode: 'open'});
        const args = this.get_args();
        this.args = args;

        const box = document.createElement('div');
        box.style = "border: solid 1px; padding: 0.5em";
        const title = document.createElement('h2')
        title.innerText = this.get_title();
        box.appendChild(title);

        const enable_label = document.createElement('label');
        enable_label.for = "enable";
        enable_label.innerText = "Enable: ";
        this.enable = document.createElement('input');
        this.enable.id = "enable";
        this.enable.type = 'checkbox';
        this.enable.checked = true;

        box.appendChild(enable_label);
        box.appendChild(this.enable);

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
            el.style = "padding-left: 2em;";

            el.appendChild(type);
            type.addEventListener('change', () => {
                if (type.customonchange) {
                    type.customonchange(this);
                } else {
                    this.onchange(arg, type.value);
                }
            });

            container.appendChild(document.createElement('br'));
        };

        for (let arg of Object.keys(args)) {
            params.push(args[arg].defaultValue);
            createElement(arg, args[arg]);
        }
        this.feedback_el = new FloatBar([0, 10], 1);
        createElement('feedback', this.feedback_el);

        shadow.appendChild(box);

        const counter = globalCounters[this.get_title()] || 0;
        globalCounters[this.get_title()] = counter + 1;
        this.name = `${this.get_title()}-${counter}`;

        const constructor = this.get_type();
        synth.add_stage(this.name, new constructor(...params, 1));

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

            for (let arg of Object.keys(args))
                args[arg].generate = false;
            this.feedback_el.generate = false;
        });

        this.enable.addEventListener('change', () => {
            this.synth.toggle_stage(this.name, this.enable.checked);
        });
    }

    onchange(arg, val) {
        if (arg === "feedback")
            this.synth.stageModules[this.name].feedback = val;
        else
            this.synth.stageModules[this.name].params[arg] = val;
    }

    save() {
        const saved_args = {};
        for (let arg of Object.keys(this.args)) {
            saved_args[arg] = this.args[arg].save();
        }
        saved_args.feedback = this.feedback_el.save();

        return {
            title: this.get_title(),
            enabled: this.enable.checked,
            args: saved_args
        }
    }

    load(data) {
        this.enable.checked = data.enabled;
        for (let arg of Object.keys(this.args)) {
            console.log("Loading", arg, data.args[arg]);
            this.args[arg].load(data.args[arg]);
        }

        console.log("Loading feedback", data.args.feedback);
        this.feedback_el.load(data.args.feedback);
    }
}
