var baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    })
};

var svgIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/poi.svg',
    iconSize: [15, 15], // size of the icon, adjust as needed
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location, adjust as needed
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor, adjust as needed
});

var overlayMaps = {}; // Will hold your GeoJSON layers

var map = L.map('mapid', {
    layers: [baseMaps.OpenStreetMap] // Add default layer
}).setView([20, 5], 3);

baseMaps.OpenStreetMap.addTo(map);        

var predefinedColors = ['#642915', '#c7522a', '#e5c185', '#fbf2c4', '#74a892', '#008585', '#004343', '#ffff99',  '#d68a58'];

var movieToIndex = {};  // Mapping of movie names to unique indices
var uniqueIndex = 0;  // Counter for assigning unique indices

function getMovieIndex(movie) {
    if (!movieToIndex.hasOwnProperty(movie)) {
        movieToIndex[movie] = uniqueIndex;
        uniqueIndex++;
    }
    return movieToIndex[movie];
}

function getMovieColor(movie) {
    var index = getMovieIndex(movie);
    return predefinedColors[index % predefinedColors.length];
}

fetch('https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/movie_climbs.geojson')
    .then(response => response.json())
    .then(data => {
        var movieToColor = {};
        for (var i = 0; i < data.features.length; i++) {
            var movie = data.features[i].properties.Movie;
            movieToColor[movie] = getMovieColor(movie);
        }    

        var geojsonLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: movieToColor[feature.properties.Movie],
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.9
                });
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties) {
                    layer.bindPopup(`
                        <strong>Movie:</strong> ${feature.properties.Movie}<br/>
                        <strong>Name:</strong> ${feature.properties.Name}<br/>
                        <strong>Height (m):</strong> ${feature.properties.Height_m}<br/>
                        <strong>Country:</strong> ${feature.properties.Country}<br/>
                    `);
                }
                map.on('moveend', function() {
                    var center = map.getCenter();
                    var zoom = map.getZoom();

                    console.log('Center: ', center);
                    console.log('Zoom level: ', zoom);
                });             
            }
        }).addTo(map);
        overlayMaps["Movie Climbs"] = geojsonLayer; // Add the layer to the overlayMaps object
        var legend = L.control({position: 'bottomright'});
        
        legend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '<h4>Legend</h4>';
            // Loop through movieToColor object to create legend items
            for (var movie in movieToColor) {
                div.innerHTML += '<i style="background:' + movieToColor[movie] + '"></i> ' + movie + '<br>';
            }
            return div;
        };
        legend.addTo(map);

        // Start the second fetch operation
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
                map.on('moveend', function() {
                    var center = map.getCenter();
                    var zoom = map.getZoom();

                    console.log('Center: ', center);
                    console.log('Zoom level: ', zoom);
                });             
            }
        }).addTo(map);
        overlayMaps["Big wall climbs over 100 m and 5.13 difficulty"] = geojsonLayer2; // Add the layer to the overlayMaps object
    })
    .then(() => {
        // Add the layer control after both fetch operations have finished
        L.control.layers(baseMaps, overlayMaps).addTo(map);
    
        // Add the Leaflet Search Control
        var searchControl = new L.Control.Search({
            layer: L.layerGroup([overlayMaps["Movie Climbs"], overlayMaps["Big wall climbs over 100 m and 5.13 difficulty"]]), // Use overlayMaps to reference the layers
            propertyName: 'Name', // The property name to search
            marker: false,
            moveToLocation: function(latlng, title, map) {
                map.flyTo(latlng, 17); // Fly to the location
            }
        });
    
        searchControl.on('search:locationfound', function(e) {
            e.layer.openPopup(); // Open popup if a location is found
        });
    
        map.addControl(searchControl); // Add the control to the map
    });
