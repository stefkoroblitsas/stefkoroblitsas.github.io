// Initialize map
var map = L.map('mapid', {
  center: [20, 5],
  zoom: 3
});

// Base maps
var baseMaps = {
  OpenStreetMap: L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19
    }
  ).addTo(map),
  'World Imagery': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      opacity: 0.2
    }
  )
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

// New movie styles
const movieStyles = {
  '14 peaks': { fillColor: '#db1e2a', color: '#ffffff', weight: 1 },
  'The Alpinist': { fillColor: '#a4de11', color: '#ffffff', weight: 1 },
  'Free Solo': { fillColor: '#dccb5b', color: '#ffffff', weight: 1 },
  'The last tepui': { fillColor: '#e77979', color: '#ffffff', weight: 1 },
  'The Dawn Wall': { fillColor: '#a92fd6', color: '#ffffff', weight: 1 },
  'Meru': { fillColor: '#2e46d0', color: '#ffffff', weight: 1 },
  'King Lines': { fillColor: '#569ace', color: '#ffffff', weight: 1 },
  'Silence': { fillColor: '#89e963', color: '#ffffff', weight: 1 },
  'The Beckoning Silence': { fillColor: '#77ef89', color: '#ffffff', weight: 1 },
  'The conquest of Everest': { fillColor: '#6af0f0', color: '#ffffff', weight: 1 },
  'The First Ascent': { fillColor: '#8a63e5', color: '#ffffff', weight: 1 },
  'Touching the Void': { fillColor: '#dd2a74', color: '#ffffff', weight: 1 },
  'Alé': { fillColor: '#3deda1', color: '#ffffff', weight: 1 },
  // Continue adding other movies as needed
};

// Fetch movie climbs data
var geojsonLayer;
var allData;

fetch('https://raw.githubusercontent.com/stefkoroblitsas/stefkoroblitsas.github.io/main/movie_climbs.geojson')
  .then(response => response.json())
  .then(data => {
    allData = data;

    geojsonLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        var movie = feature.properties.movie;
        var style = movieStyles[movie] || {
          fillColor: '#000000', // Default fill color if movie not found in styles
          color: '#ffffff',
          weight: 1
        };
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: style.fillColor,
          color: style.color,
          weight: style.weight,
          opacity: 1,
          fillOpacity: 0.9
        });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          layer.bindPopup(`
            <strong>Movie:</strong> ${feature.properties.movie}<br/>
            <strong>Name:</strong> ${feature.properties.name}<br/>
            <strong>Height (m):</strong> ${feature.properties.height_m}<br/>
            <strong>Country:</strong> ${feature.properties.country}<br/>
            <strong>Watched?:</strong> ${feature.properties.watched}<br/>
          `);
        }
      }
    }).addTo(map);

    geojsonLayer.on('click', function (e) {
      var clickedMovieTitle = e.layer.feature.properties.movie;
      fetchMovieDetails(clickedMovieTitle);
    });

    overlayMaps['Movie Climbs'] = geojsonLayer;

    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = '<h4>Interactive Legend</h4>';
      for (var movie in movieStyles) {
        var span = L.DomUtil.create('span', 'legend-item', div);
        span.innerHTML = movie;
        span.style.backgroundColor = movieStyles[movie].fillColor;
        span.setAttribute('data-movie', movie);
        L.DomEvent.on(span, 'click', function (e) {
          filterByMovie(e.target.getAttribute('data-movie'));
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
        return L.marker(latlng, { icon: svgIcon });
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
    overlayMaps['Big wall climbs over 100 m and 5.13 difficulty'] = geojsonLayer2;
  })
  .then(() => {
    L.control.layers(baseMaps, overlayMaps).addTo(map);

    var searchControl = new L.Control.Search({
      layer: L.layerGroup([
        overlayMaps['Movie Climbs'],
        overlayMaps['Big wall climbs over 100 m and 5.13 difficulty']
      ]),
      propertyName: 'Name',
      marker: false,
      moveToLocation: function (latlng, title, map) {
        map.flyTo(latlng, 17);
      }
    });
    searchControl.on('search:locationfound', function (e) {
      e.layer.openPopup();
    });
    map.addControl(searchControl);
  });

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

map.pm.addControls({
  position: 'topleft',
  drawCircle: false
});

var sidebar = L.control.sidebar('sidebar', {
  position: 'left'
});
map.addControl(sidebar);
setTimeout(function () {
  sidebar.open('home');
}, 500);

function fetchMovieDetails(movieTitle) {
  var apiKey = '6ca4ece0'; // Your OMDb API key
  var url = `https://www.omdbapi.com/?t=${encodeURIComponent(
    movieTitle
  )}&apikey=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.Response === 'True') {
        updateSidebar(data);
      } else {
        console.log('Movie not found:', data.Error);
      }
    })
    .catch(error => console.log('Error fetching movie details:', error));
}

function updateSidebar(movieData) {
  var sidebarContent = `
    <h2>${movieData.Title}</h2>
    <p><strong>Release Year:</strong> ${movieData.Year}</p>
    <p><strong>Director:</strong> ${movieData.Director}</p>
    <p><strong>Actors:</strong> ${movieData.Actors}</p>
    <p><strong>Plot:</strong> ${movieData.Plot}</p>
    <img src="${movieData.Poster}" alt="Movie Poster">
  `;
  document.getElementById('movie-details').innerHTML = sidebarContent;
  sidebar.open('movie-details');
}

function filterByMovie(movieName) {
  var filteredFeatures = allData.features.filter(
    feature => feature.properties.movie === movieName
  );
 
  geojsonLayer.clearLayers();
  geojsonLayer.addData(filteredFeatures);

  if (filteredFeatures.length > 0) {
    var group = new L.featureGroup(
      filteredFeatures.map(feature => {
        return L.circleMarker([
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0]
        ]);
      })
    );
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
