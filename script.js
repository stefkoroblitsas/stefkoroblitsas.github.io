// Initialize map
var map = L.map('mapid', {
    center: [20, 5],
    zoom: 3
});

// Base maps
var baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map),
    "World Imagery": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        opacity: 0.2  
    })
};

// Custom icon
var svgIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/poi.svg',
    iconSize: [20, 20],
    iconAnchor: [0, 0],
    popupAnchor: [0, 0]
});

// Overlay Maps
var overlayMaps = {};

// Predefined colors for movies
var predefinedColors = ['#642915', '#c7522a', '#e5c185', '#fbf2c4', '#74a892', '#008585', '#004343', '#ffff99',  '#d68a58'];

// Movie to Color mapping
var movieToColor = {};
var movieToIndex = {};
var uniqueIndex = 0;

function getMovieIndex(movie) {
    if (!movieToIndex.hasOwnProperty(movie)) {
        movieToIndex[movie] = uniqueIndex++;
    }
    return movieToIndex[movie];
}

function getMovieColor(movie) {
    var index = getMovieIndex(movie);
    return predefinedColors[index % predefinedColors.length];
}

var currentFilteredMovie = null;

function filterByMovie(movieName) {
    if (currentFilteredMovie === movieName) {
        // If the same movie is clicked again, reset the view
        resetView();
        return;
    }

    currentFilteredMovie = movieName;
    var filteredFeatures = allData.features.filter(feature => 
        feature.properties.Movie === movieName
    );

    geojsonLayer.clearLayers();
    geojsonLayer.addData(filteredFeatures);

    if (filteredFeatures.length > 0) {
        var group = new L.featureGroup(filteredFeatures.map(feature => {
            return L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
        }));
        var maxZoom = 10;
        map.fitBounds(group.getBounds(), { maxZoom: maxZoom });
    }
}

function resetView() {
    currentFilteredMovie = null;
    geojsonLayer.clearLayers();
    geojsonLayer.addData(allData);
    map.fitBounds(geojsonLayer.getBounds());
}

// Fetch movie climbs data
var geojsonLayer;
var allData;

fetch('https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/movie_climbs.geojson')
    .then(response => response.json())
    .then(data => {
        allData = data;
        for (var i = 0; i < data.features.length; i++) {
            var movie = data.features[i].properties.Movie;
            movieToColor[movie] = getMovieColor(movie);
        }    

        geojsonLayer = L.geoJSON(data, {
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
            }
        }).addTo(map);
        overlayMaps["Movie Climbs"] = geojsonLayer;

        // Legend
        var legend = L.control({position: 'bottomleft'});
        legend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '<h4>Interactive Legend</h4>';
            for (var movie in movieToColor) {
                var span = L.DomUtil.create('span', 'legend-item', div);
                span.innerHTML = movie;
                span.style.backgroundColor = movieToColor[movie];
                span.setAttribute('data-movie', movie);
                L.DomEvent.on(span, 'click', function(e) {
                    filterByMovie(e.target.getAttribute('data-movie'));
                });
            }
            return div;
        };
        legend.addTo(map);

        // Fetch big wall climbs data
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

        // Search control
        var searchControl = new L.Control.Search({
            layer: L.layerGroup([overlayMaps["Movie Climbs"], overlayMaps["Big wall climbs over 100 m and 5.13 difficulty"]]),
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

// Info popup
var infoPopupContent = `
    <h2>Map Information</h2>
    <p>This map displays climbing routes and movies locations. The data is sourced from various climbing communities and movie databases.</p>
    <p>Click on any point to get more information.</p>
    <a href="https://example.com/data_source" target="_blank">View data source</a>
`;

var infoPopup = L.popup()
    .setLatLng([20, 5])
    .setContent(infoPopupContent)
    .openOn(map);

// Leaflet-Geoman controls
map.pm.addControls({  
    position: 'topleft',  
    drawCircle: false,  
});

// Sidebar control
var sidebar = L.control.sidebar('sidebar', {
    position: 'left'
});
map.addControl(sidebar);
setTimeout(function () {
    sidebar.open('home');
}, 500);
