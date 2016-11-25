angular.module('transportMe.services', [])

.factory("soapTMB", ['$soap', function($soap) {
  var base_url = "https://dades.tmb.cat/secure/ws-bus/LiniesBusService";
  var base_url_ibus = "https://dades.tmb.cat/secure/ws-ibus/IBusService";
  var cachedNearbyStops = [];
  var cachedNearbyStopsMarkers = [];
  var cachedDataForDestinationScreen = {};

  $soap.setCredentials("USER_NAME", "PASSWORD"); // TODO: hide!!!

  return {
    GetLines: function() {
      return $soap.post(base_url, "getLines");
    },

    GetNearBusLinesWGS84: function(lat, lng) {
      var params = {
        'wgsx': lng,
        'wgsy': lat,
        'radius': 300 // By default look for bus lines in a radius of X meters
      };

      return $soap.post(base_url, "getNearBusLinesWGS84", params);
    },

    GetDirectionShapeAndStops: function(linecode, direction) {
      var params = {
        'linecode': linecode,
        'direction': direction,
      };

      return $soap.post(base_url, "getDirectionShapeAndStops", params);
    },

    GetArrivalTimesByStopCode: function(stopCode) {
      var params = {
        'stopCode': stopCode,
        'nextTimePredictionsNumber': 2,
        'language': 'CA_ES',
        'logdata' : {
          'channel': 'TRANSPORTME',
        }
      };
      return $soap.post(base_url_ibus, "getArrivalTimesByStopCode", params);
    },

    SetCachedNearbyStopsMarkers: function(nearbyStopsMarkers) {
      cachedNearbyStopsMarkers = nearbyStopsMarkers;
    },

    GetCachedNearbyStopsMarkers: function() {
      return cachedNearbyStopsMarkers;
    },

    SetCachedNearbyStops: function(nearbyStops) {
      cachedNearbyStops = nearbyStops;
    },

    GetCachedNearbyStops: function() {
      return cachedNearbyStops;
    },

    ClearCachedNearbyStops: function() {
      cachedNearbyStops = [];
      cachedNearbyStopsMarkers = [];
    },

    SetCachedDataForDestinationScreen: function(destinationStops, currentStopIndex, lineRouteStopsCoords, lineRouteCoords, lineRouteCoordsGroupedByStop, currentStopIndexRoute) {
      cachedDataForDestinationScreen =
        {
          destinationStops: destinationStops,
          currentStopIndex: currentStopIndex,
          lineRouteStopsCoords: lineRouteStopsCoords,
          lineRouteCoords: lineRouteCoords,
          lineRouteCoordsGroupedByStop: lineRouteCoordsGroupedByStop,
          currentStopIndexRoute: currentStopIndexRoute
        };
    },

    GetCachedDataForDestinationScreen: function() {
      return cachedDataForDestinationScreen;
    },

    ClearCachedDataForDestinationScreen: function() {
      cachedDataForDestinationScreen = {};
    }


  };
}]);