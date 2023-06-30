import * as modules from './module_list.json'

export class UIEventManager {
  _add_event: ((fn: string) => Promise<string>) | null = null;
  _show_details: ((node: string, fn: string) => null) | null = null;
  _recompile: ((node_to_render: string | null) => null) | null = null;
  _organize: (() => null) | null = null;
  _get_webcam_feed: ((id: string) => any) | null = null;
  _list_webcam_sources: (() => any) | null = null;
  _add_webcam_feed: ((id: string, feed: HTMLVideoElement) => null) | null = null;
  _remove_webcam_feed: ((id: string) => null) | null = null;

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

  register_get_webcam_feed(cb) {
    this._get_webcam_feed = cb;
  }

  register_list_webcam_sources(cb) {
    this._list_webcam_sources = cb;
  }

  register_add_webcam_feed(cb) {
    this._add_webcam_feed = cb;
  }

  register_remove_webcam_feed(cb) {
    this._remove_webcam_feed = cb;
  }

  get_webcam_feed(feedname: string): HTMLVideoElement | null {
    if (this._get_webcam_feed) {
      return this._get_webcam_feed(feedname);
    }
    return null;
  }

  list_webcam_sources() {
    if (this._list_webcam_sources) {
      return this._list_webcam_sources();
    }
  }

  add_webcam_feed(feedname: string, feedsource: HTMLVideoElement) {
    if (this._add_webcam_feed) {
      this._add_webcam_feed(feedname, feedsource);
    }
  }

  remove_webcam_feed(feedname: string) {
    if (this._remove_webcam_feed) {
      this._remove_webcam_feed(feedname);
    }
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

async function setupWebcamInput(ui_manager: UIEventManager) {
  const sources = document.getElementById("webcamsources") as HTMLElement;
  let devices: MediaDeviceInfo[];
  try {
      devices = await navigator.mediaDevices.enumerateDevices();
  } catch (err) {
      alert("Error initializing webcam!");
      throw err;
  }


  devices = devices.filter(d => d.kind === "videoinput");
  console.log(devices);

  const container = document.createElement("div");

  container.innerHTML = `<label for="webcamSelector">Choose a webcam: </label>`
  const selector = document.createElement("select");
  selector.id = "webcamSelector";
  devices.forEach(device => {
      const entry = document.createElement("option");
      entry.value = device.deviceId;
      entry.innerHTML = device.label || device.deviceId.substr(0, 10);
      selector.appendChild(entry)
  });
  container.appendChild(selector);
  sources.appendChild(container);

  const feeds = document.getElementById("webcamfeeds") as HTMLElement;
  const button = document.getElementById("startwebcam") as HTMLButtonElement;
  async function setup() {
    const container = document.createElement("div");

    const video = document.createElement("video");

    const deviceId = selector.value;
    video.id = deviceId;

    if (ui_manager.get_webcam_feed(deviceId)) {
      alert(`Webcam feed for ${deviceId} already exists`);
      return;
    }

    const constraints = {
        video: { deviceId: deviceId }
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.play();
    } catch (err) {
        alert("Error initializing webcam! " + err);
        console.log(err);
    }

    video.style.width = "25%";
    container.appendChild(document.createElement("br"));
    container.appendChild(video);
    container.appendChild(document.createElement("br"));
    container.appendChild(document.createElement("br"));
    ui_manager.add_webcam_feed(deviceId, video);

    const removeFeed = document.createElement("button");
    removeFeed.innerText = "Remove feed";
    removeFeed.onclick = () => {
      container.remove();
      ui_manager.remove_webcam_feed(deviceId);
    };
    container.appendChild(removeFeed);

    feeds.appendChild(container);
  }
  button.onclick = setup;
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
  setupWebcamInput(ui_manager);
}
