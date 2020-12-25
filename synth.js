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

class Reflector extends Function {
    id = 3
    params = {reflect_theta: 0, reflect_y: 0}

    constructor(theta, y, feedback) {
        super(feedback || 0);
        this.params.reflect_theta = theta;
        this.params.reflect_y = y;
    }
}

class Noise extends Function {
    id = 4
    params = {noise_r: 0, noise_g: 0, noise_b: 0}
    constructor(noise_r, noise_b, noise_g, feedback) {
        super(feedback || 0);
        this.params.noise_r = 10000 * noise_r;
        this.params.noise_g = 10000 * noise_g;
        this.params.noise_b = 10000 * noise_b;
    }
}

class HueShift extends Function {
    id = 5
    params = {hue_shift: 0}
    constructor(hue_shift, feedback) {
        super(feedback || 0);
        this.params.hue_shift = hue_shift;
    }
}


class Zoom extends Function {
    id = 6
    params = {zoom: 1, zoom_center: [0.5, 0.5]}
    constructor(zoom, zoom_center, feedback) {
        super(feedback || 0);
        this.params.zoom = zoom || 1;
        this.params.zoom_center = zoom_center;
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
    obj.functions.push(new Oscillator([0, 0.5], 0, [1, 0, 0]));
    obj.functions.push(new Oscillator([0.25, 0], 0, [0, 0, 1], 1));
    obj.functions.push(new Noise(Math.random(), Math.random(), Math.random(), 1));
    obj.functions.push(new HueShift(5, 1));
    for(let i = 1; i <= 32; i++)
        obj.functions.push(new Reflector(i * Math.PI / 32, i / 300, 1));
    obj.functions.push(new Zoom(2, [0.5, 0.5], 1));
    obj.functions.push(new Zoom(2, [0.25, 0.25], 1));

    function f(time) {
        obj.render(time);
        requestAnimationFrame(f);
    }

    requestAnimationFrame(f);

    window.obj = obj;
}
