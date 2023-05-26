import * as modules from './module_list.json'

export class UIEventManager {
  _add_event: ((fn: string) => Promise<string>) | null = null;
  _show_details: ((node: string, fn: string) => null) | null = null;
  _recompile: ((node_to_render: string | null) => null) | null = null;
  _organize: (() => null) | null = null;

  add_event(fn: string) {
    if (this._add_event) {
      this._add_event(fn);
    }
  }

  register_add_event(cb) {
    this._add_event = cb;
  }

  show_details(node: string, fn: string) {
    if (this._show_details) {
      this._show_details(node, fn);
    }
  }

  register_show_details(cb) {
    this._show_details = cb;
  }

  recompile(node_to_render: string | null) {
    if (this._recompile) {
      this._recompile(node_to_render);
    }
  }

  register_recompile(cb) {
    this._recompile = cb;
  }

  organize() {
    if (this._organize) {
      this._organize();
    }
  }

  register_organize(cb) {
    this._organize = cb;
  }
}

function setupSidebars() {
    const sidebar = <HTMLElement>document.getElementById("sidebar");
    const burgerbtn = <HTMLElement>document.getElementById("burgerbtn");
    const title = <HTMLElement>document.getElementById("title");

    const showmenu = () => {
        sidebar.style.display = "";
        burgerbtn.style.display = "none";
    };
    const hidemenu = () => {
        sidebar.style.display = "none";
        burgerbtn.style.display = "";
    };

    burgerbtn.addEventListener('click', showmenu);
    title.addEventListener('click', hidemenu);
    document.getElementById("display-container")?.addEventListener("click", hidemenu);

    const rightsidebar = <HTMLElement>document.getElementById("rightsidebar");
    rightsidebar.style.display = "none";
    const gearbtn = <HTMLElement>document.getElementById("gearbtn");
    const settingstitle = <HTMLElement>document.getElementById("settingstitle");

    const showrightmenu = () => {
        rightsidebar.style.display = "";
        gearbtn.style.display = "none";
    };
    const hiderightmenu = () => {
        rightsidebar.style.display = "none";
        gearbtn.style.display = "";
    };
    gearbtn.addEventListener('click', showrightmenu);
    settingstitle.addEventListener('click', hiderightmenu);
    document.getElementById("display-container")?.addEventListener("click", hiderightmenu);

}

function setupControls(ui_manager: UIEventManager) {
  const add_new_stage = document.getElementById("add_new_stage_select") as HTMLSelectElement;
  if (!add_new_stage) {
    throw new Error("!");
  }
  for (let module of Object.getOwnPropertyNames(modules.modules)) {
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

  const organize_btn = document.getElementById("organize");
  if (!organize_btn) {
    throw new Error("!");
  }
  organize_btn.onclick = () => {
    ui_manager.organize();
  };
}

export function setupUI(ui_manager: UIEventManager) {
  setupSidebars();
  setupControls(ui_manager);
}
