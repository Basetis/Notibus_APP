angular.module('transportMe.controllers')

.controller('PromoCtrl', function($scope, $state, $ionicPlatform, $ionicPopup, $translate, $ionicModal) {

	$scope.contactPromo = function(){
    $translate(["contact_promo"]).then(function (translations) {
      cordova.plugins.email.isAvailable(
      function (isAvailable) {
          if (isAvailable) {
            cordova.plugins.email.open({
                to:      'notibus.suport+tourism@gmail.com',
                subject: translations.contact_promo
            });
          }
      });

    });
	};

});

