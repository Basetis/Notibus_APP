angular.module('transportMe.controllers')

.controller('RouteCtrl', function($scope, $state, $ionicPlatform, $translate, $localstorage,
                                  $geolocation, $cordovaVibration, $ionicPopup,
                                  $cordovaLocalNotification, $translate, $http, $ionicViewService, soapTMB) {

  $ionicViewService.clearHistory();
  $scope.mapDefaultZoom                = 17;
  $scope.distanceToNotificationStop    = 0.1;
  $scope.distanceToDestinationStop     = 0.2;
  $scope.millisecondsToRefreshLocation = 7000;
  $scope.isVibrationActive             = $localstorage.getObject('routeSettings').alerts.vibration;
  $scope.isSoundActive                 = $localstorage.getObject('routeSettings').alerts.sound;
  $scope.numberOfStops                 = $localstorage.getObject('routeSettings').stops;
  $scope.destinationStops              = $localstorage.getObject('destinationStops').stops;
  $scope.routeCoords                   = $localstorage.getObject('destinationStops').routeCoords;
  $scope.destinationCoordinates        = $scope.destinationStops[$scope.destinationStops.length - 1].coordinates;
  $scope.alertCoordinates              = $scope.destinationStops[$scope.destinationStops.length - 1 - $scope.numberOfStops].coordinates;
  $scope.isPaused                      = false;
  $scope.distanceToAlert               = 0;
  $scope.alertShown                    = false;
  $scope.currentStopCode               = $localstorage.get('currentStopCode');
  $scope.selectedLine                  = $localstorage.getObject('selectedLine');
  $scope.myLocationIcon                = 'img/my-location.png';
  $scope.infoWindow                    = new google.maps.InfoWindow();
  $scope.lastPosition;

  //var isOnRoute = true;

  $ionicPlatform.ready(function() {
    addDOMEventListeners();

    // Get current position using HTML5 geolocation
    $geolocation.currentPosition(function(position) {
      if (typeof position !== 'undefined' && position !== null) {
        showMap(position.coords);

        ionic.EventController.on('DOMNodeInserted', function(e){
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
        });

      }
    });

    if (typeof device !== "undefined" && device.platform == "Android") {
      AndroidWear.onConnect(function(e) {
        AndroidWear.onDataReceived(e.handle, function(e) {
          if (e !== undefined && e != null) {
            if (e.data !== undefined && e.data != null && e.data.length > 0)
            {
              var dataArray = e.data.split(";");
              if (dataArray.length > 1)
              {
                var action = dataArray[0];
                var actionValue = dataArray[1];
                if (action == "WEAR_STOPS_FOREWARNING_CHANGED")
                {
                  var tempSettings = $localstorage.getObject("routeSettings");
                  tempSettings.stops = actionValue;
                  $localstorage.setObject("routeSettings", tempSettings);
                }
              }
            }
          }
        });
      });
    }

  });

  function watchPosition() {
    if (app.watchId !== undefined && app.watchId != null) {
      return; // we have already watchPosition running
    }
    app.watchId = $geolocation.watchPosition(function(position) {
      if (position !== undefined && position != null && position)
      {
        // console.log('watchPosition: ' + app.watchId);
        var distanceFromLastPosition = 0;
        if ($scope.lastPosition === undefined || $scope.lastPosition == null) {
          $scope.lastPosition = position;
          $localstorage.setObject("lastPosition", position);
        }
        if ($scope.lastPosition !== undefined && $scope.lastPosition != null) {
          distanceFromLastPosition = app.getDistanceFromCoordsInKm(position.coords, $scope.lastPosition.coords);
        }

        if (distanceFromLastPosition < 0.002) { // do things only if movement > 2 meters
          return;
        }

        $scope.lastPosition = position;

        //console.log(position.coords.latitude + " - " + position.coords.longitude + " - " + position.timestamp);



        // WEAR
        if (typeof device !== "undefined" && device.platform == "Android") {
          calculateNearestBusStop(position);
          sendDataToAndroidWear();
        }
        // WEAR

        if (!cordova.plugins.backgroundMode.isEnabled()) {
          var currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.map.setCenter(currentPosition);
          $scope.myLocation.setPosition(currentPosition);
        }

        $scope.distanceToAlert = app.getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, $scope.alertCoordinates.latitude, $scope.alertCoordinates.longitude);
        $scope.distanceToDestination = app.getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, $scope.destinationCoordinates.latitude, $scope.destinationCoordinates.longitude);

        $scope.$apply();

        // We are in close to the notification stop
        if (!$scope.alertShown && $scope.distanceToAlert <= $scope.distanceToNotificationStop) {
          $scope.alertShown = true;

          // Remove permanent notification
          $cordovaLocalNotification.clearAll();

          // Notification
          if ($cordovaLocalNotification.hasPermission($scope)) {

            // App open
            if (!$scope.isPaused) {
              // Show popup alert
              $translate(["you_are_n_stops_from_destination_message", "warning"], {stops: $scope.numberOfStops}).then(function (translations) {
                $ionicPopup.alert({
                  title: translations.warning,
                  content: translations.you_are_n_stops_from_destination_message
                });
              });
            }

            $translate("you_are_n_stops_from_destination_message", {stops: $scope.numberOfStops}).then(function (you_are_n_stops_from_destination_message) {
              $cordovaLocalNotification.schedule({
                id: 2,
                text: you_are_n_stops_from_destination_message,
                sound: (!$scope.isSoundActive) ? '' : 'res://platform_default'
              });
            });

          } else {
            // No permission => Popup

            // With sound
            if ($scope.isSoundActive) {
              // With sound
              $translate("you_are_n_stops_from_destination_message", {stops: $scope.numberOfStops}).then(function (you_are_n_stops_from_destination_message) {
                $cordovaLocalNotification.schedule({
                  id: 2,
                  text: you_are_n_stops_from_destination_message
                });
              });
            }

            $translate("you_should_activate_notifications_in_your_phone_message").then(function (activate_notifications_message) {
              $ionicPopup.alert({
                title: 'Error',
                content: activate_notifications_message
              });
            });
          }

          // Vibration
          if ($scope.isVibrationActive) {
            $cordovaVibration.vibrate(300);
          }

        } else
        if ($scope.distanceToDestination <= $scope.distanceToDestinationStop) {
          // We're close to destination stop, stop watch position
          if (app.watchId !== undefined && app.watchId != null) {
            $geolocation.clearWatch(app.watchId);
            app.watchId = null;
          }
          logOnServer();
          // Notification
          $translate(["you_have_arrived_at_your_destination_message", "warning"]).then(function (translations) {
            $cordovaLocalNotification.update({
              id: 1,
              sound: (!$scope.isSoundActive) ? '' : 'res://platform_default',
              text: translations.you_have_arrived_at_your_destination_message
            });

            $ionicPopup.alert({
              title: translations.warning,
              content: translations.you_have_arrived_at_your_destination_message
            })
              .then(function (res) {
                clearLocalStorage();
                soapTMB.ClearCachedNearbyStops();
                $cordovaLocalNotification.clearAll();
                cancelAndroidWear();
                removeDOMEventListeners();
                cordova.plugins.backgroundMode.disable();
                $state.go('origin');
              });
          });

          // Vibration
          if ($scope.isVibrationActive) {
            $cordovaVibration.vibrate(300);
          }
        }
      }

    });
  }

  // prevent hardware back button action
  $ionicPlatform.registerBackButtonAction(function() {
    // if ($ionicHistory.currentView().stateName !== "origin") { // for ionic 1.1 $ionicHistory should be injected
    if ($ionicViewService.getCurrentView().stateName !== "origin") {
      // $ionicHistory.goBack(1); // for ionic 1.1
      navigator.app.backHistory();
      console.log("registerBackButtonAction");
      removeDOMEventListeners();
    } else {
      ionic.Platform.exitApp();
    }
  }, 100);

  // If permanent notification is closed by click, relaunch it
  $scope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
    if (notification.id == 1) {
      $cordovaLocalNotification.schedule(notification);
    }
  });

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
        'featureType': 'transit.station.bus',
        'stylers': [{
          'visibility': 'off'
        }] // disable bus station icons
      }
    };

    // Create map object
    $scope.map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

    // Add marker to current location
    var currentPosition = new google.maps.LatLng(coords.latitude, coords.longitude);
    // var currentPosition = new google.maps.LatLng(41.387492, 2.168839); // BCN Pl. Catalunya
    $scope.myLocation = new google.maps.Marker({
      position: currentPosition,
      icon: $scope.myLocationIcon,
      map: $scope.map
    });

    // Draw remaining stops' markers
    var color = "#dc2e2a";
    var colorName = "red";
    if ($scope.selectedLine.linecode.indexOf("H") !== -1) {
      color = "#0d418d";
      colorName = "blue";
    } else if ($scope.selectedLine.linecode.indexOf("V") !== -1) {
      color = "#73b432";
      colorName = "green";
    } else if ($scope.selectedLine.linecode.indexOf("D") !== -1) {
      color = "#971d83";
      colorName = "purple";
    }
    var busStopIcon = 'img/bus-stop-' + colorName + '.png';

    for (var i = 0; i < $scope.destinationStops.length; i++) {
      var stopIcon = busStopIcon;

      if (i === 0) {
        stopIcon = 'img/icono-bus-' + colorName + '.png';
      } else if (i == $scope.destinationStops.length - 1) {
        stopIcon = 'img/icono-destino-' + colorName + '.png';
      }

      var stopMarker = new google.maps.Marker({
        position: new google.maps.LatLng($scope.destinationStops[i].coordinates.latitude, $scope.destinationStops[i].coordinates.longitude),
        icon: stopIcon,
        map: $scope.map,
        clickable: true,
        visible: true,
        title: $scope.destinationStops[i].name,
        stopIndex: i
      });

      google.maps.event.addListener(stopMarker, 'click', function() {
        $scope.infoWindow.setContent('<span>' + this.title + '</span>');
        $scope.infoWindow.open($scope.map, this);
      });
    }

    // Draw route
    for (var i = 0; i < $scope.routeCoords.length; i++) {
      $scope.routeCoords[i] = new google.maps.LatLng($scope.routeCoords[i].G, $scope.routeCoords[i].K);
    }

    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
    };

    var route = new google.maps.Polyline({
      path: $scope.routeCoords,
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

    // Add "my location" control to map
    var centerControlDiv = document.createElement('div');
    var centerControl = new MyLocationControl(centerControlDiv);

    centerControlDiv.index = 1;
    $scope.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);

    watchPosition();
  }

  function calculateNearestBusStop(position) {
    if ($localstorage.getObject('destinationStops') == null) return;
    if ($localstorage.getObject('currentStopCode') == null) return;

    var distancesFromPositionToBusStops = [];
    var minDistance = 9999999;
    var dist = 0;
    var minDistanceBusStopCode = -1;

    angular.forEach($localstorage.getObject('destinationStops').stops, function(value, key) {
      if (value.code != $localstorage.getObject('currentStopCode')) {
        //dist = getDistanceFromCoordsInKm(position.coords, value.coordinates);
        dist = app.getDistanceFromCoordsInKm(position.coords, value.coordinates);

        if (minDistance > dist) {
          minDistance = dist;
          minDistanceBusStopCode = value.code;
        }
      }
    }, null);

    if (minDistance <= 0.01) {
      // If nearest stop is at less than 10 meters, we will consider new currentStop
      $localstorage.setObject('currentStopCode', minDistanceBusStopCode);
    }

    var stopsFromNearestToDestination = 1; // starts on 1 because we are counting from next bus stop from Origin
    var l = $localstorage.getObject('destinationStops').stops.length;
    var nearestFound = false;
    for (i = 0; i < l; i++) {
        if (nearestFound) {
          stopsFromNearestToDestination++;
        }
        if (minDistanceBusStopCode == $localstorage.getObject('destinationStops').stops[i].code) {
          nearestFound = true;
        }
    }

    $localstorage.setObject('stopsFromNearestToDestination', stopsFromNearestToDestination);
  }

  function sendDataToAndroidWear() {

    if ($localstorage.getObject('routeSettings') == null) return;
    if ($localstorage.getObject('destinationStops') == null && $localstorage.getObject('stopsFromNearestToDestination') == null) return;

    AndroidWear.onConnect(function(e) {
      var busStopsLeft =
        ($localstorage.getObject('stopsFromNearestToDestination') == null) ?
          $localstorage.getObject('destinationStops').stops.length - 1 :
          $localstorage.getObject('stopsFromNearestToDestination');

      var stopsForewarning = $localstorage.getObject('routeSettings').stops;

      var data = {
        key: "BUS_STOP_LEFT",
        busStopsLeft: busStopsLeft,
        stopsForewarning: stopsForewarning,
        silent: false,
        language: app.language
      };

      AndroidWear.sendData(e.handle, JSON.stringify(data));
    });
  }

  $scope.$on('$cordovaLocalNotification:click',
    function(event, notification, state) {
      if ($state.current.name !== 'route') {
        // Go to route page when notification is clicked and show alert
        $state.go('route');
        $translate(["you_are_n_stops_from_destination_message", "warning"], {stops: $scope.numberOfStops}).then(function (translations) {
          $ionicPopup.alert({
            title: translations.warning,
            content: translations.you_are_n_stops_from_destination_message
          });
        });
      }
    });

  function addDOMEventListeners() {
    console.log("addDOMEventListeners");
    ionic.EventController.on('pause', onPause, document);
    ionic.EventController.on('resume', onResume, document);
  }
  function removeDOMEventListeners() {
    console.log("removeDOMEventListeners");
    ionic.EventController.off('pause', onPause, document);
    ionic.EventController.off('resume', onResume, document);
  }

  function onPause() {
    console.log("Route onPause");
    $scope.isPaused = true;
    /*
    if ($scope.watchId !== undefined && $scope.watchId != null) {
      $geolocation.clearWatch($scope.watchId);
    }
    */
    if (typeof cordova !== "undefined") {
      cordova.plugins.backgroundMode.configure({
        silent: true
      });
      cordova.plugins.backgroundMode.enable();
    }
  }

  function onResume() {
    console.log("Route onResume");
    // Just in case, disabling "heavy tasks in background" notification
    cordova.plugins.backgroundMode.configure({
      silent: true
    });
    $scope.isPaused = false;
    cordova.plugins.backgroundMode.disable();
    watchPosition();
  }

  $scope.notificationStop = function() {
    return $scope.destinationStops.length - 1 - $scope.numberOfStops;
  };

  function clearLocalStorage() {
    // Don't clear recent stops!!
    var recentStops = $localstorage.getObject('recentStops');
    $localstorage.clear();
    $localstorage.setObject('recentStops',recentStops);
  }

  function logOnServer() {
    var ruid = $localstorage.get('rideUniqueID');
    if (ruid !== undefined && ruid != null && ruid != "") {
      var url = URL_WEB_SERVICE_LOG_ON;
      url += "ruid=" + ruid;

      $http.get(url).
        then(function(response) {
          console.log("success");
          //console.log(response);
        }, function(response) {
          console.log("fail");
          //console.log(response);
        });
    }
  }

  $scope.back2notifications = function() {
    removeDOMEventListeners();
    $state.go('notifications');
  }

  $scope.cancelRoute = function() {
    $translate(["cancel", "you_are_going_to_cancel_your_route_message"]).then(function (translations) {
      $ionicPopup.confirm({
        title: translations.cancel,
        content: translations.you_are_going_to_cancel_your_route_message
      }).then(function(res) {
        if (res) {
          logOnServer();
          clearLocalStorage();
          soapTMB.ClearCachedNearbyStops();
          if (app.watchId !== undefined && app.watchId != null) {
            $geolocation.clearWatch(app.watchId);
            app.watchId = null;
          }
          $cordovaLocalNotification.clearAll();
          cancelAndroidWear();
          //isOnRoute = false;
          removeDOMEventListeners();
          cordova.plugins.backgroundMode.disable();
          $state.go('origin');
        } else {
          return;
        }
      });
    });
  };

  $ionicPlatform.ready(function() {
    if (typeof device !== "undefined" && device.platform == "Android") {
      AndroidWear.onConnect(function(e) {
        AndroidWear.onDataReceived(e.handle, function(e) {
          if (e !== undefined && e != null) {
            if (e.data !== undefined && e.data != null && e.data.length > 0)
            {
              var dataArray = e.data.split(";");
              if (dataArray.length > 1)
              {
                var action = dataArray[0];
                var actionValue = dataArray[1];
                if (action == "WEAR_STOPS_FOREWARNING_CHANGED")
                {
                  var tempSettings = $localstorage.getObject("routeSettings");
                  tempSettings.stops = actionValue;
                  $localstorage.setObject("routeSettings", tempSettings);
                }
              }
            }
          }
        });
      });
    }
  });

  function cancelAndroidWear() {
    if (typeof device !== "undefined" && device.platform == "Android") {
      AndroidWear.onConnect(function(e) {
        var data = {
          key: "CANCEL_TRANSPORTME"
        }
        AndroidWear.sendData(e.handle, JSON.stringify(data));
      });
    }
  }

  $scope.goToPromos = function() {
    $state.go('promo');
  };
});