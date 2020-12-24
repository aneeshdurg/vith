const fn = {
    render: 0,
    osc_x: 1,
    osc_y: 2,
};

class Function {
    id = 0;
    feedback = 0;
    params = {};

    constructor(feedback) {
        this.feedback = feedback;
    }
}

class Oscillator extends Function {
    id = 1;
    params = {osc_f: [0, 0], osc_c: 0, osc_color: [1, 0, 0]}

    constructor(f, c, color, feedback) {
        super(feedback || 0);
        this.params.osc_f = f;
        this.params.osc_c = c;
        this.params.osc_color = color;
    }
}

class Rotator extends Function {
    id = 2;
    params = {rotation: 0}

    constructor(rotation, feedback) {
        super(feedback || 0);
        this.params.rotation = rotation;
    }
}

class Synth {
    dimensions = [1000, 1000];

    functions = [];

    constructor(canvas, fragShader) {
        this.dimensions = [1000, 1000];

        canvas.width = this.dimensions[0];
        canvas.height = this.dimensions[1];
        this.gl = canvas.getContext("webgl2");
        if (!this.gl)
            throw new Error("Could not initialize webgl2 context! Does your browser support webgl2?");
        enableGlExts(this.gl);

        this.programInfo = twgl.createProgramInfo(this.gl, [vs, fragShader]);
        const bufferInfo = twgl.createBufferInfoFromArrays(this.gl, bufferArrays);
        setupProgram(this.gl, this.programInfo, bufferInfo);

        this.fbs = new FrameBufferManager(this.gl, this.dimensions);
    }

    render(time) {
        this.functions.forEach((fn_params, stage) => {
            this.fbs.bind_dst();
            const params = {
                u_dimensions: this.dimensions,
                u_tex_dimensions: this.dimensions,
                u_texture: this.fbs.src(),
                u_function: fn_params.id,
                u_stage: stage,
                u_feedback: fn_params.feedback,
            };
            for (let key of Object.keys(fn_params.params)) {
                params['u_' + key] = fn_params.params[key];
            }

            twgl.setUniforms(this.programInfo, params);
            render(this.gl);
            this.fbs.flipflop();
        });

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        twgl.setUniforms(this.programInfo, {
            u_tex_dimensions: this.dimensions,
            u_texture: this.fbs.src(),
            u_function: 0,
            u_stage: this.functions.length + 1,
            u_feedback: 1,
        });
        render(this.gl);
    }
}

async function synth_main(canvas, root) {
    root = root || ".";

    const fragShader = await getFile(root + "/synth.frag.c");
    const obj = new Synth(canvas, fragShader);
    // TODO create a UI for this
    obj.functions.push(new Oscillator([0.25, 0], 0, [1, 0, 0]));
    obj.functions.push(new Rotator(Math.PI / 4, 1));
    obj.functions.push(new Oscillator([0, 0.25], 0, [0, 0, 1], 0.5));
    obj.functions.push(new Rotator(Math.PI / 4, 1));

    function f(time) {
        obj.render(time);
        requestAnimationFrame(f);
    }

    requestAnimationFrame(f);

    window.obj = obj;
}
