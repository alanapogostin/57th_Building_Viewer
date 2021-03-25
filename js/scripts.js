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

})



$('.btn-check').on('click',function () {
    $('#btnradio1').click(function(){
        // $("#p1").onClick();
         $('#building-name').text('252 e 57th');
         $('#building-text').text('252 East 57th Street is a mixed use modernist style residential skyscraper in Midtown Manhattan, New York City, developed by the World Wide Group and Rose Associates, Inc. The building has a total of 436,000 sq ft of floor area.');
    });

    $("#btnradio2").click(function(){
        $('#building-name').text('Big Tetrahedron Building');
        $('#building-text').text('The Big Tetrahedron Building, also known as VIA 57 West, is a 41-story building  designed by the Danish Architect Bjarke Ingels of the BIG Group. The building is known for its unique pyrimid, or "tetrahedron" shape.');
    });

    $("#btnradio4").click(function(){
         $('#building-name').text('432 Park Ave');
         $('#building-text').text('432 Park Avenue is a residential skyscraper at 57th Street and Park Avenue in Midtown Manhattan in New York City, overlooking Central Park. The 1,396-foot-tall (425.5 m) tower was developed by CIM Group and Harry B. Macklowe and designed by Rafael Viñoly. It features 125 condominiums as well as amenities such as a private restaurant for residents.');
    });
    $("#btnradio5").click(function(){
         $('#building-name').text('220 Central Park South');
         $('#building-text').text('220 Central Park South was designed by Robert A.M. Stern Architects and SLCE Architects, with interiors designed by Thierry Despont. The limestone facade is intended to blend in with other buildings around Central Park. The building was constructed in 1954 on top of a site of rent-stabilized appartments.');
    });
    $("#btnradio6").click(function(){
         $('#building-name').text('Steinway Tower');
         $('#building-text').text('Steinway Tower, located on 111 West 57th Street, is a residential skyscraper developed by by JDS Development Group and Property Markets Group. Steinway Tower consists of two sections: Steinway Hall, a 16-story former Steinway & Sons store at the buildings base designed by Warren and Wetmore, and a newer 84-story, 1,428-foot tower adjacent to Steinway Hall, designed by SHoP Architects. The building is expected to be completed by the end of this year.');
    });
    $("#btnradio8").click(function(){
         $('#building-name').text('One57');
         $('#building-text').text('One57, formerly known as Carnegie 57, was completed in 2014 and constructed by Extell Development Company and designed by Christian de Portzamparc. Extell CEO Gary Barnett started acquiring One57s site in 1998, although building plans were not filed until 2009. One57 held the spot as the tallest residential building, until 432 Park Ave was constructed.');
    });
    $("#btnradio9").click(function(){
         $('#building-name').text('Helena 57 West');
         $('#building-text').text('Helena 57 West was built in 2005 by The Durst Organization. The entire block that the building sits on is owned by The Durst Organization. There are a total of 597-units in the building.');
    });
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
