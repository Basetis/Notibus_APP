angular.module('transportMe.controllers')

.controller('OriginCtrl', function($scope, $state, $ionicPlatform, soapTMB, $localstorage, $ionicPopup, $geolocation, $translate, $ionicViewService, $http) {

  $ionicViewService.clearHistory();
  $scope.markers = [];
  $scope.mapDefaultZoom = 16;
  $scope.busStopIcon = 'img/bus-stop.png';
  $scope.myLocation;
  $scope.myLocationIcon = 'img/my-location.png';
  $scope.infoWindow = new google.maps.InfoWindow();
  $scope.no_nearby_stops = '';
  $scope.watchId;
  $scope.lastPositionFromLoadStations;
  $scope.busIdentifiers = [];
  $scope.currentPosition;
  $scope.platform = 'Android';

  if (navigator.app !== undefined) navigator.app.clearHistory();

  // Custom "my location" control
  function MyLocationControl(controlDiv) {
    $translate("click_here_to_show_your_location_message").then(function (click_here_to_show_your_location_message) {
      // Set CSS for the control border
      var controlUI = document.createElement('div');
      controlUI.className = 'my-location-container';
      controlUI.title = click_here_to_show_your_location_message;
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior
      var controlText = document.createElement('div');
      controlText.className = 'my-location-icon';
      controlText.innerHTML = '<i class="ion-android-locate"></i>';
      controlUI.appendChild(controlText);

      // Set the map to user's current position
      google.maps.event.addDomListener(controlUI, 'click', function() {
        if ($scope.currentPosition !== undefined && $scope.currentPosition != null) {
            var cPos = new google.maps.LatLng($scope.currentPosition.coords.latitude, $scope.currentPosition.coords.longitude);
            // var cPos = new google.maps.LatLng(41.387492, 2.168839); // BCN Pl. Catalunya
            $scope.map.setCenter(cPos);
            $scope.map.setZoom($scope.mapDefaultZoom);
            $scope.myLocation.setPosition(cPos);

            loadNearbyStops($scope.currentPosition.coords);
        }

        $geolocation.currentPosition(function(position) {
          var currentPosition;

          if (typeof position !== 'undefined') {
            currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            // currentPosition = new google.maps.LatLng(41.387492, 2.168839); // BCN Pl. Catalunya

            $scope.map.setCenter(currentPosition);
            $scope.map.setZoom($scope.mapDefaultZoom);
            $scope.myLocation.setPosition(currentPosition);

            loadNearbyStops(position.coords);
          }
        });
      });
    });
  }

  // Sets the map on all markers in the array.
  function setMapOnAll(map) {
    for (var i = 0; i < $scope.markers.length; i++) {
      $scope.markers[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  function clearMarkers() {
    setMapOnAll(null);
  }

  // Shows any markers currently in the array.
  function showMarkers() {
    setMapOnAll($scope.map);
  }

  // Deletes all markers in the array by removing references to them.
  function deleteMarkers() {
    clearMarkers();
    $scope.markers = [];
  }

  function showMap() {
    // Map options
    var mapOptions = {
      zoom: $scope.mapDefaultZoom,
      panControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.LEFT_TOP
      },
      styles: {
        'featureType': 'transit.station.bus',
        'stylers': [{
            'visibility': 'off'
          }] // disable bus station icons
      }
    };

    // Create map object
    $scope.map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

    google.maps.event.addListener($scope.map,'dragend',function() {
      var c = $scope.map.getCenter();
      loadNearbyStops({
        latitude: c.G,
        longitude:c.K
      });

    });

    // Add "my location" control to map
    var centerControlDiv = document.createElement('div');
    var centerControl = new MyLocationControl(centerControlDiv);

    centerControlDiv.index = 1;
    $scope.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
  }

  function addCurrentPositionMarker(coords, moveMapToPosition) {
    // Add marker to current location
    var currentPosition = new google.maps.LatLng(coords.latitude, coords.longitude);
    // var currentPosition = new google.maps.LatLng(41.387492, 2.168839); // BCN Pl. Catalunya

    var myLocationMarkerFound = false;

    if ($scope.markers !== undefined && $scope.markers != null && $scope.markers.length > 0) {
      angular.forEach($scope.markers, function(markerValue, markerKey) {
        if (!myLocationMarkerFound && markerValue.icon == "img/my-location.png") {
          markerValue.setPosition(currentPosition);
          myLocationMarkerFound = true;
        }
      });
    }

    if (!myLocationMarkerFound) {
      $scope.myLocation = new google.maps.Marker({
        position: currentPosition,
        icon: $scope.myLocationIcon,
        map: $scope.map
      });

      $scope.markers.push($scope.myLocation);
    }

    if (moveMapToPosition) {
      $scope.map.setCenter(new google.maps.LatLng(coords.latitude, coords.longitude));
      $scope.map.setZoom($scope.mapDefaultZoom);
    }

  }

  function loadNearbyStops(coords, callback) {
    // Obtain nearby bus stops from the TMB WS
    soapTMB.GetNearBusLinesWGS84(coords.latitude, coords.longitude).then(function(lines) {
    // soapTMB.GetNearBusLinesWGS84(41.387492, 2.168839).then(function(lines) { // BCN Pl. Catalunya
      $scope.stops = [];
      $scope.indices = [];

      if (lines !== undefined && lines != null && lines.length == 0) {
        $translate("no_nearby_stops").then(function (no_nearby_stops) {
          $scope.no_nearby_stops = no_nearby_stops;
        });
      } else {
        deleteMarkers();
        addCurrentPositionMarker(coords, false);
        $scope.lastPositionFromLoadStations = coords;
      }

      // Show bus stops and bus lines that pass through them
      angular.forEach(lines, function(lineValue, lineKey) {
        if (Object.prototype.toString.call(lineValue.cartoroutes) !== '[object Array]') {
          // cartoroutes element is not an array, convert it to array for easy treatment
          var routesArray = [];
          routesArray.push(lineValue.cartoroutes);
          lineValue.cartoroutes = routesArray;
        }

        angular.forEach(lineValue.cartoroutes, function(routeValue, routeKey) {
          var cartoroute = routeValue;
          if (typeof routeValue.cartoroute !== 'undefined') {
            cartoroute = routeValue.cartoroute;
          }

          if (Object.prototype.toString.call(cartoroute.cartostops) !== '[object Array]') {
            // cartostops element is not an array, convert it to array for easy treatment
            var routeArray = [];
            routeArray.push(cartoroute.cartostops);
            cartoroute.cartostops = routeArray;
          }

          angular.forEach(cartoroute.cartostops, function(cartoValue, cartoKey) {
            if (typeof cartoValue.cartostop !== 'undefined') {
              cartoValue = cartoValue.cartostop;
            }

            var stop = cartoValue;

            // assign to line a copy of lines[key].line and not a reference to it, avoiding overriding it
            var line = JSON.parse(JSON.stringify(lineValue.line));

            line.direction = cartoroute.headsign.direction;
            line.destination = cartoroute.headsign.destination;
            line.arrivalTime = '';
            $translate("loading").then(function (loading) {
              line.arrivalTime = loading;
            });


            var stopIndex = $scope.indices.indexOf(stop.code);
            if (stopIndex === -1) {
              $scope.indices.push(stop.code);
              $scope.stops.push({
                'coordinate': stop.coordinate,
                'code': stop.code,
                'name': stop.name,
                'lines': [],
                'distanceFromPosition': app.getDistanceFromCoordsInKm(coords, {latitude: stop.coordinate.ywgs84, longitude: stop.coordinate.xwgs84})
              });
              $scope.stops[$scope.indices.length - 1].lines.push(line);

              // Add marker for the bus stop
              var stopPos = new google.maps.LatLng(stop.coordinate.ywgs84, stop.coordinate.xwgs84);
              var marker = new google.maps.Marker({
                position: stopPos,
                map: $scope.map,
                code: stop.code,
                title: stop.name,
                icon: $scope.busStopIcon,
                clickable: true
              });

              google.maps.event.addListener(marker, 'click', function() {
                $scope.infoWindow.setContent('<span>' + this.title + '</span>');
                $scope.infoWindow.open($scope.map, this);
                var selectedStopIndex = -1;
                var code = this.code;
                angular.forEach($scope.stops, function(value, index) {
                  if (value.code === code) {
                    selectedStopIndex = index;
                  }
                });
                var tempStops = $scope.stops;
                if (selectedStopIndex !== 0) {
                  var selectedStop = $scope.stops.splice(selectedStopIndex, 1)[0];
                  $scope.stops.splice(0, 0, selectedStop);
                }
                $scope.selectBusStop(0, code, true);
              });

              $scope.markers.push(marker);

            } else {
              if ($scope.stops[stopIndex].lines.indexOf(line) == -1) {
                $scope.stops[stopIndex].lines.push(line);
              }
            }

          });
        });
      });

      soapTMB.SetCachedNearbyStopsMarkers($scope.markers);

      // end main each
      $scope.stops.sort(compareDistancesInArray);
      soapTMB.SetCachedNearbyStops($scope.stops);
      // TODO: Do I need to arrange indices array?
      $scope.indices.splice(0, $scope.indices.length);
      angular.forEach($scope.stops, function(v, k) {
        $scope.indices.push(v.code);
      });

      if (callback !== undefined && callback != null) {
        callback();
      }

    });
  }

  function compareDistancesInArray(a,b) {
    if (a.distanceFromPosition < b.distanceFromPosition)
      return -1;
    if (a.distanceFromPosition > b.distanceFromPosition)
      return 1;
    return 0;
  }

  function addDOMEventListeners() {
    ionic.EventController.on('pause', onPause, document);
    ionic.EventController.on('resume', onResume, document);
    ionic.EventController.on('DOMNodeInserted', captureGMapClicks, document);
  }
  function removeDOMEventListeners() {
    ionic.EventController.off('pause', onPause, document);
    ionic.EventController.off('resume', onResume, document);
    ionic.EventController.off('DOMNodeInserted', captureGMapClicks, document);
  }

  function captureGMapClicks(e) {
     var url, ele;

     if(e.target.className=="gmnoprint"){
         for(var i = 0; i < document.getElementsByClassName('gm-style')[0].getElementsByTagName("a").length;i++){
             ele = document.getElementsByClassName('gm-style')[0].getElementsByTagName("a")[i]
             url = ele.getAttribute('href');
             ele.removeAttribute('href');
             ele.removeAttribute('target');
             if(url!=null) {
                assignIonicEvent(url, ele)
             }
         }
     }

     function assignIonicEvent(url, ele) {
         ionic.EventController.on('click', onClick, ele);
         function onClick() {
             navigator.app.loadUrl(url, { openExternal:true } );
             return false;
         }
     }
  }

  $ionicPlatform.ready(function() {
    var cachedPosition;
    if (typeof device !== "undefined") {
      $scope.platform = device.platform;
    }

    showMap();
    addDOMEventListeners();

    $translate("searching_bus_stops").then(function (searching_bus_stops) {
      $scope.no_nearby_stops = searching_bus_stops; //"Cercant parades properes...";
    });

    cachedPosition = $localstorage.getObject("lastPosition");
    if (cachedPosition !== undefined && cachedPosition != null) {
      refreshMapData(cachedPosition, reloadMapDataOnCurrentPosition);
    } else {
      reloadMapDataOnCurrentPosition();
    }

  });

  function reloadMapDataOnCurrentPosition() {
    $geolocation.currentPosition(function(position) {
      if (typeof position !== 'undefined' && position !== null) {
        $scope.currentPosition = position;
        var cachedPosition = $localstorage.getObject("lastPosition");
        var distance = 999;
        if (cachedPosition !== undefined && cachedPosition != null) {
          distance = app.getDistanceFromCoordsInKm($scope.currentPosition.coords, cachedPosition.coords);
        }
        if (distance > 0.010) {
          soapTMB.ClearCachedNearbyStops();
          refreshMapData(position);
        }
        watchPosition();
      }
    });
  }

  function refreshMapData(position, callback) {
    deleteMarkers();
    addCurrentPositionMarker(position.coords, true);
    $scope.map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
    $scope.map.setZoom($scope.mapDefaultZoom);
    if(soapTMB.GetCachedNearbyStopsMarkers().length == 0) {
      loadNearbyStops(position.coords, callback);
    } else {
      angular.forEach(soapTMB.GetCachedNearbyStopsMarkers(), function(marker, key) {
        marker.setMap($scope.map);
      });
      $scope.stops = [];
      angular.forEach(soapTMB.GetCachedNearbyStops(), function(stop, key) {
        $scope.stops.push(stop);
      });
    }
  }

  function watchPosition() {
    if ($scope.watchId !== undefined && $scope.watchId != null) {
      $geolocation.clearWatch($scope.watchId);
    }
    $scope.watchId = $geolocation.watchPosition(function(position) {
      if (position !== undefined && position != null) {
        $localstorage.setObject("lastPosition", position);

        $scope.currentPosition = position;
        addCurrentPositionMarker(position.coords, false);
      }

    });
  }
  function onPause() {
    //console.log("onPause");
    if ($scope.watchId !== undefined && $scope.watchId != null) {
      $geolocation.clearWatch($scope.watchId);
    }
  }

  function onResume() {
    //console.log("onResume");
    watchPosition();
  }

  $scope.selectBusStop = function(index, stopCode, fromMap) {
    $translate("loading").then(function (loading) {
      angular.forEach($scope.stops, function(stopValue, stopKey) {
        if (stopValue.code == stopCode) {
          angular.forEach(stopValue.lines, function(lineValue, lineKey) {
            lineValue.arrivalTime = loading;
            var lineStorageKey = lineValue.code+"-"+lineValue.direction;
            var cachedLineStops = $localstorage.getObject(lineStorageKey);
            if (cachedLineStops == null) {
              soapTMB.GetDirectionShapeAndStops(lineValue.code, lineValue.direction)
                .then(function(lineStops) {
                  $localstorage.setObject(lineStorageKey, lineStops);
                });
            }
          });
        }
      });
    });

    if ($scope.selectedBusStopIndex !== index || fromMap) {
      $scope.selectedBusStopIndex = index;
      $scope.selectedBusLineIndex = undefined;
      if (fromMap) {
        $scope.$apply();
      }

      var selectedStop = null;
      angular.forEach($scope.markers, function(value, index) {
        if (value.code === stopCode) {
          selectedStop = value;
        }
      });

      if (selectedStop) {
        $scope.infoWindow.setContent('<span>' + selectedStop.title + '</span>');
        $scope.infoWindow.open($scope.map, selectedStop);
      }

      // Pass the current stop's code to destination controller by local storage
      $localstorage.set('currentStopCode', stopCode);

      $translate("loading").then(function (loading) {
        soapTMB.GetArrivalTimesByStopCode(stopCode).then(function(arrivalTimes) {
          // TODO: No mostrar Cargando cuando arrivalTimes llega a null
          angular.forEach(arrivalTimes, function(arrivalTimeValue, arrivalTimeKey) {
            if (arrivalTimeValue.arrivalTime !== undefined && arrivalTimeValue.arrivalTime != null) {
            $scope.busIdentifiers.push(
                {
                  busLine: arrivalTimeValue.lineCode,
                  routeId: arrivalTimeValue.routeId,
                  arrivalTime: arrivalTimeValue.arrivalTime
                }
              );
            }
            angular.forEach($scope.stops, function(stopValue, stopKey) {
              if (stopValue.code == stopCode) {
                angular.forEach(stopValue.lines, function(lineValue, lineKey) {
                  if (lineValue.code == arrivalTimeValue.lineCode) {
                    if (lineValue.arrivalTime == loading) {
                      lineValue.arrivalTime = arrivalTimeValue.roundedArrivalTime;
                    } else {
                      lineValue.arrivalTime += ", " + arrivalTimeValue.roundedArrivalTime;
                    }
                  }
                });
              }
            });
          });
        });
      });

    } else {
      $scope.selectedBusStopIndex = undefined;
    }
  };

  $scope.selectBusLine = function($index, linecode, direction, lineDestination) {

    if ($scope.watchId !== undefined && $scope.watchId != null) {
      $geolocation.clearWatch($scope.watchId);
    }
    $scope.selectedBusLineIndex = $index;

    // Pass the line code and the direction to next page using local storage
    $localstorage.setObject(
      'selectedLine', {
        linecode: linecode,
        direction: direction,
        lineDestination: lineDestination
      }
    );

    var selectedBusIdentifiers = [];
    if ($scope.busIdentifiers !== undefined && $scope.busIdentifiers != null && $scope.busIdentifiers.length > 0) {
      angular.forEach($scope.busIdentifiers, function(bus, busKey) {
        if (linecode == bus.busLine) {
          selectedBusIdentifiers.push(bus);
        }
      });
    }
    var idSelectedBus = null;
    if (selectedBusIdentifiers.length > 0) {
      angular.forEach(selectedBusIdentifiers, function(bus, busKey) {
        if (idSelectedBus == null) {
          idSelectedBus = bus;
        } else {
          if (bus.arrivalTime < idSelectedBus.arrivalTime) {
            idSelectedBus = bus;
          }
        }
      });
    }
    if (idSelectedBus != null) {
      $localstorage.setObject('idSelectedBus', {
        routeId: idSelectedBus.routeId,
        arrivalTime: idSelectedBus.arrivalTime
      });
    }

    removeDOMEventListeners();
    soapTMB.ClearCachedDataForDestinationScreen();

    $state.go('destination'); // Navigate to destination page
  };

  $scope.shareLove = function() {
      var url = 'https://eatags.com/evernote_webhook/webhook_transportme_share?lang=' + app.language + '&platform='+device.platform;

      $http.get(url).
        then(function(response) { // success
          var d = response.data;
          window.plugins.socialsharing.share(d.msg, d.subject, d.img, d.url);
        }, function(response) { // fail
          $translate("share_love_subject").then(function (share_love_subject) {
            $translate("share_love_message").then(function (share_love_message) {
              var shareUrl = 'https://apple.com';
              if (device.platform=='Android') {
                shareUrl = 'https://play.google.com/store/apps/details?id=com.basetis.transportme';
              }
              window.plugins.socialsharing.share(share_love_message, share_love_subject, 'http://notibusapp.com/img/mobile_1.png', shareUrl);
            });
          });
        });
  };
});
