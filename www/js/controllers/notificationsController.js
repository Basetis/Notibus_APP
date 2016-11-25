angular.module('transportMe.controllers')

.controller('NotificationsCtrl', function($scope, $state, $localstorage, $translate, $ionicPlatform, $http, $cordovaLocalNotification) {

  $scope.notificationTypes = [];
  $scope.circleImg = 'img/round-clipart-white-round-md.png';
  $scope.firstOptionSelected = false;

  // Translate literals
  // $translate("alert_only_message").then(function (alert_only_message) {
  //   $scope.notificationTypes.push({
  //     name: alert_only_message,
  //     img: $scope.circleImg,
  //     ioniconClass: 'ion-android-textsms'
  //   });
  // });
  $translate("vibration_message").then(function (vibration_message) {
    $scope.notificationTypes.push({
      name: vibration_message,
      img: $scope.circleImg,
      ioniconClass: 'ion-android-phone-portrait'
    });
  });
  $translate("sound_alert_message").then(function (sound_alert_message) {
    $scope.notificationTypes.push({
      name: sound_alert_message,
      img: $scope.circleImg,
      ioniconClass: 'ion-android-notifications'
    });
  });

  $scope.isNotificationActive = true; // Always true
  $scope.isVibrationActive    = $localstorage.getObject('routeSettings') ? $localstorage.getObject('routeSettings').alerts.vibration : true; // Default: true
  $scope.isSoundActive        = $localstorage.getObject('routeSettings') ? $localstorage.getObject('routeSettings').alerts.sound : true; // Default: true
  $scope.numberOfStops        = $localstorage.getObject('routeSettings') ? $localstorage.getObject('routeSettings').stops : 1; // Default: 2

  // Translate notification times literals
  $scope.notificationTimes = [];

  $translate("one_stop_before_message").then(function (one_stop_before_message) {
    $scope.notificationTimes.push({
      name: one_stop_before_message,
      img: $scope.circleImg,
      elemNb: ''
    });
  });
  $translate("two_stops_before_message").then(function (two_stops_before_message) {
    $scope.notificationTimes.push({
      name: two_stops_before_message,
      img: $scope.circleImg,
      elemNb: ''
    });
  });
  $translate("three_stops_before_message").then(function (three_stops_before_message) {
    $scope.notificationTimes.push({
      name: three_stops_before_message,
      img: $scope.circleImg,
      elemNb: 'notification-time-last-elem'
    });
  });

  $ionicPlatform.ready(function($scope) {
    saveToStorage();
  });


  $scope.disableWhenNotEnoughStops = function($index, numberOfStops) {

    var numStopsLeftAtLeast = $localstorage.getObject('destinationStops').stops.length - 1;
    var routeSettings = $localstorage.getObject('routeSettings');

    if (numStopsLeftAtLeast <= $index) {
      return 'disabled';
    }

    if (numStopsLeftAtLeast < routeSettings.stops && $index === 0) {
      routeSettings.stops = 1;
      $localstorage.setObject('routeSettings', routeSettings);
      $scope.firstOptionSelected = true;
      return 'selected';
    }

    if ($index === numberOfStops - 1 || ($scope.firstOptionSelected == true && $index === 0)) {
      return 'selected';
    } else {
      return 'unselected';
    }
  }

  $scope.notificationTypeClass = function($index) {
    if ($index === 0) {
      return $scope.isVibrationActive ? 'white' : 'red';
    } else if ($index === 1) {
      return $scope.isSoundActive ? 'white' : 'red';
    }
  };

  $scope.selectNotificationType = function($index) {
    switch ($index) {
      case 0:
        $scope.isVibrationActive = !$scope.isVibrationActive;
        break;
      case 1:
        $scope.isSoundActive = !$scope.isSoundActive;
        break;
      default:
        break;
    }

    saveToStorage();
  };

  $scope.selectNotificationTime = function($index) {

    $scope.firstOptionSelected = false;

    var numStopsLeftAtLeast    = $localstorage.getObject('destinationStops').stops.length - 1;
    var isNotificationDisabled = numStopsLeftAtLeast <= $index;

    if (!isNotificationDisabled) {
      switch ($index) {
        case 0:
          $scope.numberOfStops = 1;
          break;
        case 1:
          $scope.numberOfStops = 2;
          break;
        case 2:
          $scope.numberOfStops = 3;
          break;
        default:
          $scope.numberOfStops = 1;
          break;
      }
    }

    saveToStorage();
  };

  function saveToStorage() {

    $localstorage.setObject('routeSettings', {
      'alerts': {
        'vibration': $scope.isVibrationActive,
        'sound': $scope.isSoundActive
      },
      'stops': $scope.numberOfStops
    });

  }

  function logOnServer() {
    if ($localstorage.get('rideUniqueID') !== undefined && $localstorage.get('rideUniqueID') != null) {
      return;
    }
    var selectedLine = $localstorage.getObject('selectedLine');
    var stopCode = $localstorage.get('currentStopCode');
    var finalDestinationStop = $localstorage.getObject('destinationStops').finalDestinationStop;
    var idSelectedBus = $localstorage.getObject("idSelectedBus");

    var routeId = (idSelectedBus !== undefined && idSelectedBus != null) ? idSelectedBus.routeId : -1;
    var arrivalTime = (idSelectedBus !== undefined && idSelectedBus != null) ? idSelectedBus.arrivalTime : -1;

    var url = URL_WEB_SERVICE_LOGIN;
    url += "selectedLine=" + selectedLine.linecode;
    url += "&direction=" + selectedLine.direction;
    url += "&stopCode=" + stopCode;
    url += "&finalDestinationStop=" + finalDestinationStop;
    url += "&routeId=" + routeId;
    url += "&arrivalTime=" + arrivalTime;

    $http.get(url).
      then(function(response) {
        console.log("success");
        //console.log(response);
        var ruid = response.data;
        if (ruid !== undefined && ruid != null) $localstorage.set('rideUniqueID', ruid);
      }, function(response) {
        console.log("fail");
        //console.log(response);
      });
  }

  function saveRecent() {

    var stopCode = $localstorage.get('currentStopCode');
    var lineCode = $localstorage.getObject('selectedLine').linecode;
    var direction = $localstorage.getObject('selectedLine').direction;
    var finalDestinationStop = $localstorage.getObject("destinationStops").finalDestinationStop;
    var finalDestinationStopName = $localstorage.getObject("destinationStops").finalDestinationStopName;

    var currentStop = {
      stopCode: stopCode,
      lineCode: lineCode,
      direction: direction,
      finalDestinationStop: finalDestinationStop,
      finalDestinationStopName: finalDestinationStopName
    };

    var recentStops = $localstorage.getObject("recentStops");
    if (recentStops === undefined || recentStops == null) recentStops = [];

    var stopFoundInRecentStops = false;
    angular.forEach(recentStops, function(stopValue, stopKey) {
      if (!stopFoundInRecentStops) {
        if (lineCode == stopValue.lineCode && direction == stopValue.direction && finalDestinationStop == stopValue.finalDestinationStop) {
          stopFoundInRecentStops = true;
        }
      }
    });

    if (!stopFoundInRecentStops) {
      recentStops.unshift(currentStop);
    }

    if (recentStops.length > 10) {
      recentStops.splice(-1,1); // save only 10 recent stops
    }

    $localstorage.setObject('recentStops', recentStops);

  }

  $scope.acceptNotificationParams = function() {
    // WEAR
    if (typeof device !== "undefined" && device.platform == "Android") {
      AndroidWear.onConnect(function(e) {
         var data = {
           key: "BUS_STOP_LEFT",
           busStopsLeft: $localstorage.getObject('destinationStops').stops.length - 1,
           stopsForewarning: $localstorage.getObject('routeSettings').stops,
           silent: false,
           language: app.language
         };

        AndroidWear.sendData(e.handle, JSON.stringify(data));
        AndroidWear.sendData(e.handle, JSON.stringify({key: "WAKE_UP_WEAR"}));

      });
    }
    // WEAR

    if (typeof device !== "undefined" && $cordovaLocalNotification.hasPermission($scope)) {
      // Permanent notification
      $translate("you_are_on_route_message").then(function (you_are_on_route_message) {
        $cordovaLocalNotification.schedule({
          id: 1,
          text: you_are_on_route_message,
          sound: '',
          ongoing: true,
        });
      });
    }
    if (app.routeTimeout !== undefined && app.routeTimeout != null) {
      clearTimeout(app.routeTimeout);
    }
    $state.go('route');

    saveRecent();
    logOnServer();
  };
});
