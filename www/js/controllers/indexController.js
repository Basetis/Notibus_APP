angular.module('transportMe.controllers')

.controller('IndexCtrl', function($scope, $state, $ionicPopup, $translate, $ionicModal, $geolocation, $ionicPlatform, $localstorage) {

/*
  $scope.myGoBack = function() {
    console.log("myGoBack");

    navigator.app.backHistory();
  }
*/
  $scope.sendFeedback = function() {

    $translate(["contact", "contact_us", "cancel", "write", "mail_title"]).then(function (translations) {

      var myPopup = $ionicPopup.show({
        title: translations.contact,
        subTitle: translations.contact_us,
        buttons: [
          {
            text: translations.cancel,
            onTap: function(e) {
              return true;
            }
          },
          {
            text: translations.write,
            type: 'button-positive',
            onTap: function(e) {
              cordova.plugins.email.isAvailable(
              function (isAvailable) {
                  if (isAvailable) {
                    cordova.plugins.email.open({
                        to:      'notibus.suport@gmail.com',
                        subject: translations.mail_title,
                    });
                  }
              });
              return true;
            }
           }
          ]
      });
    });
  };

  $scope.showAbout = function() {
    $state.go('about');
  };


  $ionicPlatform.ready(function($scope) {
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
                var getData = function(position) {
                  return {
                      key: "POSITION_TO_WEAR",
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    };
                };

                if (action == "WEAR_ASK_FOR_POSITION")
                {
                  var position = $localstorage.getObject("lastPosition");
                  if (position !== undefined && position != null) {
                    AndroidWear.sendData(e.handle, JSON.stringify(getData(position)));
                  } else { // getPosition from device
                    $geolocation.currentPosition(function(position) {
                      if (typeof position !== 'undefined' && position !== null) {
                        AndroidWear.sendData(e.handle, JSON.stringify(getData(position)));
                      } else {
                        AndroidWear.sendData(e.handle, JSON.stringify({key: "POSITION_TO_WEAR_ERROR"}));
                      }
                    });
                  }
                } else
                if (action == "WEAR_ASK_FOR_BUS_STOPS_LEFT")
                {
                  if ($localstorage.getObject('routeSettings') == null) return;
                  if ($localstorage.getObject('destinationStops') == null && $localstorage.getObject('stopsFromNearestToDestination') == null) return;

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
                }
              }
            }
          }
        });
      });
    }
  });

});