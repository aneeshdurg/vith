import * as modules from './module_list.json'

export class UIEventManager {
  constructor() {
    this._add_event = null;
    this._recompile = null;
  }

  add_event(fn: str) {
    if (this._add_event) {
      this._add_event(fn);
    }
  }

  register_add_event(cb) {
    this._add_event = cb;
  }

  show_details(node: str) {
    if (this._show_details) {
      this._show_details(fn);
    }
  }

  register_show_details(cb) {
    this._show_details = cb;
  }

  recompile(node_name, node_to_render) {
    if (this._recompile) {
      this._recompile(node_name, node_to_render);
    }
  }

  register_recompile(cb) {
    this._recompile = cb;
  }
}

export function setupUI(ui_manager: UIEventManager) {
  const settings = document.getElementById("rightsidebar");
  if (!settings){
    throw new Error("!");
  }
  settings.style.display = "none";

  const gearbtn = document.getElementById("gearbtn");
  if (!gearbtn){
    throw new Error("!");
  }
  gearbtn.onclick = (e) => {
    if (settings.style.display) {
      settings.style.display = "";
    }
  };

  const add_new_stage = document.getElementById("add_new_stage_select");
  if (!add_new_stage) {
    throw new Error("!");
  }
  for (let module of Object.getOwnPropertyNames(modules)) {
    const opt_el = document.createElement("option");
    opt_el.value = module;
    opt_el.innerText = module;
    add_new_stage.appendChild(opt_el);
  }

  const add_new_stage_btn = document.getElementById("add_new_stage");
  if (!add_new_stage_btn) {
    throw new Error("!");
  }
  add_new_stage_btn.onclick = () => {
    ui_manager.add_event(add_new_stage.value);
  };
}
