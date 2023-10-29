var baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    })
};

var svgIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/mms_black_24dp.svg',
    iconSize: [38, 95],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76]
});

var overlayMaps = {};  // Will hold your GeoJSON layers

var movieLayers = {};  // Object to hold a GeoJSON layer for each movie

var map = L.map('mapid', {
    layers: [baseMaps.OpenStreetMap]
}).setView([20, 5], 3);

baseMaps.OpenStreetMap.addTo(map);

fetch('https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/movie_climbs.geojson')
    .then(response => response.json())
    .then(data => {
        var movieColors = chroma.scale('Set1').mode('lch').colors(data.features.length);
        var movieToColor = {};

        // Group Data by Movie
        data.features.forEach(feature => {
            var movie = feature.properties.Movie;
            if (!movieLayers[movie]) {
                movieLayers[movie] = {
                    type: 'FeatureCollection',
                    features: []
                };
            }
            movieToColor[movie] = movieColors[movieLayers[movie].features.length];
            movieLayers[movie].features.push(feature);
        });

        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '<h4>Legend</h4>';

            // Populate Legend
            for (var movie in movieLayers) {
                var movieDiv = L.DomUtil.create('div', 'legend-item', div);
                movieDiv.innerHTML = '<i style="background:' + movieToColor[movie] + '"></i> ' + movie;
                movieDiv.addEventListener('click', function() {
                    toggleLayer(movie);  // Toggle layer visibility on click
                });
            }

            return div;
        };

        legend.addTo(map);

        return fetch('https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/big_wall_climbs.geojson');
    })
    .then(response => response.json())
    .then(data => {
        var geojsonLayer2 = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: svgIcon});
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    layer.bindPopup(`
                        <strong>Route:</strong> ${feature.properties.route}<br/>
                        <strong>Grade:</strong> ${feature.properties.grade}<br/>
                        <strong>Climb:</strong> ${feature.properties.climb}<br/>
                        <strong>Area:</strong> ${feature.properties.area}<br/>
                    `);
                }
            }
        }).addTo(map);
        overlayMaps["Big wall climbs over 100 m and 5.13 difficulty"] = geojsonLayer2;
    })
    .then(() => {
        L.control.layers(baseMaps, overlayMaps).addTo(map);

        var searchControl = new L.Control.Search({
            layer: L.layerGroup([overlayMaps["Big wall climbs over 100 m and 5.13 difficulty"]]),  // Updated to remove the movie climbs layer from search
            propertyName: 'Name',
            marker: false,
            moveToLocation: function(latlng, title, map) {
                map.flyTo(latlng, 17);
            }
        });

        searchControl.on('search:locationfound', function(e) {
            e.layer.openPopup();
        });

        map.addControl(searchControl);
    });

// Toggle Layer Visibility
function toggleLayer(movie) {
    var layer = movieLayers[movie];
    if (map.hasLayer(layer)) {
        map.removeLayer(layer);
    } else {
        L.geoJSON(layer).addTo(map);
    }
}
