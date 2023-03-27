var lat= 41.55;
var lng= -72.65;
var zoom= 9;

var map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        });
    
map.setView([lat, lng], zoom);
map.createPane('top');
map.getPane('top').style.zIndex=650;

L.control.attribution({position: 'bottomleft'}).addTo(map);
L.control.zoom({position:'topright'}).addTo(map);

// L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}',{
//     attribution: 'USGS The National Map: National Hydrography Dataset. Data refreshed March, 2020.',
//     maxZoom:16}).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

//define common styles for all circle markers
var commonStyles = {
    weight: 1,
    stroke: 1,
    fillOpacity: .8
};

var linestyle = {
    "color": "#f5f5f5",
    "weight": 2,
};

var breaks = [-0.31,-0.20,-0.10,-0.5,0,0.1];

var color = [   [-1,'Cold to Not Cold','#018571'],
                [0,'Stable','#f5f5f5'],
                [1,'Not Cold to Cold','#dfc27d']];


d3.json('data/fishChg.geojson').then((data) => {
    // use D3 fetch to request data with async requests
    var fishlcData = d3.json('data/fishChg.geojson');
    var stateBoundaryData = d3.json('data/ctStateBoundary.geojson');
    Promise.all([fishlcData,stateBoundaryData]).then(addLayers);
});

function addLayers (data) {
    console.log(data);
    const fishlcLyr = data[0];
    const boundaryLyr = data[1];

    L.geoJson(boundaryLyr,{style:linestyle}).addTo(map);

    var geojson = L.geoJson(fishlcLyr, {
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng,commonStyles);
                    },
                    style: getStyle,
                    onEachFeature: function(feature,layer) {
                            layer.on({mouseover: highlightFeature,mouseout: resetHighlight});
                            layer.bindTooltip(
                                '<b>' + layer.feature.properties.staSeq+ ' - ' + layer.feature.properties.locationNa.toUpperCase() +'</b>' + '<br>' +
                                '<b> SS fish/km: </b>' + layer.feature.properties.nkm_88_94.toFixed(2)+ '</br>' +
                                '<b> 18-19 fish/km: </b>' + layer.feature.properties.nkm_18_19.toFixed(2) + '</br>' +
                                '<b> Chg in CF (1985 - 2015): </b>' + (layer.feature.properties.chgCF_2015 * 100).toFixed(2)+ '% </br>' +
                                '<b> Chg in Dev (1985 - 2015): </b>' + (layer.feature.properties.chgDev_2015 * 100).toFixed(2) + '%')
                    }
                }).addTo(map);

    //mouse on mouse off
    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({weight: 5, color: '#666', dashArray: '', fillOpacity: 0.7});
    }

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
    }

}

function getRadius (area){
    var r = get_bin([area],bins=breaks)[0];
    var R = {0:30,1:20,3:15,4:8,5:2,6:2};
    return R[r];
}


 function get_bin(data,bins){
    var B = [];
    for(var i = 0; i<data.length; i++){
        for(var b=1; b<bins.length; b++){
            if(data[i]>=bins[b-1] && data[i]<bins[b]){
                B.push(b);
            }
         }
     }
    return B;
 }

 function getColor (d){
    if  (d == color[0][0]){
        return color[0][2]
    }if  (d == color[1][0]){
        return color[1][2]
    }if (d == color[2][0]){
        return color[2][2]
    }
}

 //function to define style
function getStyle(feature){
    return{
        color: getColor(feature.properties.cw_chg),
        fillColor: getColor(feature.properties.cw_chg),
        radius: getRadius(feature.properties.chgCF_2015)
    };
}

function drawLegend (color){
    var legend = L.control({position: 'topright'});
    legend.onAdd = function(){
        var div = L.DomUtil.create('div','legend');
        div.innerHTML = "<h3> Cold Water Fish Diff </h3>" 
        for (var i = 0; i < color.length; i++) {
            var c = getColor(color[i][0], color);
            div.innerHTML +=
                '<span style="background:' + c + '"></span> ' +
                '<label>'+(color[i][1]).toLocaleString()+ '</label>'
        }
        div.innerHTML += "</br><div class = circles><div class='outercircle'> >20 <div class='innercircle'> 0</div></div><h4>Core Forest Chg %</h4>" 
        return div;
    };
    legend.addTo(map);
}

drawLegend(color);



