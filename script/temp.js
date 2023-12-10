var layerStates = {};

function addLayerControls() {
  var layerControlContainer = document.querySelector('#layer-control-pane');
  allLayers.forEach(({ name, layer, type }) => {
    // Initialize layer state
    layerStates[name] = map.hasLayer(layer);

    // ...[rest of the code as above]...

    checkbox.addEventListener('change', function() {
      if (this.checked) {
        map.addLayer(layer);
        layerStates[name] = true;
      } else {
        map.removeLayer(layer);
        layerStates[name] = false;
      }
    });

    // ...[rest of the code as above]...
  });
}
