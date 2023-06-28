import {UIEventManager, setupUI} from './ui.ts'
import {makeDraggable} from "./svg.ts";
import {Synth} from "./synth.ts";

export async function main () {
  const canvas = <HTMLCanvasElement>document.getElementById("glcanvas");

  const ui_events = new UIEventManager();
  setupUI(ui_events);

  const svg_el = document.getElementById("synth-pipeline") as unknown as SVGSVGElement;
  makeDraggable(svg_el);

  const synth = new Synth(canvas, [1000, 1000], ui_events, svg_el);

  const setup_initial_state = async () => {
    // Add an initial pipeline so it doesn't look too empty
    const c0 = await synth.add_fn("copy_prev_frame");
    const z0 = await synth.add_fn("zoom");
    synth.pipeline.create_edge(c0, z0, 0);
    const p0 = await synth.add_fn("polygon");
    const m0 = await synth.add_fn("mix");
    synth.pipeline.create_edge(z0, m0, 0);
    synth.pipeline.create_edge(p0, m0, 1);
    const r0 = await synth.add_fn("rotate");
    synth.pipeline.create_edge(m0, r0, 0);
    await synth.pipeline.organize();
    synth.params[`${p0}_color`] = [1, 1, 1];
    synth.params[`${z0}_x`] = 0.75;
    synth.params[`${z0}_y`] = 0.75;
    synth.params[`${r0}_angle`] = Math.PI / 4;
    ui_events.recompile(r0)
    ui_events.show_details(r0, "rotate");
  };
  await setup_initial_state();

  let stop = null;
  const run = (t) => {
    synth.step(t);
    if (stop) {
      stop();
      return;
    }
    requestAnimationFrame(run);
  };
  requestAnimationFrame(run);

  (window as any).synth = synth;
  (window as any).stop_synth = () => {
    return new Promise(r => {
      stop = r;
    });
  };
  (window as any).start_synth = () => {
    requestAnimationFrame(run);
  };
}

export { Synth, UIEventManager }
