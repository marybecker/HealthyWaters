const options = {
    center: [41.55, -72.65],
    zoom: 9,
    zoomSnap: .1,
    zoomControl: false
};
const map = L.map('map', options);
new L.control.zoom({position:"topright"}).addTo(map);

L.esri.tiledMapLayer({url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer"})
    .addTo(map);


//Set styles and load boundary and basin data.  Add basin layers to layer control
var linestyle = {
    "color": "black",
    "weight": 2,
};

var StateBoundary = $.getJSON("data/StateBoundary.geojson",function(linedata){
    console.log(linedata);
    L.geoJson(linedata,{
        style:linestyle
    }).addTo(map);
});

var Basin = $.getJSON("data/hq_catchments.geojson",function(polyData){
    console.log(polyData);
    L.geoJson(polyData,{
        style:style
    }).addTo(map);
});

var Sites = $.when(Basin).done(function () {
    $.getJSON("data/hq_sites.geojson", function (data) {
        // jQuery method uses AJAX request for the GeoJSON data
        console.log(data);
        // call draw map and send data as parameter
        drawMap(data);
    })
});

function drawMap(data) {
    // create Leaflet data layer and add to map
    const sites = L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng,);
        },
        style: function style(feature){
            return{
                radius: 5,
                fillColor: '#1546d9',
                color: "#ffffff",
                weight: 1,
                opacity: 0.5,
                fillOpacity: 0.7
            };
        },
        // add hover/touch functionality to each feature layer
        onEachFeature: function (feature, layer) {
            const props = layer.feature.properties;
            /*const CWLab = getLab(props["CWSite"]);*/

            // assemble string sequence of info for tooltip (end line break with + operator)
            // let tooltipInfo = `<b>${props["Station_Na"]}</b></br>
            //                        SID: ${props["STA_SEQ"]}</br>
            //                        BCG: ${props["BCG"]}</br>
            //                        Cold Water: ${CWLab}`;
            let tooltipInfo = `<b>${props["locationName"]}</b></br>
                                   SID: ${props["staSeq"]}</br>`;

            // bind a tooltip to layer with county-specific information
            layer.bindTooltip(tooltipInfo, {
                // sticky property so tooltip follows the mouse
                sticky: true,
                className: 'customTooltip'
            });

            // when mousing over a layer
            layer.on('mouseover', function () {

                // change the stroke color and bring that element to the front
                layer.setStyle({
                    color: '#ff6e00'
                }).bringToFront();
            });

            // on mousing off layer
            layer.on('mouseout', function () {

                // reset the layer style to its original stroke color
                layer.setStyle({
                    color: '#20282e'
                });
            });
        }
    }).addTo(map);

    addLegend();

}

//Functions to get color and add style for Basins
function getColor(CW){
    if (CW == 1){
        return '#1546d9';
    } else {
        return '#2ea1cb'
    }
}

function style(feature) {
    return {
        fillColor: '#2ea1cb',
        weight: 0.5,
        opacity: 0.7,
        color: 'white',
        fillOpacity: 0.7
    };
    // return {
    //     fillColor: getColor(feature.properties.CW),
    //     weight: 0.5,
    //     opacity: 0.7,
    //     color: 'white',
    //     fillOpacity: 0.7
    // };
}

//Function to get label
function getLab(j) {
    if (j ==1) {
        return 'Yes'
    } else {
        return 'No'
    }
}

// Add legend to map
function addLegend() {

    // create a new Leaflet control object, and position it top left
    const legendControl = L.control({ position: 'topleft' });

    // when the legend is added to the map
    legendControl.onAdd = function() {

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

    const legend = $('#legend').html(`<span class="circle" style="background: #1546d9"></span>
                                    <label>High Quality River Sampling Site</label><br>`);
    legend.append(`<span style="background:#2ea1cb"></span>
      <label>High Quality River Catchment</label><br>`);
    // legend.append(
    //     `<span style="background:#1546d9"></span>
    //   <label>High Quality and Cold Water Drainage Basin</label><br>`);
}
