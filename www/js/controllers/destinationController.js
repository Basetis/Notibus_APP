angular.module('transportMe.controllers')

.controller('DestinationCtrl', function($scope, $state, soapTMB, $localstorage, $ionicLoading, $ionicPopup, $geolocation, $translate) {

  $scope.myLocation;
  $scope.markers = [];
  $scope.mapDefaultZoom = 15;
  $scope.myLocationIcon = 'img/my-location.png';
  $scope.infoWindow = new google.maps.InfoWindow();
  $scope.selectedLine = $localstorage.getObject('selectedLine');
  $scope.currentStopCode = $localstorage.get('currentStopCode');
  $scope.linecode = $scope.selectedLine.linecode;
  $scope.lineDestination = $scope.selectedLine.lineDestination;
  $scope.request = {};
  $scope.lineRouteCoords = [];
  $scope.lineRouteCoordsGroupedByStop = [];
  $scope.lineRouteStopsCoords = [];
  $scope.currentStopIndex;
  $scope.currentStopIndexRoute;
  $scope.lineRouteCoordsNext = [];

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
        $geolocation.currentPosition(function(position) {
          var currentPosition;

          if (typeof position !== 'undefined' && position !== null) {
            currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            // currentPosition = new google.maps.LatLng(41.387492, 2.168839); // BCN Pl. Catalunya

            $scope.map.setCenter(currentPosition);
            $scope.map.setZoom($scope.mapDefaultZoom);
            $scope.myLocation.setPosition(currentPosition);
          }
        });
      });
    });
  }

  // Custom show entire route control
  function EntireRouteControl(controlDiv) {

    $translate("click_here_to_see_the_entire_route_message").then(function (click_here_to_see_the_entire_route) {
      // Set CSS for the control border
      var controlUI = document.createElement('div');
      controlUI.className = 'entire-route-container';
      controlUI.title = click_here_to_see_the_entire_route;
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior
      var controlText = document.createElement('div');
      controlText.className = 'my-location-icon';
      controlText.innerHTML = '<i class="ion-map"></i>';
      controlUI.appendChild(controlText);

      // Show map including the entire route
      google.maps.event.addDomListener(controlUI, 'click', function() {
        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < $scope.markers.length; i++) {
            bounds.extend($scope.markers[i].getPosition());
        }
        $scope.map.setCenter(bounds.getCenter());
        $scope.map.fitBounds(bounds);

        // Set a minimum zoom
        //if there is only 1 marker or all markers are on the same address map will be zoomed too much.
        if ($scope.map.getZoom() > $scope.mapDefaultZoom) {
            $scope.map.setZoom($scope.mapDefaultZoom);
        }
      });
    });
  }

  function showLoadingSpinner() {
    // Show spinner while loading
    $scope.loading = $ionicLoading.show({
      content: '<i class="icon ion-loading-a"></i>',
      animation: 'fade-in',
      showBackdrop: false,
      maxWidth: 50,
      showDelay: 0
    });
  }

  function hideLoadingSpinner() {
    // Hide loading spinner
    $scope.loading.hide();
  }

  function showMap(coords) {
    // Map options
    var mapOptions = {
      center: {
        lat: coords.latitude,
        lng: coords.longitude
        // lat: 41.387492, // BCN Pl. Catalunya
        // lng: 2.168839
      },
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
        "featureType": "transit.station.bus",
        "stylers": [{
          "visibility": "off"
        }] // disable bus station icons
      }
    };

    hideLoadingSpinner();

    // Create map object
    $scope.map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

    // Add marker to current location
    var currentPosition = new google.maps.LatLng(coords.latitude, coords.longitude);
    // var currentPosition = new google.maps.LatLng(41.387492, 2.168839); // BCN Pl. Catalunya
    $scope.myLocation = new google.maps.Marker({
      position: currentPosition,
      icon: $scope.myLocationIcon,
      map: $scope.map,
      visible: true
    });

    $scope.markers.push($scope.myLocation);

    // Draw bus line's route on the map
    var color = "#dc2e2a";
    var colorName = "red";
    if ($scope.linecode.indexOf("H") !== -1) {
      color = "#0d418d";
      colorName = "blue";
    } else if ($scope.linecode.indexOf("V") !== -1) {
      color = "#73b432";
      colorName = "green";
    } else if ($scope.linecode.indexOf("D") !== -1) {
      color = "#971d83";
      colorName = "purple";
    }
    $scope.busStopIcon = 'img/bus-stop-' + colorName + '.png';

    // Add markers for past stops
    for (var i = 0; i < $scope.currentStopIndex; i++) {

      var stopMarker = new google.maps.Marker({
        position: $scope.lineRouteStopsCoords[i],
        icon: 'img/bus-stop-disabled.png',
        map: $scope.map,
        clickable: false,
        visible: true,
        stopIndex: i
      });

      $scope.markers.push(stopMarker);
    }

    // Add markers for next stops
    for (var i = $scope.currentStopIndex; i < $scope.lineRouteStopsCoords.length; i++) {
      var stopIcon = '';

      if ($scope.destinationStops[i].code == $scope.currentStopCode) {
        stopIcon = 'img/icono-bus-' + colorName + '.png';
        // stopIcon = 'img/bus-stop.png';
      } else if (i == ($scope.lineRouteStopsCoords.length - 1)) {
        stopIcon = 'img/icono-destino-' + colorName + '.png';
      } else {
        stopIcon = $scope.busStopIcon;
      }

      var stopMarker = new google.maps.Marker({
        position: $scope.lineRouteStopsCoords[i],
        icon: stopIcon,
        map: $scope.map,
        clickable: true,
        visible: true,
        stopIndex: i
      });
      google.maps.event.addListener(stopMarker, 'click', function() {
        var stopCode = $scope.destinationStops[this.stopIndex].code;
        var stopName = $scope.destinationStops[this.stopIndex].name;
        $translate("destination_stop").then(function (destination_stop) {
          $ionicPopup.confirm({
            title: destination_stop,
            content: stopName
          }).then(function(res) {
            if (res) {
              $scope.selectDestinationStop(stopCode, stopName);
            } else {
              return;
            }
          });
        });
      });
      $scope.markers.push(stopMarker);
    };

    // Hide some stop markers on zoom out
    google.maps.event.addListener($scope.map, 'zoom_changed', function() {
      var isVisible = this.getZoom() >= $scope.mapDefaultZoom;

      // Hide markers on zoom out. Current location is at position i = 0
      for (var i = 1; i < $scope.markers.length - 1; i++) {
        if ($scope.destinationStops[i-1].code !== $scope.currentStopCode) {
          $scope.markers[i].setMap(isVisible ? $scope.map : null);
        }
      }
    });

    // Add "my location" control to map
    var centerControlDiv = document.createElement('div');
    var centerControl = new MyLocationControl(centerControlDiv);

    centerControlDiv.index = 1;
    $scope.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);

    var lineRouteCoordsNext = [];
    var lineRouteCoordsPast = [];

    for (var i = 0; i < $scope.lineRouteCoords.length; i++) {
      if (i <= $scope.currentStopIndexRoute) {
        lineRouteCoordsPast.push($scope.lineRouteCoords[i]);
        if (i == $scope.currentStopIndexRoute) {
          // Add current stop coordinates
          $scope.lineRouteCoordsNext.push($scope.lineRouteCoords[i]);
        }
      } else {
        lineRouteCoordsNext.push($scope.lineRouteCoords[i]);
        $scope.lineRouteCoordsNext.push($scope.lineRouteCoords[i]);
      }
    }

    // Add button to center the map visualizing the entire route
    var entireRouteControlDiv = document.createElement('div');
    var entireRouteControl = new EntireRouteControl(entireRouteControlDiv);

    entireRouteControlDiv.index = 1;
    $scope.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(entireRouteControlDiv);


    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
    };

    var flightPath = new google.maps.Polyline({
      path: lineRouteCoordsNext,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: $scope.map,
      icons: [{
        icon: lineSymbol,
        repeat:'120px',
        offset: '100%'
      }]
    });

    flightPath.setMap($scope.map);

    var flightPath2 = new google.maps.Polyline({
      path: lineRouteCoordsPast,
      geodesic: true,
      strokeColor: "#969ba2",
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: $scope.map,
      icons: [{
        icon: lineSymbol,
        repeat:'120px',
        offset: '100%'
      }]
    });
  }

  $scope.loadMap = function() {
    showLoadingSpinner();

    $geolocation.currentPosition(function(position) {
      if (typeof position !== 'undefined') {
        showMap(position.coords);
        $scope.lineRouteCoordsNext = [];
      }
    });
  };

  $scope.active = 'item1';
  $scope.currentStopDefined = false;
  $scope.selectableStopsDict = [];

  $scope.setActive = function(type) {
    $scope.active = type;
    if (type === 'item3') {
      $scope.loadMap();
    }
  };

  $scope.isActive = function(type) {
    return type === $scope.active;
  };

  $scope.clearSearch = function() {
    $scope.request.query = '';
    $scope.searchedDestinationStops = '';
  };

  $scope.enableOrDisableStop = function(stopCode) {

    if (stopCode != $scope.currentStopCode) {
      if (!$scope.currentStopDefined) { //Previous stop
        $scope.selectableStopsDict[stopCode] = false;

        return 'disable-stop-name';
      } else { //Next stops
        $scope.selectableStopsDict[stopCode] = true;

        if (stopCode == $scope.destinationStops[$scope.destinationStops.length-1].code) { // Last stop
          $scope.currentStopDefined = false;
        }

        return '';
      }
    } else { // Current stop
        $scope.selectableStopsDict[stopCode] = false;

        return $scope.lineColor("color");
    }
  };

  $scope.defineCurrentStop = function(stopCode) {

    if (stopCode == $scope.currentStopCode) {
      if (stopCode == $scope.destinationStops[$scope.destinationStops.length-1].code) { // Current stop is last stop
        $scope.currentStopDefined = false;
      } else {
        $scope.currentStopDefined = true;
      }
      return 'current-stop-name';
    }
  };

  $scope.selectDestinationStop = function(stopCode, stopName) {
    if (!$scope.selectableStopsDict[stopCode]) {
      $translate("you_need_to_select_a_subsequent_stop_message").then(function (you_need_to_select_a_subsequent_stop_message) {
        $ionicPopup.alert({
          title: 'Error',
          content: you_need_to_select_a_subsequent_stop_message
        }).then(function(res) {
          // ..
        });
      });
    } else {
      var destinationStopIndex = -1;
      var finalDestinationStopCode = -1;
      var finalDestinationStopName = "";
      for (var i = $scope.currentStopIndex; i < $scope.destinationStops.length; i++) {
        if ($scope.destinationStops[i].code === stopCode) {
          destinationStopIndex = i;
          finalDestinationStopCode = stopCode;
          finalDestinationStopName = $scope.destinationStops[i].name;
        }

        // Store line route coordinates to the next station
        for (var j = 0; destinationStopIndex === -1 && j < $scope.lineRouteCoordsGroupedByStop[i].length; j++) {
          $scope.lineRouteCoordsNext.push($scope.lineRouteCoordsGroupedByStop[i][j]);
        }
      }

      // Pass the notification stops to next page
      var stops = [];
      for (var i = $scope.currentStopIndex; i <= destinationStopIndex; i++) {
        stops.push($scope.destinationStops[i]);
      }

      $localstorage.setObject(
        "destinationStops",
        {
          "stops": stops,
          "routeCoords": $scope.lineRouteCoordsNext,
          "finalDestinationStop": finalDestinationStopCode,
          "finalDestinationStopName": finalDestinationStopName

        }
      );

      $state.go('notifications');
    }
  };

  var accentsTidy = function(s){
    var r=s.toLowerCase();
    r = r.replace(new RegExp(/\s/g),"");
    r = r.replace(new RegExp(/[àáâãäå]/g),"a");
    r = r.replace(new RegExp(/æ/g),"ae");
    r = r.replace(new RegExp(/ç/g),"c");
    r = r.replace(new RegExp(/[èéêë]/g),"e");
    r = r.replace(new RegExp(/[ìíîï]/g),"i");
    r = r.replace(new RegExp(/ñ/g),"n");
    r = r.replace(new RegExp(/[òóôõö]/g),"o");
    r = r.replace(new RegExp(/œ/g),"oe");
    r = r.replace(new RegExp(/[ùúûü]/g),"u");
    r = r.replace(new RegExp(/[ýÿ]/g),"y");
    r = r.replace(new RegExp(/\W/g),"");
    return r;
  };

  $scope.searchStop = function() {
    $scope.searchedDestinationStops = [];
    var query = accentsTidy($scope.request.query);
    if (query !== null && query !== "") {
      var lineStopsNames = $scope.destinationStops;

      lineStopsNames.filter(function(element, index) {
        if (element.code == $scope.currentStopCode) {
          $scope.currentStopIndex = index;
        }
      });

      angular.forEach(lineStopsNames, function(value, key){
        if (key > $scope.currentStopIndex) {
          if (value.code == query) {
            value.name = value.name.replace(/['"]+/g, '');
            $scope.searchedDestinationStops.push(value);
          } else if (accentsTidy(value.name).indexOf(query) !== -1) {
            value.name = value.name.replace(/['"]+/g, '');
            $scope.searchedDestinationStops.push(value);
          }
        }
      });
    }
  };

  $scope.loadLineStops = function() {
    if (soapTMB.GetCachedDataForDestinationScreen().destinationStops !== undefined) {
      var cachedData = soapTMB.GetCachedDataForDestinationScreen();
      if (cachedData.destinationStops.length > 0) {
        $scope.destinationStops = cachedData.destinationStops;
        $scope.currentStopIndex = cachedData.currentStopIndex;
        $scope.lineRouteStopsCoords = cachedData.lineRouteStopsCoords;
        $scope.lineRouteCoords = cachedData.lineRouteCoords;
        $scope.lineRouteCoordsGroupedByStop = cachedData.lineRouteCoordsGroupedByStop;
        $scope.currentStopIndexRoute =cachedData.currentStopIndexRoute
        return;
      }
    }

    showLoadingSpinner();

    // Get selected line from Local storage
    if (typeof $scope.linecode !== 'undefined' &&
        typeof $scope.selectedLine.direction !== 'undefined')
    {
      var cachedLineStops = $localstorage.getObject($scope.linecode+"-"+$scope.selectedLine.direction);
      if (cachedLineStops !== undefined && cachedLineStops != null) {
        processLineStops(cachedLineStops);
      } else {
        soapTMB.GetDirectionShapeAndStops($scope.linecode,$scope.selectedLine.direction)
          .then(processLineStops);
      }

    } else {
      console.error('Line code and direction not set.');
    }
  };

        function processLineStops(lineStops) {

          var lineStopsNames = [];

          for (var i = 0; i < lineStops.length; i++) {

            lineStopsNames.push({
              "name": lineStops[i].sourcestop.name.replace(/['"]+/g, ''),
              "code": lineStops[i].sourcestop.code,
              "coordinates": {
                "latitude": lineStops[i].sourcestop.coordinate.ywgs84,
                "longitude": lineStops[i].sourcestop.coordinate.xwgs84
              }
            });

            if (lineStops[i].sourcestop.code == $scope.currentStopCode) {
              $scope.currentStopIndex = i;
            }

            // Store coordinate of the current stop
            $scope.lineRouteStopsCoords.push(
              new google.maps.LatLng(
                lineStops[i].sourcestop.coordinate.ywgs84,
                lineStops[i].sourcestop.coordinate.xwgs84)
              );

            // Store the destination stop
            if (i === lineStops.length - 1) {
              $scope.lineRouteStopsCoords.push(
                new google.maps.LatLng(
                  lineStops[i].destinationstop.coordinate.ywgs84,
                  lineStops[i].destinationstop.coordinate.xwgs84
                )
              );
            }

            // Store line route coordinates to the next station
            for (var j = 0; j < lineStops[i].coordinates.length; j++) {
              $scope.lineRouteCoords.push(
                new google.maps.LatLng(
                  lineStops[i].coordinates[j].ywgs84,
                  lineStops[i].coordinates[j].xwgs84
                )
              );

              // Store coordinates grouped by stop
              if (typeof $scope.lineRouteCoordsGroupedByStop[i] === 'undefined') {
                $scope.lineRouteCoordsGroupedByStop[i] = [];
              }
              $scope.lineRouteCoordsGroupedByStop[i].push(
                new google.maps.LatLng(
                  lineStops[i].coordinates[j].ywgs84,
                  lineStops[i].coordinates[j].xwgs84
                )
              );
            }

            if (typeof $scope.currentStopIndex === 'undefined') {
              $scope.currentStopIndexRoute = $scope.lineRouteCoords.length - 1;
              if (lineStops[i].destinationstop.code == $scope.currentStopCode) {
                $scope.currentStopIndex = i+1;
              }
            }

            if (i === lineStops.length - 1) {
              $scope.lineRouteCoords.push(
                new google.maps.LatLng(
                  lineStops[i].destinationstop.coordinate.ywgs84,
                  lineStops[i].destinationstop.coordinate.xwgs84
                )
              );

              // Store coordinates grouped by stop
              $scope.lineRouteCoordsGroupedByStop[i].push(
                new google.maps.LatLng(
                  lineStops[i].destinationstop.coordinate.ywgs84,
                  lineStops[i].destinationstop.coordinate.xwgs84
                )
              );
            }
          }

          lineStopsNames.push({
            "name": lineStops[lineStops.length-1].destinationstop.name.replace(/['"]+/g, ''),
            "code": lineStops[lineStops.length-1].destinationstop.code,
            "coordinates": {
              "latitude": lineStops[lineStops.length-1].destinationstop.coordinate.ywgs84,
              "longitude": lineStops[lineStops.length-1].destinationstop.coordinate.xwgs84
            }
          });

          hideLoadingSpinner();

          $scope.destinationStops = lineStopsNames;
          soapTMB.SetCachedDataForDestinationScreen(
            $scope.destinationStops,
            $scope.currentStopIndex,
            $scope.lineRouteStopsCoords,
            $scope.lineRouteCoords,
            $scope.lineRouteCoordsGroupedByStop,
            $scope.currentStopIndexRoute
          );
        }

  $scope.lineColor = function(type, item) {
    if (!item || $scope.isActive(item)) {
      if ($scope.linecode.indexOf("H") !== -1) {
        return "bus-blue-" + type;
      } else if ($scope.linecode.indexOf("V") !== -1) {
        return "bus-green-" + type;
      } else if ($scope.linecode.indexOf("D") !== -1) {
        return "bus-violet-" + type;
      } else {
        return "bus-red-" + type;
      }
    }

    return "";
  };

});