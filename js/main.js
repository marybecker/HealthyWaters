const options = {
  center: [41.55, -72.65],
  zoom: 9,
  zoomSnap: 0.1,
  zoomControl: false,
};
const map = L.map('map', options);
new L.control.zoom({ position: 'topright' }).addTo(map);

L.esri
  .tiledMapLayer({
    url:
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer',
  })
  .addTo(map);

//Set styles and load boundary and basin data.  Add basin layers to layer control
const linestyle = {
  color: 'black',
  weight: 2,
};

// first request all three of your files
const stateBoundaryGeoJson = $.getJSON('data/StateBoundary.geojson');
const basinGeoJson = $.getJSON('data/bcg2_cw_basin.geojson');
const sitesGeoJson = $.getJSON('data/bcg2_cw_sites.geojson');

// use native Promise to wait for all data to be loaded
Promise.all([stateBoundaryGeoJson, basinGeoJson, sitesGeoJson]).then((data) => {
  // now all your data is in one place
  console.log(data);
  // call draw map and send all data as one parameter (an array object)
  drawMap(data);
});

function drawMap(data) {
  // create separate Leaflet GeoJson layers with data here
  const states = L.geoJson(data[0], {
    style: linestyle,
  }).addTo(map);

  const basins = L.geoJson(data[1], {
    style: style,
  }).addTo(map);

  // create Leaflet data layer and add to map
  const sites = L.geoJson(data[2], {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: function style(feature) {
      return {
        radius: 6,
        fillColor: '#ffffff',
        color: '#000',
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.7,
      };
    },
    // add hover/touch functionality to each feature layer
    onEachFeature: function (feature, layer) {
      const props = layer.feature.properties;
      const CWLab = getLab(props['CWSite']);

      // assemble string sequence of info for tooltip (end line break with + operator)
      let tooltipInfo = `<b>${props['Station_Na']}</b></br>
                                   SID: ${props['STA_SEQ']}</br>
                                   BCG: ${props['BCG']}</br>
                                   Cold Water: ${CWLab}`;

      // bind a tooltip to layer with county-specific information
      layer.bindTooltip(tooltipInfo, {
        // sticky property so tooltip follows the mouse
        sticky: true,
        className: 'customTooltip',
      });

      // when mousing over a layer
      layer.on('mouseover', function () {
        // change the stroke color and bring that element to the front
        layer
          .setStyle({
            color: '#ff6e00',
          })
          .bringToFront();
      });

      // on mousing off layer
      layer.on('mouseout', function () {
        // reset the layer style to its original stroke color
        layer.setStyle({
          color: '#20282e',
        });
      });
    },
  }).addTo(map);

  addLegend();
}

//Functions to get color and add style for Basins
function getColor(CW) {
  if (CW == 1) {
    return '#1546d9';
  } else {
    return '#2ea1cb';
  }
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.CW),
    weight: 0.5,
    opacity: 0.7,
    color: 'white',
    fillOpacity: 0.7,
  };
}

//Function to get label
function getLab(j) {
  if (j == 1) {
    return 'Yes';
  } else {
    return 'No';
  }
}

// Add legend to map
function addLegend() {
  // create a new Leaflet control object, and position it top left
  const legendControl = L.control({ position: 'topleft' });

  // when the legend is added to the map
  legendControl.onAdd = function () {
    // select a div element with an id attribute of legend
    const legend = L.DomUtil.get('legend');

    // disable scroll and click/touch on map when on legend
    L.DomEvent.disableScrollPropagation(legend);
    L.DomEvent.disableClickPropagation(legend);

    // return the selection to the method
    return legend;
  };

  // add the empty legend div to the map
  legendControl.addTo(map);

  const legendText = `<span class="circle" ></span>
                        <label>High Quality River Sampling Site</label><br>
                        <span class="circle" ></span>
                        <label>High Quality River Sampling Site</label><br>
                        <span style="background:#1546d9"></span>
                        <label>High Quality and Cold Water Drainage Basin</label><br>`;

  $('#legend').html(legendText);
}
