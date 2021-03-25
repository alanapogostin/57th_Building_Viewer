mapboxgl.accessToken = 'pk.eyJ1IjoiYXNwOTA4OSIsImEiOiJja2xrMHk3ZW01Mmk2MnZucmFrM3podmh3In0.qZ1N12EiB17J56BQ5Oy5QQ'

// connecting to the datasource for the map and setting load view
var map = new mapboxgl.Map({
  container: 'mapContainer', // container ID
  style: 'mapbox://styles/mapbox/light-v10', // style URL
  center: [-73.97992, 40.76721], // starting position [lng, lat]
  zoom: 14.5, // starting zoom
  pitch: 40, // pitch in degrees
  bearing: -61,
});

var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');

map.on('style.load', function() {
  //adding in the lot chloropleth
  map.addSource('57th_lots', {
    type: 'geojson',
    data: 'data/all_lots.geojson'
  });
  //adding in the highlights for buildings
  map.addSource('skyscraper_lots', {
    type: 'geojson',
    data: 'data/skyscraper_lots.geojson'
  });

})

map.on('load', function() {
  // Insert the layer beneath any symbol layer.
  var layers = map.getStyle().layers;

  var labelLayerId;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id;
      break;
    }
  }
  // Adding 3d Buildings

  map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',

        // use an 'interpolate' expression to add a smooth transition effect to the
        // buildings as the user zooms in
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    },
    labelLayerId
  );

  //Adding in Floor
  map.on('load', function() {
    var layers = ['0-20', '20-40', '40-60', '60-80', '80+'];
    var colors = ['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000'];

    for (i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var color = colors[i];
      var item = document.createElement('div');
      var key = document.createElement('span');
      key.className = 'legend-key';
      key.style.backgroundColor = color;

      var value = document.createElement('span');
      value.innerHTML = layer;
      item.appendChild(key);
      item.appendChild(value);
      legend.appendChild(item);
    }
  });

  map.addLayer({
    'id': '57th_street_off',
    'type': 'line',
    'source': '57th_lots',
    'layout': {},
    'paint': {
      'line-color': '#a9a9a9',
      'line-width': 0.8
    },
    });
  //Adding in FAR layer
  /// Adding Number of Floors Fill
  map.addLayer({
    'id': '57th_street_FAR_fill',
    'type': 'fill',
    'source': '57th_lots',
    'layout': {},
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'BuiltFAR'],
        5,
        '#edf8fb',
        10,
        '#b3cde3',
        15,
        '#8c96c6',
        20,
        '#8856a7',
        25,
        '#810f7c'
      ],
      'fill-outline-color': '#ccc',
      'fill-opacity': 0.8
    },
    });

  /// Adding Number of Floors Fill

  map.addLayer({
    'id': '57th_street_floors_fill',
    'type': 'fill',
    'source': '57th_lots',
    'layout': {},
    'paint': {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'NumFloors'],
        0,
        '#fef0d9',
        20,
        '#fdcc8a',
        40,
        '#fc8d59',
        60,
        '#e34a33',
        80,
        '#b30000'
      ],
      'fill-outline-color': '#ccc',
      'fill-opacity': 0.8
    },
  });
  // Adding In Skyscraper highlights
  map.addLayer({
    'id': 'skyscraper_outline',
    'type': 'line',
    'source': 'skyscraper_lots',
    'layout': {},
    'paint': {
      'line-color': '#00FF00',
      'line-width': 2.5
    },
    });
});

// Adding a interactive feature
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});
map.on('mousemove', function(e) {

  var features = map.queryRenderedFeatures(e.point, {
    layers: ['57th_street_floors_fill', '57th_street_FAR_fill'],
  });

  if (features.length > 0) {

    var hoveredFeature = features[0];
    var Address = hoveredFeature.properties.Address;
    var NumFloors = hoveredFeature.properties.NumFloors;
    var FAR = hoveredFeature.properties.BuiltFAR;
    var OwnerName = hoveredFeature.properties.OwnerName;

    var popupContent = `
      <div>
        <b> Building Information</b><br/>
        ${Address}<br/>
        Number of Floors: ${NumFloors}<br/>
        Floor Area Ratio: ${FAR}<br/>
        Building Owner: ${OwnerName}
      </div>
    `
    popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
    //map.getSource('all_lots').setData(hoveredFeature.geometry);
    map.getCanvas().style.cursor = 'pointer';
  } else {
    popup.remove();
    map.getCanvas().style.cursor = '';;
  }
})

/// FAR and Floor Button Connection
  $('.btn-check#btnradioFAR').on('click', function() {
    var layerVisibility = map.getLayoutProperty('57th_street_FAR_fill', 'visibility')
    if (layerVisibility === 'visible') {
      map.setLayoutProperty('57th_street_FAR_fill', 'visibility', 'none')
      map.setLayoutProperty('visibility', 'visible')
      map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'visible')
      map.setLayoutProperty('visibility', 'none')
    } else {
      map.setLayoutProperty('57th_street_FAR_fill', 'visibility', 'visible')
      map.setLayoutProperty('visibility', 'none')
      map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'none')
      map.setLayoutProperty('visibility', 'visible')
    }
  })


