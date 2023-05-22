function makeDraggable(svg) {
  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  svg.addEventListener('touchstart', startDrag);
  svg.addEventListener('touchmove', drag);
  svg.addEventListener('touchend', endDrag);
  svg.addEventListener('touchleave', endDrag);
  svg.addEventListener('touchcancel', endDrag);

  var selectedElement, transform;

  var offset = {x: 0, y: 0};

  var panning = false;

  function getMousePosition(evt) {
    var CTM = svg.getScreenCTM();
    if (evt.touches) { evt = evt.touches[0]; }
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  function startDrag(evt) {
    offset = getMousePosition(evt);

    let target = evt.target;
    while (!target.classList.contains('draggable')) {
      if (target == svg) {
        break
      } else {
        target = target.parentElement;
      }
    }

    if (target == svg) {
      panning = true;
    } else if (target.classList.contains('draggable')) {
      selectedElement = target;

      // Make sure the first transform on the element is a translate transform
      var transforms = selectedElement.transform.baseVal;

      if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        // Create an transform that translates by (0, 0)
        var translate = svg.createSVGTransform();
        translate.setTranslate(0, 0);
        selectedElement.transform.baseVal.insertItemBefore(translate, 0);
      }

      // Get initial translation
      transform = transforms.getItem(0);
      offset.x -= transform.matrix.e;
      offset.y -= transform.matrix.f;
    }
  }

  function drag(evt) {
    var coord = getMousePosition(evt);
    var dx = coord.x - offset.x;
    var dy = coord.y - offset.y;
    if (panning) {
      svg.viewBox.baseVal.x -= dx;
      svg.viewBox.baseVal.y -= dy;
    } else if (selectedElement) {
      evt.preventDefault();

      transform.setTranslate(dx, dy);
      selectedElement.dispatchEvent(new Event("dragged"));
    }
  }

  function endDrag(_evt) {
    selectedElement = false;
    panning = false
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const svg = document.getElementById("synth-pipeline");
  if (!svg) {
    throw new Error("!");
  }
  makeDraggable(svg);
});
