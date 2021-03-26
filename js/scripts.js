mapboxgl.accessToken = 'pk.eyJ1IjoiYXNwOTA4OSIsImEiOiJja2xrMHk3ZW01Mmk2MnZucmFrM3podmh3In0.qZ1N12EiB17J56BQ5Oy5QQ'

// opening modal on page load
$(document).ready(function(){
    $("#exampleModal").modal('show');
});
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

  // Adding empty layer
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
      'line-color': 'black',
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
    layers: ['57th_street_floors_fill', 'skyscraper_outline'],
  });

  if (features.length > 0) {

    var hoveredFeature = features[0];
    var Address = hoveredFeature.properties.Address;
    var NumFloors = hoveredFeature.properties.NumFloors;
    var FAR = hoveredFeature.properties.BuiltFAR;
    var OwnerName = hoveredFeature.properties.OwnerName;

    var popupContent = `
      <div>
        <b> ${Address}</b><br/>
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

//Adding in Floor legend
map.on('load', function() {
  var layers = ['0-20', '20-40', '40-60', '60-80', '80+', 'Skyscrapers'];
  var colors = ['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000', 'black'];

  for (i = 0; i < layers.length; i++) {
    var layerFloor = layers[i];
    var colorFloor = colors[i];
    var item = document.createElement('div');
    var key = document.createElement('span');
    key.className = 'legend-key-1';
    key.style.backgroundColor = colorFloor;
    var value = document.createElement('span');
    value.innerHTML = layerFloor;
    item.appendChild(key);
    item.appendChild(value);
    legend.appendChild(item);
  }
});

/// FAR and Floor Button Connection

$('.btn-check#btnradioNumFloors').on('click', function() {
  var layerVisibility = map.getLayoutProperty('57th_street_floors_fill', 'visibility')
  //  if (layerVisibility === 'visible') {
  map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'visible')
  //map.setLayoutProperty('visibility', 'visible')
  map.setLayoutProperty('57th_street_off', 'visibility', 'none')
  //map.setLayoutProperty('visibility', 'visible')
  //   }
})


// turn off layer
$('.btn-check#btnradioOFF').on('click', function() {
  var layerVisibility = map.getLayoutProperty('57th_street_off', 'visibility')
  //if (layerVisibility === 'visible') {
  map.setLayoutProperty('57th_street_off', 'visibility', 'visible')
  //map.setLayoutProperty('visibility', 'visible')
  map.setLayoutProperty('57th_street_floors_fill', 'visibility', 'none')
  //  map.setLayoutProperty('visibility', 'visible')
  // }
})

map.on('load', function() {
  var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616793991754!6m8!1m7!1sCAoSLEFGMVFpcFAydjlrNEVzZXROaDhodnZmV0xlMU54RjR3REJtU1V1bWZiMmU4!2m2!1d40.76684274273518!2d-73.9766364282417!3f243.55614702429799!4f23.352566159782498!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
  $('#building-pic').empty()
  $('#building-pic').html(streetviewIframeCode)
})

$('.btn-check').on('click', function() {
  $('#btnradio1').click(function() {
    // $("#p1").onClick();
    $('#building-name').text('252 e 57th');
    $('#building-text').text('252 East 57th Street is a mixed use modernist style residential skyscraper in Midtown Manhattan, New York City, developed by the World Wide Group and Rose Associates, Inc. The building has a total of 436,000 sq ft of floor area.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616720061015!6m8!1m7!1solmMBqWODVs5BynUGrY9Og!2m2!1d40.7590908835685!2d-73.96550381647552!3f310.46249877336686!4f52.671057075068006!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.99164928273365, 40.77096097471898],
      "zoom": 15.5
    });
  });


  $("#btnradio2").click(function() {
    $('#building-name').text('Big Tetrahedron Building');
    $('#building-text').text('The Big Tetrahedron Building, also known as VIA 57 West, is a 41-story building  designed by the Danish Architect Bjarke Ingels of the BIG Group. The building is known for its unique pyrimid, or "tetrahedron" shape.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616721059731!6m8!1m7!1sORWOgJwHApEX-6sCZTFGPg!2m2!1d40.77211443117792!2d-73.99363484185407!3f141.41587227542627!4f20.138134998705723!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').empty()
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.99323831851291, 40.771821105468526],
      "zoom": 15.5
    });
  });

  $("#btnradio4").click(function() {
    $('#building-name').text('432 Park Ave');
    $('#building-text').text('432 Park Avenue is a residential skyscraper at 57th Street and Park Avenue in Midtown Manhattan in New York City, overlooking Central Park. The 1,396-foot-tall (425.5 m) tower was developed by CIM Group and Harry B. Macklowe and designed by Rafael Viñoly. It features 125 condominiums as well as amenities such as a private restaurant for residents.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616721151608!6m8!1m7!1s_S5cyMMXWtL7crrp33eVCw!2m2!1d40.76127213063792!2d-73.97205055455967!3f15.286090492905696!4f56.08728513782489!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').empty()
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.97176020174729, 40.761737408528056],
      "zoom": 15.5
    });
  });
  $("#btnradio5").click(function() {
    $('#building-name').text('220 Central Park South');
    $('#building-text').text('220 Central Park South was designed by Robert A.M. Stern Architects and SLCE Architects, with interiors designed by Thierry Despont. The limestone facade is intended to blend in with other buildings around Central Park. The building was constructed in 1954 on top of a site of rent-stabilized appartments.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616721206853!6m8!1m7!1snGRtsyeRjKZ_sdTk7xgopg!2m2!1d40.76733361619728!2d-73.98007103036878!3f202.25514752355!4f47.29894444977293!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').empty()
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.98115133200699, 40.76772659198911],
      "zoom": 15.5
    });
  });
  $("#btnradio6").click(function() {
    $('#building-name').text('Steinway Tower');
    $('#building-text').text('Steinway Tower, located on 111 West 57th Street, is a residential skyscraper developed by by JDS Development Group and Property Markets Group. Steinway Tower consists of two sections: Steinway Hall, a 16-story former Steinway & Sons store at the buildings base designed by Warren and Wetmore, and a newer 84-story, 1,428-foot tower adjacent to Steinway Hall, designed by SHoP Architects. The building is expected to be completed by the end of this year.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616721252327!6m8!1m7!1sCAoSLEFGMVFpcFBRN3ZEcFhLb3Vpb0JfYXAwTXhtS1lrMzhMWjlPUF9zSmxUc01n!2m2!1d40.7648392!2d-73.9779892!3f82.75415537404595!4f38.17179484624219!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').empty()
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.9779032338546, 40.76493171695457],
      "zoom": 15.5
    });
  });
  $("#btnradio8").click(function() {
    $('#building-name').text('One57');
    $('#building-text').text('One57, formerly known as Carnegie 57, was completed in 2014 and constructed by Extell Development Company and designed by Christian de Portzamparc. Extell CEO Gary Barnett started acquiring One57s site in 1998, although building plans were not filed until 2009. One57 held the spot as the tallest residential building, until 432 Park Ave was constructed.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616721316225!6m8!1m7!1snSNoBmvstsfBbpHLXF8MuA!2m2!1d40.76524640269782!2d-73.97940967071713!3f49.62740778983144!4f59.42949705978526!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').empty()
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.979125145501, 40.76557477497466],
      "zoom": 15.5
    });

  });
  $("#btnradio9").click(function() {
    $('#building-name').text('Helena 57 West');
    $('#building-text').text('Helena 57 West was built in 2005 by The Durst Organization. The entire block that the building sits on is owned by The Durst Organization. There are a total of 597-units in the building.');
    var streetviewIframeCode = `<iframe src="https://www.google.com/maps/embed?pb=!4v1616721384722!6m8!1m7!1s1f26u8DIAwLVg5ti1WQKiQ!2m2!1d40.77048970983957!2d-73.99179948642852!3f35.46209677011075!4f44.6213411037572!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
    $('#building-pic').empty()
    $('#building-pic').html(streetviewIframeCode)
    map.flyTo({
      center: [-73.99178283385433, 40.771012509194534],
      "zoom": 15.5
    });
  });
});
