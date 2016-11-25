angular.module('ionic.utils', [])

.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return $window.localStorage[key] ? JSON.parse($window.localStorage[key]) : null;
    },
    clear: function() {
      $window.localStorage.clear();
    }
  };
}])

.factory('$geolocation', ['$ionicPopup', '$translate', function($ionicPopup, $translate) {
  return {
    currentPosition: function(callback) {
      //console.log("getCurrentPosition() - " + Math.floor(Date.now() / 1000));
      // HTML5 geolocation
      var geol;
      if (typeof device !== "undefined" && device.platform == "Android") {
        geol = cordova.plugins.locationServices.geolocation;
      } else {
        geol = navigator.geolocation;
      }
      //navigator.geolocation.getCurrentPosition(
      //cordova.plugins.locationServices.geolocation.getCurrentPosition(
      geol.getCurrentPosition(
        function(position) {
          callback(position);
        },
        function(error) {
          var errorMessage = 'you_need_to_activate_your_gps_to_use_the_app_message';
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'geolocation_access_denied_message';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'could_not_determine_current_position_message';
              break;
            case 3: // TIMEOUT
              errorMessage = 'you_need_to_activate_your_gps_or_it_has_lost_signal_message';
              break;
          }

          $translate(errorMessage).then(function (translatedErrorMessage) {
            $ionicPopup.alert({
              title: 'Error',
              content: translatedErrorMessage
            }).then(function(res) {
              // ..
            });
          });

          console.error(error);
          callback(null);
        },
        {
          enableHighAccuracy: true,
          timeout : 180000
        }
      );
    },
    watchPosition: function(callback) {
      var geol;
      var params;
      if (typeof device !== 'undefined' && device.platform == "Android") {
        geol = cordova.plugins.locationServices.geolocation;
        params = {
          maximumAge: 3500,
          timeout: 15000,
          enableHighAccuracy: true,
          priority: cordova.plugins.locationServices.geolocation.priorities.PRIORITY_HIGH_ACCURACY,
          interval: 8000,
          fastInterval: 7000
        };
      } else {
        geol = navigator.geolocation;
        params = {
          maximumAge: 3500,
          timeout: 15000,
          enableHighAccuracy: true
        };
      }
      var watchId = geol.watchPosition(
        function(position) {
          callback(position);
        },
        function (error) {
          console.error(error);
          callback(null);
        },params
      );
      return watchId;
    },
    clearWatch: function(watchId) {
      if (typeof device !== 'undefined' && device.platform == "Android") {
        geol = cordova.plugins.locationServices.geolocation;
      } else {
        geol = navigator.geolocation;
      }
      geol.clearWatch(watchId);
    }
  };
}]);