$('.btn-check#btnradioNumFloors').on('click', function() {
  var layerVisibility = map.getLayoutProperty('57th_street_floors_fill', 'visibility')
  if (layerVisibility === 'visible') {
    map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'none')
    map.setLayoutProperty('visibility', 'visible')
    map.setLayoutProperty('57th_street_FAR_fill', 'visibility', 'visible')
    map.setLayoutProperty('visibility', 'none')
  } else {
    map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'visible')
    map.setLayoutProperty('visibility', 'none')
    map.setLayoutProperty('57th_street_FAR_fill', 'visibility', 'none')
    map.setLayoutProperty('visibility', 'visible')
  }
})

// turn off layers
$('.btn-check#btnradioOFF').on('click', function() {
  var layerVisibility = map.getLayoutProperty('57th_street_off', 'visibility')
  if (layerVisibility === 'visible') {
    map.setLayoutProperty('57th_street_off', 'visibility', 'none')
    map.setLayoutProperty('visibility', 'visible')
    map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'visible')
    map.setLayoutProperty('visibility', 'visible')
    map.setLayoutProperty('57th_street_FAR_fill', 'visibility', 'visible')
    map.setLayoutProperty('visibility', 'none')
  } else {
    map.setLayoutProperty('57th_street_off', 'visibility', 'visible')
    map.setLayoutProperty('visibility', 'visible')
    map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'none')
    map.setLayoutProperty('visibility', 'visible')
    map.setLayoutProperty('57th_street_FAR_fill', 'visibility', 'none')
    map.setLayoutProperty('visibility', 'none')
  }
})

// // //Building Info
$('.btn-check').on('click', function() {
	var buildingPicUrl = $(this).attr('building-pic')
  console.log(buildingPicUrl)
  $('#building-pic').empty()
  $('#building-pic').css('background-image', `url(${buildingPicUrl})`)

  var buildingName = $(this).attr('building-name')
  console.log(buildingName)
  $('#building-name').empty()
  $('#building-name').text(`${buildingName}`)
})



$('.btn-check').on('click',function () {
  $("#p1").hide();
  $("#p2").hide();
  $("#p3").hide();

    $('#btnradio1').click(function(){
        // $("#p1").onClick();
         $('#building-name').text('Sulfur Dioxide');
    });

    $("#btnradio2").click(function(){
         $("#p2").toggle();
    });

    $("#btnradio3").click(function(){
         $("#p3").toggle();
    });
    $("#btnradio4").click(function(){
         $("#p4").toggle();
    });
    $("#btnradio5").click(function(){
         $("#p5").toggle();
    });
    $("#btnradio6").click(function(){
         $("#p6").toggle();
    });
    $("#btnradio7").click(function(){
         $("#p7").toggle();
    });
});


map.on('click', function(e) {
  var skyscraper_outline = map.queryRenderedFeatures(e.point, {
    layers: ['skyscraper_outline']
  });
  if (skyscraper_outline.length > 0) {
    var hoveredFeature = skyscraper_outline[0]

    document.getElementById('Address').innerHTML = '<h4 style = "font-size:800%" "text-align:center" ><strong>' + skyscraper_outline[0].properties.Address + '</strong></h4><p><strong><em>';
    document.getElementById('NumFloors').innerHTML = 'address:<h4 style = "font-size:100%" "text-align:left">' + skyscraper_outline[0].properties.NumFloors + '</h4><p><strong><em>';
    document.getElementById('BuiltFAR').innerHTML = 'energy score:<h4 style = "font-size:600%">' + skyscraper_outline[0].properties.BuiltFAR + '</h4><p><strong><em>';
    document.getElementById('OwnerName').innerHTML = 'year built:<h4 style = "font-size:100%" "text-align:left">' + skyscraper_outline[0].properties.OwnerName+ '</h4><p><strong><em>';
    // set this feature as the data for the highlight source
    map.getSource('highlight-feature').setData(hoveredFeature.geometry);

  } else {
    document.getElementById('Address').innerHTML = '';
    document.getElementById('NumFloors').innerHTML = '';
    document.getElementById('BuiltFAR').innerHTML = '';
    document.getElementById('OwnerName').innerHTML = '';
    // reset the highlight source to an empty featurecollection
      map.getSource('highlight-feature').setData({
        type: 'FeatureCollection',
        features: []
      });
  }
});

//Highlight when hover
map.addSource('highlight-feature', {
   type: 'geojson',
   data: {
     type: 'FeatureCollection',
     features: []
   }
 })

 map.addLayer({
   id: 'highlight-line',
   type: 'line',
   source: 'highlight-feature',
   paint: {
     'line-width': 2,
     'line-opacity': 1,
     'line-color': 'black',
   }
 });
