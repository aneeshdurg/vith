const globalCounters = {};

class SynthStageBase extends HTMLElement {
    get_title() {
        return "";
    }

    constructor(synth, pre_setup) {
        super();
        if (pre_setup)
            pre_setup(this);

        this.synth = synth;

        const shadow = this.attachShadow({mode: 'open'});
        this.shadow = shadow;

        const box = document.createElement('div');
        box.style = "border: solid 1px; padding: 0.5em; border-radius: 25px";
        const title = document.createElement('h2')
        title.innerText = this.get_title();
        box.appendChild(title);

        const enable_label = document.createElement('label');
        enable_label.for = "enable";
        enable_label.innerText = "Enable: ";
        this.enable_el = document.createElement('input');
        this.enable_el.id = "enable";
        this.enable_el.type = 'checkbox';
        this.enable_el.checked = true;

        box.appendChild(enable_label);
        box.appendChild(this.enable_el);

        const container = document.createElement('div');
        container.style.display = "none";
        this.container = container;
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

        this.remove_btn = document.createElement('button');
        this.remove_btn.innerText = 'Remove';
        container.appendChild(this.remove_btn);

        container.appendChild(document.createElement('br'));


        shadow.appendChild(box);

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

        this.remove_btn.addEventListener('click', () => {
            this.synth.remove_stage(this.name);
            this.remove();

            for (let arg of Object.keys(args))
                args[arg].generate = false;
            this.feedback_el.generate = false;
        });

        this.enable_el.addEventListener('change', () => {
            this.synth.toggle_stage(this.name, this.enable_el.checked);
            this.synth.toggle_stage(this.name, this.enable_el.checked);
        });
    }

    reparent_to_module(module) {
        this.remove_btn.style.display = "none";
        this.synth = module;
        // this.parentElement = module;
    }
}

class SynthElementBase extends SynthStageBase {
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
        super(synth);
        const args = this.get_args();
        this.args = args;

        const params = [];
        const createElement = (arg, type) => {
            const label = document.createElement('label');
            this.container.appendChild(label);
            label.for = arg;
            label.innerText = `${arg}: `;

            const el = document.createElement('div');
            this.container.appendChild(el);
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

            this.container.appendChild(document.createElement('br'));
        };

        this.constrain_el = new BoolEntry(false);
        createElement('constrain to transform', this.constrain_el);
        for (let arg of Object.keys(args)) {
            params.push(args[arg].defaultValue);
            createElement(arg, args[arg]);
        }
        this.feedback_el = new FloatBar([0, 10], 1);
        createElement('feedback', this.feedback_el);

        const counter = globalCounters[this.get_title()] || 0;
        globalCounters[this.get_title()] = counter + 1;
        this.name = `${this.get_title()}-${counter}`;

        synth.add_stage(this.name, this.build_stage(params));

    }

    build_stage(params) {
        const constructor = this.get_type();
        return new constructor(...params, 1);
    }

    onchange(arg, val) {
        if (arg === "feedback")
            this.synth.stageModules[this.name].feedback = val;
        else if (arg === "constrain to transform")
            this.synth.stageModules[this.name].constrain = val;
        else
            this.synth.stageModules[this.name].params[arg] = val;
    }

    save() {
        const saved_args = {};
        for (let arg of Object.keys(this.args)) {
            saved_args[arg] = this.args[arg].save();
        }
        saved_args.feedback = this.feedback_el.save();
        saved_args.constrain = this.constrain_el.save();

        return {
            title: this.get_title(),
            enabled: this.enable_el.checked,
            args: saved_args
        }
    }

    load(data) {
        this.enable_el.checked = data.enabled;
        for (let arg of Object.keys(this.args)) {
            // console.log("Loading", arg, data.args[arg]);
            this.args[arg].load(data.args[arg]);
        }

        // console.log("Loading feedback", data.args.feedback);
        if (data.args.feedback)
            this.feedback_el.load(data.args.feedback);
        if (data.args.constrain)
            this.constrain_el.load(data.args.constrain);
    }
}

class TransformElement extends SynthElementBase {
    enable = true;

    get_title() {
        return "Transform";
    }

    build_stage() {
        return this;
    }

    get_args() {
        // TODO clear transform should hide other inputs
        // This can be done if we override onchange here and store the results of
        // createElement in SynthElementBase
        return {
            scale: new FloatBar([0,10], 1),
            center: new VecEntry(2, ["x", "y"], [[-0.5,1.5], [-0.5,1.5]], [0.5, 0.5]),
            rotation: new FloatBar([0, 2 * Math.PI], 0),
        }
    }

    constructor(synth) {
        super(synth);
        this.feedback_el.style.display = "none";
        this.constrain_el.style.display = "none";
        this.params = {
            scale: 1,
            center: [0.5, 0.5],
            rotation: 0,
        };
    }
}
customElements.define('transform-element', TransformElement);
