/* MAP */
var map, infowindow, autocomplete, bounds, maploaded=false;

function initmap() {
    var mapcanvas = document.getElementById('map-canvas');
    
    if(mapcanvas !== null) {
        
        map = new google.maps.Map(mapcanvas, {
            center: new google.maps.LatLng(40.99103957222095, -98.06201537499999),
            zoom: 4,
            fullscreenControl: false,
            mapTypeControl: false,
            panControl: false,
            streetViewControl: false,
            zoomControl: false,
            /* old
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                    style: google.maps.ZoomControlStyle.DEFAULT
                },
            */
            styles: [
                {
                    "featureType": "all",
                    "elementType": "all",
                    "stylers": [
                        {
                            "hue": "#0089ff"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "lightness": 50
                        },
                        {
                            "visibility": "simplified"
                        }
                    ]
                },
                {
                    "featureType": "road",
                    "elementType": "labels",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                }
            ],
            maxZoom: 23,
            minZoom: 2,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    
        // BOUNDS
        bounds = new google.maps.LatLngBounds();
    
        infowindow = new google.maps.InfoWindow();
        google.maps.event.addListener(map, 'click', clickedAddress);
        google.maps.event.addListener(infowindow, 'closeclick', removeLocation);
    
        // AUTOCOMPLETE ELEMENT	FROM HTML	
        // push the searchbox html into the map
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('searchbox'));
    
        // AUTOCOMPLETE INPUT ELEMENT
        autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-searchbox-input'), {
            types: ['geocode'],
            componentRestrictions: {
                country: 'us'
            }
        });
        autocomplete.bindTo('bounds', map);
    
        // AUTOCOMPLETE LISTENER ON PLACE CHANGED
        google.maps.event.addListener(autocomplete, 'place_changed', placeChanged);
    
        // CENTER POINT ELEMENT FROM HTML
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('point'));
        // listening in jquery after map loads
    
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(document.getElementById('zooms'));
        
        // 'map says loaded' should preceed 'initmap complete!' in console, othewise tabbing `selects` unnecessary invisible elements in map
        maploaded = google.maps.event.addListenerOnce(map, 'idle', function(){
            console.log('map says loaded');
            return true;
        });
  
    }

}

function zoomIn() {
    map.setZoom(map.getZoom() + 1);
}

function zoomOut() {
    map.setZoom(map.getZoom() - 1);
}

function clickedAddress(event) {
    document.getElementById('latitude').value = event.latLng.lat();
    document.getElementById('longitude').value = event.latLng.lng();
    findAddress(event.latLng);
}

function clickedPoint() {
    var center = map.getCenter();
    document.getElementById('latitude').value = center.lat();
    document.getElementById('longitude').value = center.lng();
    findAddress(center);
}

function findAddress(point) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        latLng: point
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                setLocation(results[0], point);
            }
        }
    });
}

function placeChanged() {
    var place = autocomplete.getPlace();
    // if no geometry ignore the rest
    if (!place.geometry) {
        return;
    }
    var point = document.getElementById('map-canvas').getElementsByClassName('point')[0];
    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        point.focus();
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(23);
        point.focus();
    }
}

function setLocation(obj, point) {
    var state, st, city;
    var searchbox = document.getElementById('search-searchbox-input');

    for (var i = 0; i < obj.address_components.length; i++) {
        if (obj.address_components[i].types[0] == 'administrative_area_level_1') {
            state = obj.address_components[i].long_name;
            st = obj.address_components[i].short_name;
        }
        if (obj.address_components[i].types[0] == 'locality') {
            city = obj.address_components[i].long_name;
        }
    }

    var address = obj.formatted_address.split(',');
    // get the last item in array which is country
    var pop = address.pop();
    // make sure the value is uppercase and trim whitespace
    var isUSA = (pop.toUpperCase().trim() !== 'USA') ? false : true;

    // we limit to USA points, if isUSA is false, trigger an error animation by adding class
    if (!isUSA) {
        searchbox.classList.add('-novalidate');
        searchbox.focus();
        return false;
    }
    // its a US address or click point
    searchbox.classList.remove('-novalidate');

    // update location(hidden input)
    var el = document.getElementById('location');
    el.value = city + ', ' + st;
    el.classList.add('-hasvalue');// here to indicate the required field has been filed
    var pointmarker = document.getElementById('point');
    pointmarker.classList.add('-hasvalue');// here to change the icon type

    // update state field
    document.getElementById('state').value = state;

    // drop the USA part (its redundant)
    var formatted = address.slice(0, address.length);
    // join the array with breaks to make it fit in the map area nicer for small devices
    var formatted_br = formatted.join(',<br>');

    // the location hint also shows the address only without <br>
    var lh = document.getElementById('location-hint');
    var innertext = formatted.join(',')
    lh.innerHTML = '<button type="button" class="closechip round" title="Remove location" onclick="clearLocation()"><i data-icon="close"></i></button>' + innertext;


    // open infowindow and pan click point to center
    infowindow.setContent(formatted_br);
    infowindow.setPosition(point);
    map.panTo(point);
    infowindow.open(map);
    createSnackbar('<i data-icon="gps_fixed"></i>New location set', 'Dismiss');

    // reset the search input
    searchbox.value = "";
    //searchbox.focus();
    pointmarker.querySelector('.point').focus();
}

function removeLocation(showsnackbar) {
    document.getElementById('search-searchbox-input').focus();
    // reverse of what we did in setLocation
    var el = document.getElementById('location');
    el.value = "";
    el.classList.remove('-hasvalue');
    
    var pointmarker = document.getElementById('point');
    pointmarker.classList.remove('-hasvalue');
    
    document.getElementById('state').value = '';
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    // varies per click
    var lh = document.getElementById('location-hint');
    lh.innerText = '';

    if(showsnackbar){
        createSnackbar('<i data-icon="gps_not_fixed"></i>Location removed', 'Dismiss');
    }
}

function clearLocation(){
    if (infowindow !== undefined) {
        infowindow.close();
        removeLocation(true);
    }        
}

function resetLocation(){
    if (infowindow !== undefined) {
        infowindow.close();
        removeLocation(false);
    }     
}
/* END MAP */

/*Map*/
function load_googlemap_js() {
    var body = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDOiuE-IJmTBMoYSiTCItKpm_E7q2k8qlE&libraries=places&callback=initmap';
    body.appendChild(script);
}
load_googlemap_js();

function scrollToActive(){
    if($('.active').length > 0){
        var node = $('.active:first');
        var top = node.offset().top;
        var height = node.prop('scrollHeight')
        // buffer keeps the active element on screen
        var buffer = $(window).height() / 2;
        // larger nodes need to be split
        if(height > (buffer/2) ){
            buffer = buffer - (height/2);
        }
        $('html, body').animate({
            scrollTop: top - buffer
        }, 350);
    }
}

//jquery map functions
jQuery(document).ready(function($) {
    
    $('.paper-spinner').toggleClass('active');
    $('.spinner-container').toggleClass('active');
    
    /* MAP AFTER LOAD */
    var listener_count = 0;
    function mapListener() {
        // get rid of the tab index on focusable elements, set search and zoom
        maploaded = (!maploaded) ? false : maploaded;
        
        if (!maploaded && listener_count < 5) {
            window.setTimeout(function() {
                console.log('searching for anchors...');
                // wait a bit, edge browser is sloooow.
                listener_count++;
                mapListener();
            }, 2000);
        } else {
            if(listener_count > 4){
                console.log('no-map!');
            }else{
                console.log('initmap complete!');
            }
            
            $('.paper-spinner').toggleClass('active');
            $('.spinner-container').toggleClass('active');
            
            // set all map anchors to no tab
            var maps = $('.form-element-map');
            var motion = maps.find('.gm-style div:first');
            var input = maps.find('.form-element-field:first');
            
            // dropshowdow highlight
            input
                .on('focus',function(){
                    $('.search-searchbox-shadow').toggleClass('-isfocused');
                })
                .on('blur', function(){
                    $('.search-searchbox-shadow').toggleClass('-isfocused');
                });

            $('.point')
                .on('click', function(e) {
                    e.preventDefault();
                    $(this).focus();
                    clickedPoint();
                });
            $('.zoomin')
                .on('click', function(e) {
                    e.preventDefault();
                    zoomIn();
                });
            $('.zoomout')
                .on('click', function(e) {
                    e.preventDefault();
                    zoomOut();
                });
                
            maps.find('.form-element-field:first, .point, .zoomin, .zoomout')
                .on('keydown', function(e) {
                    // directional controls listener
                    // enter
                    if (e.keyCode == 13) {
                        $('.point').trigger('focus');
                        e.preventDefault();
                        return false;
                    // up, down, left, right arrows, plus, minus operators
                    }else if(e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 107 || e.keyCode == 109 || e.keyCode == 189){
                        if($('.pac-container:first').is(":visible")){
                            // no arrows if the location type ahead is visable
                            return;
                        }
                        // else focus on the directional controls div
                        motion.trigger('focus');
                    }
                });
            // focusable elements that are not useful on a form 
            // first div and iframe
            motion.addClass('-notab')                
                .on('keydown', function(e){
                    e.preventDefault;
                    scrollToActive();
                    if(e.keyCode == 32){
                        clickedPoint();
                    }
                })
                .next()
                .addClass('-notab');
                // next() takes care of the iframe focus
              
            // notab all anchors as it is form element, (google logo, credits)  
            maps.find('.gm-style a').addClass('-notab');
            
            // all .-notab elements are tab hidden
            maps.find('.-notab').attr('tabindex','-1');
        }
    }
    mapListener();
    
    // aria typeahead should be aware of the drop down list
    $('#search-searchbox-input')
        .on('keydown', function(){
            var input = $(this);
            input.attr('aria-autocomplete', 'both');
            
            var typeahead = $(document).find('.pac-container');

            typeahead_id = (!typeahead.is('[id]')) ? 'list_' + input.attr('name') : typeahead.attr('id');
            typeahead.attr({'role':'listbox','id': typeahead_id});
            // assign ownership
            input.attr('aria-owns', typeahead_id);
            // look into the list assign options
            typeahead.find('.pac-item').each(function(i){
                var item = $(this);
                item.attr({'role': 'option','id': typeahead_id + '_item_' + i});
                if(!item.hasClass('pac-item-selected')){
                    input.attr('aria-activedescendant','');
                }
            });
        })
        .on('keyup', function(){
            var typeahead = $(document).find('.pac-container');
            if(typeahead.find('.pac-item-selected') !== undefined){
                //console.log('SELECTED %s', typeahead.find('.pac-item-selected').attr('id'));
                $(this).attr('aria-activedescendant', typeahead.find('.pac-item-selected').attr('id'));
            }           
        });    
});